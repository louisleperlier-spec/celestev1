import SwiftUI

/// Accueil (maquette 1) : « Bonjour Louis », anneaux Récupération / Effort, prochaine séance (lecture), raccourcis Programme · Dehors ·
/// Sommeil ; dessous, Ma séance / Ma rando liées à l'iPhone et le reste de l'app.
struct AccueilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lancement: SeanceMontre?
  @State private var sortie: TypeActivite?
  @State private var voirSeances = false
  @State private var voirChoisie = false
  @State private var voirRando = false
  @State private var voirRespiration = false
  @State private var voirRecup = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Text("Bonjour \(donnees.etat?.prenom ?? "")").font(.system(size: 20, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
        HStack(spacing: 10) {
          AnneauChiffre(valeur: donnees.etat?.bilan?.recup ?? 0, titre: "Récup.")
          AnneauChiffre(valeur: donnees.etat?.bilan?.effort ?? 0, titre: "Effort")
        }
        .frame(maxWidth: .infinity)
        if let s = donnees.prochaine {
          Button { lancement = s } label: { CarteProchaine(s: s) }.buttonStyle(.plain)
        } else {
          Text(donnees.etat == nil ? "Ouvre NÉA sur l'iPhone" : "Pas de séance prévue").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
        HStack(spacing: 6) {
          NavigationLink { ProgrammeView() } label: { Raccourci(icone: "dumbbell.fill", actif: true) }.buttonStyle(.plain)
          NavigationLink { DehorsView(sortie: $sortie) } label: { Raccourci(icone: "figure.run") }.buttonStyle(.plain)
          NavigationLink { SommeilView() } label: { Raccourci(icone: "moon.fill") }.buttonStyle(.plain)
        }
        if let r = donnees.etat?.rando {
          BlocMaRando(r: r, demarrer: { sortie = .rando }).padding(.top, 6)
        }
        if let c = donnees.etat?.choisie {
          BlocMaSeance(s: c, programme: donnees.etat?.choisieProg ?? "", demarrer: { lancement = c }).padding(.top, 6)
        }
        Text("Plus").font(.system(size: 14)).foregroundColor(Nea.texte2).padding(.top, 6)
        NavigationLink { RecupView() } label: {
          LigneMenu(icone: "heart.fill", titre: "Ton état", valeur: donnees.etat?.score.map { "\($0)" } ?? "")
        }
        .buttonStyle(.plain)
        NavigationLink { RespirationView() } label: { LigneMenu(icone: "wind", titre: "Respiration") }.buttonStyle(.plain)
        NavigationLink { ProgresView() } label: { LigneMenu(icone: "chart.bar.fill", titre: "Tes progrès") }.buttonStyle(.plain)
        NavigationLink { CoachView() } label: { LigneMenu(icone: "person.crop.circle", titre: "Coach") }.buttonStyle(.plain)
        NavigationLink { ReglagesView() } label: { LigneMenu(icone: "gearshape.fill", titre: "Réglages") }.buttonStyle(.plain)
      }
    }
    .navigationTitle("NÉA")
    .navigationDestination(for: SeanceMontre.self) { s in
      DetailView(s: s)
    }
    .navigationDestination(isPresented: $voirSeances) {
      ProgrammeView()
    }
    .navigationDestination(isPresented: $voirChoisie) {
      MaSeanceView()
    }
    .navigationDestination(isPresented: $voirRando) {
      MaRandoView()
    }
    .navigationDestination(isPresented: $voirRespiration) {
      RespirationView()
    }
    .navigationDestination(isPresented: $voirRecup) {
      RecupView()
    }
    // Bouton d'une notification (Respirer 1 min, Moment calme, Mode récupération).
    .onReceive(donnees.$ouvrirEcran) { e in
      guard let e = e else { return }
      donnees.ouvrirEcran = nil
      guard lancement == nil && sortie == nil else { return }
      if e == "respiration" { voirRespiration = true } else if e == "recup" { voirRecup = true }
    }
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
    .fullScreenCover(item: $sortie) { t in
      SortieView(fcMax: donnees.etat?.fcMax ?? 190, course: t == .course, rando: t == .rando, sentier: t == .rando ? donnees.etat?.rando : nil)
    }
    // « Ouvrir sur la montre » sur l'iPhone : « Ma rando » s'il y en a une, sinon « Ma séance ».
    .onReceive(donnees.$ouvrirChoisie) { o in
      guard o else { return }
      donnees.ouvrirChoisie = false
      guard lancement == nil && sortie == nil else { return }
      if donnees.etat?.rando != nil { voirRando = true } else { voirChoisie = true }
    }
    // Complication « Ma séance » : ouvre directement la séance du jour.
    .onReceive(donnees.$demandeSeance) { d in
      guard d, let s = donnees.prochaine else { return }
      donnees.demandeSeance = false
      lancement = s
    }
  }
}

