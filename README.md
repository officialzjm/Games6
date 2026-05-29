# Retro Emulator - NES & GBA in the Browser

A browser-based retro emulator for playing legally owned NES and Game Boy Advance ROMs directly from a web page. It is built as a static GitHub Pages project with a clean desktop layout, mobile touch controls for NES, and selectable GBA engine support.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-58a6ff?style=for-the-badge&labelColor=0d1117)](https://x1n-q.github.io/Web-Based-Emulator/)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Made With](https://img.shields.io/badge/made_with-HTML_CSS_JavaScript-f7df1e)
![Systems](https://img.shields.io/badge/systems-NES_&_GBA-84d1c4)

## Tags

`browser-emulator` `nes-emulator` `gba-emulator` `retro-gaming` `javascript` `html5-canvas` `webassembly` `emulatorjs` `mgba` `jsnes` `iodinegba` `github-pages`

Suggested GitHub repository topics:

`browser-emulator`, `nes-emulator`, `gba-emulator`, `retro-gaming`, `javascript`, `html5-canvas`, `webassembly`, `emulatorjs`, `mgba`, `jsnes`, `iodinegba`, `github-pages`

## Live Demo

Play here:

https://x1n-q.github.io/Web-Based-Emulator/

## Screenshot

![Retro Emulator Screenshot](screenshot.png)

## Features

- NES support using jsNES.
- GBA support using EmulatorJS with the mGBA core by default.
- Optional standalone IodineGBA fallback from the GBA Engine selector.
- Local ROM loading from your device. No ROM files are hosted or included.
- Keyboard controls for NES with configurable mappings.
- Mobile NES touch controls below the game screen.
- EmulatorJS built-in controls for GBA on desktop and mobile.
- Responsive layout for desktop, tablet, and phone screens.
- Static web app that can run on GitHub Pages.

## Supported Systems

| System | Status | ROM Extension | Main Engine |
| --- | --- | --- | --- |
| Nintendo Entertainment System | Working | `.nes` | jsNES |
| Game Boy Advance | Working / experimental on mobile | `.gba` | EmulatorJS with mGBA |
| Game Boy Advance fallback | Optional | Uses in-frame picker | IodineGBA standalone |

## Libraries Used

- [jsNES](https://github.com/bfirsh/jsnes): JavaScript NES emulator used for NES games. Upstream license: Apache-2.0.
- [EmulatorJS](https://emulatorjs.org/): Browser emulator frontend used for GBA playback and built-in GBA controls. Upstream license: GPL-3.0.
- [mGBA](https://mgba.io/): GBA emulator core used by EmulatorJS. Upstream license: MPL-2.0.
- [IodineGBA](https://github.com/taisel/IodineGBA): Standalone JavaScript GBA emulator added as an optional fallback engine. Upstream license: MIT-style license.
- WebAssembly: Used by EmulatorJS/mGBA for better GBA performance.
- HTML5 Canvas: Used for NES rendering and the app display area.
- Web Audio API: Used by emulator engines for browser audio output.
- LocalStorage: Used to save local control settings.
- GitHub Pages: Hosts the static web app.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and license notes.

## Important GBA Notes

The default GBA option is **EmulatorJS / mGBA**. This is the recommended engine because it can use the ROM selected from the main file picker and includes its own touch/menu overlay.

The **IodineGBA Standalone** option is a fallback. Because it runs inside a separate embedded page, browser security does not allow this project to pass your local ROM file into it automatically. When using IodineGBA, use its own in-frame file picker to choose a game.

## License and Attribution

This repository is licensed under **GPL-3.0** to stay compatible with the GPL-3.0 EmulatorJS code used by the GBA integration.

This project is not affiliated with Nintendo, EmulatorJS, mGBA, jsNES, IodineGBA, or any game publisher. It is a public web app that integrates and credits third-party emulator projects; it does not claim ownership of those upstream emulators.

If you fork or reuse this project:

- Keep the repository source public when distributing the project.
- Keep the GPL-3.0 license notice.
- Keep the third-party notices and credits.
- Do not remove upstream license notices from any copied or bundled third-party code.
- Do not include copyrighted ROMs.

## Quick Start

### Use the live site

1. Open https://x1n-q.github.io/Web-Based-Emulator/
2. Choose `Nintendo (NES)` or `Game Boy Advance (GBA)`.
3. Click `Choose File`.
4. Select your legally owned `.nes` or `.gba` ROM.
5. Play in the browser.

### Run locally

Browsers block some emulator features when opened with `file://`, so use a local web server.

```bash
git clone https://github.com/x1n-Q/Web-Based-Emulator.git
cd Web-Based-Emulator
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Other local server options:

```bash
npx http-server -p 8000
php -S localhost:8000
```

## Controls

### NES keyboard controls

| NES Button | Default Keys |
| --- | --- |
| D-Pad | Arrow keys or WASD |
| A | Z, J, or N |
| B | X, K, or M |
| Start | Enter or Space |
| Select | Shift or C |

NES controls can be changed in the built-in control settings panel. On phones and tablets, the NES touch pad appears below the screen.

### GBA controls

GBA is handled by EmulatorJS by default. Use the in-game gear/menu overlay to configure controls, volume, fullscreen, save states, and other EmulatorJS options.

The custom lower touch pad is intentionally hidden for GBA so it does not conflict with EmulatorJS controls.

## Project Structure

```text
Web-Based-Emulator/
|-- index.html              Main page and controls
|-- style.css               Responsive layout and visual design
|-- main.js                 App startup and UI events
|-- emulator.js             NES/GBA emulator manager
|-- controls.js             Keyboard input handling
|-- touchControls.js        NES mobile touch pad
|-- controlSettings.js      Control remapping UI
|-- screenshot.png          README screenshot
|-- CODE_OF_CONDUCT.md      Community behavior rules
|-- CONTRIBUTING.md         Contribution and fork guidelines
|-- THIRD_PARTY_NOTICES.md  Third-party attribution and licenses
|-- LICENSE                 GPL-3.0 license
`-- README.md               Project documentation
```

## Browser Support

- Chrome / Edge recommended.
- Firefox supported.
- Safari supported, but mobile behavior may vary depending on iOS browser limits.
- For best GBA performance, use a modern browser with WebAssembly support.

## Troubleshooting

### ROM will not load

- Make sure the selected system matches the ROM extension.
- NES expects `.nes`.
- GBA expects `.gba`.
- Try another legally owned ROM to confirm the file is not corrupted.

### GBA controls cover the screen

- Use the default EmulatorJS / mGBA engine first.
- Rotate the phone or scroll slightly if the screen needs more vertical space.
- If needed, try the IodineGBA standalone fallback from the GBA Engine selector.

### Nothing works locally

- Do not open the project with `file://`.
- Start a local server with `python -m http.server 8000`.
- Open `http://localhost:8000`.

### Audio or keyboard does not respond

- Click or tap the game area once so the browser gives it focus.
- Check the browser's audio permission.
- For NES, review the control settings panel.
- For GBA, use the EmulatorJS gear/menu overlay.

## Legal

This project does not include, host, or distribute ROM files. You must provide your own legally obtained ROMs.

- Do not upload or use copyrighted ROMs that you do not legally own.
- This project is intended for education, preservation, and personal use.
- Game copyrights belong to their respective owners.
- Emulator and library copyrights belong to their upstream authors.

## Credits

- jsNES by Ben Firshman and contributors.
- EmulatorJS and its contributors.
- mGBA Team.
- IodineGBA by Grant Galitz and contributors.
- Emscripten/WebAssembly ecosystem.
- Browser APIs: HTML5 Canvas, Web Audio API, File API, and LocalStorage.

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.

Enjoy retro gaming in your browser.
