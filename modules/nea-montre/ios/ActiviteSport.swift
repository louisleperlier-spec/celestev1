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

/// Moments NÉA sur l'écran verrouillé (maquettes de l'utilisateur) : « L'heure de ralentir », « Ta séance approche »,
/// « Une pause pour toi », « Objectif atteint ! ». Même structure que targets/widgets/MomentActivite.swift.
struct NeaMomentAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Compte à rebours jusqu'à cette date, ou grand texte fixe (`valeur`, ex. « 10 240 pas »).
    var fin: Date?
    var valeur: String?
    var sous: String
    /// Phrase affichée une fois le compte à rebours fini.
    var finTexte: String?
  }

  var type: String
  var titre: String
  var symbole: String
  var image: String
}

private struct MomentJSON: Decodable {
  let type: String
  let titre: String
  let sous: String
  let symbole: String
  let image: String
  var finMs: Double?
  var valeur: String?
  var finTexte: String?
  /// Pour un moment sans compte à rebours : minutes d'affichage avant de disparaître.
  var visibleMin: Double?
}

final class ActiviteMoment {
  static let partagee = ActiviteMoment()

  /// Un moment à la fois ; ne relance pas le même (même type et même échéance) s'il tourne déjà.
  func demarrer(_ json: String) -> Bool {
    guard ActivityAuthorizationInfo().areActivitiesEnabled,
          let d = json.data(using: .utf8),
          let m = try? JSONDecoder().decode(MomentJSON.self, from: d) else { return false }
    let fin = m.finMs.map { Date(timeIntervalSince1970: $0 / 1000) }
    let deja = Activity<NeaMomentAttributes>.activities
    if deja.contains(where: { $0.attributes.type == m.type && $0.activityState == .active && $0.content.state.fin == fin && $0.content.state.valeur == m.valeur }) {
      return true
    }
    for a in deja { Task { await a.end(nil, dismissalPolicy: .immediate) } }
    let etat = NeaMomentAttributes.ContentState(fin: fin, valeur: m.valeur, sous: m.sous, finTexte: m.finTexte)
    do {
      let a = try Activity.request(
        attributes: NeaMomentAttributes(type: m.type, titre: m.titre, symbole: m.symbole, image: m.image),
        content: ActivityContent(state: etat, staleDate: fin?.addingTimeInterval(15 * 60)),
        pushType: nil
      )
      if let v = m.visibleMin {
        // Moment ponctuel (objectif atteint) : reste affiché puis disparaît seul.
        Task { await a.end(ActivityContent(state: etat, staleDate: nil), dismissalPolicy: .after(Date().addingTimeInterval(v * 60))) }
      }
      return true
    } catch {
      return false
    }
  }

  /// Termine les moments de ce type ("" = tous).
  func terminer(_ type: String) {
    for a in Activity<NeaMomentAttributes>.activities where type.isEmpty || a.attributes.type == type {
      Task { await a.end(nil, dismissalPolicy: .immediate) }
    }
  }
}