/// Anneau orange avec la valeur au centre (accueil).
struct AnneauChiffre: View {
  let valeur: Double
  let titre: String

  var body: some View {
    ZStack {
      Anneau(part: valeur / 100, trait: 7)
        .shadow(color: Nea.rose.opacity(0.6), radius: 5)
      VStack(spacing: -2) {
        Text(valeur > 0 ? "\(Int(valeur.rounded()))" : "—").font(.system(size: 24, weight: .heavy, design: .rounded)).minimumScaleFactor(0.6)
        Text(titre).font(.system(size: 11, weight: .semibold)).foregroundColor(Nea.texte2)
      }
    }
    .frame(width: 70, height: 70)
  }
}

/// Prochaine séance : icône, titre, durée et exercices, bouton lecture orange.
struct CarteProchaine: View {
  let s: SeanceMontre

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: "dumbbell.fill").font(.system(size: 18)).foregroundColor(Nea.rose)
      VStack(alignment: .leading, spacing: 1) {
        Text(s.titre).font(.system(size: 15, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 12)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
      }
      Spacer(minLength: 2)
      Image(systemName: "play.fill").font(.system(size: 14, weight: .bold)).foregroundColor(Nea.surRose)
        .frame(width: 34, height: 34).background(Circle().fill(Nea.rose)).shadow(color: Nea.rose.opacity(0.6), radius: 5)
    }
    .padding(.vertical, 9)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte))
  }
}

/// Raccourci rond-carré de l'accueil (Programme, Dehors, Sommeil).
struct Raccourci: View {
  let icone: String
  var actif = false

  var body: some View {
    Image(systemName: icone).font(.system(size: 18, weight: .semibold)).foregroundColor(actif ? Nea.rose : .white)
      .frame(maxWidth: .infinity, minHeight: 40)
      .background(RoundedRectangle(cornerRadius: 16).fill(actif ? Nea.rose.opacity(0.15) : Nea.carte))
      .overlay(RoundedRectangle(cornerRadius: 16).stroke(actif ? Nea.rose.opacity(0.7) : .clear, lineWidth: 1))
  }
}

/// Dehors (maquette 6) : Course, Vélo, Randonnée.
struct DehorsView: View {
  @Binding var sortie: TypeActivite?
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(spacing: 8) {
        ForEach([TypeActivite.course, .velo, .rando], id: \.self) { t in
          Button { sortie = t } label: { LigneMenu(icone: t.icone, titre: t.titre) }.buttonStyle(.plain)
        }
        Text("Choisis ton activité").font(.system(size: 14)).foregroundColor(Nea.texte2).padding(.top, 2)
      }
    }
    .navigationTitle("Dehors")
  }
}

/// Programme (maquette 2) : semaine n / N en traits, séances de la semaine, « Voir la séance ».
struct ProgrammeView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        if let p = donnees.etat?.progres?.programme {
          Text("Semaine \(p.semaine) / \(p.total)").font(.system(size: 15, weight: .semibold))
          HStack(spacing: 3) {
            ForEach(0..<max(1, min(12, p.total)), id: \.self) { i in
              Capsule().fill(i < p.semaine ? Nea.rose : Nea.carte).frame(height: 5)
            }
          }
          .padding(.bottom, 2)
        }
        ForEach(donnees.etat?.semaine ?? []) { s in
          NavigationLink(value: s) {
            CarteSeance(s: s, enAvant: s.jour == Nea.aujourdhui())
          }
          .buttonStyle(.plain)
        }
        if let s = donnees.prochaine {
          NavigationLink(value: s) { Text("Voir la séance") }.buttonStyle(BoutonRose())
        }
        if !(donnees.etat?.explorer ?? []).isEmpty {
          NavigationLink { ExplorerView() } label: { Label("Séances prêtes", systemImage: "safari") }.buttonStyle(BoutonSombre())
        }
      }
    }
    .navigationTitle("Programme")
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

