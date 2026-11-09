# SamUpdater Galaxy Update Checker

Check the latest firmware Samsung lists for a Galaxy device from your Chrome toolbar. Choose a device name or type its model number, select a country or CSC, and see the build, release date, security patch, One UI and Android versions when available. The popup links to Samsung's release notes and the SamUpdater guides.

[Visit SamUpdater](https://samupdater.com/) · [Galaxy guides](https://samupdater.com/category/how-to/) · [Extension privacy policy](PRIVACY.md)

## Load in Chrome

1. Clone this repository or download and extract its source ZIP.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder that contains `manifest.json`.
4. Open **SamUpdater** from the Chrome extensions menu. For example, choose **Galaxy S24 Ultra** and enter **EUX**, then select **Check update**.

The popup bundles a small device and region catalogue for suggestions. A device name uses the regional model in that catalogue. If your phone uses a different model or is missing from the suggestions, enter the exact model number from **Settings > About phone** and its CSC. Each check queries the same release-note lookup used by [SamUpdater's firmware checker](https://samupdater.com/latest-security-update-checker/). The listed release can arrive on individual devices at different times.

The extension uses Manifest V3 and runs directly from source with no build or dependencies. See [Chrome Web Store submission details](WEB-STORE.md) for packaging and listing fields. The SU icon is SamUpdater's site mark. SamUpdater is an independent service.
