import HealthKit
import SwiftUI
import WatchKit

// MARK: Apple Santé : la dernière nuit lue par la montre

/// Dernière nuit : temps endormi, phases (profond, cœur, paradoxal), coucher, réveil, VFC nocturne, FC au repos.
struct NuitSante {
  var dormi: TimeInterval
  var profond: TimeInterval
  var coeur: TimeInterval
  var paradoxal: TimeInterval
  var coucher: Date
  var reveil: Date
  var hrv: Double?
  var rhr: Double?
}

enum SommeilSante {
  /// Nuit des 20 dernières heures (null si la montre n'a rien enregistré).
  static func derniereNuit(_ fin: @escaping (NuitSante?) -> Void) {
    Entrainement.autoriser()
    let sante = Entrainement.sante
    let debut = Date().addingTimeInterval(-20 * 3600)
    let filtre = HKQuery.predicateForSamples(withStart: debut, end: Date(), options: [])
    let tri = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
    let q = HKSampleQuery(sampleType: HKCategoryType(.sleepAnalysis), predicate: filtre, limit: HKObjectQueryNoLimit, sortDescriptors: tri) { _, s, _ in
      let tous = (s as? [HKCategorySample]) ?? []
      // Les mesures de la montre si elle en a, sinon toutes (iPhone, autres apps).
      let montre = tous.filter { $0.sourceRevision.productType?.hasPrefix("Watch") == true }
      let ech = montre.isEmpty ? tous : montre
      let endormi: Set<Int> = [
        HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, HKCategoryValueSleepAnalysis.asleepCore.rawValue,
        HKCategoryValueSleepAnalysis.asleepDeep.rawValue, HKCategoryValueSleepAnalysis.asleepREM.rawValue,
      ]
      let sommeil = ech.filter { endormi.contains($0.value) }
      guard let premier = sommeil.first, let dernier = sommeil.last else {
        DispatchQueue.main.async { fin(nil) }
        return
      }
      func duree(_ v: HKCategoryValueSleepAnalysis) -> TimeInterval {
        sommeil.filter { $0.value == v.rawValue }.reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
      }
      var n = NuitSante(
        dormi: sommeil.reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) },
        profond: duree(.asleepDeep), coeur: duree(.asleepCore), paradoxal: duree(.asleepREM),
        coucher: premier.startDate, reveil: dernier.endDate, hrv: nil, rhr: nil
      )
      let groupe = DispatchGroup()
      groupe.enter()
      let pendant = HKQuery.predicateForSamples(withStart: n.coucher, end: n.reveil, options: [])
      let vfc = HKStatisticsQuery(quantityType: HKQuantityType(.heartRateVariabilitySDNN), quantitySamplePredicate: pendant, options: .discreteAverage) { _, st, _ in
        n.hrv = st?.averageQuantity()?.doubleValue(for: .secondUnit(with: .milli))
        groupe.leave()
      }
      groupe.enter()
      let jour = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-24 * 3600), end: Date(), options: [])
      let repos = HKSampleQuery(sampleType: HKQuantityType(.restingHeartRate), predicate: jour, limit: 1,
                                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, r, _ in
        n.rhr = (r?.first as? HKQuantitySample)?.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        groupe.leave()
      }
      sante.execute(vfc)
      sante.execute(repos)
      groupe.notify(queue: .main) { fin(n) }
    }
    sante.execute(q)
  }
}

private func hhmm(_ d: Date) -> String {
  let c = Calendar.current.dateComponents([.hour, .minute], from: d)
  return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
}

private func minutes(_ s: String) -> Int {
  let p = s.split(separator: ":").compactMap { Int($0) }
  return p.count == 2 ? p[0] * 60 + p[1] : 0
}

// MARK: Sommeil (maquette 1) : Axel qui dort, coucher dans…, Réveil, Préparer ma nuit, Cette nuit

