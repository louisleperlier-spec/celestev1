//
//  MMWidgetStyleKit.swift
//  Langage visuel commun des widgets : fond, nuage de points, chiffres fins, courbes, anneaux.
//  Compile aussi dans une extension WidgetKit. Dans un vrai widget, utilise `MMWidgetBackdrop`
//  dans `.containerBackground(for: .widget) { … }` et retire `MMWTile`, réservé aux démonstrations.
//

import SwiftUI

/// Record du jour (fictif dans les démonstrations).
struct MMWRecord { let gain: Double }

/// Tailles d'un widget sur un grand iPhone.
enum MMWFamily {
    case small, medium, large
    var height: CGFloat { self == .large ? 382 : 170 }
}

/// Cadre d'aperçu aux dimensions réelles : marges système de 16 pt et coins de 22 pt.
struct MMWTile<Content: View>: View {
    let family: MMWFamily
    var dots: UnitPoint? = .topTrailing
    var reach: CGFloat = 0.62
    @ViewBuilder var content: () -> Content
    var body: some View {
        content()
            .padding(16)
            .frame(maxWidth: family == .small ? 170 : 364, maxHeight: family.height, alignment: .topLeading)
            .frame(height: family.height)
            .background { MMWidgetBackdrop(dots: dots, reach: reach) }
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .frame(maxWidth: .infinity)
    }
}

/// Page d'aperçu : titre puis tailles empilées.
struct MMWGallery<Content: View>: View {
    let title: String
    @ViewBuilder var content: () -> Content
    var body: some View {
        ZStack {
            Color(white: 0.11).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    Text(title).font(MMFont.system(13, .medium)).foregroundStyle(.white.opacity(0.6))
                    content()
                }
                .padding(16)
            }
            .scrollIndicators(.hidden)
        }
        .preferredColorScheme(.dark)
    }
}

func mmwFlag(_ code: String) -> String {
    String(String.UnicodeScalarView(code.uppercased().unicodeScalars.compactMap { UnicodeScalar(127397 + $0.value) }))
}

/// Pastille d'initiale d'un produit (fictif).
struct MMWInitial: View {
    let name: String
    var size: CGFloat = 26
    var body: some View {
        Text(String(name.prefix(1))).font(MMFont.system(size * 0.46, .medium)).foregroundStyle(MMColor.ink)
            .frame(width: size, height: size)
            .background(MMColor.fg(0.1), in: RoundedRectangle(cornerRadius: size * 0.28, style: .continuous))
    }
}

// MARK: - Palette

enum MMWTone {
    case money, violet

    /// Vert « argent » de l'app (vif / profond).
    static let moneyBright = Color(red: 0.25, green: 0.92, blue: 0.52)
    static let moneyDeep = Color(red: 0.06, green: 0.62, blue: 0.32)
    static let violetBright = MMColor.hex(0x8D6CF2)
    static let violetDeep = MMColor.hex(0x5638C7)

    var bright: Color { self == .money ? Self.moneyBright : Self.violetBright }
    var deep: Color { self == .money ? Self.moneyDeep : Self.violetDeep }
}

// MARK: - Fond

/// Fond unique de tous les widgets : noir quasi pur à peine levé en haut (sombre),
/// blanc → gris groupé un peu plus soutenu (clair). Le nuage de points vit dans un coin.
/// `date` = date de l'entrée de timeline : le nuage se redessine (fondu) à chaque entrée.
struct MMWidgetBackdrop: View {
    var dots: UnitPoint? = .topTrailing
    var reach: CGFloat = 0.62
    var date: Date? = nil
    var body: some View {
        ZStack {
            LinearGradient(colors: [MMColor.dynHex(light: 0xFFFFFF, dark: 0x0A0A0B), MMColor.dynHex(light: 0xEBEBF0, dark: 0x000000)],
                           startPoint: .top, endPoint: .bottom)
            if let dots {
                let seed = date.map { Int($0.timeIntervalSince1970 / 300) } ?? 0
                MMWDots(anchor: dots, reach: reach, seed: seed)
                    .id(seed)
                    .transition(.opacity)
                    .animation(.easeInOut(duration: 1.4), value: seed)
            }
        }
    }
}

