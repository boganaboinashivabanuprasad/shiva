import { SerialLog, DashboardSettings, ArduinoCommand } from '../types';

export type { ArduinoCommand };

type SerialListener = (status: {
  isConnected: boolean;
  isVirtual: boolean;
  portName: string;
  lastCommand: string;
  lastCommandTimestamp: number | null;
  logs: SerialLog[];
  isDoorOpen: boolean;
  isRelayOn: boolean;
  doorMotion: 'idle' | 'opening' | 'open' | 'closing' | 'closed';
}) => void;

export class ArduinoService {
  private port: any = null;
  private writer: any = null;
  private reader: any = null;
  private isConnected: boolean = false;
  private isVirtual: boolean = true;
  private portName: string = 'Disconnected';
  private lastCommand: string = '';
  private lastCommandTimestamp: number | null = null;
  private logs: SerialLog[] = [];
  private listeners: Set<SerialListener> = new Set();
  private isReading: boolean = false;
  private autoStopTimer: any = null;
  private intermediateTimers: any[] = [];
  private writeQueue: Promise<unknown> = Promise.resolve();
  private lastMotionTimestamp = 0;

  // Door & Relay LED hardware state trackers
  private isDoorOpen: boolean = false;
  private isRelayOn: boolean = false;
  private doorMotion: 'idle' | 'opening' | 'open' | 'closing' | 'closed' = 'idle';

  private activeSettings: DashboardSettings | null = null;

  constructor() {
    this.addLog('SYS', 'SAMATHULYAM Arduino Hardware Service Initialized (Web Serial API ready)');
  }

  public getIsDoorOpen(): boolean {
    return this.isDoorOpen;
  }

  public setIsDoorOpen(open: boolean) {
    this.isDoorOpen = open;
    this.doorMotion = open ? 'open' : 'closed';
    this.notify();
  }

  public getIsRelayOn(): boolean {
    return this.isRelayOn;
  }

  public getDoorMotion(): 'idle' | 'opening' | 'open' | 'closing' | 'closed' {
    return this.doorMotion;
  }

  public setSettings(settings: DashboardSettings) {
    this.activeSettings = settings;
  }

  public clearAutoTimers() {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    if (this.intermediateTimers.length > 0) {
      this.intermediateTimers.forEach((t) => clearTimeout(t));
      this.intermediateTimers = [];
    }
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public isInsideIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  public subscribe(listener: SerialListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      isConnected: this.isConnected,
      isVirtual: this.isVirtual,
      portName: this.portName,
      lastCommand: this.lastCommand,
      lastCommandTimestamp: this.lastCommandTimestamp,
      logs: [...this.logs],
      isDoorOpen: this.isDoorOpen,
      isRelayOn: this.isRelayOn,
      doorMotion: this.doorMotion,
    };
    this.listeners.forEach((l) => l(state));
  }

