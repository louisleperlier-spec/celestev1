import SwiftUI

/// Séance en plein écran : échauffement, répétitions (05), validation (06), repos (07), pause (08), bilan (09).
struct SeanceView: View {
  @StateObject private var seance: SeanceEnCours

  init(s: SeanceMontre) {
    _seance = StateObject(wrappedValue: SeanceEnCours(s))
  }

  var body: some View {
    NavigationStack {
      // ZStack (pas Group) : onAppear / onDisappear portent sur l'écran de séance, pas sur chaque étape.
      ZStack {
        switch seance.phase {
        case .echauffement: EchauffementView(seance: seance)
        case .effort: EffortView(seance: seance)
        case .validation: ValidationView(seance: seance)
        case .repos: ReposView(seance: seance)
        case .pause: PauseView(seance: seance)
        case .bilan: BilanView(seance: seance)
        }
      }
      .navigationBarBackButtonHidden(true)
      .toolbar {
        if seance.phase != .pause && seance.phase != .bilan {
          ToolbarItem(placement: .topBarLeading) {
            Button {
              seance.pause()
            } label: {
              Image(systemName: "pause.fill").foregroundColor(Nea.rose)
            }
            .accessibilityLabel("Pause")
          }
        }
      }
    }
    .tint(Nea.rose)
    .onAppear { seance.commencer() }
    .onDisappear { seance.abandonner() }
  }
}

/// Échauffement : 5 minutes guidées avant le premier exercice.
struct EchauffementView: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Image(systemName: "figure.run").font(.system(size: 26)).foregroundColor(Nea.rose)
        GrosChiffre(texte: Nea.mmss(seance.echauffementReste), taille: 48)
        Text("Mobilise tes articulations, monte doucement le cardio.")
          .font(.system(size: 13))
          .foregroundColor(Nea.texte2)
          .multilineTextAlignment(.center)
        if let e = seance.s.exos.first {
          Text("Ensuite : \(e.nom)").font(.system(size: 13, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
        }
        Button {
          seance.finEchauffement()
        } label: {
          Label("Passer", systemImage: "forward.fill")
        }
        .buttonStyle(BoutonRose())
      }
    }
    .navigationTitle("Échauffement")
  }
}

/// Charge et FC sur une ligne.
struct LigneFC: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    HStack(spacing: 6) {
      if seance.charge > 0 {
        Image(systemName: "dumbbell.fill").foregroundColor(Nea.rose)
        Text("\(Nea.kg(seance.charge)) kg").font(.system(size: 15, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
        Rectangle().fill(Nea.texte2.opacity(0.4)).frame(width: 1, height: 18)
      }
      Image(systemName: "heart").foregroundColor(Nea.rose)
      Text(seance.entrainement.bpm > 0 ? "\(Int(seance.entrainement.bpm)) bpm" : "-- bpm")
        .font(.system(size: 15, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity)
  }
}

/// 05 · Répétitions : compteur estimé (ou minuteur pour un exercice en durée), « Fin de série ».
struct EffortView: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    ScrollView {
      VStack(spacing: 2) {
        Text("Série \(seance.serie + 1)/\(seance.exo.series)").font(.system(size: 15)).foregroundColor(Nea.texte2)
        if seance.enDuree {
          GrosChiffre(texte: Nea.mmss(seance.effortReste), taille: 50)
          Text("Tiens la position").font(.system(size: 14)).foregroundColor(Nea.texte2)
        } else {
          ZStack {
            Circle().fill(Nea.rose.opacity(0.18)).frame(width: 96, height: 96).blur(radius: 14)
            GrosChiffre(texte: String(format: "%02d", seance.compteur.reps), taille: 64)
          }
          Text("/ \(seance.exo.repsTxt) reps").font(.system(size: 17, weight: .semibold))
          Text(seance.compteur.disponible ? "Auto · à vérifier" : "Compte tes reps").font(.system(size: 12)).foregroundColor(Nea.texte2)
        }
        Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5).padding(.vertical, 4)
        LigneFC(seance: seance)
        Button {
          seance.finSerie()
        } label: {
          Label("Fin de série", systemImage: "stop.fill")
        }
        .buttonStyle(BoutonRose())
        .padding(.top, 4)
      }
    }
    .navigationTitle(seance.exo.nom)
  }
}

/// Bouton rond − / + bordé de rose.
struct Rond: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 22, weight: .bold))
      .foregroundColor(Nea.rose)
      .frame(width: 44, height: 44)
      .background(Circle().fill(Nea.carte))
      .overlay(Circle().stroke(Nea.rose.opacity(0.5), lineWidth: 1))
      .opacity(configuration.isPressed ? 0.7 : 1)
  }
}

