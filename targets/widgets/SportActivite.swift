import ActivityKit
import SwiftUI
import WidgetKit

/// Même structure que `modules/nea-montre/ios/ActiviteSport.swift` (ActivityKit les associe par nom et contenu).
struct NeaSportAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var bpm: Int
    var debut: Date
    var pause: Bool
    var ecoule: Int
    var kcal: Int
    var fini: Bool
  }

  var sport: String
  var symbole: String
}

private func duree(_ s: Int) -> String {
  let h = s / 3600, m = (s % 3600) / 60, ss = s % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, ss) : String(format: "%02d:%02d", m, ss)
}

/// Chrono : défile tout seul pendant l'effort, figé en pause et à la fin.
private struct Chrono: View {
  let e: NeaSportAttributes.ContentState
  var body: some View {
    if e.pause || e.fini {
      Text(duree(e.ecoule))
    } else {
      Text(timerInterval: e.debut...Date.distantFuture, countsDown: false)
    }
  }
}

private struct Pastille: View {
  let symbole: String
  var taille: CGFloat = 44
  var body: some View {
    ZStack {
      Circle().fill(W.rose.opacity(0.16))
      Circle().stroke(W.rose.opacity(0.45), lineWidth: 1)
      Image(systemName: symbole).font(.system(size: taille * 0.46, weight: .semibold)).foregroundStyle(W.rose)
    }
    .frame(width: taille, height: taille)
  }
}

private struct Coeur: View {
  let bpm: Int
  var body: some View {
    HStack(spacing: 4) {
      Image(systemName: "heart.fill").foregroundStyle(W.rose)
      Text(bpm > 0 ? "\(bpm)" : "--").monospacedDigit()
    }
  }
}

/// Écran verrouillé : sport, état, chrono, BPM et calories, sur fond noir à liseré orange.
private struct VueVerrouillage: View {
  let a: NeaSportAttributes
  let e: NeaSportAttributes.ContentState
  var body: some View {
    HStack(spacing: 14) {
      Pastille(symbole: a.symbole, taille: 48)
      VStack(alignment: .leading, spacing: 2) {
        Text(a.sport).font(.headline).foregroundStyle(.white)
        Text(e.fini ? "Terminé · \(e.kcal) kcal" : e.pause ? "En pause" : "En cours · NÉA")
          .font(.caption).foregroundStyle(W.texte2)
      }
      Spacer(minLength: 8)
      VStack(alignment: .trailing, spacing: 2) {
        Chrono(e: e)
          .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
          .foregroundStyle(.white).multilineTextAlignment(.trailing)
          .frame(maxWidth: 120, alignment: .trailing)
        Coeur(bpm: e.bpm).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
      }
    }
    .padding(16)
  }
}

struct SportActiviteWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NeaSportAttributes.self) { ctx in
      VueVerrouillage(a: ctx.attributes, e: ctx.state)
        .activityBackgroundTint(Color.black.opacity(0.92))
        .activitySystemActionForegroundColor(W.rose)
        .widgetURL(URL(string: "nea://sport-en-cours"))
    } dynamicIsland: { ctx in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 8) {
            Pastille(symbole: ctx.attributes.symbole, taille: 36)
            Text(ctx.attributes.sport).font(.headline).lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Coeur(bpm: ctx.state.bpm).font(.title3.weight(.semibold))
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack {
            Chrono(e: ctx.state).font(.system(size: 34, weight: .bold, design: .rounded)).monospacedDigit()
            Spacer()
            Text(ctx.state.pause ? "En pause" : "\(ctx.state.kcal) kcal").font(.subheadline).foregroundStyle(W.texte2)
          }
        }
      } compactLeading: {
        Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
      } compactTrailing: {
        Chrono(e: ctx.state).monospacedDigit().foregroundStyle(W.rose).frame(maxWidth: 52)
      } minimal: {
        Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
      }
      .keylineTint(W.rose)
      .widgetURL(URL(string: "nea://sport-en-cours"))
    }
  }
}
