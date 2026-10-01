import SwiftUI
import WatchKit

/// Couleurs et boutons de NÉA sur la montre : fond noir, rose néon, cartes grises.
enum Nea {
  static let rose = Color(red: 1.0, green: 0.42, blue: 0.10)
  static let carte = Color(red: 0.13, green: 0.13, blue: 0.15)
  static let texte2 = Color(red: 0.68, green: 0.69, blue: 0.73)
  static let surRose = Color(red: 0.11, green: 0.12, blue: 0.14)

  static let jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

  /// Lundi = 0 … dimanche = 6.
  static func aujourdhui(_ d: Date = Date()) -> Int {
    (Calendar.current.component(.weekday, from: d) + 5) % 7
  }

  static func quand(_ jour: Int) -> String {
    if jour < 0 { return "Séance prête" }
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

  /// « 12:34 », ou « 1:02:03 » après une heure.
  static func duree(_ s: Int) -> String {
    s >= 3600 ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60) : mmss(s)
  }
}

/// Bouton principal : rose plein avec lueur rose (maquettes).
struct BoutonRose: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 17, weight: .bold))
      .foregroundColor(Nea.surRose)
      .frame(maxWidth: .infinity, minHeight: 46)
      .background(RoundedRectangle(cornerRadius: 23).fill(Nea.rose))
      .shadow(color: Nea.rose.opacity(0.55), radius: 8)
      .opacity(configuration.isPressed ? 0.75 : 1)
  }
}

/// Bouton secondaire : noir bordé de rose (Pause, Terminer, Synchroniser…).
struct BoutonSombre: ButtonStyle {
  var couleur: Color = .white
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 17, weight: .bold))
      .foregroundColor(couleur)
      .frame(maxWidth: .infinity, minHeight: 46)
      .background(RoundedRectangle(cornerRadius: 23).fill(Nea.carte))
      .overlay(RoundedRectangle(cornerRadius: 23).stroke(Nea.rose.opacity(0.45), lineWidth: 1))
      .opacity(configuration.isPressed ? 0.75 : 1)
  }
}

/// Gros chiffre blanc avec lueur rose (temps, reps, vitesse…).
struct GrosChiffre: View {
  let texte: String
  var taille: CGFloat = 56
  var couleur: Color = .white

  var body: some View {
    Text(texte)
      .font(.system(size: taille, weight: .heavy, design: .rounded))
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.5)
      .foregroundColor(couleur)
      .shadow(color: Nea.rose.opacity(0.8), radius: 10)
      .frame(maxWidth: .infinity)
  }
}

/// Ligne « libellé … valeur » séparée par un filet (bilan, récupération, réglages).
struct LigneValeur: View {
  let titre: String
  let valeur: String

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        Text(titre).font(.system(size: 15)).foregroundColor(Nea.texte2).lineLimit(1).minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        Text(valeur).font(.system(size: 16, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
      }
      .padding(.vertical, 7)
      Rectangle().fill(Nea.texte2.opacity(0.25)).frame(height: 0.5)
    }
  }
}

/// Ligne de menu : icône rose, titre, valeur, chevron.
struct LigneMenu: View {
  let icone: String
  let titre: String
  var valeur: String = ""

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: icone).font(.system(size: 18)).foregroundColor(Nea.rose).frame(width: 24)
      Text(titre).font(.system(size: 16, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.7)
      Spacer(minLength: 4)
      if !valeur.isEmpty { Text(valeur).font(.system(size: 14)).foregroundColor(Nea.texte2) }
      Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundColor(Nea.texte2)
    }
    .padding(.vertical, 11)
    .padding(.horizontal, 12)
    .background(RoundedRectangle(cornerRadius: 18).fill(Nea.carte))
  }
}

/// Petit « NÉA » rose en haut des écrans.
struct Marque: View {
  var body: some View {
    Text("NÉA").font(.system(size: 15, weight: .heavy)).foregroundColor(Nea.rose)
  }
}

/// Vibrations, coupables dans Réglages.
enum Vibre {
  static let cle = "nea.vibrations"

  static var actif: Bool {
    UserDefaults.standard.object(forKey: cle) as? Bool ?? true
  }

  static func jouer(_ t: WKHapticType) {
    if actif { WKInterfaceDevice.current().play(t) }
  }
}

/// Anneau de progression (bilan, repos, respiration).
struct Anneau: View {
  let part: Double
  var couleur: Color = Nea.rose
  var trait: CGFloat = 6

  var body: some View {
    ZStack {
      Circle().stroke(couleur.opacity(0.2), lineWidth: trait)
      Circle()
        .trim(from: 0, to: max(0, min(1, part)))
        .stroke(couleur, style: StrokeStyle(lineWidth: trait, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
  }
}