struct SommeilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var voirNuit = false

  private var s: SommeilMontre? { donnees.etat?.sommeil }

  /// « Dans 30 min », « Dans 1 h 20 », « C'est l'heure », ou « Ce soir ».
  private func dans(_ now: Date) -> String {
    guard let s = s else { return "Ce soir" }
    let c = Calendar.current.dateComponents([.hour, .minute], from: now)
    var ecart = minutes(s.coucher) - ((c.hour ?? 0) * 60 + (c.minute ?? 0))
    if ecart < -720 { ecart += 1440 }
    if ecart > 720 { ecart -= 1440 }
    if ecart <= 0 && ecart > -180 { return "C'est l'heure" }
    if ecart > 0 && ecart < 60 { return "Dans \(ecart) min" }
    if ecart >= 60 && ecart <= 240 { return "Dans \(ecart / 60) h \(String(format: "%02d", ecart % 60))" }
    return "Ce soir"
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Image("ax_dodo").resizable().scaledToFill().frame(height: 86).frame(maxWidth: .infinity).clipped()
          .clipShape(RoundedRectangle(cornerRadius: 16))
        TimelineView(.periodic(from: .now, by: 30)) { ctx in
          Text(dans(ctx.date)).font(.system(size: 24, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        }
        Text(s.map { "Coucher à \($0.coucher)" } ?? "Ouvre NÉA sur l'iPhone").font(.system(size: 15)).foregroundColor(Nea.texte2)
        NavigationLink { ReglerReveilView() } label: {
          LigneMenu(icone: "alarm", titre: "Réveil", valeur: s.map { $0.actif ? $0.reveil : "Désactivé" } ?? "")
        }
        .buttonStyle(.plain)
        Button {
          LiaisonMontre.partagee.envoyerDirect("nuit", ActionEnvoi(action: "commencer"))
          Vibre.jouer(.start)
          voirNuit = true
        } label: {
          Text(s?.nuit == true ? "Reprendre ma nuit" : "Préparer ma nuit")
        }
        .buttonStyle(BoutonRose())
        NavigationLink { NuitResumeView() } label: { LigneMenu(icone: "bed.double.fill", titre: "Cette nuit") }.buttonStyle(.plain)
      }
    }
    .navigationTitle("Sommeil")
    .navigationDestination(isPresented: $voirNuit) { NuitMontreView() }
  }
}

// MARK: Réveil (maquette 2) : heures et minutes à la couronne, vibration, Enregistrer

private struct Colonne: View {
  @Binding var valeur: Double
  let nombre: Int
  let pas: Int
  let choisie: Bool

  private func v(_ k: Int) -> String {
    let i = ((Int(valeur.rounded()) + k) % nombre + nombre) % nombre
    return String(format: "%02d", i * pas)
  }

  var body: some View {
    VStack(spacing: 0) {
      Text(v(-1)).font(.system(size: 18, weight: .semibold, design: .rounded)).foregroundColor(Nea.texte2)
      Text(v(0)).font(.system(size: 32, weight: .heavy, design: .rounded)).monospacedDigit()
        .foregroundColor(choisie ? .white : Nea.texte2)
        .padding(.vertical, 2)
      Text(v(1)).font(.system(size: 18, weight: .semibold, design: .rounded)).foregroundColor(Nea.texte2)
    }
    .frame(maxWidth: .infinity)
  }
}

struct ReglerReveilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @Environment(\.dismiss) private var fermer
  @State private var heure: Double = 7
  @State private var minute: Double = 3
  @State private var surMinutes = false
  @State private var vibration = true
  @State private var pret = false

  private var h: Int { ((Int(heure.rounded()) % 24) + 24) % 24 }
  private var m: Int { (((Int(minute.rounded()) % 12) + 12) % 12) * 5 }

  var body: some View {
    ScrollView {
      VStack(spacing: 8) {
        HStack(spacing: 0) {
          Colonne(valeur: $heure, nombre: 24, pas: 1, choisie: !surMinutes)
            .onTapGesture { surMinutes = false }
          Text(":").font(.system(size: 28, weight: .heavy))
          Colonne(valeur: $minute, nombre: 12, pas: 5, choisie: surMinutes)
            .onTapGesture { surMinutes = true }
        }
        .padding(.vertical, 4)
        .background(
          RoundedRectangle(cornerRadius: 22).stroke(Nea.texte2.opacity(0.35), lineWidth: 1).frame(height: 46)
        )
        .focusable()
        .digitalCrownRotation(surMinutes ? $minute : $heure, from: -1000, through: 1000, by: 1, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
        Text(surMinutes ? "Tourne la couronne · minutes" : "Tourne la couronne").font(.system(size: 13)).foregroundColor(Nea.texte2)
        Toggle(isOn: $vibration) {
          Label("Vibration", systemImage: "iphone.radiowaves.left.and.right")
        }
        .tint(Nea.rose)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
        Button("Enregistrer") {
          LiaisonMontre.partagee.envoyerDirect("reveil", ReveilEnvoi(h: String(format: "%02d:%02d", h, m), vibration: vibration))
          Vibre.jouer(.success)
          fermer()
        }
        .buttonStyle(BoutonRose())
      }
    }
    .navigationTitle("Réveil")
    .onAppear {
      guard !pret else { return }
      pret = true
      if let s = donnees.etat?.sommeil {
        let t = minutes(s.reveil)
        heure = Double(t / 60)
        minute = Double((t % 60) / 5)
        vibration = s.vibration
      }
    }
  }
}

