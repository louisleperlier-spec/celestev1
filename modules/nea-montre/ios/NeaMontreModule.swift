import ExpoModulesCore
import WatchConnectivity
import WidgetKit

/// Liaison avec l'app Apple Watch : l'iPhone envoie l'état (prénom, coach, séances de la semaine)
/// en contexte d'application, la montre renvoie chaque séance terminée (transferUserInfo).
public final class NeaMontreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NeaMontre")

    Events("messageMontre")

    OnCreate {
      Liaison.partagee.surMessage = { [weak self] type, json in
        self?.sendEvent("messageMontre", ["type": type, "json": json])
      }
      Liaison.partagee.activer()
    }

    /// Montre jumelée et app NÉA installée dessus.
    Function("estDisponible") { () -> Bool in
      Liaison.partagee.disponible()
    }

    /// Dernier état de l'iPhone pour la montre (JSON).
    Function("envoyerEtat") { (json: String) in
      Liaison.partagee.envoyer(json)
    }

    /// Messages reçus avant que l'app n'écoute (type + JSON), vidés à la lecture.
    Function("recupererEnAttente") { () -> [[String: String]] in
      Liaison.partagee.vider()
    }

    /// Données des widgets de l'iPhone, dans le groupe d'apps partagé avec l'extension.
    Function("ecrireWidget") { (json: String) in
      UserDefaults(suiteName: "group.com.neacoach.app")?.set(json, forKey: "widget")
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

final class Liaison: NSObject, WCSessionDelegate {
  static let partagee = Liaison()

  var surMessage: ((String, String) -> Void)?
  private var enAttente: [[String: String]] = []
  private var dernierEtat: String?
  private let verrou = NSLock()

  func activer() {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    if s.delegate == nil { s.delegate = self }
    if s.activationState != .activated { s.activate() }
  }

  func disponible() -> Bool {
    guard WCSession.isSupported() else { return false }
    let s = WCSession.default
    return s.activationState == .activated && s.isPaired && s.isWatchAppInstalled
  }

  func envoyer(_ json: String) {
    dernierEtat = json
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    guard s.activationState == .activated, s.isPaired, s.isWatchAppInstalled else { return }
    try? s.updateApplicationContext(["etat": json, "t": Date().timeIntervalSince1970])
  }

  func vider() -> [[String: String]] {
    verrou.lock()
    defer { verrou.unlock() }
    let l = enAttente
    enAttente = []
    return l
  }

  // MARK: WCSessionDelegate

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated, let e = dernierEtat { envoyer(e) }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func sessionWatchStateDidChange(_ session: WCSession) {
    if let e = dernierEtat { envoyer(e) }
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    // Build 3 : { seance: json } ; ensuite : { type, json } (seance, velo, mesure, coach).
    let type: String
    let json: String
    if let j = userInfo["seance"] as? String {
      type = "seance"
      json = j
    } else if let t = userInfo["type"] as? String, let j = userInfo["json"] as? String {
      type = t
      json = j
    } else {
      return
    }
    if let f = surMessage {
      DispatchQueue.main.async { f(type, json) }
    }
    // Gardé aussi : l'app le lit au démarrage si l'événement est arrivé avant l'écoute (doublons ignorés).
    verrou.lock()
    enAttente.append(["type": type, "json": json])
    verrou.unlock()
  }

  /// La montre demande l'état (première ouverture).
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    replyHandler(["etat": dernierEtat ?? ""])
  }
}