/// Nuage de « petits carrés », même dessin que RecoveryDotMatrix dans l'app : contour irrégulier
/// (le rayon ondule selon l'angle), opacité et densité décroissantes, bruit par point.
/// `seed` fait tourner le contour et redistribue les trous : chaque entrée de timeline a son motif.
/// Un seul Canvas, points regroupés par palier d'opacité (~16 remplissages).
struct MMWDots: View {
    var anchor: UnitPoint = .topTrailing
    var reach: CGFloat = 0.62
    var maxOpacity: Double = 0.26
    var seed: Int = 0
    var spacing: CGFloat = 5
    var dot: CGFloat = 1.7

    var body: some View {
        Canvas(opaque: false) { ctx, size in
            guard size.width.isFinite, size.height.isFinite, size.width > 0, size.height > 0,
                  size.width < 2000, size.height < 2000 else { return }
            let origin = CGPoint(x: anchor.x * size.width, y: anchor.y * size.height)
            let radius = max(size.width, size.height) * reach
            let levels = 16
            var buckets = [Path](repeating: Path(), count: levels)
            let ph = Double(seed % 997) * 0.618 * .pi
            var x = spacing / 2, column = 0
            while x < size.width {
                var y = spacing / 2, row = 0
                while y < size.height {
                    let dx = x - origin.x, dy = y - origin.y
                    let angle = atan2(dy, dx)
                    let wobble = 1 + 0.22 * sin(angle * 3 + ph) + 0.14 * sin(angle * 7 - ph * 1.7) + 0.08 * sin(angle * 13 + ph * 2.3)
                    let d = sqrt(dx * dx + dy * dy) / (radius * wobble)
                    if d < 1 {
                        var h = UInt64(bitPattern: Int64(column &* 92_821 &+ row &* 68_917 &+ (seed % 64) &* 1_299_709))
                        h = (h ^ (h >> 13)) &* 0x5bd1e995; h ^= h >> 15
                        let noise = Double(h % 1000) / 1000
                        if noise > 0.3 {
                            let f = pow(1 - d, 1.7) * (0.35 + noise * 0.9) / 1.25
                            let s = dot * (0.8 + 0.4 * CGFloat(1 - d))
                            buckets[min(levels - 1, Int(f * Double(levels)))]
                                .addRect(CGRect(x: x - s / 2, y: y - s / 2, width: s, height: s))
                        }
                    }
                    y += spacing; row += 1
                }
                x += spacing; column += 1
            }
            for (i, path) in buckets.enumerated() where !path.isEmpty {
                ctx.fill(path, with: .color(MMColor.ink.opacity(maxOpacity * 1.25 * (Double(i) + 0.5) / Double(levels))))
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - Texte

/// Barre du haut, sans titre : pastille « direct » facultative + texte discret à droite.
struct MMWHeader: View {
    var trailing: String? = nil
    var live = false
    var body: some View {
        HStack(alignment: .center, spacing: 6) {
            if live { Circle().fill(MMWTone.moneyBright).frame(width: 6, height: 6) }
            Spacer(minLength: 6)
            if let trailing { Text(trailing).font(MMFont.system(11, .medium)).foregroundStyle(MMColor.ink3).lineLimit(1) }
        }
    }
}

/// Grand chiffre fin, serré.
struct MMWValue: View {
    let text: String
    var size: CGFloat = 30
    var numeric: Double? = nil
    var body: some View {
        Text(text).font(MMFont.number(size)).tracking(-size * 0.028).foregroundStyle(MMColor.ink)
            .lineLimit(1).minimumScaleFactor(0.5)
            .contentTransition(.numericText(value: numeric ?? 0))
    }
}

/// Variation discrète : flèche + pourcentage, sans fond.
struct MMWDelta: View {
    let value: Double?
    var body: some View {
        if let value, value.isFinite {
            let up = value >= 0
            HStack(spacing: 2) {
                Image(systemName: up ? "arrow.up.right" : "arrow.down.right").font(.system(size: 8, weight: .bold))
                Text(abs(value).formatted(.percent.precision(.fractionLength(0)))).font(MMFont.system(12, .medium)).monospacedDigit()
            }
            .foregroundStyle(up ? MMWTone.moneyBright : MMColor.red)
        }
    }
}

/// Petite statistique : libellé discret au-dessus, valeur au-dessous.
struct MMWStat: View {
    let label: String
    let value: String
    var alignment: HorizontalAlignment = .leading
    var size: CGFloat = 17
    var body: some View {
        VStack(alignment: alignment, spacing: 2) {
            Text(label).font(MMFont.system(11)).foregroundStyle(MMColor.ink3).lineLimit(1)
            Text(value).font(MMFont.number(size, .regular)).foregroundStyle(MMColor.ink).lineLimit(1).minimumScaleFactor(0.6)
        }
    }
}

/// Carte intérieure : gris presque noir + liseré fin (sombre), blanc cassé + liseré noir 7 % (clair).
struct MMWCard<Content: View>: View {
    var padding: CGFloat = 10
    @ViewBuilder var content: Content
    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        content
            .padding(padding)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            // Case gravée : ombre intérieure en haut, liseré clair en bas, comme enfoncée dans le fond.
            .background(shape.fill(Self.fill
                .shadow(.inner(color: .black.opacity(0.9), radius: 5, x: 0, y: 3))
                .shadow(.inner(color: MMColor.fg(0.07), radius: 1, x: 0, y: -1))))
            .overlay(shape.strokeBorder(LinearGradient(colors: [Color.black.opacity(0.7), Color.black.opacity(0.2), MMColor.fg(0.16)],
                                                       startPoint: .top, endPoint: .bottom), lineWidth: 1))
            // Rebord du fond éclairé juste sous la case.
            .background(shape.stroke(MMColor.fg(0.08), lineWidth: 1).offset(y: 1))
    }
    /// Plus sombre que les cartes de l'app : blanc 4 % (sombre), gris très clair (clair).
    private static var fill: Color { MMColor.dynHex(light: 0xFAFAFC, dark: 0x111113) }
}

struct MMWHairline: View {
    var body: some View { Rectangle().fill(MMColor.hairline).frame(height: 0.75) }
}

// MARK: - Courbe

/// Courbe lisse en dégradé (profond → vif), voile léger dessous, point sur la dernière valeur.
/// Tracé SwiftUI pur : rien d'animé, rien de flouté.
struct MMWLine: View {
    let values: [Double]
    var tone: MMWTone = .money
    var lineWidth: CGFloat = 2
    var area = true
    var endDot = true
    /// Base à zéro (montants) ; sinon la courbe occupe toute la hauteur.
    var zeroBased = true

    var body: some View {
        GeometryReader { g in
            let pts = points(in: g.size)
            ZStack {
                if area {
                    areaPath(pts, height: g.size.height)
                        .fill(LinearGradient(colors: [tone.bright.opacity(0.34), tone.bright.opacity(0.10), tone.bright.opacity(0)], startPoint: .top, endPoint: .bottom))
                    // Lueur : la courbe floutée sous le trait.
                    curve(pts).stroke(tone.bright.opacity(0.55), style: StrokeStyle(lineWidth: lineWidth * 3, lineCap: .round, lineJoin: .round))
                        .blur(radius: 7)
                }
                curve(pts)
                    .stroke(LinearGradient(colors: [tone.deep.opacity(0.35), tone.deep, tone.bright], startPoint: .leading, endPoint: .trailing),
                            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
                if endDot, let last = pts.last {
                    Circle().fill(MMColor.ink).frame(width: lineWidth * 3.4, height: lineWidth * 3.4).position(last)
                }
            }
        }
        .accessibilityHidden(true)
    }

    private func points(in s: CGSize) -> [CGPoint] {
        let v = values.count > 1 ? values : [values.first ?? 0, values.first ?? 0]
        let hi = v.max() ?? 0, lo = zeroBased ? 0 : (v.min() ?? 0), span = hi - lo
        let inset = lineWidth * 2
        return v.enumerated().map { i, x in
            CGPoint(x: s.width * CGFloat(i) / CGFloat(v.count - 1),
                    y: span > 0 ? inset + (s.height - inset * 2) * (1 - CGFloat((x - lo) / span)) : s.height - inset)
        }
    }

    private func curve(_ p: [CGPoint]) -> Path {
        var path = Path()
        guard let first = p.first else { return path }
        path.move(to: first)
        for i in 1..<p.count {
            let a = p[i - 1], b = p[i], mx = (a.x + b.x) / 2
            path.addCurve(to: b, control1: CGPoint(x: mx, y: a.y), control2: CGPoint(x: mx, y: b.y))
        }
        return path
    }

    private func areaPath(_ p: [CGPoint], height: CGFloat) -> Path {
        var path = curve(p)
        guard let first = p.first, let last = p.last else { return path }
        path.addLine(to: CGPoint(x: last.x, y: height)); path.addLine(to: CGPoint(x: first.x, y: height)); path.closeSubpath()
        return path
    }
}

/// Barres verticales fines (la dernière en couleur), pour les séries courtes.
struct MMWBars: View {
    let values: [Double]
    var tone: MMWTone = .money
    var body: some View {
        let hi = max(values.max() ?? 0, 0.0001)
        GeometryReader { g in
            HStack(alignment: .bottom, spacing: 2) {
                ForEach(Array(values.enumerated()), id: \.offset) { i, v in
                    RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                        .fill(i == values.count - 1 ? tone.bright : MMColor.fg(0.14))
                        .frame(maxWidth: .infinity)
                        .frame(height: max(2, g.size.height * CGFloat(v / hi)))
                }
            }
            .frame(maxHeight: .infinity, alignment: .bottom)
        }
        .accessibilityHidden(true)
    }
}

/// Barre de progression fine (objectif).
struct MMWProgress: View {
    let value: Double
    var tone: MMWTone = .money
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(MMColor.fg(0.08))
                Capsule().fill(LinearGradient(colors: [tone.deep, tone.bright], startPoint: .leading, endPoint: .trailing))
                    .frame(width: max(3, g.size.width * min(1, max(0, value))))
            }
        }
        .frame(height: 3)
    }
}

// MARK: - Ajouts : or (record), anneau d'objectif, pointillés, boutons

extension MMWTone {
    /// Or discret du record (jamais saturé).
    static let gold = Color(red: 0.96, green: 0.78, blue: 0.36)
    static let goldDeep = Color(red: 0.78, green: 0.56, blue: 0.18)
}

/// Anneau fin d'objectif : piste 8 %, arc dégradé, or une fois l'objectif atteint.
struct MMWRing: View {
    let progress: Double
    var lineWidth: CGFloat = 3
    var track: Color = MMColor.fg(0.10)
    var body: some View {
        let done = progress >= 1
        ZStack {
            Circle().stroke(track, lineWidth: lineWidth)
            Circle().trim(from: 0, to: min(1, max(0.02, progress)))
                .stroke(done ? AnyShapeStyle(MMWTone.gold) : AnyShapeStyle(AngularGradient(colors: [MMWTone.moneyDeep, MMWTone.moneyBright], center: .center)),
                        style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
        .accessibilityLabel(Text("\(Int(progress * 100)) %"))
    }
}

/// Pastille « Record du jour 🏆 » : liseré or fin, sans fond plein.
struct MMWRecordBadge: View {
    let record: MMWRecord
    var compact = false
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "trophy.fill").font(.system(size: compact ? 8 : 9, weight: .semibold))
            Text(compact ? String(localized: "Record") : String(localized: "Record du jour")).font(MMFont.system(compact ? 9 : 10, .semibold)).lineLimit(1)
            if !compact {
                Text("+\(record.gain.formatted(.percent.precision(.fractionLength(0))))").font(MMFont.system(10, .medium)).monospacedDigit().opacity(0.8)
            }
        }
        .foregroundStyle(MMWTone.gold)
        .padding(.horizontal, 7).padding(.vertical, 3)
        .background(Capsule().fill(MMWTone.gold.opacity(0.10)))
        .overlay(Capsule().strokeBorder(MMWTone.gold.opacity(0.35), lineWidth: 0.75))
        .fixedSize()
    }
}

