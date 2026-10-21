/**
 * ============================================================================
 * CHIP-8 VIRTUAL MACHINE - AUTOMATED TEST SUITE
 * ============================================================================
 * Pruebas unitarias completas de la arquitectura CHIP-8 usando Node.js test runner.
 * Valida todas las instrucciones, flags de acarreo, pila, memoria y temporizadores.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Chip8, FONTSET_START_ADDRESS, PROGRAM_START_ADDRESS, CHIP8_FONTSET } from '../js/chip8.js';

// Helper para ejecutar una instrucción concreta
function executeOpcode(vm, opcode) {
  vm.memory[vm.pc] = (opcode >> 8) & 0xFF;
  vm.memory[vm.pc + 1] = opcode & 0xFF;
  return vm.step();
}

test('1. Inicialización de la Máquina Virtual y Fontset', () => {
  const vm = new Chip8();
  assert.equal(vm.pc, PROGRAM_START_ADDRESS, 'PC debe iniciar en 0x200');
  assert.equal(vm.sp, 0, 'Stack pointer debe ser 0');
  assert.equal(vm.i, 0, 'Registro I debe ser 0');
  assert.equal(vm.delayTimer, 0, 'Delay timer debe ser 0');
  assert.equal(vm.soundTimer, 0, 'Sound timer debe ser 0');

  // Verificar que el fontset se cargó en 0x050
  for (let i = 0; i < CHIP8_FONTSET.length; i++) {
    assert.equal(vm.memory[FONTSET_START_ADDRESS + i], CHIP8_FONTSET[i], `Fontset byte ${i} correcto`);
  }
});

test('2. Carga de ROM en memoria (0x200)', () => {
  const vm = new Chip8();
  const testRom = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
  vm.loadRom(testRom);

  assert.equal(vm.memory[0x200], 0x12);
  assert.equal(vm.memory[0x201], 0x34);
  assert.equal(vm.memory[0x202], 0x56);
  assert.equal(vm.memory[0x203], 0x78);
});

test('3. Instrucciones de Carga y Aritmética Básica (6XNN, 7XNN, ANNN)', () => {
  const vm = new Chip8();

  // 6042: LD V0, 0x42
  executeOpcode(vm, 0x6042);
  assert.equal(vm.v[0], 0x42, 'V0 debe ser 0x42');

  // 7005: ADD V0, 0x05 (sin flag de carry)
  executeOpcode(vm, 0x7005);
  assert.equal(vm.v[0], 0x47, 'V0 debe ser 0x47 (0x42 + 0x05)');
  assert.equal(vm.v[0xF], 0, '7XNN no debe alterar VF');

  // A123: LD I, 0x123
  executeOpcode(vm, 0xA123);
  assert.equal(vm.i, 0x123, 'I debe ser 0x123');
});

test('4. Operaciones Lógicas y Matemáticas entre Registros (8XY0 a 8XYE)', () => {
  const vm = new Chip8();

  // Configurar V1 = 10 (0x0A), V2 = 20 (0x14)
  vm.v[1] = 10;
  vm.v[2] = 20;

  // 8120: LD V1, V2
  executeOpcode(vm, 0x8120);
  assert.equal(vm.v[1], 20, 'V1 debe recibir el valor de V2');

  // 8121: OR V1, V2
  vm.v[1] = 0b1010;
  vm.v[2] = 0b0101;
  executeOpcode(vm, 0x8121);
  assert.equal(vm.v[1], 0b1111, 'OR lógico bit a bit');

  // 8122: AND V1, V2
  vm.v[1] = 0b1110;
  vm.v[2] = 0b0110;
  executeOpcode(vm, 0x8122);
  assert.equal(vm.v[1], 0b0110, 'AND lógico bit a bit');

  // 8123: XOR V1, V2
  vm.v[1] = 0b1100;
  vm.v[2] = 0b1010;
  executeOpcode(vm, 0x8123);
  assert.equal(vm.v[1], 0b0110, 'XOR lógico bit a bit');

  // 8124: ADD V1, V2 con Acarreo (Carry)
  vm.v[1] = 200;
  vm.v[2] = 100;
  executeOpcode(vm, 0x8124);
  assert.equal(vm.v[1], 44, '200 + 100 = 300 & 0xFF -> 44');
  assert.equal(vm.v[0xF], 1, 'Carry flag VF debe ser 1');

  // 8124: ADD V1, V2 sin Acarreo
  vm.v[1] = 50;
  vm.v[2] = 20;
  executeOpcode(vm, 0x8124);
  assert.equal(vm.v[1], 70);
  assert.equal(vm.v[0xF], 0, 'Carry flag VF debe ser 0');

  // 8125: SUB V1, V2 (NOT borrow)
  vm.v[1] = 50;
  vm.v[2] = 20;
  executeOpcode(vm, 0x8125);
  assert.equal(vm.v[1], 30);
  assert.equal(vm.v[0xF], 1, 'VF = 1 cuando Vx >= Vy');

  vm.v[1] = 20;
  vm.v[2] = 50;
  executeOpcode(vm, 0x8125);
  assert.equal(vm.v[1], 226, '(20 - 50) & 0xFF = 226');
  assert.equal(vm.v[0xF], 0, 'VF = 0 cuando Vx < Vy (hay préstamo)');

  // 8116: SHR V1, V1 (Shift Right de V1)
  vm.v[1] = 0b00001011; // 11
  executeOpcode(vm, 0x8116);
  assert.equal(vm.v[1], 5, '11 >> 1 = 5');
  assert.equal(vm.v[0xF], 1, 'VF debe ser el bit menos significativo saliente (1)');

  // 811E: SHL V1, V1 (Shift Left de V1)
  vm.v[1] = 0b10000001;
  executeOpcode(vm, 0x811E);
  assert.equal(vm.v[1], 2, '(129 << 1) & 0xFF = 2');
  assert.equal(vm.v[0xF], 1, 'VF debe ser el bit más significativo saliente (1)');
});

test('5. Saltos, Subrutinas y Pila (1NNN, 2NNN, 00EE)', () => {
  const vm = new Chip8();

  // 1300: JP 0x300
  executeOpcode(vm, 0x1300);
  assert.equal(vm.pc, 0x300, 'Salto incondicional a 0x300');

  // 2400: CALL 0x400
  executeOpcode(vm, 0x2400);
  assert.equal(vm.pc, 0x400, 'PC debe estar en 0x400');
  assert.equal(vm.sp, 1, 'Stack pointer debe ser 1');
  assert.equal(vm.stack[0], 0x302, 'La dirección de retorno guardada debe ser 0x302');

  // 00EE: RET
  executeOpcode(vm, 0x00EE);
  assert.equal(vm.pc, 0x302, 'RET debe recuperar el PC de la pila');
  assert.equal(vm.sp, 0, 'Stack pointer debe volver a 0');
});

test('6. Saltos Condicionales (3XNN, 4XNN, 5XY0, 9XY0)', () => {
  const vm = new Chip8();
  vm.v[0] = 0x55;
  vm.v[1] = 0x55;
  vm.v[2] = 0xAA;

  // 3055: SE V0, 0x55 (Iguales -> salta 2 bytes extra)
  const pcBefore = vm.pc;
  executeOpcode(vm, 0x3055);
  assert.equal(vm.pc, pcBefore + 4, 'Debe saltar la siguiente instrucción');

  // 4055: SNE V0, 0x55 (Iguales -> no salta)
  const pcBefore2 = vm.pc;
  executeOpcode(vm, 0x4055);
  assert.equal(vm.pc, pcBefore2 + 2, 'No debe saltar');

  // 5010: SE V0, V1 (V0 == V1 -> salta)
  const pcBefore3 = vm.pc;
  executeOpcode(vm, 0x5010);
  assert.equal(vm.pc, pcBefore3 + 4, 'Debe saltar');

  // 9020: SNE V0, V2 (V0 != V2 -> salta)
  const pcBefore4 = vm.pc;
  executeOpcode(vm, 0x9020);
  assert.equal(vm.pc, pcBefore4 + 4, 'Debe saltar');
});

test('7. BCD y Volcado/Carga de Memoria (FX33, FX55, FX65)', () => {
  const vm = new Chip8({ loadStore: false });
  vm.i = 0x300;
  vm.v[0] = 234;

  // FX33: BCD de 234 -> memoria[I]=2, memoria[I+1]=3, memoria[I+2]=4
  executeOpcode(vm, 0xF033);
  assert.equal(vm.memory[0x300], 2);
  assert.equal(vm.memory[0x301], 3);
  assert.equal(vm.memory[0x302], 4);

  // FX55: Guardar V0 a V3 en memoria
  vm.v[0] = 0x11;
  vm.v[1] = 0x22;
  vm.v[2] = 0x33;
  vm.v[3] = 0x44;
  vm.i = 0x400;
  executeOpcode(vm, 0xF355);
  assert.equal(vm.memory[0x400], 0x11);
  assert.equal(vm.memory[0x401], 0x22);
  assert.equal(vm.memory[0x402], 0x33);
  assert.equal(vm.memory[0x403], 0x44);

  // FX65: Leer V0 a V3 de memoria
  vm.v.fill(0);
  vm.i = 0x400;
  executeOpcode(vm, 0xF365);
  assert.equal(vm.v[0], 0x11);
  assert.equal(vm.v[1], 0x22);
  assert.equal(vm.v[2], 0x33);
  assert.equal(vm.v[3], 0x44);
});

test('8. Renderizado Gráfico Sprite XOR y Detección de Colisión (DXYN)', () => {
  const vm = new Chip8();
  // Colocar sprite de 1 byte (0b11110000 = 0xF0) en memoria 0x300
  vm.memory[0x300] = 0xF0;
  vm.i = 0x300;
  vm.v[0] = 0; // X = 0
  vm.v[1] = 0; // Y = 0

  // D011: DRW V0, V1, 1 (Dibujar 1 fila en 0, 0)
  executeOpcode(vm, 0xD011);
  assert.equal(vm.v[0xF], 0, 'No debe haber colisión en pantalla limpia');
  assert.equal(vm.display[0], 1, 'Pixel (0,0) debe estar activo');
  assert.equal(vm.display[1], 1, 'Pixel (1,0) debe estar activo');
  assert.equal(vm.display[2], 1, 'Pixel (2,0) debe estar activo');
  assert.equal(vm.display[3], 1, 'Pixel (3,0) debe estar activo');
  assert.equal(vm.display[4], 0, 'Pixel (4,0) debe estar apagado');

  // Dibujar exactamente el mismo sprite de nuevo encima (XOR -> se apagan)
  executeOpcode(vm, 0xD011);
  assert.equal(vm.v[0xF], 1, 'Debe detectar colisión (VF = 1)');
  assert.equal(vm.display[0], 0, 'Pixel (0,0) debe apagarse por XOR');
});

test('9. Temporizadores a 60 Hz y Serialización (Save States)', () => {
  const vm = new Chip8();
  vm.delayTimer = 10;
  vm.soundTimer = 5;

  vm.tickTimers();
  assert.equal(vm.delayTimer, 9);
  assert.equal(vm.soundTimer, 4);

  // Serialización y restauración
  vm.v[5] = 99;
  vm.pc = 0x550;
  const snapshot = vm.serialize();

  const newVm = new Chip8();
  newVm.deserialize(snapshot);

  assert.equal(newVm.v[5], 99, 'Registro V5 restaurado');
  assert.equal(newVm.pc, 0x550, 'PC restaurado');
  assert.equal(newVm.delayTimer, 9, 'Delay timer restaurado');
});

test('10. Modos de Compatibilidad y Quirks (COSMAC VIP vs SCHIP)', () => {
  // Test Quirks de Shift (SCHIP: desplaza VX en lugar de tomar VY)
  const vmSchip = new Chip8({ shift: true });
  vmSchip.v[1] = 16;
  vmSchip.v[2] = 99; // V2 no debería afectar
  executeOpcode(vmSchip, 0x8126); // 8XY6 con X=1, Y=2
  assert.equal(vmSchip.v[1], 8, 'En modo SCHIP desplaza V1 directamente (16 >> 1 = 8)');

  // Test Quirks de Load/Store (SCHIP: no modifica I)
  const vmSchipLs = new Chip8({ loadStore: true });
  vmSchipLs.i = 0x600;
  executeOpcode(vmSchipLs, 0xF355); // Almacena V0-V3
  assert.equal(vmSchipLs.i, 0x600, 'En modo SCHIP el registro I permanece inalterado');

  // En modo COSMAC VIP clásico: I se incrementa en X + 1
  const vmVipLs = new Chip8({ loadStore: false });
  vmVipLs.i = 0x600;
  executeOpcode(vmVipLs, 0xF355);
  assert.equal(vmVipLs.i, 0x604, 'En modo VIP I se incrementa en X + 1 (0x600 + 4 = 0x604)');
});

test('11. Resta Inversa: SUBN Vx, Vy (8XY7)', () => {
  const vm = new Chip8();

  // 8127: SUBN V1, V2 -> V1 = V2 - V1; VF = 1 si V2 >= V1 (sin préstamo)
  vm.v[1] = 30;
  vm.v[2] = 50;
  executeOpcode(vm, 0x8127);
  assert.equal(vm.v[1], 20, 'V1 = 50 - 30 = 20');
  assert.equal(vm.v[0xF], 1, 'VF = 1 porque Vy >= Vx');

  // Caso con préstamo: V2 < V1 -> VF = 0
  vm.v[1] = 50;
  vm.v[2] = 20;
  executeOpcode(vm, 0x8127);
  assert.equal(vm.v[1], (20 - 50 + 256) & 0xFF, 'V1 = (20 - 50) & 0xFF = 226');
  assert.equal(vm.v[0xF], 0, 'VF = 0 porque Vy < Vx (hay préstamo)');
});

test('12. Instrucciones de Teclado (EX9E, EXA1, FX0A)', () => {
  const vm = new Chip8();
  vm.v[0] = 0x5; // Tecla 5

  // 1. EX9E (SKP Vx): salta si la tecla en Vx está pulsada
  vm.keys[5] = 0; // Tecla no pulsada
  let pcBefore = vm.pc;
  executeOpcode(vm, 0xE09E);
  assert.equal(vm.pc, pcBefore + 2, 'No debe saltar si la tecla NO está pulsada');

  vm.keys[5] = 1; // Pulsar tecla
  pcBefore = vm.pc;
  executeOpcode(vm, 0xE09E);
  assert.equal(vm.pc, pcBefore + 4, 'Debe saltar (PC += 4) si la tecla SÍ está pulsada');

  // 2. EXA1 (SKNP Vx): salta si la tecla en Vx NO está pulsada
  vm.keys[5] = 1;
  pcBefore = vm.pc;
  executeOpcode(vm, 0xE0A1);
  assert.equal(vm.pc, pcBefore + 2, 'No debe saltar si la tecla está pulsada');

  vm.keys[5] = 0;
  pcBefore = vm.pc;
  executeOpcode(vm, 0xE0A1);
  assert.equal(vm.pc, pcBefore + 4, 'Debe saltar si la tecla NO está pulsada');

  // 3. FX0A (LD Vx, K): espera tecla y bloquea CPU
  executeOpcode(vm, 0xF10A); // Esperar tecla en V1
  assert.equal(vm.waitingForKey, true, 'CPU debe entrar en estado waitingForKey');
  assert.equal(vm.keyRegister, 1, 'Registro de destino debe ser V1');

  // Mientras espera tecla, step() no debe ejecutar instrucciones
  const stepResult = vm.step();
  assert.equal(stepResult.executed, false, 'No ejecuta instrucciones mientras espera');

  // Pulsar tecla 0xC
  vm.setKeyDown(0xC);
  assert.equal(vm.waitingForKey, false, 'CPU debe desbloquearse');
  assert.equal(vm.v[1], 0xC, 'V1 debe recibir el valor 0xC de la tecla pulsada');
});

test('13. Temporizadores y Punteros Especiales (FX07, FX1E, FX29)', () => {
  const vm = new Chip8();

  // FX07: LD Vx, DT
  vm.delayTimer = 45;
  executeOpcode(vm, 0xF207); // V2 = DT
  assert.equal(vm.v[2], 45, 'V2 debe recibir el valor actual del Delay Timer');

  // FX1E: ADD I, Vx
  vm.i = 0x200;
  vm.v[3] = 0x50;
  executeOpcode(vm, 0xF31E);
  assert.equal(vm.i, 0x250, 'I debe ser 0x200 + 0x50 = 0x250');

  // FX29: LD F, Vx (Apunta I a la fuente de Vx)
  // Carácter 'A' (10 decimal). Fontset inicia en 0x050, cada sprite mide 5 bytes: 0x050 + 10 * 5 = 0x082 (130)
  vm.v[4] = 0xA;
  executeOpcode(vm, 0xF429);
  assert.equal(vm.i, 0x050 + (10 * 5), 'I debe apuntar a la dirección del sprite del dígito A');
});

test('14. Salto con Desplazamiento (BNNN con V0 y BXNN quirk)', () => {
  // Modo COSMAC VIP estándar: BNNN salta a NNN + V0
  const vmVip = new Chip8({ jump: false });
  vmVip.v[0] = 0x15;
  executeOpcode(vmVip, 0xB300);
  assert.equal(vmVip.pc, 0x315, 'PC debe ser 0x300 + 0x15 = 0x315');

  // Modo SCHIP: BXNN salta a XNN + Vx
  const vmSchip = new Chip8({ jump: true });
  vmSchip.v[3] = 0x20;
  executeOpcode(vmSchip, 0xB350); // B + X(3) + NN(50) -> salta a 0x350 + V3
  assert.equal(vmSchip.pc, 0x370, 'PC debe ser 0x350 + 0x20 = 0x370');
});

test('15. Número Aleatorio con Máscara (CXNN)', () => {
  const vm = new Chip8();
  // CX00: RND V0, 0x00 -> Cualquier número AND 0x00 debe dar 0x00
  executeOpcode(vm, 0xC000);
  assert.equal(vm.v[0], 0x00, 'RND con máscara 0x00 debe dar siempre 0');

  // CX0F: RND V1, 0x0F -> Debe ser <= 15
  executeOpcode(vm, 0xC10F);
  assert.ok(vm.v[1] <= 0x0F, 'RND con máscara 0x0F debe ser menor o igual a 15');
});

test('16. Protección de Límites de Pila (Stack Overflow y Stack Underflow)', () => {
  const vm = new Chip8();

  // 1. Stack Underflow: RET con SP = 0 debe lanzar error
  assert.throws(() => {
    executeOpcode(vm, 0x00EE);
  }, /Stack Underflow/, 'RET con SP = 0 debe lanzar error');

  // 2. Stack Overflow: 16 CALLs son permitidos; el 17 debe desbordar
  for (let i = 0; i < 16; i++) {
    executeOpcode(vm, 0x2300 + (i * 2));
  }
  assert.equal(vm.sp, 16, 'SP debe estar al máximo (16)');

  assert.throws(() => {
    executeOpcode(vm, 0x2500);
  }, /Stack Overflow/, 'El 17º CALL debe lanzar error de desbordamiento');
});
