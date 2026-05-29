# Contributing

Thanks for helping improve this project.

## Ground Rules

- Keep the project public and source-available when distributing it.
- Do not add copyrighted ROMs, BIOS files, or download links for pirated games.
- Keep upstream credits and license notices intact.
- Use small, focused pull requests when possible.
- Test on both desktop and mobile when changing layout or controls.

## Development Setup

Run a local static server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not test only with `file://`, because browser security rules can break emulator loading.

## Before Opening a Pull Request

- Confirm NES still loads `.nes` files.
- Confirm GBA still loads `.gba` files with the EmulatorJS / mGBA engine.
- Confirm the custom NES touch pad does not appear for GBA.
- Confirm mobile layout still works around 414px width.
- Update README or THIRD_PARTY_NOTICES.md if you add a new library.

## Licensing

This repository is licensed under GPL-3.0. Contributions are accepted under the same license.

Third-party emulator libraries keep their own upstream licenses. Do not remove their notices or claim their work as part of this project's original code.
