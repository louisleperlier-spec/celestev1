import Combine
import Foundation
import WatchKit

enum Phase: Equatable {
  case effort, validation, repos, bilan
}

/// Séance guidée sur la montre : séries (reps comptées puis corrigées, ou durée), repos, bilan.
final class SeanceEnCours: ObservableObject {
  let s: SeanceMontre
  let entrainement = Entrainement()
  let compteur = Compteur()

  @Published var ex = 0
  @Published var serie = 0
  @Published var phase: Phase = .effort
  /// Validation : reps retenues et charge (kg par haltère ou total ; 0 sans charge).
  @Published var reps = 0
  @Published var charge = 0.0
  @Published var reposReste = 0
  @Published var reposTotal = 0
  /// Exercice en durée : secondes restantes.
  @Published var effortReste = 0
  @Published var secondes = 0
  @Published var enregistree = false

  private(set) var seriesFaites = 0
  private(set) var volume = 0.0
  private let debut = Date()
  private var minuterie: Timer?
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
    demarrerSerie()
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

  private func tick() {
    secondes = Int(Date().timeIntervalSince(debut))
    switch phase {
    case .repos:
      reposReste -= 1
      if reposReste == 3 { WKInterfaceDevice.current().play(.notification) }
      if reposReste <= 0 {
        WKInterfaceDevice.current().play(.start)
        demarrerSerie()
      }
    case .effort where enDuree:
      effortReste -= 1
      if effortReste <= 0 {
        WKInterfaceDevice.current().play(.success)
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
    secondes = Int(Date().timeIntervalSince(debut))
    WKInterfaceDevice.current().play(.success)
    phase = .bilan
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
