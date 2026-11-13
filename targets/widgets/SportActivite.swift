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
    var fc: [Int]? = nil
    var fcMax: Int? = nil
  }

  var sport: String
  var symbole: String
}

/*
 * Design « Activité en direct » (paquet Process moneymaker-live-activity, installé tel quel dans Process/) adapté à NÉA :
 * petits libellés en capitales espacées, grands chiffres fins à chasse fixe (`MMFont.number`) qui roulent à chaque mise à jour
 * (`.contentTransition(.numericText)`), anneau fin d'intensité (part de la FC max), courbe de la FC des dernières minutes,
 * ligne du bas séparée par un filet, nuage de points discret dans le coin (`MMWDots`). Orange NÉA à la place du vert « argent ».
 */

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

/// Part de la FC max (0 si inconnue).
private func part(_ e: NeaSportAttributes.ContentState) -> Double {
  guard let m = e.fcMax, m > 0, e.bpm > 0 else { return 0 }
  return Double(e.bpm) / Double(m)
}

/// Petit libellé en capitales espacées (« DURÉE », « BPM »).
private struct Libelle: View {
  let texte: String
  var taille: CGFloat = 9
  var body: some View {
    Text(texte).font(MMFont.system(taille, .medium)).tracking(1.6).foregroundStyle(.white.opacity(0.4))
  }
}

/// État en une ligne : en pause, terminé, ou zone cardio.
private func etatTexte(_ e: NeaSportAttributes.ContentState) -> String {
  if e.fini { return "Terminé" }
  if e.pause { return "En pause" }
  let p = part(e)
  return p > 0 ? "Zone \(zoneFC(p))" : "En cours"
}

/// Ligne du bas : symbole du sport, état, calories ; heure de départ à droite.
private struct LigneBas: View {
  let a: NeaSportAttributes
  let e: NeaSportAttributes.ContentState
  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 6) {
      Image(systemName: a.symbole).font(.system(size: 11, weight: .semibold)).foregroundStyle(W.rose)
      Text(etatTexte(e)).font(MMFont.system(12)).foregroundStyle(.white)
      Text("· \(e.kcal) kcal").font(MMFont.system(12)).foregroundStyle(.white.opacity(0.55))
        .contentTransition(.numericText(value: Double(e.kcal)))
      Spacer(minLength: 0)
      Text("Départ \(e.debut.formatted(date: .omitted, time: .shortened))")
        .font(MMFont.system(10)).foregroundStyle(.white.opacity(0.35)).lineLimit(1)
    }
  }
}

/// Écran verrouillé : libellé du sport, chrono en grand avec l'anneau, BPM, courbe de FC, ligne du bas.
private struct VueVerrouillage: View {
  let a: NeaSportAttributes
  let e: NeaSportAttributes.ContentState
  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Circle().fill(e.fini || e.pause ? Color.white.opacity(0.4) : W.rose).frame(width: 5, height: 5)
          .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 1 }
        Libelle(texte: a.sport.uppercased(), taille: 10)
        Spacer()
        Text("NÉA").font(MMFont.system(10, .medium)).foregroundStyle(.white.opacity(0.3))
      }
      HStack(alignment: .bottom, spacing: 16) {
        VStack(alignment: .leading, spacing: 4) {
          HStack(spacing: 8) {
            Chrono(e: e).font(MMFont.number(34)).tracking(-1).foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.6)
            if part(e) > 0 { NeaAnneau(part: part(e), epaisseur: 2.6).frame(width: 20, height: 20) }
          }
          HStack(spacing: 4) {
            Image(systemName: "heart.fill").font(.system(size: 10)).foregroundStyle(W.rose)
            Text(e.bpm > 0 ? "\(e.bpm) bpm" : "-- bpm").font(MMFont.system(12)).foregroundStyle(.white.opacity(0.55))
              .contentTransition(.numericText(value: Double(e.bpm)))
          }
        }
        .fixedSize()
        if let fc = e.fc, fc.count > 1 {
          NeaLigneFC(valeurs: fc.map(Double.init)).frame(height: 44)
        } else {
          Spacer(minLength: 0)
        }
      }
      Rectangle().fill(.white.opacity(0.08)).frame(height: 0.75)
      LigneBas(a: a, e: e)
    }
    .padding(16)
    .background(alignment: .topTrailing) { MMWDots(anchor: .topTrailing, reach: 0.5, maxOpacity: 0.16) }
  }
}

struct SportActiviteWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NeaSportAttributes.self) { ctx in
      VueVerrouillage(a: ctx.attributes, e: ctx.state)
        .activityBackgroundTint(Color.black.opacity(0.88))
        .activitySystemActionForegroundColor(W.rose)
        .widgetURL(URL(string: "nea://sport-en-cours"))
    } dynamicIsland: { ctx in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 3) {
            Libelle(texte: "DURÉE")
            Chrono(e: ctx.state).font(MMFont.number(26)).tracking(-0.7).foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.6)
          }
          .padding(.leading, 6)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 3) {
            Libelle(texte: "BPM")
            HStack(spacing: 7) {
              if part(ctx.state) > 0 { NeaAnneau(part: part(ctx.state)).frame(width: 18, height: 18) }
              Text(ctx.state.bpm > 0 ? "\(ctx.state.bpm)" : "--").font(MMFont.number(26)).foregroundStyle(.white)
                .contentTransition(.numericText(value: Double(ctx.state.bpm)))
            }
          }
          .padding(.trailing, 6)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 10) {
            if let fc = ctx.state.fc, fc.count > 1 {
              NeaLigneFC(valeurs: fc.map(Double.init)).frame(height: 28)
            }
            LigneBas(a: ctx.attributes, e: ctx.state)
          }
          .padding(.horizontal, 6)
        }
      } compactLeading: {
        if part(ctx.state) > 0 {
          NeaAnneau(part: part(ctx.state), epaisseur: 2.2).frame(width: 14, height: 14)
        } else {
          Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
        }
      } compactTrailing: {
        Chrono(e: ctx.state).font(MMFont.number(14, .regular)).foregroundStyle(.white).frame(maxWidth: 52)
      } minimal: {
        Image(systemName: ctx.attributes.symbole).foregroundStyle(W.rose)
      }
      .keylineTint(W.rose)
      .widgetURL(URL(string: "nea://sport-en-cours"))
    }
  }
}
