import SwiftUI

/// Séance en plein écran, comme l'app Exercice : Commandes ← Suivre → Séance guidée (glisser), puis le bilan.
/// La séance guidée (échauffement, répétitions, validation, repos, pause) revient au premier plan à chaque étape.
struct SeanceView: View {
  @StateObject private var seance: SeanceEnCours
  @State private var page = 1
  @Environment(\.dismiss) private var fermer

  init(s: SeanceMontre) {
    _seance = StateObject(wrappedValue: SeanceEnCours(s))
  }

  private var titre: String {
    page == 0 ? "Commandes" : page == 1 ? "Musculation" : seance.titreEtape
  }

  var body: some View {
    NavigationStack {
      // ZStack (pas Group) : onAppear / onDisappear portent sur l'écran de séance, pas sur chaque étape.
      ZStack {
        if seance.phase == .bilan {
          BilanView(seance: seance)
        } else {
          TabView(selection: $page) {
            CommandesView(
              enPause: seance.phase == .pause,
              segment: seance.segment,
              terminer: { seance.terminerMaintenant() },
              pause: { seance.phase == .pause ? seance.reprendre() : seance.pause() },
              nouveau: { seance.terminerEtEnregistrer { fermer() } },
              nouveauSegment: { seance.nouveauSegment() }
            )
            .tag(0)
            SuivreSeance(seance: seance, voirSeance: { page = 2 })
              .tag(1)
            GuideSeance(seance: seance)
              .tag(2)
          }
          .tabViewStyle(.page)
          .navigationTitle(titre)
        }
      }
      .navigationBarBackButtonHidden(true)
    }
    .tint(Nea.rose)
    .onAppear { seance.commencer() }
    .onDisappear { seance.abandonner() }
    .onChange(of: seance.phase) { _, p in
      // Nouvelle étape à faire (série, validation, repos) : la séance guidée revient devant.
      if p != .pause && p != .bilan { page = 2 }
    }
  }
}

/// Maquette 02 · Suivre : chrono, kcal actives, kcal totales, FC ; étape en cours (touchable).
struct SuivreSeance: View {
  @ObservedObject var seance: SeanceEnCours
  let voirSeance: () -> Void

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        Chrono(secondes: seance.secondes)
        LigneMesure(valeur: "\(Int(seance.entrainement.kcal))", unite: "kcal\nactives")
        LigneMesure(valeur: "\(Int(seance.entrainement.kcal + seance.entrainement.kcalRepos))", unite: "kcal\ntotales")
        LigneMesure(valeur: seance.entrainement.bpm > 0 ? "\(Int(seance.entrainement.bpm))" : "--", unite: "bpm", coeur: true)
        if seance.segment > 1 {
          Text("Segment \(seance.segment) · \(Nea.duree(seance.secondesSegment))")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(Nea.rose)
            .padding(.top, 2)
        }
        Button(action: voirSeance) {
          HStack(spacing: 4) {
            Text(seance.etape).font(.system(size: 13, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 2)
            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundColor(Nea.texte2)
          }
          .padding(.vertical, 6)
          .padding(.horizontal, 10)
          .background(Capsule().fill(Nea.carte))
        }
        .buttonStyle(.plain)
        .padding(.top, 6)
      }
    }
  }
}

/// Séance guidée : l'écran de l'étape en cours.
struct GuideSeance: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    switch seance.phase {
    case .echauffement: EchauffementView(seance: seance)
    case .effort: EffortView(seance: seance)
    case .validation: ValidationView(seance: seance)
    case .repos: ReposView(seance: seance)
    case .pause, .bilan: PauseView(seance: seance)
    }
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
      Image(systemName: "heart.fill").foregroundColor(Nea.rose)
      Text(seance.entrainement.bpm > 0 ? "\(Int(seance.entrainement.bpm)) bpm" : "-- bpm")
        .font(.system(size: 15, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity)
  }
}

/// 05 · Répétitions (maquette « Suivre les exercices ») : exercice n/N, reps comptées / visées (ou minuteur), série,
/// charge et FC, « Fin de série ».
struct EffortView: View {
  @ObservedObject var seance: SeanceEnCours

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 2) {
        Text("Exercice \(seance.ex + 1)/\(seance.s.exos.count)").font(.system(size: 15)).foregroundColor(Nea.texte2)
        if seance.enDuree {
          GrosChiffre(texte: Nea.mmss(seance.effortReste), taille: 50)
          Text("Tiens la position").font(.system(size: 14)).foregroundColor(Nea.texte2)
        } else {
          HStack(alignment: .lastTextBaseline, spacing: 6) {
            Text(String(format: "%02d", seance.compteur.reps))
              .font(.system(size: 64, weight: .heavy, design: .rounded))
              .monospacedDigit()
              .lineLimit(1)
              .minimumScaleFactor(0.6)
            Text("/ \(seance.exo.repsTxt) reps").font(.system(size: 18, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.6)
          }
        }
        HStack(spacing: 4) {
          Text("Série \(seance.serie + 1)/\(seance.exo.series)").font(.system(size: 15)).foregroundColor(Nea.texte2)
          if !seance.enDuree {
            Text(seance.compteur.disponible ? "· auto" : "· compte tes reps").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
        }
        Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5).padding(.vertical, 4)
        LigneFC(seance: seance)
        Button {
          seance.finSerie()
        } label: {
          Text("Fin de série")
        }
        .buttonStyle(BoutonRose())
        .padding(.top, 4)
      }
    }
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
