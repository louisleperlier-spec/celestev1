import SwiftUI

/// 02 · Accueil : prochaine séance (Démarrer), puis le menu de l'app.
struct AccueilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        if let e = donnees.etat {
          if let s = donnees.prochaine {
            VStack(alignment: .leading, spacing: 2) {
              Text("Ta prochaine séance").font(.system(size: 14)).foregroundColor(Nea.texte2)
              NavigationLink(value: s) {
                VStack(alignment: .leading, spacing: 2) {
                  Text(s.titre).font(.system(size: 22, weight: .bold)).lineLimit(2).minimumScaleFactor(0.7)
                  Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 15)).foregroundColor(Nea.texte2)
                }
              }
              .buttonStyle(.plain)
              HStack(spacing: 8) {
                Image(e.coach).resizable().scaledToFit().frame(width: 40, height: 40).shadow(color: Nea.rose.opacity(0.5), radius: 6)
                Text("Avec \(e.coachInfo?.nom ?? "ton coach")").font(.system(size: 14)).foregroundColor(Nea.texte2)
              }
              .padding(.top, 2)
            }
            Button {
              lancement = s
            } label: {
              Label("Démarrer", systemImage: "play.fill")
            }
            .buttonStyle(BoutonRose())
          }
          NavigationLink { SeancesView() } label: { LigneMenu(icone: "calendar", titre: "Mes séances") }.buttonStyle(.plain)
          NavigationLink { VeloView() } label: { LigneMenu(icone: "bicycle", titre: "Vélo") }.buttonStyle(.plain)
          NavigationLink { VeloView(course: true) } label: { LigneMenu(icone: "figure.run", titre: "Course") }.buttonStyle(.plain)
          NavigationLink { RecupView() } label: {
            LigneMenu(icone: "heart.fill", titre: "Récupération", valeur: e.score.map { "\($0)" } ?? "")
          }
          .buttonStyle(.plain)
          NavigationLink { RespirationView() } label: { LigneMenu(icone: "wind", titre: "Respiration") }.buttonStyle(.plain)
          NavigationLink { CoachView() } label: { LigneMenu(icone: "person.crop.circle", titre: "Mon coach") }.buttonStyle(.plain)
          NavigationLink { ProgresView() } label: { LigneMenu(icone: "chart.bar.fill", titre: "Progrès") }.buttonStyle(.plain)
          NavigationLink { ReglagesView() } label: { LigneMenu(icone: "gearshape.fill", titre: "Réglages") }.buttonStyle(.plain)
        } else {
          Text("Ouvre NÉA sur ton iPhone pour recevoir tes séances.")
            .font(.system(size: 15))
            .foregroundColor(Nea.texte2)
          NavigationLink { ReglagesView() } label: { LigneMenu(icone: "gearshape.fill", titre: "Réglages") }.buttonStyle(.plain)
        }
      }
    }
    .navigationTitle("NÉA")
    .navigationDestination(for: SeanceMontre.self) { s in
      DetailView(s: s)
    }
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
    // Complication « Ma séance » : ouvre directement la séance du jour.
    .onReceive(donnees.$demandeSeance) { d in
      guard d, let s = donnees.prochaine else { return }
      donnees.demandeSeance = false
      lancement = s
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
