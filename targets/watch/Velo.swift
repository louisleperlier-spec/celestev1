import Combine
import CoreLocation
import CoreMotion
import MapKit
import SwiftUI

enum EtapeVelo {
  case route, pause, bilan
}

/// Sortie vélo, course ou randonnée en extérieur : GPS de la montre (distance, vitesse, tracé), FC et calories, enregistrée dans Santé.
/// Randonnée : dénivelé positif mesuré par le baromètre (sinon l'altitude GPS) et altitude. Le tracé part à l'iPhone (territoires).
final class SortieVelo: NSObject, ObservableObject, CLLocationManagerDelegate {
  let entrainement: Entrainement
  let fcMax: Double
  let course: Bool
  let rando: Bool
  /// Sentier lancé depuis l'iPhone (« Ma rando »).
  let sentier: RandoMontre?
  @Published var dplus = 0.0
  @Published var altitude: Double?
  @Published var altMax: Double?
  private let altimetre = CMAltimeter()
  private var baroActif = false
  /// Altitude de référence du calcul du D+ (la montée ne compte qu'au-delà de 3 m, contre le bruit).
  private var base: Double?

  @Published var etape: EtapeVelo = .route
  @Published var secondes = 0
  @Published var km = 0.0
  @Published var vitesse = 0.0
  @Published var points: [CLLocationCoordinate2D] = []
  @Published var gpsActif = false
  @Published var enregistree = false
  /// Segment en cours (commande « Segment ») : départ en secondes et en km.
  @Published var segment = 1
  private var debutSegment = 0
  private var kmSegment = 0.0

  private let gps = CLLocationManager()
  private var derniere: CLLocation?
  private var minuterie: Timer?
  private var lance = false
  private var liens = Set<AnyCancellable>()
  private(set) var debut = Date()

  init(fcMax: Double, course: Bool = false, rando: Bool = false, sentier: RandoMontre? = nil) {
    self.fcMax = fcMax > 0 ? fcMax : 190
    self.course = course
    self.rando = rando
    self.sentier = rando ? sentier : nil
    entrainement = Entrainement(activite: rando ? .hiking : course ? .running : .cycling, lieu: .outdoor)
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

  /// Sommet : au moins 60 % du dénivelé du sentier, ou 100 m sans sentier (même règle que l'iPhone).
  var sommet: Bool { sentier.map { dplus >= $0.dplus * 0.6 } ?? (dplus >= 100) }

  /// Nouvelle altitude (baromètre ou GPS) : D+ si on est monté de plus de 3 m depuis le point bas.
  private func monter(_ a: Double) {
    guard etape == .route else { return }
    guard let b = base else { base = a; return }
    if a > b + 3 {
      dplus += a - b
      base = a
    } else if a < b {
      base = a
    }
  }

  private func demarrerAltimetre() {
    guard rando, CMAltimeter.isRelativeAltitudeAvailable() else { return }
    baroActif = true
    altimetre.startRelativeAltitudeUpdates(to: .main) { [weak self] d, _ in
      guard let self = self, let d = d else { return }
      self.monter(d.relativeAltitude.doubleValue)
    }
  }

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
    demarrerAltimetre()
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
    // Après une pause, la montée repart du point où l'on reprend.
    base = nil
    entrainement.reprendre()
    gps.startUpdatingLocation()
    Vibre.jouer(.start)
  }

  func terminer() {
    etape = .bilan
    gps.stopUpdatingLocation()
    altimetre.stopRelativeAltitudeUpdates()
    minuterie?.invalidate()
    minuterie = nil
    Vibre.jouer(.success)
  }

  var secondesSegment: Int { secondes - debutSegment }
  var kmDuSegment: Double { km - kmSegment }

  func nouveauSegment() {
    segment += 1
    debutSegment = secondes
    kmSegment = km
    Vibre.jouer(.click)
  }

  /// Commande « Nouveau » : la sortie est enregistrée telle quelle, puis on revient au choix.
  func terminerEtEnregistrer(fin: @escaping () -> Void) {
    if etape != .bilan { terminer() }
    enregistrer(fin: fin)
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
      sport: rando ? "rando" : course ? "course" : "velo",
      pts: traceEnvoi,
      dplus: rando ? dplus.rounded() : nil,
      altMax: rando ? altMax : nil,
      sentier: sentier?.id
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
    altimetre.stopRelativeAltitudeUpdates()
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
      if rando, l.verticalAccuracy > 0, l.verticalAccuracy <= 30 {
        altitude = l.altitude
        altMax = max(altMax ?? l.altitude, l.altitude)
        // Sans baromètre : D+ d'après l'altitude GPS.
        if !baroActif { monter(l.altitude) }
      }
      if l.speed >= 0 { vitesse = l.speed * 3.6 }
    }
    entrainement.ajouter(bonnes)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    gpsActif = false
  }
}

