import SwiftUI

/// 12 · Réglages : iPhone, Apple Santé, vibrations, unités, dernière synchro, Synchroniser.
struct ReglagesView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @AppStorage(Vibre.cle) private var vibrations = true
  @State private var enCours = false
  @State private var message: String?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Marque()
        Text("Réglages").font(.system(size: 22, weight: .bold))
        Ligne(icone: "iphone", titre: "iPhone") {
          HStack(spacing: 4) {
            Text(LiaisonMontre.partagee.joignable ? "Connecté" : "Loin").font(.system(size: 13)).foregroundColor(Nea.texte2)
            Circle().fill(LiaisonMontre.partagee.joignable ? Nea.rose : Nea.texte2).frame(width: 8, height: 8)
          }
        }
        Button {
          Entrainement.autoriser()
          message = "Vérifie les accès de NÉA dans Santé."
        } label: {
          Ligne(icone: "heart", titre: "Apple Santé") {
            Image(systemName: "chevron.right").foregroundColor(Nea.texte2)
          }
        }
        .buttonStyle(.plain)
        Ligne(icone: "iphone.radiowaves.left.and.right", titre: "Vibrations") {
          Toggle("", isOn: $vibrations).labelsHidden().tint(Nea.rose)
        }
        Ligne(icone: "gearshape", titre: "Unités") {
          Text("kg · km").font(.system(size: 13)).foregroundColor(Nea.texte2)
        }
        if let d = donnees.synchro {
          Text("Dernière synchro : \(d.formatted(date: .omitted, time: .shortened))")
            .font(.system(size: 12))
            .foregroundColor(Nea.texte2)
            .frame(maxWidth: .infinity)
        }
        if let m = message {
          Text(m).font(.system(size: 12)).foregroundColor(Nea.texte2).frame(maxWidth: .infinity)
        }
        Button(enCours ? "Synchronisation…" : "Synchroniser") {
          enCours = true
          LiaisonMontre.partagee.synchroniser { ok in
            enCours = false
            message = ok ? "Synchronisé avec l'iPhone" : "Ouvre NÉA sur l'iPhone, puis réessaie."
          }
        }
        .buttonStyle(BoutonSombre())
        .disabled(enCours)
      }
    }
  }
}

/// Ligne de réglage : icône, titre, contenu à droite.
struct Ligne<Droite: View>: View {
  let icone: String
  let titre: String
  @ViewBuilder let droite: () -> Droite

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: icone).font(.system(size: 18)).frame(width: 24)
      Text(titre).font(.system(size: 15, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      droite()
    }
    .padding(.vertical, 10)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}
