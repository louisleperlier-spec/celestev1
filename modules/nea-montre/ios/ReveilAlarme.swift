import Foundation
import SwiftUI
#if canImport(AlarmKit)
import AlarmKit
#endif

/// Réveil de la partie Sommeil (maquette « Ton réveil ») : vraie alarme de l'iPhone avec AlarmKit (iOS 26+), qui sonne même en mode
/// silencieux et s'affiche en plein écran. Sur un iPhone plus ancien ou si l'accès est refusé, le JS se replie sur des notifications sonores.
enum ReveilAlarme {
  static let cle = "neaReveilId"

  static var disponible: Bool {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) { return true }
    #endif
    return false
  }

  /// Retourne "alarmkit" si l'alarme est programmée, "refuse" si l'accès est refusé, "indisponible" sinon.
  static func programmer(heure: Int, minute: Int, jours: [Int], son: String) async -> String {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) {
      return await Moteur.programmer(heure: heure, minute: minute, jours: jours, son: son)
    }
    #endif
    return "indisponible"
  }

  static func annuler() {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) { Moteur.annuler() }
    #endif
  }
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct NeaReveilMeta: AlarmMetadata {}

@available(iOS 26.0, *)
private enum Moteur {
  static func autoriser() async -> Bool {
    switch AlarmManager.shared.authorizationState {
    case .authorized: return true
    case .notDetermined:
      let etat = try? await AlarmManager.shared.requestAuthorization()
      return etat == .authorized
    default: return false
    }
  }

  /// 0 = lundi … 6 = dimanche (comme l'app).
  static func jour(_ i: Int) -> Locale.Weekday {
    [.monday, .tuesday, .wednesday, .thursday, .friday, .saturday, .sunday][max(0, min(6, i))]
  }

  static func programmer(heure: Int, minute: Int, jours: [Int], son: String) async -> String {
    guard await autoriser() else { return "refuse" }
    annuler()
    let arreter = AlarmButton(text: "Arrêter", textColor: .white, systemImageName: "sun.max.fill")
    let alerte = AlarmPresentation.Alert(title: "Bonjour, c'est l'heure ☀️", stopButton: arreter)
    let attributs = AlarmAttributes<NeaReveilMeta>(presentation: AlarmPresentation(alert: alerte), metadata: NeaReveilMeta(), tintColor: Color(red: 1.0, green: 0.42, blue: 0.10))
    let temps = Alarm.Schedule.Relative.Time(hour: heure, minute: minute)
    let repete: Alarm.Schedule.Relative.Recurrence = jours.isEmpty ? .never : .weekly(jours.map(jour))
    let horaire = Alarm.Schedule.relative(.init(time: temps, repeats: repete))
    let config = AlarmManager.AlarmConfiguration<NeaReveilMeta>(
      countdownDuration: nil,
      schedule: horaire,
      attributes: attributs,
      stopIntent: nil,
      secondaryIntent: nil,
      sound: son.isEmpty ? .default : .named(son)
    )
    let id = UUID()
    do {
      _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
      UserDefaults.standard.set(id.uuidString, forKey: ReveilAlarme.cle)
      return "alarmkit"
    } catch {
      return "indisponible"
    }
  }

  static func annuler() {
    if let s = UserDefaults.standard.string(forKey: ReveilAlarme.cle), let id = UUID(uuidString: s) {
      try? AlarmManager.shared.cancel(id: id)
    }
    UserDefaults.standard.removeObject(forKey: ReveilAlarme.cle)
  }
}
#endif
