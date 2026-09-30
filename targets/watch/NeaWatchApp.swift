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
      .tint(Nea.rose)
      .onOpenURL { url in
        if url.host == "seance" { Donnees.partagees.demandeSeance = true }
      }
    }
  }
}
