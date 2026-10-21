/**
 * ============================================================================
 * DISASSEMBLER & DIDACTIC EXPLAINER - TEST SUITE
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { disassemble, disassembleRange } from '../js/disassembler.js';

test('Disassembler: decodificación precisa de mnemónicos', () => {
  assert.equal(disassemble(0x00E0).mnemonic, 'CLS');
  assert.equal(disassemble(0x00EE).mnemonic, 'RET');
  assert.equal(disassemble(0x1200).mnemonic, 'JP');
  assert.equal(disassemble(0x2345).mnemonic, 'CALL');
  assert.equal(disassemble(0x6042).mnemonic, 'LD');
  assert.equal(disassemble(0x7005).mnemonic, 'ADD');
  assert.equal(disassemble(0x8124).mnemonic, 'ADD');
  assert.equal(disassemble(0xA450).mnemonic, 'LD');
  assert.equal(disassemble(0xD125).mnemonic, 'DRW');
});

test('Disassembler: generación didáctica en lenguaje natural', () => {
  const result = disassemble(0xD125, 0x200, {
    v: new Uint8Array([0, 10, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    i: 0x350,
    delayTimer: 0
  });

  assert.ok(result.explanation.length > 10, 'La explicación didáctica debe generarse');
  assert.equal(result.mnemonic, 'DRW');
  assert.equal(result.operands, 'V1, V2, 5');
});
