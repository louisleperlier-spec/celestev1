import Foundation
import WidgetKit

/// Données des complications NÉA (cadran), partagées avec l'extension par le groupe d'apps.
enum Cadran {
  static let groupe = "group.com.neacoach.app"

  static func publier(_ e: EtatMontre) {
    let a = Nea.aujourdhui()
    let s = e.semaine.first(where: { $0.jour >= a }) ?? e.semaine.first
    let d: [String: Any] = [
      "score": e.score ?? -1,
      "seance": s?.titre ?? "",
      "min": Int(s?.min ?? 0),
      "quand": s.map { Nea.quand($0.jour) } ?? "",
      "coach": e.coach,
      "prenom": e.prenom,
    ]
    UserDefaults(suiteName: groupe)?.set(d, forKey: "cadran")
    WidgetCenter.shared.reloadAllTimelines()
  }
}
