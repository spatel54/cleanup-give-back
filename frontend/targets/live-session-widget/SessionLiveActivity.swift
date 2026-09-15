import ActivityKit
import WidgetKit
import SwiftUI
import NitroActivityKitCore

private let brandPrimary = Color(red: 0, green: 149 / 255, blue: 64 / 255)
private let brandPrimarySoft = Color(red: 247 / 255, green: 255 / 255, blue: 241 / 255)
private let declinedRed = Color(red: 186 / 255, green: 26 / 255, blue: 26 / 255)
private let declinedRedSoft = Color(red: 255 / 255, green: 217 / 255, blue: 222 / 255)
private let checkpointWarningYellow = Color(red: 240 / 255, green: 173 / 255, blue: 30 / 255)
private let textPrimary = Color(red: 28 / 255, green: 27 / 255, blue: 27 / 255)
private let textTertiary = Color(red: 62 / 255, green: 74 / 255, blue: 61 / 255)
private let progressTrack = Color(red: 189 / 255, green: 202 / 255, blue: 186 / 255)
private let checkpointIntervalSeconds: TimeInterval = 30 * 60
/// Matches `CHECKPOINT_MISS_GRACE_MS` in `checkpointConstants.ts`.
private let checkpointGraceSeconds: TimeInterval = 10 * 60
private let maxSessionDuration: TimeInterval = 12 * 60 * 60

/// Lock Screen spacing — keep in lockstep with `preview.html`.
private enum LiveLayout {
  static let barVertical: CGFloat = 11
  static let logoWidth: CGFloat = 18
  static let logoHeight: CGFloat = 23
  static let logoTrailing: CGFloat = 12
  static let bodyOverlap: CGFloat = 1
  static let bodyTop: CGFloat = 16
  static let statsHorizontal: CGFloat = 12
  static let statsMinHeight: CGFloat = 54
  static let sideMiWidth: CGFloat = 68
  static let sidePhotoWidth: CGFloat = 88
  static let photoDueBottom: CGFloat = 12
  static let progressHeight: CGFloat = 10
  static let progressHorizontal: CGFloat = 16
  static let progressTop: CGFloat = 10
  static let progressBottom: CGFloat = 12
  static let photosOffMinSpacer: CGFloat = 4
  static let photosOffBottom: CGFloat = 8
}

/// Green -> yellow -> red as the checkpoint window elapses, so the bar itself signals urgency.
private func progressTint(elapsedFraction: Double) -> Color {
  if elapsedFraction >= 0.9 {
    return declinedRed
  }
  if elapsedFraction >= 0.7 {
    return checkpointWarningYellow
  }
  return brandPrimary
}

private struct SessionContext {
  let startedAt: Date
  let distanceMiles: Double
  let checkpointWindowStartedAt: Date?
  let photosEnabled: Bool
  let checkpointDueOrGrace: Bool

  var sessionTimerEnd: Date {
    startedAt.addingTimeInterval(maxSessionDuration)
  }

  var checkpointDueAt: Date? {
    checkpointWindowStartedAt?.addingTimeInterval(checkpointIntervalSeconds)
  }

  var graceEndsAt: Date? {
    checkpointDueAt?.addingTimeInterval(checkpointGraceSeconds)
  }

  var isCheckpointOverdue: Bool {
    checkpointDueOrGrace
  }

  /// 0...1 fraction of the current checkpoint window elapsed, for progress-bar tinting.
  var checkpointElapsedFraction: Double {
    guard let start = checkpointWindowStartedAt, let due = checkpointDueAt, due > start else {
      return 0
    }
    let fraction = Date().timeIntervalSince(start) / due.timeIntervalSince(start)
    return min(max(fraction, 0), 1)
  }

  var bodyColor: Color {
    isCheckpointOverdue ? declinedRedSoft : brandPrimarySoft
  }

  var barColor: Color {
    isCheckpointOverdue ? declinedRed : brandPrimary
  }

