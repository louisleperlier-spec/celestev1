import SwiftUI

/// Séance en plein écran : effort, validation, repos, bilan.
struct SeanceView: View {
  @StateObject private var seance: SeanceEnCours

  init(s: SeanceMontre) {
    _seance = StateObject(wrappedValue: SeanceEnCours(s))
  }

  var body: some View {
    // ZStack (pas Group) : onAppear / onDisappear portent sur l'écran de séance, pas sur chaque étape.
    ZStack {
      switch seance.phase {
      case .effort: EffortView(seance: seance)
      case .validation: ValidationView(seance: seance)
      case .repos: ReposView(seance: seance)
      case .bilan: BilanView(seance: seance)
      }
    }
    .onAppear { seance.commencer() }
    .onDisappear { seance.abandonner() }
  }
}

/// Bloc FC + charge.
struct LigneFC: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    HStack(spacing: 6) {
      Image(systemName: "heart").foregroundColor(.white)
      Text(seance.entrainement.bpm > 0 ? "\(Int(seance.entrainement.bpm)) bpm" : "-- bpm")
        .font(.system(size: 15, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      if seance.charge > 0 {
        Rectangle().fill(Nea.texte2.opacity(0.4)).frame(width: 1, height: 18)
        Image(systemName: "dumbbell").foregroundColor(.white)
        Text("\(Nea.kg(seance.charge)) kg")
          .font(.system(size: 15, weight: .semibold))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
    }
    .frame(maxWidth: .infinity)
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}

/// 04 · Répétitions : compteur estimé (ou minuteur pour un exercice en durée), « Fin de série ».
struct EffortView: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        Marque()
        Text(seance.exo.nom).font(.system(size: 20, weight: .bold)).lineLimit(2).minimumScaleFactor(0.7)
        Text("Série \(seance.serie + 1) sur \(seance.exo.series)").font(.system(size: 15)).foregroundColor(Nea.texte2)
        if seance.enDuree {
          Text(Nea.mmss(seance.effortReste))
            .font(.system(size: 50, weight: .heavy, design: .rounded))
            .monospacedDigit()
            .frame(maxWidth: .infinity)
          Text("Tiens la position").font(.system(size: 14)).foregroundColor(Nea.texte2).frame(maxWidth: .infinity)
        } else {
          Text(String(format: "%02d", seance.compteur.reps))
            .font(.system(size: 64, weight: .heavy, design: .rounded))
            .monospacedDigit()
            .frame(maxWidth: .infinity)
          Text("/ \(seance.exo.repsTxt) reps").font(.system(size: 17, weight: .semibold)).foregroundColor(Nea.texte2).frame(maxWidth: .infinity)
          HStack(spacing: 6) {
            Image(systemName: "dot.radiowaves.left.and.right").foregroundColor(Nea.rose)
            Text(seance.compteur.disponible ? "Détection auto · estimée" : "Compte tes reps").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
          .frame(maxWidth: .infinity)
        }
        LigneFC(seance: seance).padding(.top, 4)
        Button("Fin de série") { seance.finSerie() }
          .buttonStyle(BoutonRose())
          .padding(.top, 2)
      }
    }
  }
}

/// Bouton rond − / +.
struct Rond: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 22, weight: .bold))
      .foregroundColor(.white)
      .frame(width: 44, height: 44)
      .background(Circle().fill(Nea.carte))
      .opacity(configuration.isPressed ? 0.7 : 1)
  }
}

/// 05 · Validation : reps corrigées, charge modifiable, « Valider la série ».
struct ValidationView: View {
  @ObservedObject var seance: SeanceEnCours
  @State private var edition = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Text("Série terminée").font(.system(size: 20, weight: .bold))
        Text("Corrige si nécessaire").font(.system(size: 14)).foregroundColor(Nea.texte2)
        HStack {
          Button { seance.changerReps(-1) } label: { Image(systemName: "minus") }
            .buttonStyle(Rond())
          VStack(spacing: 0) {
            Text("\(seance.reps)")
              .font(.system(size: 44, weight: .heavy, design: .rounded))
              .monospacedDigit()
            Text("reps").font(.system(size: 13)).foregroundColor(Nea.texte2)
          }
          .frame(maxWidth: .infinity)
          Button { seance.changerReps(1) } label: { Image(systemName: "plus") }
            .buttonStyle(Rond())
        }
        if seance.exo.kg > 0 {
          HStack(spacing: 8) {
            Image(systemName: "dumbbell.fill").foregroundColor(.white)
            VStack(alignment: .leading, spacing: 0) {
              Text(seance.exo.double ? "Charge / haltère" : "Charge").font(.system(size: 12)).foregroundColor(Nea.texte2)
              Text("\(Nea.kg(seance.charge)) kg").font(.system(size: 18, weight: .bold))
            }
            Spacer(minLength: 0)
            if edition {
              Button { seance.changerCharge(-1) } label: { Image(systemName: "minus") }
                .buttonStyle(.plain)
                .frame(width: 30, height: 30)
              Button { seance.changerCharge(1) } label: { Image(systemName: "plus") }
                .buttonStyle(.plain)
                .frame(width: 30, height: 30)
            } else {
              Button { edition = true } label: { Image(systemName: "pencil").foregroundColor(Nea.texte2) }
                .buttonStyle(.plain)
            }
          }
          .padding(10)
          .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
        }
        Button("Valider la série") { seance.valider() }
          .buttonStyle(BoutonRose())
      }
    }
  }
}

