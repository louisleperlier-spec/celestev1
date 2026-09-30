import Foundation
import HealthKit

/// Séance de renforcement dans Apple Santé : FC en direct et calories de la montre, enregistrée à la fin.
final class Entrainement: NSObject, ObservableObject {
  static let sante = HKHealthStore()

  @Published var bpm: Double = 0
  @Published var kcal: Double = 0
  @Published var fcMoy: Double = 0
  @Published var fcMax: Double = 0

  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?

  static func autoriser() {
    guard HKHealthStore.isHealthDataAvailable() else { return }
    let partage: Set<HKSampleType> = [HKObjectType.workoutType(), HKQuantityType(.activeEnergyBurned)]
    let lecture: Set<HKObjectType> = [HKQuantityType(.heartRate), HKQuantityType(.activeEnergyBurned), HKObjectType.workoutType()]
    sante.requestAuthorization(toShare: partage, read: lecture) { _, _ in }
  }

  func demarrer() {
    guard HKHealthStore.isHealthDataAvailable(), session == nil else { return }
    let config = HKWorkoutConfiguration()
    config.activityType = .traditionalStrengthTraining
    config.locationType = .indoor
    do {
      let s = try HKWorkoutSession(healthStore: Entrainement.sante, configuration: config)
      let b = s.associatedWorkoutBuilder()
      b.dataSource = HKLiveWorkoutDataSource(healthStore: Entrainement.sante, workoutConfiguration: config)
      s.delegate = self
      b.delegate = self
      session = s
      builder = b
      let debut = Date()
      s.startActivity(with: debut)
      b.beginCollection(withStart: debut) { _, _ in }
    } catch {
      session = nil
      builder = nil
    }
  }

  /// Termine la séance : enregistrée dans Santé (`sauver`) ou abandonnée.
  func terminer(sauver: Bool, fin: @escaping () -> Void) {
    guard let s = session, let b = builder else {
      fin()
      return
    }
    session = nil
    builder = nil
    s.end()
    b.endCollection(withEnd: Date()) { _, _ in
      if sauver {
        b.finishWorkout { _, _ in DispatchQueue.main.async { fin() } }
      } else {
        b.discardWorkout()
        DispatchQueue.main.async { fin() }
      }
    }
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
