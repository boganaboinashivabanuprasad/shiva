import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CameraSession, CameraState } from '../src/services/cameraSession';
import { ScanSession } from '../src/services/scanSession';
import { ArduinoService } from '../src/services/arduinoService';
import { ocrService } from '../src/services/ocrService';

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

class FakeTrack extends EventTarget {
  readyState = 'live';
  getSettings() { return { deviceId: 'usb-camera' }; }
  stop() { this.readyState = 'ended'; }
}
const makeStream = () => {
  const track = new FakeTrack();
  const stream = {
    get active() { return track.readyState === 'live'; },
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  return { stream, track };
};

class FakeMedia extends EventTarget {
  requests: MediaStreamConstraints[] = [];
  streams: ReturnType<typeof makeStream>[] = [];
  unavailable = false;
  async enumerateDevices() { return this.unavailable ? [] : [{ kind: 'videoinput', deviceId: 'usb-camera', label: 'USB webcam' }]; }
  async getUserMedia(constraints: MediaStreamConstraints) {
    this.requests.push(constraints);
    if (this.unavailable) throw Object.assign(new Error('missing'), { name: 'OverconstrainedError' });
    const camera = makeStream();
    this.streams.push(camera);
    return camera.stream;
  }
}

test('saved USB camera stays connected and reconnects after unplug/replug', async () => {
  const media = new FakeMedia();
  let state: CameraState;
  const session = new CameraSession(media as unknown as MediaDevices, 'usb-camera', 'user', (next) => state = next);
  await session.start();
  assert.deepEqual((media.requests[0].video as MediaTrackConstraints).deviceId, { exact: 'usb-camera' });
  await session.start();
  assert.equal(media.requests.length, 1, 'retries must reuse a live stream');
  assert.equal(state!.stream, media.streams[0].stream);
  media.unavailable = true;
  media.streams[0].track.stop();
  media.streams[0].track.dispatchEvent(new Event('ended'));
  assert.equal(state!.stream, null);
  media.dispatchEvent(new Event('devicechange'));
  await flush();
  assert.equal(media.requests.length, 1);
  media.unavailable = false;
  media.dispatchEvent(new Event('devicechange'));
  await flush();
  assert.equal(media.requests.length, 2);
  assert.equal(state!.activeId, 'usb-camera');
  session.dispose();
  assert.equal(media.streams[1].track.readyState, 'ended');
});

test('missing saved camera never silently opens another device', async () => {
  const media = new FakeMedia();
  media.unavailable = true;
  let state: CameraState;
  const session = new CameraSession(media as unknown as MediaDevices, 'usb-camera', 'user', (next) => state = next);
  await session.start();
  assert.equal(media.requests.length, 1);
  assert.equal(state!.stream, null);
  assert.match(state!.error!, /Selected camera unavailable/);
  session.dispose();
});

test('permission granted after leaving the scanner releases all tracks', async () => {
  const media = new FakeMedia();
  const camera = makeStream();
  let grant: (stream: MediaStream) => void;
  media.getUserMedia = () => new Promise((resolve) => { grant = resolve; });
  const updates: CameraState[] = [];
  const session = new CameraSession(media as unknown as MediaDevices, 'usb-camera', 'user', (next) => updates.push(next));
  const starting = session.start();
  session.dispose();
  grant!(camera.stream);
  await starting;
  assert.equal(camera.track.readyState, 'ended');
  assert.equal(updates.filter((state) => state.stream).length, 0);
});

test('OCR cannot overlap, and cancelled or duplicate results cannot complete a visitor', () => {
  const session = new ScanSession();
  const old = session.begin()!;
  assert.equal(session.begin(), null);
  session.cancel();
  assert.equal(session.isCurrent(old), false);
  assert.equal(session.begin(), null, 'cancellation must still wait for OCR to finish');
  session.finish();
  const current = session.begin()!;
  assert.equal(session.isCurrent(current), true);
  assert.equal(session.complete(), true);
  assert.equal(session.complete(), false, 'same visitor must not trigger another opening');
  session.finish();
  assert.equal(session.begin(), null);
  session.reset();
  assert.notEqual(session.begin(), null, 'Next Scan starts a new visitor');
});

test('relay commands preserve both five-second motor cutoffs', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() });
  const service = new ArduinoService();
  t.after(() => service.clearAutoTimers());
  for (const command of ['OPEN_FULL', 'OPEN_AFTER_PROMISE'] as const) {
    await service.sendCommand(command, 5000);
    await service.sendCommand('RELAY_ON');
    t.mock.timers.tick(4999);
    assert.equal(service.getDoorMotion(), 'opening');
    t.mock.timers.tick(1);
    await flush();
    assert.equal(service.getDoorMotion(), 'open');
  }
});

test('serial writes are ordered and each opening carries its own duration', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const service = new ArduinoService();
  t.after(() => service.clearAutoTimers());
  const writes: string[] = [];
  let locked = false;
  (service as any).port = { writable: { getWriter() {
    assert.equal(locked, false, 'serial writer cannot be acquired concurrently');
    locked = true;
    return {
      async write(bytes: Uint8Array) { await flush(); writes.push(new TextDecoder().decode(bytes)); },
      releaseLock() { locked = false; },
    };
  } } };
  assert.deepEqual(await Promise.all([service.sendCommand('OPEN_FULL', 5000), service.sendCommand('RELAY_ON')]), [true, true]);
  assert.deepEqual(writes.slice(0, 2), ['OPEN_FULL:5000\n', 'RELAY_ON\n']);
  t.mock.timers.tick(5000);
  await flush(); await flush();
  await service.sendCommand('OPEN_AFTER_PROMISE', 5000);
  await service.sendCommand('OPEN_0_3');
  assert.ok(writes.includes('MOTOR_STOP\n'));
  assert.ok(writes.includes('OPEN_AFTER_PROMISE:5000\n'));
  assert.equal(writes.at(-1), 'OPEN_0_3:8000\n', 'five-second override must not persist into another category');
});

test('failed serial writes release the writer and report failure', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const service = new ArduinoService();
  let released = false;
  (service as any).port = { writable: { getWriter: () => ({
    write: async () => { throw new Error('USB disconnected'); },
    releaseLock: () => { released = true; },
  }) } };
  assert.equal(await service.sendCommand('OPEN_FULL', 5000), false);
  assert.equal(released, true);
  t.mock.timers.tick(5000);
  assert.equal(service.getDoorMotion(), 'idle');
});

test('exactly five hours is in the 5+ hours category', () => {
  assert.equal(ocrService.classifyMinutes(299), '3_TO_5_HOURS');
  assert.equal(ocrService.classifyMinutes(300), '5_PLUS_HOURS');
  assert.equal(ocrService.classifyMinutes(301), '5_PLUS_HOURS');
});

test('slow fallback OCR is awaited rather than abandoned after 1.5 seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(ocrService, 'recognizeWithGeminiVision', async () => null);
  t.mock.method(ocrService, 'generateProcessedCanvases', () => []);
  t.mock.method(ocrService, 'getWorker', async () => ({
    recognize: () => new Promise((resolve) => setTimeout(() => resolve({ data: { text: '6h 00m', confidence: 72 } }), 2500)),
  }) as any);
  let finished = false;
  const result = ocrService.recognizeFrame({} as HTMLCanvasElement).then((value) => { finished = true; return value; });
  await flush();
  t.mock.timers.tick(1500);
  await flush();
  assert.equal(finished, false);
  t.mock.timers.tick(1000);
  const value = await result;
  assert.equal(value.screenTimeMinutes, 360);
  assert.equal(value.confidence, 72, 'confidence must not be inflated');
});
