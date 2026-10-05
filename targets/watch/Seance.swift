import Combine
import Foundation
import WatchKit

enum Phase: Equatable {
  case echauffement, effort, validation, repos, pause, bilan
}

/// Échauffement de début de séance (5 min, passable).
let DUREE_ECHAUFFEMENT = 300

/// Séance guidée sur la montre : séries (reps comptées puis corrigées, ou durée), repos, bilan.
final class SeanceEnCours: ObservableObject {
  let s: SeanceMontre
  let entrainement = Entrainement()
  let compteur = Compteur()

  @Published var ex = 0
  @Published var serie = 0
  @Published var phase: Phase = .echauffement
  /// Échauffement : secondes restantes.
  @Published var echauffementReste = DUREE_ECHAUFFEMENT
  /// Validation : reps retenues et charge (kg par haltère ou total ; 0 sans charge).
  @Published var reps = 0
  @Published var charge = 0.0
  @Published var reposReste = 0
  @Published var reposTotal = 0
  /// Exercice en durée : secondes restantes.
  @Published var effortReste = 0
  @Published var secondes = 0
  @Published var enregistree = false
  /// Segment en cours (commande « Segment ») et son départ.
  @Published var segment = 1
  private var debutSegment = 0

  private(set) var seriesFaites = 0
  private(set) var volume = 0.0
  private let debut = Date()
  private var minuterie: Timer?
  /// Étape reprise après la pause.
  private var avantPause: Phase = .effort
  private var liens = Set<AnyCancellable>()

  init(_ s: SeanceMontre) {
    self.s = s
    charge = s.exos.first?.kg ?? 0
    // Les objets imbriqués redessinent l'écran de la séance.
    entrainement.objectWillChange.sink { [weak self] _ in self?.objectWillChange.send() }.store(in: &liens)
    compteur.objectWillChange.sink { [weak self] _ in self?.objectWillChange.send() }.store(in: &liens)
  }

  var exo: ExoMontre { s.exos[min(ex, s.exos.count - 1)] }
  var enDuree: Bool { exo.sec > 0 }

  private var lance = false

