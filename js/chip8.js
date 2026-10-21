/**
 * ============================================================================
 * CHIP-8 VIRTUAL MACHINE CORE
 * ============================================================================
 * Implementación exhaustiva, modular y didáctica de la arquitectura CHIP-8 (1977).
 * Incluye ciclo Fetch-Decode-Execute, gestión de temporizadores a 60 Hz,
 * decodificación de nibbles, gestión de Quirks y serialización para Time-Travel.
 */

export const FONTSET_START_ADDRESS = 0x050;
export const PROGRAM_START_ADDRESS = 0x200;
export const MEMORY_SIZE = 4096;
export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;

/**
 * Juego de caracteres estándar de 80 bytes (16 caracteres hexadecimales: 0-F).
 * Cada carácter mide 4x5 píxeles empaquetados en 5 bytes consecutivos.
 */
export const CHIP8_FONTSET = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
]);

export class Chip8 {
  constructor(quirks = {}) {
    // 1. Memoria principal: 4096 posiciones de 8 bits (0x000 a 0xFFF)
    this.memory = new Uint8Array(MEMORY_SIZE);

    // 2. Banco de 16 registros de propósito general de 8 bits (V0 a VF)
    this.v = new Uint8Array(16);

    // 3. Registro de dirección I (16 bits, usa hasta 12 bits para direcciones)
    this.i = 0;

    // 4. Contador de Programa (PC): inicializado por convención en 0x200
    this.pc = PROGRAM_START_ADDRESS;

    // 5. Pila (Stack) de 16 niveles para almacenar direcciones de retorno de subrutinas
    this.stack = new Uint16Array(16);

    // 6. Puntero de Pila (SP): apunta a la posición actual dentro de this.stack
    this.sp = 0;

    // 7. Temporizadores independientes decrecientes a 60 Hz
    this.delayTimer = 0;
    this.soundTimer = 0;

    // 8. Búfer de pantalla monocromática: 64 columnas x 32 filas = 2048 píxeles (0 o 1)
    this.display = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT);

    // 9. Estado de las 16 teclas hexadecimales (0x0 a 0xF): 1 pulsada, 0 liberada
    this.keys = new Uint8Array(16);

    // 10. Banderas y control de ejecución
    this.drawFlag = false;          // Se activa cuando una instrucción DRW o CLS modifica la pantalla
    this.waitingForKey = false;     // Se activa cuando la instrucción FX0A está bloqueada esperando entrada
    this.keyRegister = 0;           // Guarda qué registro Vx recibirá la tecla presionada
    this.isHalted = false;          // Detención por error o instrucción de parada
    this.breakpoints = new Set();   // Direcciones de memoria con punto de interrupción
    this.totalCycles = 0;           // Contador total de ciclos de CPU ejecutados

    // 11. Configuración de Quirks (diferencias históricas entre COSMAC VIP y SCHIP)
    this.quirks = {
      shift: false,      // true: 8XY6/8XYE desplazan VX directamente; false: copian VY en VX y luego desplazan
      loadStore: false,  // true: FX55/FX65 NO modifican I (SCHIP/moderno); false: I = I + X + 1 (COSMAC VIP)
      jump: false,       // true: BXNN salta a XNN + VX; false: BNNN salta a NNN + V0 (COSMAC VIP)
      clip: true,        // true: recorta sprites en los bordes de pantalla; false: envuelve coordenadas (wrap)
      ...quirks
    };

    // 12. Callbacks para herramientas de depuración e inspección
    this.onOpcode = null;           // Callback invocado tras cada instrucción: (pc, opcode, details)
    this.onBreakpoint = null;       // Callback invocado al alcanzar un breakpoint: (pc)
    this.onMemoryWrite = null;      // Callback invocado al escribir en memoria: (addr, byte)
    this.onMemoryRead = null;       // Callback invocado al leer memoria: (addr, count)

