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

struct EtatMontre: Codable {
  let v: Int
  let prenom: String
  let coach: String
  let semaine: [SeanceMontre]
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

enum DateISO {
  static func texte(_ d: Date) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.string(from: d)
  }
}
