import SwiftUI
import UserNotifications
import WatchKit

/// Catégories des notifications NÉA dessinées sur la montre (maquettes de l'utilisateur, comme OtterLife) :
/// VFC de l'heure selon l'état (0 excellent → 3 surcharge), récupération du matin, rappel de séance.
let CATEGORIES_NEA = ["NEA_VFC_0", "NEA_VFC_1", "NEA_VFC_2", "NEA_VFC_3", "NEA_RECUP", "NEA_SEANCE"]

/// Données posées par l'iPhone dans la notification (`nea` dans userInfo, ou dans `body` pour expo-notifications).
struct InfoNotif {
  var genre = "vfc"
  var niveau = 1
  var ms = 0
  var ecart = 0
  var heure = ""
  var score = 0
  var nom = ""
  var phrase = ""
  var titre = ""
  var minutes = 0

  init() {}

  init(_ u: [AnyHashable: Any], categorie: String) {
    let corps = u["body"] as? [String: Any]
    let n = (u["nea"] as? [String: Any]) ?? (corps?["nea"] as? [String: Any]) ?? [:]
    let entier = { (k: String) -> Int in (n[k] as? NSNumber)?.intValue ?? Int(n[k] as? String ?? "") ?? 0 }
    genre = n["genre"] as? String ?? (categorie == "NEA_SEANCE" ? "seance" : categorie == "NEA_RECUP" ? "recup" : "vfc")
    niveau = n["niveau"] != nil ? entier("niveau") : Int(categorie.suffix(1)) ?? 1
    niveau = Swift.min(3, Swift.max(0, niveau))
    ms = entier("ms")
    ecart = entier("ecart")
    heure = n["heure"] as? String ?? ""
    score = entier("score")
    nom = n["nom"] as? String ?? ""
    phrase = n["phrase"] as? String ?? ""
    titre = n["titre"] as? String ?? ""
    minutes = entier("min")
  }
}

/// Les quatre états de la VFC : nom de la carte, ressenti, phrase, pose d'Axel, bouton.
enum EtatNea {
  static let noms = ["Excellent", "Stable", "Fatigue", "Surcharge"]
  static let ressentis = ["Énergique", "Détendu", "Fatigué", "Stressé"]
  static let phrases = ["Prêt à bouger avec Axel ?", "Garde ce rythme tranquille.", "Accorde-toi une pause.", "Prends un moment pour souffler."]
  static let poses = ["ax_energique", "ax_stable", "ax_fatigue", "ax_stresse"]
  static let actions: [(String, String)] = [
    ("nea.seance", "Lancer ma séance"), ("nea.calme", "Moment calme"), ("nea.recup", "Mode récupération"), ("nea.respirer", "Respirer 1 min"),
  ]
}

/// Écran long d'une notification NÉA sur la montre ; les boutons viennent de `notificationActions`.
final class ControleurNotif: WKUserNotificationHostingController<VueNotif> {
  private var info = InfoNotif()

  override var body: VueNotif { VueNotif(info: info) }

  override func didReceive(_ notification: UNNotification) {
    let c = notification.request.content
    info = InfoNotif(c.userInfo, categorie: c.categoryIdentifier)
    let fg = UNNotificationActionOptions.foreground
    switch info.genre {
    case "seance":
      notificationActions = [
        UNNotificationAction(identifier: "nea.seance", title: "Commencer", options: fg),
        UNNotificationAction(identifier: "nea.plustard", title: "Dans 30 min", options: []),
      ]
    case "recup":
      notificationActions = [UNNotificationAction(identifier: "nea.seance", title: "Commencer", options: fg)]
    default:
      let a = EtatNea.actions[info.niveau]
      notificationActions = [UNNotificationAction(identifier: a.0, title: a.1, options: fg)]
    }
    setNeedsBodyUpdate()
  }
}

struct VueNotif: View {
  let info: InfoNotif

  var body: some View {
    switch info.genre {
    case "seance": NotifSeance(info: info)
    case "recup": NotifRecup(info: info)
    default: NotifVfc(info: info)
    }
  }
}

/// Pose d'Axel avec sa lueur orange.
private struct Pose: View {
  let nom: String
  var hauteur: CGFloat = 100

  var body: some View {
    Image(nom)
      .resizable()
      .scaledToFit()
      .frame(height: hauteur)
      .shadow(color: Nea.rose.opacity(0.35), radius: 12)
  }
}

/// VFC de l'heure : « Stable · 62 ms », barre gris → orange avec le curseur, dernière mesure.
struct NotifVfc: View {
  let info: InfoNotif

  /// Position du curseur : −30 % à +30 % de ta moyenne.
  private var position: CGFloat { CGFloat(Swift.min(0.97, Swift.max(0.03, (Double(info.ecart) + 30) / 60))) }

