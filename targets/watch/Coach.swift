import SwiftUI

/// Coach (maquette 12) : le coach (Axel qui sourit), « Comment tu te sens ? » (En forme, Fatigué, Stressé), micro pour lui parler ;
/// dessous, son message du jour, le dernier échange et « Changer de coach ».
struct CoachView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var choisi: String?
  @State private var parler = false
  @State private var texte = ""
  @State private var envoye: String?

  private var coach: CoachResume? { donnees.etat?.coachs?.first(where: { $0.id == donnees.etat?.coach }) }

  private func envoyer(_ t: String, _ libelle: String) {
    LiaisonMontre.partagee.envoyer("coach", CoachEnvoi(texte: t))
    Vibre.jouer(.success)
    envoye = "« \(libelle) » envoyé : la réponse arrive dans NÉA sur l'iPhone."
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Image((donnees.etat?.coach ?? "axel") == "axel" ? "ax_coach" : (donnees.etat?.coach ?? "axel"))
          .resizable().scaledToFit().frame(maxHeight: 70)
        Text("Comment tu te sens ?").font(.system(size: 15, weight: .semibold))
        HStack(spacing: 4) {
          ForEach(RESSENTIS.prefix(3), id: \.0) { r in
            Button {
              choisi = r.0
              envoyer(r.2, r.0)
            } label: {
              Text(r.0).font(.system(size: 12, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.6)
                .foregroundColor(choisi == r.0 ? Nea.surRose : .white)
                .frame(maxWidth: .infinity, minHeight: 30)
                .background(RoundedRectangle(cornerRadius: 12).fill(choisi == r.0 ? Nea.rose : Nea.carte))
            }
            .buttonStyle(.plain)
          }
        }
        Button { parler = true } label: {
          Image(systemName: "mic.fill").font(.system(size: 20, weight: .semibold)).foregroundColor(Nea.rose)
            .frame(width: 48, height: 48)
            .background(Circle().fill(Nea.rose.opacity(0.15)))
            .overlay(Circle().stroke(Nea.rose, lineWidth: 2))
            .shadow(color: Nea.rose.opacity(0.6), radius: 6)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Parler à ton coach")
        if let m = envoye {
          Text(m).font(.system(size: 12)).foregroundColor(Nea.texte2).multilineTextAlignment(.center)
        }
        if let info = donnees.etat?.coachInfo {
          Text("« \(info.daily) »").font(.system(size: 13)).padding(8).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
            .padding(.top, 4)
          if !info.dernier.isEmpty {
            Text(info.dernier).font(.system(size: 12)).foregroundColor(Nea.texte2).lineLimit(5).frame(maxWidth: .infinity, alignment: .leading)
          }
        }
        NavigationLink { ChoixCoachView() } label: { LigneMenu(icone: "person.2.fill", titre: "Changer de coach") }.buttonStyle(.plain)
      }
    }
    .navigationTitle(coach?.nom ?? "Coach")
    .sheet(isPresented: $parler) {
      VStack(spacing: 8) {
        // Toucher le champ ouvre la dictée (ou le clavier) de la montre.
        TextField("Parle à \(coach?.nom ?? "ton coach")…", text: $texte)
        Button("Envoyer") {
          let t = texte.trimmingCharacters(in: .whitespacesAndNewlines)
          guard !t.isEmpty else { return }
          envoyer(t, String(t.prefix(24)))
          texte = ""
          parler = false
        }
        .buttonStyle(BoutonRose())
      }
    }
  }
}

/// Les 4 coachs, « Choisir … » (envoyé à l'iPhone).
struct ChoixCoachView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var choix: String?
  @State private var envoye: String?

  private var coachs: [CoachResume] { donnees.etat?.coachs ?? [] }
  private var courant: String { choix ?? donnees.etat?.coach ?? "axel" }

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)], spacing: 6) {
          ForEach(coachs, id: \.id) { c in
            Button { choix = c.id } label: {
              Image(c.id).resizable().scaledToFit().padding(4)
                .frame(maxWidth: .infinity, minHeight: 58, maxHeight: 64)
                .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.id == courant ? Nea.rose : .clear, lineWidth: 2))
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
      }
    }
    .navigationTitle("Coachs")
  }
}