// MARK: Nuit (maquette 3) : Axel, l'heure, le réveil, la pluie de l'iPhone (volume à la couronne), Terminer

struct NuitMontreView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @Environment(\.dismiss) private var fermer
  @State private var pluie = true
  @State private var volume: Double = 0.6
  @State private var envoye: Double = 0.6

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Image("ax_dodo").resizable().scaledToFill().frame(height: 74).frame(maxWidth: .infinity).clipped()
          .clipShape(RoundedRectangle(cornerRadius: 14))
        TimelineView(.periodic(from: .now, by: 15)) { ctx in
          GrosChiffre(texte: hhmm(ctx.date), taille: 46)
        }
        if let s = donnees.etat?.sommeil, s.actif {
          Text("Réveil à \(s.reveil)").font(.system(size: 15)).foregroundColor(Nea.texte2)
        }
        HStack(spacing: 8) {
          Image(systemName: "cloud.rain.fill").font(.system(size: 20)).foregroundColor(.white)
          VStack(alignment: .leading, spacing: 5) {
            Text("Pluie douce").font(.system(size: 14, weight: .semibold))
            GeometryReader { g in
              ZStack(alignment: .leading) {
                Capsule().fill(Nea.texte2.opacity(0.3)).frame(height: 4)
                Capsule().fill(Nea.rose).frame(width: g.size.width * volume, height: 4)
                Circle().fill(.white).frame(width: 10, height: 10).offset(x: max(0, g.size.width * volume - 5))
              }
            }
            .frame(height: 10)
          }
          Button {
            pluie.toggle()
            LiaisonMontre.partagee.envoyerDirect("pluie", ActionEnvoi(action: pluie ? "jouer" : "pause"), fiable: false)
          } label: {
            Image(systemName: pluie ? "pause.fill" : "play.fill").font(.system(size: 15, weight: .bold))
              .frame(width: 34, height: 34).background(Circle().fill(Nea.carte))
          }
          .buttonStyle(.plain)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte.opacity(0.8)))
        .focusable()
        .digitalCrownRotation($volume, from: 0, through: 1, by: 0.05, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
        .onChange(of: volume) { _, v in
          guard abs(v - envoye) >= 0.05 else { return }
          envoye = v
          LiaisonMontre.partagee.envoyerDirect("pluie", ActionEnvoi(action: "volume", volume: v), fiable: false)
        }
        Button("Terminer") {
          LiaisonMontre.partagee.envoyerDirect("nuit", ActionEnvoi(action: "terminer"))
          Vibre.jouer(.stop)
          fermer()
        }
        .buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("Bonne nuit")
    .onAppear { pluie = donnees.etat?.sommeil?.pluie ?? true }
  }
}

// MARK: Cette nuit (maquette 4) : durée, phases, VFC, FC au repos, Mon ressenti

