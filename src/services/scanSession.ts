/** Serializes OCR and invalidates results after cancellation, mode changes or navigation. */
export class ScanSession {
  private revision = 0;
  private inFlight = false;
  private completed = false;

  begin(): number | null {
    if (this.inFlight || this.completed) return null;
    this.inFlight = true;
    return this.revision;
  }

  isCurrent(token: number) { return token === this.revision && !this.completed; }
  finish() { this.inFlight = false; }
  isBusy() { return this.inFlight; }
  isComplete() { return this.completed; }

  complete() {
    if (this.completed) return false;
    this.completed = true;
    ++this.revision;
    return true;
  }

  cancel() { ++this.revision; }
  reset() { this.cancel(); this.completed = false; }
}