    // Cargar el fontset en memoria
    this.loadFontset();
  }

  /**
   * Carga el juego de fuentes estándar de 80 bytes en 0x050 - 0x09F
   */
  loadFontset() {
    for (let idx = 0; idx < CHIP8_FONTSET.length; idx++) {
      this.memory[FONTSET_START_ADDRESS + idx] = CHIP8_FONTSET[idx];
    }
  }

  /**
   * Reinicia la máquina virtual a su estado inicial sin descargar la ROM
   */
  reset() {
    this.v.fill(0);
    this.i = 0;
    this.pc = PROGRAM_START_ADDRESS;
    this.stack.fill(0);
    this.sp = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display.fill(0);
    this.keys.fill(0);
    this.drawFlag = true;
    this.waitingForKey = false;
    this.keyRegister = 0;
    this.isHalted = false;
    this.totalCycles = 0;
  }

  /**
   * Carga un binario de ROM en la memoria a partir de 0x200
   * @param {Uint8Array} romBuffer - Array de bytes binarios de la ROM
   */
  loadRom(romBuffer) {
    this.reset();
    // Limpiar el espacio de memoria de usuario (0x200 a 0xFFF)
    this.memory.fill(0, PROGRAM_START_ADDRESS);
    
    // Validar tamaño máximo de ROM (3584 bytes disponibles: 4096 - 512)
    const maxRomSize = MEMORY_SIZE - PROGRAM_START_ADDRESS;
    if (romBuffer.length > maxRomSize) {
      throw new Error(`La ROM (${romBuffer.length} bytes) excede el tamaño máximo permitido (${maxRomSize} bytes).`);
    }

    // Copiar bytes de la ROM en la memoria
    for (let idx = 0; idx < romBuffer.length; idx++) {
      this.memory[PROGRAM_START_ADDRESS + idx] = romBuffer[idx];
    }
    this.drawFlag = true;
  }

  /**
   * Gestiona el evento de tecla presionada en el teclado hexadecimal
   */
  setKeyDown(key) {
    if (key >= 0 && key < 16) {
      this.keys[key] = 1;

      // Si la CPU estaba en espera de tecla (instrucción FX0A), se desbloquea
      if (this.waitingForKey) {
        this.v[this.keyRegister] = key;
        this.waitingForKey = false;
      }
    }
  }

  /**
   * Gestiona el evento de tecla liberada
   */
  setKeyUp(key) {
    if (key >= 0 && key < 16) {
      this.keys[key] = 0;
    }
  }

  /**
   * Añade o elimina una dirección de memoria como breakpoint
   */
  toggleBreakpoint(address) {
    if (this.breakpoints.has(address)) {
      this.breakpoints.delete(address);
      return false;
    } else {
      this.breakpoints.add(address);
      return true;
    }
  }

  /**
   * Decrementa los temporizadores de Delay y Sonido.
   * DEBE llamarse a exactamente 60 Hz independientemente de la velocidad de CPU.
   */
  tickTimers() {
    if (this.delayTimer > 0) {
      this.delayTimer--;
    }
    if (this.soundTimer > 0) {
      this.soundTimer--;
    }
  }

  /**
   * Ejecuta un ciclo de instrucción de la CPU (Fetch-Decode-Execute).
   * Retorna información del ciclo para telemetría y depuración.
   */
  step() {
    // Si la CPU está esperando una tecla por FX0A o está detenida, no avanzar
    if (this.waitingForKey || this.isHalted) {
      return { executed: false, pc: this.pc, waiting: this.waitingForKey };
    }

    // Comprobar si hemos alcanzado un punto de ruptura (Breakpoint)
    if (this.breakpoints.has(this.pc)) {
      if (this.onBreakpoint) {
        this.onBreakpoint(this.pc);
      }
      return { executed: false, pc: this.pc, breakpoint: true };
    }

    const currentPc = this.pc;

    // ========================================================================
    // 1. FASE FETCH (Búsqueda)
    // CHIP-8 tiene instrucciones de 16 bits (2 bytes consecutivas en Big-Endian)
    // ========================================================================
    if (this.pc >= MEMORY_SIZE - 1) {
      this.isHalted = true;
      throw new Error(`Contador de programa (PC: 0x${this.pc.toString(16)}) fuera del límite de memoria.`);
    }

    const byte1 = this.memory[this.pc];
    const byte2 = this.memory[this.pc + 1];
    const opcode = (byte1 << 8) | byte2;

    // Avanzar el contador de programa a la siguiente instrucción de 2 bytes
    this.pc += 2;
    this.totalCycles++;

    // Desglose de componentes del Opcode (nibbles):
    const prefix = (opcode & 0xF000) >> 12; // Primer nibble: tipo de instrucción
    const x      = (opcode & 0x0F00) >> 8;  // Segundo nibble: índice de registro Vx (0 a F)
    const y      = (opcode & 0x00F0) >> 4;  // Tercer nibble: índice de registro Vy (0 a F)
    const n      =  opcode & 0x000F;        // Cuarto nibble: valor inmediato de 4 bits
    const nn     =  opcode & 0x00FF;        // Byte inferior: valor inmediato de 8 bits
    const nnn    =  opcode & 0x0FFF;        // Dirección de 12 bits

    // Copia del estado de registros antes de la ejecución para telemetría diff
    const prevRegisters = new Uint8Array(this.v);
    const prevI = this.i;

    // ========================================================================
    // 2. FASE DECODE & EXECUTE (Decodificación y Ejecución)
    // ========================================================================
    switch (prefix) {
      case 0x0:
        if (opcode === 0x00E0) {
          // 00E0 - CLS: Limpiar pantalla
          this.display.fill(0);
          this.drawFlag = true;
        } else if (opcode === 0x00EE) {
          // 00EE - RET: Retornar de subrutina
          if (this.sp === 0) {
            throw new Error(`Desbordamiento inferior de pila (Stack Underflow) en PC 0x${currentPc.toString(16)}.`);
          }
          this.sp--;
          this.pc = this.stack[this.sp];
        } else {
          // 0NNN - SYS addr: Llamada al sistema del RCA 1802 original (obsoleta, se ignora de forma segura)
        }
        break;

      case 0x1:
        // 1NNN - JP addr: Salto incondicional a la dirección NNN
        this.pc = nnn;
        break;

      case 0x2:
        // 2NNN - CALL addr: Llamada a subrutina en NNN
        if (this.sp >= this.stack.length) {
          throw new Error(`Desbordamiento de pila (Stack Overflow) en PC 0x${currentPc.toString(16)}.`);
        }
        this.stack[this.sp] = this.pc;
        this.sp++;
        this.pc = nnn;
        break;

      case 0x3:
        // 3XNN - SE Vx, byte: Salta siguiente instrucción si Vx == NN
        if (this.v[x] === nn) {
          this.pc += 2;
        }
        break;

      case 0x4:
        // 4XNN - SNE Vx, byte: Salta siguiente instrucción si Vx != NN
        if (this.v[x] !== nn) {
          this.pc += 2;
        }
        break;

      case 0x5:
        // 5XY0 - SE Vx, Vy: Salta siguiente instrucción si Vx == Vy
        if (n === 0x0) {
          if (this.v[x] === this.v[y]) {
            this.pc += 2;
          }
        }
        break;

      case 0x6:
        // 6XNN - LD Vx, byte: Carga el valor NN en el registro Vx
        this.v[x] = nn;
        break;

      case 0x7:
        // 7XNN - ADD Vx, byte: Suma NN a Vx (NO modifica el flag de acarreo VF)
        this.v[x] = (this.v[x] + nn) & 0xFF;
        break;

      case 0x8:
        // Operaciones aritméticas y lógicas entre registros Vx y Vy
        switch (n) {
          case 0x0:
            // 8XY0 - LD Vx, Vy: Vx = Vy
            this.v[x] = this.v[y];
            break;

          case 0x1:
            // 8XY1 - OR Vx, Vy: Vx = Vx | Vy
            this.v[x] |= this.v[y];
            if (!this.quirks.shift) this.v[0xF] = 0; // Quirk COSMAC VIP: reinicia VF
            break;

          case 0x2:
            // 8XY2 - AND Vx, Vy: Vx = Vx & Vy
            this.v[x] &= this.v[y];
            if (!this.quirks.shift) this.v[0xF] = 0; // Quirk COSMAC VIP: reinicia VF
            break;

          case 0x3:
            // 8XY3 - XOR Vx, Vy: Vx = Vx ^ Vy
            this.v[x] ^= this.v[y];
            if (!this.quirks.shift) this.v[0xF] = 0; // Quirk COSMAC VIP: reinicia VF
            break;

          case 0x4: {
            // 8XY4 - ADD Vx, Vy: Vx = Vx + Vy (VF = carry: 1 si suma > 255)
            const sum = this.v[x] + this.v[y];
            this.v[x] = sum & 0xFF;
            this.v[0xF] = sum > 0xFF ? 1 : 0;
            break;
          }

          case 0x5: {
            // 8XY5 - SUB Vx, Vy: Vx = Vx - Vy (VF = NOT borrow: 1 si Vx >= Vy)
            const notBorrow = this.v[x] >= this.v[y] ? 1 : 0;
            this.v[x] = (this.v[x] - this.v[y]) & 0xFF;
            this.v[0xF] = notBorrow;
            break;
          }

          case 0x6: {
            // 8XY6 - SHR Vx {, Vy}: Desplazamiento a la derecha
            if (!this.quirks.shift) {
              this.v[x] = this.v[y]; // Quirk COSMAC VIP: toma el valor de Vy primero
            }
            const lsb = this.v[x] & 0x01;
            this.v[x] = (this.v[x] >> 1) & 0xFF;
            this.v[0xF] = lsb;
            break;
          }

          case 0x7: {
            // 8XY7 - SUBN Vx, Vy: Vx = Vy - Vx (VF = NOT borrow: 1 si Vy >= Vx)
            const notBorrow = this.v[y] >= this.v[x] ? 1 : 0;
            this.v[x] = (this.v[y] - this.v[x]) & 0xFF;
            this.v[0xF] = notBorrow;
            break;
          }

          case 0xE: {
            // 8XYE - SHL Vx {, Vy}: Desplazamiento a la izquierda
            if (!this.quirks.shift) {
              this.v[x] = this.v[y]; // Quirk COSMAC VIP: toma el valor de Vy primero
            }
            const msb = (this.v[x] >> 7) & 0x01;
            this.v[x] = (this.v[x] << 1) & 0xFF;
            this.v[0xF] = msb;
            break;
          }

          default:
            console.warn(`Opcode 0x8 sub-instrucción desconocida: 0x${opcode.toString(16)}`);
        }
        break;

      case 0x9:
        // 9XY0 - SNE Vx, Vy: Salta si Vx != Vy
        if (n === 0x0) {
          if (this.v[x] !== this.v[y]) {
            this.pc += 2;
          }
        }
        break;

      case 0xA:
        // ANNN - LD I, addr: Establece el registro de dirección I = NNN
        this.i = nnn;
        break;

      case 0xB:
        // BNNN / BXNN - JP V0/Vx, addr: Salto con desplazamiento
        if (this.quirks.jump) {
          // Quirk SCHIP: BXNN salta a XNN + Vx
          this.pc = (nnn + this.v[x]) & 0xFFF;
        } else {
          // COSMAC VIP estándar: BNNN salta a NNN + V0
          this.pc = (nnn + this.v[0]) & 0xFFF;
        }
        break;

      case 0xC: {
        // CXNN - RND Vx, byte: Vx = (Número Aleatorio 0-255) & NN
        const randomByte = Math.floor(Math.random() * 256);
        this.v[x] = randomByte & nn;
        break;
      }

      case 0xD: {
        // DXYN - DRW Vx, Vy, nibble: Dibuja sprite de N bytes en (Vx, Vy) mediante XOR
        const startX = this.v[x] % DISPLAY_WIDTH;
        const startY = this.v[y] % DISPLAY_HEIGHT;
        const height = n;

        // Limpiar flag de colisión VF
        this.v[0xF] = 0;

        for (let row = 0; row < height; row++) {
          const spriteByte = this.memory[this.i + row];
          const yPos = startY + row;

          // Si el recorte (clip) está activo y el sprite sale por abajo, no dibujar esa fila
          if (this.quirks.clip && yPos >= DISPLAY_HEIGHT) {
            break;
          }
          const actualY = yPos % DISPLAY_HEIGHT;

          // Cada byte del sprite tiene 8 píxeles horizontales (bits 7 a 0)
          for (let col = 0; col < 8; col++) {
            const xPos = startX + col;

            // Si el recorte está activo y sale por la derecha, ignorar ese pixel
            if (this.quirks.clip && xPos >= DISPLAY_WIDTH) {
              break;
            }
            const actualX = xPos % DISPLAY_WIDTH;

            // Verificar si el bit del sprite está activo
            const mask = 0x80 >> col;
            if ((spriteByte & mask) !== 0) {
              const pixelIndex = actualX + (actualY * DISPLAY_WIDTH);

              // Detección de colisión: si el píxel ya estaba encendido en pantalla
              if (this.display[pixelIndex] === 1) {
                this.v[0xF] = 1;
              }

              // Dibujado XOR
              this.display[pixelIndex] ^= 1;
            }
          }
        }

        this.drawFlag = true;
        if (this.onMemoryRead) {
          this.onMemoryRead(this.i, height);
        }
        break;
      }

      case 0xE:
        if (nn === 0x9E) {
          // EX9E - SKP Vx: Salta siguiente instrucción si la tecla en Vx está pulsada
          const key = this.v[x] & 0x0F;
          if (this.keys[key] === 1) {
            this.pc += 2;
          }
        } else if (nn === 0xA1) {
          // EXA1 - SKNP Vx: Salta siguiente instrucción si la tecla en Vx NO está pulsada
          const key = this.v[x] & 0x0F;
          if (this.keys[key] === 0) {
            this.pc += 2;
          }
        }
        break;

      case 0xF:
        switch (nn) {
          case 0x07:
            // FX07 - LD Vx, DT: Carga el valor del delay timer en Vx
            this.v[x] = this.delayTimer;
            break;

          case 0x0A:
            // FX0A - LD Vx, K: Espera la pulsación de una tecla y la guarda en Vx
            this.waitingForKey = true;
            this.keyRegister = x;
            break;

          case 0x15:
            // FX15 - LD DT, Vx: Carga Vx en el delay timer
            this.delayTimer = this.v[x];
            break;

          case 0x18:
            // FX18 - LD ST, Vx: Carga Vx en el sound timer
            this.soundTimer = this.v[x];
            break;

          case 0x1E:
            // FX1E - ADD I, Vx: Suma Vx al registro de dirección I
            this.i = (this.i + this.v[x]) & 0xFFFF;
            break;

          case 0x29:
            // FX29 - LD F, Vx: Apunta I a la dirección del sprite del dígito hex en Vx
            this.i = FONTSET_START_ADDRESS + ((this.v[x] & 0x0F) * 5);
            break;

          case 0x33: {
            // FX33 - LD B, Vx: Almacena el valor decimal BCD de Vx en I, I+1 e I+2
            const val = this.v[x];
            this.memory[this.i]     = Math.floor(val / 100);
            this.memory[this.i + 1] = Math.floor((val % 100) / 10);
            this.memory[this.i + 2] = val % 10;
            if (this.onMemoryWrite) {
              this.onMemoryWrite(this.i, 3);
            }
            break;
          }

          case 0x55:
            // FX55 - LD [I], Vx: Vuelca registros V0 a Vx en memoria consecutiva desde I
            for (let idx = 0; idx <= x; idx++) {
              this.memory[this.i + idx] = this.v[idx];
            }
            if (this.onMemoryWrite) {
              this.onMemoryWrite(this.i, x + 1);
            }
            if (!this.quirks.loadStore) {
              // Quirk COSMAC VIP: I se incrementa en X + 1
              this.i = (this.i + x + 1) & 0xFFFF;
            }
            break;

          case 0x65:
            // FX65 - LD Vx, [I]: Lee registros V0 a Vx desde memoria consecutiva desde I
            for (let idx = 0; idx <= x; idx++) {
              this.v[idx] = this.memory[this.i + idx];
            }
            if (this.onMemoryRead) {
              this.onMemoryRead(this.i, x + 1);
            }
            if (!this.quirks.loadStore) {
              // Quirk COSMAC VIP: I se incrementa en X + 1
              this.i = (this.i + x + 1) & 0xFFFF;
            }
            break;

          default:
            console.warn(`Opcode 0xF sub-instrucción desconocida: 0x${opcode.toString(16)}`);
        }
        break;

      default:
        console.warn(`Opcode desconocido no implementado: 0x${opcode.toString(16)} en PC 0x${currentPc.toString(16)}`);
    }

    // Identificar registros modificados para feedback didáctico visual
    const changedRegs = [];
    for (let idx = 0; idx < 16; idx++) {
      if (prevRegisters[idx] !== this.v[idx]) {
        changedRegs.push({ index: idx, oldVal: prevRegisters[idx], newVal: this.v[idx] });
      }
    }
    const iChanged = prevI !== this.i;

    // Disparar hook de depuración
    if (this.onOpcode) {
      this.onOpcode(currentPc, opcode, {
        changedRegs,
        iChanged,
        prevI,
        newI: this.i,
        drawTriggered: this.drawFlag
      });
    }

    return {
      executed: true,
      pc: currentPc,
      nextPc: this.pc,
      opcode,
      changedRegs,
      iChanged
    };
  }

  /**
   * Serializa todo el estado interno de la máquina virtual (Snapshot).
   * Fundamental para Save States y el motor de Time-Travel (Rewind).
   */
  serialize() {
    return {
      memory: Array.from(this.memory),
      v: Array.from(this.v),
      i: this.i,
      pc: this.pc,
      stack: Array.from(this.stack),
      sp: this.sp,
      delayTimer: this.delayTimer,
      soundTimer: this.soundTimer,
      display: Array.from(this.display),
      keys: Array.from(this.keys),
      waitingForKey: this.waitingForKey,
      keyRegister: this.keyRegister,
      totalCycles: this.totalCycles
    };
  }

  /**
   * Restaura un estado serializado previo de la máquina virtual
   */
  deserialize(state) {
    if (!state) return;
    this.memory.set(state.memory);
    this.v.set(state.v);
    this.i = state.i;
    this.pc = state.pc;
    this.stack.set(state.stack);
    this.sp = state.sp;
    this.delayTimer = state.delayTimer;
    this.soundTimer = state.soundTimer;
    this.display.set(state.display);
    this.keys.set(state.keys);
    this.waitingForKey = state.waitingForKey;
    this.keyRegister = state.keyRegister;
    this.totalCycles = state.totalCycles || 0;
    this.drawFlag = true;
  }
}
