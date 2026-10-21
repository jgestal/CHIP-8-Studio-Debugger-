/**
 * ============================================================================
 * CHIP-8 TIME-TRAVEL ENGINE: REWIND & SAVE/LOAD STATES
 * ============================================================================
 * Búfer circular para rebobinado en tiempo real (Time Travel),
 * persistencia de 3 ranuras de guardado rápido y exportación/importación JSON.
 */

export class TimeTravel {
  constructor(chip8Instance, maxRewindFrames = 1800) {
    this.chip8 = chip8Instance;
    this.maxFrames = maxRewindFrames; // ~30 segundos a 60 fps
    this.rewindBuffer = [];
    this.instructionHistory = []; // Pila de instantáneas para paso a paso hacia atrás (Step Back)
    this.maxInstructionHistory = 1200;
    this.isRewinding = false;
    this.slotsKeyPrefix = 'chip8_savestate_slot_';
  }

  /**
   * Guarda un fotograma en el búfer de rebobinado continuo (60 Hz)
   */
  captureFrame() {
    if (this.isRewinding) return;

    if (this.rewindBuffer.length >= this.maxFrames) {
      this.rewindBuffer.shift(); // Descartar el más antiguo
    }
    this.rewindBuffer.push(this.chip8.serialize());
  }

  /**
   * Registra una instantánea de estado antes de ejecutar una instrucción (Step Back)
   */
  pushInstructionSnapshot(snapshot = null) {
    if (this.instructionHistory.length >= this.maxInstructionHistory) {
      this.instructionHistory.shift();
    }
    this.instructionHistory.push(snapshot || this.chip8.serialize());
  }

  /**
   * Retrocede exactamente una instrucción en el tiempo (Step Back / Undo)
   */
  stepBackInstruction() {
    // 1. Intentar desde el historial fino de instrucciones
    if (this.instructionHistory.length > 0) {
      const prevState = this.instructionHistory.pop();
      this.chip8.deserialize(prevState);
      return true;
    }
    // 2. Si no hay instantáneas de paso a paso, retroceder del búfer continuo
    if (this.rewindBuffer.length > 0) {
      const prevState = this.rewindBuffer.pop();
      this.chip8.deserialize(prevState);
      return true;
    }
    return false;
  }

  /**
   * Retrocede un fotograma en el tiempo (búfer continuo)
   */
  rewindStep() {
    if (this.rewindBuffer.length > 0) {
      const prevState = this.rewindBuffer.pop();
      this.chip8.deserialize(prevState);
      return true;
    }
    return false;
  }

  /**
   * Vacía los búferes de rebobinado e historial (al cargar nueva ROM o reiniciar)
   */
  clear() {
    this.rewindBuffer = [];
    this.instructionHistory = [];
    this.isRewinding = false;
  }

  /**
   * Guarda el estado actual en una de las 3 ranuras con miniatura
   */
  saveToSlot(slotIndex, canvasElement, romName = 'unknown') {
    if (slotIndex < 1 || slotIndex > 3) return false;

    // Generar miniatura en formato base64
    let thumbnail = '';
    if (canvasElement) {
      try {
        thumbnail = canvasElement.toDataURL('image/png');
      } catch (e) {}
    }

    const stateData = {
      slot: slotIndex,
      romName,
      timestamp: new Date().toISOString(),
      thumbnail,
      state: this.chip8.serialize()
    };

    try {
      localStorage.setItem(`${this.slotsKeyPrefix}${slotIndex}`, JSON.stringify(stateData));
      return true;
    } catch (err) {
      console.error('Error guardando Save State en LocalStorage:', err);
      return false;
    }
  }

  /**
   * Carga el estado almacenado en una ranura
   */
  loadFromSlot(slotIndex) {
    if (slotIndex < 1 || slotIndex > 3) return false;

    try {
      const raw = localStorage.getItem(`${this.slotsKeyPrefix}${slotIndex}`);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (data && data.state) {
        this.chip8.deserialize(data.state);
        return true;
      }
    } catch (err) {
      console.error('Error cargando Save State:', err);
    }
    return false;
  }

  /**
   * Obtiene la información y miniatura de una ranura
   */
  getSlotInfo(slotIndex) {
    try {
      const raw = localStorage.getItem(`${this.slotsKeyPrefix}${slotIndex}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Exporta el estado completo como archivo descargable JSON
   */
  exportJson(romName = 'game') {
    const data = {
      format: 'CHIP8_STUDIO_STATE_V1',
      romName,
      exportedAt: new Date().toISOString(),
      state: this.chip8.serialize()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chip8-${romName}-state-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importa un archivo JSON previamente exportado
   */
  importJson(file, callback = null) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.state) {
          this.chip8.deserialize(data.state);
          if (callback) callback(true, data.romName || 'Imported');
        } else {
          if (callback) callback(false, 'Formato inválido');
        }
      } catch (err) {
        if (callback) callback(false, err.message);
      }
    };
    reader.readAsText(file);
  }
}
