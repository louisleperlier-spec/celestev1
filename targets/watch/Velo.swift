import Combine
import CoreLocation
import MapKit
import SwiftUI

enum EtapeVelo {
  case route, pause, bilan
}

/// Sortie vélo en extérieur : GPS de la montre (distance, vitesse, tracé), FC et calories, enregistrée dans Santé.
final class SortieVelo: NSObject, ObservableObject, CLLocationManagerDelegate {
  let entrainement = Entrainement(activite: .cycling, lieu: .outdoor)
  let fcMax: Double

  @Published var etape: EtapeVelo = .route
  @Published var secondes = 0
  @Published var km = 0.0
  @Published var vitesse = 0.0
  @Published var points: [CLLocationCoordinate2D] = []
  @Published var gpsActif = false
  @Published var enregistree = false

  private let gps = CLLocationManager()
  private var derniere: CLLocation?
  private var minuterie: Timer?
  private var lance = false
  private var liens = Set<AnyCancellable>()
  private(set) var debut = Date()

  init(fcMax: Double) {
    self.fcMax = fcMax > 0 ? fcMax : 190
    super.init()
    gps.delegate = self
    gps.desiredAccuracy = kCLLocationAccuracyBest
    gps.activityType = .fitness
    entrainement.objectWillChange.sink { [weak self] _ in self?.objectWillChange.send() }.store(in: &liens)
  }

  /// Zone cardio 1 à 5 : 60, 70, 80, 90 % de la FC max (comme l'iPhone).
  var zone: Int {
    let p = entrainement.bpm / fcMax
    if entrainement.bpm <= 0 { return 0 }
    return p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5
  }

  var vitesseMoy: Double { secondes > 0 ? km / (Double(secondes) / 3600) : 0 }

  func demarrer() {
    guard !lance else { return }
    lance = true
    debut = Date()
    gps.requestWhenInUseAuthorization()
    gps.startUpdatingLocation()
    entrainement.demarrer()
    Vibre.jouer(.start)
    minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
      guard let self = self, self.etape == .route else { return }
      self.secondes += 1
    }
  }

  func pause() {
    etape = .pause
    entrainement.pause()
    gps.stopUpdatingLocation()
    derniere = nil
    vitesse = 0
    Vibre.jouer(.stop)
  }

  func reprendre() {
    etape = .route
    entrainement.reprendre()
    gps.startUpdatingLocation()
    Vibre.jouer(.start)
  }

  func terminer() {
    etape = .bilan
    gps.stopUpdatingLocation()
    minuterie?.invalidate()
    minuterie = nil
    Vibre.jouer(.success)
  }

  func enregistrer(fin: @escaping () -> Void) {
    guard !enregistree else { return fin() }
    enregistree = true
    let v = VeloMontre(
      id: UUID().uuidString,
      debut: DateISO.texte(debut),
      fin: DateISO.texte(Date()),
      sec: secondes,
      km: km,
      kcal: entrainement.kcal,
      fcMoy: entrainement.fcMoy,
      fcMax: entrainement.fcMax
    )
    entrainement.terminer(sauver: true) {
      LiaisonMontre.partagee.envoyer("velo", v)
      fin()
    }
  }

  func abandonner() {
    guard !enregistree else { return }
    enregistree = true
    gps.stopUpdatingLocation()
    minuterie?.invalidate()
    minuterie = nil
    entrainement.terminer(sauver: false) {}
  }

  // MARK: CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard etape == .route else { return }
    let bonnes = locations.filter { $0.horizontalAccuracy >= 0 && $0.horizontalAccuracy <= 30 }
    guard !bonnes.isEmpty else { return }
    gpsActif = true
    for l in bonnes {
      if let d = derniere {
        let m = l.distance(from: d)
        if m < 200 { km += m / 1000 }
      }
      derniere = l
      points.append(l.coordinate)
      if l.speed >= 0 { vitesse = l.speed * 3.6 }
    }
    entrainement.ajouter(bonnes)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    gpsActif = false
  }
}

/// Entrée du vélo : « Vélo extérieur », Démarrer.
struct VeloView: View {
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lance = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Image(systemName: "bicycle").font(.system(size: 30)).foregroundColor(Nea.rose)
        Text("Vélo extérieur").font(.system(size: 22, weight: .bold))
        Text("GPS de la montre, FC et zones cardio, tracé enregistré dans Santé.")
          .font(.system(size: 14))
          .foregroundColor(Nea.texte2)
        Button("Démarrer") { lance = true }
          .buttonStyle(BoutonRose())
          .padding(.top, 4)
      }
    }
    .fullScreenCover(isPresented: $lance) {
      SortieView(fcMax: donnees.etat?.fcMax ?? 190)
    }
  }
}

/// Sortie en cours : données (08), carte (09), bilan.
struct SortieView: View {
  @StateObject private var sortie: SortieVelo
  @State private var carte = false

  init(fcMax: Double) {
    _sortie = StateObject(wrappedValue: SortieVelo(fcMax: fcMax))
  }

  var body: some View {
    ZStack {
      switch sortie.etape {
      case .route, .pause:
        if carte {
          CarteVelo(sortie: sortie, retour: { carte = false })
        } else {
          DonneesVelo(sortie: sortie, ouvrirCarte: { carte = true })
        }
      case .bilan:
        BilanVelo(sortie: sortie)
      }
    }
    .onAppear { sortie.demarrer() }
    .onDisappear { sortie.abandonner() }
  }
}

private func duree(_ s: Int) -> String {
  s >= 3600 ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60) : Nea.mmss(s)
}

private func km1(_ v: Double) -> String {
  String(format: "%.1f", v).replacingOccurrences(of: ".", with: ",")
}