/// 06 · Valider : répétitions −/+, charge modifiable, « Confirmer ».
struct ValidationView: View {
  @ObservedObject var seance: SeanceEnCours
  @State private var edition = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        Text("Répétitions").font(.system(size: 14)).foregroundColor(Nea.texte2)
        HStack {
          Button { seance.changerReps(-1) } label: { Image(systemName: "minus") }
            .buttonStyle(Rond())
          GrosChiffre(texte: "\(seance.reps)", taille: 44)
          Button { seance.changerReps(1) } label: { Image(systemName: "plus") }
            .buttonStyle(Rond())
        }
        if seance.exo.kg > 0 {
          Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5).padding(.vertical, 4)
          HStack {
            VStack(alignment: .leading, spacing: 0) {
              Text(seance.exo.double ? "Charge / haltère" : "Charge").font(.system(size: 14)).foregroundColor(Nea.texte2)
              Text("\(Nea.kg(seance.charge)) kg").font(.system(size: 22, weight: .bold))
            }
            Spacer(minLength: 4)
            if edition {
              Button { seance.changerCharge(-1) } label: { Image(systemName: "minus") }.buttonStyle(Rond())
              Button { seance.changerCharge(1) } label: { Image(systemName: "plus") }.buttonStyle(Rond())
            } else {
              Button { edition = true } label: { Image(systemName: "pencil") }.buttonStyle(Rond())
            }
          }
          Text("Corrige si nécessaire").font(.system(size: 12)).foregroundColor(Nea.texte2)
        }
        Button {
          seance.valider()
        } label: {
          Label("Confirmer", systemImage: "checkmark")
        }
        .buttonStyle(BoutonRose())
        .padding(.top, 4)
      }
    }
    .navigationTitle("Valider")
  }
}

/// 07 · Repos : temps restant, barre de progression, « À suivre », + 15 s et Passer.
struct ReposView: View {
  @ObservedObject var seance: SeanceEnCours

  private var part: Double {
    seance.reposTotal > 0 ? 1 - Double(max(0, seance.reposReste)) / Double(seance.reposTotal) : 0
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        GrosChiffre(texte: Nea.mmss(seance.reposReste), taille: 52)
        Text("restantes").font(.system(size: 15)).foregroundColor(Nea.texte2).frame(maxWidth: .infinity)
        GeometryReader { g in
          ZStack(alignment: .leading) {
            Capsule().fill(Nea.carte)
            Capsule().fill(Nea.rose).frame(width: g.size.width * CGFloat(part)).shadow(color: Nea.rose.opacity(0.6), radius: 4)
          }
        }
        .frame(height: 6)
        .padding(.vertical, 4)
        Text("À suivre").font(.system(size: 13)).foregroundColor(Nea.texte2)
        Text("\(seance.exo.nom) · \(seance.serie + 1)/\(seance.exo.series)")
          .font(.system(size: 15, weight: .semibold))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        HStack(spacing: 6) {
          Button("+15 s") { seance.plus15() }
            .buttonStyle(BoutonSombre())
          Button("Passer") { seance.passerRepos() }
            .buttonStyle(BoutonRose())
        }
        .padding(.top, 4)
      }
    }
    .navigationTitle("Repos")
  }
}

/// 08 · En pause : temps écoulé, Reprendre, Terminer.
struct PauseView: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    ScrollView {
      VStack(spacing: 4) {
        Text(seance.s.titre).font(.system(size: 15)).foregroundColor(Nea.texte2).lineLimit(1)
        GrosChiffre(texte: Nea.mmss(seance.secondes), taille: 52)
        Text("temps écoulé").font(.system(size: 15)).foregroundColor(Nea.texte2)
        Button {
          seance.reprendre()
        } label: {
          Label("Reprendre", systemImage: "play.fill")
        }
        .buttonStyle(BoutonRose())
        .padding(.top, 6)
        Button {
          seance.terminerMaintenant()
        } label: {
          Label("Terminer", systemImage: "stop.fill")
        }
        .buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("En pause")
  }
}

/// 09 · Bilan : durée totale, séries, FC moyenne, énergie, mot du coach, « Enregistrer ».
struct BilanView: View {
  @ObservedObject var seance: SeanceEnCours
  @ObservedObject private var donnees = Donnees.partagees
  @Environment(\.dismiss) private var fermer

  var body: some View {
    ScrollView {
      VStack(spacing: 2) {
        Text(seance.s.titre).font(.system(size: 17, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        GrosChiffre(texte: Nea.mmss(seance.secondes), taille: 46)
        Text("durée totale").font(.system(size: 14)).foregroundColor(Nea.texte2)
        VStack(spacing: 0) {
          LigneValeur(titre: "Séries", valeur: "\(seance.seriesFaites)")
          LigneValeur(titre: "FC moyenne", valeur: seance.entrainement.fcMoy > 0 ? "\(Int(seance.entrainement.fcMoy)) bpm" : "--")
          LigneValeur(titre: "Énergie estimée", valeur: "\(Int(seance.kcal)) kcal")
        }
        .padding(.top, 4)
        HStack(spacing: 8) {
          Image(donnees.etat?.coach ?? "axel").resizable().scaledToFit().frame(width: 38, height: 38)
          Text("Bien joué, \(donnees.etat?.prenom ?? "") !").font(.system(size: 15, weight: .semibold)).lineLimit(2).minimumScaleFactor(0.7)
          Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        Button {
          seance.enregistrer { fermer() }
        } label: {
          Label(seance.enregistree ? "Enregistrement…" : "Enregistrer", systemImage: "checkmark")
        }
        .buttonStyle(BoutonRose())
        .disabled(seance.enregistree)
      }
    }
    .navigationTitle("Bilan")
  }
}

/// Petite case chiffrée (vélo, progrès).
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
