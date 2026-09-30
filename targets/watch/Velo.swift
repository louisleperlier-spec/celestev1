import Combine
import CoreLocation
import MapKit
import SwiftUI

enum EtapeVelo {
  case route, pause, bilan
}

/// Sortie vélo ou course en extérieur : GPS de la montre (distance, vitesse, tracé), FC et calories, enregistrée dans Santé.
/// Le tracé part à l'iPhone, qui en déduit les territoires conquis.
final class SortieVelo: NSObject, ObservableObject, CLLocationManagerDelegate {
  let entrainement: Entrainement
  let fcMax: Double
  let course: Bool

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

  init(fcMax: Double, course: Bool = false) {
    self.fcMax = fcMax > 0 ? fcMax : 190
    self.course = course
    entrainement = Entrainement(activite: course ? .running : .cycling, lieu: .outdoor)
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

  /// Tracé allégé pour l'iPhone : au plus 500 points, arrondis à 5 décimales (~1 m).
  var traceEnvoi: [[Double]] {
    guard !points.isEmpty else { return [] }
    let pas = max(1, Int((Double(points.count) / 500).rounded(.up)))
    var r = stride(from: 0, to: points.count, by: pas).map { points[$0] }
    if let d = points.last, r.last.map({ $0.latitude != d.latitude || $0.longitude != d.longitude }) ?? true { r.append(d) }
    return r.map { [($0.latitude * 1e5).rounded() / 1e5, ($0.longitude * 1e5).rounded() / 1e5] }
  }

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
      fcMax: entrainement.fcMax,
      sport: course ? "course" : "velo",
      pts: traceEnvoi
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

/// Entrée du vélo (ou de la course) : titre, Démarrer.
struct VeloView: View {
  var course = false
  @ObservedObject private var donnees = Donnees.partagees
  @State private var lance = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Image(systemName: course ? "figure.run" : "bicycle").font(.system(size: 30)).foregroundColor(Nea.rose)
        Text(course ? "Course" : "Vélo extérieur").font(.system(size: 22, weight: .bold))
        Text("GPS de la montre, FC et zones cardio. Chaque case traversée conquiert un territoire.")
          .font(.system(size: 14))
          .foregroundColor(Nea.texte2)
        Button("Démarrer") { lance = true }
          .buttonStyle(BoutonRose())
          .padding(.top, 4)
      }
    }
    .fullScreenCover(isPresented: $lance) {
      SortieView(fcMax: donnees.etat?.fcMax ?? 190, course: course)
    }
  }
}

/// Sortie en cours : données (08), carte (09), bilan.
struct SortieView: View {
  @StateObject private var sortie: SortieVelo
  @State private var carte = false

  init(fcMax: Double, course: Bool = false) {
    _sortie = StateObject(wrappedValue: SortieVelo(fcMax: fcMax, course: course))
  }

  var body: some View {
    NavigationStack {
      contenu
    }
    .tint(Nea.rose)
    .onAppear { sortie.demarrer() }
    .onDisappear { sortie.abandonner() }
  }

  @ViewBuilder private var contenu: some View {
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
  }
}

private func duree(_ s: Int) -> String {
  s >= 3600 ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60) : Nea.mmss(s)
}

private func km1(_ v: Double) -> String {
  String(format: "%.1f", v).replacingOccurrences(of: ".", with: ",")
}

/// Allure de course (min/km), « – » à l'arrêt.
private func allure(_ kmh: Double) -> String {
  guard kmh >= 1 else { return "–" }
  let s = Int((3600 / kmh).rounded())
  return String(format: "%d:%02d", s / 60, s % 60)
}

/// 10 · Vélo : vitesse en grand, distance et durée, FC et zone, Pause / Carte ; en pause : Reprendre / Terminer.
struct DonneesVelo: View {
  @ObservedObject var sortie: SortieVelo
  let ouvrirCarte: () -> Void

