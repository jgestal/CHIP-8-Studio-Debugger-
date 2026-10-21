/**
 * ============================================================================
 * CHIP-8 STUDIO - MAIN APPLICATION CONTROLLER
 * ============================================================================
 * Bucle de animación (requestAnimationFrame), temporización precisa a 60 Hz,
 * orquestación del núcleo, audio, telemetría y gestor de arranque.
 */

import { Chip8 } from './chip8.js';
import { Display } from './display.js';
import { RetroAudio } from './audio.js';
import { Keypad } from './keypad.js';
import { MemoryHeatmap } from './memory-heatmap.js';
import { TimeTravel } from './time-travel.js';
import { ThemeManager } from './themes.js';
import { UI } from './ui.js';
import { t } from './i18n.js';

export class App {
  constructor() {
    // 1. Instanciar gestor de temas desacoplado
    this.themeManager = new ThemeManager();

    // 2. Instanciar núcleo del CHIP-8
    this.chip8 = new Chip8({
      shift: false,     // Comportamiento estándar COSMAC VIP
      loadStore: false, // Incrementa I en FX55/FX65
      jump: false,      // Salto BNNN con V0
      clip: true        // Recorte en bordes
    });

    // 3. Subsistemas de hardware
    const canvas = document.getElementById('game-canvas');
    this.display = new Display(canvas);
    this.audio = new RetroAudio();
    this.keypad = new Keypad(this.chip8);
    this.heatmap = new MemoryHeatmap(this.chip8);
    this.timeTravel = new TimeTravel(this.chip8, 1800);

    // 3. Estado de ejecución
    this.isRunning = false;
    this.cpuSpeedHz = 500; // Velocidad estándar recomendada: 500 Hz
    this.timerInterval = 1000 / 60; // 60 Hz exactos = 16.666 ms
    this.lastFrameTime = performance.now();
    this.lastTimerTime = performance.now();
    this.cyclesAccumulator = 0;

    // Métricas de telemetría
    this.fpsCounter = 0;
    this.fpsTimer = performance.now();
    this.currentFps = 60;
    this.currentHz = 0;
    this.cyclesThisSecond = 0;

    // Catálogo de ROMs
    this.romManifest = [];
    this.currentRomName = '';
    this.currentRomMetadata = null;

    // 4. Interfaz de usuario
    this.ui = new UI(this);

    // Inicializar escuchas de breakpoints en el chip8
    this.chip8.onBreakpoint = (pc) => {
      this.pause();
      this.ui.log(`HIT BREAKPOINT @ 0x${pc.toString(16).toUpperCase().padStart(4, '0')}: USER BREAK`, 'warn');
      this.ui.updateDisassembly();
      this.ui.updateHardwarePanels();
    };

    // Hook de traza y registro didáctico de instrucciones ejecutadas
    this.chip8.onOpcode = (pc, opcode, details) => {
      this.ui.recordTrace(pc, opcode, details);
    };

    // Iniciar bucle de renderizado
    this.init();
  }

  /**
   * Arranca la aplicación y carga el manifiesto de ROMs
   */
  async init() {
    this.ui.log("CHIP-8 STUDIO & DEBUGGER INICIALIZADO", 'info');
    this.ui.log("ARQUITECTURA: 4096 BYTES RAM, 16 REGISTROS V0-VF, 64x32 DISPLAY", 'info');

    try {
      const response = await fetch('roms/manifest.json');
      if (response.ok) {
        this.romManifest = await response.json();
        this.ui.populateRomCatalog(this.romManifest);
        this.ui.log(`Catálogo cargado: ${this.romManifest.length} ROMs disponibles`, 'success');

        // Cargar por defecto la primera ROM de prueba o juego clásico (ej: Lander o Logo)
        const defaultRom = this.romManifest.find(r => r.file.includes('Lander') || r.file.includes('logo') || r.file.includes('Pong')) || this.romManifest[0];
        if (defaultRom) {
          await this.loadRomFromPath(defaultRom.file);
        }
      }
    } catch (err) {
      this.ui.log("No se pudo cargar el archivo roms/manifest.json", 'warn');
    }

    // Parámetros URL para pruebas, capturas y enlaces profundos
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTheme = urlParams.get('theme');
    if (requestedTheme && this.themeManager) {
      this.themeManager.setTheme(requestedTheme);
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) themeSelect.value = requestedTheme;
    }
    const requestedTab = urlParams.get('tab');
    if (requestedTab) {
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${requestedTab}"]`);
      if (tabBtn) tabBtn.click();
    }
    if (urlParams.get('tv') === '1') {
      const stage = document.getElementById('tv-stage') || document.getElementById('game-canvas')?.parentElement;
      if (stage) {
        stage.classList.add('fullscreen-tv-active');
        document.body.classList.add('fullscreen-mode-active');
      }
    }
    if (urlParams.get('play') === '1') {
      this.play();
    }

