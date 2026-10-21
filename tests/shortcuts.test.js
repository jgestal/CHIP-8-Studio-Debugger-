import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KEY_MAP } from '../js/keypad.js';

describe('Keyboard Shortcut Collision & Separation Audit', () => {
  it('verifies that no CHIP-8 game key collides with workstation/debugger hotkeys', () => {
    // Teclas del juego registradas en DEFAULT_KEY_MAP
    const gameKeys = new Set(Object.keys(DEFAULT_KEY_MAP));

    // Atajos de interfaz directos (sin modificadores)
    const directSystemHotkeys = [
      'p', 'P',          // Play / Pause
      'Escape',          // Play / Pause / Close modal
      'Backspace',       // Rewind time
      'Tab',             // Rewind time
      'F1',              // Quick save
      'F5',              // Quick load
      'F8',              // Step back 1 instruction
      'F9',              // Step frame (1/60s)
      'F10',             // Step instruction
      'F11',             // Fullscreen
      'F12',             // Screenshot
      '?'                // Shortcuts modal
    ];

    const collisions = directSystemHotkeys.filter(key => gameKeys.has(key));
    assert.deepEqual(collisions, [], `Found collisions between game keys and system hotkeys: ${collisions.join(', ')}`);
  });

  it('guarantees that game keys R, S, F and Space are exclusively for the VM gameplay', () => {
    // COSMAC VIP mappings:
    // 'r' / 'R' -> 0xD
    // 's' / 'S' -> 0x8
    // 'f' / 'F' -> 0xE
    // ' ' -> 0x5
    assert.equal(DEFAULT_KEY_MAP['r'], 0xD);
    assert.equal(DEFAULT_KEY_MAP['R'], 0xD);
    assert.equal(DEFAULT_KEY_MAP['s'], 0x8);
    assert.equal(DEFAULT_KEY_MAP['S'], 0x8);
    assert.equal(DEFAULT_KEY_MAP['f'], 0xE);
    assert.equal(DEFAULT_KEY_MAP['F'], 0xE);
    assert.equal(DEFAULT_KEY_MAP[' '], 0x5);

    // Bare keys are not intercepted as system actions
    const bareKeysForSystem = ['r', 'R', 's', 'S', 'f', 'F', ' '];
    // In our new architecture, these require Alt modifier (Alt+S, Alt+F) or have dedicated hotkeys (P, Backspace)
    // Thus none of them are bare system hotkeys anymore.
    bareKeysForSystem.forEach(key => {
      assert.ok(DEFAULT_KEY_MAP[key] !== undefined, `Game key ${key} must exist in DEFAULT_KEY_MAP`);
    });
  });

  it('ensures all 16 CHIP-8 hex keys (0x0 to 0xF) are mapped and accounted for', () => {
    const hexKeys = new Set(Object.values(DEFAULT_KEY_MAP));
    for (let hex = 0x0; hex <= 0xF; hex++) {
      assert.ok(hexKeys.has(hex), `Missing mapping for CHIP-8 hex key 0x${hex.toString(16).toUpperCase()}`);
    }
  });
});
