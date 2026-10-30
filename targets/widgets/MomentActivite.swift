import ActivityKit
import SwiftUI
import WidgetKit

/// Même structure que `NeaMomentAttributes` dans `modules/nea-montre/ios/ActiviteSport.swift`.
struct NeaMomentAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var fin: Date?
    var valeur: String?
    var sous: String
    var finTexte: String?
  }

  var type: String
  var titre: String
  var symbole: String
  var image: String
}

/// Grand chiffre : compte à rebours (s'arrête à 0:00) ou texte fixe.
private struct Grand: View {
  let e: NeaMomentAttributes.ContentState
  var body: some View {
    if let fin = e.fin {
      Text(timerInterval: Date()...max(Date(), fin), countsDown: true)
    } else {
      Text(e.valeur ?? "")
    }
  }
}

private func sousTitre(_ e: NeaMomentAttributes.ContentState) -> String {
  if let fin = e.fin, Date() >= fin, let t = e.finTexte { return t }
  return e.sous
}

/// Écran verrouillé (maquettes de l'utilisateur) : icône orange + NÉA, titre, grand chiffre, phrase, Axel à droite fondu dans le noir.
private struct VueMoment: View {
  let a: NeaMomentAttributes
  let e: NeaMomentAttributes.ContentState
  var body: some View {
    ZStack(alignment: .leading) {
      HStack(spacing: 0) {
        Spacer(minLength: 0)
        Image(a.image).resizable().scaledToFill().frame(width: 200).clipped()
      }
      LinearGradient(colors: [Color.black, Color.black.opacity(0.85), Color.black.opacity(0)], startPoint: .leading, endPoint: UnitPoint(x: 0.62, y: 0.5))
      VStack(alignment: .leading, spacing: 3) {
        HStack(spacing: 6) {
          Image(systemName: a.symbole).foregroundStyle(W.rose)
          Text("NÉA").font(.caption.weight(.bold)).foregroundStyle(.white)
        }
        Text(a.titre).font(.system(size: 21, weight: .bold)).foregroundStyle(.white).lineLimit(2).frame(maxWidth: 170, alignment: .leading)
        Grand(e: e)
          .font(.system(size: 38, weight: .heavy, design: .rounded)).monospacedDigit().foregroundStyle(.white)
          .lineLimit(1).minimumScaleFactor(0.6).frame(maxWidth: 190, alignment: .leading)
        Text(sousTitre(e)).font(.caption).foregroundStyle(W.texte2).lineLimit(1)
      }
      .padding(16)
    }
  }
}

private func lien(_ type: String) -> URL? {
  switch type {
  case "coucher": return URL(string: "nea://sommeil")
  case "seance": return URL(string: "nea://programme")
  case "pause": return URL(string: "nea://respirer")
  default: return URL(string: "nea://accueil")
  }
}

struct MomentActiviteWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NeaMomentAttributes.self) { ctx in
      VueMoment(a: ctx.attributes, e: ctx.state)
        .activityBackgroundTint(Color.black.opacity(0.92))
        .activitySystemActionForegroundColor(W.rose)
        .widgetURL(lien(ctx.attributes.type))
    } dynamicIsland: { ctx in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
            Text(ctx.attributes.titre).font(.headline).lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Image(ctx.attributes.image).resizable().scaledToFill().frame(width: 56, height: 42).clipShape(RoundedRectangle(cornerRadius: 10))
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .firstTextBaseline) {
            Grand(e: ctx.state).font(.system(size: 32, weight: .heavy, design: .rounded)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.6)
            Spacer()
            Text(sousTitre(ctx.state)).font(.subheadline).foregroundStyle(W.texte2).lineLimit(1)
          }
        }
      } compactLeading: {
        Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
      } compactTrailing: {
        Grand(e: ctx.state).monospacedDigit().foregroundStyle(W.rose).lineLimit(1).minimumScaleFactor(0.5).frame(maxWidth: 56)
      } minimal: {
        Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
      }
      .keylineTint(W.rose)
      .widgetURL(lien(ctx.attributes.type))
    }
  }
}
