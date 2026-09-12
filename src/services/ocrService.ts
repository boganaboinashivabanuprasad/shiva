import { createWorker, Worker } from 'tesseract.js';
import { ScreenTimeCategory } from '../types';

export interface OcrDetectionResult {
  detected: boolean;
  rawText: string;
  screenTimeMinutes: number;
  screenTimeString: string;
  confidence: number;
  category: ScreenTimeCategory;
  deviceOrAppType?: string;
  sourceEngine?: 'gemini_vision_ai' | 'tesseract_client';
  notes?: string;
}

class OcrService {
  private worker: Worker | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<Worker | null> | null = null;

  public async getWorker(): Promise<Worker | null> {
    if (this.worker) return this.worker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const worker = await createWorker('eng');
        this.worker = worker;
        this.isInitializing = false;
        return worker;
      } catch (err) {
        console.error('Failed to initialize Tesseract worker:', err);
        this.isInitializing = false;
        return null;
      }
    })();

    return this.initPromise;
  }

  /**
   * High-accuracy Server-Side Multimodal Vision AI detection (Gemini 3.7 Flash)
   * Resolves difficult tilted angles, mobile reflections, donut charts, and low contrast
   */
  public async recognizeWithGeminiVision(
    canvas: HTMLCanvasElement,
    healthyThreshold = 3,
    warningThreshold = 5
  ): Promise<OcrDetectionResult | null> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Downscale image to compact size (max 640px) for blazing fast upload (<30ms) while keeping digits crisp
      const MAX_DIM = 640;
      let uploadCanvas = canvas;
      if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
        const scale = Math.min(MAX_DIM / canvas.width, MAX_DIM / canvas.height);
        const downscaled = document.createElement('canvas');
        downscaled.width = Math.round(canvas.width * scale);
        downscaled.height = Math.round(canvas.height * scale);
        const dCtx = downscaled.getContext('2d');
        if (dCtx) {
          dCtx.imageSmoothingEnabled = true;
          dCtx.drawImage(canvas, 0, 0, downscaled.width, downscaled.height);
          uploadCanvas = downscaled;
        }
      }

      // Compact 0.72 quality JPEG creates ~25KB payload for instantaneous transmission
      const imageBase64 = uploadCanvas.toDataURL('image/jpeg', 0.72);

      // Fast abort controller (max 2200ms) so recognition never hangs
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2200);

      const response = await fetch('/api/ocr/analyze-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data && data.detected && Number.isFinite(data.totalMinutes) && data.totalMinutes > 0 && data.totalMinutes <= 1440) {
        const category = this.classifyMinutes(data.totalMinutes, healthyThreshold, warningThreshold);
        return {
          detected: true,
          rawText: data.rawSnippet || data.formatted || '',
          screenTimeMinutes: data.totalMinutes,
          screenTimeString: data.formatted || `${data.hours}h ${data.minutes}m`,
          confidence: Number.isFinite(data.confidence) ? Math.min(100, Math.max(0, data.confidence)) : 0,
          category,
          deviceOrAppType: data.deviceOrAppType || 'Digital Wellbeing',
          sourceEngine: 'gemini_vision_ai',
          notes: data.notes || '',
        };
      }

      return null;
    } catch (err) {
      // Abort or network failure: immediately proceed to fallback
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Preprocess canvas in multiple modes to handle:
   * 1. High contrast
   * 2. Inverted mode for Dark Mode screens (white text on dark background)
   * 3. Center crop (where mobile screen digits reside)
   * 4. Binarized thresholding
   */
  public generateProcessedCanvases(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement[] {
    const list: HTMLCanvasElement[] = [];
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // 1. Full Frame with high contrast
    const c1 = document.createElement('canvas');
    c1.width = width;
    c1.height = height;
    const ctx1 = c1.getContext('2d');
    if (ctx1) {
      ctx1.drawImage(sourceCanvas, 0, 0);
      const imgData = ctx1.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const factor = 1.6;
        const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
      }
      ctx1.putImageData(imgData, 0, 0);
      list.push(c1);
    }

    // 2. Inverted for Dark Mode mobile screens (white text on dark AMOLED)
    const c2 = document.createElement('canvas');
    c2.width = width;
    c2.height = height;
    const ctx2 = c2.getContext('2d');
    if (ctx2) {
      ctx2.drawImage(sourceCanvas, 0, 0);
      const imgData = ctx2.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const inverted = 255 - gray;
        data[i] = inverted;
        data[i + 1] = inverted;
        data[i + 2] = inverted;
      }
      ctx2.putImageData(imgData, 0, 0);
      list.push(c2);
    }

    // 3. Center crop (where mobile screen digits like 3 hrs 45 mins reside)
    const cropX = Math.floor(width * 0.15);
    const cropY = Math.floor(height * 0.15);
    const cropW = Math.floor(width * 0.7);
    const cropH = Math.floor(height * 0.7);

    const c3 = document.createElement('canvas');
    c3.width = cropW;
    c3.height = cropH;
    const ctx3 = c3.getContext('2d');
    if (ctx3) {
      ctx3.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      list.push(c3);
    }

    // 4. Adaptive Binarized Threshold Canvas for high glare / low contrast screens
    const c4 = document.createElement('canvas');
    c4.width = cropW;
    c4.height = cropH;
    const ctx4 = c4.getContext('2d');
    if (ctx4) {
      ctx4.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const imgData = ctx4.getImageData(0, 0, cropW, cropH);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bw = gray > 130 ? 255 : 0;
        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
      }
      ctx4.putImageData(imgData, 0, 0);
      list.push(c4);
    }

    return list;
  }

  /**
   * Parse extracted OCR text for all Android Digital Wellbeing & iOS Screen Time formats
   */
  public parseScreenTime(text: string, _healthyThreshold = 3, _warningThreshold = 5): {
    minutes: number;
    formatted: string;
    matchedPattern: string;
  } | null {
    if (!text || text.trim().length === 0) return null;

    // Normalize OCR text
    let normalized = text
      .toLowerCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/[|│]/g, 'l')
      .replace(/•/g, ' ')
      .replace(/(\d)\s*[:.]\s*(\d)/g, '$1:$2');

    // Pattern 0: Telugu Screen Time labels (e.g. "3 గంటల 45 నిమిషాలు")
    const teluguRegex = /(\d{1,2})\s*(?:గంటలు|గంటల|గంట)\s*[,.\s-]*\s*(\d{1,2})\s*(?:నిమిషాలు|నిమిషం)/i;
    const matchTelugu = normalized.match(teluguRegex);
    if (matchTelugu) {
      const hours = parseInt(matchTelugu[1], 10);
      const minutes = parseInt(matchTelugu[2], 10);
      if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
        return {
          minutes: hours * 60 + minutes,
          formatted: `${hours}h ${minutes}m`,
          matchedPattern: matchTelugu[0],
        };
      }
    }

    // Pattern 1: Exact "3 hrs, 45 mins", "3 hrs 45 mins", "3h 45m", "3h45m", "3 hours 45 minutes", "3 hr, 45 min"
    const standardRegex = /(\d{1,2})\s*(?:h|hr|hrs|hour|hours)\s*[,.\s-]*\s*(\d{1,2})\s*(?:m|min|mins|minutes)/i;
    const matchStd = normalized.match(standardRegex);
    if (matchStd) {
      const hours = parseInt(matchStd[1], 10);
      const minutes = parseInt(matchStd[2], 10);
      if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0) {
          return {
            minutes: totalMinutes,
            formatted: `${hours}h ${minutes}m`,
            matchedPattern: matchStd[0],
          };
        }
      }
    }

    // Pattern 2: Digital Wellbeing donut chart center "TODAY 3 hrs, 45 mins" or "3 hrs, 45 mins" without suffix on second digit
    const donutRegex = /(?:today|daily|usage|screen|tools)?\s*(\d{1,2})\s*(?:hrs|hr|hours|h)\s*[,.\s-]+\s*(\d{1,2})\s*(?:mins|min|m)?/i;
    const matchDonut = normalized.match(donutRegex);
    if (matchDonut) {
      const hours = parseInt(matchDonut[1], 10);
      const minutes = parseInt(matchDonut[2], 10);
      if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0) {
          return {
            minutes: totalMinutes,
            formatted: `${hours}h ${minutes}m`,
            matchedPattern: matchDonut[0],
          };
        }
      }
    }

    // Pattern 3: Digital Wellbeing timer / clock format "X:YY" e.g. "3:45"
    const clockRegex = /(?:screen|time|today|daily|total|usage|screen time|avg|app)?\s*(\d{1,2}):(\d{2})/i;
    const matchClock = normalized.match(clockRegex);
    if (matchClock) {
      const hours = parseInt(matchClock[1], 10);
      const minutes = parseInt(matchClock[2], 10);
      if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0 && totalMinutes <= 1440) {
          return {
            minutes: totalMinutes,
            formatted: `${hours}h ${minutes}m`,
            matchedPattern: matchClock[0],
          };
        }
      }
    }

    // Pattern 4: Hours only: "4h", "5 hr", "3 hrs", "5 hours", "3.5h"
    const hoursRegex = /(\d{1,2})(?:[.](\d))?\s*(?:h|hr|hrs|hour|hours)(?!\w)/i;
    const matchHours = normalized.match(hoursRegex);
    if (matchHours) {
      const wholeHours = parseInt(matchHours[1], 10);
      const decimal = matchHours[2] ? parseFloat(`0.${matchHours[2]}`) : 0;
      const totalMinutes = Math.round((wholeHours + decimal) * 60);
      if (wholeHours >= 0 && wholeHours <= 24 && totalMinutes > 0) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return {
          minutes: totalMinutes,
          formatted: m > 0 ? `${h}h ${m}m` : `${h}h 00m`,
          matchedPattern: matchHours[0],
        };
      }
    }

    // Pattern 5: Minutes only: "45m", "50 min", "45 mins", "120 minutes"
    const minRegex = /(\d{1,3})\s*(?:m|min|mins|minutes)(?!\w)/i;
    const matchMin = normalized.match(minRegex);
    if (matchMin) {
      const minutes = parseInt(matchMin[1], 10);
      if (minutes > 0 && minutes < 1440) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return {
          minutes,
          formatted: h > 0 ? `${h}h ${m}m` : `${m}m`,
          matchedPattern: matchMin[0],
        };
      }
    }

    // Pattern 6: Standalone pair "3 45" after keywords like "today", "screen", "digital"
    const looseRegex = /(?:screen|time|today|daily|total|wellbeing)\s*[:=-]?\s*(\d{1,2})\s+(\d{2})/i;
    const matchLoose = normalized.match(looseRegex);
    if (matchLoose) {
      const hours = parseInt(matchLoose[1], 10);
      const minutes = parseInt(matchLoose[2], 10);
      if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
        const totalMinutes = hours * 60 + minutes;
        return {
          minutes: totalMinutes,
          formatted: `${hours}h ${minutes}m`,
          matchedPattern: matchLoose[0],
        };
      }
    }

    return null;
  }

  public classifyMinutes(minutes: number, healthyThreshold = 3, warningThreshold = 5): ScreenTimeCategory {
    const hours = minutes / 60;
    if (hours <= healthyThreshold) {
      return '0_TO_3_HOURS';
    } else if (hours < warningThreshold) {
      return '3_TO_5_HOURS';
    } else {
      return '5_PLUS_HOURS';
    }
  }

  /**
   * Process a live video canvas or image element:
   * First calls the server vision endpoint, then falls back to client-side OCR.
   * If offline or fallback needed, runs enhanced client-side Tesseract OCR.
   */
  public async recognizeFrame(
    canvas: HTMLCanvasElement,
    healthyThreshold = 3,
    warningThreshold = 5
  ): Promise<OcrDetectionResult> {
    // 1. Primary Engine: High Precision Gemini Vision AI
    const aiVisionResult = await this.recognizeWithGeminiVision(canvas, healthyThreshold, warningThreshold);
    if (aiVisionResult && aiVisionResult.detected) {
      return aiVisionResult;
    }

    // 2. Secondary Engine: Fast Single-Pass Fallback
    const worker = await this.getWorker();
    if (!worker) {
      return {
        detected: false,
        rawText: '',
        screenTimeMinutes: 0,
        screenTimeString: '',
        confidence: 0,
        category: 'HEALTHY',
        sourceEngine: 'tesseract_client',
      };
    }

    try {
      // Fast single pass on center-cropped canvas (where digital wellbeing clock digits reside)
      const canvases = this.generateProcessedCanvases(canvas);
      const targetCanvas = canvases[2] || canvas; // Center crop

      // Await completion; abandoning a promise does not cancel a Tesseract job.
      const result = await worker.recognize(targetCanvas);

      if (result && result.data && result.data.text) {
        const text = result.data.text || '';
        const parsed = this.parseScreenTime(text, healthyThreshold, warningThreshold);
        if (parsed && parsed.minutes > 0 && parsed.minutes <= 1440) {
          const category = this.classifyMinutes(parsed.minutes, healthyThreshold, warningThreshold);
          return {
            detected: true,
            rawText: text.trim(),
            screenTimeMinutes: parsed.minutes,
            screenTimeString: parsed.formatted,
            confidence: result.data.confidence || 0,
            category,
            sourceEngine: 'tesseract_client',
          };
        }
      }

      return {
        detected: false,
        rawText: '',
        screenTimeMinutes: 0,
        screenTimeString: '',
        confidence: 0,
        category: 'HEALTHY',
        sourceEngine: 'tesseract_client',
      };
    } catch (err) {
      return {
        detected: false,
        rawText: '',
        screenTimeMinutes: 0,
        screenTimeString: '',
        confidence: 0,
        category: 'HEALTHY',
        sourceEngine: 'tesseract_client',
      };
    }
  }
}

export const ocrService = new OcrService();
