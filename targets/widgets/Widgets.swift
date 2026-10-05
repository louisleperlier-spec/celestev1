import HealthKit
import SwiftUI
import WidgetKit

// MARK: Données (contrat de `widget()` dans src/store/liaisonMontre.ts) + Apple Santé (pas, FC)

struct SeanceW: Codable {
  let titre: String
  let quand: String
  let min: Int
  let exos: Int
  var jour: Int? = nil
}

struct DonneesW: Codable {
  let prenom: String
  var coach: String? = nil
  let effort: Double
  let recup: Double
  let sommeil: Double
  let score: Double
  let seance: SeanceW?
  let maj: String

  static let exemple = DonneesW(
    prenom: "Louis", coach: "axel", effort: 60, recup: 94, sommeil: 7.4, score: 81,
    seance: SeanceW(titre: "Bas du corps", quand: "Aujourd'hui", min: 45, exos: 6), maj: ""
  )

  static func lire() -> DonneesW? {
    guard let s = UserDefaults(suiteName: W.groupe)?.string(forKey: "widget"),
          let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(DonneesW.self, from: d)
  }

  /// Score NÉA du jour : moyenne de l'effort, de la récupération et du sommeil connus (comme la montre).
  var scoreNea: Int {
    var parts = [min(1, effort / 100)]
    if recup > 0 { parts.append(min(1, recup / 100)) }
    if sommeil > 0 { parts.append(min(1, sommeil / 8)) }
    return Int((parts.reduce(0, +) / Double(parts.count) * 100).rounded())
  }

  var image: String { "\(coach ?? "axel")_corps" }
}

/// Pas du jour et dernière FC lus dans Apple Santé ; gardés dans le groupe d'apps pour quand l'iPhone est verrouillé.
struct SanteW {
  var pas: Int?
  var fc: Int?
  var fcDate: Date?

  static let exemple = SanteW(pas: 6842, fc: 68, fcDate: Date().addingTimeInterval(-300))

  static func lire(_ fin: @escaping (SanteW) -> Void) {
    let ud = UserDefaults(suiteName: W.groupe)
    var r = SanteW()
    // Valeurs gardées : les pas seulement s'ils sont du jour.
    if let j = ud?.object(forKey: "w.pasJour") as? Date, Calendar.current.isDateInToday(j) { r.pas = ud?.object(forKey: "w.pas") as? Int }
    r.fc = ud?.object(forKey: "w.fc") as? Int
    r.fcDate = ud?.object(forKey: "w.fcDate") as? Date
    guard HKHealthStore.isHealthDataAvailable() else { return fin(r) }
    let sante = HKHealthStore()
    let groupe = DispatchGroup()
    groupe.enter()
    let debut = Calendar.current.startOfDay(for: Date())
    sante.execute(HKStatisticsQuery(
      quantityType: HKQuantityType(.stepCount),
      quantitySamplePredicate: HKQuery.predicateForSamples(withStart: debut, end: Date()),
      options: .cumulativeSum
    ) { _, s, _ in
      if let n = s?.sumQuantity()?.doubleValue(for: .count()) {
        r.pas = Int(n)
        ud?.set(Int(n), forKey: "w.pas")
        ud?.set(Date(), forKey: "w.pasJour")
      }
      groupe.leave()
    })
    groupe.enter()
    sante.execute(HKSampleQuery(
      sampleType: HKQuantityType(.heartRate),
      predicate: HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-7 * 86400), end: Date()),
      limit: 1,
      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
    ) { _, s, _ in
      if let e = s?.first as? HKQuantitySample {
        r.fc = Int(e.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())).rounded())
        r.fcDate = e.endDate
        ud?.set(r.fc, forKey: "w.fc")
        ud?.set(e.endDate, forKey: "w.fcDate")
      }
      groupe.leave()
    })
    groupe.notify(queue: .main) { fin(r) }
  }
}

struct Entree: TimelineEntry {
  let date: Date
  let d: DonneesW?
  let s: SanteW
}

struct Fournisseur: TimelineProvider {
  func placeholder(in context: Context) -> Entree {
    Entree(date: Date(), d: .exemple, s: .exemple)
  }

  func getSnapshot(in context: Context, completion: @escaping (Entree) -> Void) {
    if context.isPreview { return completion(Entree(date: Date(), d: DonneesW.lire() ?? .exemple, s: .exemple)) }
    SanteW.lire { s in completion(Entree(date: Date(), d: DonneesW.lire() ?? .exemple, s: s)) }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entree>) -> Void) {
    // L'app rafraîchit les widgets à chaque changement ; pas et FC relus toutes les 15 min.
    SanteW.lire { s in
      completion(Timeline(entries: [Entree(date: Date(), d: DonneesW.lire(), s: s)], policy: .after(Date().addingTimeInterval(15 * 60))))
    }
  }
}

