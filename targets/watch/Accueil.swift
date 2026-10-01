import SwiftUI

/// Accueil = maquette 01 · Choisir : « Entraînement » (Musculation, Course, Vélo) et Démarrer, puis le reste de l'app.
/// Musculation lance la prochaine séance du programme ; Course et Vélo, une sortie GPS.
struct AccueilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @AppStorage("nea.activite") private var choix = TypeActivite.muscu.rawValue
  @State private var lancement: SeanceMontre?
  @State private var sortie: TypeActivite?
  @State private var voirSeances = false
  @State private var voirChoisie = false

  private var type: TypeActivite { TypeActivite(rawValue: choix) ?? .muscu }

  private func sousTitre(_ t: TypeActivite) -> String {
    switch t {
    case .muscu:
      if let s = donnees.prochaine { return "\(s.titre) · \(Int(s.min)) min" }
      return donnees.etat == nil ? "Ouvre NÉA sur l'iPhone" : "Choisis ta séance"
    case .course, .velo:
      return "GPS · conquiers des territoires"
    }
  }

  private func demarrer() {
    switch type {
    case .muscu:
      if let s = donnees.prochaine {
        lancement = s
      } else {
        voirSeances = true
      }
    case .course, .velo:
      sortie = type
    }
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        if let c = donnees.etat?.choisie {
          BlocMaSeance(s: c, programme: donnees.etat?.choisieProg ?? "", demarrer: { lancement = c })
            .padding(.bottom, 8)
        }
        Text("Entraînement").font(.system(size: 24, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        ForEach(TypeActivite.allCases) { t in
          Button {
            choix = t.rawValue
            Vibre.jouer(.click)
          } label: {
            ChoixActivite(type: t, sousTitre: sousTitre(t), choisi: t == type)
          }
          .buttonStyle(.plain)
        }
        Button(action: demarrer) {
          Text("Démarrer")
        }
        .buttonStyle(BoutonRose())
        .padding(.top, 2)

        Text("Plus").font(.system(size: 14)).foregroundColor(Nea.texte2).padding(.top, 8)
        NavigationLink { SeancesView() } label: { LigneMenu(icone: "calendar", titre: "Mes séances") }.buttonStyle(.plain)
        NavigationLink { RecupView() } label: {
          LigneMenu(icone: "heart.fill", titre: "Récupération", valeur: donnees.etat?.score.map { "\($0)" } ?? "")
        }
        .buttonStyle(.plain)
        NavigationLink { RespirationView() } label: { LigneMenu(icone: "wind", titre: "Respiration") }.buttonStyle(.plain)
        NavigationLink { CoachView() } label: { LigneMenu(icone: "person.crop.circle", titre: "Mon coach") }.buttonStyle(.plain)
        NavigationLink { ProgresView() } label: { LigneMenu(icone: "chart.bar.fill", titre: "Progrès") }.buttonStyle(.plain)
        NavigationLink { ReglagesView() } label: { LigneMenu(icone: "gearshape.fill", titre: "Réglages") }.buttonStyle(.plain)
      }
    }
    .navigationTitle("NÉA")
    .navigationDestination(for: SeanceMontre.self) { s in
      DetailView(s: s)
    }
    .navigationDestination(isPresented: $voirSeances) {
      SeancesView()
    }
    .navigationDestination(isPresented: $voirChoisie) {
      MaSeanceView()
    }
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
    .fullScreenCover(item: $sortie) { t in
      SortieView(fcMax: donnees.etat?.fcMax ?? 190, course: t == .course)
    }
    // « Ouvrir sur la montre » sur l'iPhone : « Ma séance ».
    .onReceive(donnees.$ouvrirChoisie) { o in
      guard o else { return }
      donnees.ouvrirChoisie = false
      if lancement == nil && sortie == nil { voirChoisie = true }
    }
    // Complication « Ma séance » : ouvre directement la séance du jour.
    .onReceive(donnees.$demandeSeance) { d in
      guard d, let s = donnees.prochaine else { return }
      donnees.demandeSeance = false
      lancement = s
    }
  }
}

/// Maquette « Du téléphone au poignet » · 02 : la séance choisie sur l'iPhone, Démarrer, Voir les exercices.
struct BlocMaSeance: View {
  let s: SeanceMontre
  let programme: String
  let demarrer: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      VStack(alignment: .leading, spacing: 2) {
        Text("Ma séance").font(.system(size: 24, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        HStack(spacing: 6) {
          Image(systemName: "link.circle.fill").font(.system(size: 16)).foregroundColor(Nea.rose)
          Text("Liée à l'iPhone").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
      }
      VStack(alignment: .leading, spacing: 2) {
        if !programme.isEmpty {
          Text(programme).font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.rose).lineLimit(1).minimumScaleFactor(0.7)
        }
        Text(s.titre).font(.system(size: 19, weight: .bold)).lineLimit(3).minimumScaleFactor(0.7)
        Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 14)).foregroundColor(Nea.texte2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(12)
      .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte))
      Button(action: demarrer) {
        Text("Démarrer")
      }
      .buttonStyle(BoutonRose())
      NavigationLink(value: s) {
        Text("Voir les exercices")
      }
      .buttonStyle(BoutonSombre())
    }
  }
}