/// Courbe réelle (pleine) + projection (pointillés) sur un même repère, à base zéro.
struct MMWProjectionChart: View {
    let actual: [Double]
    let projected: [Double]
    let total: Int
    var tone: MMWTone = .money
    var reference: Double? = nil

    var body: some View {
        GeometryReader { g in
            let hi = max(projected.last ?? 0, actual.last ?? 0, reference ?? 0, 0.0001)
            let n = max(total - 1, 1)
            let inset: CGFloat = 4
            let pt: (Int, Double) -> CGPoint = { i, v in
                CGPoint(x: g.size.width * CGFloat(i) / CGFloat(n), y: inset + (g.size.height - inset * 2) * (1 - CGFloat(v / hi)))
            }
            let a = actual.enumerated().map { pt($0.offset, $0.element) }
            let p = projected.enumerated().map { pt(actual.count - 1 + $0.offset, $0.element) }
            ZStack {
                if let r = reference {
                    let y = pt(0, r).y
                    Path { $0.move(to: CGPoint(x: 0, y: y)); $0.addLine(to: CGPoint(x: g.size.width, y: y)) }
                        .stroke(MMColor.fg(0.14), style: StrokeStyle(lineWidth: 0.75, dash: [2, 3]))
                }
                Path { path in
                    guard let f = a.first, let l = a.last else { return }
                    path.move(to: CGPoint(x: f.x, y: g.size.height)); a.forEach { path.addLine(to: $0) }
                    path.addLine(to: CGPoint(x: l.x, y: g.size.height)); path.closeSubpath()
                }
                .fill(LinearGradient(colors: [tone.bright.opacity(0.20), tone.bright.opacity(0)], startPoint: .top, endPoint: .bottom))
                Path { path in guard let f = p.first else { return }; path.move(to: f); p.dropFirst().forEach { path.addLine(to: $0) } }
                    .stroke(tone.bright.opacity(0.7), style: StrokeStyle(lineWidth: 1.6, lineCap: .round, dash: [0.1, 4.5]))
                Path { path in guard let f = a.first else { return }; path.move(to: f); a.dropFirst().forEach { path.addLine(to: $0) } }
                    .stroke(LinearGradient(colors: [tone.deep.opacity(0.35), tone.deep, tone.bright], startPoint: .leading, endPoint: .trailing),
                            style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                if let l = a.last { Circle().fill(MMColor.ink).frame(width: 6.5, height: 6.5).position(l) }
                if let e = p.last, p.count > 1 { Circle().strokeBorder(tone.bright, lineWidth: 1.2).frame(width: 7, height: 7).position(e) }
            }
        }
        .accessibilityHidden(true)
    }
}

/// Petit bouton rond discret (cycle de business, direct…).
struct MMWIconButtonLabel: View {
    let symbol: String
    var on = false
    var body: some View {
        Image(systemName: symbol).font(.system(size: 10, weight: .semibold))
            .foregroundStyle(on ? MMColor.ink : MMColor.ink2)
            .frame(width: 22, height: 22)
            .background(Circle().fill(on ? MMColor.fg(0.14) : MMColor.fg(0.06)))
            .overlay(Circle().strokeBorder(MMColor.hairline, lineWidth: 0.75))
    }
}

// MARK: - Temps écoulé

/// « 3 min », « 2h », « 2h 14 », « 1j 5h » : court, recalculé à chaque entrée de timeline (une par minute).
/// `live` (Live Activity, sans timeline) garde le compteur natif du système.
struct MMWAgo: View {
    let date: Date
    var live = false
    var body: some View {
        if live { Text(date, style: .relative).monospacedDigit() } else { Text(Self.text(date)).monospacedDigit() }
    }

