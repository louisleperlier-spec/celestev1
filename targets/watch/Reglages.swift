import SwiftUI

/// 15 · Réglages : iPhone, Apple Santé, vibrations, unités, dernière synchro, Synchroniser.
struct ReglagesView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @AppStorage(Vibre.cle) private var vibrations = true
  @State private var enCours = false
  @State private var message: String?

  var body: some View {
    ScrollView {
      VStack(spacing: 0) {
        Ligne(icone: "iphone", titre: "iPhone") {
          Text(LiaisonMontre.partagee.joignable ? "Connecté" : "Loin").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
        Button {
          Entrainement.autoriser()
          message = "Vérifie les accès de NÉA dans Santé."
        } label: {
          Ligne(icone: "heart.fill", titre: "Apple Santé", couleur: Nea.rose) {
            Image(systemName: "chevron.right").foregroundColor(Nea.texte2)
          }
        }
        .buttonStyle(.plain)
        Ligne(icone: "iphone.radiowaves.left.and.right", titre: "Vibrations", couleur: Nea.rose) {
          Toggle("", isOn: $vibrations).labelsHidden().tint(Nea.rose)
        }
        Ligne(icone: "chart.bar.fill", titre: "Unités") {
          HStack(spacing: 4) {
            Text("kg · km").font(.system(size: 14)).foregroundColor(Nea.texte2)
            Image(systemName: "chevron.right").foregroundColor(Nea.texte2)
          }
        }
        if let d = donnees.synchro {
          Text("Synchronisé à \(d.formatted(date: .omitted, time: .shortened))")
            .font(.system(size: 12))
            .foregroundColor(Nea.texte2)
            .padding(.vertical, 6)
        }
        if let m = message {
          Text(m).font(.system(size: 12)).foregroundColor(Nea.texte2).multilineTextAlignment(.center).padding(.bottom, 4)
        }
        Button {
          enCours = true
          LiaisonMontre.partagee.synchroniser { ok in
            enCours = false
            message = ok ? "Synchronisé avec l'iPhone" : "Ouvre NÉA sur l'iPhone, puis réessaie."
          }
        } label: {
          Label(enCours ? "Synchronisation…" : "Synchroniser", systemImage: "arrow.triangle.2.circlepath")
        }
        .buttonStyle(BoutonSombre())
        .disabled(enCours)
      }
    }
    .navigationTitle("Réglages")
  }
}

/// Ligne de réglage : icône, titre, contenu à droite, filet en dessous.
struct Ligne<Droite: View>: View {
  let icone: String
  let titre: String
  var couleur: Color = .white
  @ViewBuilder let droite: () -> Droite

  var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 10) {
        Image(systemName: icone).font(.system(size: 18)).foregroundColor(couleur).frame(width: 24)
        Text(titre).font(.system(size: 16)).lineLimit(1).minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        droite()
      }
      .padding(.vertical, 10)
      Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5)
    }
  }
}
