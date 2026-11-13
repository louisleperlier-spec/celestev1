// Live Activity : écran verrouillé et Dynamic Island, simulés avec des ventes fictives.
// Dans une vraie extension : déclare des `ActivityAttributes`, puis `ActivityConfiguration` ; place
// `lockScreen` dans la vue principale et les zones de `expanded`/`compact` dans `DynamicIsland { … }`.
// Ajoute `NSSupportsLiveActivities` à l'Info.plist de l'app.

import SwiftUI

struct MMLiveActivityWidgetDemo: View {
    @State private var revenue = 248.4
    @State private var sales = 14
    @State private var last = 9.99
    @State private var fresh = false
    @State private var saleDate = Date.now.addingTimeInterval(-120)
    private let hourly: [Double] = [0, 12, 12, 30, 48, 48, 74, 96, 118, 118, 152, 186, 214, 248]
    private let amounts = [4.99, 9.99, 29.99, 2.99]

    var body: some View {
        mmAutoBody
        .mmAutoDemo {
            for a in [9.99, 29.99] {
                await MMAutoDemo.wait(1.3)
                withAnimation(.smooth(duration: 0.5)) { last = a; revenue += a; sales += 1; saleDate = .now; fresh = true }
                await MMAutoDemo.wait(0.9)
                withAnimation(.smooth(duration: 0.4)) { fresh = false }
            }
        }
    }

    @ViewBuilder private var mmAutoBody: some View {
        ZStack {
            Color(white: 0.11).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 22) {
                    section("Dynamic Island ouverte") { expanded }
                    section("Dynamic Island compacte") { compact }
                    section("Réduite") { minimal }
                    section("Écran verrouillé") { lockScreen }
                }
                .padding(16)
            }
            .scrollIndicators(.hidden)
        }
        .preferredColorScheme(.dark)
        .task {
            var i = 0
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(4))
                guard !Task.isCancelled else { return }
                let amount = amounts[i % amounts.count]; i += 1
                withAnimation(.smooth(duration: 0.5)) { last = amount; revenue += amount; sales += 1; saleDate = .now; fresh = true }
                try? await Task.sleep(for: .seconds(2))
                withAnimation(.smooth(duration: 0.4)) { fresh = false }
            }
        }
    }

    private func section<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(spacing: 10) { Text(title).font(MMFont.system(12, .medium)).foregroundStyle(.white.opacity(0.5)); content() }
    }

    private var amountText: String { MMDemo.money(revenue) }
    private var compactText: String { MMDemo.money(revenue, compact: true) }

    private var expanded: some View {
        VStack(spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("AUJOURD'HUI").font(MMFont.system(9, .medium)).tracking(1.6).foregroundStyle(.white.opacity(0.4))
                    Text(amountText).font(MMFont.number(26)).tracking(-0.7).foregroundStyle(.white).contentTransition(.numericText(value: revenue)).lineLimit(1).minimumScaleFactor(0.6)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 3) {
                    Text("VENTES").font(MMFont.system(9, .medium)).tracking(1.6).foregroundStyle(.white.opacity(0.4))
                    HStack(spacing: 7) {
                        MMWRing(progress: 0.82, lineWidth: 2.4, track: .white.opacity(0.14)).frame(width: 18, height: 18)
                        Text("\(sales)").font(MMFont.number(26)).foregroundStyle(.white).contentTransition(.numericText(value: Double(sales)))
                    }
                }
            }
            MMWLine(values: hourly, lineWidth: 1.8).frame(height: fresh ? 24 : 30)
            saleLine
        }
        .padding(.horizontal, 22).padding(.vertical, 18)
        .frame(maxWidth: 364)
        .background(.black, in: RoundedRectangle(cornerRadius: 44, style: .continuous))
    }

    private var saleLine: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            if fresh { Image(systemName: "plus").font(.system(size: 11, weight: .bold)).foregroundStyle(MMWTone.moneyBright) }
            Text((fresh ? "" : "+") + MMDemo.money(last))
                .font(fresh ? MMFont.number(19) : MMFont.system(12))
                .foregroundStyle(fresh ? MMWTone.moneyBright : .white)
                .contentTransition(.numericText(value: last))
            Text(mmwFlag("FR")).font(MMFont.system(12)).foregroundStyle(.white.opacity(0.55))
            Spacer(minLength: 0)
            MMWAgo(date: saleDate, live: true).font(MMFont.system(10)).foregroundStyle(.white.opacity(0.35)).lineLimit(1).frame(maxWidth: 70, alignment: .trailing)
        }
    }

    private var compact: some View {
        HStack {
            MMWRing(progress: 0.82, lineWidth: 2.2, track: .white.opacity(0.18)).frame(width: 14, height: 14)
            Spacer()
            Text(compactText).font(MMFont.number(14, .regular)).foregroundStyle(.white).contentTransition(.numericText(value: revenue)).lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 14)
        .frame(width: 250, height: 37)
        .background(.black, in: Capsule())
    }

    private var minimal: some View {
        Text(compactText).font(MMFont.number(11, .regular)).foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.5)
            .padding(.horizontal, 4).frame(width: 45, height: 37).background(.black, in: Capsule())
    }

    private var lockScreen: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Circle().fill(.white).frame(width: 5, height: 5).alignmentGuide(.firstTextBaseline) { $0[.bottom] - 1 }
                Text("REVENUS DU JOUR").font(MMFont.system(10, .medium)).tracking(1.6).foregroundStyle(.white.opacity(0.4))
                Spacer()
                Text("Mon app").font(MMFont.system(10, .medium)).foregroundStyle(.white.opacity(0.3))
            }
            HStack(alignment: .bottom, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(amountText).font(MMFont.number(34)).tracking(-1).foregroundStyle(.white).contentTransition(.numericText(value: revenue)).lineLimit(1).minimumScaleFactor(0.6)
                        MMWRing(progress: 0.82, lineWidth: 2.6, track: .white.opacity(0.14)).frame(width: 20, height: 20)
                    }
                    Text("\(sales) ventes · 3 essais").font(MMFont.system(12)).foregroundStyle(.white.opacity(0.55))
                }.fixedSize()
                MMWLine(values: hourly, lineWidth: 1.8).frame(height: 44)
            }
            Rectangle().fill(.white.opacity(0.08)).frame(height: 0.75)
            saleLine
        }
        .padding(16)
        .frame(maxWidth: 364)
        .background(alignment: .topTrailing) { MMWDots(anchor: .topTrailing, reach: 0.5, maxOpacity: 0.16) }
        .background(.black.opacity(0.88), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}