  static func from(_ context: ActivityViewContext<ActivityKitModuleAttributes>) -> SessionContext {
    let startedAt = context.state.getDate("startedAt") ?? Date()
    let distanceMiles = (context.state["distanceMiles"] as? Double) ?? 0
    let checkpointWindowStartedAt = context.state.getDate("checkpointWindowStartedAt")
    let photosEnabled = context.state.getBool("photosEnabled")
    let checkpointDueOrGrace = context.state.getBool("checkpointDueOrGrace")

    return SessionContext(
      startedAt: startedAt,
      distanceMiles: distanceMiles,
      checkpointWindowStartedAt: checkpointWindowStartedAt,
      photosEnabled: photosEnabled,
      checkpointDueOrGrace: checkpointDueOrGrace
    )
  }
}

private func formatDistanceMiles(_ miles: Double) -> String {
  if !miles.isFinite || miles <= 0 {
    return "0.0"
  }
  if miles < 0.1 {
    return String(format: "%.2f", miles)
  }
  return String(format: "%.1f", miles)
}

private struct LiveBar: View {
  let title: String
  let barColor: Color

  var body: some View {
    ZStack(alignment: .trailing) {
      Text(title)
        .font(.widgetNotoSemiBold(size: 16))
        .foregroundStyle(.white)
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)

      BrandLogoMark(color: .white)
        .frame(width: LiveLayout.logoWidth, height: LiveLayout.logoHeight)
        .padding(.trailing, LiveLayout.logoTrailing)
    }
    .padding(.vertical, LiveLayout.barVertical)
    .frame(maxWidth: .infinity)
    .background(barColor)
  }
}

/// Side metrics (distance / next photo) — smaller than the hero elapsed timer.
/// `minWidth: 0` + layoutPriority so Text(timerInterval:) hero cannot crush these columns.
private struct StatColumn: View {
  let value: String
  let unit: String

  var body: some View {
    VStack(spacing: 2) {
      Text(value)
        .font(.widgetIbmPlexSemiBold(size: 20))
        .foregroundStyle(textPrimary)
        .monospacedDigit()
        .multilineTextAlignment(.center)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .frame(minWidth: 0, maxWidth: .infinity)
      Text(unit)
        .font(.widgetNotoSemiBold(size: 11))
        .foregroundStyle(textTertiary)
        .multilineTextAlignment(.center)
        .lineLimit(1)
        .frame(minWidth: 0, maxWidth: .infinity)
    }
    .frame(minWidth: 0, maxWidth: .infinity)
    .layoutPriority(1)
  }
}

/// Strava-style hero elapsed timer — dominant center (or leading when only two stats).
/// `Text(timerInterval:)` sizes for the widest string in the 12h range (~`11:59:59`),
/// so the live value is overlaid on a current-format stub (`0:00` / `0:00:00`) and
/// must not drive HStack column weights (see `PhotosOnStatsRow`).
private struct ElapsedStatColumn: View {
  let startedAt: Date
  let sessionTimerEnd: Date
  var unit: String = "time"
  var hero: Bool = true

  private var showHours: Bool {
    Date().timeIntervalSince(startedAt) >= 3600
  }

  private var fontSize: CGFloat {
    hero ? 40 : 20
  }

  var body: some View {
    VStack(spacing: 2) {
      Text(showHours ? "0:00:00" : "0:00")
        .font(.widgetIbmPlexSemiBold(size: fontSize))
        .monospacedDigit()
        .foregroundStyle(.clear)
        .overlay {
          Text(timerInterval: startedAt...sessionTimerEnd, countsDown: false, showsHours: showHours)
            .font(.widgetIbmPlexSemiBold(size: fontSize))
            .foregroundStyle(textPrimary)
            .monospacedDigit()
            .multilineTextAlignment(.center)
            .lineLimit(1)
            .minimumScaleFactor(hero ? 0.55 : 0.7)
        }

      Text(unit)
        .font(.widgetNotoSemiBold(size: 11))
        .foregroundStyle(textTertiary)
        .multilineTextAlignment(.center)
    }
    .fixedSize()
  }
}

/// 10-minute grace countdown after the checkpoint is due (Photo due card).
private struct GraceCountdownColumn: View {
  let checkpointDueAt: Date
  let graceEndsAt: Date