// MARK: Style (maquette : fond noir, lueur rose, gros chiffres blancs)

enum W {
  static let groupe = "group.com.neacoach.app"
  static let rose = Color(red: 1.0, green: 0.42, blue: 0.10)
  static let texte2 = Color.white.opacity(0.62)
  static let accueil = URL(string: "nea://accueil")!
  static let recup = URL(string: "nea://recuperation")!

  static func seance(_ s: SeanceW?) -> URL {
    if let j = s?.jour { return URL(string: "nea://seance/\(j)")! }
    return accueil
  }

  static func pas(_ n: Int?) -> String {
    guard let n = n else { return "–" }
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.locale = Locale(identifier: "fr_CA")
    return f.string(from: NSNumber(value: n)) ?? "\(n)"
  }

  /// « il y a 5 min », « il y a 2 h », « hier »…
  static func ilYa(_ d: Date?) -> String {
    guard let d = d else { return "Pas encore de mesure" }
    let m = max(0, Int(Date().timeIntervalSince(d) / 60))
    if m < 1 { return "à l'instant" }
    if m < 60 { return "il y a \(m) min" }
    if m < 24 * 60 { return "il y a \(m / 60) h" }
    return "il y a \(m / 1440) j"
  }
}

/// Fond : noir, lueur rose en haut à gauche et en bas à droite.
struct FondNea: View {
  var body: some View {
    ZStack {
      Color(red: 0.04, green: 0.04, blue: 0.055)
      RadialGradient(colors: [W.rose.opacity(0.22), .clear], center: .bottomTrailing, startRadius: 0, endRadius: 220)
      RadialGradient(colors: [W.rose.opacity(0.10), .clear], center: .topLeading, startRadius: 0, endRadius: 160)
    }
  }
}

/// « N » rose lumineux (logo).
struct LogoN: View {
  var taille: CGFloat = 22
  var body: some View {
    Text("N")
      .font(.system(size: taille, weight: .black, design: .rounded))
      .foregroundColor(W.rose)
      .shadow(color: W.rose.opacity(0.8), radius: 5)
  }
}

struct Marque: View {
  var body: some View {
    HStack(spacing: 8) {
      LogoN()
      Text("NÉA").font(.system(size: 17, weight: .heavy)).foregroundColor(.white)
    }
  }
}

/// Gros chiffre blanc à lueur rose.
struct Chiffre: View {
  let texte: String
  var taille: CGFloat = 40

  var body: some View {
    Text(texte)
      .font(.system(size: taille, weight: .heavy, design: .rounded))
      .foregroundColor(.white)
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.5)
      .shadow(color: W.rose.opacity(0.75), radius: 8)
  }
}

/// Mascotte du coach choisi (corps entier), avec un halo rose au sol.
struct Mascotte: View {
  let nom: String

  var body: some View {
    ZStack(alignment: .bottom) {
      Ellipse().fill(W.rose.opacity(0.45)).frame(height: 14).blur(radius: 8).padding(.horizontal, 6)
      Image(nom).resizable().scaledToFit()
    }
  }
}

/// Bouton rond ▶︎ bordé de rose.
struct Lecture: View {
  var taille: CGFloat = 34
  var body: some View {
    ZStack {
      Circle().stroke(W.rose, lineWidth: 2.5)
      Image(systemName: "play.fill").font(.system(size: taille * 0.38, weight: .bold)).foregroundColor(W.rose).offset(x: 1)
    }
    .frame(width: taille, height: taille)
    .shadow(color: W.rose.opacity(0.6), radius: 5)
  }
}

extension View {
  func fondNea() -> some View { containerBackground(for: .widget) { FondNea() } }
}

// MARK: Pas (petit)

struct PasVue: View {
  let e: Entree
  var body: some View {
    let n = e.s.pas ?? 0
    VStack(spacing: 4) {
      HStack {
        LogoN()
        Spacer()
      }
      Image(systemName: "shoeprints.fill").font(.system(size: 18)).foregroundColor(W.rose)
      Chiffre(texte: W.pas(e.s.pas), taille: 36)
      Text("pas aujourd'hui").font(.system(size: 13)).foregroundColor(W.texte2)
      GeometryReader { g in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.14))
          Capsule().fill(W.rose).frame(width: g.size.width * CGFloat(min(1, Double(n) / 10000))).shadow(color: W.rose, radius: 4)
        }
      }
      .frame(height: 6)
      .padding(.top, 2)
    }
  }
}

struct PasWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaPas", provider: Fournisseur()) { e in
      PasVue(e: e).fondNea().widgetURL(W.accueil)
    }
    .configurationDisplayName("Pas")
    .description("Tes pas du jour (objectif 10 000).")
    .supportedFamilies([.systemSmall])
  }
}

