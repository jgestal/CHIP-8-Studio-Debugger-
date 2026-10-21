/**
 * ============================================================================
 * CHIP-8 THEME MANAGER (DECOUPLED DESIGN TOKENS)
 * ============================================================================
 * Clean Architecture theme provider implementing Open/Closed Principle.
 * Controls full-UI CSS tokens and canvas pixel palettes for NES, SNES,
 * Terminal VT220, Game Boy DMG-01, Massung Slate, and Cyberpunk Synthwave.
 */

export const THEMES = {
  massung: {
    id: 'massung',
    name: 'Jeffrey Massung Slate',
    era: '1977 Workstation',
    canvas: {
      bg: '#1e262c',
      on: '#cbd5e1',
      grid: 'rgba(0, 0, 0, 0.25)'
    },
    tokens: {
      '--bg-main': '#0e1419',
      '--bg-panel': '#161f26',
      '--bg-panel-dark': '#11181e',
      '--border-color': '#263540',
      '--text-primary': '#e2e8f0',
      '--text-muted': '#8b9bb4',
      '--accent-primary': '#38bdf8',
      '--accent-secondary': '#0284c7',
      '--keypad-bg': '#1e293b',
      '--keypad-active': '#0284c7',
      '--btn-bg': '#1e293b',
      '--btn-border': '#334155',
      '--crt-glow': '0 0 10px rgba(56, 189, 248, 0.25)'
    }
  },

  nes: {
    id: 'nes',
    name: 'NES Classic (1983)',
    era: '8-Bit Console',
    canvas: {
      bg: '#000000',
      on: '#ffffff',
      grid: 'rgba(255, 255, 255, 0.12)'
    },
    tokens: {
      '--bg-main': '#121217',
      '--bg-panel': '#22222a',
      '--bg-panel-dark': '#181820',
      '--border-color': '#505066',
      '--text-primary': '#ffffff',
      '--text-muted': '#cbd5e1',
      '--accent-primary': '#ff3838', // Vibrant Nintendo Red
      '--accent-secondary': '#e60012',
      '--keypad-bg': '#2a2a36',
      '--keypad-active': '#ff3838',
      '--btn-bg': '#2a2a36',
      '--btn-border': '#585874',
      '--crt-glow': '0 0 12px rgba(255, 56, 56, 0.45)'
    }
  },

  snes: {
    id: 'snes',
    name: 'SNES Super Famicom (1991)',
    era: '16-Bit Console',
    canvas: {
      bg: '#1f1d2b',
      on: '#e2ddf7',
      grid: 'rgba(226, 221, 247, 0.05)'
    },
    tokens: {
      '--bg-main': '#181524',
      '--bg-panel': '#28243d',
      '--bg-panel-dark': '#1e1b2e',
      '--border-color': '#3d375a',
      '--text-primary': '#f5f3ff',
      '--text-muted': '#a59ecc',
      '--accent-primary': '#8b5cf6', // SNES Purple
      '--accent-secondary': '#c084fc',
      '--keypad-bg': '#352f52',
      '--keypad-active': '#8b5cf6',
      '--btn-bg': '#312b4c',
      '--btn-border': '#4c4472',
      '--crt-glow': '0 0 12px rgba(139, 92, 246, 0.35)'
    }
  },

  terminal: {
    id: 'terminal',
    name: 'Terminal VT220 (Phosphor)',
    era: 'Phosphor Green CRT',
    canvas: {
      bg: '#040d06',
      on: '#39ff14',
      grid: 'rgba(57, 255, 20, 0.08)'
    },
    tokens: {
      '--bg-main': '#020904',
      '--bg-panel': '#051509',
      '--bg-panel-dark': '#030d05',
      '--border-color': '#134e1c',
      '--text-primary': '#39ff14',
      '--text-muted': '#22c55e',
      '--accent-primary': '#39ff14',
      '--accent-secondary': '#86efac',
      '--keypad-bg': '#09250f',
      '--keypad-active': '#39ff14',
      '--btn-bg': '#0b2e13',
      '--btn-border': '#166534',
      '--crt-glow': '0 0 12px rgba(57, 255, 20, 0.45)'
    }
  },

  gameboy: {
    id: 'gameboy',
    name: 'Game Boy DMG-01 (1989)',
    era: 'Dot-Matrix LCD',
    canvas: {
      bg: '#0f380f',
      on: '#9bbc0f',
      grid: 'rgba(155, 188, 15, 0.1)'
    },
    tokens: {
      '--bg-main': '#7b855f',
      '--bg-panel': '#8d9770',
      '--bg-panel-dark': '#6e7753',
      '--border-color': '#586140',
      '--text-primary': '#0f380f',
      '--text-muted': '#306230',
      '--accent-primary': '#8b1e5c', // Game Boy Magenta Buttons
      '--accent-secondary': '#9bbc0f',
      '--keypad-bg': '#7e8862',
      '--keypad-active': '#8b1e5c',
      '--btn-bg': '#7e8862',
      '--btn-border': '#586140',
      '--crt-glow': 'none'
    }
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Synthwave',
    era: 'Neon Future',
    canvas: {
      bg: '#0d0221',
      on: '#00f5d4',
      grid: 'rgba(0, 245, 212, 0.1)'
    },
    tokens: {
      '--bg-main': '#080114',
      '--bg-panel': '#15072e',
      '--bg-panel-dark': '#0c021c',
      '--border-color': '#351566',
      '--text-primary': '#fdf4ff',
      '--text-muted': '#d946ef',
      '--accent-primary': '#00f5d4',
      '--accent-secondary': '#f43f5e',
      '--keypad-bg': '#230c4a',
      '--keypad-active': '#f43f5e',
      '--btn-bg': '#210c46',
      '--btn-border': '#4c1d95',
      '--crt-glow': '0 0 16px rgba(0, 245, 212, 0.5)'
    }
  }
};

export class ThemeManager {
  constructor(defaultTheme = 'massung') {
    this.currentThemeId = localStorage.getItem('chip8_theme') || defaultTheme;
    if (!THEMES[this.currentThemeId]) {
      this.currentThemeId = 'massung';
    }
    this.listeners = [];
    this.applyTheme(this.currentThemeId, false);
  }

  /**
   * Retorna todos los temas registrados
   */
  getAvailableThemes() {
    return Object.values(THEMES);
  }

  /**
   * Obtiene la definición del tema activo
   */
  getCurrentTheme() {
    return THEMES[this.currentThemeId];
  }

  /**
   * Aplica un tema por su ID en todo el DOM y notifica a observadores
   */
  applyTheme(themeId, notify = true) {
    const theme = THEMES[themeId];
    if (!theme) return;

    this.currentThemeId = themeId;
    localStorage.setItem('chip8_theme', themeId);

    // 1. Aplicar atributo de tema en el elemento raíz
    document.documentElement.setAttribute('data-theme', themeId);

    // 2. Inyectar variables CSS en el root
    const root = document.documentElement;
    Object.entries(theme.tokens).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    // 3. Notificar a observadores (por ejemplo, el módulo Display)
    if (notify) {
      this.listeners.forEach(fn => fn(theme));
      window.dispatchEvent(new CustomEvent('chip8-theme-changed', { detail: { theme } }));
    }
  }

  /**
   * Suscribe un observador a los cambios de tema
   */
  onThemeChange(callback) {
    this.listeners.push(callback);
  }
}
