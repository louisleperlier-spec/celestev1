import Foundation

/// Contrat partagé avec `src/store/liaisonMontre.ts` (version 1).
struct ExoMontre: Codable, Hashable {
  let id: String
  let nom: String
  let series: Int
  let reps: Int
  let repsTxt: String
  let sec: Int
  let repos: Int
  let charge: String
  let kg: Double
  let double: Bool
  let pas: Double
  let kcal: Double

  /// « 3 × 10 » ou « 3 × 30 s ».
  var volume: String {
    sec > 0 ? "\(series) × \(sec) s" : "\(series) × \(repsTxt)"
  }
}

struct SeanceMontre: Codable, Hashable, Identifiable {
  let jour: Int
  let quand: String
  let titre: String
  let min: Double
  let kcal: Double
  let exos: [ExoMontre]

  var id: String { "\(jour)-\(titre)" }
}

struct BilanMontre: Codable {
  let effort: Double
  let recup: Double
  let sommeil: Double
  let score: Double
  let recupTxt: String
}

struct NuitMontre: Codable {
  let h: Double
  let rhr: Double
  let hrv: Double
  let src: String
}

struct CoachMontre: Codable {
  let nom: String
  let style: String
  let daily: String
  let dernier: String
}

struct ProgresMontre: Codable {
  let seances: Int
  let objectif: Int
  let serie: Int
  let niveau: Int
  let xp: Double
  let xpNiveau: Double
  let rang: String
  let derniere: String
}

/// État envoyé par l'iPhone ; les champs du hub (version 2) sont optionnels.
struct EtatMontre: Codable {
  let v: Int
  let prenom: String
  let coach: String
  let semaine: [SeanceMontre]
  let bilan: BilanMontre?
  let nuit: NuitMontre?
  let coachInfo: CoachMontre?
  let progres: ProgresMontre?
  let fcMax: Double?
  let poids: Double?
  let explorer: [SeanceMontre]?
  let coachs: [CoachResume]?
  /// Séance choisie sur l'iPhone (« Ouvrir sur la montre ») et son programme (build 18).
  let choisie: SeanceMontre?
  let choisieProg: String?

  /// Score santé (0–100) : moyenne des parts d'Effort, de Récupération et de Sommeil connues.
  var score: Int? {
    guard let b = bilan else { return nil }
    var parts = [min(1, b.effort / 100)]
    if b.recup > 0 { parts.append(min(1, b.recup / 100)) }
    if b.sommeil > 0 { parts.append(min(1, b.sommeil / 8)) }
    return Int((parts.reduce(0, +) / Double(parts.count) * 100).rounded())
  }
}

struct CoachResume: Codable, Hashable {
  let id: String
  let nom: String
  let spec: String
}

struct ChoixCoach: Codable {
  let id: String
}

/// Séance terminée, envoyée à l'iPhone.
struct ResultatMontre: Codable {
  let id: String
  let debut: String
  let fin: String
  let titre: String
  let sec: Int
  let kcal: Double
  let fcMoy: Double
  let fcMax: Double
  let series: Int
  let volume: Double
}

/// Sortie vélo terminée sur la montre.
struct VeloMontre: Codable {
  let id: String
  let debut: String
  let fin: String
  let sec: Int
  let km: Double
  let kcal: Double
  let fcMoy: Double
  let fcMax: Double
  /// « course » ou « velo » (absent avant le build 11 = vélo).
  var sport: String? = nil
  /// Tracé GPS [latitude, longitude] (500 points au plus) : l'iPhone en déduit les territoires conquis.
  var pts: [[Double]]? = nil
}

/// Mesure de récupération d'1 minute.
struct MesureMontre: Codable {
  let d: String
  let hrv: Double
  let bpm: Double
}

struct CoachEnvoi: Codable {
  let texte: String
}

enum DateISO {
  static func texte(_ d: Date) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.string(from: d)
  }
}
