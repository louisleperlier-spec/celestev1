import SwiftUI

/// Données 100 % fictives : remplace-les par les tiennes.
enum MMDemo {
    static let revenue: [Double] = [212, 248, 231, 286, 302, 274, 338, 361, 329, 392, 418, 387, 446, 471, 438, 502, 528, 496, 561, 589, 553, 618, 644, 612, 681, 702, 668, 742]
    static let bars: [Double] = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15, 12, 18]

    static func points(_ days: Int) -> [MMPoint] {
        let values = Array(revenue.suffix(max(days, 2)))
        let now = Date()
        return values.enumerated().map { i, v in
            MMPoint(date: now.addingTimeInterval(Double(i - values.count + 1) * 86_400), value: v)
        }
    }

    static func money(_ value: Double, compact: Bool = false) -> String {
        value.formatted(.currency(code: "EUR").precision(.fractionLength(compact ? 0 : 2)))
    }
}

/// Fond commun des démonstrations.
struct MMDemoPage<Content: View>: View {
    @ViewBuilder var content: () -> Content
    var body: some View {
        ScrollView { VStack(spacing: 14) { content() }.padding(16) }
            .scrollIndicators(.hidden)
            .background { MMBackdrop() }
            .preferredColorScheme(.dark)
    }
}

/// Scénario joué seul pendant l'enregistrement d'un aperçu. Sans effet dans une app normale.
enum MMAutoDemo {
    static let isRecording = CommandLine.arguments.contains("-capture-video")
    static func wait(_ seconds: Double) async { try? await Task.sleep(for: .seconds(seconds)) }
}

extension View {
    func mmAutoDemo(_ script: @escaping @MainActor () async -> Void) -> some View {
        task { if MMAutoDemo.isRecording { await script() } }
    }
}
