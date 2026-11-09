# Chrome Web Store submission

**Item name** · SamUpdater: Galaxy Update Checker

**Homepage URL** · https://samupdater.com/

**Support URL** · https://samupdater.com/contact/

**Privacy policy URL** · https://github.com/Dibyajyotikabi/samupdater-chrome-extension/blob/main/PRIVACY.md

## Listing description

Check the latest firmware Samsung lists for your Galaxy device. Choose a device name or enter its model number, pick a country or CSC code, and see the release inside Chrome.

SamUpdater shows the build number, release date, security patch, One UI and Android versions when Samsung lists them. Open the original Samsung release notes for details or browse the Galaxy guides from the popup. Firmware availability on a particular device can vary by rollout and carrier.

SamUpdater is an independent service. Visit https://samupdater.com/ for the full checker and guides.

## Privacy practices

- **Single purpose** · Show the latest listed firmware for a Samsung Galaxy model and CSC selected by the user.
- **Host permission** · `https://samupdater.com/*` lets the popup call the site's public firmware lookup. The popup's content security policy limits connections to the lookup endpoint. The extension sends only the selected model and CSC in the lookup and omits cookies and credentials.
- **Remote code** · No. The popup scripts are bundled. The server returns JSON release data.
- **Data disclosure** · The model and CSC are lookup inputs. Use the privacy policy above and disclose the normal request details the server logs, including IP address, in the applicable dashboard fields.

## Package and review

From the repository root, put only the extension files in the ZIP:

```sh
mkdir -p dist
zip -X dist/samupdater-chrome-extension-1.0.0.zip manifest.json popup.html popup.css popup.js catalogue.js icons/*.png
```

Upload the ZIP to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole/). Set the homepage and support URLs in the listing, and the privacy policy URL in Privacy practices. If `samupdater.com` is verified for the publisher, select it in **Official URL** as well. Capture a screenshot of the installed popup showing a lookup result at 1280 × 800 or 640 × 400, and process the final export through Remove AI before uploading it.

For review, open the toolbar popup and check **Galaxy S24 Ultra** with CSC **EUX**. It should show the listed build and link to Samsung's release notes without an account.

[Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) · [Screenshot requirements](https://developer.chrome.com/docs/webstore/images) · [Review process](https://developer.chrome.com/docs/webstore/review-process)
