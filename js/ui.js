/**
 * ============================================================================
 * CHIP-8 STUDIO - UI ORCHESTRATOR & DASHBOARD
 * ============================================================================
 * Clean Architecture UI Controller with decoupled themes, icon-driven
 * playback bar, dedicated 4x4 keypad with dual legends, and bilingual support.
 */

import { t, getLanguage, setLanguage } from './i18n.js';
import { toHex, disassemble, disassembleRange } from './disassembler.js';
import { Display } from './display.js';

export class UI {
  constructor(app) {
    this.app = app;
    this.chip8 = app.chip8;
    this.timeTravel = app.timeTravel;
    this.heatmap = app.heatmap;
    this.display = app.display;
    this.themeManager = app.themeManager;

    // Cache de elementos DOM principales
    this.dom = {
      // Barra superior
      romSelector: document.getElementById('rom-selector'),
      fileInput: document.getElementById('file-input'),
      btnOpenLocal: document.getElementById('btn-open-local'),
      selectTheme: document.getElementById('select-theme'),
      btnCrt: document.getElementById('btn-crt'),
      btnSaveModal: document.getElementById('btn-save-modal'),
      btnLang: document.getElementById('btn-lang'),

      // Monitor de pantalla & telemetría
      gameCanvas: document.getElementById('game-canvas'),
      canvasContainer: document.getElementById('canvas-container'),
      tvStage: document.getElementById('tv-stage'),
      btnTvPowerExit: document.getElementById('btn-tv-power-exit'),
      crtOverlay: document.getElementById('crt-overlay'),
      fpsDisplay: document.getElementById('fps-display'),
      statusBadge: document.getElementById('status-badge'),

      // Dashboard de controles (bajo el canvas)
      btnPlayPause: document.getElementById('btn-play-pause'),
      iconPlayPause: document.getElementById('icon-play-pause'),
      btnStepBack: document.getElementById('btn-step-back'),
      btnStep: document.getElementById('btn-step'),
      btnStepFrame: document.getElementById('btn-step-frame'),
      btnReset: document.getElementById('btn-reset'),
      btnRewind: document.getElementById('btn-rewind'),
      sliderSpeed: document.getElementById('slider-speed'),
      speedValue: document.getElementById('speed-value'),
      btnAudioToggle: document.getElementById('btn-audio-toggle'),
      audioIconSlot: document.getElementById('audio-icon-slot'),
      btnScreenshot: document.getElementById('btn-screenshot'),
      btnFullscreen: document.getElementById('btn-fullscreen'),

      // Teclado 4x4 dedicado
      virtualKeypad: document.getElementById('virtual-keypad'),

      // Desensamblador y explicador
      disasmList: document.getElementById('disasm-list'),
      explainerText: document.getElementById('explainer-text'),
      explainerMnemonic: document.getElementById('explainer-mnemonic'),
      explainerOperands: document.getElementById('explainer-operands'),
      regDiffTags: document.getElementById('reg-diff-tags'),

      // Inspector / Hardware / Pestañas
      registersGrid: document.getElementById('registers-grid'),
      regI: document.getElementById('reg-i'),
      regPC: document.getElementById('reg-pc'),
      regSP: document.getElementById('reg-sp'),
      regDT: document.getElementById('reg-dt'),
      regST: document.getElementById('reg-st'),
      stackView: document.getElementById('stack-view'),
      ttyConsole: document.getElementById('tty-console'),
      btnClearConsole: document.getElementById('btn-clear-console'),
      romCatalogList: document.getElementById('rom-catalog-list'),
      romCategoryFilter: document.getElementById('rom-category-filter'),
      romSearchInput: document.getElementById('rom-search-input'),
      memoryCanvas: document.getElementById('memory-canvas'),
      memoryTooltip: document.getElementById('memory-tooltip'),
      spriteCanvas: document.getElementById('sprite-canvas'),
      spriteAddrLabel: document.getElementById('sprite-addr-label'),
      audioOscCanvas: document.getElementById('audio-osc-canvas'),

      // Pestañas del Inspector (Navegación horizontal, flechas y menú)
      btnTabPrev: document.getElementById('btn-tab-prev'),
      btnTabNext: document.getElementById('btn-tab-next'),
      panelTabsScrollArea: document.getElementById('panel-tabs-scroll-area'),
      inspectorTabs: document.getElementById('inspector-tabs'),
      btnTabsMenu: document.getElementById('btn-tabs-menu'),
      tabMenuCounter: document.getElementById('tab-menu-counter'),
      tabsMenuDropdown: document.getElementById('tabs-menu-dropdown'),

      // Historial de Ejecución (Trace Log)
      traceCount: document.getElementById('trace-count'),
      chkTraceAutoscroll: document.getElementById('chk-trace-autoscroll'),
      btnClearTrace: document.getElementById('btn-clear-trace'),
      traceLogList: document.getElementById('trace-log-list'),

      // Ficha Técnica de la ROM activa (ROM Info)
      infoTitle: document.getElementById('info-title'),
      infoMeta: document.getElementById('info-meta'),
      infoAuthor: document.getElementById('info-author'),
      infoYear: document.getElementById('info-year'),
      infoSize: document.getElementById('info-size'),
      infoCat: document.getElementById('info-cat'),
      infoControls: document.getElementById('info-controls'),
      infoDesc: document.getElementById('info-desc'),

      // Resizers de paneles
      resizerCol: document.getElementById('resizer-col'),
      resizerLeftRow: document.getElementById('resizer-left-row'),
      resizerRightRow: document.getElementById('resizer-right-row'),

      // Modal de Save States
      saveModal: document.getElementById('save-modal'),
      btnCloseSaveModal: document.getElementById('btn-close-save-modal'),
      saveSlotsContainer: document.getElementById('save-slots-container'),
      btnExportJson: document.getElementById('btn-export-json'),
      btnImportJson: document.getElementById('btn-import-json'),
      jsonFileInput: document.getElementById('json-file-input'),

      // Modal de Atajos y Controles
      shortcutsModal: document.getElementById('shortcuts-modal'),
      btnCloseShortcutsModal: document.getElementById('btn-close-shortcuts-modal'),
      btnShortcutsModal: document.getElementById('btn-shortcuts-modal'),

      appContainer: document.getElementById('app-container')
    };

    // Estado interno
    this.prevV = new Uint8Array(16);
    this.traceHistory = [];
    this.totalInstructionsCount = 0;

    this.initEventListeners();
    this.initResizers();
    this.initPanelCollapsing();
    this.initSmartTooltips();
    this.initTabsNavigation();
    this.buildRegisterElements();
    this.buildDedicatedKeypad();
    this.updateLanguageTexts();
  }

