import AVFoundation
import ExpoModulesCore
import UIKit
import Vision

/// Caméra en direct + squelette (« exosquelette ») : Apple Vision détecte 19 articulations à chaque image
/// (`VNDetectHumanBodyPoseRequest`, sur l'iPhone, rien n'est envoyé ni enregistré), le squelette est dessiné ici
/// par-dessus l'image (sans passer par le JS, donc sans retard), et les points lissés partent au JS ~15 fois par seconde
/// (`onPose`) pour compter les répétitions et corriger le mouvement (`lib/mouvement.ts`).
public final class NeaCameraModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NeaCamera")

    Function("disponible") { () -> Bool in
      AVCaptureDevice.default(for: .video) != nil
    }

    View(NeaPoseView.self) {
      Events("onPose", "onEtat")

      Prop("actif") { (view: NeaPoseView, actif: Bool) in
        view.regler(actif: actif)
      }

      Prop("avant") { (view: NeaPoseView, avant: Bool) in
        view.regler(avant: avant)
      }

      /// Articulations à dessiner en rouge (erreur de mouvement repérée par le JS).
      Prop("alerte") { (view: NeaPoseView, alerte: [String]) in
        view.alerte = Set(alerte)
      }
    }
  }
}

final class NeaPoseView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
  let onPose = EventDispatcher()
  let onEtat = EventDispatcher()

  /// Articulations suivies (le visage se réduit au nez) et leur nom côté JS.
  static let noms: [(VNHumanBodyPoseObservation.JointName, String)] = [
    (.nose, "nez"), (.neck, "cou"),
    (.leftShoulder, "epauleG"), (.rightShoulder, "epauleD"),
    (.leftElbow, "coudeG"), (.rightElbow, "coudeD"),
    (.leftWrist, "poignetG"), (.rightWrist, "poignetD"),
    (.root, "bassin"),
    (.leftHip, "hancheG"), (.rightHip, "hancheD"),
    (.leftKnee, "genouG"), (.rightKnee, "genouD"),
    (.leftAnkle, "chevilleG"), (.rightAnkle, "chevilleD"),
  ]

  /// Os du squelette (paires d'articulations).
  static let os: [(String, String)] = [
    ("nez", "cou"), ("cou", "epauleG"), ("cou", "epauleD"),
    ("epauleG", "coudeG"), ("coudeG", "poignetG"), ("epauleD", "coudeD"), ("coudeD", "poignetD"),
    ("epauleG", "hancheG"), ("epauleD", "hancheD"), ("hancheG", "hancheD"),
    ("hancheG", "genouG"), ("genouG", "chevilleG"), ("hancheD", "genouD"), ("genouD", "chevilleD"),
  ]

  private let session = AVCaptureSession()
  private let apercu = AVCaptureVideoPreviewLayer()
  private let traitOs = CAShapeLayer()
  private let traitAlerte = CAShapeLayer()
  private let halo = CAShapeLayer()
  private let points = CAShapeLayer()
  private let sortie = AVCaptureVideoDataOutput()
  private let fileSession = DispatchQueue(label: "nea.camera.session")
  private let fileVision = DispatchQueue(label: "nea.camera.vision")
  private let requete = VNDetectHumanBodyPoseRequest()

  private var actif = false
  private var avant = true
  private var sortieAjoutee = false
  var alerte: Set<String> = []
  /// Points lissés, en coordonnées de l'image (0…1, origine en haut à gauche, comme à l'écran).
  private var lisses: [String: CGPoint] = [:]
  private var confiances: [String: Float] = [:]
  private var absences: [String: Int] = [:]
  private var tailleImage = CGSize(width: 720, height: 1280)
  private var dernierEnvoi: CFTimeInterval = 0

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    apercu.session = session
    apercu.videoGravity = .resizeAspectFill
    layer.addSublayer(apercu)

    let orange = UIColor(red: 1, green: 0.42, blue: 0.1, alpha: 1)
    halo.strokeColor = orange.withAlphaComponent(0.35).cgColor
    halo.lineWidth = 14
    traitOs.strokeColor = orange.cgColor
    traitOs.lineWidth = 5
    traitAlerte.strokeColor = UIColor(red: 1, green: 0.3, blue: 0.33, alpha: 1).cgColor
    traitAlerte.lineWidth = 6
    for l in [halo, traitOs, traitAlerte] {
      l.fillColor = UIColor.clear.cgColor
      l.lineCap = .round
      l.lineJoin = .round
      layer.addSublayer(l)
    }
    points.fillColor = UIColor.white.cgColor
    points.strokeColor = orange.cgColor
    points.lineWidth = 2.5
    layer.addSublayer(points)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for l in [apercu, halo, traitOs, traitAlerte, points] as [CALayer] { l.frame = bounds }
    CATransaction.commit()
  }

  override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil { arreter() } else if actif { demarrer() }
  }

  deinit {
    let s = session
    fileSession.async { if s.isRunning { s.stopRunning() } }
  }

  func regler(actif nouveau: Bool) {
    guard nouveau != actif else { return }
    actif = nouveau
    if actif { demarrer() } else { arreter() }
  }

  func regler(avant nouveau: Bool) {
    guard nouveau != avant else { return }
    avant = nouveau
    lisses = [:]
    confiances = [:]
    dessiner()
    if actif { fileSession.async { [weak self] in self?.configurer() } }
  }

  private func demarrer() {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      fileSession.async { [weak self] in
        guard let self else { return }
        self.configurer()
        if !self.session.isRunning { self.session.startRunning() }
        DispatchQueue.main.async { self.onEtat(["etat": "pret"]) }
      }
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { [weak self] ok in
        DispatchQueue.main.async {
          guard let self else { return }
          if ok { self.demarrer() } else { self.onEtat(["etat": "refuse"]) }
        }
      }
    default:
      onEtat(["etat": "refuse"])
    }
  }

  private func arreter() {
    let s = session
    fileSession.async { if s.isRunning { s.stopRunning() } }
  }

  /// Entrée (caméra avant ou arrière) et sortie des images, en portrait ; l'image avant est en miroir comme l'aperçu.
  private func configurer() {
    session.beginConfiguration()
    if session.canSetSessionPreset(.hd1280x720) { session.sessionPreset = .hd1280x720 }
    for entree in session.inputs { session.removeInput(entree) }
    guard
      let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: avant ? .front : .back),
      let entree = try? AVCaptureDeviceInput(device: camera),
      session.canAddInput(entree)
    else {
      session.commitConfiguration()
      DispatchQueue.main.async { self.onEtat(["etat": "indisponible"]) }
      return
    }
    session.addInput(entree)
    if !sortieAjoutee {
      sortie.alwaysDiscardsLateVideoFrames = true
      sortie.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange]
      sortie.setSampleBufferDelegate(self, queue: fileVision)
      if session.canAddOutput(sortie) {
        session.addOutput(sortie)
        sortieAjoutee = true
      }
    }
    if let c = sortie.connection(with: .video) {
      if c.isVideoOrientationSupported { c.videoOrientation = .portrait }
      if c.isVideoMirroringSupported {
        c.automaticallyAdjustsVideoMirroring = false
        c.isVideoMirrored = avant
      }
    }
    session.commitConfiguration()
  }

  // MARK: - Vision (file d'attente de la caméra)

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let image = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    let taille = CGSize(width: CVPixelBufferGetWidth(image), height: CVPixelBufferGetHeight(image))
    let analyse = VNImageRequestHandler(cvPixelBuffer: image, orientation: .up, options: [:])
    do {
      try analyse.perform([requete])
    } catch {
      return
    }
    var trouves: [String: CGPoint] = [:]
    var conf: [String: Float] = [:]
    if let corps = requete.results?.first, let pts = try? corps.recognizedPoints(.all) {
      for (nom, cle) in NeaPoseView.noms {
        if let p = pts[nom], p.confidence > 0.3 {
          trouves[cle] = CGPoint(x: p.location.x, y: 1 - p.location.y)
          conf[cle] = p.confidence
        }
      }
    }
    DispatchQueue.main.async { [weak self] in self?.recevoir(trouves, conf, taille) }
  }

  // MARK: - Lissage, dessin, envoi (fil principal)

  private func recevoir(_ trouves: [String: CGPoint], _ conf: [String: Float], _ taille: CGSize) {
    tailleImage = taille
    for (cle, p) in trouves {
      if let ancien = lisses[cle] {
        // Moyenne mobile : assez rapide pour suivre une rep, assez douce pour ne pas trembler.
        lisses[cle] = CGPoint(x: ancien.x * 0.45 + p.x * 0.55, y: ancien.y * 0.45 + p.y * 0.55)
      } else {
        lisses[cle] = p
      }
      confiances[cle] = conf[cle]
      absences[cle] = 0
    }
    // Une articulation perdue reste 3 images, puis disparaît.
    for cle in Array(lisses.keys) where trouves[cle] == nil {
      let n = (absences[cle] ?? 0) + 1
      absences[cle] = n
      if n > 3 {
        lisses[cle] = nil
        confiances[cle] = nil
      }
    }
    dessiner()

    let maintenant = CACurrentMediaTime()
    if maintenant - dernierEnvoi >= 1.0 / 15.0 {
      dernierEnvoi = maintenant
      var j: [String: [Double]] = [:]
      for (cle, p) in lisses { j[cle] = [Double(p.x), Double(p.y), Double(confiances[cle] ?? 0)] }
      onPose(["j": j, "w": Double(tailleImage.width), "h": Double(tailleImage.height), "t": maintenant * 1000])
    }
  }

  /// Point de l'image (0…1) → point de la vue, avec le même recadrage que l'aperçu (remplissage).
  private func versVue(_ p: CGPoint) -> CGPoint {
    let w = tailleImage.width, h = tailleImage.height
    guard w > 0, h > 0, bounds.width > 0 else { return .zero }
    let echelle = max(bounds.width / w, bounds.height / h)
    let dx = (bounds.width - w * echelle) / 2
    let dy = (bounds.height - h * echelle) / 2
    return CGPoint(x: p.x * w * echelle + dx, y: p.y * h * echelle + dy)
  }

  private func dessiner() {
    let chemin = UIBezierPath()
    let cheminAlerte = UIBezierPath()
    for (a, b) in NeaPoseView.os {
      guard let pa = lisses[a], let pb = lisses[b] else { continue }
      let c = (alerte.contains(a) || alerte.contains(b)) ? cheminAlerte : chemin
      c.move(to: versVue(pa))
      c.addLine(to: versVue(pb))
    }
    let ronds = UIBezierPath()
    for (cle, p) in lisses where cle != "cou" {
      let v = versVue(p)
      let r: CGFloat = alerte.contains(cle) ? 8 : 6
      ronds.append(UIBezierPath(ovalIn: CGRect(x: v.x - r, y: v.y - r, width: r * 2, height: r * 2)))
    }
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    halo.path = chemin.cgPath
    traitOs.path = chemin.cgPath
    traitAlerte.path = cheminAlerte.cgPath
    points.path = ronds.cgPath
    CATransaction.commit()
  }
}
