# Contributing to CHIP-8 Studio & Debugger

Thank you for your interest in contributing! This project is built with **Clean Code** and **Clean Architecture** principles in pure **Vanilla JavaScript (ES6 Modules)** with **zero runtime dependencies**.

---

## 🛠️ Development Guidelines

1. **Pure Vanilla JS**: We do not use bundlers (Webpack, Vite), transpilers (Babel), or UI frameworks (React, Vue). All code must run natively in modern web browsers as ES6 modules.
2. **Clean Separation of Concerns**:
   - The virtual machine core (`js/chip8.js`) must remain pure, decoupled from DOM elements or audio implementations.
   - UI logic belongs in `js/ui.js`.
   - Internationalization strings belong in `js/i18n.js` (maintain both English and Spanish).
   - Retro themes belong in `js/themes.js`.
3. **Automated Testing**:
   Every opcode change or new feature must include unit tests. Run the test suite before submitting:
   ```bash
   node --test tests/*.test.js
   ```
   All tests must pass.

---

## 🎮 Submitting ROMs

If you wish to contribute homebrew or public-domain CHIP-8 ROMs:
1. Place the `.ch8` file in the appropriate directory (`roms/games/`, `roms/demos/`, or `roms/programs/`).
2. Add the corresponding metadata in `roms/manifest.json`:
   ```json
   {
     "name": "Game Title",
     "file": "roms/games/title.ch8",
     "category": "Game",
     "author": "Original Author",
     "year": "199X",
     "size": 512,
     "controls": "Keys: 4 (Left), 6 (Right)",
     "description": "Short summary of gameplay mechanics."
   }
   ```

---

## 🐛 Bug Reports & Feature Requests

Please open an issue on GitHub describing:
- Steps to reproduce the bug.
- ROM file where the behavior occurred.
- Expected vs actual behavior.
- Operating system and browser version.

Thank you for keeping retro-computing alive and accessible!
