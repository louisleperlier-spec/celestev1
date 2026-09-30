import HealthKit
import SwiftUI

/// 10 · Récupération : sommeil, FC au repos, VFC nocturne de la dernière nuit, puis Respirer et Mesurer.
struct RecupView: View {
  @ObservedObject private var donnees = Donnees.partagees

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Marque()
        Text("Récupération").font(.system(size: 22, weight: .bold))
        if let b = donnees.etat?.bilan {
          Text(b.recup > 0 ? "\(Int(b.recup)) % \(b.recupTxt)" : b.recupTxt)
            .font(.system(size: 14))
            .foregroundColor(Nea.texte2)
        }
        if let n = donnees.etat?.nuit {
          Mesure(icone: "moon.fill", titre: "Sommeil", valeur: heures(n.h), unite: "")
          if n.rhr > 0 { Mesure(icone: "heart.fill", titre: "FC au repos", valeur: "\(Int(n.rhr))", unite: "bpm") }
          if n.hrv > 0 { Mesure(icone: "waveform.path.ecg", titre: "VFC nocturne", valeur: "\(Int(n.hrv))", unite: "ms") }
          Text("Dernière nuit · \(n.src)")
            .font(.system(size: 13))
            .foregroundColor(Nea.texte2)
            .frame(maxWidth: .infinity)
        } else {
          Text("Pas encore de nuit : note-la dans NÉA sur l'iPhone ou porte ta montre la nuit.")
            .font(.system(size: 14))
            .foregroundColor(Nea.texte2)
        }
        NavigationLink {
          RespirationView()
        } label: {
          Text("Respirer · 2 min")
        }
        .buttonStyle(BoutonRose())
        NavigationLink {
          MesureView()
        } label: {
          Text("Mesurer · 1 min")
        }
        .buttonStyle(BoutonSombre())
      }
    }
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
      HStack {
        Marque()
        Spacer()
      }
      Text(fini ? "Bien joué" : "Respiration").font(.system(size: 20, weight: .bold)).frame(maxWidth: .infinity, alignment: .leading)
      ZStack {
        Circle().stroke(Nea.rose.opacity(0.25), lineWidth: 10).scaleEffect(1.08)
        Circle()
          .stroke(Nea.rose, lineWidth: 6)
          .scaleEffect(inspire ? 1.0 : 0.72)
          .animation(.easeInOut(duration: inspire ? 4 : 6), value: inspire)
        VStack(spacing: 0) {
          Text(fini ? "Terminé" : inspire ? "Inspire" : "Expire").font(.system(size: 22, weight: .bold))
          if !fini { Text("\(secondes) secondes").font(.system(size: 13)).foregroundColor(Nea.texte2) }
        }
      }
      .frame(width: 118, height: 118)
      HStack(spacing: 4) {
        Text(Nea.mmss(reste)).font(.system(size: 17, weight: .heavy, design: .rounded)).monospacedDigit()
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