  func commencer() {
    guard !lance else { return }
    lance = true
    entrainement.demarrer()
    phase = .echauffement
    echauffementReste = DUREE_ECHAUFFEMENT
    minuterie = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in self?.tick() }
  }

  private func demarrerSerie() {
    phase = .effort
    if enDuree {
      effortReste = exo.sec
    } else {
      compteur.demarrer()
    }
  }

  /// Fin de l'échauffement (minuteur ou « Passer ») : première série.
  func finEchauffement() {
    Vibre.jouer(.start)
    demarrerSerie()
  }

  func pause() {
    guard phase != .pause, phase != .bilan else { return }
    avantPause = phase
    compteur.arreter()
    entrainement.pause()
    phase = .pause
    Vibre.jouer(.stop)
  }

  func reprendre() {
    guard phase == .pause else { return }
    entrainement.reprendre()
    phase = avantPause
    if phase == .effort && !enDuree { compteur.demarrer() }
    Vibre.jouer(.start)
  }

  /// « Terminer » depuis la pause : bilan avec ce qui a été fait.
  func terminerMaintenant() {
    entrainement.reprendre()
    terminer()
  }

  private func tick() {
    // Le temps de la séance ne compte pas pendant la pause.
    if phase == .pause || phase == .bilan { return }
    secondes += 1
    switch phase {
    case .echauffement:
      echauffementReste -= 1
      if echauffementReste <= 0 { finEchauffement() }
    case .repos:
      reposReste -= 1
      if reposReste == 3 { Vibre.jouer(.notification) }
      if reposReste <= 0 {
        Vibre.jouer(.start)
        demarrerSerie()
      }
    case .effort where enDuree:
      effortReste -= 1
      if effortReste <= 0 {
        Vibre.jouer(.success)
        reps = 0
        valider()
      }
    default:
      break
    }
  }

  /// « Fin de série » : les reps comptées (ou visées si rien n'a été détecté) passent à la validation.
  func finSerie() {
    if enDuree {
      reps = 0
      valider()
      return
    }
    compteur.arreter()
    reps = compteur.reps > 0 ? compteur.reps : exo.reps
    phase = .validation
  }

  /// « Valider la série » (maquette) : les reps comptées (ou visées) sont validées tout de suite ; « Corriger » passe par la validation.
  func validerSerie() {
    if enDuree {
      finSerie()
      return
    }
    compteur.arreter()
    reps = compteur.reps > 0 ? compteur.reps : exo.reps
    valider()
  }

  func changerReps(_ d: Int) {
    reps = max(0, min(99, reps + d))
  }

  func changerCharge(_ sens: Double) {
    charge = max(0, charge + sens * exo.pas)
  }

  /// Série validée : volume, puis repos avant la série ou l'exercice suivant, ou bilan.
  func valider() {
    seriesFaites += 1
    volume += Double(reps) * charge * (exo.double ? 2 : 1)
    if serie + 1 < exo.series {
      serie += 1
      lancerRepos(exo.repos)
    } else if ex + 1 < s.exos.count {
      let repos = max(exo.repos, 45)
      ex += 1
      serie = 0
      charge = exo.kg
      lancerRepos(repos)
    } else {
      terminer()
    }
  }

  private func lancerRepos(_ t: Int) {
    reposTotal = t
    reposReste = t
    phase = .repos
  }

  func plus15() {
    reposReste += 15
    reposTotal += 15
  }

  func passerRepos() {
    demarrerSerie()
  }

  private func terminer() {
    minuterie?.invalidate()
    minuterie = nil
    compteur.arreter()
    Vibre.jouer(.success)
    phase = .bilan
  }

  var secondesSegment: Int { secondes - debutSegment }

  func nouveauSegment() {
    segment += 1
    debutSegment = secondes
    Vibre.jouer(.click)
  }

  /// Étape en cours, en une ligne (écran « Suivre »).
  var etape: String {
    switch phase {
    case .echauffement: return "Échauffement · \(Nea.mmss(echauffementReste))"
    case .effort: return "\(exo.nom) · série \(serie + 1)/\(exo.series)"
    case .validation: return "\(exo.nom) · à valider"
    case .repos: return "Repos · \(Nea.mmss(reposReste))"
    case .pause: return "En pause"
    case .bilan: return "Terminé"
    }
  }

  /// Titre de l'étape (écran de la séance guidée).
  var titreEtape: String {
    switch phase {
    case .echauffement: return "Échauffement"
    case .effort: return exo.nom
    case .validation: return "Valider"
    case .repos: return "Récupération"
    case .pause: return "En pause"
    case .bilan: return "Bilan"
    }
  }

  /// Commande « Nouveau » : la séance est enregistrée telle quelle, puis on revient au choix.
  func terminerEtEnregistrer(fin: @escaping () -> Void) {
    if phase != .bilan { terminerMaintenant() }
    enregistrer(fin: fin)
  }

  /// Énergie : celle de la montre, sinon l'estimation du programme.
  var kcal: Double {
    entrainement.kcal > 0 ? entrainement.kcal : s.exos.reduce(0) { $0 + $1.kcal }
  }

  /// Bilan : enregistrée dans Apple Santé et envoyée à l'iPhone.
  func enregistrer(fin: @escaping () -> Void) {
    guard !enregistree else { return fin() }
    enregistree = true
    let r = ResultatMontre(
      id: UUID().uuidString,
      debut: DateISO.texte(debut),
      fin: DateISO.texte(Date()),
      titre: s.titre,
      sec: secondes,
      kcal: kcal,
      fcMoy: entrainement.fcMoy,
      fcMax: entrainement.fcMax,
      series: seriesFaites,
      volume: volume
    )
    entrainement.terminer(sauver: true) {
      LiaisonMontre.partagee.envoyer(r)
      fin()
    }
  }

  /// Fermée avant le bilan : rien n'est enregistré.
  func abandonner() {
    guard !enregistree else { return }
    enregistree = true
    minuterie?.invalidate()
    minuterie = nil
    compteur.arreter()
    entrainement.terminer(sauver: false) {}
  }
}
