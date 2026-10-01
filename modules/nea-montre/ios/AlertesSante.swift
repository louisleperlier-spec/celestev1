import Foundation
import HealthKit
import UserNotifications

/// Alertes santé de l'iPhone, même app fermée : Apple Santé réveille NÉA (livraison en arrière-plan, au plus
/// toutes les heures) quand la VFC, les pas ou les calories changent ; NÉA envoie alors une notification locale :
/// - VFC et fatigue (au plus une par heure, de 8 h à 22 h) : dernière VFC (SDNN) comparée à la moyenne des 14 derniers jours ;
/// - pas : 80 % puis 100 % de l'objectif, une fois chacun par jour ;
/// - vélo et dépense du jour (une fois, entre 16 h et 20 h) : calories actives restantes selon la forme du jour ;
/// - eau : rappels programmés à 10 h, 12 h, 14 h, 16 h, 18 h et 20 h.
/// Les réglages viennent de l'app (`configurerAlertes`), gardés dans le groupe d'apps.
final class AlertesSante {
  static let partagees = AlertesSante()

  struct Reglages: Codable {
    var vfc = true
    var eau = true
    var velo = true
    var pas = true
    var objectifPas = 10000.0
    var objectifKcal = 400.0
    var poids = 70.0
  }

  private let sante = HKHealthStore()
  private let ud = UserDefaults.standard
  private var observe = false
  private let file = DispatchQueue(label: "nea.alertes")

  private var reglages: Reglages {
    guard let s = UserDefaults(suiteName: "group.com.neacoach.app")?.string(forKey: "alertes"),
          let d = s.data(using: .utf8),
          let r = try? JSONDecoder().decode(Reglages.self, from: d) else { return Reglages() }
    return r
  }

  /// Réglages envoyés par l'app : gardés, rappels d'eau reprogrammés, observateurs Apple Santé démarrés.
  func configurer(_ json: String) {
    UserDefaults(suiteName: "group.com.neacoach.app")?.set(json, forKey: "alertes")
    programmerEau(reglages.eau)
    activer()
  }

  /// Au lancement (même en arrière-plan) : observe la VFC, les pas et les calories actives.
  func activer() {
    guard HKHealthStore.isHealthDataAvailable(), !observe else { return }
    let r = reglages
    guard r.vfc || r.velo || r.pas else { return }
    observe = true
    let types: [HKQuantityType] = [HKQuantityType(.heartRateVariabilitySDNN), HKQuantityType(.stepCount), HKQuantityType(.activeEnergyBurned)]
    for t in types {
      let q = HKObserverQuery(sampleType: t, predicate: nil) { [weak self] _, fin, erreur in
        guard let self = self, erreur == nil else { return fin() }
        self.evaluer { fin() }
      }
      sante.execute(q)
      sante.enableBackgroundDelivery(for: t, frequency: .hourly) { _, _ in }
    }
  }

  // MARK: Évaluation

