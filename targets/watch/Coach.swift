import SwiftUI

/// Coach : son message du jour, sa dernière réponse, et ton ressenti envoyé au coach (réponse sur l'iPhone).
struct CoachView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var envoye: String?

  private let ressentis: [(String, String, String)] = [
    ("En forme", "face.smiling", "Je me sens en forme aujourd'hui"),
    ("Fatigué", "moon.zzz.fill", "Je suis fatigué"),
    ("Courbatures", "bandage.fill", "J'ai des courbatures"),
  ]

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Marque()
        if let e = donnees.etat {
          HStack(spacing: 6) {
            Image(e.coach).resizable().scaledToFit().frame(width: 46, height: 46)
            VStack(alignment: .leading, spacing: 0) {
              Text("Coach \(e.coachInfo?.nom ?? "")").font(.system(size: 18, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
              Text(e.coachInfo?.style ?? "").font(.system(size: 13)).foregroundColor(Nea.texte2)
            }
          }
          if let c = e.coachInfo {
            Text("« \(c.daily) »").font(.system(size: 14)).padding(8).background(RoundedRectangle(cornerRadius: 12).fill(Nea.carte))
            if !c.dernier.isEmpty {
              Text("Dernier échange").font(.system(size: 12)).foregroundColor(Nea.texte2)
              Text(c.dernier).font(.system(size: 14)).lineLimit(6).padding(8).background(RoundedRectangle(cornerRadius: 12).fill(Nea.carte))
            }
          }
          Text("Comment te sens-tu ?").font(.system(size: 15, weight: .semibold)).padding(.top, 2)
          ForEach(ressentis, id: \.0) { r in
            Button {
              LiaisonMontre.partagee.envoyer("coach", CoachEnvoi(texte: r.2))
              envoye = r.0
              Vibre.jouer(.success)
            } label: {
              Label(r.0, systemImage: r.1)
            }
            .buttonStyle(BoutonSombre())
          }
          if let x = envoye {
            Text("« \(x) » envoyé : la réponse arrive dans NÉA sur l'iPhone.").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
        }
      }
    }
  }
}

/// Progrès : séances de la semaine, série, niveau et XP, dernière activité.
struct ProgresView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Marque()
        Text("Progrès").font(.system(size: 22, weight: .bold))
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
  }
}
