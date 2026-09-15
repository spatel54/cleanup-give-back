fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Production .ipa on this Mac (eas build --local; does not use EAS cloud iOS quota)

### ios submit

```sh
[bundle exec] fastlane ios submit
```

Upload newest frontend/build-*.ipa to TestFlight (EAS Submit + App Store Connect API key on EAS)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Local production build, then submit to TestFlight

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