    static func text(_ d: Date, now: Date = .now) -> String {
        let m = max(0, Int(now.timeIntervalSince(d)) / 60)
        if m < 1 { return String(localized: "À l'instant") }
        return String(localized: "il y a \(span(m))")
    }

    private static func span(_ m: Int) -> String {
        if m < 60 { return "\(m) min" }
        let h = m / 60, r = m % 60
        if h < 24 { return r == 0 ? "\(h)h" : "\(h)h\(String(format: "%02d", r))" }
        let j = h / 24, rh = h % 24
        let day = String(localized: "j", comment: "Abréviation de jour (1j 5h)")
        return rh == 0 ? "\(j)\(day)" : "\(j)\(day) \(rh)h"
    }
}


// MARK: - Planisphère

enum MMWGlobeData {
    static let cols = 60, rows = 24
    static let top = 72.0, bottom = -56.0
    /// « # » = terre.
    static let grid: [String] = [
        "#.#########################.....############################",
        "####################.###..##...#############################",
        "..#############..###..#......#.############################.",
        "...#...##############.......##########################..#...",
        ".........#############.......#########################......",
        ".........###########........###########################.....",
        ".........#########..........##########################......",
        "..........#######...........#########################.......",
        "...........####.#..........########################.........",
        "...........########........#############.#########..........",
        "............#####.#........#############..##.####.#.........",
        "...............#####.......############...##..###.#.........",
        "................######......###########....#..######........",
        "................#######........#######........####.##.......",
        "................#########......######..........####.####....",
        "................########........#####...........#.#.###.....",
        ".................#######........#######...........#####....#",
        "..................######........####.##..........######.....",
        "..................#####.........####.#...........#######....",
        "..................####...........##..............#######....",
        ".................####............#...................##....#",
        ".................###..................................#...##",
        ".................##......................#................#.",
        ".................##.#.......................................",
    ]
    /// Centre approximatif de chaque pays (lat, lng).
    static let centroids: [String: (Double, Double)] = ["AE": (24, 54), "AF": (33, 65), "AG": (17.05, -61.8), "AI": (18.25, -63.17), "AL": (41, 20), "AM": (40, 45), "AO": (-12.5, 18.5), "AR": (-34, -64), "AT": (47.33, 13.33), "AU": (-27, 133), "AZ": (40.5, 47.5), "BA": (44, 18), "BB": (13.17, -59.53), "BD": (24, 90), "BE": (50.83, 4), "BF": (13, -2), "BG": (43, 25), "BH": (26, 50.55), "BJ": (9.5, 2.25), "BM": (32.33, -64.75), "BN": (4.5, 114.67), "BO": (-17, -65), "BR": (-10, -55), "BS": (24.25, -76), "BT": (27.5, 90.5), "BW": (-22, 24), "BY": (53, 28), "BZ": (17.25, -88.75), "CA": (60, -95), "CD": (0, 25), "CG": (-1, 15), "CH": (47, 8), "CI": (8, -5), "CL": (-30, -71), "CM": (6, 12), "CN": (35, 105), "CO": (4, -72), "CR": (10, -84), "CV": (16, -24), "CY": (35, 33), "CZ": (49.75, 15.5), "DE": (51, 9), "DK": (56, 10), "DM": (15.42, -61.33), "DO": (19, -70.67), "DZ": (28, 3), "EC": (-2, -77.5), "EE": (59, 26), "EG": (27, 30), "ES": (40, -4), "FI": (64, 26), "FJ": (-18, 175), "FM": (6.92, 158.25), "FR": (46, 2), "GA": (-1, 11.75), "GB": (54, -2), "GD": (12.12, -61.67), "GE": (42, 43.5), "GH": (8, -2), "GM": (13.47, -16.57), "GR": (39, 22), "GT": (15.5, -90.25), "GW": (12, -15), "GY": (5, -59), "HK": (22.27, 114.19), "HN": (15, -86.5), "HR": (45.17, 15.5), "HU": (47, 20), "ID": (-5, 120), "IE": (53, -8), "IL": (31.47, 35.13), "IN": (20, 77), "IQ": (33, 44), "IS": (65, -18), "IT": (42.83, 12.83), "JM": (18.25, -77.5), "JO": (31, 36), "JP": (36, 138), "KE": (1, 38), "KG": (41, 75), "KH": (13, 105), "KN": (17.33, -62.75), "KR": (37, 127.5), "KW": (29.5, 45.75), "KY": (19.5, -80.5), "KZ": (48, 68), "LA": (18, 105), "LB": (33.83, 35.83), "LC": (13.88, -60.97), "LK": (7, 81), "LR": (6.5, -9.5), "LT": (56, 24), "LU": (49.75, 6.17), "LV": (57, 25), "LY": (25, 17), "MA": (32, -5), "MD": (47, 29), "ME": (42.5, 19.3), "MG": (-20, 47), "MK": (41.83, 22), "ML": (17, -4), "MM": (22, 98), "MN": (46, 105), "MO": (22.17, 113.55), "MR": (20, -12), "MS": (16.75, -62.2), "MT": (35.83, 14.58), "MU": (-20.28, 57.55), "MV": (3.25, 73), "MW": (-13.5, 34), "MX": (23, -102), "MY": (2.5, 112.5), "MZ": (-18.25, 35), "NA": (-22, 17), "NE": (16, 8), "NG": (10, 8), "NI": (13, -85), "NL": (52.5, 5.75), "NO": (62, 10), "NP": (28, 84), "NR": (-0.53, 166.92), "NZ": (-41, 174), "OM": (21, 57), "PA": (9, -80), "PE": (-10, -76), "PG": (-6, 147), "PH": (13, 122), "PK": (30, 70), "PL": (52, 20), "PS": (31.9, 35.2), "PT": (39.5, -8), "PW": (7.5, 134.5), "PY": (-23, -58), "QA": (25.5, 51.25), "RO": (46, 25), "RS": (44, 21), "RU": (60, 100), "RW": (-2, 30), "SA": (25, 45), "SB": (-8, 159), "SC": (-4.58, 55.67), "SE": (62, 15), "SG": (1.37, 103.8), "SI": (46.12, 14.82), "SK": (48.67, 19.5), "SL": (8.5, -11.5), "SN": (14, -14), "SR": (4, -56), "ST": (1, 7), "SV": (13.83, -88.92), "SZ": (-26.5, 31.5), "TC": (21.75, -71.58), "TD": (15, 19), "TH": (15, 100), "TJ": (39, 71), "TM": (40, 60), "TN": (34, 9), "TO": (-20, -175), "TR": (39, 35), "TT": (11, -61), "TW": (23.5, 121), "TZ": (-6, 35), "UA": (49, 32), "UG": (1, 32), "US": (38, -97), "UY": (-33, -56), "UZ": (41, 64), "VC": (13.25, -61.2), "VE": (8, -66), "VG": (18.43, -64.62), "VN": (16.17, 107.83), "VU": (-16, 167), "XK": (42.67, 21.17), "YE": (15, 48), "ZA": (-29, 24), "ZM": (-15, 30), "ZW": (-20, 30)]
}

/// Grille de terre décodée une seule fois (≈ 620 cases) ; pays → cases voisines de leur centre.
enum MMWGlobe {
    static let land: [(c: Int, r: Int)] = {
        var out: [(Int, Int)] = []
        for (r, row) in MMWGlobeData.grid.enumerated() { for (c, ch) in row.enumerated() where ch == "#" { out.append((c, r)) } }
        return out
    }()
    private static let landSet: Set<Int> = Set(land.map { $0.r * MMWGlobeData.cols + $0.c })

