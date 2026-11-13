import SwiftUI

/// Courbe et anneau de l'Activité en direct NÉA : mécanique de `MMWLine` et `MMWRing` (paquet Process
/// « Activité en direct », `Process/moneymaker-live-activity`, gardé intact), habillage NÉA : orange au lieu du vert « argent »,
/// sans lueur floutée sous la courbe (refonte sobre de l'app).

/// Courbe de la fréquence cardiaque des dernières minutes, aire légère et point blanc au bout.
struct NeaLigneFC: View {
  let valeurs: [Double]
  var epaisseur: CGFloat = 1.8

  var body: some View {
    GeometryReader { g in
      let pts = points(dans: g.size)
      ZStack {
        aire(pts, hauteur: g.size.height)
          .fill(LinearGradient(colors: [W.rose.opacity(0.28), W.rose.opacity(0.08), W.rose.opacity(0)], startPoint: .top, endPoint: .bottom))
        courbe(pts)
          .stroke(LinearGradient(colors: [W.rose.opacity(0.35), W.rose], startPoint: .leading, endPoint: .trailing),
                  style: StrokeStyle(lineWidth: epaisseur, lineCap: .round, lineJoin: .round))
        if let dernier = pts.last {
          Circle().fill(.white).frame(width: epaisseur * 3.4, height: epaisseur * 3.4).position(dernier)
        }
      }
    }
    .accessibilityHidden(true)
  }

  /// La courbe occupe toute la hauteur (pas de base à zéro : la FC varie autour de sa moyenne).
  private func points(dans s: CGSize) -> [CGPoint] {
    let v = valeurs.count > 1 ? valeurs : [valeurs.first ?? 0, valeurs.first ?? 0]
    let haut = v.max() ?? 0, bas = v.min() ?? 0, ecart = haut - bas
    let marge = epaisseur * 2
    return v.enumerated().map { i, x in
      CGPoint(x: s.width * CGFloat(i) / CGFloat(v.count - 1),
              y: ecart > 0 ? marge + (s.height - marge * 2) * (1 - CGFloat((x - bas) / ecart)) : s.height / 2)
    }
  }

  private func courbe(_ p: [CGPoint]) -> Path {
    var path = Path()
    guard let premier = p.first else { return path }
    path.move(to: premier)
    for i in 1..<p.count {
      let a = p[i - 1], b = p[i], mx = (a.x + b.x) / 2
      path.addCurve(to: b, control1: CGPoint(x: mx, y: a.y), control2: CGPoint(x: mx, y: b.y))
    }
    return path
  }

  private func aire(_ p: [CGPoint], hauteur: CGFloat) -> Path {
    var path = courbe(p)
    guard let premier = p.first, let dernier = p.last else { return path }
    path.addLine(to: CGPoint(x: dernier.x, y: hauteur))
    path.addLine(to: CGPoint(x: premier.x, y: hauteur))
    path.closeSubpath()
    return path
  }
}

/// Anneau fin d'intensité : part de la FC max (piste 14 %, arc orange).
struct NeaAnneau: View {
  let part: Double
  var epaisseur: CGFloat = 2.4

  var body: some View {
    ZStack {
      Circle().stroke(.white.opacity(0.14), lineWidth: epaisseur)
      Circle().trim(from: 0, to: min(1, max(0.02, part)))
        .stroke(W.rose, style: StrokeStyle(lineWidth: epaisseur, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
    .accessibilityLabel(Text("\(Int(part * 100)) % de ta FC max"))
  }
}

/// Zone cardio (1 à 5) d'après la part de la FC max, comme dans l'app.
func zoneFC(_ part: Double) -> Int {
  switch part {
  case ..<0.6: return 1
  case ..<0.7: return 2
  case ..<0.8: return 3
  case ..<0.9: return 4
  default: return 5
  }
}
