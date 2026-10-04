import SwiftUI

/// 14 · Mon coach : les 4 coachs, « Choisir … » (envoyé à l'iPhone), puis son message du jour et ton ressenti.
struct CoachView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var choix: String?
  @State private var envoye: String?

  private let ressentis: [(String, String, String)] = [
    ("En forme", "face.smiling", "Je me sens en forme aujourd'hui"),
    ("Fatigué", "moon.zzz.fill", "Je suis fatigué"),
    ("Courbatures", "bandage.fill", "J'ai des courbatures"),
  ]

  private var coachs: [CoachResume] { donnees.etat?.coachs ?? [] }
  private var courant: String { choix ?? donnees.etat?.coach ?? "axel" }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)], spacing: 6) {
          ForEach(coachs, id: \.id) { c in
            Button {
              choix = c.id
            } label: {
              ZStack(alignment: .bottomTrailing) {
                Image(c.id).resizable().scaledToFit().padding(4)
                  .frame(maxWidth: .infinity, minHeight: 58, maxHeight: 64)
                  .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
                  .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.id == courant ? Nea.rose : .clear, lineWidth: 2))
                  .shadow(color: c.id == courant ? Nea.rose.opacity(0.6) : .clear, radius: 6)
                if c.id == courant {
                  Image(systemName: "checkmark.circle.fill").foregroundColor(Nea.rose).background(Circle().fill(Color.white)).padding(3)
                }
              }
            }
            .buttonStyle(.plain)
          }
        }
        if let c = coachs.first(where: { $0.id == courant }) {
          Text(c.nom).font(.system(size: 20, weight: .bold))
          Text(c.spec).font(.system(size: 14)).foregroundColor(Nea.texte2)
          if c.id != donnees.etat?.coach {
            Button("Choisir \(c.nom)") {
              LiaisonMontre.partagee.envoyer("coach-choix", ChoixCoach(id: c.id))
              Vibre.jouer(.success)
              envoye = "\(c.nom) choisi : ton programme se met à jour sur l'iPhone."
            }
            .buttonStyle(BoutonRose())
          }
        }
        if let m = envoye {
          Text(m).font(.system(size: 12)).foregroundColor(Nea.texte2).multilineTextAlignment(.center)
        }
        if let info = donnees.etat?.coachInfo {
          Text("« \(info.daily) »").font(.system(size: 14)).padding(8).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
            .padding(.top, 4)
          if !info.dernier.isEmpty {
            Text(info.dernier).font(.system(size: 13)).foregroundColor(Nea.texte2).lineLimit(5)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
        Text("Comment te sens-tu ?").font(.system(size: 15, weight: .semibold)).frame(maxWidth: .infinity, alignment: .leading).padding(.top, 2)
        ForEach(ressentis, id: \.0) { r in
          Button {
            LiaisonMontre.partagee.envoyer("coach", CoachEnvoi(texte: r.2))
            envoye = "« \(r.0) » envoyé : la réponse arrive dans NÉA sur l'iPhone."
            Vibre.jouer(.success)
          } label: {
            Label(r.0, systemImage: r.1)
          }
          .buttonStyle(BoutonSombre())
        }
      }
    }
    .navigationTitle("Mon coach")
  }
}

/// Progrès : séances de la semaine, série, niveau et XP, dernière activité.
struct ProgresView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        if let p = donnees.etat?.progres {
          HStack(spacing: 10) {
            ZStack {
              Anneau(part: Double(p.seances) / Double(max(1, p.objectif)), trait: 7)
              Text("\(p.seances)/\(p.objectif)").font(.system(size: 16, weight: .heavy, design: .rounded))
            }
            .frame(width: 62, height: 62)
            VStack(alignment: .leading, spacing: 2) {
              Text("Séances").font(.system(size: 12)).foregroundColor(Nea.texte2)
              Text("cette semaine").font(.system(size: 14, weight: .semibold))
            }
          }
          .padding(8)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
          HStack(spacing: 6) {
            Tuile(titre: "Série", valeur: "\(p.serie) j")
            Tuile(titre: "Niveau", valeur: "\(p.niveau)")
          }
          VStack(alignment: .leading, spacing: 4) {
            Text("\(Int(p.xp))/\(Int(p.xpNiveau)) XP • \(p.rang)").font(.system(size: 12)).foregroundColor(Nea.texte2)
            GeometryReader { g in
              ZStack(alignment: .leading) {
                Capsule().fill(Nea.carte)
                Capsule().fill(Nea.rose).frame(width: g.size.width * CGFloat(min(1, p.xp / max(1, p.xpNiveau))))
              }
            }
            .frame(height: 6)
          }
          if !p.derniere.isEmpty {
            Text("Dernière activité").font(.system(size: 12)).foregroundColor(Nea.texte2).padding(.top, 2)
            Text(p.derniere).font(.system(size: 14, weight: .semibold))
          }
        } else {
          Text("Ouvre NÉA sur ton iPhone pour synchroniser tes progrès.").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
      }
    }
    .navigationTitle("Progrès")
  }
}
