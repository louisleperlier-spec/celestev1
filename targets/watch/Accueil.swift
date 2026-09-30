import SwiftUI

/// 01 · Accueil (hub) : bonjour, scores du jour, prochaine séance, et le menu de l'app.
struct AccueilView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Marque()
        Text("Bonjour \(donnees.etat?.prenom ?? "")")
          .font(.system(size: 22, weight: .bold))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        if let e = donnees.etat {
          if let b = e.bilan {
            NavigationLink {
              RecupView()
            } label: {
              Scores(b: b)
            }
            .buttonStyle(.plain)
          }
          if let s = donnees.prochaine {
            VStack(alignment: .leading, spacing: 8) {
              NavigationLink(value: s) {
                CarteSeance(s: s)
              }
              .buttonStyle(.plain)
              Button("Commencer") { lancement = s }
                .buttonStyle(BoutonRose())
            }
            .padding(8)
            .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
          }
          HStack(spacing: 6) {
            Image(e.coach)
              .resizable()
              .scaledToFit()
              .frame(width: 44, height: 44)
            Text(e.coachInfo?.daily ?? "Prêt pour ta séance ?")
              .font(.system(size: 13, weight: .semibold))
              .lineLimit(3)
              .minimumScaleFactor(0.8)
          }
          MenuNea()
        } else {
          Text("Ouvre NÉA sur ton iPhone pour recevoir tes séances.")
            .font(.system(size: 15))
            .foregroundColor(Nea.texte2)
          NavigationLink {
            ReglagesView()
          } label: {
            Tuile2(icone: "gearshape.fill", titre: "Réglages")
          }
          .buttonStyle(.plain)
        }
      }
    }
    .navigationDestination(for: SeanceMontre.self) { s in
      DetailView(s: s)
    }
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
  }
}

/// Trois anneaux : Effort, Récupération, Sommeil.
struct Scores: View {
  let b: BilanMontre

  var body: some View {
    HStack(spacing: 4) {
      Score(titre: "Effort", part: b.effort / 100, valeur: "\(Int(b.effort))%")
      Score(titre: "Récup.", part: b.recup / 100, valeur: b.recup > 0 ? "\(Int(b.recup))%" : "–")
      Score(titre: "Sommeil", part: b.sommeil / 8, valeur: b.sommeil > 0 ? Nea.kg(b.sommeil) + "h" : "–")
    }
    .padding(.vertical, 8)
    .padding(.horizontal, 4)
    .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
  }
}

struct Score: View {
  let titre: String
  let part: Double
  let valeur: String

  var body: some View {
    VStack(spacing: 3) {
      ZStack {
        Anneau(part: part, trait: 5)
        Text(valeur).font(.system(size: 12, weight: .bold, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6).padding(.horizontal, 6)
      }
      .frame(width: 46, height: 46)
      Text(titre).font(.system(size: 11)).foregroundColor(Nea.texte2).lineLimit(1)
    }
    .frame(maxWidth: .infinity)
  }
}

/// Menu de l'app sur la montre.
struct MenuNea: View {
  var body: some View {
    VStack(spacing: 6) {
      HStack(spacing: 6) {
        NavigationLink { SeancesView() } label: { Tuile2(icone: "dumbbell.fill", titre: "Séances") }.buttonStyle(.plain)
        NavigationLink { VeloView() } label: { Tuile2(icone: "bicycle", titre: "Vélo") }.buttonStyle(.plain)
      }
      HStack(spacing: 6) {
        NavigationLink { RecupView() } label: { Tuile2(icone: "heart.fill", titre: "Récup.") }.buttonStyle(.plain)
        NavigationLink { RespirationView() } label: { Tuile2(icone: "wind", titre: "Respirer") }.buttonStyle(.plain)
      }
      HStack(spacing: 6) {
        NavigationLink { CoachView() } label: { Tuile2(icone: "bubble.left.fill", titre: "Coach") }.buttonStyle(.plain)
        NavigationLink { ProgresView() } label: { Tuile2(icone: "chart.bar.fill", titre: "Progrès") }.buttonStyle(.plain)
      }
      NavigationLink { ReglagesView() } label: { Tuile2(icone: "gearshape.fill", titre: "Réglages") }.buttonStyle(.plain)
    }
  }
}

/// Case du menu : icône rose, titre.
struct Tuile2: View {
  let icone: String
  let titre: String

  var body: some View {
    VStack(spacing: 4) {
      Image(systemName: icone).font(.system(size: 20)).foregroundColor(Nea.rose)
      Text(titre).font(.system(size: 14, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, minHeight: 62)
    .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
  }
}

/// Carte d'une séance : haltère rose, jour, titre, durée et exercices.
struct CarteSeance: View {
  let s: SeanceMontre

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: "dumbbell.fill")
        .font(.system(size: 20))
        .foregroundColor(Nea.rose)
      VStack(alignment: .leading, spacing: 1) {
        Text(Nea.quand(s.jour)).font(.system(size: 13)).foregroundColor(Nea.texte2)
        Text(s.titre).font(.system(size: 16, weight: .bold)).lineLimit(2).minimumScaleFactor(0.8)
        Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 13)).foregroundColor(Nea.texte2)
      }
      Spacer(minLength: 0)
      Image(systemName: "chevron.right").foregroundColor(Nea.texte2)
    }
  }
}

/// 02 · Tes séances de la semaine.
struct SeancesView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Marque()
        Text("Tes séances").font(.system(size: 22, weight: .bold))
        ForEach(donnees.etat?.semaine ?? []) { s in
          NavigationLink(value: s) {
            CarteSeance(s: s)
              .padding(10)
              .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
          }
          .buttonStyle(.plain)
        }
      }
    }
  }
}

/// 03 · Détail : durée, exercices, « Démarrer ».
struct DetailView: View {
  let s: SeanceMontre
  @State private var tout = false
  @State private var lancement: SeanceMontre?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Marque()
        Text(s.titre).font(.system(size: 22, weight: .bold)).lineLimit(3).minimumScaleFactor(0.7)
        Text("\(Int(s.min)) min · \(s.exos.count) exercices").font(.system(size: 15)).foregroundColor(Nea.texte2)
        Image(systemName: "dumbbell.fill")
          .font(.system(size: 30))
          .foregroundColor(Nea.rose)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 4)
        ForEach(Array((tout ? s.exos : Array(s.exos.prefix(3))).enumerated()), id: \.offset) { _, e in
          HStack {
            Text(e.nom).font(.system(size: 14, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 4)
            Text(e.volume).font(.system(size: 13)).foregroundColor(Nea.texte2)
          }
          .padding(.vertical, 8)
          .padding(.horizontal, 10)
          .background(RoundedRectangle(cornerRadius: 12).fill(Nea.carte))
        }
        if s.exos.count > 3 && !tout {
          Button {
            tout = true
          } label: {
            HStack {
              Text("Voir les \(s.exos.count) exercices").font(.system(size: 15, weight: .semibold))
              Spacer()
              Image(systemName: "chevron.right")
            }
            .foregroundColor(Nea.rose)
          }
          .buttonStyle(.plain)
          .padding(.vertical, 4)
        }
        Button("Démarrer") { lancement = s }
          .buttonStyle(BoutonRose())
      }
    }
    .fullScreenCover(item: $lancement) { s in
      SeanceView(s: s)
    }
  }
}