  private func evaluer(_ fin: @escaping () -> Void) {
    file.async {
      let r = self.reglages
      let maintenant = Date()
      let h = Calendar.current.component(.hour, from: maintenant)
      let groupe = DispatchGroup()
      var vfc: (ms: Double, date: Date)?
      var moyenne: Double?
      var pas: Double?
      var kcal: Double?

      groupe.enter()
      self.derniereVfc { v in vfc = v; groupe.leave() }
      groupe.enter()
      self.moyenneVfc { m in moyenne = m; groupe.leave() }
      groupe.enter()
      self.sommeDuJour(.stepCount, unite: .count()) { n in pas = n; groupe.leave() }
      groupe.enter()
      self.sommeDuJour(.activeEnergyBurned, unite: .kilocalorie()) { n in kcal = n; groupe.leave() }

      groupe.notify(queue: self.file) {
        let etat = vfc.flatMap { v in moyenne.map { Etat(ms: v.ms, moyenne: $0) } }
        // VFC et fatigue : au plus une par heure, de 8 h à 22 h.
        if r.vfc, (8..<22).contains(h), let v = vfc, let e = etat, self.depuis("nea.alerte.vfc") >= 55 * 60 {
          self.marquer("nea.alerte.vfc")
          let heure = DateFormatter.localizedString(from: v.date, dateStyle: .none, timeStyle: .short)
          self.notifier(id: "vfc", titre: "\(e.emoji) VFC \(Int(v.ms.rounded())) ms · \(e.nom) · \(heure)", texte: e.texte)
        }
        // Pas : 80 % puis objectif atteint, une fois chacun par jour.
        if r.pas, let n = pas, r.objectifPas > 0 {
          if n >= r.objectifPas, self.premiereFoisAujourdhui("nea.alerte.pas100") {
            self.notifier(id: "pas", titre: "👏 Objectif de pas atteint", texte: [
              "\(Self.nombre(n)) pas ! Tes chaussures demandent une augmentation 👟🏅",
              "\(Self.nombre(n)) pas aujourd'hui. Ton podomètre est fier, ta grand-mère aussi 🏅",
              "\(Self.nombre(n)) pas : objectif pulvérisé. Le trottoir porte plainte 🚔😂",
            ].randomElement()!)
          } else if n >= r.objectifPas * 0.8, n < r.objectifPas, self.premiereFoisAujourdhui("nea.alerte.pas80") {
            let reste = r.objectifPas - n
            self.notifier(id: "pas", titre: "🚶 Déjà 80 % de tes pas", texte: [
              "\(Self.nombre(n)) pas ! Encore \(Self.nombre(reste)), soit ~\(Int((reste / 110).rounded())) min de marche. Le frigo ne compte pas comme destination 🍕",
              "Plus que \(Self.nombre(reste)) pas (~\(Int((reste / 110).rounded())) min). Allez, une balade : tes jambes ont des choses à dire 🦵",
            ].randomElement()!)
          }
        }
        // Vélo et dépense du jour : une fois, entre 16 h et 20 h, selon la forme.
        if r.velo, (16..<20).contains(h), let k = kcal, self.premiereFoisAujourdhui("nea.alerte.velo") {
          let reste = max(0, r.objectifKcal - k)
          let minVelo = Int((reste / max(1, 6.8 * r.poids / 60)).rounded())
          var titre = ""
          var texte = ""
          if reste <= 0 {
            titre = "✅ Dépense du jour bouclée"
            texte = "\(Int(k)) kcal brûlées. Tu as officiellement le droit de glander ce soir. C'est scientifique (presque) 🛋️"
          } else if etat?.niveau == 3 {
            titre = "🛑 Ton corps dit non (poliment)"
            texte = "VFC basse : ce soir, le seul sprint autorisé, c'est vers ton lit. Une petite marche maximum 🧘"
          } else if etat?.niveau == 2 {
            titre = "🚲 Il te reste \(Int(reste)) kcal"
            texte = "Petit coup de mou ? \(max(10, minVelo)) min de vélo tranquille, façon balade du dimanche, et la journée est bouclée 🌿"
          } else {
            titre = "🚴 Il te reste \(Int(reste)) kcal à dépenser"
            texte = [
              "Ta forme est au top : \(max(10, minVelo)) min de vélo et c'est plié. Ton vélo s'ennuie, il me l'a dit 🔥",
              "\(max(10, minVelo)) min de vélo et la journée est bouclée. Tes cuisses t'attendent, ton canapé peut patienter 😏",
              "Il reste de l'essence dans le moteur ! \(max(10, minVelo)) min de vélo et tu passes en mode légende 🚀",
            ].randomElement()!
          }
          self.notifier(id: "velo", titre: titre, texte: texte)
        }
        fin()
      }
    }
  }

  /// Forme du jour d'après la VFC : 0 excellente, 1 bonne, 2 fatigue, 3 surcharge.
  struct Etat {
    let niveau: Int
    let nom: String
    let texte: String
    /// Pastille du titre : 💚 excellente, 🙂 bonne, 😮‍💨 fatigue, 🚨 surcharge.
    var emoji: String { ["💚", "🙂", "😮‍💨", "🚨"][niveau] }

    init(ms: Double, moyenne: Double) {
      let ecart = moyenne > 0 ? (ms - moyenne) / moyenne : 0
      let p = Int((ecart * 100).rounded())
      let signe = p >= 0 ? "+\(p)" : "\(p)"
      let s = "\(signe) %"
      if ecart >= 0.1 {
        niveau = 0; nom = "Excellent"
        texte = [
          "Ta VFC est à \(s) de ta moyenne. Ton système nerveux est en vacances à Cancún 🏖️ Profites-en pour t'entraîner 💪",
          "\(s) vs ta moyenne : tu récupères comme un chat qui fait la sieste au soleil 😼 Go séance !",
          "VFC au top (\(s)). Même ton coach est jaloux 😎 C'est le moment de tout casser (pas la vaisselle) 💪",
        ].randomElement()!
      } else if ecart >= -0.1 {
        niveau = 1; nom = "Bon"
        texte = [
          "Dans ta moyenne (\(s)). Ni Hulk, ni paresseux : juste toi, en forme 🙂 Un verre d'eau et ça roule 💧",
          "\(s) : forme stable comme le Wi-Fi d'un hôtel 5 étoiles 📶 Continue comme ça !",
          "Tout est sous contrôle (\(s)). Ton cœur fait son job, fais le tien : bouge un peu 🚶",
        ].randomElement()!
      } else if ecart >= -0.25 {
        niveau = 2; nom = "Fatigue"
        texte = [
          "Ta VFC fait la grasse matinée (\(s)) 😮‍💨 Bois de l'eau, respire 2 min, et séance tranquille, pas mode gladiateur 🧘",
          "\(s) sous ta moyenne : ton corps a activé le mode économie d'énergie 🔋 Recharge-le doucement.",
          "Petite fatigue détectée (\(s)). Ton canapé t'a envoyé une invitation… accepte-la à moitié 🛋️",
        ].randomElement()!
      } else {
        niveau = 3; nom = "Surcharge"
        texte = [
          "Alerte rouge (\(s)) 🚨 Ton corps a ouvert un ticket au service client. Repos, dodo, zéro héroïsme aujourd'hui 🛌",
          "\(s) : ton système nerveux réclame des vacances. Accorde-lui au moins une soirée canapé-tisane 🍵",
          "Surcharge (\(s)) ! Même les super-héros posent la cape. Aujourd'hui, c'est sieste olympique 🛌",
        ].randomElement()!
      }
    }
  }