  var body: some View {
    VStack(spacing: 2) {
      Text(timerInterval: checkpointDueAt...graceEndsAt, countsDown: true, showsHours: false)
        .font(.widgetIbmPlexSemiBold(size: 20))
        .foregroundStyle(textPrimary)
        .monospacedDigit()
        .multilineTextAlignment(.center)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .frame(minWidth: 0, maxWidth: .infinity)
      Text("remaining")
        .font(.widgetNotoSemiBold(size: 11))
        .foregroundStyle(textTertiary)
        .multilineTextAlignment(.center)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
        .frame(minWidth: 0, maxWidth: .infinity)
    }
    .frame(minWidth: 0, maxWidth: .infinity)
    .layoutPriority(1)
  }
}

/// mi | TIME | remaining — Photo due; grace counts down on the right.
private struct PhotoDueStatsRow: View {
  let session: SessionContext
  let checkpointDueAt: Date
  let graceEndsAt: Date

  var body: some View {
    ZStack(alignment: .bottom) {
      HStack(alignment: .bottom, spacing: 0) {
        StatColumn(value: formatDistanceMiles(session.distanceMiles), unit: "mi")
          .frame(width: LiveLayout.sideMiWidth)
        Spacer(minLength: 0)
        GraceCountdownColumn(checkpointDueAt: checkpointDueAt, graceEndsAt: graceEndsAt)
          .frame(width: LiveLayout.sidePhotoWidth)
      }

      ElapsedStatColumn(startedAt: session.startedAt, sessionTimerEnd: session.sessionTimerEnd)
    }
    .frame(minHeight: LiveLayout.statsMinHeight, alignment: .bottom)
  }
}

/// mi | TIME — same center hero as photos-on, no next-photo column.
private struct MiAndTimeStatsRow: View {
  let session: SessionContext

  var body: some View {
    ZStack(alignment: .bottom) {
      HStack(alignment: .bottom, spacing: 0) {
        StatColumn(value: formatDistanceMiles(session.distanceMiles), unit: "mi")
          .frame(width: LiveLayout.sideMiWidth)
        Spacer(minLength: 0)
      }

      ElapsedStatColumn(startedAt: session.startedAt, sessionTimerEnd: session.sessionTimerEnd)
    }
    .frame(minHeight: LiveLayout.statsMinHeight, alignment: .bottom)
  }
}

/// mi | TIME | next photo — hero is overlaid at true center so timerInterval
/// intrinsic width cannot shift it. Side columns hug the edges.
private struct PhotosOnStatsRow: View {
  let session: SessionContext
  let checkpointStart: Date
  let checkpointDue: Date

  var body: some View {
    ZStack(alignment: .bottom) {
      HStack(alignment: .bottom, spacing: 0) {
        StatColumn(value: formatDistanceMiles(session.distanceMiles), unit: "mi")
          .frame(width: LiveLayout.sideMiWidth)
        Spacer(minLength: 0)
        CheckpointStatColumn(
          checkpointWindowStartedAt: checkpointStart,
          checkpointDueAt: checkpointDue,
          isOverdue: false
        )
        .frame(width: LiveLayout.sidePhotoWidth)
      }

      ElapsedStatColumn(startedAt: session.startedAt, sessionTimerEnd: session.sessionTimerEnd)
    }
    .frame(minHeight: LiveLayout.statsMinHeight, alignment: .bottom)
  }
}

private struct CheckpointStatColumn: View {
  let checkpointWindowStartedAt: Date
  let checkpointDueAt: Date
  let isOverdue: Bool

