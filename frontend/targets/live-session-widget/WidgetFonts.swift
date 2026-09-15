import CoreText
import SwiftUI

/// Brand fonts for the Live Activity (see `docs/frontend/brand.md`).
/// Uses Noto Sans (body/labels) + IBM Plex Sans (data/timers). Sanchez is display-only in-app — not bundled here.
///
/// TTFs live in `assets/Fonts/` so `@bacons/apple-targets` links them as extension resources.
/// PostScript names must match `UIAppFonts` entries in Info.plist.
enum WidgetFontName {
  static let notoSansSemiBold = "NotoSans-SemiBold"
  static let ibmPlexSansSemiBold = "IBMPlexSans-SemiBold"
  static let ibmPlexSansMedium = "IBMPlexSans-Medium"
}

/// Registers bundled brand fonts for the widget process (belt-and-suspenders with UIAppFonts).
enum WidgetFontRegistration {
  private static let fileStems = [
    "NotoSans_600SemiBold",
    "IBMPlexSans_600SemiBold",
    "IBMPlexSans_500Medium",
  ]

  static let register: Void = {
    for stem in fileStems {
      guard let url = fontURL(stem: stem) else { continue }
      CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
  }()

  private static func fontURL(stem: String) -> URL? {
    let bundle = Bundle.main
    if let url = bundle.url(forResource: stem, withExtension: "ttf", subdirectory: "Fonts") {
      return url
    }
    if let url = bundle.url(forResource: stem, withExtension: "ttf", subdirectory: "assets/Fonts") {
      return url
    }
    return bundle.url(forResource: stem, withExtension: "ttf")
  }
}

extension Font {
  /// Bar titles + unit labels — Noto Sans SemiBold (brand body/label face).
  static func widgetNotoSemiBold(size: CGFloat) -> Font {
    _ = WidgetFontRegistration.register
    return .custom(WidgetFontName.notoSansSemiBold, size: size)
  }

  /// Stat values and timers — IBM Plex Sans SemiBold (brand Data/Stat + Data/Timer).
  static func widgetIbmPlexSemiBold(size: CGFloat) -> Font {
    _ = WidgetFontRegistration.register
    return .custom(WidgetFontName.ibmPlexSansSemiBold, size: size)
  }

  /// Lighter IBM Plex weight when needed for compact chrome.
  static func widgetIbmPlexMedium(size: CGFloat) -> Font {
    _ = WidgetFontRegistration.register
    return .custom(WidgetFontName.ibmPlexSansMedium, size: size)
  }
}
