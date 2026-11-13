import ExpoModulesCore
import SwiftUI
import UIKit

/**
 * Vagues de transition NÉA (DistortionWavesKit, Libraries.dev, MIT) : l'écran React Native ne peut pas être une vue SwiftUI,
 * alors la vague passe d'une photo de l'écran de départ à une photo de l'écran d'arrivée, dans une fenêtre posée au-dessus
 * de l'app. `ouvrir` photographie l'écran et le fige ; le JS navigue dessous (sans animation) ; `reveler` photographie le nouvel
 * écran et lance la vague depuis le bouton touché ; la fenêtre disparaît quand la vague a fini. Les touchers traversent la
 * fenêtre : l'app vivante est déjà dessous. iOS 17+ seulement (shaders SwiftUI) ; ailleurs, `disponible()` rend false.
 */
public class NeaVaguesModule: Module {
  private static var fenetre: UIWindow?
  private static var etat: AnyObject?
  private static var jeton = 0

  public func definition() -> ModuleDefinition {
    Name("NeaVagues")

    Function("disponible") { () -> Bool in
      if #available(iOS 17.0, *) { return true }
      return false
    }

    /// json : { x, y, w, h, fx, fy, type: "vertical" | "horizontal" | "center" } en points de la fenêtre.
    AsyncFunction("ouvrir") { (json: String) -> Bool in
      guard #available(iOS 17.0, *), let app = Self.fenetreApp() else { return false }
      Self.fermer()
      guard let d = json.data(using: .utf8), let o = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return false }
      let n = { (k: String) in (o[k] as? NSNumber)?.doubleValue ?? 0 }
      let source = CGRect(x: n("x"), y: n("y"), width: max(1, n("w")), height: max(1, n("h")))
      let focus = CGPoint(x: n("fx"), y: n("fy"))
      let type = DistortionWaveType(rawValue: o["type"] as? String ?? "vertical") ?? .vertical
      var style = DistortionWaveStyle(type: type)
      // Les couleurs de NÉA : orange, rose, ambre.
      style.palette = .sunset
      style.cornerRadius = Self.coinsEcran(app)
      let avant = Self.photo(app)
      let etat = EtatVague(avant: avant, source: source, focus: focus, style: style)
      guard let scene = app.windowScene else { return false }
      let f = UIWindow(windowScene: scene)
      f.frame = app.frame
      f.windowLevel = UIWindow.Level(rawValue: UIWindow.Level.normal.rawValue + 1)
      f.isUserInteractionEnabled = false
      f.backgroundColor = .clear
      Self.jeton += 1
      let j = Self.jeton
      let hote = UIHostingController(rootView: VueVague(etat: etat) { Self.fermer(si: j) })
      hote.view.backgroundColor = .clear
      f.rootViewController = hote
      f.isHidden = false
      Self.fenetre = f
      Self.etat = etat
      // Sécurité : jamais d'écran figé si le JS ne révèle pas.
      DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
        if Self.jeton == j, let e = Self.etat as? EtatVague, !e.revele { Self.fermer(si: j) }
      }
      return true
    }.runOnQueue(.main)

    /// Photographie le nouvel écran (sous la fenêtre de la vague) et lance la vague.
    AsyncFunction("reveler") { () -> Bool in
      guard #available(iOS 17.0, *), let app = Self.fenetreApp(), let etat = Self.etat as? EtatVague else { return false }
      etat.apres = Self.photo(app, apresMaj: true)
      DispatchQueue.main.async { etat.revele = true }
      let j = Self.jeton
      // Au cas où la fin de la vague ne serait pas signalée.
      DispatchQueue.main.asyncAfter(deadline: .now() + etat.style.duration + 1) { Self.fermer(si: j) }
      return true
    }.runOnQueue(.main)

    AsyncFunction("annuler") { () in
      Self.fermer()
    }.runOnQueue(.main)
  }

  private static func fermer(si j: Int? = nil) {
    if let j, j != jeton { return }
    fenetre?.isHidden = true
    fenetre?.rootViewController = nil
    fenetre = nil
    etat = nil
  }

  /// La fenêtre de l'app (pas celle de la vague).
  private static func fenetreApp() -> UIWindow? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let fenetres = scenes.flatMap(\.windows).filter { $0 !== fenetre && !$0.isHidden }
    return fenetres.first(where: \.isKeyWindow) ?? fenetres.first
  }

  private static func photo(_ w: UIWindow, apresMaj: Bool = false) -> UIImage {
    let format = UIGraphicsImageRendererFormat.preferred()
    format.opaque = true
    return UIGraphicsImageRenderer(bounds: w.bounds, format: format).image { ctx in
      UIColor.black.setFill()
      ctx.fill(w.bounds)
      w.drawHierarchy(in: w.bounds, afterScreenUpdates: apresMaj)
    }
  }

  /// Coins de l'écran : ceux de l'iPhone (Face ID) ou carrés (bouton d'accueil).
  private static func coinsEcran(_ w: UIWindow) -> Double {
    w.safeAreaInsets.bottom > 0 ? 55 : 0
  }
}

@available(iOS 17.0, *)
final class EtatVague: ObservableObject {
  let avant: UIImage
  let source: CGRect
  let focus: CGPoint
  let style: DistortionWaveStyle
  @Published var apres: UIImage?
  @Published var revele = false

  init(avant: UIImage, source: CGRect, focus: CGPoint, style: DistortionWaveStyle) {
    self.avant = avant
    self.source = source
    self.focus = focus
    self.style = style
  }
}

@available(iOS 17.0, *)
struct VueVague: View {
  @ObservedObject var etat: EtatVague
  let fin: () -> Void

  var body: some View {
    DistortionWave(isRevealed: etat.revele, source: etat.source, focus: etat.focus, style: etat.style, onFinish: {
      if etat.revele { fin() }
    }) {
      ecran(etat.avant)
    } revealed: {
      ecran(etat.apres ?? etat.avant)
    }
    .ignoresSafeArea()
  }

  private func ecran(_ image: UIImage) -> some View {
    Image(uiImage: image)
      .resizable()
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(Color.black)
      .ignoresSafeArea()
  }
}