/// 06 · Repos : anneau, FC, « À suivre », + 15 s et Passer.
struct ReposView: View {
  @ObservedObject var seance: SeanceEnCours

  private var part: Double {
    seance.reposTotal > 0 ? Double(max(0, seance.reposReste)) / Double(seance.reposTotal) : 0
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        Marque()
        Text("Récupération").font(.system(size: 20, weight: .bold))
        HStack(spacing: 6) {
          Image(systemName: "heart")
          Text(seance.entrainement.bpm > 0 ? "\(Int(seance.entrainement.bpm)) bpm" : "-- bpm")
        }
        .font(.system(size: 14))
        .foregroundColor(Nea.texte2)
        ZStack {
          Circle().stroke(Nea.carte, lineWidth: 8)
          Circle()
            .trim(from: 0, to: part)
            .stroke(Nea.rose, style: StrokeStyle(lineWidth: 8, lineCap: .round))
            .rotationEffect(.degrees(-90))
          VStack(spacing: 0) {
            Text(Nea.mmss(seance.reposReste))
              .font(.system(size: 28, weight: .heavy, design: .rounded))
              .monospacedDigit()
            Text("sur \(seance.reposTotal) s").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
        }
        .frame(width: 112, height: 112)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
        Text("À suivre").font(.system(size: 12)).foregroundColor(Nea.texte2)
        Text("\(seance.exo.nom) · Série \(seance.serie + 1)/\(seance.exo.series)")
          .font(.system(size: 14, weight: .semibold))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        HStack(spacing: 6) {
          Button("+ 15 s") { seance.plus15() }
            .buttonStyle(BoutonSombre())
          Button("Passer") { seance.passerRepos() }
            .buttonStyle(BoutonSombre(couleur: Nea.rose))
        }
      }
    }
  }
}

/// 07 · Bilan : durée, séries, FC moyenne, énergie, mot du coach, « Enregistrer ».
struct BilanView: View {
  @ObservedObject var seance: SeanceEnCours
  @ObservedObject private var donnees = Donnees.partagees
  @Environment(\.dismiss) private var fermer

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        HStack(spacing: 6) {
          Image(systemName: "checkmark.circle.fill").font(.system(size: 26)).foregroundColor(Nea.rose)
          VStack(alignment: .leading, spacing: 0) {
            Text("Séance terminée").font(.system(size: 17, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
            Text(seance.s.titre).font(.system(size: 13)).foregroundColor(Nea.texte2).lineLimit(1)
          }
        }
        HStack(spacing: 6) {
          Tuile(titre: "Durée", valeur: Nea.mmss(seance.secondes))
          Tuile(titre: "Séries", valeur: "\(seance.seriesFaites)")
        }
        HStack(spacing: 6) {
          Tuile(titre: "FC moyenne", valeur: seance.entrainement.fcMoy > 0 ? "\(Int(seance.entrainement.fcMoy)) bpm" : "--")
          Tuile(titre: "Énergie estimée", valeur: "\(Int(seance.kcal)) kcal")
        }
        HStack(spacing: 8) {
          Image(donnees.etat?.coach ?? "axel").resizable().scaledToFit().frame(width: 40, height: 40)
          Text("Bien joué, \(donnees.etat?.prenom ?? "").").font(.system(size: 15, weight: .semibold)).lineLimit(2).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
        Button(seance.enregistree ? "Enregistrement…" : "Enregistrer") {
          seance.enregistrer { fermer() }
        }
        .buttonStyle(BoutonRose())
        .disabled(seance.enregistree)
      }
    }
  }
}

struct Tuile: View {
  let titre: String
  let valeur: String

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(titre).font(.system(size: 11)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
      Text(valeur).font(.system(size: 20, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.5)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 12).fill(Nea.carte))
  }
}