  var body: some View {
    VStack(spacing: 2) {
      if isOverdue {
        Text(timerInterval: checkpointDueAt...checkpointDueAt.addingTimeInterval(maxSessionDuration), countsDown: false, showsHours: false)
          .font(.widgetIbmPlexSemiBold(size: 20))
          .foregroundStyle(textPrimary)
          .monospacedDigit()
          .multilineTextAlignment(.center)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .frame(minWidth: 0, maxWidth: .infinity)
        Text("elapsed")
          .font(.widgetNotoSemiBold(size: 11))
          .foregroundStyle(textTertiary)
          .multilineTextAlignment(.center)
          .frame(minWidth: 0, maxWidth: .infinity)
      } else {
        Text(timerInterval: checkpointWindowStartedAt...checkpointDueAt, countsDown: true, showsHours: false)
          .font(.widgetIbmPlexSemiBold(size: 20))
          .foregroundStyle(textPrimary)
          .monospacedDigit()
          .multilineTextAlignment(.center)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .frame(minWidth: 0, maxWidth: .infinity)
        Text("next photo")
          .font(.widgetNotoSemiBold(size: 11))
          .foregroundStyle(textTertiary)
          .multilineTextAlignment(.center)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
          .frame(minWidth: 0, maxWidth: .infinity)
      }
    }
    .frame(minWidth: 0, maxWidth: .infinity)
    .layoutPriority(1)
  }
}

private struct CheckpointProgressBar: View {
  let checkpointWindowStartedAt: Date
  let checkpointDueAt: Date
  let elapsedFraction: Double

  var body: some View {
    ZStack {
      Capsule()
        .fill(progressTrack.opacity(0.55))
        .frame(height: LiveLayout.progressHeight)

      ProgressView(
        timerInterval: checkpointWindowStartedAt...checkpointDueAt,
        countsDown: false,
        label: { EmptyView() },
        currentValueLabel: { EmptyView() }
      )
      .progressViewStyle(.linear)
      .tint(progressTint(elapsedFraction: elapsedFraction))
      .scaleEffect(x: 1, y: 2.8, anchor: .center)
      .frame(height: LiveLayout.progressHeight)
      .clipShape(Capsule())
    }
    .frame(height: LiveLayout.progressHeight)
    .padding(.horizontal, LiveLayout.progressHorizontal)
    .padding(.top, LiveLayout.progressTop)
    .padding(.bottom, LiveLayout.progressBottom)
  }
}

/// `.widget` > `.bar` + `.body` from `preview.html`.
/// Body top/bottom insets sit *outside* the stats ZStack so the 40pt hero cannot eat them.
private struct LiveCardChrome<Content: View>: View {
  let barTitle: String
  let barColor: Color
  let bodyColor: Color
  var bodyBottom: CGFloat = 0
  @ViewBuilder var content: () -> Content

  var body: some View {
    VStack(spacing: 0) {
      LiveBar(title: barTitle, barColor: barColor)

      VStack(spacing: 0) {
        content()
      }
      .padding(.top, LiveLayout.bodyTop)
      .padding(.bottom, bodyBottom)
      .frame(maxWidth: .infinity)
      .padding(.top, -LiveLayout.bodyOverlap)
      .background(bodyColor)
    }
    .frame(maxWidth: .infinity)
    .background(barColor)
  }
}

private struct SessionTrackerCard: View {
  let session: SessionContext

  var body: some View {
    LiveCardChrome(
      barTitle: "Live",
      barColor: session.barColor,
      bodyColor: session.bodyColor
    ) {
      Group {
        if session.photosEnabled, let checkpointStart = session.checkpointWindowStartedAt, let checkpointDue = session.checkpointDueAt {
          PhotosOnStatsRow(
            session: session,
            checkpointStart: checkpointStart,
            checkpointDue: checkpointDue
          )
        } else {
          MiAndTimeStatsRow(session: session)
        }
      }
      .padding(.horizontal, LiveLayout.statsHorizontal)

      if session.photosEnabled, let checkpointStart = session.checkpointWindowStartedAt, let checkpointDue = session.checkpointDueAt {
        CheckpointProgressBar(
          checkpointWindowStartedAt: checkpointStart,
          checkpointDueAt: checkpointDue,
          elapsedFraction: session.checkpointElapsedFraction
        )
      } else {
        Spacer(minLength: LiveLayout.photosOffMinSpacer)
          .padding(.bottom, LiveLayout.photosOffBottom)
      }
    }
  }
}

