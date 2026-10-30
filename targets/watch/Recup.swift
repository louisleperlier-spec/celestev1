import HealthKit
import SwiftUI

/// Ton état (maquette 9) : récupération /100 en anneau, VFC et FC au repos de la nuit, « Ajouter mon ressenti » ; Respirer et Mesurer dessous.
struct RecupView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var ressenti = false
  @State private var envoye: String?

  private var valeur: Int? {
    if let r = donnees.etat?.bilan?.recup, r > 0 { return Int(min(100, r).rounded()) }
    return donnees.etat?.score
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        ZStack {
          Anneau(part: Double(valeur ?? 0) / 100, trait: 9).shadow(color: Nea.rose.opacity(0.6), radius: 6)
          VStack(spacing: -4) {
            Text(valeur.map { "\($0)" } ?? "—").font(.system(size: 34, weight: .heavy, design: .rounded))
            Text("/100").font(.system(size: 13)).foregroundColor(Nea.texte2)
          }
        }
        .frame(width: 98, height: 98)
        Text("Récupération").font(.system(size: 15, weight: .semibold))
        HStack(spacing: 6) {
          CaseEtat(icone: "waveform.path.ecg", titre: "VFC", valeur: (donnees.etat?.nuit?.hrv ?? 0) > 0 ? "\(Int(donnees.etat!.nuit!.hrv)) ms" : "—")
          CaseEtat(icone: "heart", titre: "Repos", valeur: (donnees.etat?.nuit?.rhr ?? 0) > 0 ? "\(Int(donnees.etat!.nuit!.rhr)) bpm" : "—")
        }
        if let e = envoye {
          Label(e, systemImage: "checkmark.circle.fill").font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.rose)
        } else {
          Button { ressenti = true } label: { LigneMenu(icone: "face.smiling", titre: "Ajouter mon ressenti") }.buttonStyle(.plain)
        }
        NavigationLink { RespirationView() } label: { Label("Respirer · 2 min", systemImage: "wind") }.buttonStyle(BoutonSombre())
        NavigationLink { MesureView() } label: { Label("Mesurer · 1 min", systemImage: "waveform.path.ecg") }.buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("Ton état")
    .sheet(isPresented: $ressenti) {
      ScrollView {
        VStack(spacing: 6) {
          Text("Comment tu te sens ?").font(.system(size: 16, weight: .bold))
          ForEach(RESSENTIS, id: \.0) { r in
            Button {
              LiaisonMontre.partagee.envoyer("coach", CoachEnvoi(texte: r.2))
              Vibre.jouer(.success)
              envoye = r.0
              ressenti = false
            } label: { Label(r.0, systemImage: r.1) }
            .buttonStyle(BoutonSombre())
          }
        }
      }
    }
  }
}

/// Ressentis envoyés au coach (Ton état, Coach) : libellé, icône, message.
let RESSENTIS: [(String, String, String)] = [
  ("En forme", "face.smiling", "Je me sens en forme aujourd'hui"),
  ("Fatigué", "moon.zzz.fill", "Je suis fatigué"),
  ("Stressé", "bolt.heart", "Je suis stressé"),
  ("Courbatures", "bandage.fill", "J'ai des courbatures"),
]

/// Case de Ton état : icône orange, petit titre, valeur.
struct CaseEtat: View {
  let icone: String
  let titre: String
  let valeur: String

