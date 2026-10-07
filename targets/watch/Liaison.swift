import Foundation
import WatchConnectivity

/// État reçu de l'iPhone (gardé pour les ouvertures hors de portée du téléphone).
final class Donnees: ObservableObject {
  static let partagees = Donnees()

  @Published var etat: EtatMontre?
  @Published var synchro: Date?
  /// Ouverture par la complication « Ma séance » (nea://seance) : lance la prochaine séance.
  @Published var demandeSeance = false
  /// Ouverture par « Ouvrir sur la montre » sur l'iPhone : affiche « Ma séance ».
  @Published var ouvrirChoisie = false
  /// Bouton d'une notification : « respiration » ou « recup ».
  @Published var ouvrirEcran: String?
  private let cle = "nea.etat"
  private let cleSynchro = "nea.synchro"

  init() {
    if let s = UserDefaults.standard.string(forKey: cle) {
      etat = Donnees.decoder(s)
      if let e = etat { Cadran.publier(e) }
    }
    let t = UserDefaults.standard.double(forKey: cleSynchro)
    if t > 0 { synchro = Date(timeIntervalSince1970: t) }
  }

  static func decoder(_ s: String) -> EtatMontre? {
    guard let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(EtatMontre.self, from: d)
  }

  func recevoir(_ s: String) {
    guard let e = Donnees.decoder(s) else { return }
    let maintenant = Date()
    UserDefaults.standard.set(s, forKey: cle)
    UserDefaults.standard.set(maintenant.timeIntervalSince1970, forKey: cleSynchro)
    Cadran.publier(e)
    DispatchQueue.main.async {
      self.etat = e
      self.synchro = maintenant
    }
  }

  /// Prochaine séance : celle choisie sur l'iPhone, sinon aujourd'hui ou plus tard dans la semaine, sinon la première.
  var prochaine: SeanceMontre? {
    if let c = etat?.choisie { return c }
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

  /// Envoi fiable à l'iPhone (file d'attente du système, même si l'iPhone est loin) : séance, vélo, mesure, message au coach.
  func envoyer<T: Encodable>(_ type: String, _ valeur: T) {
    guard let d = try? JSONEncoder().encode(valeur), let json = String(data: d, encoding: .utf8) else { return }
    let s = WCSession.default
    s.transferUserInfo(["type": type, "json": json])
    // Fin de séance ou de sortie : message direct en plus, qui réveille l'iPhone pour la notification et le récap
    // (les doublons sont ignorés côté iPhone).
    if (type == "seance" || type == "velo") && s.isReachable {
      s.sendMessage(["type": type, "json": json], replyHandler: nil, errorHandler: nil)
    }
  }

  /// Commande immédiate (réveil, nuit, pluie, ressenti) : message direct si l'iPhone est joignable, sinon file d'attente
  /// (`fiable: false` : abandonnée, ex. la pluie, qui n'a plus de sens plus tard).
  func envoyerDirect<T: Encodable>(_ type: String, _ valeur: T, fiable: Bool = true) {
    guard let d = try? JSONEncoder().encode(valeur), let json = String(data: d, encoding: .utf8) else { return }
    let s = WCSession.default
    if joignable {
      s.sendMessage(["type": type, "json": json], replyHandler: nil) { _ in
        if fiable { s.transferUserInfo(["type": type, "json": json]) }
      }
    } else if fiable {
      s.transferUserInfo(["type": type, "json": json])
    }
  }

  func envoyer(_ r: ResultatMontre) {
    envoyer("seance", r)
  }

  /// iPhone joignable en ce moment.
  var joignable: Bool {
    WCSession.isSupported() && WCSession.default.activationState == .activated && WCSession.default.isReachable
  }

  /// Demande l'état à l'iPhone (bouton « Synchroniser ») ; `fin(true)` s'il a répondu.
  func synchroniser(fin: @escaping (Bool) -> Void) {
    let s = WCSession.default
    if let c = s.receivedApplicationContext["etat"] as? String { Donnees.partagees.recevoir(c) }
    guard joignable else {
      fin(false)
      return
    }
    s.sendMessage([:], replyHandler: { rep in
      if let e = rep["etat"] as? String, !e.isEmpty { Donnees.partagees.recevoir(e) }
      DispatchQueue.main.async { fin(true) }
    }, errorHandler: { _ in
      DispatchQueue.main.async { fin(false) }
    })
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