/// Soft red card when a checkpoint photo is due — saturated red top bar, lighter red body.
private struct PhotoDueCard: View {
  let session: SessionContext

  var body: some View {
    LiveCardChrome(
      barTitle: "Photo due",
      barColor: declinedRed,
      bodyColor: declinedRedSoft,
      bodyBottom: LiveLayout.photoDueBottom
    ) {
      Group {
        if let due = session.checkpointDueAt, let graceEnd = session.graceEndsAt {
          PhotoDueStatsRow(session: session, checkpointDueAt: due, graceEndsAt: graceEnd)
        } else {
          MiAndTimeStatsRow(session: session)
        }
      }
      .padding(.horizontal, LiveLayout.statsHorizontal)
    }
  }
}

struct SessionLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: ActivityKitModuleAttributes.self) { context in
      let session = SessionContext.from(context)
      Group {
        if session.isCheckpointOverdue {
          PhotoDueCard(session: session)
        } else {
          SessionTrackerCard(session: session)
        }
      }
      .frame(maxWidth: .infinity)
      .widgetURL(URL(string: "nonprofitmobileapp://live-session"))
      .activityBackgroundTint(session.bodyColor)
    } dynamicIsland: { context in
      let session = SessionContext.from(context)
      let accent = session.isCheckpointOverdue ? declinedRed : Color.white

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            BrandLogoMark(color: accent)
              .frame(width: 14, height: 18)
            Text(session.isCheckpointOverdue ? "Photo due" : "Live cleanup")
              .font(.widgetNotoSemiBold(size: 12))
              .foregroundStyle(accent)
              .lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text("\(formatDistanceMiles(session.distanceMiles)) mi")
            .font(.widgetIbmPlexSemiBold(size: 12))
            .foregroundStyle(.white)
            .monospacedDigit()
        }
        DynamicIslandExpandedRegion(.center) {
          Text(timerInterval: session.startedAt...session.sessionTimerEnd, countsDown: false, showsHours: true)
            .font(.widgetIbmPlexSemiBold(size: 28))
            .foregroundStyle(.white)
            .monospacedDigit()
        }
        DynamicIslandExpandedRegion(.bottom) {
          if session.photosEnabled, let checkpointStart = session.checkpointWindowStartedAt, let checkpointDue = session.checkpointDueAt {
            HStack(spacing: 8) {
              if session.isCheckpointOverdue {
                Text(timerInterval: checkpointDue...checkpointDue.addingTimeInterval(maxSessionDuration), countsDown: false, showsHours: false)
                  .font(.widgetIbmPlexSemiBold(size: 12))
                  .foregroundStyle(declinedRed)
                  .monospacedDigit()
                Text("elapsed")
                  .font(.widgetNotoSemiBold(size: 11))
                  .foregroundStyle(.white.opacity(0.75))
              } else {
                Text(timerInterval: checkpointStart...checkpointDue, countsDown: true, showsHours: false)
                  .font(.widgetIbmPlexSemiBold(size: 12))
                  .foregroundStyle(.white)
                  .monospacedDigit()
                Text("next photo")
                  .font(.widgetNotoSemiBold(size: 11))
                  .foregroundStyle(.white.opacity(0.75))
              }
            }
          }
        }
      } compactLeading: {
        BrandLogoMark(color: .white)
          .frame(width: 14, height: 18)
      } compactTrailing: {
        Text(timerInterval: session.startedAt...session.sessionTimerEnd, countsDown: false, showsHours: false)
          .font(.widgetIbmPlexSemiBold(size: 12))
          .foregroundStyle(session.isCheckpointOverdue ? declinedRed : .white)
          .monospacedDigit()
          .multilineTextAlignment(.trailing)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
          .frame(width: 48, alignment: .trailing)
      } minimal: {
        BrandLogoMark(color: .white)
          .frame(width: 12, height: 15)
      }
      .widgetURL(URL(string: "nonprofitmobileapp://live-session"))
    }
    .contentMarginsDisabled()
  }
}

// MARK: - Xcode Canvas previews (no app session required)