/// « Ma séance » seule (ouverte par l'iPhone).
struct MaSeanceView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      if let c = donnees.etat?.choisie {
        BlocMaSeance(s: c, programme: donnees.etat?.choisieProg ?? "", demarrer: { lancement = c })
      } else {
        Text("Choisis une séance sur ton iPhone, puis « Ouvrir sur la montre ».")
          .font(.system(size: 15))
          .foregroundColor(Nea.texte2)
      }
    }
    .navigationTitle("NÉA")
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
  }
}

/// Icône d'une séance selon son titre (haut du corps, corps entier…).
func iconeSeance(_ titre: String) -> String {
  let t = titre.lowercased()
  if t.contains("haut") || t.contains("bras") || t.contains("pec") || t.contains("dos") { return "figure.strengthtraining.traditional" }
  if t.contains("corps entier") || t.contains("full") || t.contains("cardio") || t.contains("hiit") { return "figure.run" }
  return "dumbbell.fill"
}

/// Carte d'une séance : icône rose, titre, durée et jour.
struct CarteSeance: View {
  let s: SeanceMontre
  var enAvant = false

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: iconeSeance(s.titre))
        .font(.system(size: 20))
        .foregroundColor(Nea.rose)
        .frame(width: 26)
      VStack(alignment: .leading, spacing: 1) {
        Text(s.titre).font(.system(size: 16, weight: .bold)).lineLimit(2).minimumScaleFactor(0.8)
        Text("\(Int(s.min)) min · \(Nea.quand(s.jour))").font(.system(size: 13)).foregroundColor(Nea.texte2)
      }
      Spacer(minLength: 0)
      if enAvant {
        Circle().fill(Nea.rose).frame(width: 9, height: 9).shadow(color: Nea.rose, radius: 4)
      } else {
        Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.texte2)
      }
    }
    .padding(.vertical, 11)
    .padding(.horizontal, 12)
    .background(
      RoundedRectangle(cornerRadius: 18)
        .fill(enAvant ? Nea.rose.opacity(0.18) : Nea.carte)
    )
    .overlay(RoundedRectangle(cornerRadius: 18).stroke(enAvant ? Nea.rose.opacity(0.6) : .clear, lineWidth: 1))
  }
}

/// 03 · Séances de la semaine (celle du jour en avant), puis Explorer.
struct SeancesView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        ForEach(donnees.etat?.semaine ?? []) { s in
          NavigationLink(value: s) {
            CarteSeance(s: s, enAvant: s.jour == Nea.aujourdhui())
          }
          .buttonStyle(.plain)
        }
        if !(donnees.etat?.explorer ?? []).isEmpty {
          NavigationLink {
            ExplorerView()
          } label: {
            Label("Explorer", systemImage: "safari")
          }
          .buttonStyle(BoutonSombre())
        }
      }
    }
    .navigationTitle("Séances")
  }
}

/// Explorer : séances prêtes accessibles, proches de ton niveau.
struct ExplorerView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        ForEach(donnees.etat?.explorer ?? []) { s in
          NavigationLink(value: s) {
            CarteSeance(s: s)
          }
          .buttonStyle(.plain)
        }
      }
    }
    .navigationTitle("Explorer")
  }
}

/// 04 · Détail : échauffement, exercices, « Voir tous les exercices », Démarrer.
struct DetailView: View {
  let s: SeanceMontre
  @State private var tout = false
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        HStack(alignment: .top) {
          VStack(alignment: .leading, spacing: 2) {
            Text(s.titre).font(.system(size: 20, weight: .bold)).lineLimit(3).minimumScaleFactor(0.7)
            Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 14)).foregroundColor(Nea.texte2)
          }
          Spacer(minLength: 4)
          Image(systemName: iconeSeance(s.titre))
            .font(.system(size: 24))
            .foregroundColor(Nea.rose)
            .shadow(color: Nea.rose.opacity(0.7), radius: 6)
        }
        LigneExo(icone: "figure.run", nom: "Échauffement", volume: "\(DUREE_ECHAUFFEMENT / 60) min")
        ForEach(Array((tout ? s.exos : Array(s.exos.prefix(2))).enumerated()), id: \.offset) { _, e in
          LigneExo(icone: "figure.strengthtraining.functional", nom: e.nom, volume: e.volume)
        }
        if s.exos.count > 2 && !tout {
          Button {
            tout = true
          } label: {
            HStack(spacing: 8) {
              Image(systemName: "list.bullet").foregroundColor(Nea.rose)
              Text("Voir tous les exercices").font(.system(size: 14))
              Spacer()
              Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.texte2)
            }
          }
          .buttonStyle(.plain)
          .padding(.vertical, 6)
          .padding(.horizontal, 4)
        }
        Button {
          lancement = s
        } label: {
          Label("Démarrer", systemImage: "play.fill")
        }
        .buttonStyle(BoutonRose())
      }
    }
    .navigationTitle("Séance")
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
  }
}

/// Ligne d'exercice : icône rose, nom, volume.
struct LigneExo: View {
  let icone: String
  let nom: String
  let volume: String

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: icone).font(.system(size: 16)).foregroundColor(Nea.rose).frame(width: 22)
      Text(nom).font(.system(size: 14, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      Text(volume).font(.system(size: 13)).foregroundColor(Nea.texte2)
    }
    .padding(.vertical, 9)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
  }
}
