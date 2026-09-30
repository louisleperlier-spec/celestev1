import HealthKit
import SwiftUI

/// 12 · Récupération : sommeil en grand, FC au repos, VFC nocturne, Respirer ; Mesurer en dessous.
struct RecupView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(spacing: 2) {
        if let n = donnees.etat?.nuit {
          GrosChiffre(texte: heures(n.h), taille: 46)
          Text("de sommeil").font(.system(size: 15)).foregroundColor(Nea.texte2)
          VStack(spacing: 0) {
            if n.rhr > 0 { LigneValeur(titre: "FC au repos", valeur: "\(Int(n.rhr)) bpm") }
            if n.hrv > 0 { LigneValeur(titre: "VFC nocturne", valeur: "\(Int(n.hrv)) ms") }
            if let s = donnees.etat?.score { LigneValeur(titre: "Score santé", valeur: "\(s)") }
          }
          .padding(.top, 4)
          Text("Dernière nuit · \(n.src)").font(.system(size: 12)).foregroundColor(Nea.texte2).padding(.vertical, 4)
        } else {
          Text("Pas encore de nuit : note-la dans NÉA sur l'iPhone ou porte ta montre la nuit.")
            .font(.system(size: 14))
            .foregroundColor(Nea.texte2)
        }
        NavigationLink {
          RespirationView()
        } label: {
          Label("Respirer · 2 min", systemImage: "wind")
        }
        .buttonStyle(BoutonRose())
        NavigationLink {
          MesureView()
        } label: {
          Label("Mesurer · 1 min", systemImage: "waveform.path.ecg")
        }
        .buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("Récupération")
  }

  private func heures(_ h: Double) -> String {
    let m = Int((h * 60).rounded())
    return "\(m / 60) h \(String(format: "%02d", m % 60))"
  }
}

/// Ligne de mesure : icône rose, titre, grande valeur.
struct Mesure: View {
  let icone: String
  let titre: String
  let valeur: String
  let unite: String

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: icone).font(.system(size: 18)).foregroundColor(Nea.rose).frame(width: 22)
      Text(titre).font(.system(size: 14)).lineLimit(1).minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      Text(valeur).font(.system(size: 20, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
      if !unite.isEmpty { Text(unite).font(.system(size: 13)).foregroundColor(Nea.texte2) }
    }
    .padding(.vertical, 8)
    .padding(.horizontal, 10)
    .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
  }
}

/// 11 · Respiration guidée : 4 s d'inspiration, 6 s d'expiration, 2 minutes ; enregistrée en pleine conscience.
struct RespirationView: View {
  @State private var reste = 120
  @State private var t = 0
  @State private var enPause = false
  @State private var fini = false
  @State private var debut = Date()
  @State private var minuterie: Timer?
  @Environment(\.dismiss) private var fermer

  private var inspire: Bool { t % 10 < 4 }
  private var secondes: Int { inspire ? 4 - t % 10 : 10 - t % 10 }

