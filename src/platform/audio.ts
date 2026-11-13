/** One sliding voice plus one short event voice. All synthesis is local. */
export class LabAudio {
  private context?: AudioContext; private gain?: GainNode; private slide?: OscillatorNode; private slideGain?: GainNode;
  private enabled = false; private volume = .25; private lastContact = 0; private stopTimer = 0;
  async enable(value: boolean, volume = .25) {
    this.enabled = value; this.volume = volume;
    if (!value) { this.gain?.gain.setTargetAtTime(0, this.context!.currentTime, .02); return; }
    this.context ??= new AudioContext();
    if (!this.gain) {
      this.gain = this.context.createGain(); this.gain.connect(this.context.destination);
      this.slideGain = this.context.createGain(); this.slideGain.gain.value = 0; this.slideGain.connect(this.gain);
      this.slide = this.context.createOscillator(); this.slide.type = 'triangle'; this.slide.frequency.value = 115; this.slide.connect(this.slideGain); this.slide.start();
    }
    await this.context.resume(); this.gain.gain.setTargetAtTime(volume * .15, this.context.currentTime, .02);
  }
  move(delta: number) {
    if (!this.enabled || !this.context || document.hidden) return;
    const t = this.context.currentTime; this.slide!.frequency.setTargetAtTime(100 + Math.min(130, Math.abs(delta) * 15), t, .02);
    this.slideGain!.gain.setTargetAtTime(Math.min(.5, Math.abs(delta) * .06), t, .015);
    clearTimeout(this.stopTimer); this.stopTimer = window.setTimeout(() => this.slideGain?.gain.setTargetAtTime(0, this.context!.currentTime, .035), 70);
  }
  event(kind: 'contact'|'lock'|'place') {
    if (!this.enabled || !this.context || document.hidden) return;
    const t = this.context.currentTime; if (kind === 'contact' && t - this.lastContact < .35) return;
    this.lastContact = t;
    const oscillator = this.context.createOscillator(), envelope = this.context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(kind === 'contact' ? 620 : kind === 'lock' ? 360 : 480, t);
    envelope.gain.setValueAtTime(.35, t); envelope.gain.exponentialRampToValueAtTime(.001, t + .09);
    oscillator.connect(envelope); envelope.connect(this.gain!); oscillator.start(); oscillator.stop(t + .1);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  hidden(value: boolean) { if (value) void this.context?.suspend(); else if (this.enabled) void this.context?.resume(); }
  dispose() { clearTimeout(this.stopTimer); this.slide?.stop(); void this.context?.close(); }
}
