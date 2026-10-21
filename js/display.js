/**
 * ============================================================================
 * CHIP-8 DISPLAY ENGINE (HTML5 CANVAS)
 * ============================================================================
 * Motor de renderizado gráfico de 64x32 píxeles con escalado nítido,
 * temas retro de color, emulación de fósforo y filtros CRT.
 */

import { THEMES } from './themes.js';

export class Display {
  constructor(canvasElement, width = 64, height = 32) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.width = width;
    this.height = height;

    // Ajustar resolución interna del canvas
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Desactivar suavizado para nitidez pixel-perfect
    this.ctx.imageSmoothingEnabled = false;

    // Paleta actual vinculada al tema
    this.themeId = localStorage.getItem('chip8_theme') || 'massung';
    this.palette = THEMES[this.themeId] ? THEMES[this.themeId].canvas : THEMES.massung.canvas;

    // Configuración visual
    this.showGrid = true;
    this.crtEnabled = localStorage.getItem('chip8_crt') === 'true';

    // ImageData para volcado rápido de píxeles
    this.imageData = this.ctx.createImageData(this.width, this.height);
  }

  /**
   * Cambia la paleta de color activa según el tema
   */
  setTheme(themeId) {
    if (THEMES[themeId]) {
      this.themeId = themeId;
      this.palette = THEMES[themeId].canvas;
    }
  }

  /**
   * Activa o desactiva el filtro CRT
   */
  toggleCrt(enable = null) {
    this.crtEnabled = enable !== null ? enable : !this.crtEnabled;
    localStorage.setItem('chip8_crt', this.crtEnabled.toString());
    return this.crtEnabled;
  }

  /**
   * Dibuja el búfer de 64x32 del CHIP-8 en el canvas
   * @param {Uint8Array} displayBuffer - Array de 2048 elementos (0 o 1)
   */
  render(displayBuffer) {
    const bgRgb = this.hexToRgb(this.palette.bg);
    const onRgb = this.hexToRgb(this.palette.on);
    const data = this.imageData.data;

    for (let idx = 0; idx < displayBuffer.length; idx++) {
      const isPixelOn = displayBuffer[idx] === 1;
      const pixelOffset = idx * 4;
      const color = isPixelOn ? onRgb : bgRgb;

      data[pixelOffset]     = color.r;
      data[pixelOffset + 1] = color.g;
      data[pixelOffset + 2] = color.b;
      data[pixelOffset + 3] = 255;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   * Renderiza el sprite apuntado por I en un mini canvas para previsualización
   */
  static renderSpritePreview(canvas, memory, address, height = 5, onColor = '#39ff14', bgColor = '#111827') {
    const ctx = canvas.getContext('2d');
    const width = 8;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = onColor;
    for (let row = 0; row < height; row++) {
      if (address + row >= memory.length) break;
      const spriteByte = memory[address + row];
      for (let col = 0; col < 8; col++) {
        if ((spriteByte & (0x80 >> col)) !== 0) {
          ctx.fillRect(col, row, 1, 1);
        }
      }
    }
  }

  /**
   * Genera y descarga una captura de pantalla en formato PNG
   */
  downloadScreenshot(scale = 10, filename = 'chip8-screenshot.png') {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width * scale;
    exportCanvas.height = this.height * scale;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.imageSmoothingEnabled = false;

    // Escalar la imagen actual nítidamente
    exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    const link = document.createElement('a');
    link.download = filename;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Convierte un código hexadecimal a objeto RGB
   */
  hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }
}
