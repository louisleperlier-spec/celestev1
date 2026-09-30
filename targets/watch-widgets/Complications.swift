import HealthKit
import SwiftUI
import WidgetKit

// MARK: Données (écrites par l'app de la montre, `Cadran.publier`)

struct DonneesC {
  var score: Int?
  var seance: String
  var min: Int
  var quand: String
  var coach: String
  var pas: Int?

  static let exemple = DonneesC(score: 82, seance: "Bas du corps", min: 45, quand: "Aujourd'hui", coach: "axel", pas: 6842)

  static func lire() -> DonneesC {
    let d = UserDefaults(suiteName: "group.com.neacoach.app")?.dictionary(forKey: "cadran") ?? [:]
    let s = (d["score"] as? Int) ?? -1
    return DonneesC(
      score: s >= 0 ? s : nil,
      seance: d["seance"] as? String ?? "",
      min: d["min"] as? Int ?? 0,
      quand: d["quand"] as? String ?? "",
      coach: d["coach"] as? String ?? "axel",
      pas: nil
    )
  }
}

/// Pas du jour dans Apple Santé (autorisés depuis l'app NÉA de la montre).
func pasDuJour(_ fin: @escaping (Int?) -> Void) {
  guard HKHealthStore.isHealthDataAvailable() else { return fin(nil) }
  let debut = Calendar.current.startOfDay(for: Date())
  let q = HKStatisticsQuery(
    quantityType: HKQuantityType(.stepCount),
    quantitySamplePredicate: HKQuery.predicateForSamples(withStart: debut, end: Date()),
    options: .cumulativeSum
  ) { _, r, _ in
    fin(r?.sumQuantity().map { Int($0.doubleValue(for: .count())) })
  }
  HKHealthStore().execute(q)
}

struct EntreeC: TimelineEntry {
  let date: Date
  let d: DonneesC
}

struct FournisseurC: TimelineProvider {
  func placeholder(in context: Context) -> EntreeC { EntreeC(date: Date(), d: .exemple) }

  func getSnapshot(in context: Context, completion: @escaping (EntreeC) -> Void) {
    completion(EntreeC(date: Date(), d: context.isPreview ? .exemple : DonneesC.lire()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<EntreeC>) -> Void) {
    var d = DonneesC.lire()
    pasDuJour { n in
      d.pas = n
      // Pas : relecture toutes les 15 min ; l'app rafraîchit aussi à chaque synchronisation.
      completion(Timeline(entries: [EntreeC(date: Date(), d: d)], policy: .after(Date().addingTimeInterval(15 * 60))))
    }
  }
}

enum C {
  static let rose = Color(red: 1.0, green: 0.31, blue: 0.64)
  static let seance = URL(string: "nea://seance")!
  static let accueil = URL(string: "nea://accueil")!

  static func pas(_ n: Int?) -> String {
    guard let n = n else { return "–" }
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.locale = Locale(identifier: "fr_CA")
    return f.string(from: NSNumber(value: n)) ?? "\(n)"
  }

  static func court(_ n: Int?) -> String {
    guard let n = n else { return "–" }
    return n >= 1000 ? String(format: "%.1fk", Double(n) / 1000).replacingOccurrences(of: ".", with: ",") : "\(n)"
  }
}

// MARK: Score santé

struct ScoreVue: View {
  @Environment(\.widgetFamily) var famille
  let e: EntreeC

  var body: some View {
    let s = e.d.score ?? 0
    switch famille {
    case .accessoryInline:
      Text("NÉA · score \(e.d.score.map { "\($0)" } ?? "–")")
    case .accessoryCorner:
      Text("\(s)")
        .font(.system(size: 20, weight: .bold, design: .rounded))
        .widgetCurvesContent()
        .widgetLabel {
          Gauge(value: Double(s), in: 0...100) { Text("Score") }
            .tint(C.rose)
        }
    default:
      Gauge(value: Double(s), in: 0...100) {
        Text("N").foregroundColor(C.rose)
      } currentValueLabel: {
        Text(e.d.score.map { "\($0)" } ?? "–").font(.system(size: 18, weight: .bold, design: .rounded))
      }
      .gaugeStyle(.accessoryCircular)
      .tint(C.rose)
    }
  }
}

struct ScoreWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaScore", provider: FournisseurC()) { e in
      ScoreVue(e: e).containerBackground(for: .widget) { Color.black }.widgetURL(C.accueil)
    }
    .configurationDisplayName("Score santé")
    .description("Ton score du jour : effort, récupération et sommeil.")
    .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
  }
}

