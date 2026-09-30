import SwiftUI

@main
struct NeaWatchApp: App {
  init() {
    LiaisonMontre.partagee.activer()
    Entrainement.autoriser()
  }

  var body: some Scene {
    WindowGroup {
      NavigationStack {
        AccueilView()
      }
    }
  }
}
