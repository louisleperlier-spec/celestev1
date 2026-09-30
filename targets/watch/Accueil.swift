import SwiftUI

/// 01 · Accueil : bonjour, le coach, la prochaine séance et « Commencer ».
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
        if let e = donnees.etat, let s = donnees.prochaine {
          HStack(spacing: 6) {
            Image(e.coach)
              .resizable()
              .scaledToFit()
              .frame(width: 54, height: 54)
            Text("Prêt pour ta séance ?")
              .font(.system(size: 14, weight: .semibold))
              .padding(8)
              .background(RoundedRectangle(cornerRadius: 12).fill(Nea.carte))
          }
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
          NavigationLink {
            SeancesView()
          } label: {
            HStack {
              Image(systemName: "list.bullet").foregroundColor(Nea.rose)
              Text("Tes séances").font(.system(size: 16, weight: .semibold))
              Spacer()
              Image(systemName: "chevron.right").foregroundColor(Nea.texte2)
            }
            .padding(10)
            .background(RoundedRectangle(cornerRadius: 16).fill(Nea.carte))
          }
          .buttonStyle(.plain)
        } else {
          Text("Ouvre NÉA sur ton iPhone pour recevoir tes séances.")
            .font(.system(size: 15))
            .foregroundColor(Nea.texte2)
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
