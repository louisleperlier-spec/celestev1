import SwiftUI
import WidgetKit

// MARK: Données (contrat de `widget()` dans src/store/liaisonMontre.ts)

struct SeanceW: Codable {
  let titre: String
  let quand: String
  let min: Int
  let exos: Int
}

struct DonneesW: Codable {
  let prenom: String
  let effort: Double
  let recup: Double
  let sommeil: Double
  let score: Double
  let seance: SeanceW?
  let maj: String

  static let exemple = DonneesW(
    prenom: "Louis", effort: 60, recup: 94, sommeil: 7.4, score: 81,
    seance: SeanceW(titre: "Bas du corps", quand: "Aujourd'hui", min: 45, exos: 6), maj: ""
  )

  static func lire() -> DonneesW? {
    guard let s = UserDefaults(suiteName: "group.com.neacoach.app")?.string(forKey: "widget"),
          let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(DonneesW.self, from: d)
  }
}

struct Entree: TimelineEntry {
  let date: Date
  let d: DonneesW?
}

struct Fournisseur: TimelineProvider {
  func placeholder(in context: Context) -> Entree {
    Entree(date: Date(), d: .exemple)
  }

  func getSnapshot(in context: Context, completion: @escaping (Entree) -> Void) {
    completion(Entree(date: Date(), d: DonneesW.lire() ?? .exemple))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entree>) -> Void) {
    // L'app rafraîchit les widgets à chaque changement ; sinon, relecture toutes les heures.
    completion(Timeline(entries: [Entree(date: Date(), d: DonneesW.lire())], policy: .after(Date().addingTimeInterval(3600))))
  }
}

// MARK: Style

enum W {
  static let rose = Color(red: 1.0, green: 0.31, blue: 0.64)
  static let fond = Color(red: 0.133, green: 0.137, blue: 0.157)
  static let carte = Color(red: 0.176, green: 0.188, blue: 0.22)
  static let texte2 = Color(red: 0.68, green: 0.69, blue: 0.73)
  static let lien = URL(string: "nea://accueil")!

  static func h(_ v: Double) -> String {
    let m = Int((v * 60).rounded())
    return "\(m / 60)h\(String(format: "%02d", m % 60))"
  }
}

struct Barre: View {
  let titre: String
  let part: Double
  let valeur: String

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack {
        Text(titre).font(.system(size: 11)).foregroundColor(W.texte2)
        Spacer()
        Text(valeur).font(.system(size: 11, weight: .semibold))
      }
      GeometryReader { g in
        ZStack(alignment: .leading) {
          Capsule().fill(W.carte)
          Capsule().fill(W.rose).frame(width: g.size.width * CGFloat(max(0, min(1, part))))
        }
      }
      .frame(height: 5)
    }
  }
}

// MARK: Bilan du jour (petit + écran verrouillé rond)

struct BilanVue: View {
  @Environment(\.widgetFamily) var famille
  let e: Entree

  var body: some View {
    let d = e.d
    switch famille {
    case .accessoryCircular:
      Gauge(value: min(1, (d?.effort ?? 0) / 100)) {
        Text("NÉA")
      } currentValueLabel: {
        Text("\(Int(d?.effort ?? 0))")
      }
      .gaugeStyle(.accessoryCircularCapacity)
    default:
      VStack(alignment: .leading, spacing: 6) {
        Text("NÉA").font(.system(size: 13, weight: .heavy)).foregroundColor(W.rose)
        Text("Ton bilan").font(.system(size: 14, weight: .semibold))
        if let d = d {
          Barre(titre: "Effort", part: d.effort / 100, valeur: "\(Int(d.effort)) %")
          Barre(titre: "Récup.", part: d.recup / 100, valeur: d.recup > 0 ? "\(Int(d.recup)) %" : "–")
          Barre(titre: "Sommeil", part: d.sommeil / 8, valeur: d.sommeil > 0 ? W.h(d.sommeil) : "–")
        } else {
          Text("Ouvre NÉA pour voir ton bilan.").font(.system(size: 12)).foregroundColor(W.texte2)
        }
      }
    }
  }
}

struct BilanWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaBilan", provider: Fournisseur()) { e in
      BilanVue(e: e)
        .containerBackground(W.fond, for: .widget)
        .widgetURL(W.lien)
    }
    .configurationDisplayName("Bilan du jour")
    .description("Effort, récupération et sommeil.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: Prochaine séance (moyen + écran verrouillé rectangulaire)

struct SeanceVue: View {
  @Environment(\.widgetFamily) var famille
  let e: Entree

  var body: some View {
    let d = e.d
    switch famille {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        Text("NÉA • \(d?.seance?.quand ?? "Repos")").font(.system(size: 12, weight: .semibold))
        Text(d?.seance?.titre ?? "Pas de séance prévue").font(.system(size: 14, weight: .bold)).lineLimit(1)
        if let s = d?.seance { Text("\(s.min) min • \(s.exos) exercices").font(.system(size: 12)) }
      }
    default:
      HStack(spacing: 12) {
        VStack(alignment: .leading, spacing: 4) {
          Text("NÉA").font(.system(size: 13, weight: .heavy)).foregroundColor(W.rose)
          Text("Bonjour \(d?.prenom ?? "")").font(.system(size: 12)).foregroundColor(W.texte2)
          Spacer(minLength: 0)
          if let s = d?.seance {
            Text(s.quand).font(.system(size: 12)).foregroundColor(W.texte2)
            Text(s.titre).font(.system(size: 17, weight: .bold)).lineLimit(2)
            Text("\(s.min) min • \(s.exos) exercices").font(.system(size: 12)).foregroundColor(W.texte2)
          } else {
            Text("Pas de séance prévue").font(.system(size: 15, weight: .semibold))
          }
        }
        Spacer(minLength: 0)
        if let d = d {
          VStack(spacing: 6) {
            Anneau(part: d.effort / 100, titre: "Effort")
            Anneau(part: d.recup / 100, titre: "Récup.")
          }
        }
      }
    }
  }
}

struct Anneau: View {
  let part: Double
  let titre: String

  var body: some View {
    VStack(spacing: 2) {
      ZStack {
        Circle().stroke(W.rose.opacity(0.2), lineWidth: 5)
        Circle()
          .trim(from: 0, to: max(0, min(1, part)))
          .stroke(W.rose, style: StrokeStyle(lineWidth: 5, lineCap: .round))
          .rotationEffect(.degrees(-90))
        Text("\(Int(part * 100))").font(.system(size: 11, weight: .bold))
      }
      .frame(width: 38, height: 38)
      Text(titre).font(.system(size: 10)).foregroundColor(W.texte2)
    }
  }
}

struct SeanceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NeaSeance", provider: Fournisseur()) { e in
      SeanceVue(e: e)
        .containerBackground(W.fond, for: .widget)
        .widgetURL(W.lien)
    }
    .configurationDisplayName("Prochaine séance")
    .description("Ta prochaine séance et ton bilan du jour.")
    .supportedFamilies([.systemMedium, .accessoryRectangular])
  }
}

@main
struct NeaWidgets: WidgetBundle {
  var body: some Widget {
    BilanWidget()
    SeanceWidget()
  }
}
