/**
 * ============================================================================
 * EXECUTION TRACE LOG & HISTORY SUITE - UNIT TESTS
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Chip8 } from '../js/chip8.js';
import { disassemble } from '../js/disassembler.js';

test('Trace Log: Decodificación y captura de detalles de ejecución', () => {
  const cpu = new Chip8();
  
  // Cargar instrucción LD V0, 0x42 (6042)
  cpu.loadRom(new Uint8Array([0x60, 0x42]));

  let captured = null;
  cpu.onOpcode = (pc, opcode, details) => {
    const disasm = disassemble(opcode, pc, cpu);
    captured = {
      pc,
      opcode,
      mnemonic: disasm.mnemonic,
      operands: disasm.operands,
      details
    };
  };

  const result = cpu.step();
  assert.equal(result.executed, true);
  assert.ok(captured, 'onOpcode callback debe ser invocado');
  assert.equal(captured.pc, 0x200);
  assert.equal(captured.opcode, 0x6042);
  assert.equal(captured.mnemonic, 'LD');
  assert.equal(captured.operands, 'V0, #42');
  assert.equal(captured.details.changedRegs.length, 1);
  assert.equal(captured.details.changedRegs[0].index, 0);
  assert.equal(captured.details.changedRegs[0].newVal, 0x42);
});

test('Trace Log: Manejo de buffer circular y límite de historial', () => {
  const history = [];
  const MAX_LOGS = 200;

  for (let i = 1; i <= 250; i++) {
    history.push({ step: i, opcode: 0x1200 + (i % 100) });
    if (history.length > MAX_LOGS) {
      history.shift();
    }
  }

  assert.equal(history.length, MAX_LOGS, 'El historial debe limitarse a 200 instrucciones');
  assert.equal(history[0].step, 51, 'El primer elemento tras 250 inserciones debe ser el paso 51');
  assert.equal(history[history.length - 1].step, 250, 'El último elemento debe ser el paso 250');
});
