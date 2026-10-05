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
  /// Sentier choisi sur l'iPhone (build 19).
  let rando: RandoMontre?
  /// Partie Sommeil (build 27) : réveil, coucher conseillé, nuit en cours, pluie de l'iPhone.
  let sommeil: SommeilMontre?

  /// Score santé (0–100) : moyenne des parts d'Effort, de Récupération et de Sommeil connues.
  var score: Int? {
    guard let b = bilan else { return nil }
    var parts = [min(1, b.effort / 100)]
    if b.recup > 0 { parts.append(min(1, b.recup / 100)) }
    if b.sommeil > 0 { parts.append(min(1, b.sommeil / 8)) }
    return Int((parts.reduce(0, +) / Double(parts.count) * 100).rounded())
  }
}

struct SommeilMontre: Codable {
  let reveil: String
  let actif: Bool
  let coucher: String
  let vibration: Bool
  let objectif: Double
  let nuit: Bool
  let pluie: Bool
}

/// Messages Sommeil vers l'iPhone : réveil réglé à la couronne, nuit commencée / terminée, pluie, ressenti du matin.
struct ReveilEnvoi: Encodable {
  let h: String
  let vibration: Bool
}

struct ActionEnvoi: Encodable {
  let action: String
  var volume: Double? = nil
}

struct RessentiEnvoi: Encodable {
  let q: Int
  let coucher: String?
  let reveil: String?
  let hrv: Double?
  let rhr: Double?
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
  /// « course », « velo » ou « rando » (absent avant le build 11 = vélo).
  var sport: String? = nil
  /// Tracé GPS [latitude, longitude] (500 points au plus) : l'iPhone en déduit les territoires conquis.
  var pts: [[Double]]? = nil
  /// Randonnée (build 19) : dénivelé positif (baromètre), altitude max et sentier lancé depuis l'iPhone.
  var dplus: Double? = nil
  var altMax: Double? = nil
  var sentier: String? = nil
}

/// Sentier choisi sur l'iPhone (« Ouvrir sur la montre » d'une fiche de randonnée, build 19).
struct RandoMontre: Codable, Hashable, Identifiable {
  let id: String
  let nom: String
  let lieu: String
  let km: Double
  let dplus: Double
  let altSommet: Double
  let min: Double
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