/// 08 · Vélo : durée, distance, vitesse, FC et zone, Pause / Carte.
struct DonneesVelo: View {
  @ObservedObject var sortie: SortieVelo
  let ouvrirCarte: () -> Void

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 6) {
          Image(systemName: "bicycle").foregroundColor(Nea.rose)
          Text(sortie.etape == .pause ? "En pause" : "Vélo extérieur").font(.system(size: 15, weight: .bold))
          Spacer()
          Image(systemName: "location.fill").foregroundColor(sortie.gpsActif ? Nea.rose : Nea.texte2)
        }
        Text(duree(sortie.secondes))
          .font(.system(size: 46, weight: .heavy, design: .rounded))
          .monospacedDigit()
          .frame(maxWidth: .infinity)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        HStack {
          VStack(alignment: .leading, spacing: 0) {
            Text("\(km1(sortie.km)) km").font(.system(size: 20, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
            Text("Distance").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
          Spacer()
          VStack(alignment: .leading, spacing: 0) {
            Text("\(km1(sortie.vitesse)) km/h").font(.system(size: 20, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
            Text("Vitesse").font(.system(size: 12)).foregroundColor(Nea.texte2)
          }
        }
        HStack(spacing: 6) {
          Image(systemName: "heart")
          Text(sortie.entrainement.bpm > 0 ? "\(Int(sortie.entrainement.bpm)) bpm" : "-- bpm").font(.system(size: 15, weight: .semibold))
          Spacer(minLength: 4)
          VStack(spacing: 2) {
            HStack(spacing: 2) {
              ForEach(1...5, id: \.self) { z in
                RoundedRectangle(cornerRadius: 2)
                  .fill(z <= sortie.zone ? Nea.rose : Nea.texte2.opacity(0.3))
                  .frame(width: 10, height: 5)
              }
            }
            Text(sortie.zone > 0 ? "Zone \(sortie.zone)" : "Zone –").font(.system(size: 11)).foregroundColor(Nea.texte2)
          }
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 14).fill(Nea.carte))
        HStack(spacing: 6) {
          if sortie.etape == .pause {
            Button("Reprendre") { sortie.reprendre() }.buttonStyle(BoutonRose())
          } else {
            Button("Pause") { sortie.pause() }.buttonStyle(BoutonRose())
          }
          Button("Carte") { ouvrirCarte() }.buttonStyle(BoutonSombre())
        }
        if sortie.etape == .pause {
          Button("Terminer") { sortie.terminer() }.buttonStyle(BoutonSombre(couleur: Nea.rose))
        }
      }
    }
  }
}

/// 09 · Ton parcours : tracé rose sur la carte, GPS actif, distance et durée.
struct CarteVelo: View {
  @ObservedObject var sortie: SortieVelo
  let retour: () -> Void
  @State private var camera: MapCameraPosition = .userLocation(fallback: .automatic)

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Text("Ton parcours").font(.system(size: 18, weight: .bold))
        ZStack(alignment: .topLeading) {
          Map(position: $camera) {
            if sortie.points.count > 1 {
              MapPolyline(coordinates: sortie.points).stroke(Nea.rose, lineWidth: 4)
            }
            if let p = sortie.points.last {
              Annotation("", coordinate: p) {
                Circle().fill(Nea.rose).frame(width: 12, height: 12).overlay(Circle().stroke(Color.white, lineWidth: 2))
              }
            }
          }
          .frame(height: 110)
          .clipShape(RoundedRectangle(cornerRadius: 14))
          HStack(spacing: 4) {
            Image(systemName: "location.fill").foregroundColor(sortie.gpsActif ? .green : Nea.texte2)
            Text(sortie.gpsActif ? "GPS actif" : "Recherche GPS").font(.system(size: 11, weight: .semibold))
          }
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(Capsule().fill(Color.black.opacity(0.7)))
          .padding(6)
        }
        HStack {
          Label("\(km1(sortie.km)) km", systemImage: "road.lanes").font(.system(size: 15, weight: .bold))
          Spacer()
          Label(duree(sortie.secondes), systemImage: "stopwatch").font(.system(size: 15, weight: .bold)).monospacedDigit()
        }
        Button("Retour aux données") { retour() }.buttonStyle(BoutonSombre())
      }
    }
  }
}

/// Bilan de la sortie : durée, distance, vitesse, FC, énergie, Enregistrer.
struct BilanVelo: View {
  @ObservedObject var sortie: SortieVelo
  @Environment(\.dismiss) private var fermer

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        HStack(spacing: 6) {
          Image(systemName: "checkmark.circle.fill").font(.system(size: 26)).foregroundColor(Nea.rose)
          Text("Sortie terminée").font(.system(size: 17, weight: .bold))
        }
        HStack(spacing: 6) {
          Tuile(titre: "Durée", valeur: duree(sortie.secondes))
          Tuile(titre: "Distance", valeur: "\(km1(sortie.km)) km")
        }
        HStack(spacing: 6) {
          Tuile(titre: "Vitesse moy.", valeur: "\(km1(sortie.vitesseMoy)) km/h")
          Tuile(titre: "FC moyenne", valeur: sortie.entrainement.fcMoy > 0 ? "\(Int(sortie.entrainement.fcMoy)) bpm" : "--")
        }
        Tuile(titre: "Énergie estimée", valeur: "\(Int(sortie.entrainement.kcal)) kcal")
        Button(sortie.enregistree ? "Enregistrement…" : "Enregistrer") {
          sortie.enregistrer { fermer() }
        }
        .buttonStyle(BoutonRose())
        .disabled(sortie.enregistree)
      }
    }
  }
}