// MARK: Score NÉA (petit + rond écran verrouillé)

struct ScoreVue: View {
  @Environment(\.widgetFamily) var famille
  let e: Entree

  var body: some View {
    let s = e.d?.scoreNea ?? 0
    switch famille {
    case .accessoryCircular:
      Gauge(value: Double(s), in: 0...100) {
        Text("NÉA")
      } currentValueLabel: {
        Text("\(s)")
      }
      .gaugeStyle(.accessoryCircularCapacity)
    default:
      VStack(spacing: 2) {
        Text("Score NÉA").font(.system(size: 15, weight: .medium)).foregroundColor(W.texte2)
        Spacer(minLength: 0)
        Chiffre(texte: e.d == nil ? "–" : "\(s)", taille: 58)
        Text("/ 100").font(.system(size: 18, weight: .medium)).foregroundColor(W.texte2)
        Spacer(minLength: 0)
        Text("Aujourd'hui").font(.system(size: 12)).foregroundColor(W.texte2)
      }
    }
  }
}

struct ScoreWidget: Widget {
  var body: some WidgetConfiguration {
    // Même identifiant que l'ancien « Bilan du jour » : les widgets déjà posés passent au nouveau style.
    StaticConfiguration(kind: "NeaBilan", provider: Fournisseur()) { e in
      ScoreVue(e: e).fondNea().widgetURL(W.accueil)
    }
    .configurationDisplayName("Score NÉA")
    .description("Ton score du jour : effort, récupération et sommeil.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: Prochaine séance (moyen + rectangulaire écran verrouillé)

struct SeanceVue: View {
  @Environment(\.widgetFamily) var famille
  let e: Entree

  var body: some View {
    let s = e.d?.seance
    switch famille {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        Text("NÉA • \(s?.quand ?? "Repos")").font(.system(size: 12, weight: .semibold))
        Text(s?.titre ?? "Pas de séance prévue").font(.system(size: 14, weight: .bold)).lineLimit(1)
        if let s = s { Text("\(s.min) min • \(s.exos) exercices").font(.system(size: 12)) }
      }
    default:
      HStack(spacing: 0) {
        VStack(alignment: .leading, spacing: 3) {
          Marque()
          Spacer(minLength: 2)
          Text("Ta prochaine séance").font(.system(size: 14)).foregroundColor(W.texte2)
          Text(s?.titre ?? "Pas de séance prévue").font(.system(size: 21, weight: .bold)).foregroundColor(.white).lineLimit(1).minimumScaleFactor(0.7)
          if let s = s {
            Text("\(s.min) min  ·  \(s.exos) exercices").font(.system(size: 14)).foregroundColor(W.texte2)
          }
          Spacer(minLength: 2)
          HStack(spacing: 10) {
            Lecture(taille: 30)
            Text("Ouvrir la séance").font(.system(size: 14, weight: .medium)).foregroundColor(.white)
          }
        }
        Spacer(minLength: 4)
        Mascotte(nom: e.d?.image ?? "axel_corps").frame(width: 92)
      }
    }
  }
}

struct SeanceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaSeance", provider: Fournisseur()) { e in
      SeanceVue(e: e).fondNea().widgetURL(W.seance(e.d?.seance))
    }
    .configurationDisplayName("Prochaine séance")
    .description("Ta prochaine séance avec ton coach.")
    .supportedFamilies([.systemMedium, .accessoryRectangular])
  }
}

// MARK: Fréquence cardiaque (moyen)

struct FCVue: View {
  let e: Entree
  var body: some View {
    HStack(spacing: 0) {
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 8) {
          Image(systemName: "heart").font(.system(size: 17, weight: .semibold)).foregroundColor(W.rose)
          Text("Fréquence cardiaque").font(.system(size: 15, weight: .medium)).foregroundColor(.white.opacity(0.85))
        }
        Spacer(minLength: 0)
        HStack(alignment: .firstTextBaseline, spacing: 10) {
          Chiffre(texte: e.s.fc.map { "\($0)" } ?? "–", taille: 54)
          Text("bpm").font(.system(size: 22, weight: .medium)).foregroundColor(W.texte2)
        }
        Spacer(minLength: 0)
        Text("Dernière mesure  ·  \(W.ilYa(e.s.fcDate))").font(.system(size: 13)).foregroundColor(W.texte2)
      }
      Spacer(minLength: 4)
      Mascotte(nom: e.d?.image ?? "axel_corps").frame(width: 80)
    }
  }
}

