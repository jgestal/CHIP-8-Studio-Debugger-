/**
 * ============================================================================
 * CHIP-8 STUDIO & DEBUGGER - i18n MODULE (INTERNATIONALIZATION)
 * ============================================================================
 * Reactive bilingual translation system with ENGLISH as the primary default.
 * Provides complete localized UI labels, tooltips, and educational opcode explanations.
 */

export const translations = {
  en: {
    appTitle: "CHIP-8 STUDIO",
    appSubtitle: "Educational Virtual Machine & Debugger",
    
    // Global Header & Toolbar
    openLocalRom: "Open ROM (.ch8)",
    selectRom: "Select ROM...",
    themeLabel: "Theme",
    crtFilter: "CRT Filter",
    saveState: "Save States",
    fullscreen: "Fullscreen",
    arcadeMode: "Arcade Mode",
    debugMode: "Debug Mode",

    // Playback Dashboard (Under-Canvas Controls)
    play: "Resume",
    pause: "Pause",
    step: "Step",
    stepBack: "Step Back",
    stepFrame: "Frame",
    reset: "Reset",
    rewind: "Rewind",
    rewinding: "Rewinding...",
    speed: "CPU Speed",
    cyclesPerSec: "cycles/sec",

    // Tooltips
    tooltipPlay: "Resume / Pause execution [P / Esc]",
    tooltipStep: "Execute single instruction [F10]",
    tooltipStepBack: "Step back one instruction [F8]",
    tooltipStepFrame: "Advance one frame 1/60s [F9]",
    tooltipReset: "Restart current ROM",
    tooltipRewind: "Hold or press Backspace to Rewind Time [Backspace]",
    tooltipRewindPaused: "Live Rewind is available only while running [Backspace]",
    tooltipSpeed: "Adjust CPU clock frequency (Hz)",
    tooltipAudio: "Toggle audio beeper mute/unmute",
    tooltipFullscreen: "Toggle full-screen display [F11 / Alt+Enter]",
    tooltipCrt: "Toggle retro CRT scanlines and phosphor bloom",
    tooltipTheme: "Switch visual aesthetic & design theme",
    tooltipTabPrev: "Previous tab",
    tooltipTabNext: "Next tab",
    tooltipTabMenu: "View all 7 inspector tabs",

    // Quadrant Titles
    quadrantDisplay: "1. DISPLAY MONITOR (64×32)",
    quadrantControls: "GAME CONTROLS & TELEMETRY",
    quadrantKeypad: "CHIP-8 4×4 HEX KEYPAD",
    quadrantDisasm: "2. DISASSEMBLER & STEP ENGINE",
    quadrantConsole: "3. TTY CONSOLE & ROM EXPLORER",
    quadrantHardware: "4. HARDWARE REGISTERS & RAM",
    
    // Telemetry & Status
    statusRunning: "RUNNING",
    statusPaused: "PAUSED",
    statusStepping: "STEPPING",
    statusRewind: "REWINDING",
    fpsLabel: "FPS",
    cpuLabel: "CPU",
    soundLabel: "AUDIO",
    soundOn: "ACTIVE",
    soundOff: "MUTE",
    
    // Disassembler & Explainer
    breakpointsTitle: "Breakpoints",
    noBreakpoints: "No active breakpoints. Click an address to toggle one.",
    didacticTitle: "Live Didactic Explanation",
    didacticEmpty: "Pause or step through execution to inspect instruction mechanics in detail.",
    regChanged: "Modified",
    
    // Console & ROM details
    tabConsole: "TTY Console",
    tabRoms: "ROM Catalog",
    tabRomInfo: "ROM Details",
    clearConsole: "Clear",
    searchRoms: "Search ROM...",
    allCategories: "All Categories",
    catGames: "Games",
    catDemos: "Demos",
    catPrograms: "Programs",
    catTests: "Official Tests",
    romTitle: "Title",
    romAuthor: "Author",
    romYear: "Year",
    romSize: "Size",
    romControls: "Recommended Controls",
    romDesc: "Description",
    dropRomHelp: "or drag & drop a .ch8 file here",
    
    tabRegisters: "Registers & Stack",
    tabHistory: "Trace Log",
    tabMemory: "RAM Heatmap (4KB)",
    tabSprites: "Sprite Viewer",
    autoScroll: "Auto-scroll",
    clearTrace: "Clear Log",
    instructionsCount: "instructions executed",
    screenshotTooltip: "Capture Screenshot (PNG) [F12 / Alt+S]",
    panelMinimize: "Minimize / Expand panel",
    romCategory: "Category",
    shortcutsBtn: "Keys",
    shortcutsTitle: "Keyboard Controls & Shortcut Mapping",
    gamePadTitle: "🎮 Game Controls (CHIP-8 4×4 Hex Pad)",
    gamePadDesc: "Dedicated game inputs with zero interface conflict.",
    sysShortcutsTitle: "⚡ Interface & Debugger Shortcuts",
    sysShortcutsDesc: "Workstation controls mapped without game key collision.",
    scPause: "Play / Pause Execution",
    scRewind: "Hold to Rewind Time (Live Rewind)",
    scStep: "Step Single Instruction",
    scStepBack: "Step Back One Instruction",
    scStepFrame: "Advance Frame (1/60s)",
    scFullscreen: "Toggle Fullscreen Mode",
    scScreenshot: "Capture Screenshot (PNG)",
    scSave: "Quick Save State (Slot 1)",
    scLoad: "Quick Load State (Slot 1)",
    stepBackLog: "Stepped back one instruction",
    noStepBack: "No previous instructions available to step back to",
    stackTitle: "Stack",
    keypadTitle: "4×4 Hex Keypad (COSMAC VIP)",
    keypadHelp: "PC mapping: 1-4, Q-R, A-F, Z-V or Gamepad",
    gamepadConnected: "Gamepad Connected",
    gamepadDisconnected: "Gamepad Disconnected",
    spriteViewerTitle: "Sprite at Address I:",
    spriteViewerHelp: "Graphical preview of memory bytes starting at pointer I",
    heatmapLegend: "Green: Executed Code | Blue: Data Read | Red: Memory Write | Gray: Untouched",
    
    // Save States Modal
    slot: "Slot",
    emptySlot: "Empty Slot",
    saveToSlot: "Save",
    loadFromSlot: "Load",
    exportState: "Export JSON",
    importState: "Import JSON",
    
    // Audio Modal
    audioTitle: "Web Audio Synthesizer",
    waveform: "Waveform",
    square: "Square (Authentic)",
    sine: "Sine",
    triangle: "Triangle",
    sawtooth: "Sawtooth",
    frequency: "Tone (Frequency)",
    volume: "Volume",
    
    // Instructions Explanations (Natural Language)
    opcodes: {
      CLS: "Clears the entire display screen (sets all 64×32 pixels to 0/black).",
      RET: "Returns from a subroutine: pops the return address off the stack and updates PC.",
      JP_ADDR: "Unconditional jump: points program counter (PC) directly to address {addr}.",
      CALL_ADDR: "Calls subroutine at {addr}: pushes current PC to the stack and increments SP.",
      SE_VX_BYTE: "Compares V{x} ({vxVal}) with {byte}. If equal, skips the next instruction (PC += 2).",
      SNE_VX_BYTE: "Compares V{x} ({vxVal}) with {byte}. If NOT equal, skips the next instruction (PC += 2).",
      SE_VX_VY: "Compares V{x} ({vxVal}) with V{y} ({vyVal}). If equal, skips the next instruction.",
      LD_VX_BYTE: "Loads immediate value {byte} directly into register V{x}.",
      ADD_VX_BYTE: "Adds {byte} to register V{x} ({vxVal}) without modifying carry flag VF.",
      LD_VX_VY: "Copies the contents of register V{y} ({vyVal}) into register V{x}.",
      OR_VX_VY: "Performs bitwise OR between V{x} ({vxVal}) and V{y} ({vyVal}), storing result in V{x}.",
      AND_VX_VY: "Performs bitwise AND between V{x} ({vxVal}) and V{y} ({vyVal}), storing result in V{x}.",
      XOR_VX_VY: "Performs bitwise XOR between V{x} ({vxVal}) and V{y} ({vyVal}), storing result in V{x}.",
      ADD_VX_VY: "Adds V{y} ({vyVal}) to V{x} ({vxVal}). Sets VF=1 if carry occurs (>255), otherwise VF=0.",
      SUB_VX_VY: "Subtracts V{y} ({vyVal}) from V{x} ({vxVal}). Sets VF=1 if NO borrow (Vx >= Vy), else VF=0.",
      SHR_VX: "Shifts V{x} ({vxVal}) 1 bit to the right. Stores discarded least significant bit in VF ({vfVal}).",
      SUBN_VX_VY: "Calculates V{y} ({vyVal}) minus V{x} ({vxVal}). Sets VF=1 if Vy >= Vx, else VF=0.",
      SHL_VX: "Shifts V{x} ({vxVal}) 1 bit to the left. Stores discarded most significant bit in VF ({vfVal}).",
      SNE_VX_VY: "Compares V{x} ({vxVal}) with V{y} ({vyVal}). If different, skips the next instruction.",
      LD_I_ADDR: "Sets index address register I to memory address {addr}.",
      JP_V0_ADDR: "Jump with offset: jumps to address {addr} + V0 ({v0Val}).",
      RND_VX_BYTE: "Generates a random byte (0-255), applies bitwise AND with {byte}, and stores into V{x}.",
      DRW_VX_VY_N: "Draws a {n}-byte tall sprite at (X: V{x}={vxVal}, Y: V{y}={vyVal}) from memory I ({iVal}). Sets VF=1 if any pixel is erased (collision).",
      SKP_VX: "Checks if the key matching the hex value in V{x} ({vxVal}) is pressed. If so, skips next instruction.",
      SKNP_VX: "Checks if the key in V{x} ({vxVal}) is NOT pressed. If not pressed, skips next instruction.",
      LD_VX_DT: "Reads current value of delay timer (DT={dtVal}) and copies it into V{x}.",
      LD_VX_K: "Halts CPU until a key is pressed, then stores the key value into V{x}.",
      LD_DT_VX: "Loads value of V{x} ({vxVal}) into delay timer (DT). Decrements at 60 Hz.",
      LD_ST_VX: "Loads value of V{x} ({vxVal}) into sound timer (ST). Beeper plays while ST > 0.",
      ADD_I_VX: "Adds value of V{x} ({vxVal}) to index address register I ({iVal}).",
      LD_F_VX: "Points I to the built-in 5-byte font character matching the hex digit in V{x} ({vxVal}).",
      LD_B_VX: "Stores Binary Coded Decimal (BCD) of V{x} ({vxVal}) at memory[I], memory[I+1], memory[I+2].",
      LD_I_VX: "Dumps registers V0 through V{x} into sequential memory starting at address I ({iVal}).",
      LD_VX_I: "Fills registers V0 through V{x} from sequential memory starting at address I ({iVal}).",
      UNKNOWN: "Unknown or invalid CHIP-8 instruction."
    }
  },

  es: {
    appTitle: "CHIP-8 STUDIO",
    appSubtitle: "Suite Didáctica de Emulación Retro",
    
    // Cabecera y Barra Global
    openLocalRom: "Abrir ROM (.ch8)",
    selectRom: "Seleccionar ROM...",
    themeLabel: "Tema",
    crtFilter: "Filtro CRT",
    saveState: "Partidas",
    fullscreen: "Pantalla Completa",
    arcadeMode: "Modo Arcade",
    debugMode: "Modo Debug",

    // Panel de Control del Juego (Bajo el Canvas)
    play: "Reanudar",
    pause: "Pausar",
    step: "Paso",
    stepBack: "Paso Atrás",
    stepFrame: "Frame",
    reset: "Reiniciar",
    rewind: "Rebobinar",
    rewinding: "Rebobinando...",
    speed: "Velocidad CPU",
    cyclesPerSec: "ciclos/seg",

    // Tooltips
    tooltipPlay: "Reanudar / Pausar ejecución [P / Esc]",
    tooltipStep: "Ejecutar 1 instrucción paso a paso [F10]",
    tooltipStepBack: "Retroceder una instrucción [F8]",
    tooltipStepFrame: "Avanzar un fotograma 1/60s [F9]",
    tooltipReset: "Reiniciar la ROM actual",
    tooltipRewind: "Mantén presionado Retroceso para rebobinar el tiempo [Retroceso]",
    tooltipRewindPaused: "Rebobinado en vivo disponible solo en ejecución [Retroceso]",
    tooltipSpeed: "Ajustar frecuencia de reloj de la CPU (Hz)",
    tooltipAudio: "Activar / Silenciar pitido de sonido",
    tooltipFullscreen: "Alternar pantalla completa [F11 / Alt+Enter]",
    tooltipCrt: "Alternar scanlines y resplandor de fósforo CRT",
    tooltipTheme: "Cambiar tema estético y paleta de la interfaz",
    tooltipTabPrev: "Pestaña anterior",
    tooltipTabNext: "Siguiente pestaña",
    tooltipTabMenu: "Ver las 7 pestañas del inspector",

    // Títulos de Cuadrantes
    quadrantDisplay: "1. MONITOR DE PANTALLA (64×32)",
    quadrantControls: "CONTROLES DE JUEGO Y TELEMETRÍA",
    quadrantKeypad: "TECLADO HEXADECIMAL CHIP-8 4×4",
    quadrantDisasm: "2. DESENSAMBLADOR Y MODO PASO A PASO",
    quadrantConsole: "3. CONSOLA TTY Y CATÁLOGO DE ROMS",
    quadrantHardware: "4. BANCO DE REGISTROS Y RAM",
    
    // Telemetría y Estado
    statusRunning: "EJECUTANDO",
    statusPaused: "EN PAUSA",
    statusStepping: "PASO A PASO",
    statusRewind: "REBOBINANDO",
    fpsLabel: "FPS",
    cpuLabel: "CPU",
    soundLabel: "AUDIO",
    soundOn: "ACTIVO",
    soundOff: "MUTE",
    
    // Desensamblador y Explicador
    breakpointsTitle: "Puntos de Ruptura (Breakpoints)",
    noBreakpoints: "Sin breakpoints activos. Haz clic en una dirección para crear uno.",
    didacticTitle: "Explicación Didáctica en Vivo",
    didacticEmpty: "Inicia o pausa la ejecución para ver la explicación detallada de cada instrucción.",
    regChanged: "Modificado",
    
    // Consola y ROMs
    tabConsole: "Consola TTY",
    tabRoms: "Catálogo de ROMs",
    tabRomInfo: "Ficha Técnica",
    clearConsole: "Limpiar",
    searchRoms: "Buscar ROM...",
    allCategories: "Todas las Categorías",
    catGames: "Juegos",
    catDemos: "Demos",
    catPrograms: "Programas",
    catTests: "Tests Oficiales",
    romTitle: "Título",
    romAuthor: "Autor",
    romYear: "Año",
    romSize: "Tamaño",
    romControls: "Controles recomendados",
    romDesc: "Descripción",
    dropRomHelp: "o arrastra y suelta un archivo .ch8 aquí",
    
    tabRegisters: "Registros & Pila",
    tabHistory: "Historial de Ejecución",
    tabMemory: "Mapa de Memoria RAM (4KB)",
    tabSprites: "Visor de Sprites",
    autoScroll: "Auto-scroll",
    clearTrace: "Limpiar Historial",
    instructionsCount: "instrucciones ejecutadas",
    screenshotTooltip: "Capturar Pantalla (PNG) [F12 / Alt+S]",
    panelMinimize: "Minimizar / Expandir panel",
    romCategory: "Categoría",
    shortcutsBtn: "Teclas",
    shortcutsTitle: "Mapeo de Controles y Atajos de Teclado",
    gamePadTitle: "🎮 Controles del Juego (Teclado Hexadecimal 4×4)",
    gamePadDesc: "Entradas dedicadas al juego sin colisión con la interfaz.",
    sysShortcutsTitle: "⚡ Atajos del Sistema y Depurador",
    sysShortcutsDesc: "Comandos de la estación remapeados sin interferencias.",
    scPause: "Pausa / Reanudar Ejecución",
    scRewind: "Mantener para Rebobinar (Time Travel)",
    scStep: "Paso a paso (Instrucción)",
    scStepBack: "Retroceder una instrucción",
    scStepFrame: "Avanzar Frame (1/60s)",
    scFullscreen: "Pantalla Completa",
    scScreenshot: "Capturar Pantalla (PNG)",
    scSave: "Guardado Rápido (Ranura 1)",
    scLoad: "Carga Rápida (Ranura 1)",
    stepBackLog: "Instrucción revertida (Paso atrás)",
    noStepBack: "No hay más instrucciones previas para retroceder",
    stackTitle: "Pila (Stack)",
    keypadTitle: "Teclado Hexadecimal 4×4 (COSMAC VIP)",
    keypadHelp: "Mapeo PC: 1-4, Q-R, A-F, Z-V o Gamepad",
    gamepadConnected: "Gamepad Conectado",
    gamepadDisconnected: "Gamepad Desconectado",
    spriteViewerTitle: "Sprite en Dirección I:",
    spriteViewerHelp: "Previsualización gráfica de los bytes a partir del puntero I",
    heatmapLegend: "Verde: Código ejecutado | Azul: Lectura de datos | Rojo: Escritura | Gris: Inactivo",
    
    // Save States Modal
    slot: "Ranura",
    emptySlot: "Ranura Vacía",
    saveToSlot: "Guardar",
    loadFromSlot: "Cargar",
    exportState: "Exportar JSON",
    importState: "Importar JSON",
    
    // Audio Modal
    audioTitle: "Sintetizador de Audio Web",
    waveform: "Forma de Onda",
    square: "Cuadrada (Auténtica)",
    sine: "Sinusoidal",
    triangle: "Triangular",
    sawtooth: "Diente de sierra",
    frequency: "Tono (Frecuencia)",
    volume: "Volumen",
    
    // Explicaciones Didácticas
    opcodes: {
      CLS: "Borra completamente la pantalla (pone los 64×32 píxeles a 0/apagado).",
      RET: "Retorna de una subrutina: extrae la dirección de retorno de la pila (Stack) y actualiza el PC.",
      JP_ADDR: "Salto incondicional: mueve el contador de programa (PC) directamente a la dirección {addr}.",
      CALL_ADDR: "Llama a la subrutina en {addr}: guarda la dirección actual en la pila e incrementa el puntero SP.",
      SE_VX_BYTE: "Compara V{x} ({vxVal}) con {byte}. Si son iguales, salta la siguiente instrucción (PC += 2).",
      SNE_VX_BYTE: "Compara V{x} ({vxVal}) con {byte}. Si NO son iguales, salta la siguiente instrucción (PC += 2).",
      SE_VX_VY: "Compara V{x} ({vxVal}) con V{y} ({vyVal}). Si son iguales, salta la siguiente instrucción.",
      LD_VX_BYTE: "Carga el valor inmediato {byte} directamente dentro del registro V{x}.",
      ADD_VX_BYTE: "Suma {byte} al valor de V{x} ({vxVal}) sin modificar el registro de acarreo VF.",
      LD_VX_VY: "Copia el contenido del registro V{y} ({vyVal}) en el registro V{x}.",
      OR_VX_VY: "Realiza una operación lógica OR bit a bit entre V{x} ({vxVal}) y V{y} ({vyVal}), guardando el resultado en V{x}.",
      AND_VX_VY: "Realiza una operación lógica AND bit a bit entre V{x} ({vxVal}) y V{y} ({vyVal}), guardando el resultado en V{x}.",
      XOR_VX_VY: "Realiza una operación lógica XOR bit a bit entre V{x} ({vxVal}) y V{y} ({vyVal}), guardando el resultado en V{x}.",
      ADD_VX_VY: "Suma V{y} ({vyVal}) a V{x} ({vxVal}). Si hay desbordamiento (>255), activa VF=1 (acarreo); en caso contrario VF=0.",
      SUB_VX_VY: "Resta V{y} ({vyVal}) de V{x} ({vxVal}). Si no hay préstamo (Vx >= Vy), VF=1; si hay préstamo (Vx < Vy), VF=0.",
      SHR_VX: "Desplaza V{x} ({vxVal}) 1 bit a la derecha. Guarda el bit menos significativo saliente en VF ({vfVal}).",
      SUBN_VX_VY: "Calcula V{y} ({vyVal}) menos V{x} ({vxVal}). Si Vy >= Vx, activa VF=1; de lo contrario VF=0.",
      SHL_VX: "Desplaza V{x} ({vxVal}) 1 bit a la izquierda. Guarda el bit más significativo saliente en VF ({vfVal}).",
      SNE_VX_VY: "Compara V{x} ({vxVal}) con V{y} ({vyVal}). Si son diferentes, salta la siguiente instrucción.",
      LD_I_ADDR: "Establece el registro de índice I a la dirección de memoria {addr}.",
      JP_V0_ADDR: "Salto con desplazamiento: salta a la dirección {addr} + V0 ({v0Val}).",
      RND_VX_BYTE: "Genera un número aleatorio (0-255), le aplica máscara AND con {byte} y lo almacena en V{x}.",
      DRW_VX_VY_N: "Dibuja un sprite de {n} bytes de alto en las coordenadas (X: V{x}={vxVal}, Y: V{y}={vyVal}) leyendo desde I ({iVal}). Si algún píxel se apaga, activa VF=1 (colisión).",
      SKP_VX: "Comprueba si la tecla correspondiente al valor en V{x} ({vxVal}) está pulsada. Si es así, salta la siguiente instrucción.",
      SKNP_VX: "Comprueba si la tecla de V{x} ({vxVal}) NO está pulsada. Si no está pulsada, salta la siguiente instrucción.",
      LD_VX_DT: "Lee el valor actual del temporizador de retardo (DT={dtVal}) y lo almacena en V{x}.",
      LD_VX_K: "Detiene la CPU y espera hasta que el usuario presione una tecla, guardando su código en V{x}.",
      LD_DT_VX: "Carga el valor de V{x} ({vxVal}) en el temporizador de retardo (DT). Comenzará a decrementar a 60 Hz.",
      LD_ST_VX: "Carga el valor de V{x} ({vxVal}) en el temporizador de sonido (ST). Sonará el beeper mientras ST > 0.",
      ADD_I_VX: "Suma el valor de V{x} ({vxVal}) al registro de dirección I ({iVal}).",
      LD_F_VX: "Apunta I a la dirección de memoria de la fuente estándar para el dígito hexadecimal en V{x} ({vxVal}).",
      LD_B_VX: "Almacena la representación decimal (BCD) de V{x} ({vxVal}) en memoria[I], memoria[I+1] y memoria[I+2].",
      LD_I_VX: "Guarda los registros V0 hasta V{x} en la memoria consecutiva empezando en la dirección I ({iVal}).",
      LD_VX_I: "Lee la memoria consecutiva desde I ({iVal}) y carga los valores en los registros V0 hasta V{x}.",
      UNKNOWN: "Instrucción no reconocida o no válida para CHIP-8."
    }
  }
};

// Default language: ENGLISH (as requested), safely check environment
let currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem)
  ? (localStorage.getItem('chip8_lang') || 'en')
  : 'en';

export function t(key, params = {}) {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key];
  
  if (!text && key.startsWith('opcodes.')) {
    const opKey = key.split('.')[1];
    text = dict.opcodes?.[opKey] || translations.en.opcodes?.[opKey] || key;
  }
  
  if (!text) {
    text = translations.en[key] || key;
  }
  
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

export function setLanguage(lang) {
  if (lang === 'es' || lang === 'en') {
    currentLang = lang;
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('chip8_lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('chip8-language-changed', { detail: { lang } }));
    }
  }
}

export function getLanguage() {
  return currentLang;
}
