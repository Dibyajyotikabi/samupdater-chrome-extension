# Chrome Web Store submission

**Item name** · SamUpdater: Galaxy Update Checker

**Homepage URL** · https://samupdater.com/

**Support URL** · https://samupdater.com/contact/

**Privacy policy URL** · https://github.com/Dibyajyotikabi/samupdater-chrome-extension/blob/main/PRIVACY.md

## Listing description

Check the latest firmware Samsung lists for your Galaxy device. Choose a device name or enter its model number, pick a country or CSC code, and see the release inside Chrome.

SamUpdater shows the build number, release date, security patch, One UI and Android versions when Samsung lists them. Recent firmware releases appear below the checker, with links to Samsung's release notes. Firmware availability on a particular device can vary by rollout and carrier.

SamUpdater is an independent service. Visit https://samupdater.com/ for the full checker and guides.

## Privacy practices

- **Single purpose** · Show Samsung Galaxy firmware releases by device and CSC.
- **Host permission** · `https://samupdater.com/*` lets the popup fetch the public firmware feed and perform a device lookup. The popup's content security policy limits connections to SamUpdater. The model and CSC are sent only when you run a lookup. Both requests omit cookies and credentials.
- **Remote code** · No. The popup scripts are bundled. The server returns JSON release data.
- **Data disclosure** · The model and CSC are lookup inputs. Use the privacy policy above and disclose the normal request details the server logs, including IP address, in the applicable dashboard fields.

## Package and review

From the repository root, put only the extension files in the ZIP:

```sh
mkdir -p dist
zip -X dist/samupdater-chrome-extension-1.1.0.zip manifest.json popup.html popup.css popup.js catalogue.js icons/*.png
```

Upload the ZIP to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole/). Set the homepage and support URLs in the listing, and the privacy policy URL in Privacy practices. If `samupdater.com` is verified for the publisher, select it in **Official URL** as well. Capture a screenshot of the installed popup showing a lookup result at 1280 × 800 or 640 × 400. Run the final export through the project's image cleanup step and verify its size and readability before uploading it.

For review, open the toolbar popup and check **Galaxy S24 Ultra** with CSC **EUX**. It should show the listed build and link to Samsung's release notes without an account.

[Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) · [Screenshot requirements](https://developer.chrome.com/docs/webstore/images) · [Review process](https://developer.chrome.com/docs/webstore/review-process)