#if DEBUG
private extension SessionContext {
  /// Mock session for Canvas — same shape as JS `serializeLiveActivityState`.
  static func preview(
    startedMinutesAgo: Double = 15,
    distanceMiles: Double = 0.4,
    photosEnabled: Bool = true,
    checkpointDueOrGrace: Bool = false,
    checkpointMinutesAgo: Double? = 5
  ) -> SessionContext {
    SessionContext(
      startedAt: Date().addingTimeInterval(-startedMinutesAgo * 60),
      distanceMiles: distanceMiles,
      checkpointWindowStartedAt: checkpointMinutesAgo.map { Date().addingTimeInterval(-$0 * 60) },
      photosEnabled: photosEnabled,
      checkpointDueOrGrace: checkpointDueOrGrace
    )
  }
}

/// Lock-screen card previews — Canvas needs host app scheme **nonprofitmobileapp** + Simulator (not livesessionwidget alone).
private struct LiveActivityCardPreviewHost: View {
  let session: SessionContext

  var body: some View {
    Group {
      if session.isCheckpointOverdue {
        PhotoDueCard(session: session)
      } else {
        SessionTrackerCard(session: session)
      }
    }
    .frame(maxWidth: 390)
  }

  init(_ session: SessionContext) {
    _ = WidgetFontRegistration.register
    self.session = session
  }
}

#Preview("Card — Photos on") {
  LiveActivityCardPreviewHost(.preview())
}

#Preview("Card — Photos off") {
  LiveActivityCardPreviewHost(.preview(photosEnabled: false, checkpointMinutesAgo: nil))
}

#Preview("Card — Photo due") {
  LiveActivityCardPreviewHost(.preview(checkpointDueOrGrace: true, checkpointMinutesAgo: 35))
}

/// ActivityKit widget previews — need livesessionwidget scheme; may fail with Nitro attributes.
private enum SessionLiveActivityPreviewData {
  static let attributes: ActivityKitModuleAttributes = {
    // Register brand fonts the same way the WidgetBundle init does.
    _ = WidgetFontRegistration.register
    return try! ActivityKitModuleAttributes(data: [
      "name": "Clean Up Give Back session",
    ])
  }()

  static func state(
    startedMinutesAgo: Double = 15,
    distanceMiles: Double = 0.4,
    photosEnabled: Bool = true,
    checkpointDueOrGrace: Bool = false,
    checkpointMinutesAgo: Double? = 5
  ) -> ActivityKitModuleAttributes.ContentState {
    _ = WidgetFontRegistration.register
    var data: [String: Any] = [
      "startedAt": Date().addingTimeInterval(-startedMinutesAgo * 60).timeIntervalSince1970 * 1000,
      "distanceMiles": distanceMiles,
      "photosEnabled": photosEnabled,
      "checkpointDueOrGrace": checkpointDueOrGrace,
    ]
    if let checkpointMinutesAgo {
      data["checkpointWindowStartedAt"] =
        Date().addingTimeInterval(-checkpointMinutesAgo * 60).timeIntervalSince1970 * 1000
    }
    return try! ActivityKitModuleAttributes.ContentState(data: data)
  }
}

#Preview("Lock Screen — Photos on", as: .content, using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state()
}

#Preview("Lock Screen — Photos off", as: .content, using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state(photosEnabled: false, checkpointMinutesAgo: nil)
}

#Preview("Lock Screen — Photo due", as: .content, using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state(
    checkpointDueOrGrace: true,
    checkpointMinutesAgo: 35
  )
}

#Preview("Dynamic Island — Compact", as: .dynamicIsland(.compact), using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state()
}

#Preview("Dynamic Island — Compact Photo due", as: .dynamicIsland(.compact), using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state(
    checkpointDueOrGrace: true,
    checkpointMinutesAgo: 35
  )
}

#Preview("Dynamic Island — Expanded", as: .dynamicIsland(.expanded), using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state()
}

#Preview("Dynamic Island — Minimal", as: .dynamicIsland(.minimal), using: SessionLiveActivityPreviewData.attributes) {
  SessionLiveActivity()
} contentStates: {
  SessionLiveActivityPreviewData.state()
}
#endif