struct FCWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaFC", provider: Fournisseur()) { e in
      FCVue(e: e).fondNea().widgetURL(W.recup)
    }
    .configurationDisplayName("Fréquence cardiaque")
    .description("Ta dernière FC mesurée par ton Apple Watch.")
    .supportedFamilies([.systemMedium])
  }
}

// MARK: Aperçu du jour (grand)

struct ApercuVue: View {
  let e: Entree
  var body: some View {
    let s = e.d?.seance
    VStack(alignment: .leading, spacing: 8) {
      Marque()
      Text("Ton aperçu du jour").font(.system(size: 16)).foregroundColor(W.texte2)
      HStack(alignment: .top, spacing: 16) {
        VStack(alignment: .leading, spacing: 0) {
          Chiffre(texte: W.pas(e.s.pas), taille: 42)
          Text("pas").font(.system(size: 16)).foregroundColor(W.texte2)
        }
        Rectangle().fill(Color.white.opacity(0.2)).frame(width: 1, height: 70)
        VStack(alignment: .leading, spacing: 0) {
          Chiffre(texte: e.d == nil ? "–" : "\(e.d!.scoreNea)", taille: 42)
          Text("/ 100").font(.system(size: 16)).foregroundColor(W.texte2)
          Text("score").font(.system(size: 13)).foregroundColor(W.texte2)
        }
      }
      .padding(.top, 4)
      ZStack(alignment: .bottomTrailing) {
        VStack(alignment: .leading, spacing: 0) {
          Rectangle().fill(Color.white.opacity(0.15)).frame(height: 1).padding(.trailing, 110)
          HStack(spacing: 8) {
            Image(systemName: "heart").font(.system(size: 17, weight: .semibold)).foregroundColor(W.rose)
            Text(e.s.fc.map { "\($0) bpm" } ?? "– bpm").font(.system(size: 16, weight: .semibold)).foregroundColor(.white)
            Text("·  \(W.ilYa(e.s.fcDate))").font(.system(size: 14)).foregroundColor(W.texte2)
          }
          .padding(.vertical, 10)
          Rectangle().fill(Color.white.opacity(0.15)).frame(height: 1).padding(.trailing, 110)
          HStack(spacing: 12) {
            Lecture(taille: 38)
            VStack(alignment: .leading, spacing: 1) {
              Text(s.map { "\($0.titre) · \($0.min) min" } ?? "Pas de séance prévue")
                .font(.system(size: 15, weight: .semibold)).foregroundColor(.white).lineLimit(1).minimumScaleFactor(0.7)
              if let s = s { Text("\(s.exos) exercices").font(.system(size: 13)).foregroundColor(W.texte2) }
            }
          }
          .padding(.top, 10)
          .padding(.trailing, 100)
        }
        Mascotte(nom: e.d?.image ?? "axel_corps").frame(width: 100, height: 150).offset(x: 4, y: 6)
      }
    }
  }
}

struct ApercuWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaApercu", provider: Fournisseur()) { e in
      ApercuVue(e: e).fondNea().widgetURL(W.seance(e.d?.seance))
    }
    .configurationDisplayName("Aperçu du jour")
    .description("Pas, score, fréquence cardiaque et prochaine séance.")
    .supportedFamilies([.systemLarge])
  }
}

// MARK: Horloge (moyen)

struct HorlogeVue: View {
  let e: Entree
  private var jour: String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "fr_CA")
    f.dateFormat = "EEEE d MMMM"
    let t = f.string(from: Date())
    return t.prefix(1).uppercased() + String(t.dropFirst())
  }

  var body: some View {
    HStack(spacing: 0) {
      VStack(alignment: .leading, spacing: 2) {
        LogoN()
        Spacer(minLength: 0)
        Text(Date(), style: .time)
          .font(.system(size: 58, weight: .heavy, design: .rounded))
          .foregroundColor(.white)
          .monospacedDigit()
          .lineLimit(1)
          .minimumScaleFactor(0.6)
          .shadow(color: W.rose.opacity(0.75), radius: 8)
        Text(jour).font(.system(size: 15)).foregroundColor(W.texte2)
      }
      Spacer(minLength: 4)
      Mascotte(nom: e.d?.image ?? "axel_corps").frame(width: 84)
    }
  }
}

struct HorlogeWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaHorloge", provider: Fournisseur()) { e in
      HorlogeVue(e: e).fondNea().widgetURL(W.accueil)
    }
    .configurationDisplayName("Horloge")
    .description("L'heure avec ton coach.")
    .supportedFamilies([.systemMedium])
  }
}

@main
struct NeaWidgets: WidgetBundle {
  var body: some Widget {
    SeanceWidget()
    ScoreWidget()
    PasWidget()
    FCWidget()
    ApercuWidget()
    HorlogeWidget()
    SportActiviteWidget()
  }
}
