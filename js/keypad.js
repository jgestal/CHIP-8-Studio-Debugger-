/**
 * ============================================================================
 * CHIP-8 DUAL KEYPAD & GAMEPAD API CONTROLLER
 * ============================================================================
 * Gestión del teclado hexadecimal 4x4 (0x0 a 0xF), mapeo físico QWERTY,
 * compatibilidad nativa con mandos USB/Bluetooth y feedback háptico.
 */

// Mapeo clásico QWERTY -> Teclado COSMAC VIP 4x4
export const DEFAULT_KEY_MAP = {
  // Fila 1
  '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
  // Fila 2
  'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
  // Fila 3
  'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
  // Fila 4
  'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,

  // Mayúsculas
  'Q': 0x4, 'W': 0x5, 'E': 0x6, 'R': 0xD,
  'A': 0x7, 'S': 0x8, 'D': 0x9, 'F': 0xE,
  'Z': 0xA, 'X': 0x0, 'C': 0xB, 'V': 0xF,

  // Atajos para flechas de dirección universales
  'ArrowUp': 0x2,
  'ArrowDown': 0x8,
  'ArrowLeft': 0x4,
  'ArrowRight': 0x6,
  ' ': 0x5 // Espacio para disparo/acción común
};

export class Keypad {
  constructor(chip8Instance) {
    this.chip8 = chip8Instance;
    this.keyMap = { ...DEFAULT_KEY_MAP };
    this.keyStates = new Uint8Array(16);
    this.onKeyChange = null; // Callback para sincronización visual con la UI

    // Estado del Gamepad
    this.hasGamepad = false;
    this.gamepadIndex = null;

    this.bindEvents();
    this.initGamepad();
  }

  /**
   * Conecta los listeners del teclado físico del navegador
   */
  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const chip8Key = this.keyMap[e.key];
      if (chip8Key !== undefined) {
        e.preventDefault();
        this.pressKey(chip8Key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const chip8Key = this.keyMap[e.key];
      if (chip8Key !== undefined) {
        e.preventDefault();
        this.releaseKey(chip8Key);
      }
    });
  }

  /**
   * Simula la pulsación de una tecla hexadecimal (0x0 - 0xF)
   */
  pressKey(hexKey) {
    if (hexKey >= 0 && hexKey < 16) {
      this.keyStates[hexKey] = 1;
      this.chip8.setKeyDown(hexKey);

      // Feedback háptico en móviles
      if ('vibrate' in navigator) {
        try { navigator.vibrate(10); } catch (e) {}
      }

      if (this.onKeyChange) {
        this.onKeyChange(hexKey, true);
      }
    }
  }

  /**
   * Simula la liberación de una tecla
   */
  releaseKey(hexKey) {
    if (hexKey >= 0 && hexKey < 16) {
      this.keyStates[hexKey] = 0;
      this.chip8.setKeyUp(hexKey);

      if (this.onKeyChange) {
        this.onKeyChange(hexKey, false);
      }
    }
  }

  /**
   * Inicializa la escucha de mandos USB/Bluetooth mediante Gamepad API
   */
  initGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      this.hasGamepad = true;
      this.gamepadIndex = e.gamepad.index;
      console.log(`Gamepad conectado: ${e.gamepad.id} en índice ${e.gamepad.index}`);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.hasGamepad = false;
        this.gamepadIndex = null;
        console.log('Gamepad desconectado');
      }
    });
  }

  /**
   * Sondea el estado del mando en cada frame del bucle de animación
   */
  pollGamepad() {
    if (!this.hasGamepad || this.gamepadIndex === null) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // D-Pad y botones estándar (Xbox / PlayStation layout)
    // Botón 12: Arriba -> 0x2
    // Botón 13: Abajo -> 0x8
    // Botón 14: Izquierda -> 0x4
    // Botón 15: Derecha -> 0x6
    // Botón 0 (A / X): Disparo -> 0x5
    // Botón 1 (B / O): Acción 2 -> 0x6
    // Botón 2 (X / Cuadrado) -> 0x4
    // Botón 3 (Y / Triángulo) -> 0xC

    const handleButton = (btnIndex, hexKey) => {
      const isPressed = gp.buttons[btnIndex] && gp.buttons[btnIndex].pressed;
      if (isPressed && !this.keyStates[hexKey]) {
        this.pressKey(hexKey);
      } else if (!isPressed && this.keyStates[hexKey]) {
        this.releaseKey(hexKey);
      }
    };

    handleButton(12, 0x2); // Up
    handleButton(13, 0x8); // Down
    handleButton(14, 0x4); // Left
    handleButton(15, 0x6); // Right
    handleButton(0, 0x5);  // A
    handleButton(1, 0x6);  // B
    handleButton(2, 0x4);  // X
    handleButton(3, 0xC);  // Y

    // Sticks analógicos (eje 0 = X, eje 1 = Y)
    if (gp.axes && gp.axes.length >= 2) {
      const stickX = gp.axes[0];
      const stickY = gp.axes[1];
      const threshold = 0.5;

      if (stickY < -threshold) this.pressKey(0x2);
      if (stickY > threshold)  this.pressKey(0x8);
      if (stickX < -threshold) this.pressKey(0x4);
      if (stickX > threshold)  this.pressKey(0x6);
    }
  }
}
