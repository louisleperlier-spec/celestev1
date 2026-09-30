import ExpoModulesCore
import WatchConnectivity

/// Liaison avec l'app Apple Watch : l'iPhone envoie l'état (prénom, coach, séances de la semaine)
/// en contexte d'application, la montre renvoie chaque séance terminée (transferUserInfo).
public final class NeaMontreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NeaMontre")

    Events("seanceMontre")

    OnCreate {
      Liaison.partagee.surSeance = { [weak self] json in
        self?.sendEvent("seanceMontre", ["json": json])
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

    /// Séances reçues avant que l'app n'écoute (JSON), vidées à la lecture.
    Function("recupererEnAttente") { () -> [String] in
      Liaison.partagee.vider()
    }
  }
}

final class Liaison: NSObject, WCSessionDelegate {
  static let partagee = Liaison()

  var surSeance: ((String) -> Void)?
  private var enAttente: [String] = []
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

  func vider() -> [String] {
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
    guard let json = userInfo["seance"] as? String else { return }
    if let f = surSeance {
      DispatchQueue.main.async { f(json) }
    }
    // Gardée aussi : l'app la lit au démarrage si l'événement est arrivé avant l'écoute (doublons ignorés par id).
    verrou.lock()
    enAttente.append(json)
    verrou.unlock()
  }

  /// La montre demande l'état (première ouverture).
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    replyHandler(["etat": dernierEtat ?? ""])
  }
}
