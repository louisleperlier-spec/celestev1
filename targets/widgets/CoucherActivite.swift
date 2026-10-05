import ActivityKit
import SwiftUI
import WidgetKit

/// Même structure que `NeaCoucherAttributes` dans `modules/nea-montre/ios/ActiviteSport.swift`.
struct NeaCoucherAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var coucher: Date
  }

  var titre: String
}

/// Compte à rebours jusqu'au coucher (s'arrête à 0:00).
private struct Rebours: View {
  let coucher: Date
  var body: some View {
    Text(timerInterval: Date()...max(Date(), coucher), countsDown: true)
  }
}

/// Écran verrouillé (maquette de l'utilisateur) : lune + NÉA, « L'heure de ralentir », compte à rebours, Axel qui dort sous la couette.
private struct VueCoucher: View {
  let a: NeaCoucherAttributes
  let e: NeaCoucherAttributes.ContentState
  var body: some View {
    ZStack(alignment: .leading) {
      HStack(spacing: 0) {
        Spacer(minLength: 0)
        Image("axel_dodo").resizable().scaledToFill().frame(width: 190).clipped()
      }
      LinearGradient(colors: [Color.black, Color.black.opacity(0.85), Color.black.opacity(0)], startPoint: .leading, endPoint: UnitPoint(x: 0.62, y: 0.5))
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 6) {
          Image(systemName: "moon.fill").foregroundStyle(W.rose)
          Text("NÉA").font(.caption.weight(.bold)).foregroundStyle(.white)
        }
        Text(a.titre).font(.system(size: 21, weight: .bold)).foregroundStyle(.white).lineLimit(2).frame(maxWidth: 150, alignment: .leading)
        Rebours(coucher: e.coucher)
          .font(.system(size: 38, weight: .heavy, design: .rounded)).monospacedDigit().foregroundStyle(.white)
          .frame(maxWidth: 150, alignment: .leading)
        Text(Date() >= e.coucher ? "C'est l'heure de dormir." : "Avant ton coucher.").font(.caption).foregroundStyle(W.texte2)
      }
      .padding(16)
    }
  }
}

struct CoucherActiviteWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NeaCoucherAttributes.self) { ctx in
      VueCoucher(a: ctx.attributes, e: ctx.state)
        .activityBackgroundTint(Color.black.opacity(0.92))
        .activitySystemActionForegroundColor(W.rose)
        .widgetURL(URL(string: "nea://sommeil"))
    } dynamicIsland: { ctx in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: "moon.fill").foregroundStyle(W.rose)
            Text(ctx.attributes.titre).font(.headline).lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Image("axel_dodo").resizable().scaledToFill().frame(width: 52, height: 42).clipShape(RoundedRectangle(cornerRadius: 10))
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .firstTextBaseline) {
            Rebours(coucher: ctx.state.coucher).font(.system(size: 34, weight: .heavy, design: .rounded)).monospacedDigit()
            Spacer()
            Text("avant ton coucher").font(.subheadline).foregroundStyle(W.texte2)
          }
        }
      } compactLeading: {
        Image(systemName: "moon.fill").foregroundStyle(W.rose)
      } compactTrailing: {
        Rebours(coucher: ctx.state.coucher).monospacedDigit().foregroundStyle(W.rose).frame(maxWidth: 52)
      } minimal: {
        Image(systemName: "moon.fill").foregroundStyle(W.rose)
      }
      .keylineTint(W.rose)
      .widgetURL(URL(string: "nea://sommeil"))
    }
  }
}