    // Iniciar loop
    requestAnimationFrame((time) => this.mainLoop(time));
  }

  /**
   * Bucle principal de ejecución del emulador (RAF)
   */
  mainLoop(currentTime) {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Cálculo de FPS reales
    this.fpsCounter++;
    if (currentTime - this.fpsTimer >= 1000) {
      this.currentFps = (this.fpsCounter * 1000) / (currentTime - this.fpsTimer);
      this.currentHz = this.cyclesThisSecond;
      this.fpsCounter = 0;
      this.cyclesThisSecond = 0;
      this.fpsTimer = currentTime;
      this.ui.updateTelemetry(this.currentFps, this.currentHz);
    }

    // 1. Sondeo de Gamepad
    this.keypad.pollGamepad();

    // 2. Si estamos en modo Rebobinado (Time-Travel activo)
    if (this.timeTravel.isRewinding) {
      const hasPrevious = this.timeTravel.rewindStep();
      if (hasPrevious) {
        this.display.render(this.chip8.display);
        this.ui.updateHardwarePanels();
        this.ui.updateDisassembly();
        this.ui.updateTelemetry(this.currentFps, this.currentHz, t('statusRewind'));
      }
    } else if (this.isRunning) {
      // 3. Ejecución normal hacia adelante:
      // Ejecutar la cantidad de ciclos de CPU correspondiente al delta de tiempo
      const targetCycles = (this.cpuSpeedHz * deltaTime) / 1000;
      this.cyclesAccumulator += targetCycles;

      const cyclesToRun = Math.min(Math.floor(this.cyclesAccumulator), 500); // Limitar para evitar espirales
      this.cyclesAccumulator -= cyclesToRun;

      for (let c = 0; c < cyclesToRun; c++) {
        if (!this.isRunning) break;
        const result = this.chip8.step();
        this.cyclesThisSecond++;

        if (result && result.breakpoint) {
          break; // El hook de breakpoint ya pausará la CPU
        }
      }

      // Guardar instantánea periódica en el búfer de rebobinado (~60 veces/seg)
      this.timeTravel.captureFrame();

      // 4. Temporizadores a 60 Hz exactos (DT y ST)
      const elapsedSinceTimer = currentTime - this.lastTimerTime;
      if (elapsedSinceTimer >= this.timerInterval) {
        const timerTicks = Math.floor(elapsedSinceTimer / this.timerInterval);
        for (let i = 0; i < timerTicks; i++) {
          this.chip8.tickTimers();
        }
        this.lastTimerTime = currentTime;
      }

      // 5. Gestión del beeper de sonido
      if (this.chip8.soundTimer > 0) {
        this.audio.startBeep();
      } else {
        this.audio.stopBeep();
      }

      // 6. Refresco de pantalla si hay cambios
      if (this.chip8.drawFlag) {
        this.display.render(this.chip8.display);
        this.chip8.drawFlag = false;
      }

      // Refresco periódico ligero de la interfaz de depuración
      if (this.cyclesThisSecond % 5 === 0) {
        this.ui.updateHardwarePanels();
        this.ui.updateDisassembly();
      }
    }

    // Dibujar osciloscopio de audio
    this.audio.drawOscilloscope(this.ui.dom.audioOscCanvas);

    // Dibujar heatmap de memoria si la pestaña está activa
    if (this.ui.dom.memoryCanvas && this.ui.dom.memoryCanvas.offsetParent !== null) {
      this.heatmap.renderGrid(this.ui.dom.memoryCanvas);
    }

    requestAnimationFrame((time) => this.mainLoop(time));
  }

  /**
   * Carga una ROM desde una ruta relativa del servidor
   */
  async loadRomFromPath(filePath) {
    try {
      this.ui.log(`Cargando ROM: ${filePath}...`, 'info');
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const buffer = await response.arrayBuffer();
      const romBytes = new Uint8Array(buffer);

      this.applyLoadedRom(romBytes, filePath.split('/').pop());

      // Buscar metadatos
      this.currentRomMetadata = this.romManifest.find(r => r.file === filePath) || {
        title: filePath.split('/').pop(),
        size: romBytes.length,
        author: 'Desconocido',
        category: 'ROM',
        controls: 'Teclado 4x4'
      };
      this.ui.updateRomInfoCard(this.currentRomMetadata);

    } catch (err) {
      this.ui.log(`Error al cargar ROM "${filePath}": ${err.message}`, 'error');
    }
  }

  /**
   * Carga una ROM binaria arrastrada o seleccionada por el usuario
   */
  loadLocalRomFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const romBytes = new Uint8Array(e.target.result);
      this.applyLoadedRom(romBytes, file.name);
      this.currentRomMetadata = {
        title: file.name,
        size: romBytes.length,
        author: 'Archivo Local',
        category: 'Custom',
        controls: 'Teclado 4x4',
        description: 'ROM local cargada desde tu ordenador.'
      };
      this.ui.updateRomInfoCard(this.currentRomMetadata);
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Aplica e inicia la ROM en la máquina virtual
   */
  applyLoadedRom(romBytes, name) {
    this.pause();
    this.chip8.loadRom(romBytes);
    this.timeTravel.clear();
    this.heatmap.clear();
    this.currentRomName = name;

    this.display.render(this.chip8.display);
    this.ui.updateHardwarePanels();
    this.ui.updateDisassembly();

    this.ui.log(`ROM cargada con éxito: ${name} (${romBytes.length} bytes)`, 'success');
    this.play();
  }

  /**
   * Alterna reproducción y pausa
   */
  togglePlayPause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isRunning = true;
    this.ui.updatePlayPauseIcon(true);
    this.ui.updateTelemetry(this.currentFps, this.currentHz, t('statusRunning'));
    this.ui.updateRewindState(true);
  }

  pause() {
    this.isRunning = false;
    this.stopRewind(); // Asegurar que el rebobinado continuo se desactiva
    this.audio.stopBeep();
    this.ui.updatePlayPauseIcon(false);
    this.ui.updateTelemetry(this.currentFps, this.currentHz, t('statusPaused'));
    this.ui.updateDisassembly();
    this.ui.updateHardwarePanels();
    this.ui.updateRewindState(false);
  }

  /**
   * Retrocede exactamente una instrucción en el tiempo (Step Back)
   */
  stepBackInstruction() {
    this.pause();
    const success = this.timeTravel.stepBackInstruction();
    if (success) {
      this.display.render(this.chip8.display);
      this.ui.updateHardwarePanels();
      this.ui.updateDisassembly();
      this.ui.updateTelemetry(0, 0, t('statusStepping'));
      this.ui.popTraceHistory();
      this.ui.log(t('stepBackLog'), 'info');
    } else {
      this.ui.log(t('noStepBack'), 'warn');
    }
  }

  /**
   * Ejecuta una sola instrucción en modo paso a paso
   */
  stepSingleInstruction() {
    this.pause();
    // Guardar el estado actual en el historial antes de ejecutar la nueva instrucción
    this.timeTravel.pushInstructionSnapshot(this.chip8.serialize());

    const result = this.chip8.step();
    if (result && result.executed) {
      this.chip8.tickTimers();
      if (this.chip8.drawFlag) {
        this.display.render(this.chip8.display);
        this.chip8.drawFlag = false;
      }
      this.ui.updateHardwarePanels();
      this.ui.updateDisassembly(result);
      this.ui.updateTelemetry(0, 0, t('statusStepping'));
    }
  }

  /**
   * Avanza un fotograma completo (1/60 de segundo)
   */
  stepFrame() {
    this.pause();
    this.timeTravel.pushInstructionSnapshot(this.chip8.serialize());
    const cyclesPerFrame = Math.max(1, Math.round(this.cpuSpeedHz / 60));
    for (let i = 0; i < cyclesPerFrame; i++) {
      this.chip8.step();
    }
    this.chip8.tickTimers();
    this.timeTravel.captureFrame();
    this.display.render(this.chip8.display);
    this.ui.updateHardwarePanels();
    this.ui.updateDisassembly();
  }

  /**
   * Reinicia la ROM actual
   */
  reset() {
    this.pause();
    this.chip8.reset();
    this.timeTravel.clear();
    this.heatmap.clear();
    this.display.render(this.chip8.display);
    this.ui.updateHardwarePanels();
    this.ui.updateDisassembly();
    this.ui.log("Emulador reiniciado", 'info');
  }

  /**
   * Inicia y detiene el rebobinado en tiempo real (solo permitido en ejecución)
   */
  startRewind() {
    // Estando pausado NO se debe poder rebobinar continuamente
    if (!this.isRunning) return;
    this.timeTravel.isRewinding = true;
    this.audio.stopBeep();
  }

  stopRewind() {
    this.timeTravel.isRewinding = false;
  }

  /**
   * Ajusta la velocidad de reloj de la CPU en Hz
   */
  setSpeed(hz) {
    this.cpuSpeedHz = hz;
  }
}

// Inicialización automática al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.chip8App = new App();
});
