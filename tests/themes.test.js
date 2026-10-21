/**
 * ============================================================================
 * THEME MANAGER & DECOUPLED DESIGN TOKENS - TEST SUITE
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, ThemeManager } from '../js/themes.js';

test('Theme System: Todas las 6 temáticas registradas con tokens válidos', () => {
  const expectedThemes = ['massung', 'nes', 'snes', 'terminal', 'gameboy', 'cyberpunk'];
  
  expectedThemes.forEach(id => {
    const theme = THEMES[id];
    assert.ok(theme, `Tema ${id} debe existir`);
    assert.ok(theme.canvas.bg, `Tema ${id} debe tener color bg en canvas`);
    assert.ok(theme.canvas.on, `Tema ${id} debe tener color on en canvas`);
    assert.ok(theme.tokens['--bg-main'], `Tema ${id} debe tener token --bg-main`);
    assert.ok(theme.tokens['--accent-primary'], `Tema ${id} debe tener token --accent-primary`);
    assert.ok(theme.tokens['--keypad-bg'], `Tema ${id} debe tener token --keypad-bg`);
  });
});