  /**
   * Conecta los listeners de eventos de la interfaz
   */
  initEventListeners() {
    // 1. Controles de transporte
    this.dom.btnPlayPause.addEventListener('click', () => this.app.togglePlayPause());
    if (this.dom.btnStepBack) {
      this.dom.btnStepBack.addEventListener('click', () => this.app.stepBackInstruction());
    }
    this.dom.btnStep.addEventListener('click', () => this.app.stepSingleInstruction());
    this.dom.btnStepFrame.addEventListener('click', () => this.app.stepFrame());
    this.dom.btnReset.addEventListener('click', () => this.app.reset());

    // 2. Control de Rebobinado en tiempo real (solo permitido en ejecución)
    const startRewind = () => {
      if (!this.app.isRunning) return;
      this.dom.btnRewind.classList.add('active');
      this.app.startRewind();
    };
    const stopRewind = () => {
      this.dom.btnRewind.classList.remove('active');
      this.app.stopRewind();
    };

    this.dom.btnRewind.addEventListener('mousedown', startRewind);
    this.dom.btnRewind.addEventListener('mouseup', stopRewind);
    this.dom.btnRewind.addEventListener('mouseleave', stopRewind);
    this.dom.btnRewind.addEventListener('touchstart', (e) => { e.preventDefault(); startRewind(); });
    this.dom.btnRewind.addEventListener('touchend', stopRewind);

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Escape: Salir de Fullscreen TV si está activo, cerrar modales, o pausar emulación
      if (e.key === 'Escape') {
        const stage = this.dom.tvStage || document.getElementById('tv-stage');
        if (stage && (stage.classList.contains('fullscreen-tv-active') || document.fullscreenElement)) {
          this.toggleFullscreen();
          return;
        }
        if (this.dom.saveModal && this.dom.saveModal.classList.contains('visible')) {
          this.closeSaveModal();
          return;
        }
        if (this.dom.shortcutsModal && this.dom.shortcutsModal.classList.contains('visible')) {
          this.closeShortcutsModal();
          return;
        }
        e.preventDefault();
        this.app.togglePlayPause();
        return;
      }

      // Rebobinado en vivo: Backspace o Tab (solo si la emulación está en ejecución)
      if (e.key === 'Backspace' || e.key === 'Tab') {
        e.preventDefault();
        if (this.app.isRunning && !e.repeat) startRewind();
      }
      // Play / Pause: Tecla 'P' (libera Barra Espaciadora / 0x5 para disparo/acción)
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.app.togglePlayPause();
      }
      // Depurador: Retroceder una instrucción (Paso atrás): F8 o Shift + F10
      else if (e.key === 'F8' || (e.key === 'F10' && e.shiftKey)) {
        e.preventDefault();
        this.app.stepBackInstruction();
      }
      // Depurador: Paso a paso por instrucción única: F10
      else if (e.key === 'F10') {
        e.preventDefault();
        this.app.stepSingleInstruction();
      }
      // Depurador: Avanzar fotograma (1/60s): F9 (libera F11 para pantalla completa estándar)
      else if (e.key === 'F9') {
        e.preventDefault();
        this.app.stepFrame();
      }
      // Pantalla Completa: F11, Alt+Enter o Alt+F (libera tecla 'F' solitaria / 0xE para el juego)
      else if (e.key === 'F11' || (e.altKey && (e.key === 'Enter' || e.key === 'f' || e.key === 'F'))) {
        e.preventDefault();
        this.toggleFullscreen();
      }
      // Captura de pantalla (PNG): F12 o Alt+S (libera tecla 'S' solitaria / 0x8 para el juego)
      else if (e.key === 'F12' || (e.altKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        this.captureScreenshot();
      }
      // Guardado rápido ranura 1: F1
      else if (e.key === 'F1') {
        e.preventDefault();
        this.timeTravel.saveToSlot(1, this.dom.gameCanvas, this.app.currentRomName);
        this.log(t('slot') + ' 1 ' + t('saveToSlot').toLowerCase(), 'success');
      }
      // Carga rápida ranura 1: F5
      else if (e.key === 'F5') {
        e.preventDefault();
        this.timeTravel.loadFromSlot(1);
        this.log(t('slot') + ' 1 ' + t('loadFromSlot').toLowerCase(), 'info');
      }
      // Ver mapa interactivo de atajos y controles: '?' o Shift + '/'
      else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        this.toggleShortcutsModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Backspace' || e.key === 'Tab') {
        e.preventDefault();
        stopRewind();
      }
    });

    // 3. Control de Velocidad CPU
    this.dom.sliderSpeed.addEventListener('input', (e) => {
      const hz = parseInt(e.target.value, 10);
      this.app.setSpeed(hz);
      this.dom.speedValue.textContent = `${hz} Hz`;
    });

    // 4. Mute / Unmute Audio Beeper
    this.dom.btnAudioToggle.addEventListener('click', () => {
      const isMuted = this.app.audio.toggleMute();
      this.updateAudioIcon(isMuted);
    });

    // 5. Captura de Pantalla PNG
    if (this.dom.btnScreenshot) {
      this.dom.btnScreenshot.addEventListener('click', () => this.captureScreenshot());
    }

    // 6. Fullscreen Toggle (Retro CRT TV Mode)
    this.dom.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    if (this.dom.btnTvPowerExit) {
      this.dom.btnTvPowerExit.addEventListener('click', () => this.toggleFullscreen());
    }

    document.addEventListener('fullscreenchange', () => {
      const isFs = Boolean(document.fullscreenElement);
      const stage = this.dom.tvStage || document.getElementById('tv-stage');
      if (stage) {
        stage.classList.toggle('fullscreen-tv-active', isFs);
      }
      document.body.classList.toggle('fullscreen-mode-active', isFs);
    });

    // 7. Selector de Temas Desacoplado (ThemeManager)
    this.dom.selectTheme.value = this.themeManager.currentThemeId;
    this.dom.selectTheme.addEventListener('change', (e) => {
      this.themeManager.applyTheme(e.target.value);
      this.display.setTheme(e.target.value);
      this.chip8.drawFlag = true;
      this.log(`Theme applied: ${this.themeManager.getCurrentTheme().name}`, 'info');
    });

    // 8. Filtro CRT Scanlines
    this.dom.btnCrt.addEventListener('click', () => {
      const active = this.display.toggleCrt();
      this.dom.crtOverlay.classList.toggle('active', active);
      this.dom.btnCrt.classList.toggle('active', active);
    });
    this.dom.crtOverlay.classList.toggle('active', this.display.crtEnabled);
    this.dom.btnCrt.classList.toggle('active', this.display.crtEnabled);

    // 9. Selector de Idioma (Bilingual EN / ES)
    this.dom.btnLang.addEventListener('click', () => {
      const nextLang = getLanguage() === 'en' ? 'es' : 'en';
      setLanguage(nextLang);
    });

    window.addEventListener('chip8-language-changed', () => {
      this.updateLanguageTexts();
      this.updateDisassembly();
    });

    // 10. Carga de archivos y ROMs
    this.dom.btnOpenLocal.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.app.loadLocalRomFile(e.target.files[0]);
      }
    });

    this.dom.romSelector.addEventListener('change', (e) => {
      const selectedFile = e.target.value;
      if (selectedFile) {
        this.app.loadRomFromPath(selectedFile);
      }
    });

    this.dom.btnClearConsole.addEventListener('click', () => {
      this.dom.ttyConsole.innerHTML = '';
    });

    if (this.dom.btnClearTrace) {
      this.dom.btnClearTrace.addEventListener('click', () => this.clearTraceHistory());
    }

    // 11. Drag & Drop de ROMs
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.ch8') || file.name.endsWith('.rom')) {
          this.app.loadLocalRomFile(file);
        } else {
          this.log(`Ignored file: "${file.name}". Expected .ch8 file.`, 'warn');
        }
      }
    });

    // 12. Modal de Save States
    this.dom.btnSaveModal.addEventListener('click', () => this.openSaveModal());
    this.dom.btnCloseSaveModal.addEventListener('click', () => this.closeSaveModal());
    if (this.dom.saveModal) {
      this.dom.saveModal.addEventListener('click', (e) => {
        if (e.target === this.dom.saveModal) this.closeSaveModal();
      });
    }
    this.dom.btnExportJson.addEventListener('click', () => {
      this.timeTravel.exportJson(this.app.currentRomName);
    });
    this.dom.btnImportJson.addEventListener('click', () => this.dom.jsonFileInput.click());
    this.dom.jsonFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.timeTravel.importJson(e.target.files[0], (success, msg) => {
          if (success) {
            this.log(`State imported successfully (${msg})`, 'success');
            this.closeSaveModal();
          } else {
            this.log(`Error importing state JSON: ${msg}`, 'error');
          }
        });
      }
    });

    // 12b. Modal de Atajos y Controles
    if (this.dom.btnShortcutsModal) {
      this.dom.btnShortcutsModal.addEventListener('click', () => this.openShortcutsModal());
    }
    if (this.dom.btnCloseShortcutsModal) {
      this.dom.btnCloseShortcutsModal.addEventListener('click', () => this.closeShortcutsModal());
    }
    if (this.dom.shortcutsModal) {
      this.dom.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.dom.shortcutsModal) this.closeShortcutsModal();
      });
    }

    // 13. Pestañas en el deck inferior derecho
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        const container = e.currentTarget.closest('.panel');
        if (container) {
          container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          e.currentTarget.classList.add('active');
          const targetContent = document.getElementById(targetTab);
          if (targetContent) targetContent.classList.add('active');

          // Auto-centrar la pestaña en el strip para que nunca quede oculta
          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          if (this.updateTabsNavState) {
            setTimeout(() => this.updateTabsNavState(), 120);
          }

          if (targetTab === 'tab-content-history') {
            const isAutoscrollOn = this.dom.chkTraceAutoscroll ? this.dom.chkTraceAutoscroll.checked : true;
            if (isAutoscrollOn) {
              this.renderTraceHistory();
            }
          }
        }
      });
    });

    // Control de reactivación de Auto-scroll en Historial de Ejecución
    if (this.dom.chkTraceAutoscroll) {
      this.dom.chkTraceAutoscroll.addEventListener('change', () => {
        if (this.dom.chkTraceAutoscroll.checked) {
          this.renderTraceHistory();
          if (this.dom.traceLogList) {
            this.dom.traceLogList.scrollTop = this.dom.traceLogList.scrollHeight;
          }
        }
      });
    }

    // 14. Inspección interactiva del heatmap
    this.dom.memoryCanvas.addEventListener('mousemove', (e) => {
      const info = this.heatmap.inspectAddress(this.dom.memoryCanvas, e.clientX, e.clientY);
      this.dom.memoryTooltip.innerHTML = `<strong>${info.addressHex}</strong>: ${info.byteHex} (${info.byte}) &bull; ${info.role}`;
    });
  }

  /**
   * Alterna el modo Pantalla Completa (Experiencia TV CRT centrada)
   */
  toggleFullscreen() {
    const stage = this.dom.tvStage || document.getElementById('tv-stage') || this.dom.canvasContainer;
    const isNativeFs = Boolean(document.fullscreenElement);
    const isCssFs = stage.classList.contains('fullscreen-tv-active');

    if (!isNativeFs && !isCssFs) {
      // Entrar en modo Fullscreen TV
      if (stage.requestFullscreen) {
        stage.requestFullscreen().then(() => {
          stage.classList.add('fullscreen-tv-active');
          document.body.classList.add('fullscreen-mode-active');
        }).catch(() => {
          // Fallback visual en caso de bloqueo de API en iframe o sandbox
          stage.classList.add('fullscreen-tv-active');
          document.body.classList.add('fullscreen-mode-active');
        });
      } else {
        stage.classList.add('fullscreen-tv-active');
        document.body.classList.add('fullscreen-mode-active');
      }
    } else {
      // Salir de modo Fullscreen TV
      if (isNativeFs && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      stage.classList.remove('fullscreen-tv-active');
      document.body.classList.remove('fullscreen-mode-active');
    }
  }

  /**
   * Actualiza el icono de audio (mute / unmute)
   */
  updateAudioIcon(isMuted) {
    if (isMuted) {
      this.dom.audioIconSlot.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    } else {
      this.dom.audioIconSlot.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    }
  }

  /**
   * Actualiza el icono de Play / Pause
   */
  updatePlayPauseIcon(isPlaying) {
    if (isPlaying) {
      this.dom.btnPlayPause.classList.add('btn-playing');
      this.dom.iconPlayPause.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    } else {
      this.dom.btnPlayPause.classList.remove('btn-playing');
      this.dom.iconPlayPause.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }
  }

  /**
   * Captura una instantánea PNG nítida de la pantalla a escala 10x
   */
  captureScreenshot() {
    const romName = (this.app.currentRomName || 'chip8').replace(/\.[^/.]+$/, '');
    const filename = `${romName}-${Date.now()}.png`;
    this.display.downloadScreenshot(10, filename);
    this.log(`Captura de pantalla guardada: ${filename}`, 'success');
  }

  /**
   * Inicializa el sistema de redimensionado interactivo de paneles (Splitters / Gutters)
   */
  initResizers() {
    // Restaurar dimensiones guardadas en localStorage
    try {
      const savedLeftWidth = localStorage.getItem('chip8_left_deck_width');
      if (savedLeftWidth) {
        document.documentElement.style.setProperty('--left-deck-width', savedLeftWidth);
      }
      const savedKeypadHeight = localStorage.getItem('chip8_keypad_height');
      if (savedKeypadHeight) {
        document.documentElement.style.setProperty('--keypad-height', savedKeypadHeight);
      }
      const savedInspectorHeight = localStorage.getItem('chip8_inspector_height');
      if (savedInspectorHeight) {
        document.documentElement.style.setProperty('--inspector-height', savedInspectorHeight);
      }
    } catch (_) {}

    // 1. Resizer de Columnas (Deck Izquierdo vs Deck Derecho)
    if (this.dom.resizerCol) {
      let isDraggingCol = false;
      this.dom.resizerCol.addEventListener('pointerdown', (e) => {
        isDraggingCol = true;
        this.dom.resizerCol.classList.add('resizing');
        this.dom.resizerCol.setPointerCapture(e.pointerId);
        document.body.style.cursor = 'col-resize';
      });

      this.dom.resizerCol.addEventListener('pointermove', (e) => {
        if (!isDraggingCol) return;
        const containerRect = this.dom.appContainer.getBoundingClientRect();
        const rawPct = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const clampedPct = Math.min(Math.max(rawPct, 28), 72);
        const pctStr = `${clampedPct.toFixed(1)}%`;
        document.documentElement.style.setProperty('--left-deck-width', pctStr);
        try { localStorage.setItem('chip8_left_deck_width', pctStr); } catch (_) {}
      });

      const stopColDrag = (e) => {
        if (isDraggingCol) {
          isDraggingCol = false;
          this.dom.resizerCol.classList.remove('resizing');
          try { this.dom.resizerCol.releasePointerCapture(e.pointerId); } catch (_) {}
          document.body.style.cursor = '';
        }
      };
      this.dom.resizerCol.addEventListener('pointerup', stopColDrag);
      this.dom.resizerCol.addEventListener('pointercancel', stopColDrag);
    }

    // 2. Resizer Fila Izquierda (Pantalla vs Teclado)
    if (this.dom.resizerLeftRow) {
      let isDraggingRow = false;
      this.dom.resizerLeftRow.addEventListener('pointerdown', (e) => {
        isDraggingRow = true;
        this.dom.resizerLeftRow.classList.add('resizing');
        this.dom.resizerLeftRow.setPointerCapture(e.pointerId);
        document.body.style.cursor = 'row-resize';
      });

      this.dom.resizerLeftRow.addEventListener('pointermove', (e) => {
        if (!isDraggingRow) return;
        const screenDeck = document.getElementById('screen-deck');
        if (!screenDeck) return;
        const deckRect = screenDeck.getBoundingClientRect();
        const newKeypadHeight = Math.min(Math.max(deckRect.bottom - e.clientY, 50), 300);
        const heightStr = `${Math.round(newKeypadHeight)}px`;
        document.documentElement.style.setProperty('--keypad-height', heightStr);
        try { localStorage.setItem('chip8_keypad_height', heightStr); } catch (_) {}
      });

      const stopRowDrag = (e) => {
        if (isDraggingRow) {
          isDraggingRow = false;
          this.dom.resizerLeftRow.classList.remove('resizing');
          try { this.dom.resizerLeftRow.releasePointerCapture(e.pointerId); } catch (_) {}
          document.body.style.cursor = '';
        }
      };
      this.dom.resizerLeftRow.addEventListener('pointerup', stopRowDrag);
      this.dom.resizerLeftRow.addEventListener('pointercancel', stopRowDrag);
    }

    // 3. Resizer Fila Derecha (Desensamblador vs Inspector)
    if (this.dom.resizerRightRow) {
      let isDraggingRow = false;
      this.dom.resizerRightRow.addEventListener('pointerdown', (e) => {
        isDraggingRow = true;
        this.dom.resizerRightRow.classList.add('resizing');
        this.dom.resizerRightRow.setPointerCapture(e.pointerId);
        document.body.style.cursor = 'row-resize';
      });

      this.dom.resizerRightRow.addEventListener('pointermove', (e) => {
        if (!isDraggingRow) return;
        const debugDeck = document.getElementById('debug-deck');
        if (!debugDeck) return;
        const deckRect = debugDeck.getBoundingClientRect();
        const newInspectorHeight = Math.min(Math.max(deckRect.bottom - e.clientY, 80), deckRect.height - 140);
        const heightStr = `${Math.round(newInspectorHeight)}px`;
        document.documentElement.style.setProperty('--inspector-height', heightStr);
        try { localStorage.setItem('chip8_inspector_height', heightStr); } catch (_) {}
      });

      const stopRowDrag = (e) => {
        if (isDraggingRow) {
          isDraggingRow = false;
          this.dom.resizerRightRow.classList.remove('resizing');
          try { this.dom.resizerRightRow.releasePointerCapture(e.pointerId); } catch (_) {}
          document.body.style.cursor = '';
        }
      };
      this.dom.resizerRightRow.addEventListener('pointerup', stopRowDrag);
      this.dom.resizerRightRow.addEventListener('pointercancel', stopRowDrag);
    }
  }

  /**
   * Inicializa la capacidad de minimizar / expandir paneles
   */
  initPanelCollapsing() {
    document.querySelectorAll('.panel-header-btn.btn-collapse').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-panel');
        const panel = targetId ? document.getElementById(targetId) : btn.closest('.panel');
        if (!panel) return;

        const isNowCollapsed = panel.classList.toggle('is-collapsed');
        btn.textContent = isNowCollapsed ? '+' : '−';
        const tooltipText = isNowCollapsed ? 'Expand panel' : 'Minimize panel';
        btn.setAttribute('title', tooltipText);
        btn.setAttribute('data-tooltip', tooltipText);
      });
    });
  }

  /**
   * Inicializa el motor de tooltips flotantes inteligentes.
   * Evita cualquier corte por los bordes de la ventana (viewport) y desbordamiento (overflow) de paneles.
   */
  initSmartTooltips() {
    let tooltipEl = document.getElementById('smart-floating-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'smart-floating-tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltipEl);
    }

    let activeTarget = null;

    const updatePosition = () => {
      if (!activeTarget || !tooltipEl.classList.contains('visible')) return;
      const rect = activeTarget.getBoundingClientRect();
      const tipRect = tooltipEl.getBoundingClientRect();

      // Centrado horizontal
      let left = rect.left + (rect.width / 2) - (tipRect.width / 2);
      const pad = 8;
      // Clamp para que nunca se corte por izquierda ni derecha del viewport
      left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));

      // Posicionamiento vertical: preferentemente arriba; si no cabe (< 36px de margen superior), ponerlo abajo
      let top = rect.top - tipRect.height - 7;
      if (top < 6) {
        top = rect.bottom + 7;
      }
      // Clamp para no salir por el fondo del viewport
      if (top + tipRect.height > window.innerHeight - pad) {
        top = Math.max(pad, window.innerHeight - tipRect.height - pad);
      }

      tooltipEl.style.left = `${Math.round(left)}px`;
      tooltipEl.style.top = `${Math.round(top)}px`;
    };

    const show = (el) => {
      const text = el.getAttribute('data-tooltip');
      if (!text || !text.trim()) {
        hide();
        return;
      }
      activeTarget = el;
      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');
      updatePosition();
    };

    const hide = () => {
      activeTarget = null;
      tooltipEl.classList.remove('visible');
    };

    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest('[data-tooltip]');
      if (el) {
        show(el);
      }
    }, { passive: true });

    document.addEventListener('pointerout', (e) => {
      if (!activeTarget) return;
      const related = e.relatedTarget;
      if (!related || !related.closest || related.closest('[data-tooltip]') !== activeTarget) {
        hide();
      }
    }, { passive: true });

    document.addEventListener('pointerdown', hide, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    window.addEventListener('resize', updatePosition, { passive: true });
  }

  /**
   * Inicializa la barra de navegación de pestañas del inspector, flechas de avance/retroceso,
   * menú desplegable de herramientas y soporte de rueda del ratón.
   */
  initTabsNavigation() {
    const tabsList = this.dom.inspectorTabs;
    const scrollArea = this.dom.panelTabsScrollArea;
    const btnPrev = this.dom.btnTabPrev;
    const btnNext = this.dom.btnTabNext;
    const btnMenu = this.dom.btnTabsMenu;
    const menuDropdown = this.dom.tabsMenuDropdown;
    const counter = this.dom.tabMenuCounter;

    if (!tabsList || !scrollArea) return;

    const getAllTabs = () => Array.from(tabsList.querySelectorAll('.tab-btn'));

    // Actualiza el estado visual de las flechas (habilitadas/deshabilitadas),
    // los gradientes de desbordamiento (left/right) y el contador (e.g. 1/7)
    const updateNavState = () => {
      const scrollLeft = tabsList.scrollLeft;
      const maxScroll = Math.max(0, tabsList.scrollWidth - tabsList.clientWidth);
      const canScrollLeft = scrollLeft > 2;
      const canScrollRight = scrollLeft < maxScroll - 2;

      scrollArea.classList.toggle('can-scroll-left', canScrollLeft);
      scrollArea.classList.toggle('can-scroll-right', canScrollRight);

      if (btnPrev) btnPrev.disabled = !canScrollLeft;
      if (btnNext) btnNext.disabled = !canScrollRight;

      const tabs = getAllTabs();
      const activeIdx = tabs.findIndex(t => t.classList.contains('active'));
      if (counter) {
        counter.textContent = `${activeIdx >= 0 ? activeIdx + 1 : 1}/${tabs.length}`;
      }
    };

    // Flecha Atrás (‹): Activa la pestaña anterior y la centra
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const tabs = getAllTabs();
        const currentIdx = tabs.findIndex(t => t.classList.contains('active'));
        const targetIdx = currentIdx > 0 ? currentIdx - 1 : tabs.length - 1;
        tabs[targetIdx].click();
      });
    }

    // Flecha Adelante (›): Activa la siguiente pestaña y la centra
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const tabs = getAllTabs();
        const currentIdx = tabs.findIndex(t => t.classList.contains('active'));
        const targetIdx = currentIdx < tabs.length - 1 ? currentIdx + 1 : 0;
        tabs[targetIdx].click();
      });
    }

    // Soporte para scroll horizontal mediante rueda del ratón en la barra de pestañas
    tabsList.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        tabsList.scrollLeft += e.deltaY;
        e.preventDefault();
        updateNavState();
      }
    }, { passive: false });

    tabsList.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState, { passive: true });

    // Construcción del menú desplegable con todas las 7 herramientas
    const buildDropdownMenu = () => {
      if (!menuDropdown) return;
      menuDropdown.innerHTML = '';
      const tabs = getAllTabs();

      tabs.forEach((tabBtn, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `tabs-menu-item ${tabBtn.classList.contains('active') ? 'active' : ''}`;
        
        const label = tabBtn.textContent.trim();
        item.innerHTML = `
          <div class="tabs-menu-item-left">
            <span class="tabs-menu-item-num">${idx + 1}.</span>
            <span>${label}</span>
          </div>
          ${tabBtn.classList.contains('active') ? '<span class="tabs-menu-item-check">✓</span>' : ''}
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          tabBtn.click();
          menuDropdown.classList.remove('is-open');
        });

        menuDropdown.appendChild(item);
      });
    };

    if (btnMenu && menuDropdown) {
      btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuDropdown.classList.toggle('is-open');
        if (isOpen) {
          buildDropdownMenu();
        }
      });

      document.addEventListener('click', (e) => {
        if (!menuDropdown.contains(e.target) && e.target !== btnMenu) {
          menuDropdown.classList.remove('is-open');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuDropdown.classList.contains('is-open')) {
          menuDropdown.classList.remove('is-open');
        }
      });
    }

    // Inicializar estado tras renderizado
    setTimeout(updateNavState, 60);
    this.updateTabsNavState = updateNavState;
  }

  /**
   * Construye los elementos del banco de registros V0-VF
   */
  buildRegisterElements() {
    this.dom.registersGrid.innerHTML = '';
    for (let idx = 0; idx < 16; idx++) {
      const hex = idx.toString(16).toUpperCase();
      const div = document.createElement('div');
      div.className = 'register-cell';
      div.id = `reg-cell-${idx}`;
      div.innerHTML = `<span class="reg-name">V${hex}:</span> <span class="reg-val" id="reg-val-${idx}">#00</span>`;
      this.dom.registersGrid.appendChild(div);
    }
  }

  /**
   * Construye el teclado dedicado 4x4 con doble serigrafía
   */
  buildDedicatedKeypad() {
    // Teclado COSMAC VIP clásico:
    // [1] [2] [3] [C]  ->  PC: [1] [2] [3] [4]
    // [4] [5] [6] [D]  ->  PC: [Q] [W] [E] [R]
    // [7] [8] [9] [E]  ->  PC: [A] [S] [D] [F]
    // [A] [0] [B] [F]  ->  PC: [Z] [X] [C] [V]
    const keypadLayout = [
      { hex: 0x1, label: '1', pc: '1' },
      { hex: 0x2, label: '2', pc: '2' },
      { hex: 0x3, label: '3', pc: '3' },
      { hex: 0xC, label: 'C', pc: '4' },

      { hex: 0x4, label: '4', pc: 'Q' },
      { hex: 0x5, label: '5', pc: 'W' },
      { hex: 0x6, label: '6', pc: 'E' },
      { hex: 0xD, label: 'D', pc: 'R' },

      { hex: 0x7, label: '7', pc: 'A' },
      { hex: 0x8, label: '8', pc: 'S' },
      { hex: 0x9, label: '9', pc: 'D' },
      { hex: 0xE, label: 'E', pc: 'F' },

      { hex: 0xA, label: 'A', pc: 'Z' },
      { hex: 0x0, label: '0', pc: 'X' },
      { hex: 0xB, label: 'B', pc: 'C' },
      { hex: 0xF, label: 'F', pc: 'V' }
    ];

    this.dom.virtualKeypad.innerHTML = '';
    keypadLayout.forEach(k => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'keypad-key-btn';
      btn.id = `hex-key-${k.hex}`;
      btn.innerHTML = `
        <span class="key-center-hex">${k.label}</span>
        <span class="key-corner-pc">${k.pc}</span>
      `;

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.app.keypad.pressKey(k.hex);
      });
      btn.addEventListener('mouseup', () => this.app.keypad.releaseKey(k.hex));
      btn.addEventListener('mouseleave', () => this.app.keypad.releaseKey(k.hex));
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.app.keypad.pressKey(k.hex);
      });
      btn.addEventListener('touchend', () => this.app.keypad.releaseKey(k.hex));

      this.dom.virtualKeypad.appendChild(btn);
    });

    // Callback de iluminación reactiva de teclas
    this.app.keypad.onKeyChange = (hexKey, isPressed) => {
      const btn = document.getElementById(`hex-key-${hexKey}`);
      if (btn) {
        btn.classList.toggle('active', isPressed);
      }
    };
  }

  /**
   * Actualiza los textos de toda la interfaz según el idioma seleccionado
   */
  updateLanguageTexts() {
    const lang = getLanguage();
    this.dom.btnLang.textContent = lang === 'en' ? '🇬🇧 EN' : '🇪🇸 ES';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // Actualizar tooltips dinámicos
    if (this.dom.btnPlayPause) this.dom.btnPlayPause.setAttribute('data-tooltip', t('tooltipPlay'));
    if (this.dom.btnStepBack) this.dom.btnStepBack.setAttribute('data-tooltip', t('tooltipStepBack'));
    if (this.dom.btnStep) this.dom.btnStep.setAttribute('data-tooltip', t('tooltipStep'));
    if (this.dom.btnStepFrame) this.dom.btnStepFrame.setAttribute('data-tooltip', t('tooltipStepFrame'));
    if (this.dom.btnReset) this.dom.btnReset.setAttribute('data-tooltip', t('tooltipReset'));
    if (this.dom.btnRewind) {
      const isRunning = this.app ? this.app.isRunning : false;
      this.dom.btnRewind.setAttribute('data-tooltip', isRunning ? t('tooltipRewind') : t('tooltipRewindPaused'));
    }
    if (this.dom.btnScreenshot) this.dom.btnScreenshot.setAttribute('data-tooltip', t('screenshotTooltip'));
    if (this.dom.btnFullscreen) this.dom.btnFullscreen.setAttribute('data-tooltip', t('tooltipFullscreen'));
    if (this.dom.btnTabPrev) this.dom.btnTabPrev.setAttribute('data-tooltip', t('tooltipTabPrev'));
    if (this.dom.btnTabNext) this.dom.btnTabNext.setAttribute('data-tooltip', t('tooltipTabNext'));
    if (this.dom.btnTabsMenu) this.dom.btnTabsMenu.setAttribute('data-tooltip', t('tooltipTabMenu'));
    if (this.updateTabsNavState) this.updateTabsNavState();
  }

  /**
   * Actualiza el estado visual del botón de rebobinado continuo (habilitado solo en ejecución)
   */
  updateRewindState(isRunning) {
    if (this.dom.btnRewind) {
      this.dom.btnRewind.classList.toggle('disabled-paused', !isRunning);
      this.dom.btnRewind.setAttribute('data-tooltip', isRunning ? t('tooltipRewind') : t('tooltipRewindPaused'));
    }
  }

  /**
   * Deshace el último paso del historial de traza al retroceder una instrucción
   */
  popTraceHistory() {
    if (this.traceHistory.length > 0) {
      this.traceHistory.pop();
      this.totalInstructionsCount = Math.max(0, this.totalInstructionsCount - 1);
      if (this.dom.traceCount) {
        this.dom.traceCount.textContent = `${this.totalInstructionsCount} ${t('instructionsCount')}`;
      }
      this.renderTraceHistory();
    }
  }

  /**
   * Registra un mensaje formateado en la consola TTY
   */
  log(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `tty-line tty-${type}`;

    const timestamp = new Date().toTimeString().split(' ')[0];
    line.innerHTML = `<span class="tty-time">[${timestamp}]</span> ${message}`;

    this.dom.ttyConsole.appendChild(line);
    this.dom.ttyConsole.scrollTop = this.dom.ttyConsole.scrollHeight;
  }

  /**
   * Actualiza el desensamblador y la tarjeta explicativa didáctica
   */
  updateDisassembly(lastExecutedInfo = null) {
    const currentPc = this.chip8.pc;
    const instructions = disassembleRange(this.chip8.memory, Math.max(0x200, currentPc - 10), 24, currentPc, this.chip8);

    this.dom.disasmList.innerHTML = '';
    instructions.forEach(item => {
      const row = document.createElement('div');
      row.className = `disasm-row ${item.isCurrent ? 'current-instruction' : ''}`;
      
      const isBp = this.chip8.breakpoints.has(item.address);
      if (isBp) row.classList.add('breakpoint-hit');

      row.innerHTML = `
        <span class="bp-dot ${isBp ? 'active' : ''}"></span>
        <span class="disasm-addr">${item.addressHex}</span>
        <span class="disasm-opcode">${item.opcodeHex}</span>
        <span class="disasm-mnemonic">${item.mnemonic}</span>
        <span class="disasm-operands">${item.operands}</span>
      `;

      row.addEventListener('click', () => {
        const active = this.chip8.toggleBreakpoint(item.address);
        this.updateDisassembly();
        this.log(`Breakpoint ${active ? 'set' : 'cleared'} @ 0x${item.addressHex}`, active ? 'warn' : 'info');
      });

      this.dom.disasmList.appendChild(row);

      if (item.isCurrent) {
        this.dom.explainerMnemonic.textContent = item.mnemonic;
        this.dom.explainerOperands.textContent = item.operands;
        this.dom.explainerText.textContent = item.explanation;
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });

    if (lastExecutedInfo && lastExecutedInfo.changedRegs) {
      this.dom.regDiffTags.innerHTML = '';
      lastExecutedInfo.changedRegs.forEach(ch => {
        const tag = document.createElement('span');
        tag.className = 'diff-tag';
        tag.textContent = `V${ch.index.toString(16).toUpperCase()}: #${toHex(ch.oldVal)} → #${toHex(ch.newVal)}`;
        this.dom.regDiffTags.appendChild(tag);
      });
      if (lastExecutedInfo.iChanged) {
        const tagI = document.createElement('span');
        tagI.className = 'diff-tag diff-i';
        tagI.textContent = `I: #${toHex(lastExecutedInfo.prevI, 4)} → #${toHex(lastExecutedInfo.newI, 4)}`;
        this.dom.regDiffTags.appendChild(tagI);
      }
    }
  }

  /**
   * Actualiza el banco de hardware en pantalla
   */
  updateHardwarePanels() {
    for (let idx = 0; idx < 16; idx++) {
      const val = this.chip8.v[idx];
      const valEl = document.getElementById(`reg-val-${idx}`);
      const cellEl = document.getElementById(`reg-cell-${idx}`);

      if (valEl) valEl.textContent = `#${toHex(val, 2)}`;

      if (this.prevV[idx] !== val) {
        if (cellEl) {
          cellEl.classList.remove('pulse-changed');
          void cellEl.offsetWidth;
          cellEl.classList.add('pulse-changed');
        }
        this.prevV[idx] = val;
      }
    }

    this.dom.regI.textContent = `#${toHex(this.chip8.i, 4)}`;
    this.dom.regPC.textContent = `#${toHex(this.chip8.pc, 4)}`;
    this.dom.regSP.textContent = `#${toHex(this.chip8.sp, 2)}`;
    this.dom.regDT.textContent = `#${toHex(this.chip8.delayTimer, 2)}`;
    this.dom.regST.textContent = `#${toHex(this.chip8.soundTimer, 2)}`;

    this.dom.stackView.innerHTML = '';
    const sp = this.chip8.sp;
    for (let idx = 0; idx < Math.max(sp, 4); idx++) {
      const div = document.createElement('div');
      div.className = `stack-item ${idx === sp - 1 ? 'stack-top' : ''}`;
      div.textContent = `R${idx}: #${toHex(this.chip8.stack[idx], 4)}`;
      this.dom.stackView.appendChild(div);
    }

    this.dom.spriteAddrLabel.textContent = `I = 0x${toHex(this.chip8.i, 4)}`;
    Display.renderSpritePreview(
      this.dom.spriteCanvas,
      this.chip8.memory,
      this.chip8.i,
      5,
      this.display.palette.on,
      this.display.palette.bg
    );
  }

  /**
   * Actualiza telemetría de rendimiento
   */
  updateTelemetry(fps, cyclesHz, statusText = null) {
    this.dom.fpsDisplay.textContent = `${Math.round(fps)} FPS`;

    if (statusText) {
      this.dom.statusBadge.textContent = statusText;
    } else {
      this.dom.statusBadge.textContent = this.app.isRunning ? t('statusRunning') : t('statusPaused');
    }
  }

  /**
   * Gestión del Modal de Save States
   */
  openSaveModal() {
    this.dom.saveModal.classList.add('visible');
    this.renderSaveSlots();
  }

  closeSaveModal() {
    this.dom.saveModal.classList.remove('visible');
  }

  /**
   * Gestión del Modal de Atajos y Controles
   */
  openShortcutsModal() {
    if (this.dom.shortcutsModal) {
      this.dom.shortcutsModal.classList.add('visible');
    }
  }

  closeShortcutsModal() {
    if (this.dom.shortcutsModal) {
      this.dom.shortcutsModal.classList.remove('visible');
    }
  }

  toggleShortcutsModal() {
    if (this.dom.shortcutsModal) {
      if (this.dom.shortcutsModal.classList.contains('visible')) {
        this.closeShortcutsModal();
      } else {
        this.openShortcutsModal();
      }
    }
  }

  renderSaveSlots() {
    this.dom.saveSlotsContainer.innerHTML = '';
    for (let slot = 1; slot <= 3; slot++) {
      const info = this.timeTravel.getSlotInfo(slot);
      const card = document.createElement('div');
      card.className = 'slot-card';

      card.innerHTML = `
        <div class="slot-header">
          <span>${t('slot')} ${slot}</span>
          <span>${info ? new Date(info.timestamp).toLocaleTimeString() : t('emptySlot')}</span>
        </div>
        <div class="slot-thumb">
          ${info && info.thumbnail ? `<img src="${info.thumbnail}" alt="Slot ${slot}">` : `<div class="empty-thumb">---</div>`}
        </div>
        <div class="slot-actions">
          <button type="button" class="btn-slot-save">${t('saveToSlot')}</button>
          <button type="button" class="btn-slot-load" ${!info ? 'disabled' : ''}>${t('loadFromSlot')}</button>
        </div>
      `;

      card.querySelector('.btn-slot-save').addEventListener('click', () => {
        this.timeTravel.saveToSlot(slot, this.dom.gameCanvas, this.app.currentRomName);
        this.renderSaveSlots();
        this.log(`${t('slot')} ${slot} ${t('saveToSlot').toLowerCase()}`, 'success');
      });

      card.querySelector('.btn-slot-load').addEventListener('click', () => {
        if (this.timeTravel.loadFromSlot(slot)) {
          this.closeSaveModal();
          this.log(`${t('slot')} ${slot} ${t('loadFromSlot').toLowerCase()}`, 'info');
        }
      });

      this.dom.saveSlotsContainer.appendChild(card);
    }
  }

  /**
   * Rellena el catálogo de ROMs
   */
  populateRomCatalog(manifest) {
    this.dom.romSelector.innerHTML = `<option value="">-- ${t('selectRom')} --</option>`;
    this.dom.romCatalogList.innerHTML = '';

    const categories = {
      games: document.createElement('optgroup'),
      demos: document.createElement('optgroup'),
      programs: document.createElement('optgroup'),
      tests: document.createElement('optgroup')
    };

    categories.games.label = t('catGames');
    categories.demos.label = t('catDemos');
    categories.programs.label = t('catPrograms');
    categories.tests.label = t('catTests');

    manifest.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.file;
      opt.textContent = `${item.title} (${item.author})`;
      if (categories[item.category]) categories[item.category].appendChild(opt);

      const card = document.createElement('div');
      card.className = 'rom-card-item';
      card.setAttribute('data-category', item.category);
      card.setAttribute('data-title', item.title.toLowerCase());
      card.innerHTML = `
        <div class="rom-card-title">${item.title}</div>
        <div class="rom-card-meta">${item.author} &bull; ${item.size} bytes &bull; <em>${item.category}</em></div>
      `;
      card.addEventListener('click', () => {
        this.dom.romSelector.value = item.file;
        this.app.loadRomFromPath(item.file);
      });
      this.dom.romCatalogList.appendChild(card);
    });

    Object.values(categories).forEach(grp => {
      if (grp.children.length > 0) this.dom.romSelector.appendChild(grp);
    });

    const filterRoms = () => {
      const filterCat = this.dom.romCategoryFilter.value;
      const search = this.dom.romSearchInput.value.toLowerCase();
      document.querySelectorAll('.rom-card-item').forEach(el => {
        const cat = el.getAttribute('data-category');
        const title = el.getAttribute('data-title');
        const matchesCat = filterCat === 'all' || cat === filterCat;
        const matchesSearch = !search || title.includes(search);
        el.style.display = matchesCat && matchesSearch ? 'block' : 'none';
      });
    };

    this.dom.romCategoryFilter.addEventListener('change', filterRoms);
    this.dom.romSearchInput.addEventListener('input', filterRoms);
  }

  /**
   * Registra una instrucción en el búfer circular de historial de ejecución (Trace Log)
   */
  recordTrace(pc, opcode, details = {}) {
    this.totalInstructionsCount++;
    const disasm = disassemble(opcode, pc, this.chip8);

    // Formatear texto de modificación de registros
    let diffText = '---';
    if (details.changedRegs && details.changedRegs.length > 0) {
      diffText = details.changedRegs.map(c => `V${c.index.toString(16).toUpperCase()}=#${toHex(c.newVal)}`).join(' ');
    } else if (details.iChanged) {
      diffText = `I=#${toHex(details.newI, 4)}`;
    }

    const entry = {
      step: this.totalInstructionsCount,
      pcHex: toHex(pc, 4),
      opHex: toHex(opcode, 4),
      mnemonic: disasm.mnemonic,
      operands: disasm.operands,
      diff: diffText,
      explanation: disasm.explanation
    };

    this.traceHistory.push(entry);
    if (this.traceHistory.length > 200) {
      this.traceHistory.shift();
    }

    if (this.dom.traceCount) {
      this.dom.traceCount.textContent = this.totalInstructionsCount.toLocaleString();
    }

    // Si la pestaña de historial está activa o estamos en paso a paso, volcar al DOM
    const isHistoryTabActive = document.getElementById('tab-content-history')?.classList.contains('active');
    const isAutoscrollOn = this.dom.chkTraceAutoscroll ? this.dom.chkTraceAutoscroll.checked : true;

    // Si el autoscroll está deshabilitado mientras se ejecuta continuamente, congelamos el DOM
    // para que el usuario pueda examinar tranquilamente las instrucciones sin saltos ni desbordamientos.
    if ((isHistoryTabActive && isAutoscrollOn) || !this.app.isRunning) {
      this.appendTraceRow(entry);
    }
  }

  /**
   * Añade una fila al listado DOM del Historial de Ejecución
   */
  appendTraceRow(entry) {
    if (!this.dom.traceLogList) return;
    const isAutoscrollOn = this.dom.chkTraceAutoscroll ? this.dom.chkTraceAutoscroll.checked : true;

    const row = document.createElement('div');
    row.className = 'trace-row';
    row.innerHTML = `
      <span class="trace-step">#${entry.step}</span>
      <span class="trace-pc">0x${entry.pcHex}</span>
      <span class="trace-op">${entry.opHex}</span>
      <span class="trace-asm">${entry.mnemonic} ${entry.operands}</span>
      <span class="trace-diff">${entry.diff}</span>
    `;
    this.dom.traceLogList.appendChild(row);

    // Limitar filas activas en el DOM a 200 solo si el autoscroll está activo.
    // Si está inactivo, no eliminamos hijos por arriba para que la posición de scroll del usuario no se altere.
    if (isAutoscrollOn) {
      while (this.dom.traceLogList.children.length > 200) {
        this.dom.traceLogList.removeChild(this.dom.traceLogList.firstChild);
      }
      this.dom.traceLogList.scrollTop = this.dom.traceLogList.scrollHeight;
    }
  }

  /**
   * Renderiza el historial completo acumulado en la vista
   */
  renderTraceHistory() {
    if (!this.dom.traceLogList) return;
    this.dom.traceLogList.innerHTML = '';
    this.traceHistory.forEach(entry => this.appendTraceRow(entry));
  }

  /**
   * Limpia el registro de traza de ejecución
   */
  clearTraceHistory() {
    this.traceHistory = [];
    if (this.dom.traceLogList) this.dom.traceLogList.innerHTML = '';
    this.log('Historial de traza de ejecución limpiado.', 'info');
  }

  /**
   * Actualiza la Ficha Técnica de la ROM activa (Tab ROM Info)
   */
  updateRomInfoCard(meta) {
    if (!meta) return;
    if (this.dom.infoTitle) this.dom.infoTitle.textContent = meta.title || meta.name || 'CHIP-8 ROM';
    if (this.dom.infoMeta) {
      this.dom.infoMeta.textContent = `${meta.category || 'Game'} • ${meta.size ? meta.size + ' bytes' : 'Binary'}`;
    }
    if (this.dom.infoAuthor) this.dom.infoAuthor.textContent = meta.author || 'Unknown';
    if (this.dom.infoYear) this.dom.infoYear.textContent = meta.year || 'Retro Classic';
    if (this.dom.infoSize) this.dom.infoSize.textContent = meta.size ? `${meta.size} bytes` : '---';
    if (this.dom.infoCat) this.dom.infoCat.textContent = meta.category || 'Program';
    if (this.dom.infoControls) {
      this.dom.infoControls.textContent = meta.controls || 'Hex Keypad: 1-4, Q-R, A-F, Z-V';
    }
    if (this.dom.infoDesc) {
      this.dom.infoDesc.textContent = meta.description || 'No description available for this ROM.';
    }
  }
}
