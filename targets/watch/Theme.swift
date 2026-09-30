import SwiftUI

/// Couleurs et boutons de NÉA sur la montre : fond noir, rose néon, cartes grises.
enum Nea {
  static let rose = Color(red: 1.0, green: 0.31, blue: 0.64)
  static let carte = Color(red: 0.13, green: 0.13, blue: 0.15)
  static let texte2 = Color(red: 0.68, green: 0.69, blue: 0.73)
  static let surRose = Color(red: 0.11, green: 0.12, blue: 0.14)

  static let jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

  /// Lundi = 0 … dimanche = 6.
  static func aujourdhui(_ d: Date = Date()) -> Int {
    (Calendar.current.component(.weekday, from: d) + 5) % 7
  }

  static func quand(_ jour: Int) -> String {
    let a = aujourdhui()
    if jour == a { return "Aujourd'hui" }
    if jour == a + 1 { return "Demain" }
    return jours[max(0, min(6, jour))]
  }

  /// « 12,5 » à la française.
  static func kg(_ v: Double) -> String {
    let t = v.rounded() == v ? String(Int(v)) : String(format: "%.1f", v)
    return t.replacingOccurrences(of: ".", with: ",")
  }

  static func mmss(_ s: Int) -> String {
    String(format: "%02d:%02d", max(0, s) / 60, max(0, s) % 60)
  }
}

struct BoutonRose: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 17, weight: .bold))
      .foregroundColor(Nea.surRose)
      .frame(maxWidth: .infinity, minHeight: 44)
      .background(RoundedRectangle(cornerRadius: 22).fill(Nea.rose))
      .opacity(configuration.isPressed ? 0.75 : 1)
  }
}

struct BoutonSombre: ButtonStyle {
  var couleur: Color = .white
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 17, weight: .bold))
      .foregroundColor(couleur)
      .frame(maxWidth: .infinity, minHeight: 44)
      .background(RoundedRectangle(cornerRadius: 22).fill(Nea.carte))
      .opacity(configuration.isPressed ? 0.75 : 1)
  }
}

/// Petit « NÉA » rose en haut des écrans.
struct Marque: View {
  var body: some View {
    Text("NÉA").font(.system(size: 15, weight: .heavy)).foregroundColor(Nea.rose)
  }
}
