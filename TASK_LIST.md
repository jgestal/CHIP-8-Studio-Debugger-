# CHIP-8 Studio & Debugger - Execution Roadmap & Task Tracker

## 📌 Status: COMPLETED (All Phases Delivered & Tested)

- [x] **Phase 1: Automated Test Suite (Unit & System Tests)**
  - [x] Created `tests/chip8.test.js` covering CPU initialization, fontset, memory loading.
  - [x] Tested arithmetic instructions, logical opcodes, carry/borrow flags (VF).
  - [x] Tested branching, jumps (1NNN, 2NNN, BNNN), stack push/pop, subroutines (00EE).
  - [x] Tested timers (DT, ST), random (CXNN), BCD conversion (FX33), register dump/load (FX55/FX65).
  - [x] Tested Quirks modes (shift, load/store, jump).
  - [x] Executed test runner with `node --test tests/chip8.test.js` (10/10 test suites passing, 100% success).

- [x] **Phase 2: Decoupled Theming Engine (`js/themes.js` & Design Tokens)**
  - [x] Created `js/themes.js` with decoupled `ThemeManager` class adhering to Open/Closed Principle.
  - [x] Implemented 6 full-UI themes with CSS variables and canvas palettes:
    1. **NES Classic (1983)**: Retro dark gray chassis, Nintendo crimson red (#C41A1A), dark deck.
    2. **SNES Super Famicom (1991)**: Dual-tone purple/lavender (#8B5CF6, #C084FC), warm chassis.
    3. **Terminal VT220**: Phosphor green (#39FF14) on deep black, CRT bloom, scanlines.
    4. **Game Boy DMG-01 (1989)**: 4-shade LCD green palette (#0F380F to #9BBC0F), magenta accents.
    5. **Jeffrey Massung Slate**: Dark workstation slate-blue/charcoal.
    6. **Cyberpunk Synthwave**: Neon cyan (#00F5D4), hot magenta (#F43F5E), deep purple.
  - [x] Bound theme switching to document root `data-theme` attribute and `Display.setTheme()`.

- [x] **Phase 3: English as Primary Language & i18n Modernization (`js/i18n.js`)**
  - [x] Set `en` as default initial language in `localStorage` fallback.
  - [x] Complete bilingual translations for all controls, themes, tooltips, and natural language opcode explanations.

- [x] **Phase 4: Iconography System & Ergonomic Panel Reorganization**
  - [x] Added clean inline SVG icons (Lucide-style: Play, Pause, Step, Frame, Reset, Rewind, Speed, Audio, Fullscreen).
  - [x] Moved game controls from top toolbar to a dedicated **Playback Dashboard under the Canvas**.
  - [x] Added HTML5 Fullscreen API toggle with 2:1 aspect ratio lock (`64:32`).
  - [x] Implemented a **dedicated 4x4 Hex Keypad panel** with dual-legend badges (Hex digit + mapped PC key `1-4, Q-R, A-F, Z-V`) and reactive illumination.
  - [x] Refactored `css/styles.css` with clean layout, CSS custom properties per theme, and tooltip system (`data-tooltip`).

- [x] **Phase 5: Controller & Audio Synthesis Polish**
  - [x] Polished Web Audio oscillator with smooth envelope and live oscilloscope.
  - [x] Verified Gamepad API polling, touch feedback, and audio mute/unmute icon toggling.

- [x] **Phase 6: Verification & End-to-End Testing**
  - [x] Ran automated unit test suite with Node.js test runner (`node --test tests/*.test.js` - 21/21 passing).
  - [x] Verified local HTTP server serving all ROMs, themes, and debug panels on `http://localhost:8080`.

- [x] **Phase 7: Ergonomic Panels, Execution Trace Log & NES Theme Polish**
  - [x] **Execution Trace Log Panel ("Trace Log" / "Historial")**:
    - Created dedicated inspector tab `#tab-content-history` with live ring buffer (up to 200 recent opcodes).
    - Real-time display of Step count, PC address, raw Opcode, Disassembly mnemonic + operands, and register diffs.
    - Added auto-scroll toggle and "Clear Log" action button.
  - [x] **Adaptable & Resizable Workstation Panels**:
    - Implemented draggable column splitter (`#resizer-col`) between screen deck and debug deck with CSS variable `--left-deck-width`.
    - Implemented draggable row splitters (`#resizer-left-row`, `#resizer-right-row`) for custom keypad and inspector heights.
    - Persistent panel sizing stored in `localStorage`.
  - [x] **Panel Minimization / Collapse**:
    - Added minimize/expand buttons (`−` / `+`) to all panel headers (`.panel-header-btn.btn-collapse`).
    - Collapsing hides panel bodies cleanly while preserving headers, allowing maximum screen space for active panels.
  - [x] **Eliminated Live Didactic Explainer Shaking (Zero Layout Shift)**:
    - Locked `.explainer-card` to a stable fixed height (`height: 84px; min-height: 84px; max-height: 84px; overflow-y: auto; flex-shrink: 0;`).
    - Completely eliminates flickering/jittering of the disassembler list when stepping through instructions.
  - [x] **Restored Missing Features**:
    - Restored **Active ROM Details Card** (`#tab-content-info`) with metadata (Title, Author, Year, Size, Category, Controls, Description) and `updateRomInfoCard(meta)` renderer.
    - Added **Screenshot button** (`#btn-screenshot`) in the Playback Dashboard with PNG export at 10x crisp scale (keyboard shortcut `S`).
  - [x] **NES Classic Theme Contrast Overhaul**:
    - Enhanced palette in `js/themes.js` and added dedicated CSS rules in `css/styles.css` for `[data-theme="nes"]`.
    - High-contrast white text, vivid Nintendo red active tabs and borders, and crisp high-luminance register values with WCAG AAA readability.
  - [x] **Automated Tests**:
    - Created `tests/trace.test.js` covering trace decoding, opcode hooks, and circular ring-buffer overflow.
    - 21/21 tests passing cleanly (`node --test tests/*.test.js`).

- [x] **Phase 8: Keyboard Shortcut Decoupling & Interactive Controls Mapping Modal**
  - [x] **Identified Collision Root Cause**: CHIP-8 keys `R` (0xD), `S` (0x8), `F` (0xE) and `Space` (0x5) were colliding with bare system shortcuts (Rewind, Screenshot, Fullscreen, Play/Pause).
  - [x] **Clean Non-Conflicting Remapping**:
    - Play / Pause: Remapped to `P` and `Escape` (freeing `Space` for game fire/jump).
    - Rewind: Remapped to `Backspace` and `Tab` (freeing `R` for game hex key 0xD).
    - Step Single Instruction: Dedicated `F10`.
    - Step Frame (1/60s): Moved to `F9` (freeing `F11` for standard Fullscreen).
    - Fullscreen: Remapped to `F11`, `Alt+Enter` and `Alt+F` (freeing bare `F` for game hex key 0xE).
    - Screenshot: Remapped to `F12` and `Alt+S` (freeing bare `S` for game hex key 0x8 / Down Arrow).
    - Quick Save / Load: `F1` and `F5`.
    - Modal Dismissal: Pressing `Escape` closes any open dialog, or pauses/resumes emulation if none is open.
  - [x] **Interactive Controls & Hotkeys Modal (`#shortcuts-modal`)**:
    - Added top toolbar button `⌨️ Keys` (`#btn-shortcuts-modal`) and `?` hotkey.
    - Two-column visual layout showing the 4x4 COSMAC VIP layout mapped to PC keys and the complete workstation hotkey list.
    - Full English & Spanish bilingual translation keys in `js/i18n.js`.
  - [x] **Automated Collision Audit Suite**:
    - Created `tests/shortcuts.test.js` testing 0-collision between `DEFAULT_KEY_MAP` and all system hotkeys.
    - All 24/24 unit tests passing cleanly (`node --test tests/*.test.js`).

- [x] **Phase 9: Retro CRT TV Chassis & Dead-Centered Fullscreen Experience**
  - [x] **Centered Layout Resolution**:
    - Eliminated top alignment by wrapping canvas in dedicated `#tv-stage` with `display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh;`.
    - Set `.crt-tv-chassis` with `margin: auto;` ensuring 100% horizontal and vertical centering on all monitors and aspect ratios.
  - [x] **Authentic 1970s/80s CRT TV Enclosure (`.crt-tv-chassis`)**:
    - Molded vintage cabinet with beveled depth, rounded corners (`border-radius: 28px`), and ambient drop shadow.
    - Top cabinet ridge with 10 horizontal ventilation slots (`.tv-vents-group`).
    - Curved tube housing with deep inner bezel bevel and authentic cathode-ray curvature.
    - Curved glass reflections (`.crt-glass-reflection`) and glass corner vignette (`.crt-glass-vignette`).
    - Active CRT scanlines overlay (`#crt-overlay`) automatically displayed across the tube.
  - [x] **Vintage Right Control Deck (`.tv-control-panel`)**:
    - Metallic gold/brass badge plate: `★ RETRO-VISION ★ MODEL CT-1977`.
    - Horizontal speaker grille slats with 3D recessed shadows.
    - Dual knurled rotary knobs for VHF channel selector and UHF/Volume with position notches.
    - Glowing jeweled Power LED indicator with subtle phosphor pulse animation.
    - Tactile `POWER / ESC` switch button that exits fullscreen on click.
    - Floating escape toast hint: `📺 CRT RetroVision • Press ESC or F11 to exit fullscreen`.
  - [x] **Dual Fullscreen Engine (Native + CSS Fallback)**:
    - Updated `toggleFullscreen()` in `js/ui.js` with Promise-based native `requestFullscreen()` and automatic CSS `.fullscreen-tv-active` fallback.
    - Bound `fullscreenchange` event and added <kbd>Escape</kbd> dismissal in keydown handler.

- [x] **Phase 10: Instruction Step-Back, Floating Tooltips Engine, Inspector Polish & Documentation**
  - [x] **Instruction-Level Step Back (`F8` / `Shift+F10`)**:
    - Implemented `instructionHistory` snapshot stack in `js/time-travel.js` capturing pre-instruction VM state.
    - Added `stepBackInstruction()` in `js/app.js` and wired to `#btn-step-back` with <kbd>F8</kbd> shortcut badge.
    - Synchronized disassembler, live registers, trace history, and RAM heatmap upon stepping backward.
  - [x] **Rewind Protection While Paused**:
    - Disallowed continuous rewind if VM is paused (`if (!this.isRunning) return;`).
    - Added visual disabled state (`.btn-rewind.disabled-paused`) and dynamic bilingual tooltip: `"No se puede rebobinar mientras el juego está pausado"`.
  - [x] **Smart Floating Tooltip Engine (Zero-Clipping)**:
    - Replaced CSS pseudo-element `[data-tooltip]::after` with a dynamic floating tooltip overlay appended to `document.body` (`#smart-floating-tooltip`).
    - Added viewport boundary clamping (`Math.max(8, Math.min(x, window.innerWidth - width - 8))`) so tooltips are never cut off by the right or left screen edges.
    - Added vertical auto-flipping: when an element is near the top edge (< 36px), tooltips automatically render below the element instead of above.
    - Immune to container `overflow: hidden` and stacking context clipping.
  - [x] **Inspector Tabs & Layout Padding Polish**:
    - Enhanced `.panel-tabs` with `overflow-x: auto` and `white-space: nowrap` so long titles like *"Registros & Pila"* and *"Visor de Sprites"* never clip or truncate.
    - Increased tab button padding (`4px 10px`) and font size (`11px`).
    - Added generous margin and visual divider between tabs and `#btn-clear-console` (`.panel-header-actions`).
    - Expanded padding and grid spacing in `.inspector-body`, `.registers-layout`, `.special-registers`, and `.sprite-and-audio-grid`.
  - [x] **Comprehensive Repository Documentation**:
    - Created detailed [README.md](file:///Users/jgestal/Desktop/chip8-emulator/README.md) with architecture overview, feature list, controls cheatsheet, and getting started instructions.
    - Included automated test suite validation (24/24 tests passing).

- [x] **Phase 11: Inspector Tab Navigation Bar & Trace Log Auto-scroll Freeze Fix**
  - [x] **Inspector Tab Navigation Bar (`‹` / `›` & Dropdown Selector)**:
    - Added previous (`‹`) and next (`›`) tab navigation buttons (`#btn-tab-prev`, `#btn-tab-next`) enabling immediate one-click cycling through all 7 tools with auto-centering.
    - Added tab count indicator (`1/7 ▾`) with quick floating dropdown menu (`#tabs-menu-dropdown`) showing all 7 tools with numbers, localized titles, and active checkmarks for instant jumping.
    - Integrated left/right gradient overflow shadows (`.panel-tabs-scroll-area::before` & `::after`) providing clear visual feedback that more options exist off-screen.
    - Added mouse wheel horizontal scrolling support on the tab strip.
    - Automated `scrollIntoView({ behavior: 'smooth', inline: 'center' })` on tab activation.
  - [x] **Trace Log Auto-scroll Freeze Bug Fix**:
    - Identified root cause: When "Auto-scroll" was unchecked during fast continuous execution (500–700 Hz), DOM elements kept appending and top elements were pruned via `removeChild(firstChild)` every 200 items, shifting the scroll offset and dragging the view to the bottom.
    - Solution: When `chkTraceAutoscroll.checked` is false, DOM appending is frozen during continuous execution, preserving the exact scroll position and lines the user is inspecting.
    - Re-checking "Auto-scroll" immediately flushes the latest memory buffer (`this.traceHistory`) and scrolls smoothly to the bottom.

- [x] **Phase 12: GitHub Publishing Plan Execution & Bilingual Release Suite**
  - [x] **Git Repository Hygiene & Initialization**:
    - Created standard `.gitignore` covering macOS (`.DS_Store`), temporary files, logs, and IDE caches.
    - Created official open source `LICENSE` (MIT License) under the name `jgestal` (2026).
    - Initialized Git repository on `main` branch and linked remote origin `https://github.com/jgestal/CHIP-8-Studio-Debugger.git`.
    - Executed initial commit with Conventional Commits: `feat: initial release of CHIP-8 Studio & Debugger Workstation`.
  - [x] **Visual Asset Generation (Screenshots in `docs/assets/`)**:
    - Automated high-resolution screenshots using headless Chrome across 5 key views:
      - `docs/assets/01-workstation-overview.png`: Complete workstation layout with monitor, telemetry controls, 4x4 keypad, and disassembler.
      - `docs/assets/02-crt-tv-fullscreen.png`: Vintage 1970s CRT television chassis with scanlines, phosphor glow, and rotary knobs.
      - `docs/assets/03-inspector-tabs-nav.png`: Inspector tabs navigation bar with arrow buttons and dropdown indicator.
      - `docs/assets/04-disassembler-explainer.png`: Terminal green theme with live didactic opcode explainer and register diff tags.
      - `docs/assets/05-themes-showcase.png`: NES classic theme showcasing color palette tokens.
  - [x] **Bilingual Documentation Suite**:
    - Created primary `README.md` (English) with language switcher, embedded showcase screenshots, badges, controls cheatsheet, and quickstart.
    - Created secondary `README.es.md` (Español) with full Spanish technical documentation.
    - Created `CONTRIBUTING.md` with guidelines for community contributions, new ROM submissions, and bug reports.
    - Verified all 24/24 unit test suites passing cleanly.

- [x] **Phase 13: Multi-Theme Real Screenshot Suite & Remote Repository Synchronization**
  - [x] Fixed theme query parameter initialization bug in `js/app.js` (`#select-theme`).
  - [x] Captured 6 real high-definition theme screenshots in `docs/assets/`:
    - `theme-terminal.png` (Terminal Green VT220 Phosphor)
    - `theme-gameboy.png` (Game Boy DMG-01)
    - `theme-nes.png` (NES Classic 1983)
    - `theme-snes.png` (SNES Super Famicom)
    - `theme-cyberpunk.png` (Cyberpunk Synthwave)
    - `theme-massung.png` (Jeffrey Massung Slate)
  - [x] Integrated 2-column visual theme comparison matrix in both `README.md` and `README.es.md`.
  - [x] Synchronized codebase and media assets with remote repository `https://github.com/jgestal/CHIP-8-Studio-Debugger.git`.