  var body: some View {
    VStack(spacing: 6) {
      ZStack {
        Circle().fill(Nea.rose.opacity(0.12)).blur(radius: 12)
        Circle()
          .stroke(Nea.rose, lineWidth: 5)
          .shadow(color: Nea.rose, radius: 8)
          .scaleEffect(fini ? 0.9 : inspire ? 1.0 : 0.74)
          .animation(.easeInOut(duration: inspire ? 4 : 6), value: inspire)
        VStack(spacing: 0) {
          Text(fini ? "Terminé" : inspire ? "Inspire" : "Expire").font(.system(size: 24, weight: .bold))
          if !fini { Text("\(secondes) secondes").font(.system(size: 13)).foregroundColor(Nea.texte2) }
        }
      }
      .frame(width: 120, height: 120)
      HStack(spacing: 4) {
        Text(Nea.mmss(reste)).font(.system(size: 18, weight: .heavy, design: .rounded)).monospacedDigit()
        Text("restantes").font(.system(size: 14)).foregroundColor(Nea.texte2)
      }
      if fini {
        Button("Fermer") { fermer() }.buttonStyle(BoutonRose())
      } else {
        Button {
          enPause.toggle()
        } label: {
          Label(enPause ? "Reprendre" : "Pause", systemImage: enPause ? "play.fill" : "pause.fill")
        }
        .buttonStyle(BoutonSombre())
      }
    }
    .navigationTitle("Respiration")
    .onAppear {
      debut = Date()
      Vibre.jouer(.directionUp)
      minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in avancer() }
    }
    .onDisappear {
      minuterie?.invalidate()
      minuterie = nil
    }
  }

  private func avancer() {
    guard !enPause, !fini else { return }
    t += 1
    reste -= 1
    if reste <= 0 {
      fini = true
      minuterie?.invalidate()
      Vibre.jouer(.success)
      Entrainement.pleineConscience(debut: debut, fin: Date())
      return
    }
    if t % 10 == 0 { Vibre.jouer(.directionUp) }
    if t % 10 == 4 { Vibre.jouer(.directionDown) }
  }
}

/// Mesure de récupération d'1 minute au calme : FC du capteur, puis dernière VFC de la montre ; envoyée à l'iPhone.
struct MesureView: View {
  @StateObject private var entrainement = Entrainement(activite: .mindAndBody, lieu: .indoor)
  @State private var reste = 60
  @State private var minuterie: Timer?
  @State private var resultat: (bpm: Double, hrv: Double?)?
  @Environment(\.dismiss) private var fermer

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Text("Mesure au calme").font(.system(size: 18, weight: .bold)).frame(maxWidth: .infinity, alignment: .leading)
        if let r = resultat {
          Mesure(icone: "heart.fill", titre: "FC moyenne", valeur: "\(Int(r.bpm))", unite: "bpm")
          if let h = r.hrv {
            Mesure(icone: "waveform.path.ecg", titre: "VFC", valeur: "\(Int(h))", unite: "ms")
            Text("Envoyée à NÉA sur l'iPhone").font(.system(size: 13)).foregroundColor(Nea.texte2)
          } else {
            Text("Pas de VFC récente dans Santé : ta montre la mesure pendant le sommeil ou avec Pleine conscience.")
              .font(.system(size: 12))
              .foregroundColor(Nea.texte2)
          }
          Button("Fermer") { fermer() }.buttonStyle(BoutonRose())
        } else {
          Text("Reste immobile, respire calmement.").font(.system(size: 13)).foregroundColor(Nea.texte2)
          ZStack {
            Anneau(part: Double(60 - reste) / 60, trait: 7)
            VStack(spacing: 0) {
              Text(Nea.mmss(reste)).font(.system(size: 26, weight: .heavy, design: .rounded)).monospacedDigit()
              Text(entrainement.bpm > 0 ? "\(Int(entrainement.bpm)) bpm" : "-- bpm").font(.system(size: 13)).foregroundColor(Nea.texte2)
            }
          }
          .frame(width: 112, height: 112)
        }
      }
    }
    .onAppear {
      entrainement.demarrer()
      minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in tick() }
    }
    .onDisappear {
      minuterie?.invalidate()
      minuterie = nil
      entrainement.terminer(sauver: false) {}
    }
  }

  private func tick() {
    guard resultat == nil else { return }
    reste -= 1
    guard reste <= 0 else { return }
    minuterie?.invalidate()
    let bpm = entrainement.fcMoy > 0 ? entrainement.fcMoy : entrainement.bpm
    entrainement.terminer(sauver: false) {}
    Vibre.jouer(.success)
    Entrainement.derniereVFC { v in
      resultat = (bpm, v)
      if let h = v, h > 0 {
        LiaisonMontre.partagee.envoyer("mesure", MesureMontre(d: DateISO.texte(Date()), hrv: h, bpm: bpm))
      }
    }
  }
}