  var body: some View {
    HStack(spacing: 6) {
      Image(systemName: icone).font(.system(size: 16)).foregroundColor(.white)
      VStack(alignment: .leading, spacing: 0) {
        Text(titre).font(.system(size: 11)).foregroundColor(Nea.texte2)
        Text(valeur).font(.system(size: 15, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
      }
      Spacer(minLength: 0)
    }
    .padding(8)
    .frame(maxWidth: .infinity)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}

/// Ligne de mesure : icône rose, titre, grande valeur.
struct Mesure: View {
  let icone: String
  let titre: String
  let valeur: String
  let unite: String

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: icone).font(.system(size: 18)).foregroundColor(Nea.rose).frame(width: 22)
      Text(titre).font(.system(size: 14)).lineLimit(1).minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      Text(valeur).font(.system(size: 20, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
      if !unite.isEmpty { Text(unite).font(.system(size: 13)).foregroundColor(Nea.texte2) }
    }
    .padding(.vertical, 8)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}

/// 11 · Respiration guidée : 4 s d'inspiration, 6 s d'expiration, 2 minutes ; enregistrée en pleine conscience.
struct RespirationView: View {
  @State private var reste = 120
  @State private var t = 0
  @State private var enPause = false
  @State private var fini = false
  @State private var debut = Date()
  @State private var minuterie: Timer?
  @Environment(\.dismiss) private var fermer

  private var inspire: Bool { t % 10 < 4 }
  private var secondes: Int { inspire ? 4 - t % 10 : 10 - t % 10 }

  var body: some View {
    VStack(spacing: 6) {
      ZStack {
        Circle().fill(Nea.rose.opacity(0.12)).blur(radius: 12)
        Circle()
          .stroke(Nea.rose, lineWidth: 5)
          .shadow(color: Nea.rose, radius: 8)
          .scaleEffect(fini ? 0.9 : inspire ? 1.0 : 0.74)
          .animation(.easeInOut(duration: inspire ? 4 : 6), value: inspire)
        VStack(spacing: 0) {
          Text(fini ? "Terminé" : inspire ? "Inspire" : "Expire").font(.system(size: 24, weight: .bold))
          if !fini { Text("\(secondes) secondes").font(.system(size: 13)).foregroundColor(Nea.texte2) }
        }
      }
      .frame(width: 120, height: 120)
      HStack(spacing: 4) {
        Text(Nea.mmss(reste)).font(.system(size: 18, weight: .heavy, design: .rounded)).monospacedDigit()
        Text("restantes").font(.system(size: 14)).foregroundColor(Nea.texte2)
      }
      if fini {
        Button("Fermer") { fermer() }.buttonStyle(BoutonRose())
      } else {
        Button {
          enPause.toggle()
        } label: {
          Label(enPause ? "Reprendre" : "Pause", systemImage: enPause ? "play.fill" : "pause.fill")
        }
        .buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("Respiration")
    .onAppear {
      debut = Date()
      Vibre.jouer(.directionUp)
      minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in avancer() }
    }
    .onDisappear {
      minuterie?.invalidate()
      minuterie = nil
    }
  }

  private func avancer() {
    guard !enPause, !fini else { return }
    t += 1
    reste -= 1
    if reste <= 0 {
      fini = true
      minuterie?.invalidate()
      Vibre.jouer(.success)
      Entrainement.pleineConscience(debut: debut, fin: Date())
      return
    }
    if t % 10 == 0 { Vibre.jouer(.directionUp) }
    if t % 10 == 4 { Vibre.jouer(.directionDown) }
  }
}

/// Mesure de récupération d'1 minute au calme : FC du capteur, puis dernière VFC de la montre ; envoyée à l'iPhone.
struct MesureView: View {
  @StateObject private var entrainement = Entrainement(activite: .mindAndBody, lieu: .indoor)
  @State private var reste = 60
  @State private var minuterie: Timer?
  @State private var resultat: (bpm: Double, hrv: Double?)?
  @Environment(\.dismiss) private var fermer

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Text("Mesure au calme").font(.system(size: 18, weight: .bold)).frame(maxWidth: .infinity, alignment: .leading)
        if let r = resultat {
          Mesure(icone: "heart.fill", titre: "FC moyenne", valeur: "\(Int(r.bpm))", unite: "bpm")
          if let h = r.hrv {
            Mesure(icone: "waveform.path.ecg", titre: "VFC", valeur: "\(Int(h))", unite: "ms")
            Text("Envoyée à NÉA sur l'iPhone").font(.system(size: 13)).foregroundColor(Nea.texte2)
          } else {
            Text("Pas de VFC récente dans Santé : ta montre la mesure pendant le sommeil ou avec Pleine conscience.")
              .font(.system(size: 12))
              .foregroundColor(Nea.texte2)
          }
          Button("Fermer") { fermer() }.buttonStyle(BoutonRose())
        } else {
          Text("Reste immobile, respire calmement.").font(.system(size: 13)).foregroundColor(Nea.texte2)
          ZStack {
            Anneau(part: Double(60 - reste) / 60, trait: 7)
            VStack(spacing: 0) {
              Text(Nea.mmss(reste)).font(.system(size: 26, weight: .heavy, design: .rounded)).monospacedDigit()
              Text(entrainement.bpm > 0 ? "\(Int(entrainement.bpm)) bpm" : "-- bpm").font(.system(size: 13)).foregroundColor(Nea.texte2)
            }
          }
          .frame(width: 112, height: 112)
        }
      }
    }
    .onAppear {
      entrainement.demarrer()
      minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in tick() }
    }
    .onDisappear {
      minuterie?.invalidate()
      minuterie = nil
      entrainement.terminer(sauver: false) {}
    }
  }

  private func tick() {
    guard resultat == nil else { return }
    reste -= 1
    guard reste <= 0 else { return }
    minuterie?.invalidate()
    let bpm = entrainement.fcMoy > 0 ? entrainement.fcMoy : entrainement.bpm
    entrainement.terminer(sauver: false) {}
    Vibre.jouer(.success)
    Entrainement.derniereVFC { v in
      resultat = (bpm, v)
      if let h = v, h > 0 {
        LiaisonMontre.partagee.envoyer("mesure", MesureMontre(d: DateISO.texte(Date()), hrv: h, bpm: bpm))
      }
    }
  }
}
