export interface CameraState {
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  activeId: string;
  error: string | null;
}

/** Owns a camera stream for one scanner visit, including late permission results. */
export class CameraSession {
  private state: CameraState = { stream: null, devices: [], activeId: '', error: null };
  private generation = 0;
  private disposed = false;
  private requesting = false;
  private removeEndedListener = () => {};

  constructor(
    private media: MediaDevices | undefined,
    private preferredId: string,
    private facingMode: 'user' | 'environment',
    private onChange: (state: CameraState) => void,
  ) {
    media?.addEventListener('devicechange', this.onDeviceChange);
  }

  private emit(patch: Partial<CameraState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }

  private releaseStream() {
    this.removeEndedListener();
    this.state.stream?.getTracks().forEach((track) => track.stop());
    this.state = { ...this.state, stream: null, activeId: '' };
  }

  private onDeviceChange = async () => {
    await this.refreshDevices();
    if (this.disposed || this.requesting || this.state.stream?.active) return;
    if (this.state.devices.some((device) => !this.preferredId || device.deviceId === this.preferredId)) {
      void this.start();
    }
  };

  async refreshDevices() {
    try {
      const devices = await this.media?.enumerateDevices();
      if (devices) this.emit({ devices: devices.filter((device) => device.kind === 'videoinput') });
    } catch {
      // Device labels can be unavailable before permission; keep an active stream.
    }
  }

  async start() {
    if (this.disposed || this.requesting) return;
    if (this.state.stream?.getVideoTracks().some((track) => track.readyState === 'live')) return;
    const generation = ++this.generation;
    this.requesting = true;
    this.releaseStream();
    this.emit({ error: null });
    try {
      if (!this.media?.getUserMedia) throw new Error('Camera access requires HTTPS and a supported browser.');
      const stream = await this.media.getUserMedia({
        audio: false,
        video: {
          ...(this.preferredId ? { deviceId: { exact: this.preferredId } } : { facingMode: this.facingMode }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (this.disposed || generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach((item) => item.stop());
        throw new Error('The selected device did not provide a video track.');
      }
      const onEnded = () => {
        this.releaseStream();
        this.emit({ error: 'Camera disconnected. Reconnect the selected webcam or click Retry Camera.' });
      };
      track.addEventListener('ended', onEnded);
      this.removeEndedListener = () => track.removeEventListener('ended', onEnded);
      this.emit({ stream, activeId: track.getSettings().deviceId || this.preferredId, error: null });
      await this.refreshDevices();
    } catch (error) {
      if (generation !== this.generation || this.disposed) return;
      const name = (error as Error).name;
      const message = name === 'NotAllowedError'
        ? 'Allow camera access in your browser, then click Retry Camera.'
        : ['NotFoundError', 'OverconstrainedError'].includes(name)
        ? 'Selected camera unavailable. Reconnect it or choose a camera in Settings.'
        : name === 'NotReadableError'
        ? 'Camera is busy. Close other camera apps, then click Retry Camera.'
        : (error as Error).message || 'Unable to start the selected camera.';
      this.emit({ stream: null, activeId: '', error: message });
    } finally {
      if (generation === this.generation) this.requesting = false;
    }
  }

  dispose() {
    this.disposed = true;
    ++this.generation;
    this.media?.removeEventListener('devicechange', this.onDeviceChange);
    this.releaseStream();
  }
}