    static func cell(lat: Double, lng: Double) -> (c: Double, r: Double) {
        ((lng + 180) / 360 * Double(MMWGlobeData.cols), (MMWGlobeData.top - lat) / (MMWGlobeData.top - MMWGlobeData.bottom) * Double(MMWGlobeData.rows))
    }

    /// Intensité (0…1) par case allumée, à partir du revenu par pays.
    static func lit(_ byCountry: [String: Int]) -> [Int: Double] {
        let hi = Double(byCountry.values.max() ?? 0)
        guard hi > 0 else { return [:] }
        var out: [Int: Double] = [:]
        for (cc, v) in byCountry where v > 0 {
            guard let (lat, lng) = MMWGlobeData.centroids[cc.uppercased()] else { continue }
            let (fc, fr) = cell(lat: lat, lng: lng)
            let k = 0.35 + 0.65 * sqrt(Double(v) / hi)
            for dr in -1...1 { for dc in -2...2 {
                let c = Int(fc) + dc, r = Int(fr) + dr
                guard r >= 0, r < MMWGlobeData.rows else { continue }
                let cw = (c + MMWGlobeData.cols) % MMWGlobeData.cols
                let d = hypot(Double(cw) + 0.5 - fc, Double(r) + 0.5 - fr)
                guard d < 1.9 else { continue }
                let key = r * MMWGlobeData.cols + cw
                // Les très petits pays (hors grille de terre) gardent au moins leur case centrale.
                guard landSet.contains(key) || (dc == 0 && dr == 0) else { continue }
                out[key] = max(out[key] ?? 0, k * (1 - d / 2.4))
            } }
        }
        return out
    }
}

struct MMWGlobeView: View {
    let lit: [Int: Double]
    /// Pays de la vente du jour : point blanc.
    var spark: (c: Double, r: Double)? = nil