/// Sortie en cours, comme l'app Exercice : Commandes ← Suivre → Parcours (glisser), puis le bilan.
struct SortieView: View {
  @StateObject private var sortie: SortieVelo
  @State private var page = 1
  @Environment(\.dismiss) private var fermer

  init(fcMax: Double, course: Bool = false, rando: Bool = false, sentier: RandoMontre? = nil) {
    _sortie = StateObject(wrappedValue: SortieVelo(fcMax: fcMax, course: course, rando: rando, sentier: sentier))
  }

  private var titre: String {
    if page == 0 { return "Commandes" }
    if page == 2 { return "Parcours" }
    if sortie.etape == .pause { return "En pause" }
    return sortie.rando ? "Rando" : sortie.course ? "Course" : "Vélo"
  }

  var body: some View {
    NavigationStack {
      ZStack {
        if sortie.etape == .bilan {
          BilanVelo(sortie: sortie)
        } else {
          TabView(selection: $page) {
            CommandesView(
              enPause: sortie.etape == .pause,
              segment: sortie.segment,
              terminer: { sortie.terminer() },
              pause: { sortie.etape == .pause ? sortie.reprendre() : sortie.pause() },
              nouveau: { sortie.terminerEtEnregistrer { fermer() } },
              nouveauSegment: { sortie.nouveauSegment() }
            )
            .tag(0)
            SuivreSortie(sortie: sortie)
              .tag(1)
            CarteVelo(sortie: sortie)
              .tag(2)
          }
          .tabViewStyle(.page)
          .navigationTitle(titre)
        }
      }
    }
    .tint(Nea.rose)
    .onAppear { sortie.demarrer() }
    .onDisappear { sortie.abandonner() }
  }
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

/// Maquette 02 · Suivre : chrono, distance, vitesse (ou allure), FC et zone.
struct SuivreSortie: View {
  @ObservedObject var sortie: SortieVelo

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        Chrono(secondes: sortie.secondes)
        LigneMesure(valeur: km1(sortie.km), unite: "km")
        if sortie.rando {
          LigneMesure(valeur: "\(Int(sortie.dplus))", unite: sortie.sentier.map { "m D+\n/ \(Int($0.dplus))" } ?? "m\nD+")
          LigneMesure(valeur: sortie.altitude.map { "\(Int($0))" } ?? "--", unite: "m\nalt.")
        } else if sortie.course {
          LigneMesure(valeur: allure(sortie.vitesse), unite: "min\n/km")
        } else {
          LigneMesure(valeur: km1(sortie.vitesse), unite: "km/h")
        }
        LigneMesure(
          valeur: sortie.entrainement.bpm > 0 ? "\(Int(sortie.entrainement.bpm))" : "--",
          unite: sortie.zone > 0 ? "bpm\nzone \(sortie.zone)" : "bpm",
          coeur: true
        )
        if let s = sortie.sentier {
          Text(sortie.sommet ? "Sommet atteint ! 🏔️" : s.nom)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(Nea.rose)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
        Text("\(Int(sortie.entrainement.kcal)) kcal actives · \(sortie.gpsActif ? "GPS actif" : "Recherche GPS")")
          .font(.system(size: 12))
          .foregroundColor(Nea.texte2)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .padding(.top, 2)
        if sortie.segment > 1 {
          Text("Segment \(sortie.segment) · \(Nea.duree(sortie.secondesSegment)) · \(km1(sortie.kmDuSegment)) km")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(Nea.rose)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .padding(.top, 2)
        }
      }
    }
  }
}

/// Parcours : tracé orange sur la carte, distance et GPS.
struct CarteVelo: View {
  @ObservedObject var sortie: SortieVelo
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
      // Carte fixe (elle suit la position) : le glissement reste pour changer d'écran.
      .allowsHitTesting(false)
      VStack(spacing: 6) {
        HStack(spacing: 5) {
          Image(systemName: "location.fill").foregroundColor(Nea.rose)
          Text("\(km1(sortie.km)) km · \(sortie.gpsActif ? "GPS actif" : "Recherche GPS")").font(.system(size: 13, weight: .semibold))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Capsule().fill(Color.black.opacity(0.75)))
      }
      .padding(.bottom, 4)
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
          Text(sortie.rando ? (sortie.sommet ? "Sommet atteint !" : "Rando terminée") : sortie.course ? "Course terminée" : "Sortie terminée")
            .font(.system(size: 17, weight: .bold))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
        HStack(spacing: 6) {
          Tuile(titre: "Durée", valeur: Nea.duree(sortie.secondes))
          Tuile(titre: "Distance", valeur: "\(km1(sortie.km)) km")
        }
        if sortie.rando {
          HStack(spacing: 6) {
            Tuile(titre: "Dénivelé +", valeur: "\(Int(sortie.dplus)) m")
            Tuile(titre: "Alt. max", valeur: sortie.altMax.map { "\(Int($0)) m" } ?? "--")
          }
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
