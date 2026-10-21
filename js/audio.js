/**
 * ============================================================================
 * CHIP-8 AUDIO SYNTHESIZER & OSCILLOSCOPE (WEB AUDIO API)
 * ============================================================================
 * Sintetizador de beeps retro de 8 bits con oscilador de onda cuadrada,
 * control de volumen, envolvente anti-clic y mini osciloscopio en tiempo real.
 */

export class RetroAudio {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.analyser = null;
    this.isPlaying = false;
    this.isMuted = false;

    // Configuración acústica
    this.frequency = 440; // Tono estándar A4 (440 Hz)
    this.waveType = 'square'; // 'square', 'sine', 'triangle', 'sawtooth'
    this.volume = 0.15; // Nivel de volumen suave para evitar fatiga auditiva
  }

  /**
   * Inicializa el contexto de audio tras la primera interacción del usuario
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();

      // Nodo de Ganancia (Volumen)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

      // Nodo Analizador para el Osciloscopio
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Inicia el pitido continuo del temporizador de sonido
   */
  startBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (!this.isPlaying) {
      try {
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = this.waveType;
        this.oscillator.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
        this.oscillator.connect(this.gainNode);

        // Envolvente rápida para evitar el molesto 'pop' o 'click' eléctrico
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.005);

        this.oscillator.start();
        this.isPlaying = true;
      } catch (err) {
        console.warn('Audio start error:', err);
      }
    }
  }

  /**
   * Detiene el pitido de forma suave
   */
  stopBeep() {
    if (this.isPlaying && this.gainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.005);

      setTimeout(() => {
        if (this.oscillator && !this.isPlaying) {
          try {
            this.oscillator.stop();
            this.oscillator.disconnect();
          } catch (e) {}
          this.oscillator = null;
        }
      }, 15);

      this.isPlaying = false;
    }
  }

  /**
   * Alterna el silencio del audio
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBeep();
    }
    return this.isMuted;
  }

  /**
   * Actualiza el tipo de onda
   */
  setWaveform(type) {
    this.waveType = type;
    if (this.oscillator) {
      this.oscillator.type = type;
    }
  }

  /**
   * Actualiza la frecuencia en Hertz
   */
  setFrequency(hz) {
    this.frequency = Math.max(50, Math.min(2000, hz));
    if (this.oscillator && this.audioCtx) {
      this.oscillator.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
    }
  }

  /**
   * Actualiza el volumen (0.0 a 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.isPlaying && this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  /**
   * Dibuja la forma de onda en un canvas de osciloscopio
   */
  drawOscilloscope(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = 'rgba(10, 15, 20, 0.4)';
    ctx.fillRect(0, 0, width, height);

    if (!this.analyser || !this.isPlaying) {
      // Línea horizontal plana en reposo
      ctx.strokeStyle = '#22c55e33';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }
}
