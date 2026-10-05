import ActivityKit
import Foundation

/// Activité en direct d'un sport (écran verrouillé + Dynamic Island). Même structure que `targets/widgets/SportActivite.swift`
/// (ActivityKit les associe par nom de type et contenu JSON) : ne pas changer l'une sans l'autre.
struct NeaSportAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var bpm: Int
    /// Départ du chrono (décalé des pauses) : le chrono défile tout seul sur l'écran verrouillé.
    var debut: Date
    var pause: Bool
    /// Secondes écoulées (affichées telles quelles en pause et à la fin).
    var ecoule: Int
    var kcal: Int
    var fini: Bool
  }

  var sport: String
  /// Symbole SF du sport (figure.tennis…).
  var symbole: String
}

/// Démarre, met à jour et termine l'activité en direct depuis le JS (store/sportLive.ts).
final class ActiviteSport {
  static let partagee = ActiviteSport()
  private var activite: Activity<NeaSportAttributes>?

  func demarrer(sport: String, symbole: String, debut: Date) -> Bool {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
    // Une seule à la fois : on ferme celles d'une session précédente (app tuée en route).
    for a in Activity<NeaSportAttributes>.activities {
      Task { await a.end(nil, dismissalPolicy: .immediate) }
    }
    let etat = NeaSportAttributes.ContentState(bpm: 0, debut: debut, pause: false, ecoule: 0, kcal: 0, fini: false)
    do {
      activite = try Activity.request(
        attributes: NeaSportAttributes(sport: sport, symbole: symbole),
        content: ActivityContent(state: etat, staleDate: nil),
        pushType: nil
      )
      return true
    } catch {
      return false
    }
  }

  func maj(_ etat: NeaSportAttributes.ContentState) {
    guard let a = activite else { return }
    Task { await a.update(ActivityContent(state: etat, staleDate: nil)) }
  }

  /// Fin : l'état final (« terminé ») reste visible 4 min sur l'écran verrouillé.
  func terminer(_ etat: NeaSportAttributes.ContentState?) {
    let a = activite
    activite = nil
    Task {
      if let a {
        if let etat {
          await a.end(ActivityContent(state: etat, staleDate: nil), dismissalPolicy: .after(Date().addingTimeInterval(240)))
        } else {
          await a.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }
}
