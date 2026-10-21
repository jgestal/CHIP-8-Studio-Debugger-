/**
 * ============================================================================
 * CHIP-8 MEMORY EXECUTION HEATMAP & RAM VISUALIZER
 * ============================================================================
 * Monitor en tiempo real de los 4096 bytes de RAM con mapa de calor según
 * el tipo de acceso (Ejecución, Lectura de datos y Escritura).
 */

export class MemoryHeatmap {
  constructor(chip8Instance) {
    this.chip8 = chip8Instance;
    this.size = 4096;

    // Arrays de seguimiento de accesos (guardan el timestamp/ciclo de último acceso)
    this.execAccess = new Float32Array(this.size);
    this.readAccess = new Float32Array(this.size);
    this.writeAccess = new Float32Array(this.size);

    // Conectar callbacks del Chip8
    this.hookChip8();
  }

  /**
   * Conecta los ganchos de telemetría a la máquina virtual
   */
  hookChip8() {
    const originalOpcodeHook = this.chip8.onOpcode;
    this.chip8.onOpcode = (pc, opcode, details) => {
      const now = performance.now();
      // Marcar los 2 bytes de la instrucción ejecutada
      if (pc >= 0 && pc < this.size - 1) {
        this.execAccess[pc] = now;
        this.execAccess[pc + 1] = now;
      }
      if (originalOpcodeHook) originalOpcodeHook(pc, opcode, details);
    };

    this.chip8.onMemoryRead = (addr, count) => {
      const now = performance.now();
      for (let idx = 0; idx < count; idx++) {
        const target = addr + idx;
        if (target < this.size) this.readAccess[target] = now;
      }
    };

    this.chip8.onMemoryWrite = (addr, count) => {
      const now = performance.now();
      for (let idx = 0; idx < count; idx++) {
        const target = addr + idx;
        if (target < this.size) this.writeAccess[target] = now;
      }
    };
  }

  /**
   * Limpia el registro de accesos
   */
  clear() {
    this.execAccess.fill(0);
    this.readAccess.fill(0);
    this.writeAccess.fill(0);
  }

  /**
   * Renderiza la cuadrícula de 4096 bytes en un elemento Canvas (64x64 celdas)
   * @param {HTMLCanvasElement} canvas - Canvas sobre el que pintar el heatmap
   */
  renderGrid(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cols = 64;
    const rows = 64; // 64 x 64 = 4096 bytes
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const now = performance.now();
    const fadeDuration = 1200; // Milisegundos de resplandor

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let addr = 0; addr < this.size; addr++) {
      const col = addr % cols;
      const row = Math.floor(addr / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Calcular intensidades de actividad reciente
      const execAge = now - this.execAccess[addr];
      const readAge = now - this.readAccess[addr];
      const writeAge = now - this.writeAccess[addr];

      let r = 26, g = 38, b = 50; // Color inactivo base

      // Zonas de memoria especiales (fondo sutil)
      if (addr < 0x200) {
        // Área reservada a fuentes
        b += 15;
      } else if (addr >= 0x200 && this.chip8.memory[addr] !== 0) {
        // Datos de ROM cargados
        r += 10; g += 15; b += 20;
      }

      // 1. Escritura reciente (Rojo)
      if (writeAge < fadeDuration) {
        const factor = 1 - (writeAge / fadeDuration);
        r = Math.min(255, r + Math.floor(220 * factor));
      }

      // 2. Lectura de sprite/datos (Azul / Cian)
      if (readAge < fadeDuration) {
        const factor = 1 - (readAge / fadeDuration);
        g = Math.min(255, g + Math.floor(180 * factor));
        b = Math.min(255, b + Math.floor(240 * factor));
      }

      // 3. Ejecución de código (Verde brillante)
      if (execAge < fadeDuration) {
        const factor = 1 - (execAge / fadeDuration);
        g = Math.min(255, g + Math.floor(230 * factor));
        r = Math.min(255, r + Math.floor(60 * factor));
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Resaltar puntero I actual en magenta
      if (addr === this.chip8.i) {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, cellWidth * 2, cellHeight * 2);
      }

      // Resaltar Program Counter (PC) actual en amarillo brillante
      if (addr === this.chip8.pc) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }
  }

  /**
   * Obtiene información detallada de una celda de memoria a partir de coordenadas del canvas
   */
  inspectAddress(canvas, mouseX, mouseY) {
    const rect = canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;

    const cols = 64;
    const rows = 64;
    const col = Math.floor((x / canvas.width) * cols);
    const row = Math.floor((y / canvas.height) * rows);
    const addr = Math.max(0, Math.min(4095, (row * cols) + col));

    const byteVal = this.chip8.memory[addr];
    let role = "Libre / Inactivo";
    if (addr < 0x200) role = "Fontset del Sistema (Reservado)";
    else if (addr === this.chip8.pc) role = "PC Actual (Ejecución)";
    else if (addr === this.chip8.i) role = "Puntero I (Dirección de Datos)";
    else if (this.chip8.memory[addr] !== 0) role = "Código o Sprite de ROM";

    return {
      address: addr,
      addressHex: `0x${addr.toString(16).toUpperCase().padStart(4, '0')}`,
      byte: byteVal,
      byteHex: `0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}`,
      role
    };
  }
}