  var body: some View {
    VStack(spacing: 4) {
      Pose(nom: EtatNea.poses[info.niveau])
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text(EtatNea.noms[info.niveau]).foregroundColor(Nea.rose)
        Text("·")
        Text("\(info.ms)")
        Text("ms").font(.system(size: 15, weight: .bold, design: .rounded))
      }
      .font(.system(size: 24, weight: .bold, design: .rounded))
      .lineLimit(1)
      .minimumScaleFactor(0.6)
      Text("\(EtatNea.ressentis[info.niveau]) · \(EtatNea.phrases[info.niveau])")
        .font(.system(size: 13))
        .foregroundColor(Nea.texte2)
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.8)
      BarreVfc(position: position)
        .frame(height: 20)
        .padding(.horizontal, 4)
      if !info.heure.isEmpty {
        Text("Dernière mesure · \(info.heure)").font(.system(size: 12)).foregroundColor(Nea.texte2)
      }
    }
    .frame(maxWidth: .infinity)
  }
}

/// Barre de la VFC : dégradé gris → orange, curseur noir cerclé d'orange.
struct BarreVfc: View {
  let position: CGFloat

  var body: some View {
    GeometryReader { g in
      ZStack(alignment: .leading) {
        Capsule()
          .fill(LinearGradient(colors: [Color.gray.opacity(0.45), Nea.rose], startPoint: .leading, endPoint: .trailing))
          .frame(height: 9)
        RoundedRectangle(cornerRadius: 5)
          .fill(Color.black)
          .overlay(RoundedRectangle(cornerRadius: 5).stroke(Nea.rose, lineWidth: 2.5))
          .frame(width: 11, height: 20)
          .offset(x: g.size.width * position - 5.5)
      }
      .frame(height: g.size.height)
    }
  }
}

/// Récupération du matin : « En forme », phrase, score sur 100.
struct NotifRecup: View {
  let info: InfoNotif

  var body: some View {
    VStack(spacing: 3) {
      Pose(nom: info.niveau <= 1 ? "ax_forme" : info.niveau == 2 ? "ax_fatigue" : "ax_stresse")
      Text(info.nom.isEmpty ? "En forme" : info.nom)
        .font(.system(size: 26, weight: .bold, design: .rounded))
        .foregroundColor(Nea.rose)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      Text(info.phrase.isEmpty ? "Prêt pour ta prochaine séance" : info.phrase)
        .font(.system(size: 13))
        .foregroundColor(Nea.texte2)
        .multilineTextAlignment(.center)
        .lineLimit(2)
      Text("Score de récupération").font(.system(size: 12)).foregroundColor(Nea.texte2).padding(.top, 4)
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text("\(info.score)").font(.system(size: 30, weight: .bold, design: .rounded))
        Text("/ 100").font(.system(size: 20, weight: .semibold, design: .rounded)).foregroundColor(Nea.texte2)
      }
    }
    .frame(maxWidth: .infinity)
  }
}

/// Rappel de séance : « On bouge ensemble ? », séance · durée (boutons Commencer / Dans 30 min).
struct NotifSeance: View {
  let info: InfoNotif

  var body: some View {
    VStack(spacing: 4) {
      Pose(nom: "ax_seance")
      Text("On bouge ensemble ?")
        .font(.system(size: 20, weight: .bold, design: .rounded))
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.7)
      if !info.titre.isEmpty {
        Text(info.minutes > 0 ? "\(info.titre) · \(info.minutes) min" : info.titre)
          .font(.system(size: 14))
          .foregroundColor(Nea.texte2)
          .multilineTextAlignment(.center)
          .lineLimit(2)
      }
    }
    .frame(maxWidth: .infinity)
  }
}

/// Boutons des notifications sur la montre : séance, respiration, récupération, ou rappel dans 30 min.
final class ReponsesNotif: NSObject, UNUserNotificationCenterDelegate {
  static let partagees = ReponsesNotif()

  func activer() {
    let centre = UNUserNotificationCenter.current()
    centre.delegate = self
    // Mêmes catégories que l'iPhone (notifications posées par la montre elle-même, comme « Dans 30 min »).
    centre.setNotificationCategories(Set(CATEGORIES_NEA.map { UNNotificationCategory(identifier: $0, actions: [], intentIdentifiers: []) }))
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler fin: @escaping (UNNotificationPresentationOptions) -> Void) {
    fin([.banner, .sound])
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive reponse: UNNotificationResponse, withCompletionHandler fin: @escaping () -> Void) {
    let d = Donnees.partagees
    switch reponse.actionIdentifier {
    case "nea.plustard":
      // Même notification dans 30 min, posée par la montre.
      let ancien = reponse.notification.request.content
      let c = UNMutableNotificationContent()
      c.title = ancien.title
      c.body = ancien.body
      c.userInfo = ancien.userInfo
      c.categoryIdentifier = ancien.categoryIdentifier
      c.sound = .default
      let r = UNNotificationRequest(identifier: "nea.plustard.\(Int(Date().timeIntervalSince1970))", content: c, trigger: UNTimeIntervalNotificationTrigger(timeInterval: 30 * 60, repeats: false))
      center.add(r)
    case "nea.seance":
      DispatchQueue.main.async { d.demandeSeance = true }
    case "nea.respirer", "nea.calme":
      DispatchQueue.main.async { d.ouvrirEcran = "respiration" }
    case "nea.recup":
      DispatchQueue.main.async { d.ouvrirEcran = "recup" }
    default:
      break
    }
    fin()
  }
}
