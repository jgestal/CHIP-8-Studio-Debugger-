/**
 * ============================================================================
 * CHIP-8 DISASSEMBLER & DIDACTIC EXPLAINER
 * ============================================================================
 * Desensamblador en tiempo real de instrucciones binarias CHIP-8 con generador
 * de explicaciones didácticas en lenguaje natural (Español / Inglés).
 */

import { t } from './i18n.js';

/**
 * Convierte un número a formato hexadecimal con padding
 */
export function toHex(num, digits = 2) {
  return (num || 0).toString(16).toUpperCase().padStart(digits, '0');
}

/**
 * Desensambla un opcode de 16 bits y genera la explicación en lenguaje natural
 * @param {number} opcode - Valor de 16 bits de la instrucción
 * @param {number} address - Dirección de memoria actual (PC)
 * @param {object} state - Estado opcional de la máquina virtual para interpolación en vivo
 */
export function disassemble(opcode, address = 0x200, state = null) {
  const prefix = (opcode & 0xF000) >> 12;
  const x      = (opcode & 0x0F00) >> 8;
  const y      = (opcode & 0x00F0) >> 4;
  const n      =  opcode & 0x000F;
  const nn     =  opcode & 0x00FF;
  const nnn    =  opcode & 0x0FFF;

  let mnemonic = 'UNKNOWN';
  let operands = '';
  let explKey = 'UNKNOWN';
  let params = {
    x: x.toString(16).toUpperCase(),
    y: y.toString(16).toUpperCase(),
    n: n.toString(),
    byte: `#${toHex(nn, 2)}`,
    addr: `#${toHex(nnn, 3)}`,
    vxVal: state ? `#${toHex(state.v[x], 2)}` : '?',
    vyVal: state ? `#${toHex(state.v[y], 2)}` : '?',
    vfVal: state ? `#${toHex(state.v[0xF], 2)}` : '?',
    v0Val: state ? `#${toHex(state.v[0], 2)}` : '?',
    iVal: state ? `#${toHex(state.i, 4)}` : '?',
    dtVal: state ? state.delayTimer.toString() : '?'
  };

  switch (prefix) {
    case 0x0:
      if (opcode === 0x00E0) {
        mnemonic = 'CLS';
        explKey = 'CLS';
      } else if (opcode === 0x00EE) {
        mnemonic = 'RET';
        explKey = 'RET';
      } else {
        mnemonic = 'SYS';
        operands = `#${toHex(nnn, 3)}`;
        explKey = 'UNKNOWN';
      }
      break;

    case 0x1:
      mnemonic = 'JP';
      operands = `#${toHex(nnn, 3)}`;
      explKey = 'JP_ADDR';
      break;

    case 0x2:
      mnemonic = 'CALL';
      operands = `#${toHex(nnn, 3)}`;
      explKey = 'CALL_ADDR';
      break;

    case 0x3:
      mnemonic = 'SE';
      operands = `V${x.toString(16).toUpperCase()}, #${toHex(nn, 2)}`;
      explKey = 'SE_VX_BYTE';
      break;

    case 0x4:
      mnemonic = 'SNE';
      operands = `V${x.toString(16).toUpperCase()}, #${toHex(nn, 2)}`;
      explKey = 'SNE_VX_BYTE';
      break;

    case 0x5:
      mnemonic = 'SE';
      operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
      explKey = 'SE_VX_VY';
      break;

    case 0x6:
      mnemonic = 'LD';
      operands = `V${x.toString(16).toUpperCase()}, #${toHex(nn, 2)}`;
      explKey = 'LD_VX_BYTE';
      break;

    case 0x7:
      mnemonic = 'ADD';
      operands = `V${x.toString(16).toUpperCase()}, #${toHex(nn, 2)}`;
      explKey = 'ADD_VX_BYTE';
      break;

    case 0x8:
      switch (n) {
        case 0x0:
          mnemonic = 'LD';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'LD_VX_VY';
          break;
        case 0x1:
          mnemonic = 'OR';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'OR_VX_VY';
          break;
        case 0x2:
          mnemonic = 'AND';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'AND_VX_VY';
          break;
        case 0x3:
          mnemonic = 'XOR';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'XOR_VX_VY';
          break;
        case 0x4:
          mnemonic = 'ADD';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'ADD_VX_VY';
          break;
        case 0x5:
          mnemonic = 'SUB';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'SUB_VX_VY';
          break;
        case 0x6:
          mnemonic = 'SHR';
          operands = `V${x.toString(16).toUpperCase()}`;
          explKey = 'SHR_VX';
          break;
        case 0x7:
          mnemonic = 'SUBN';
          operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
          explKey = 'SUBN_VX_VY';
          break;
        case 0xE:
          mnemonic = 'SHL';
          operands = `V${x.toString(16).toUpperCase()}`;
          explKey = 'SHL_VX';
          break;
        default:
          mnemonic = '???';
      }
      break;

    case 0x9:
      mnemonic = 'SNE';
      operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
      explKey = 'SNE_VX_VY';
      break;

    case 0xA:
      mnemonic = 'LD';
      operands = `I, #${toHex(nnn, 3)}`;
      explKey = 'LD_I_ADDR';
      break;

    case 0xB:
      mnemonic = 'JP';
      operands = `V0, #${toHex(nnn, 3)}`;
      explKey = 'JP_V0_ADDR';
      break;

    case 0xC:
      mnemonic = 'RND';
      operands = `V${x.toString(16).toUpperCase()}, #${toHex(nn, 2)}`;
      explKey = 'RND_VX_BYTE';
      break;

    case 0xD:
      mnemonic = 'DRW';
      operands = `V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}, ${n}`;
      explKey = 'DRW_VX_VY_N';
      break;

    case 0xE:
      if (nn === 0x9E) {
        mnemonic = 'SKP';
        operands = `V${x.toString(16).toUpperCase()}`;
        explKey = 'SKP_VX';
      } else if (nn === 0xA1) {
        mnemonic = 'SKNP';
        operands = `V${x.toString(16).toUpperCase()}`;
        explKey = 'SKNP_VX';
      }
      break;

    case 0xF:
      switch (nn) {
        case 0x07:
          mnemonic = 'LD';
          operands = `V${x.toString(16).toUpperCase()}, DT`;
          explKey = 'LD_VX_DT';
          break;
        case 0x0A:
          mnemonic = 'LD';
          operands = `V${x.toString(16).toUpperCase()}, K`;
          explKey = 'LD_VX_K';
          break;
        case 0x15:
          mnemonic = 'LD';
          operands = `DT, V${x.toString(16).toUpperCase()}`;
          explKey = 'LD_DT_VX';
          break;
        case 0x18:
          mnemonic = 'LD';
          operands = `ST, V${x.toString(16).toUpperCase()}`;
          explKey = 'LD_ST_VX';
          break;
        case 0x1E:
          mnemonic = 'ADD';
          operands = `I, V${x.toString(16).toUpperCase()}`;
          explKey = 'ADD_I_VX';
          break;
        case 0x29:
          mnemonic = 'LD';
          operands = `F, V${x.toString(16).toUpperCase()}`;
          explKey = 'LD_F_VX';
          break;
        case 0x33:
          mnemonic = 'LD';
          operands = `B, V${x.toString(16).toUpperCase()}`;
          explKey = 'LD_B_VX';
          break;
        case 0x55:
          mnemonic = 'LD';
          operands = `[I], V${x.toString(16).toUpperCase()}`;
          explKey = 'LD_I_VX';
          break;
        case 0x65:
          mnemonic = 'LD';
          operands = `V${x.toString(16).toUpperCase()}, [I]`;
          explKey = 'LD_VX_I';
          break;
      }
      break;
  }

  const naturalExplanation = t(`opcodes.${explKey}`, params);

  return {
    address,
    addressHex: toHex(address, 4),
    opcode,
    opcodeHex: toHex(opcode, 4),
    mnemonic,
    operands,
    text: `${mnemonic.padEnd(5, ' ')} ${operands}`,
    explanation: naturalExplanation,
    explKey
  };
}

/**
 * Desensambla un rango de memoria alrededor del PC actual
 */
export function disassembleRange(memory, startAddr, count = 20, currentPc = 0x200, state = null) {
  const instructions = [];
  const start = Math.max(0, startAddr & ~1); // Alinear a dirección par

  for (let idx = 0; idx < count; idx++) {
    const addr = start + (idx * 2);
    if (addr >= memory.length - 1) break;

    const opcode = (memory[addr] << 8) | memory[addr + 1];
    const item = disassemble(opcode, addr, addr === currentPc ? state : null);
    item.isCurrent = addr === currentPc;
    instructions.push(item);
  }

  return instructions;
}