    var body: some View {
        Canvas { ctx, s in
            let cols = CGFloat(MMWGlobeData.cols), rows = CGFloat(MMWGlobeData.rows)
            let step = min(s.width / cols, s.height / rows)
            let ox = (s.width - step * cols) / 2, oy = (s.height - step * rows) / 2
            let d = step * 0.62
            var base = Path()
            for p in MMWGlobe.land where lit[p.r * MMWGlobeData.cols + p.c] == nil {
                base.addRect(CGRect(x: ox + CGFloat(p.c) * step + (step - d) / 2, y: oy + CGFloat(p.r) * step + (step - d) / 2, width: d, height: d))
            }
            ctx.fill(base, with: .color(MMColor.fg(0.13)))
            for (key, k) in lit {
                let c = key % MMWGlobeData.cols, r = key / MMWGlobeData.cols
                let rect = CGRect(x: ox + CGFloat(c) * step + (step - d) / 2, y: oy + CGFloat(r) * step + (step - d) / 2, width: d, height: d)
                ctx.fill(Path(rect), with: .color(MMWTone.moneyBright.opacity(0.25 + 0.75 * k)))
            }
            if let sp = spark {
                let x = ox + CGFloat(sp.c) * step, y = oy + CGFloat(sp.r) * step
                ctx.stroke(Path(ellipseIn: CGRect(x: x - step * 1.3, y: y - step * 1.3, width: step * 2.6, height: step * 2.6)), with: .color(MMColor.ink.opacity(0.5)), lineWidth: 0.75)
                ctx.fill(Path(ellipseIn: CGRect(x: x - d * 0.6, y: y - d * 0.6, width: d * 1.2, height: d * 1.2)), with: .color(MMColor.ink))
            }
        }
        .accessibilityHidden(true)
    }
}

