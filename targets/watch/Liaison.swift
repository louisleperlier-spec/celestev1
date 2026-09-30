import Foundation
import WatchConnectivity

/// État reçu de l'iPhone (gardé pour les ouvertures hors de portée du téléphone).
final class Donnees: ObservableObject {
  static let partagees = Donnees()

  @Published var etat: EtatMontre?
  private let cle = "nea.etat"

  init() {
    if let s = UserDefaults.standard.string(forKey: cle) {
      etat = Donnees.decoder(s)
    }
  }

  static func decoder(_ s: String) -> EtatMontre? {
    guard let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(EtatMontre.self, from: d)
  }

  func recevoir(_ s: String) {
    guard let e = Donnees.decoder(s) else { return }
    UserDefaults.standard.set(s, forKey: cle)
    DispatchQueue.main.async { self.etat = e }
  }

  /// Prochaine séance : aujourd'hui ou plus tard dans la semaine, sinon la première.
  var prochaine: SeanceMontre? {
    guard let l = etat?.semaine, !l.isEmpty else { return nil }
    let a = Nea.aujourdhui()
    return l.first(where: { $0.jour >= a }) ?? l.first
  }
}

/// WatchConnectivity côté montre : reçoit l'état, envoie les séances terminées.
final class LiaisonMontre: NSObject, WCSessionDelegate {
  static let partagee = LiaisonMontre()

  func activer() {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    s.delegate = self
    s.activate()
  }

  func envoyer(_ r: ResultatMontre) {
    guard let d = try? JSONEncoder().encode(r), let json = String(data: d, encoding: .utf8) else { return }
    WCSession.default.transferUserInfo(["seance": json])
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let s = session.receivedApplicationContext["etat"] as? String {
      Donnees.partagees.recevoir(s)
    } else if session.isReachable {
      session.sendMessage([:], replyHandler: { rep in
        if let s = rep["etat"] as? String, !s.isEmpty { Donnees.partagees.recevoir(s) }
      }, errorHandler: nil)
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    if let s = applicationContext["etat"] as? String { Donnees.partagees.recevoir(s) }
  }
}