  // MARK: Apple Santé

  private func derniereVfc(_ fin: @escaping ((ms: Double, date: Date)?) -> Void) {
    let q = HKSampleQuery(
      sampleType: HKQuantityType(.heartRateVariabilitySDNN),
      predicate: HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-24 * 3600), end: Date()),
      limit: 1,
      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
    ) { _, s, _ in
      guard let e = s?.first as? HKQuantitySample else { return fin(nil) }
      fin((e.quantity.doubleValue(for: .secondUnit(with: .milli)), e.endDate))
    }
    sante.execute(q)
  }

  private func moyenneVfc(_ fin: @escaping (Double?) -> Void) {
    let q = HKStatisticsQuery(
      quantityType: HKQuantityType(.heartRateVariabilitySDNN),
      quantitySamplePredicate: HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-14 * 86400), end: Date()),
      options: .discreteAverage
    ) { _, s, _ in
      fin(s?.averageQuantity()?.doubleValue(for: .secondUnit(with: .milli)))
    }
    sante.execute(q)
  }

  private func sommeDuJour(_ id: HKQuantityTypeIdentifier, unite: HKUnit, _ fin: @escaping (Double?) -> Void) {
    let q = HKStatisticsQuery(
      quantityType: HKQuantityType(id),
      quantitySamplePredicate: HKQuery.predicateForSamples(withStart: Calendar.current.startOfDay(for: Date()), end: Date()),
      options: .cumulativeSum
    ) { _, s, _ in
      fin(s?.sumQuantity()?.doubleValue(for: unite))
    }
    sante.execute(q)
  }

  // MARK: Notifications

  private func notifier(id: String, titre: String, texte: String) {
    let c = UNMutableNotificationContent()
    c.title = titre
    c.body = texte
    c.sound = .default
    c.threadIdentifier = "nea.sante"
    // Toucher : VFC → mesure de récupération, vélo → onglet Sorties, pas → Accueil (ouvrirNotif côté JS).
    c.userInfo = ["body": ["act": id == "vfc" ? "hrv" : id == "velo" ? "sortie" : "accueil"]]
    let r = UNNotificationRequest(identifier: "nea.\(id).\(Int(Date().timeIntervalSince1970))", content: c, trigger: nil)
    UNUserNotificationCenter.current().add(r)
  }

  private static let messagesEau = [
    "🥤 Bonjour ! Ton corps est à 60 % d'eau, pas à 60 % de café ☕ Un grand verre !",
    "💦 Avant de manger : un verre d'eau. Ton estomac te remerciera, ta VFC aussi.",
    "🚰 Coup de barre de 14 h ? C'est peut-être juste la soif. Teste avant la sieste 😴",
    "🌱 Ta plante verte boit plus que toi. Inacceptable.",
    "🌵 Un verre d'eau avant le sport : tu n'es pas un cactus.",
    "🌙 Dernier verre de la journée (d'eau, hein 😏).",
  ]

  /// Rappels d'eau quotidiens (10 h → 20 h, toutes les 2 h), ou retirés.
  private func programmerEau(_ actif: Bool) {
    let centre = UNUserNotificationCenter.current()
    let heures = [10, 12, 14, 16, 18, 20]
    centre.removePendingNotificationRequests(withIdentifiers: heures.map { "nea.eau.\($0)" })
    guard actif else { return }
    for (i, h) in heures.enumerated() {
      let c = UNMutableNotificationContent()
      c.title = "💧 C'est l'heure de boire de l'eau"
      c.body = Self.messagesEau[i]
      c.sound = .default
      c.threadIdentifier = "nea.eau"
      let t = UNCalendarNotificationTrigger(dateMatching: DateComponents(hour: h, minute: 0), repeats: true)
      centre.add(UNNotificationRequest(identifier: "nea.eau.\(h)", content: c, trigger: t))
    }
  }

  // MARK: Fréquence

  private func depuis(_ cle: String) -> TimeInterval {
    guard let d = ud.object(forKey: cle) as? Date else { return .infinity }
    return Date().timeIntervalSince(d)
  }

  private func marquer(_ cle: String) { ud.set(Date(), forKey: cle) }

  private func premiereFoisAujourdhui(_ cle: String) -> Bool {
    if let d = ud.object(forKey: cle) as? Date, Calendar.current.isDateInToday(d) { return false }
    marquer(cle)
    return true
  }

  private static func nombre(_ n: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.locale = Locale(identifier: "fr_CA")
    return f.string(from: NSNumber(value: Int(n.rounded()))) ?? "\(Int(n))"
  }
}