struct NuitResumeView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var nuit: NuitSante?
  @State private var charge = false
  @State private var ressenti = false
  @State private var note: Int?

  private var heures: Double {
    if let n = nuit { return n.dormi / 3600 }
    return donnees.etat?.nuit?.h ?? 0
  }
  private var hrv: Double? {
    if let v = nuit?.hrv { return v }
    if let v = donnees.etat?.nuit?.hrv, v > 0 { return v }
    return nil
  }
  private var rhr: Double? {
    if let v = nuit?.rhr { return v }
    if let v = donnees.etat?.nuit?.rhr, v > 0 { return v }
    return nil
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        if heures > 0 {
          let m = Int((heures * 60).rounded())
          GrosChiffre(texte: "\(m / 60) h \(String(format: "%02d", m % 60))", taille: 44)
          Text("de sommeil").font(.system(size: 15)).foregroundColor(Nea.texte2)
          Phases(n: nuit)
          HStack(spacing: 6) {
            Tuile(icone: "waveform.path.ecg", titre: "VFC", valeur: hrv.map { "\(Int($0.rounded()))" } ?? "—", unite: "ms")
            Tuile(icone: "heart", titre: "FC au repos", valeur: rhr.map { "\(Int($0.rounded()))" } ?? "—", unite: "bpm")
          }
          if let q = note {
            Label(["", "Épuisé", "Fatigué", "Moyen", "Reposé", "En pleine forme"][q], systemImage: "checkmark.circle.fill")
              .font(.system(size: 14, weight: .semibold)).foregroundColor(Nea.rose).padding(.top, 2)
          } else {
            Button("Mon ressenti") { ressenti = true }.buttonStyle(BoutonSombre(couleur: Nea.rose))
          }
        } else if charge {
          Text("Pas de nuit enregistrée. Porte ta montre la nuit, ou note ta nuit dans NÉA sur l'iPhone.")
            .font(.system(size: 14)).foregroundColor(Nea.texte2)
        } else {
          ProgressView()
        }
      }
    }
    .navigationTitle("Cette nuit")
    .onAppear {
      SommeilSante.derniereNuit { n in
        nuit = n
        charge = true
      }
    }
    .sheet(isPresented: $ressenti) {
      ScrollView {
        VStack(spacing: 6) {
          Text("Comment tu te sens ?").font(.system(size: 16, weight: .bold))
          ForEach([5, 4, 3, 2], id: \.self) { q in
            Button(["", "Épuisé", "Fatigué", "Moyen", "Reposé", "En pleine forme"][q]) {
              note = q
              ressenti = false
              Vibre.jouer(.success)
              LiaisonMontre.partagee.envoyerDirect("ressenti-nuit", RessentiEnvoi(
                q: q, coucher: nuit.map { hhmm($0.coucher) }, reveil: nuit.map { hhmm($0.reveil) }, hrv: hrv, rhr: rhr))
            }
            .buttonStyle(BoutonSombre())
          }
        }
      }
    }
  }
}

/// Barre des phases : profond, cœur, paradoxal (dégradé d'orange) ; barre pleine sans phases connues.
private struct Phases: View {
  let n: NuitSante?
  var body: some View {
    GeometryReader { g in
      let total = max(1, (n?.profond ?? 0) + (n?.coeur ?? 0) + (n?.paradoxal ?? 0))
      let parts: [(Double, Double)] = n.map { [($0.profond, 1), ($0.coeur, 0.75), ($0.paradoxal, 0.5)] } ?? []
      HStack(spacing: 2) {
        if parts.allSatisfy({ $0.0 == 0 }) {
          Capsule().fill(Nea.rose)
        } else {
          ForEach(0..<parts.count, id: \.self) { i in
            Rectangle().fill(Nea.rose.opacity(parts[i].1)).frame(width: max(0, (g.size.width - 4) * parts[i].0 / total))
          }
        }
      }
      .clipShape(Capsule())
    }
    .frame(height: 12)
    .padding(.vertical, 4)
  }
}

private struct Tuile: View {
  let icone: String
  let titre: String
  let valeur: String
  let unite: String
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(spacing: 4) {
        Image(systemName: icone).font(.system(size: 12)).foregroundColor(Nea.rose)
        Text(titre).font(.system(size: 11)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
      }
      HStack(alignment: .firstTextBaseline, spacing: 2) {
        Text(valeur).font(.system(size: 22, weight: .heavy, design: .rounded))
        Text(unite).font(.system(size: 11)).foregroundColor(Nea.texte2)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}
