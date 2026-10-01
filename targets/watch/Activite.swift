import SwiftUI

/// Les trois activités de l'écran « Entraînement » (maquette 01 · Choisir).
enum TypeActivite: String, CaseIterable, Identifiable {
  case muscu, course, velo

  var id: String { rawValue }

  var titre: String {
    switch self {
    case .muscu: return "Musculation"
    case .course: return "Course"
    case .velo: return "Vélo"
    }
  }

  var icone: String {
    switch self {
    case .muscu: return "dumbbell.fill"
    case .course: return "figure.run"
    case .velo: return "figure.outdoor.cycle"
    }
  }
}

/// Ligne d'activité à choisir : icône orange, titre, sous-titre ; bordée d'orange quand elle est choisie.
struct ChoixActivite: View {
  let type: TypeActivite
  var sousTitre: String = ""
  let choisi: Bool

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: type.icone)
        .font(.system(size: 22, weight: .semibold))
        .foregroundColor(Nea.rose)
        .frame(width: 30)
      VStack(alignment: .leading, spacing: 1) {
        Text(type.titre).font(.system(size: 17, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
        if !sousTitre.isEmpty {
          Text(sousTitre).font(.system(size: 12)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
        }
      }
      Spacer(minLength: 0)
    }
    .padding(.vertical, 11)
    .padding(.horizontal, 12)
    .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte))
    .overlay(RoundedRectangle(cornerRadius: 18).stroke(choisi ? Nea.rose : Color.clear, lineWidth: 2))
    .contentShape(RoundedRectangle(cornerRadius: 18))
  }
}

/// Mesure de l'écran « Suivre » : chiffre blanc, icône éventuelle, unité grise en capitales.
struct LigneMesure: View {
  let valeur: String
  let unite: String
  var coeur = false

  var body: some View {
    HStack(alignment: .center, spacing: 6) {
      Text(valeur)
        .font(.system(size: 34, weight: .bold, design: .rounded))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      if coeur {
        Image(systemName: "heart.fill").font(.system(size: 22)).foregroundColor(Nea.rose)
      }
      Text(unite.uppercased())
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(Nea.texte2)
        .lineLimit(2)
        .minimumScaleFactor(0.7)
      Spacer(minLength: 0)
    }
  }
}

/// Grand chronomètre orange de l'écran « Suivre ».
struct Chrono: View {
  let secondes: Int

  var body: some View {
    Text(Nea.duree(secondes))
      .font(.system(size: 50, weight: .heavy, design: .rounded))
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.5)
      .foregroundColor(Nea.rose)
  }
}

/// Bouton de l'écran « Commandes » : pavé orange sombre, icône orange, libellé dessous.
struct BoutonCommande: View {
  let icone: String
  let titre: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: 4) {
        RoundedRectangle(cornerRadius: 20)
          .fill(Nea.rose.opacity(0.22))
          .frame(height: 52)
          .overlay(Image(systemName: icone).font(.system(size: 26, weight: .bold)).foregroundColor(Nea.rose))
        Text(titre).font(.system(size: 14)).lineLimit(1).minimumScaleFactor(0.7)
      }
    }
    .buttonStyle(.plain)
    .accessibilityLabel(titre)
  }
}

/// Maquette 03 · Contrôler : Terminer, Pause / Reprendre, Nouveau (enregistre puis revient au choix), Segment.
struct CommandesView: View {
  let enPause: Bool
  let segment: Int
  let terminer: () -> Void
  let pause: () -> Void
  let nouveau: () -> Void
  let nouveauSegment: () -> Void

  var body: some View {
    ScrollView {
      VStack(spacing: 8) {
        HStack(spacing: 8) {
          BoutonCommande(icone: "xmark", titre: "Terminer", action: terminer)
          BoutonCommande(icone: enPause ? "play.fill" : "pause.fill", titre: enPause ? "Reprendre" : "Pause", action: pause)
        }
        HStack(spacing: 8) {
          BoutonCommande(icone: "plus", titre: "Nouveau", action: nouveau)
          BoutonCommande(icone: segment <= 50 ? "\(segment).circle" : "flag.fill", titre: "Segment", action: nouveauSegment)
        }
      }
    }
  }
}
