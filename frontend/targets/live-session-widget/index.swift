import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
  init() {
    // Ensure brand TTFs (Noto + IBM Plex; no Sanchez) are registered before any Live Activity view draws.
    _ = WidgetFontRegistration.register
  }

  var body: some Widget {
    SessionLiveActivity()
  }
}