/// Hexagone du niveau (comme l'iPhone) avec une étoile.
struct Medaille: View {
  var body: some View {
    ZStack {
      Hexagone().fill(LinearGradient(colors: [Color(red: 0.95, green: 0.55, blue: 0.25), Color(red: 0.55, green: 0.25, blue: 0.08)], startPoint: .top, endPoint: .bottom))
      Hexagone().stroke(Color(red: 1, green: 0.75, blue: 0.5).opacity(0.8), lineWidth: 1.5)
      Image(systemName: "star.fill").font(.system(size: 20)).foregroundColor(Color(red: 1, green: 0.85, blue: 0.7))
    }
    .frame(width: 52, height: 56)
    .shadow(color: Nea.rose.opacity(0.5), radius: 6)
  }
}

struct Hexagone: Shape {
  func path(in r: CGRect) -> Path {
    var p = Path()
    let c = CGPoint(x: r.midX, y: r.midY)
    let rayon = min(r.width, r.height) / 2
    for i in 0..<6 {
      let a = Double(i) * .pi / 3 - .pi / 2
      let pt = CGPoint(x: c.x + rayon * cos(a), y: c.y + rayon * sin(a))
      if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
    }
    p.closeSubpath()
    return p
  }
}

/// Tes progrès (maquette 11) : médaille et niveau, XP, meilleure série, cartes de la collection, « Voir mes défis ».
struct ProgresView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        if let p = donnees.etat?.progres {
          HStack(spacing: 8) {
            Medaille()
            VStack(alignment: .leading, spacing: 3) {
              Text("Niveau \(p.niveau)").font(.system(size: 18, weight: .bold))
              GeometryReader { g in
                ZStack(alignment: .leading) {
                  Capsule().fill(Nea.carte)
                  Capsule().fill(Nea.rose).frame(width: g.size.width * CGFloat(min(1, p.xp / max(1, p.xpNiveau))))
                }
              }
              .frame(height: 6)
              Text("\(Int(p.xp)) / \(Int(p.xpNiveau)) XP").font(.system(size: 12, weight: .semibold)).foregroundColor(Nea.texte2)
            }
          }
          HStack(spacing: 6) {
            CaseProgres(icone: "flame.fill", valeur: "\(p.meilleureSerie ?? p.serie) jours", titre: "Meilleure série")
            CaseProgres(icone: "trophy.fill", valeur: "\(p.cartes ?? 0) cartes", titre: "Ma collection")
          }
          NavigationLink { DefisView() } label: { LigneMenu(icone: "target", titre: "Voir mes défis") }.buttonStyle(.plain)
          Text("\(p.seances)/\(p.objectif) séances cette semaine · \(p.rang)").font(.system(size: 12)).foregroundColor(Nea.texte2)
        } else {
          Text("Ouvre NÉA sur ton iPhone pour synchroniser tes progrès.").font(.system(size: 14)).foregroundColor(Nea.texte2)
        }
      }
    }
    .navigationTitle("Tes progrès")
  }
}

struct CaseProgres: View {
  let icone: String
  let valeur: String
  let titre: String

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(spacing: 4) {
        Image(systemName: icone).font(.system(size: 16)).foregroundColor(Nea.rose)
        Text(valeur).font(.system(size: 14, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
      }
      Text(titre).font(.system(size: 10)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
    }
    .padding(8)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}

/// Défis de la semaine (envoyés par l'iPhone) avec leur avancement.
struct DefisView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        ForEach(donnees.etat?.progres?.defis ?? [], id: \.self) { d in
          VStack(alignment: .leading, spacing: 4) {
            HStack {
              Text(d.titre).font(.system(size: 13, weight: .semibold)).lineLimit(2).minimumScaleFactor(0.7)
              Spacer(minLength: 2)
              if d.fait >= d.but { Image(systemName: "checkmark.circle.fill").foregroundColor(Nea.rose) }
            }
            GeometryReader { g in
              ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.12))
                Capsule().fill(Nea.rose).frame(width: g.size.width * CGFloat(min(1, d.fait / max(1, d.but))))
              }
            }
            .frame(height: 5)
            Text("\(Int(d.fait)) / \(Int(d.but))").font(.system(size: 11)).foregroundColor(Nea.texte2)
          }
          .padding(8)
          .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
        }
        if (donnees.etat?.progres?.defis ?? []).isEmpty {
          Text("Ouvre NÉA sur l'iPhone pour voir tes défis de la semaine.").font(.system(size: 13)).foregroundColor(Nea.texte2)
        }
      }
    }
    .navigationTitle("Défis")
  }
}
