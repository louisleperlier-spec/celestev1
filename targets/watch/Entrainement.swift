import Foundation
import CoreLocation
import HealthKit

/// Entraînement Apple Santé (renforcement, vélo, mesure au calme) : FC en direct et calories de la montre,
/// tracé GPS pour le vélo en extérieur, enregistré à la fin.
final class Entrainement: NSObject, ObservableObject {
  let activite: HKWorkoutActivityType
  let lieu: HKWorkoutSessionLocationType

  init(activite: HKWorkoutActivityType = .traditionalStrengthTraining, lieu: HKWorkoutSessionLocationType = .indoor) {
    self.activite = activite
    self.lieu = lieu
    super.init()
  }

  static let sante = HKHealthStore()

  @Published var bpm: Double = 0
  @Published var kcal: Double = 0
  @Published var fcMoy: Double = 0
  @Published var fcMax: Double = 0

  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  private var route: HKWorkoutRouteBuilder?
  private(set) var debut = Date()

  static func autoriser() {
    guard HKHealthStore.isHealthDataAvailable() else { return }
    let partage: Set<HKSampleType> = [
      HKObjectType.workoutType(), HKQuantityType(.activeEnergyBurned), HKQuantityType(.distanceCycling), HKQuantityType(.distanceWalkingRunning),
      HKSeriesType.workoutRoute(), HKCategoryType(.mindfulSession),
    ]
    let lecture: Set<HKObjectType> = [
      HKQuantityType(.heartRate), HKQuantityType(.activeEnergyBurned), HKObjectType.workoutType(),
      HKQuantityType(.heartRateVariabilitySDNN), HKQuantityType(.restingHeartRate), HKQuantityType(.stepCount),
    ]
    sante.requestAuthorization(toShare: partage, read: lecture) { _, _ in }
  }

  func demarrer() {
    guard HKHealthStore.isHealthDataAvailable(), session == nil else { return }
    let config = HKWorkoutConfiguration()
    config.activityType = activite
    config.locationType = lieu
    do {
      let s = try HKWorkoutSession(healthStore: Entrainement.sante, configuration: config)
      let b = s.associatedWorkoutBuilder()
      b.dataSource = HKLiveWorkoutDataSource(healthStore: Entrainement.sante, workoutConfiguration: config)
      s.delegate = self
      b.delegate = self
      session = s
      builder = b
      if lieu == .outdoor { route = HKWorkoutRouteBuilder(healthStore: Entrainement.sante, device: nil) }
      debut = Date()
      s.startActivity(with: debut)
      b.beginCollection(withStart: debut) { _, _ in }
    } catch {
      session = nil
      builder = nil
    }
  }

  func pause() { session?.pause() }

  func reprendre() { session?.resume() }

  /// Positions GPS du vélo, ajoutées au tracé enregistré dans Santé.
  func ajouter(_ positions: [CLLocation]) {
    guard let r = route, !positions.isEmpty else { return }
    r.insertRouteData(positions) { _, _ in }
  }

  /// Termine l'entraînement : enregistré dans Santé (`sauver`, avec son tracé) ou abandonné.
  func terminer(sauver: Bool, fin: @escaping () -> Void) {
    guard let s = session, let b = builder else {
      fin()
      return
    }
    let r = route
    session = nil
    builder = nil
    route = nil
    s.end()
    b.endCollection(withEnd: Date()) { _, _ in
      if sauver {
        b.finishWorkout { workout, _ in
          if let w = workout, let r = r {
            r.finishRoute(with: w, metadata: nil) { _, _ in }
          }
          DispatchQueue.main.async { fin() }
        }
      } else {
        b.discardWorkout()
        DispatchQueue.main.async { fin() }
      }
    }
  }

  /// Dernière VFC (SDNN) mesurée par la montre dans les 24 h, en ms.
  static func derniereVFC(_ fin: @escaping (Double?) -> Void) {
    let type = HKQuantityType(.heartRateVariabilitySDNN)
    let depuis = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-24 * 3600), end: Date())
    let tri = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
    let q = HKSampleQuery(sampleType: type, predicate: depuis, limit: 1, sortDescriptors: [tri]) { _, res, _ in
      let v = (res?.first as? HKQuantitySample)?.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
      DispatchQueue.main.async { fin(v) }
    }
    sante.execute(q)
  }

  /// Séance de respiration enregistrée comme « pleine conscience » dans Santé.
  static func pleineConscience(debut: Date, fin: Date) {
    let s = HKCategorySample(type: HKCategoryType(.mindfulSession), value: HKCategoryValue.notApplicable.rawValue, start: debut, end: fin)
    sante.save(s) { _, _ in }
  }
}

extension Entrainement: HKWorkoutSessionDelegate {
  func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {}

  func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {}
}

extension Entrainement: HKLiveWorkoutBuilderDelegate {
  func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

  func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
    let fc = HKQuantityType(.heartRate)
    let energie = HKQuantityType(.activeEnergyBurned)
    let parMin = HKUnit.count().unitDivided(by: HKUnit.minute())
    var bpm: Double?
    var moy: Double?
    var max: Double?
    var kcal: Double?
    if collectedTypes.contains(fc), let st = workoutBuilder.statistics(for: fc) {
      bpm = st.mostRecentQuantity()?.doubleValue(for: parMin)
      moy = st.averageQuantity()?.doubleValue(for: parMin)
      max = st.maximumQuantity()?.doubleValue(for: parMin)
    }
    if collectedTypes.contains(energie), let st = workoutBuilder.statistics(for: energie) {
      kcal = st.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie())
    }
    DispatchQueue.main.async {
      if let v = bpm { self.bpm = v }
      if let v = moy { self.fcMoy = v }
      if let v = max { self.fcMax = v }
      if let v = kcal { self.kcal = v }
    }
  }
}