  private addLog(direction: 'TX' | 'RX' | 'SYS', text: string) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: SerialLog = {
      id: Math.random().toString(36).substring(2, 9),
      time,
      direction,
      text,
    };
    this.logs = [log, ...this.logs].slice(0, 100);
    this.notify();
  }

  public async connect(): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.addLog('SYS', 'Web Serial API is not supported in this browser. Enabling Simulator Mode.');
      this.isConnected = true;
      this.isVirtual = true;
      this.portName = 'Virtual COM (Simulator)';
      this.addLog('SYS', 'Connected to Virtual Arduino Uno (L298N Simulation Mode)');
      this.notify();
      return true;
    }

    try {
      // Prompt user to select COM Port
      const navSerial = (navigator as any).serial;
      this.port = await navSerial.requestPort();
      await this.port.open({ baudRate: 9600 });

      this.isConnected = true;
      this.isVirtual = false;
      this.portName = 'Arduino Uno (Physical USB)';
      this.addLog('SYS', 'Connected to USB Serial Port @ 9600 baud');

      // Start reader loop
      this.startReading();
      this.notify();
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.addLog('SYS', 'Port selection cancelled by user.');
      } else {
        const errorMsg = err.message || String(err);
        this.addLog('SYS', `Connection Error: ${errorMsg}`);
        if (errorMsg.includes('permissions policy') || errorMsg.includes('disallowed')) {
          this.addLog('SYS', 'Note: Browser iframes disallow Web Serial. Please open the Testing Link in a New Tab.');
        } else if (errorMsg.includes('Failed to open') || errorMsg.includes('busy') || errorMsg.includes('in use')) {
          this.addLog('SYS', 'Note: Please close the Arduino IDE Serial Monitor if it is currently open (Port Busy/Locked).');
        }
        this.isConnected = true;
        this.isVirtual = true;
        this.portName = 'Virtual COM (Simulator)';
        this.addLog('SYS', 'Virtual Simulation Mode Activated (Simulator Active)');
      }
      this.notify();
      return this.isConnected;
    }
  }

  public async disconnect() {
    this.clearAutoTimers();
    try {
      this.isReading = false;
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close().catch(() => {});
        this.writer = null;
      }
      if (this.port) {
        await this.port.close().catch(() => {});
        this.port = null;
      }
    } catch (err: any) {
      console.warn('Disconnect cleanup:', err);
    } finally {
      this.isConnected = false;
      this.isVirtual = true;
      this.portName = 'Disconnected';
      this.addLog('SYS', 'Arduino disconnected.');
      this.notify();
    }
  }

  private async startReading() {
    if (!this.port || !this.port.readable || this.isReading) return;
    this.isReading = true;

    try {
      while (this.port.readable && this.isReading) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        this.reader = reader;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value && value.trim()) {
              this.addLog('RX', value.trim());
            }
          }
        } catch (error) {
          console.warn('Serial read error:', error);
        } finally {
          reader.releaseLock();
          await readableStreamClosed.catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Stream setup error:', err);
    }
  }

  public async writeRaw(text: string): Promise<boolean> {
    const port = this.port;
    const write = this.writeQueue.then(async () => {
      if (!port?.writable || port !== this.port) return false;
      let writer: any;
      try {
        const textEncoder = new TextEncoder();
        writer = port.writable.getWriter();
        await writer.write(textEncoder.encode(text));
        return true;
      } catch (err: any) {
        this.addLog('SYS', `Write failed: ${err.message}`);
        return false;
      } finally {
        writer?.releaseLock();
      }
    });
    this.writeQueue = write.catch(() => {});
    return write;
  }

  public async sendCommand(command: ArduinoCommand, customDurationMs?: number): Promise<boolean> {
    const now = Date.now();

    // Guard against duplicate CLOSE triggers within 2 seconds
    if (
      (command === 'CLOSE_HOME' || command === 'CLOSE') &&
      this.doorMotion === 'closing' &&
      now - this.lastMotionTimestamp < 2000
    ) {
      return true;
    }

    const relayOnly = ['RELAY_ON', 'RELAY_OFF', 'LED_ON', 'LED_OFF'].includes(command);
    if (!relayOnly) {
      this.clearAutoTimers();
      this.lastMotionTimestamp = now;
    }
    this.lastCommand = command;
    this.lastCommandTimestamp = now;

    const s = this.activeSettings;
    const t03 = customDurationMs ?? s?.time0To3Dir1Ms ?? 8000;
    const t35 = customDurationMs ?? s?.time3To5Dir1Ms ?? 8000;
    const t5p1 = s?.time5PlusDir1Ms ?? 3000;
    const t5p2 = s?.time5PlusDir2Ms ?? 4000;
    const t5prom = customDurationMs ?? s?.time5PlusPromiseDir1Ms ?? 8000;
    const tHome = customDurationMs ?? s?.timeHomeCloseDir2Ms ?? 8000;

    let targetDurationMs = 0;
    if (command === 'OPEN_0_3' || command === 'OPEN_FULL') {
      targetDurationMs = t03;
    } else if (command === 'OPEN_3_5' || command === 'OPEN_SLOW') {
      targetDurationMs = t35;
    } else if (command === 'OPEN_5_PLUS' || command === 'OPEN_20_CLOSE' || command === 'OPEN_PARTIAL') {
      targetDurationMs = t5p1 + t5p2;
    } else if (command === 'OPEN_AFTER_PROMISE') {
      targetDurationMs = t5prom;
    } else if (command === 'CLOSE_HOME' || command === 'CLOSE') {
      targetDurationMs = tHome;
    }

    // Hardware State Transitions:
    // When opening (0-3h, 3-5h, promise, manual):
    //   - Motors run in Direction 1 for 8 sec
    //   - Relay Pin D4 turns ON at the 5th second (lighting the Sanctum LED)
    //   - At 8 sec full door open, Relay D4 remains ON and video plays
    // When closing: D4 stays ON while the doors swing closed, and ONLY turns OFF when the doors have fully shut!
    const isStandardOpen = command === 'OPEN_0_3' || command === 'OPEN_3_5' || command === 'OPEN_SLOW' || command === 'OPEN_FULL' || command === 'OPEN_AFTER_PROMISE';
    if (isStandardOpen) {
      this.doorMotion = 'opening';
      this.isDoorOpen = true;
      this.isRelayOn = false; // Door begins opening; relay turns ON at 5th second
    } else if (command.startsWith('OPEN_')) {
      this.doorMotion = 'opening';
      this.isDoorOpen = true;
      this.isRelayOn = true;
    } else if (command === 'CLOSE_HOME' || command === 'CLOSE') {
      this.doorMotion = 'closing';
      this.isDoorOpen = true; // still in motion closing
      this.isRelayOn = true;  // D4 stays ON continuously while doors are closing!
    } else if (command === 'STOP') {
      this.doorMotion = 'idle';
      this.isDoorOpen = false;
      this.isRelayOn = false;
    } else if (command === 'RELAY_ON' || command === 'LED_ON') {
      this.isRelayOn = true;
    } else if (command === 'RELAY_OFF' || command === 'LED_OFF') {
      this.isRelayOn = false;
    }

    this.notify();

    this.addLog(
      'TX',
      `> ${command} (Duration: ${
        targetDurationMs > 0 ? (targetDurationMs / 1000).toFixed(1) + 's' : 'Immediate'
      } | Relay D4 ${this.isRelayOn ? 'ON' : 'OFF (Will turn ON at 5th sec)'})`
    );

    // Hardware Auto-Cutoff Timer (Active for BOTH Physical Serial and Simulator)
    if (targetDurationMs > 0 && command !== 'STOP' && !command.startsWith('RELAY_')) {
      if (isStandardOpen) {
        // Step 1: At 5th second (5000ms), turn ON Relay Pin D4 (Sanctum LED light)
        const relayDelayMs = Math.min((s?.relayOnDelaySec ?? 5) * 1000, targetDurationMs);
        const relayTimer = setTimeout(async () => {
          this.isRelayOn = true;
          this.addLog(
            'SYS',
            `[5th Second Reached] Relay Pin D4 ON -> Sanctum LED Light active as doors swing open.`
          );
          if (this.port && this.port.writable) {
            await this.writeRaw('RELAY_ON\n').catch(() => {});
          }
          this.notify();
        }, relayDelayMs);
        this.intermediateTimers.push(relayTimer);

        // Step 2: At 8th second (targetDurationMs), Doors reach FULL DOOR OPEN position!
        this.autoStopTimer = setTimeout(async () => {
          this.doorMotion = 'open';
          this.isDoorOpen = true;
          this.isRelayOn = true; // Ensure Relay D4 remains solidly ON
          this.addLog(
            'SYS',
            `[Opening complete (${(targetDurationMs / 1000).toFixed(1)}s)] Motors stopped; opening cycle complete.`
          );
          if (this.port && this.port.writable) {
            await this.writeRaw('MOTOR_STOP\n').catch(() => {});
          }
          this.addLog('SYS', `Opening timer complete (${targetDurationMs / 1000}s). Motor stop requested; Relay D4 ON.`);
          this.notify();
        }, targetDurationMs);
      } else if (command === 'OPEN_5_PLUS' || command === 'OPEN_20_CLOSE' || command === 'OPEN_PARTIAL') {
        // Stage 1 -> Stage 2 transition: At t5p1, motors reverse to Direction 2 (closing)
        const intermediateTimer = setTimeout(() => {
          this.doorMotion = 'closing';
          this.addLog('SYS', `[5+ Hours] Direction 1 (${(t5p1 / 1000).toFixed(1)}s) complete. Reversing motors to Direction 2 (${(t5p2 / 1000).toFixed(1)}s) to close doors...`);
          this.notify();
        }, t5p1);
        this.intermediateTimers.push(intermediateTimer);

        // Stage 2 end: At t5p1 + t5p2, doors are fully closed and Relay D4 turns OFF
        this.autoStopTimer = setTimeout(async () => {
          this.doorMotion = 'closed';
          this.isDoorOpen = false;
          this.isRelayOn = false;
          this.addLog('SYS', `[5+ Hours] Doors have returned to closed position. Relay D4 OFF. Awaiting devotee sacred promise.`);
          if (this.port && this.port.writable) {
            await this.writeRaw('MOTOR_STOP\n');
          }
          this.notify();
        }, targetDurationMs);
      } else {
        this.autoStopTimer = setTimeout(async () => {
          if (command.startsWith('OPEN_')) {
            this.doorMotion = 'open';
            this.isDoorOpen = true;
            this.isRelayOn = true; // D4 remains continuously ON
            this.addLog(
              'SYS',
              `[Auto-Cutoff] Target ${(targetDurationMs / 1000).toFixed(1)}s reached -> Opening stroke complete. Doors are OPEN. Relay D4 remains ON.`
            );
            if (this.port && this.port.writable) {
              await this.writeRaw('MOTOR_STOP\n');
            }
            this.addLog('RX', `ARDUINO: Opening motion complete. Motors Halted (PWM 0). Doors OPEN & Relay D4 ON.`);
            this.notify();
          } else if (command === 'CLOSE_HOME' || command === 'CLOSE') {
            // NOW the closing stroke is 100% complete!
            // Doors are fully closed, and Relay D4 turns OFF!
            this.doorMotion = 'closed';
            this.isDoorOpen = false;
            this.isRelayOn = false; // Door has fully closed -> NOW Relay D4 turns OFF!
            this.addLog(
              'SYS',
              `[Auto-Cutoff] Target ${(targetDurationMs / 1000).toFixed(1)}s reached -> Doors are FULLY CLOSED. Relay D4 OFF.`
            );
            if (this.port && this.port.writable) {
              // STOP command halts motor PWM and turns Relay D4 OFF on Arduino
              await this.writeRaw('STOP\n');
            }
            this.addLog('RX', `ARDUINO: Closing motion complete. Doors are CLOSED & Relay D4 OFF.`);
            this.notify();
          }
        }, targetDurationMs);
      }
    }

    // If physically connected via Web Serial
    if (this.port && this.port.writable) {
      try {
        // The generated Arduino firmware accepts COMMAND:durationMs.
        // Send the requested duration to physical hardware instead of applying it only to UI timers.
        // Always include the single-stroke duration: firmware remembers previous overrides.
        const serialCommand = targetDurationMs > 0 && (isStandardOpen || command === 'CLOSE_HOME' || command === 'CLOSE')
          ? `${command}:${Math.round(targetDurationMs)}`
          : command;
        const sent = await this.writeRaw(`${serialCommand}\n`);
        if (!sent && !relayOnly) {
          this.clearAutoTimers();
          this.doorMotion = 'idle';
          this.addLog('SYS', 'Motor command was not delivered. Check the USB connection.');
        }
        return sent;
      } catch (err: any) {
        this.addLog('SYS', `Write failed: ${err.message}`);
        return false;
      }
    }

    // Simulator response with accurate updated timings
    setTimeout(() => {
      let ack = `ACK_${command}_EXECUTED`;
      if (command === 'OPEN_0_3' || command === 'OPEN_FULL') {
        ack = `ARDUINO: [0-3h Dual L298N] Driving 60 RPM Motors in Direction 1 for ${(t03 / 1000).toFixed(1)}s | Relay D4 ON`;
      } else if (command === 'OPEN_3_5' || command === 'OPEN_SLOW') {
        ack = `ARDUINO: [3-5h Dual L298N] Driving 60 RPM Motors in Direction 1 for ${(t35 / 1000).toFixed(1)}s (SLOW) | Relay D4 ON`;
      } else if (command === 'OPEN_5_PLUS' || command === 'OPEN_20_CLOSE' || command === 'OPEN_PARTIAL') {
        ack = `ARDUINO: [5+h Dual L298N] Motors: ${(t5p1 / 1000).toFixed(1)}s in Dir 1 -> then ${(t5p2 / 1000).toFixed(1)}s in Dir 2. Awaiting sacred promise.`;
      } else if (command === 'OPEN_AFTER_PROMISE') {
        ack = `ARDUINO: [After Promise Dual L298N] Devotee vow accepted! Motors in Dir 1 for ${(t5prom / 1000).toFixed(1)}s | Relay D4 ON`;
      } else if (command === 'CLOSE_HOME' || command === 'CLOSE') {
        ack = `ARDUINO: [Home Return Dual L298N] Driving 60 RPM Motors in Direction 2 for ${(tHome / 1000).toFixed(1)}s | Relay D4 remains ON while closing`;
      } else if (command === 'STOP') {
        ack = 'ARDUINO: EMERGENCY STOP - Both L298N Motor Drivers Halted (PWM 0) | Relay D4 OFF';
      } else if (command === 'RELAY_ON' || command === 'LED_ON') {
        ack = 'ARDUINO: Relay Module LED Activated (Pin D4 HIGH & L298N #1 Channel 2 ON)';
      } else if (command === 'RELAY_OFF' || command === 'LED_OFF') {
        ack = 'ARDUINO: Relay Module LED Deactivated (Pin D4 LOW & L298N #1 Channel 2 OFF)';
      }
      this.addLog('RX', ack);
    }, 200);

    return true;
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  /**
   * Generates production-ready Arduino C++ sketch matching hardware pinout requirements
   * for TWO (2) SEPARATE L298N MOTOR DRIVERS:
   *   - Driver 1 (L298N #1) dedicated to 60 RPM Motor A (Left Door Wing)
   *   - Driver 2 (L298N #2) dedicated to 60 RPM Motor B (Right Door Wing)
   * Prevents voltage drop, thermal overload, and motor stalling when driving high-torque 60 RPM motors!
   */
  public generateArduinoCode(settings: DashboardSettings): string {
    const t03 = settings.time0To3Dir1Ms || 8000;
    const t35 = settings.time3To5Dir1Ms || 8000;
    const t5p1 = settings.time5PlusDir1Ms || 3000;
    const t5p2 = settings.time5PlusDir2Ms || 4000;
    const t5prom = settings.time5PlusPromiseDir1Ms || 8000;
    const tHome = settings.timeHomeCloseDir2Ms || 8000;
    const normalPwm = settings.normalMotorSpeed || 220;
    const slowPwm = settings.slowMotorSpeed || 130;

    return `/*
 * =========================================================================
 * SAMATHULYAM — Ganesha Digital Wellbeing & Door Control System
 * Arduino Uno + DUAL (2x) L298N Motor Driver Controller
 * Dedicated Driver 1 for Motor A & Dedicated Driver 2 for Motor B (60 RPM)
 * =========================================================================
 * 
 * WHY 2 SEPARATE L298N MOTOR DRIVERS?
 *   A single L298N driver board overheats and suffers heavy voltage sag when
 *   powering two high-torque 60 RPM geared motors simultaneously. Using two
 *   independent L298N modules isolates the current, prevents thermal shutdown,
 *   and ensures full, reliable 12V torque to both 60 RPM door motors!
 * 
 * HARDWARE PINOUT CONFIGURATION:
 * -------------------------------------------------------------------------
 *   [DRIVER 1 (L298N #1) -> Channel 1: Motor A | Channel 2: Relay Module]
 *     Channel 1 - 60 RPM Motor A (Left Door Wing):
 *       ENA (PWM Speed)        -> Arduino Pin D5 (PWM)
 *       IN1 (Direction 1)      -> Arduino Pin D6
 *       IN2 (Direction 2)      -> Arduino Pin D7
 *       OUT1 & OUT2            -> 60 RPM Motor A terminals
 * 
 *     Channel 2 - Relay Module (Positive & Negative Power / Trigger):
 *       Relay VCC & GND        -> L298N #1 Channel 2 (OUT3 & OUT4) or 5V & GND
 *       Relay Digital/IN Signal-> Arduino Pin D4 (Exact Door Open Trigger)
 *       ENB (Channel 2 PWM)    -> Arduino Pin D3 (PWM)
 *       IN3 (Channel 2 Dir 1)  -> Arduino Pin D11
 *       IN4 (Channel 2 Dir 2)  -> Arduino Pin D12
 * 
 *   [DRIVER 2 (L298N #2) -> Dedicated to 60 RPM Motor B (Right Door Wing)]
 *     ENA (PWM Speed)          -> Arduino Pin D10 (PWM)
 *     IN1 (Direction 1)        -> Arduino Pin D8
 *     IN2 (Direction 2)        -> Arduino Pin D9
 *     OUT1 & OUT2              -> 60 RPM Motor B terminals
 * 
 *   [CONTROLS & STATUS]
 *     MANUAL_BTN (Override)    -> Arduino Pin D2 (Pushbutton to GND, Internal Pull-Up)
 *     STATUS_LED (Blessing)    -> Arduino Pin D13 (Built-in LED)
 *     RELAY_LED (Sanctum Light)-> Arduino Pin D4 (Relay Module Digital Pin)
 * 
 *   [RELAY & LED LIGHT LOGIC]:
 *     - When door OPEN sequence starts (0-3h, 3-5h, after-promise, manual):
 *       Relay module triggers ON with EXACT and ACCURATE timing, lighting the LED.
 *     - LED remains ON throughout the darshanam video and sacred +10s blessing delay!
 *     - When doors return to home & CLOSE (Direction 2) or on STOP:
 *       Relay module turns OFF, shutting off the LED.
 * 
 *   [POWER & COMMON GROUND WIRING - CRITICAL!]
 *     - 12V Power: Connect +12V DC (2A-3A) in PARALLEL to Driver 1 (12V) AND Driver 2 (12V).
 *     - Common Ground: Connect Arduino GND, Driver 1 GND, and Driver 2 GND together!
 *     - 5V Logic: Leave onboard 5V regulator jumpers ON (or supply 5V from Arduino).
 * =========================================================================
 */

// =================== PIN DEFINITIONS ===================
// Driver 1 (L298N #1) — Dedicated to 60 RPM Motor A (Left Door Wing)
#define PIN_M1_ENA  5    // Hardware PWM on Arduino Uno
#define PIN_M1_IN1  6    // Direction 1
#define PIN_M1_IN2  7    // Direction 2

// Driver 1 (L298N #1) — Channel 2 / Relay Module Connection
// Connect Relay Module Positive & Negative to L298N 1 Channel 2 (OUT3/OUT4 or 5V/GND)
// Connect Relay Module Digital/Signal Pin to Arduino Pin D4
#define PIN_RELAY_LED 4  // Arduino Digital Pin for Relay Module Signal / IN
#define PIN_M1_ENB    3  // L298N 1 Channel 2 Enable (Optional hardware PWM)
#define PIN_M1_IN3    11 // L298N 1 Channel 2 IN3
#define PIN_M1_IN4    12 // L298N 1 Channel 2 IN4

// Driver 2 (L298N #2) — Dedicated to 60 RPM Motor B (Right Door Wing)
#define PIN_M2_ENA  10   // Hardware PWM on Arduino Uno
#define PIN_M2_IN1  8    // Direction 1
#define PIN_M2_IN2  9    // Direction 2

// Manual Override Button & Status LED
#define PIN_MANUAL_BTN 2
#define PIN_STATUS_LED 13

// Relay Active State Configuration:
// Standard 5V Arduino Relay modules are active HIGH (or active LOW depending on model).
// Set to true if HIGH turns relay ON, false if LOW turns relay ON.
const bool RELAY_ACTIVE_HIGH = true;

// =================== MOTOR SYMMETRY / INVERSION CONFIG ===================
// If your door wings are mounted opposite to each other (mirrored), Motor B
// may need to spin in the opposite physical direction to open symmetrically!
// - If both door wings move in opposite directions, toggle INVERT_MOTOR_B to true:
const bool INVERT_MOTOR_B = false; // Set to true if Motor B needs reversed direction

// Configured Timings & Speeds (Dynamically calibrated from Dashboard Settings)
const unsigned long TIME_0_3_DIR1        = ${t03};        // 0-3h: Direction 1 default
const unsigned long TIME_3_5_DIR1        = ${t35};        // 3-5h: Direction 1 (SLOW) default
const unsigned long TIME_5PLUS_DIR1      = ${t5p1};       // 5+h Initial: Direction 1 default
const unsigned long TIME_5PLUS_DIR2      = ${t5p2};       // 5+h Initial: Direction 2 default
const unsigned long TIME_5PLUS_PROMISE   = ${t5prom};     // 5+h After Promise: Direction 1 default
const unsigned long TIME_HOME_CLOSE_DIR2 = ${tHome};      // Home Return: Direction 2 default
const unsigned long TIME_RELAY_DELAY_MS  = 5000;          // Turn ON Relay D4 at 5th second of opening

const int SPEED_NORMAL = ${normalPwm}; // Normal PWM Speed (220) - Strong torque for 60 RPM
const int SPEED_SLOW   = ${slowPwm};   // Slow PWM Speed (130)   - Gentle opening stroke

// Active mutable durations (can be modified via serial commands on-the-fly)
unsigned long runTime0To3     = TIME_0_3_DIR1;
unsigned long runTime3To5     = TIME_3_5_DIR1;
unsigned long runTime5P1      = TIME_5PLUS_DIR1;
unsigned long runTime5P2      = TIME_5PLUS_DIR2;
unsigned long runTimePromise  = TIME_5PLUS_PROMISE;
unsigned long runTimeHome     = TIME_HOME_CLOSE_DIR2;

enum DoorState {
  IDLE,
  RUNNING_0_3,
  RUNNING_3_5_SLOW,
  RUNNING_5PLUS_DIR1,
  RUNNING_5PLUS_DIR2,
  RUNNING_PROMISE,
  RUNNING_HOME_CLOSE
};

DoorState currentState = IDLE;
unsigned long stateStartTime = 0;
String inputString = "";
bool isDoorOpenState = false; // Tracks physical door open state
bool isRelayLedActive = false; // Tracks relay D4 state

// Forward declarations
void setRelayLed(bool turnOn);
void setMotorDirection(bool dir1);
void setMotorSpeed(int pwm);
void stopMotors();
void start0To3();
void start3To5Slow();
void start5PlusInitial();
void startAfterPromise();
void startHomeClose();
void processCommand(String cmd);

void setup() {
  Serial.begin(9600);
  
  // 1. Initialize Driver 1 (L298N #1 - Motor A) Pins
  pinMode(PIN_M1_ENA, OUTPUT);
  pinMode(PIN_M1_IN1, OUTPUT);
  pinMode(PIN_M1_IN2, OUTPUT);
  
  // 2. Initialize Relay Module Digital Pin & L298N 1 Channel 2 Pins
  pinMode(PIN_RELAY_LED, OUTPUT);
  pinMode(PIN_M1_ENB, OUTPUT);
  pinMode(PIN_M1_IN3, OUTPUT);
  pinMode(PIN_M1_IN4, OUTPUT);
  setRelayLed(false); // Ensure relay D4 is OFF initially
  isDoorOpenState = false;
  
  // 3. Initialize Driver 2 (L298N #2 - Motor B) Pins
  pinMode(PIN_M2_ENA, OUTPUT);
  pinMode(PIN_M2_IN1, OUTPUT);
  pinMode(PIN_M2_IN2, OUTPUT);
  
  // 4. Status LED & Button with internal pullup
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_MANUAL_BTN, INPUT_PULLUP);
  
  // Ensure both 60 RPM motors are fully stopped initially
  stopMotors();
  
  // Quick startup flash to confirm boot
  digitalWrite(PIN_STATUS_LED, HIGH);
  delay(300);
  digitalWrite(PIN_STATUS_LED, LOW);
  
  Serial.println(F("ARDUINO_READY:SAMATHULYAM_DUAL_L298N_SYSTEM_READY"));
  Serial.println(F("CONFIG: Driver 1 (Motor A -> D5, D6, D7) | Driver 2 (Motor B -> D10, D8, D9)"));
  Serial.println(F("CONFIG: Relay Module (Digital Pin D4 & L298N 1 Channel 2 for LED light)"));
  Serial.println(F("LOGIC: Relay D4 turns ON when door opens and stays ON continuously UNTIL door closes"));
  Serial.print(F("ARDUINO: TIME_0_3_DIR1 = "));
  Serial.print(runTime0To3);
  Serial.println(F(" ms"));
}

void loop() {
  // 1. Read USB Serial Commands
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\\n' || c == '\\r') {
      if (inputString.length() > 0) {
        inputString.trim();
        processCommand(inputString);
        inputString = "";
      }
    } else {
      inputString += c;
    }
  }

  // 2. Manual Button Override (Active LOW on Pin D2)
  if (digitalRead(PIN_MANUAL_BTN) == LOW) {
    delay(50);
    if (digitalRead(PIN_MANUAL_BTN) == LOW) {
      Serial.println(F("ARDUINO: Manual Button Pressed -> Toggle Door"));
      if (currentState == IDLE) {
        if (!isDoorOpenState) {
          start0To3(); // Open doors & turn D4 Relay ON
        } else {
          startHomeClose(); // Close doors & turn D4 Relay OFF once closed
        }
      } else {
        startHomeClose();
      }
      while (digitalRead(PIN_MANUAL_BTN) == LOW);
    }
  }

  // 3. Non-blocking Door State Machine
  unsigned long elapsed = millis() - stateStartTime;

  switch (currentState) {
    case RUNNING_0_3:
      // Turn ON Relay Pin D4 at 5th second (5000ms) of opening stroke
      if (elapsed >= TIME_RELAY_DELAY_MS && !isRelayLedActive) {
        setRelayLed(true);
        Serial.println(F("ARDUINO: [5th Second Reached] Relay Pin D4 ON - Sanctum Light Active"));
      }
      if (elapsed >= runTime0To3) {
        stopMotors(); // Motors stop moving, DOORS ARE FULLY OPEN (8s)
        currentState = IDLE;
        setRelayLed(true); // Guarantee Relay D4 remains ON
        Serial.print(F("ARDUINO: 0-3h Motion (Direction 1) Complete in "));
        Serial.print(runTime0To3);
        Serial.println(F(" ms. Doors FULL OPEN on Relay D4. Darshanam video & audio active."));
      }
      break;

    case RUNNING_3_5_SLOW:
      // Turn ON Relay Pin D4 at 5th second (5000ms) of slow opening stroke
      if (elapsed >= TIME_RELAY_DELAY_MS && !isRelayLedActive) {
        setRelayLed(true);
        Serial.println(F("ARDUINO: [5th Second Reached] Relay Pin D4 ON - Sanctum Light Active"));
      }
      if (elapsed >= runTime3To5) {
        stopMotors(); // Motors stop moving, DOORS ARE FULLY OPEN (8s)
        currentState = IDLE;
        setRelayLed(true); // Guarantee Relay D4 remains ON
        Serial.print(F("ARDUINO: 3-5h Motion (Direction 1 SLOW) Complete in "));
        Serial.print(runTime3To5);
        Serial.println(F(" ms. Doors FULL OPEN on Relay D4. Darshanam video & audio active."));
      }
      break;

    case RUNNING_5PLUS_DIR1:
      if (elapsed >= runTime5P1) {
        // Switch immediately to Direction 2 for runTime5P2
        setMotorDirection(false); // Direction 2
        setMotorSpeed(SPEED_NORMAL);
        currentState = RUNNING_5PLUS_DIR2;
        stateStartTime = millis();
        Serial.print(F("ARDUINO: 5+ Hours -> Switching to Direction 2 for "));
        Serial.print(runTime5P2);
        Serial.println(F(" ms..."));
      }
      break;

    case RUNNING_5PLUS_DIR2:
      if (elapsed >= runTime5P2) {
        stopMotors();
        setRelayLed(false); // 5+ initial partial open ended, doors closed -> Relay D4 OFF
        isDoorOpenState = false;
        currentState = IDLE;
        Serial.println(F("ARDUINO: 5+ Initial Motion Complete. Doors closed. Relay D4 OFF."));
      }
      break;

    case RUNNING_PROMISE:
      if (elapsed >= runTimePromise) {
        stopMotors(); // Motors stop moving, DOORS ARE OPEN
        currentState = IDLE;
        Serial.print(F("ARDUINO: 5+ After Promise Motion Complete in "));
        Serial.print(runTimePromise);
        Serial.println(F(" ms. Doors OPEN. Relay D4 remains ON until doors close."));
      }
      break;

    case RUNNING_HOME_CLOSE:
      if (elapsed >= runTimeHome) {
        stopMotors();
        setRelayLed(false); // DOORS ARE FULLY CLOSED -> Turn Relay D4 OFF!
        isDoorOpenState = false;
        currentState = IDLE;
        Serial.print(F("ARDUINO: Home Return Motion Complete in "));
        Serial.print(runTimeHome);
        Serial.println(F(" ms. Doors FULLY CLOSED -> Relay D4 OFF."));
      }
      break;

    case IDLE:
    default:
      break;
  }
}

void processCommand(String cmd) {
  cmd.trim();
  cmd.toUpperCase();
  Serial.print(F("ARDUINO_CMD_RECEIVED: "));
  Serial.println(cmd);

  // Check if command has a custom duration parameter e.g., "OPEN_0_3:5000" or "OPEN_0_3 5000"
  unsigned long paramDuration = 0;
  int sep = cmd.indexOf(':');
  if (sep == -1) sep = cmd.indexOf(' ');
  String baseCmd = cmd;
  if (sep != -1) {
    baseCmd = cmd.substring(0, sep);
    paramDuration = cmd.substring(sep + 1).toInt();
  }

  if (baseCmd == "OPEN_0_3" || baseCmd == "OPEN_FULL") {
    if (paramDuration > 0) runTime0To3 = paramDuration;
    start0To3();
  } else if (baseCmd == "OPEN_3_5" || baseCmd == "OPEN_SLOW") {
    if (paramDuration > 0) runTime3To5 = paramDuration;
    start3To5Slow();
  } else if (baseCmd == "OPEN_5_PLUS" || baseCmd == "OPEN_20_CLOSE" || baseCmd == "OPEN_PARTIAL") {
    start5PlusInitial();
  } else if (baseCmd == "OPEN_AFTER_PROMISE") {
    if (paramDuration > 0) runTimePromise = paramDuration;
    startAfterPromise();
  } else if (baseCmd == "CLOSE_HOME" || baseCmd == "CLOSE") {
    if (paramDuration > 0) runTimeHome = paramDuration;
    startHomeClose();
  } else if (baseCmd == "MOTOR_STOP") {
    stopMotors(); // Halts motor movement only, preserves Relay D4 state!
    currentState = IDLE;
    Serial.println(F("ARDUINO: Motors Halted (PWM 0). Relay D4 maintained."));
  } else if (baseCmd == "RELAY_ON" || baseCmd == "LED_ON") {
    setRelayLed(true);
  } else if (baseCmd == "RELAY_OFF" || baseCmd == "LED_OFF") {
    setRelayLed(false);
  } else if (baseCmd == "STOP") {
    stopMotors();
    setRelayLed(false);
    isDoorOpenState = false;
    currentState = IDLE;
    Serial.println(F("ARDUINO: EMERGENCY STOP - Motors & Relay D4 Halted"));
  } else {
    Serial.println(F("ARDUINO_ERR: UNKNOWN COMMAND"));
  }
}

/**
 * Accurately controls the Relay Module (Digital Pin D4 & L298N 1 Channel 2):
 * - Triggered ON with exact timing when doors open
 * - Remains ON throughout darshanam video and blessing delay
 * - Turned OFF only when doors fully close
 */
void setRelayLed(bool turnOn) {
  isRelayLedActive = turnOn;
  if (turnOn) {
    digitalWrite(PIN_RELAY_LED, RELAY_ACTIVE_HIGH ? HIGH : LOW);
    digitalWrite(PIN_STATUS_LED, HIGH);
    
    // Also drive L298N #1 Channel 2 outputs (OUT3 & OUT4) if relay/LED is wired directly
    digitalWrite(PIN_M1_IN3, HIGH);
    digitalWrite(PIN_M1_IN4, LOW);
    analogWrite(PIN_M1_ENB, 255);
    
    Serial.println(F("ARDUINO: [Relay D4] ON - Sanctum Light Active"));
  } else {
    digitalWrite(PIN_RELAY_LED, RELAY_ACTIVE_HIGH ? LOW : HIGH);
    digitalWrite(PIN_STATUS_LED, LOW);
    
    // Shut off L298N #1 Channel 2 outputs
    digitalWrite(PIN_M1_IN3, LOW);
    digitalWrite(PIN_M1_IN4, LOW);
    analogWrite(PIN_M1_ENB, 0);
    
    Serial.println(F("ARDUINO: [Relay D4] OFF - Doors Closed"));
  }
}

void start0To3() {
  isDoorOpenState = true;
  setRelayLed(false); // Relay D4 activates at 5th second during 8s opening stroke
  setMotorDirection(true); // Direction 1
  setMotorSpeed(SPEED_NORMAL);
  currentState = RUNNING_0_3;
  stateStartTime = millis();
  Serial.print(F("ARDUINO: Action -> 0-3h Run Dual L298N in Direction 1 for "));
  Serial.print(runTime0To3);
  Serial.println(F(" ms started (Relay D4 will turn ON at 5th second)"));
}

void start3To5Slow() {
  isDoorOpenState = true;
  setRelayLed(false); // Relay D4 activates at 5th second during 8s opening stroke
  setMotorDirection(true); // Direction 1
  setMotorSpeed(SPEED_SLOW); // SLOW Speed
  currentState = RUNNING_3_5_SLOW;
  stateStartTime = millis();
  Serial.print(F("ARDUINO: Action -> 3-5h Run Dual L298N SLOW in Direction 1 for "));
  Serial.print(runTime3To5);
  Serial.println(F(" ms started (Relay D4 will turn ON at 5th second)"));
}

void start5PlusInitial() {
  isDoorOpenState = false;
  setRelayLed(true); // Brief light during partial open
  setMotorDirection(true); // Direction 1
  setMotorSpeed(SPEED_NORMAL);
  currentState = RUNNING_5PLUS_DIR1;
  stateStartTime = millis();
  Serial.print(F("ARDUINO: Action -> 5+h Initial Run Dual L298N in Direction 1 for "));
  Serial.print(runTime5P1);
  Serial.println(F(" ms (then Direction 2) started (Relay D4 Active)"));
}

void startAfterPromise() {
  isDoorOpenState = true;
  setRelayLed(true); // Accurate & exact timing: Relay D4 ON when door opens
  setMotorDirection(true); // Direction 1
  setMotorSpeed(SPEED_NORMAL);
  currentState = RUNNING_PROMISE;
  stateStartTime = millis();
  Serial.print(F("ARDUINO: Action -> After Promise Run Dual L298N in Direction 1 for "));
  Serial.print(runTimePromise);
  Serial.println(F(" ms started (Relay D4 ON)"));
}

void startHomeClose() {
  // Motor runs in Direction 2 to close doors.
  // Relay D4 stays ON while doors swing shut, and turns OFF the moment doors fully close in loop()!
  setRelayLed(true); // Guarantee Relay D4 is ON while doors are closing
  setMotorDirection(false); // Direction 2
  setMotorSpeed(SPEED_NORMAL);
  currentState = RUNNING_HOME_CLOSE;
  stateStartTime = millis();
  Serial.print(F("ARDUINO: Action -> Return to Home: Run Dual L298N in Direction 2 for "));
  Serial.print(runTimeHome);
  Serial.println(F(" ms started (Relay D4 remains ON until doors fully close)"));
}

/**
 * Controls direction for BOTH L298N motor drivers independently:
 * - Driver 1 (L298N #1): Controls 60 RPM Motor A (Pins D6, D7)
 * - Driver 2 (L298N #2): Controls 60 RPM Motor B (Pins D8, D9)
 * Supports INVERT_MOTOR_B for mirrored mechanical door hinges.
 */
void setMotorDirection(bool dir1) {
  // === DRIVER 1 (L298N #1 - Motor A - 60 RPM) ===
  if (dir1) {
    // Direction 1 (Door Open Stroke)
    digitalWrite(PIN_M1_IN1, HIGH);
    digitalWrite(PIN_M1_IN2, LOW);
  } else {
    // Direction 2 (Door Close Stroke)
    digitalWrite(PIN_M1_IN1, LOW);
    digitalWrite(PIN_M1_IN2, HIGH);
  }

  // === DRIVER 2 (L298N #2 - Motor B - 60 RPM) ===
  bool m2Dir = INVERT_MOTOR_B ? !dir1 : dir1;
  if (m2Dir) {
    digitalWrite(PIN_M2_IN1, HIGH);
    digitalWrite(PIN_M2_IN2, LOW);
  } else {
    digitalWrite(PIN_M2_IN1, LOW);
    digitalWrite(PIN_M2_IN2, HIGH);
  }
}

/**
 * Sets PWM speed simultaneously on both L298N motor drivers:
 * - PIN_M1_ENA on D5 (Hardware PWM)
 * - PIN_M2_ENA on D10 (Hardware PWM)
 */
void setMotorSpeed(int pwm) {
  analogWrite(PIN_M1_ENA, pwm);
  analogWrite(PIN_M2_ENA, pwm);
}

/**
 * Immediately cuts off PWM and grounds all direction inputs across both L298N drivers.
 * CRITICAL: Does NOT touch PIN_RELAY_LED so Relay D4 stays ON continuously while doors are open!
 */
void stopMotors() {
  // Cut PWM speed to zero on both L298N boards
  analogWrite(PIN_M1_ENA, 0);
  analogWrite(PIN_M2_ENA, 0);
  
  // Discharge H-Bridge driver inputs
  digitalWrite(PIN_M1_IN1, LOW);
  digitalWrite(PIN_M1_IN2, LOW);
  digitalWrite(PIN_M2_IN1, LOW);
  digitalWrite(PIN_M2_IN2, LOW);
}
`;
  }
}

export const arduinoService = new ArduinoService();
