import HealthKit
import SwiftUI
import WatchKit

/// « Ouvrir sur la montre » (iPhone, `startWatchApp`) : le système lance l'app avec un entraînement de musculation.
final class DelegueMontre: NSObject, WKApplicationDelegate {
  func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
    DispatchQueue.main.async { Donnees.partagees.ouvrirChoisie = true }
  }
}

@main
struct NeaWatchApp: App {
  @WKApplicationDelegateAdaptor private var delegue: DelegueMontre

  init() {
    LiaisonMontre.partagee.activer()
    Entrainement.autoriser()
    ReponsesNotif.partagees.activer()
  }

  var body: some Scene {
    WindowGroup {
      NavigationStack {
        AccueilView()
      }
      .tint(Nea.rose)
      .onOpenURL { url in
        if url.host == "seance" { Donnees.partagees.demandeSeance = true }
      }
    }
    // Écrans des notifications NÉA (VFC de l'heure, récupération, séance), comme OtterLife.
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_VFC_0")
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_VFC_1")
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_VFC_2")
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_VFC_3")
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_RECUP")
    WKNotificationScene(controller: ControleurNotif.self, category: "NEA_SEANCE")
  }
}