  var body: some View {
    ScrollView {
      VStack(spacing: 2) {
        if sortie.etape == .pause {
          GrosChiffre(texte: duree(sortie.secondes), taille: 48)
          Text("temps écoulé").font(.system(size: 14)).foregroundColor(Nea.texte2)
          Button {
            sortie.reprendre()
          } label: {
            Label("Reprendre", systemImage: "play.fill")
          }
          .buttonStyle(BoutonRose())
          .padding(.top, 6)
          Button {
            sortie.terminer()
          } label: {
            Label("Terminer", systemImage: "stop.fill")
          }
          .buttonStyle(BoutonSombre())
        } else {
          GrosChiffre(texte: sortie.course ? allure(sortie.vitesse) : km1(sortie.vitesse), taille: 54)
          Text(sortie.course ? "min/km" : "km/h").font(.system(size: 15)).foregroundColor(Nea.texte2)
          Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5).padding(.vertical, 3)
          HStack {
            VStack(spacing: 0) {
              Text(km1(sortie.km)).font(.system(size: 24, weight: .heavy, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
              Text("km").font(.system(size: 12)).foregroundColor(Nea.texte2)
            }
            .frame(maxWidth: .infinity)
            Rectangle().fill(Nea.texte2.opacity(0.35)).frame(width: 0.5, height: 30)
            Text(duree(sortie.secondes))
              .font(.system(size: 24, weight: .heavy, design: .rounded))
              .monospacedDigit()
              .lineLimit(1)
              .minimumScaleFactor(0.6)
              .frame(maxWidth: .infinity)
          }
          Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5).padding(.vertical, 3)
          HStack(spacing: 6) {
            Image(systemName: "heart.fill").foregroundColor(Nea.rose)
            Text(sortie.entrainement.bpm > 0 ? "\(Int(sortie.entrainement.bpm)) bpm" : "-- bpm").font(.system(size: 15, weight: .semibold))
            Text(sortie.zone > 0 ? "· Zone \(sortie.zone)" : "").font(.system(size: 15, weight: .semibold))
          }
          HStack(spacing: 6) {
            Button {
              sortie.pause()
            } label: {
              Image(systemName: "pause.fill")
            }
            .buttonStyle(BoutonRose())
            .accessibilityLabel("Pause")
            Button {
              ouvrirCarte()
            } label: {
              Image(systemName: "map")
            }
            .buttonStyle(BoutonSombre())
            .accessibilityLabel("Carte")
          }
          .padding(.top, 4)
        }
      }
    }
    .navigationTitle(sortie.etape == .pause ? "En pause" : sortie.course ? "Course" : "Vélo")
  }
}

/// 11 · Parcours : tracé rose sur la carte, distance et GPS, retour aux données.
struct CarteVelo: View {
  @ObservedObject var sortie: SortieVelo
  let retour: () -> Void
  @State private var camera: MapCameraPosition = .userLocation(fallback: .automatic)

  var body: some View {
    ZStack(alignment: .bottom) {
      Map(position: $camera) {
        if sortie.points.count > 1 {
          MapPolyline(coordinates: sortie.points).stroke(Nea.rose, lineWidth: 5)
        }
        if let p = sortie.points.last {
          Annotation("", coordinate: p) {
            Circle().fill(Nea.rose).frame(width: 14, height: 14).overlay(Circle().stroke(Color.white, lineWidth: 3)).shadow(color: Nea.rose, radius: 6)
          }
        }
      }
      .mapStyle(.standard(emphasis: .muted))
      VStack(spacing: 6) {
        HStack(spacing: 5) {
          Image(systemName: "location.fill").foregroundColor(Nea.rose)
          Text("\(km1(sortie.km)) km · \(sortie.gpsActif ? "GPS actif" : "Recherche GPS")").font(.system(size: 13, weight: .semibold))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Capsule().fill(Color.black.opacity(0.75)))
        Button {
          retour()
        } label: {
          Label("Données", systemImage: "chart.bar.fill")
        }
        .buttonStyle(BoutonSombre())
      }
      .padding(.bottom, 4)
    }
    .navigationTitle("Parcours")
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
          Text(sortie.course ? "Course terminée" : "Sortie terminée").font(.system(size: 17, weight: .bold))
        }
        HStack(spacing: 6) {
          Tuile(titre: "Durée", valeur: duree(sortie.secondes))
          Tuile(titre: "Distance", valeur: "\(km1(sortie.km)) km")
        }
        HStack(spacing: 6) {
          Tuile(
            titre: sortie.course ? "Allure moy." : "Vitesse moy.",
            valeur: sortie.course ? "\(allure(sortie.vitesseMoy)) /km" : "\(km1(sortie.vitesseMoy)) km/h"
          )
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
