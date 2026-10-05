import ExpoModulesCore
import HealthKit
import WatchConnectivity
import UIKit
import UserNotifications
import WidgetKit

/// Liaison avec l'app Apple Watch : l'iPhone envoie l'état (prénom, coach, séances de la semaine)
/// en contexte d'application, la montre renvoie chaque séance terminée (transferUserInfo).
public final class NeaMontreModule: Module {
  static let sante = HKHealthStore()

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

    /// « Ouvrir sur la montre » : lance l'app NÉA de la montre (entraînement de musculation), qui ouvre « Ma séance ».
    Function("ouvrirSurMontre") {
      guard HKHealthStore.isHealthDataAvailable() else { return }
      let c = HKWorkoutConfiguration()
      c.activityType = .traditionalStrengthTraining
      c.locationType = .indoor
      NeaMontreModule.sante.startWatchApp(with: c) { _, _ in }
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

    /// Réglages des alertes santé (VFC, eau, vélo, pas) : voir AlertesSante.
    Function("configurerAlertes") { (json: String) in
      AlertesSante.partagees.configurer(json)
    }

    /// Activité en direct d'un sport (écran verrouillé, Dynamic Island) : voir ActiviteSport.
    Function("demarrerActivite") { (sport: String, symbole: String, debutMs: Double) -> Bool in
      ActiviteSport.partagee.demarrer(sport: sport, symbole: symbole, debut: Date(timeIntervalSince1970: debutMs / 1000))
    }

    Function("majActivite") { (bpm: Int, debutMs: Double, pause: Bool, ecoule: Int, kcal: Int) in
      ActiviteSport.partagee.maj(.init(bpm: bpm, debut: Date(timeIntervalSince1970: debutMs / 1000), pause: pause, ecoule: ecoule, kcal: kcal, fini: false))
    }

    /// `garder` : affiche l'état « terminé » quelques minutes ; sinon (abandon) retire tout de suite.
    Function("finActivite") { (bpm: Int, ecoule: Int, kcal: Int, garder: Bool) in
      ActiviteSport.partagee.terminer(garder ? .init(bpm: bpm, debut: Date(), pause: true, ecoule: ecoule, kcal: kcal, fini: true) : nil)
    }
  }
}

/// Au lancement de l'app (même en arrière-plan, réveillée par la montre) : la liaison démarre avant le JS,
/// pour recevoir la séance et prévenir tout de suite.
public final class NeaMontreAppDelegate: ExpoAppDelegateSubscriber {
  public func subscriberDidRegister() {
    Liaison.partagee.activer()
    // Apple Santé réveille l'app en arrière-plan : les observateurs doivent repartir dès le lancement.
    AlertesSante.partagees.activer()
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
    recu(userInfo)
  }

  /// Message direct de la montre (fin de séance ou de sortie) : réveille l'app pour prévenir tout de suite.
  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    recu(message)
  }

  private func recu(_ userInfo: [String: Any]) {
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
    if type == "seance" || type == "velo" { annoncer(type, json) }
    if let f = surMessage {
      DispatchQueue.main.async { f(type, json) }
    }
    // Gardé aussi : l'app le lit au démarrage si l'événement est arrivé avant l'écoute (doublons ignorés).
    verrou.lock()
    enAttente.append(["type": type, "json": json])
    verrou.unlock()
  }

  /// Notification du téléphone quand NÉA n'est pas au premier plan (au premier plan, la bannière de l'app s'en charge).
  /// Une seule fois par activité (date de fin), le message direct et la file d'attente de la montre pouvant arriver tous les deux.
  private func annoncer(_ type: String, _ json: String) {
    guard let d = json.data(using: .utf8),
          let o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any],
          let fin = o["fin"] as? String else { return }
    let deja = UserDefaults.standard.stringArray(forKey: "nea.annoncees") ?? []
    if deja.contains(fin) { return }
    UserDefaults.standard.set(Array((deja + [fin]).suffix(50)), forKey: "nea.annoncees")
    let sec = (o["sec"] as? NSNumber)?.intValue ?? 0
    let fc = (o["fcMoy"] as? NSNumber)?.doubleValue ?? 0
    let duree = String(format: "%02d:%02d", sec / 60, sec % 60)
    let fcTxt = fc > 0 ? " • FC moy. \(Int(fc)) bpm" : ""
    let c = UNMutableNotificationContent()
    if type == "velo" {
      let km = (o["km"] as? NSNumber)?.doubleValue ?? 0
      c.title = "Vélo · \(duree)"
      c.body = String(format: "%.1f km", km).replacingOccurrences(of: ".", with: ",") + fcTxt + " • Touche pour voir ton récap"
    } else {
      let titre = o["titre"] as? String ?? "Séance"
      let series = (o["series"] as? NSNumber)?.intValue ?? 0
      c.title = "\(titre) · \(duree)"
      c.body = "\(series) séries" + fcTxt + " • Touche pour voir ton récap"
    }
    c.sound = .default
    // expo-notifications lit les données de l'app dans « body ».
    c.userInfo = ["body": ["act": "activite", "d": fin]]
    DispatchQueue.main.async {
      guard UIApplication.shared.applicationState != .active else { return }
      let r = UNNotificationRequest(identifier: "nea-activite-\(fin)", content: c, trigger: nil)
      UNUserNotificationCenter.current().add(r, withCompletionHandler: nil)
    }
  }

  /// La montre demande l'état (première ouverture).
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    replyHandler(["etat": dernierEtat ?? ""])
  }
}