// MARK: Pas

struct PasVue: View {
  @Environment(\.widgetFamily) var famille
  let e: EntreeC

  var body: some View {
    switch famille {
    case .accessoryInline:
      Text("\(C.pas(e.d.pas)) pas")
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 0) {
        Text("NÉA").font(.system(size: 13, weight: .heavy)).foregroundColor(C.rose)
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Image(systemName: "shoeprints.fill")
          Text(C.pas(e.d.pas)).font(.system(size: 22, weight: .bold, design: .rounded))
          Text("pas").font(.system(size: 14)).foregroundColor(.secondary)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    default:
      VStack(spacing: 0) {
        Image(systemName: "shoeprints.fill").font(.system(size: 12)).foregroundColor(C.rose)
        Text(C.court(e.d.pas)).font(.system(size: 15, weight: .bold, design: .rounded)).minimumScaleFactor(0.6)
        Text("pas").font(.system(size: 9)).foregroundColor(.secondary)
      }
    }
  }
}

struct PasWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaPas", provider: FournisseurC()) { e in
      PasVue(e: e).containerBackground(for: .widget) { Color.black }.widgetURL(C.accueil)
    }
    .configurationDisplayName("Pas")
    .description("Tes pas du jour.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

// MARK: Ma séance (lance la séance d'une touche)

struct SeanceVue: View {
  @Environment(\.widgetFamily) var famille
  let e: EntreeC

  var body: some View {
    switch famille {
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "play.circle.fill").font(.system(size: 28)).foregroundColor(C.rose)
        VStack(alignment: .leading, spacing: 0) {
          Text(e.d.quand.isEmpty ? "Ma séance" : e.d.quand).font(.system(size: 12)).foregroundColor(.secondary)
          Text(e.d.seance.isEmpty ? "Ouvre NÉA" : e.d.seance).font(.system(size: 15, weight: .bold)).lineLimit(1)
          if e.d.min > 0 { Text("\(e.d.min) min").font(.system(size: 12)).foregroundColor(.secondary) }
        }
        Spacer(minLength: 0)
      }
    default:
      ZStack {
        Circle().fill(C.rose.opacity(0.25))
        Image(systemName: "play.fill").font(.system(size: 20, weight: .bold)).foregroundColor(C.rose)
      }
    }
  }
}

struct SeanceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaSeance", provider: FournisseurC()) { e in
      SeanceVue(e: e).containerBackground(for: .widget) { Color.black }.widgetURL(C.seance)
    }
    .configurationDisplayName("Ma séance")
    .description("Lance ta prochaine séance d'une touche.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular])
  }
}

// MARK: Mascotte (ton coach, lance la séance)

struct MascotteVue: View {
  @Environment(\.widgetFamily) var famille
  let e: EntreeC

  var body: some View {
    switch famille {
    case .accessoryRectangular:
      // Grand format : le coach en grand, puis la séance du jour.
      HStack(spacing: 6) {
        Image(e.d.coach).resizable().scaledToFit().frame(maxHeight: .infinity).widgetAccentable(false)
        VStack(alignment: .leading, spacing: 0) {
          Text(e.d.coach.capitalized).font(.system(size: 12, weight: .semibold)).foregroundColor(C.rose).widgetAccentable()
          Text(e.d.seance.isEmpty ? "Ouvre NÉA" : e.d.seance).font(.system(size: 15, weight: .bold)).lineLimit(2).minimumScaleFactor(0.8)
          Text(e.d.min > 0 ? "\(e.d.min) min · C'est parti !" : "C'est parti !").font(.system(size: 12)).foregroundColor(.secondary).lineLimit(1)
        }
        Spacer(minLength: 0)
      }
    default:
      ZStack {
        Circle().fill(C.rose.opacity(0.2))
        Image(e.d.coach).resizable().scaledToFit().padding(3)
      }
      .widgetAccentable(false)
    }
  }
}

struct MascotteWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaMascotte", provider: FournisseurC()) { e in
      MascotteVue(e: e).containerBackground(for: .widget) { Color.black }.widgetURL(C.seance)
    }
    .configurationDisplayName("Ton coach")
    .description("Ton coach NÉA : touche pour lancer ta séance.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular])
  }
}

@main
struct NeaComplications: WidgetBundle {
  var body: some Widget {
    ScoreWidget()
    PasWidget()
    SeanceWidget()
    MascotteWidget()
  }
}