/// « Ma rando » : le sentier choisi sur l'iPhone (distance, D+, sommet), Démarrer.
struct BlocMaRando: View {
  let r: RandoMontre
  let demarrer: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      VStack(alignment: .leading, spacing: 2) {
        Text("Ma rando").font(.system(size: 24, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
        HStack(spacing: 6) {
          Image(systemName: "link.circle.fill").font(.system(size: 16)).foregroundColor(Nea.rose)
          Text("Liée à l'iPhone").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
      }
      VStack(alignment: .leading, spacing: 2) {
        Text(r.lieu).font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.rose).lineLimit(1).minimumScaleFactor(0.7)
        Text(r.nom).font(.system(size: 19, weight: .bold)).lineLimit(3).minimumScaleFactor(0.7)
        Text("\(String(format: "%.1f", r.km).replacingOccurrences(of: ".", with: ",")) km · D+ \(Int(r.dplus)) m · \(Int(r.min) / 60) h \(String(format: "%02d", Int(r.min) % 60))")
          .font(.system(size: 14))
          .foregroundColor(Nea.texte2)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
        Text("Sommet \(Int(r.altSommet)) m").font(.system(size: 13)).foregroundColor(Nea.texte2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(12)
      .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte))
      Button(action: demarrer) {
        Text("Démarrer")
      }
      .buttonStyle(BoutonRose())
    }
  }
}

/// « Ma rando » seule (ouverte par l'iPhone).
struct MaRandoView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var partie = false

  var body: some View {
    ScrollView {
      if let r = donnees.etat?.rando {
        BlocMaRando(r: r, demarrer: { partie = true })
      } else {
        Text("Choisis un sentier sur ton iPhone, puis « Ouvrir sur la montre ».")
          .font(.system(size: 15))
          .foregroundColor(Nea.texte2)
      }
    }
    .navigationTitle("NÉA")
    .fullScreenCover(isPresented: $partie) {
      SortieView(fcMax: donnees.etat?.fcMax ?? 190, rando: true, sentier: donnees.etat?.rando)
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
        Text("\(Nea.quand(s.jour)) · \(Int(s.min)) min").font(.system(size: 13)).foregroundColor(Nea.texte2)
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

/// Séance (maquette 3) : les exercices (nom, séries × reps), « + N exercices », Démarrer ; titre = la séance.
struct DetailView: View {
  let s: SeanceMontre
  @State private var tout = false
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        ForEach(Array((tout ? s.exos : Array(s.exos.prefix(2))).enumerated()), id: \.offset) { _, e in
          LigneExoMaquette(icone: "dumbbell.fill", nom: e.nom, volume: e.volume)
        }
        if s.exos.count > 2 && !tout {
          Button { tout = true } label: {
            HStack(spacing: 8) {
              Image(systemName: "ellipsis").font(.system(size: 13, weight: .bold)).frame(width: 28, height: 28).background(Circle().fill(Color.white.opacity(0.12)))
              Text("+ \(s.exos.count - 2) exercices").font(.system(size: 14, weight: .semibold))
              Spacer()
              Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.texte2)
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 10)
            .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
          }
          .buttonStyle(.plain)
        }
        Text("\(Int(s.min)) min · échauffement \(DUREE_ECHAUFFEMENT / 60) min compris").font(.system(size: 12)).foregroundColor(Nea.texte2)
        Button { lancement = s } label: { Text("Démarrer") }.buttonStyle(BoutonRose())
      }
    }
    .navigationTitle(s.titre)
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
  }
}

/// Ligne d'exercice de la maquette : icône, nom en gras, « 3 × 10 » dessous.
struct LigneExoMaquette: View {
  let icone: String
  let nom: String
  let volume: String

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: icone).font(.system(size: 16)).foregroundColor(.white).frame(width: 24)
      VStack(alignment: .leading, spacing: 1) {
        Text(nom).font(.system(size: 15, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.6)
        Text(volume).font(.system(size: 12)).foregroundColor(Nea.texte2)
      }
      Spacer(minLength: 0)
    }
    .padding(.vertical, 8)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
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
