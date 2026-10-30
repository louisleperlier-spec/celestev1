import CoreMotion
import Foundation

/// Comptage estimé des répétitions : accélération verticale (dans l'axe de la gravité), lissée ;
/// une répétition = un passage « bas » puis « haut » franc, au moins 0,7 s après la précédente.
final class Compteur: ObservableObject {
  @Published var reps = 0

  private let mouvement = CMMotionManager()
  private var lisse = 0.0
  private var enBas = false
  private var dernier = Date.distantPast
  private let seuil = 0.09

  var disponible: Bool { mouvement.isDeviceMotionAvailable }

  func demarrer() {
    reps = 0
    lisse = 0
    enBas = false
    dernier = Date.distantPast
    guard mouvement.isDeviceMotionAvailable else { return }
    mouvement.deviceMotionUpdateInterval = 1.0 / 50.0
    mouvement.startDeviceMotionUpdates(to: OperationQueue.main) { [weak self] m, _ in
      guard let self = self, let m = m else { return }
      let a = m.userAcceleration
      let g = m.gravity
      // Composante verticale de l'accélération (en g).
      let v = a.x * g.x + a.y * g.y + a.z * g.z
      self.lisse = self.lisse * 0.75 + v * 0.25
      if self.lisse < -self.seuil {
        self.enBas = true
      } else if self.enBas, self.lisse > self.seuil {
        self.enBas = false
        let t = Date()
        if t.timeIntervalSince(self.dernier) > 0.7 {
          self.dernier = t
          self.reps += 1
        }
      }
    }
  }

  func arreter() {
    mouvement.stopDeviceMotionUpdates()
  }
}
