import { ScanRecord, DashboardSettings, DEFAULT_SETTINGS, CATEGORY_DETAILS } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'samathulyam_settings_v2',
  HISTORY: 'samathulyam_scan_history_v2',
};

const DB_NAME = 'SamathulyamDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_store';
const STORE_KV = 'kv_store';

const INITIAL_DEMO_RECORDS: ScanRecord[] = [
  {
    id: 'SAM-101',
    timestamp: Date.now() - 1000 * 60 * 35,
    screenTimeMinutes: 110, // 1h 50m
    screenTimeString: '1h 50m',
    category: 'HEALTHY',
    teluguMessage: CATEGORY_DETAILS.HEALTHY.teluguMessage,
    englishMessage: CATEGORY_DETAILS.HEALTHY.englishMessage,
    arduinoCommand: 'OPEN_FULL',
    doorAction: 'Full Open (100%)',
    confidence: 94,
    source: 'camera_auto',
  },
  {
    id: 'SAM-102',
    timestamp: Date.now() - 1000 * 60 * 80,
    screenTimeMinutes: 240, // 4h 00m
    screenTimeString: '4h 00m',
    category: 'WARNING',
    teluguMessage: CATEGORY_DETAILS.WARNING.teluguMessage,
    englishMessage: CATEGORY_DETAILS.WARNING.englishMessage,
    arduinoCommand: 'OPEN_SLOW',
    doorAction: 'Slow Partial Open (50%)',
    confidence: 91,
    source: 'camera_auto',
  },
  {
    id: 'SAM-103',
    timestamp: Date.now() - 1000 * 60 * 140,
    screenTimeMinutes: 375, // 6h 15m
    screenTimeString: '6h 15m',
    category: 'HIGH_RISK',
    teluguMessage: CATEGORY_DETAILS.HIGH_RISK.teluguMessage,
    englishMessage: CATEGORY_DETAILS.HIGH_RISK.englishMessage,
    arduinoCommand: 'OPEN_20_CLOSE',
    doorAction: '20% Peek & Auto-Close',
    confidence: 96,
    source: 'camera_auto',
  },
  {
    id: 'SAM-104',
    timestamp: Date.now() - 1000 * 60 * 210,
    screenTimeMinutes: 135, // 2h 15m
    screenTimeString: '2h 15m',
    category: 'HEALTHY',
    teluguMessage: CATEGORY_DETAILS.HEALTHY.teluguMessage,
    englishMessage: CATEGORY_DETAILS.HEALTHY.englishMessage,
    arduinoCommand: 'OPEN_FULL',
    doorAction: 'Full Open (100%)',
    confidence: 89,
    source: 'camera_auto',
  },
];

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private subscribers: Array<(settings: DashboardSettings) => void> = [];
  private mediaUrlCache: Map<string, string> = new Map();

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA);
        }
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('IndexedDB failed to open:', req.error);
        reject(req.error);
      };
    });

    return this.dbPromise;
  }

  public async saveMediaBlob(key: string, blob: Blob | File): Promise<string> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MEDIA, 'readwrite');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.put(blob, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Revoke old object URL if exists
      if (this.mediaUrlCache.has(key)) {
        try {
          URL.revokeObjectURL(this.mediaUrlCache.get(key)!);
        } catch {
          // Ignore
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      this.mediaUrlCache.set(key, objectUrl);
      return objectUrl;
    } catch (e) {
      console.warn('Failed to save media blob in IndexedDB:', e);
      return URL.createObjectURL(blob);
    }
  }

  public async getMediaBlob(key: string): Promise<Blob | null> {
    try {
      const db = await this.initDB();
      return await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(STORE_MEDIA, 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  public async deleteMediaBlob(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MEDIA, 'readwrite');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      if (this.mediaUrlCache.has(key)) {
        try {
          URL.revokeObjectURL(this.mediaUrlCache.get(key)!);
        } catch {
          // Ignore
        }
        this.mediaUrlCache.delete(key);
      }
    } catch {
      // Ignore
    }
  }

  public getSettings(): DashboardSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new calibrated motor timings exist with exact user defaults:
        // 1. 0-3h: 8s in Direction 1
        if (typeof parsed.time0To3Dir1Ms !== 'number') parsed.time0To3Dir1Ms = 8000;
        // 2. 3-5h: 8s in Direction 1 (SLOW)
        if (typeof parsed.time3To5Dir1Ms !== 'number') parsed.time3To5Dir1Ms = 8000;
        // 3. 5+h Initial: 3s in Direction 1, 4s in Direction 2
        if (typeof parsed.time5PlusDir1Ms !== 'number') parsed.time5PlusDir1Ms = 3000;
        if (typeof parsed.time5PlusDir2Ms !== 'number') parsed.time5PlusDir2Ms = 4000;
        // 4. 5+h After Promise: 8s in Direction 1
        if (typeof parsed.time5PlusPromiseDir1Ms !== 'number') parsed.time5PlusPromiseDir1Ms = 8000;
        // 5. Coming to Home page: 8s in Direction 2
        if (typeof parsed.timeHomeCloseDir2Ms !== 'number') parsed.timeHomeCloseDir2Ms = 8000;
        if (typeof parsed.autoCloseOnHome !== 'boolean') parsed.autoCloseOnHome = true;
        if (typeof parsed.doorOpenVideoDelaySec !== 'number' || parsed.doorOpenVideoDelaySec === 0 || parsed.doorOpenVideoDelaySec === 4 || parsed.doorOpenVideoDelaySec === 4.5) parsed.doorOpenVideoDelaySec = 8;
        if (typeof parsed.relayOnDelaySec !== 'number') parsed.relayOnDelaySec = 5;

        if (!parsed.normalMotorSpeed) parsed.normalMotorSpeed = 220;
        if (!parsed.slowMotorSpeed) parsed.slowMotorSpeed = 130;
        if (!parsed.healthyThresholdHours) parsed.healthyThresholdHours = 3;
        if (!parsed.warningThresholdHours) parsed.warningThresholdHours = 5;
        if (typeof parsed.showLogos !== 'boolean') parsed.showLogos = true;
        if (!parsed.logoSize) parsed.logoSize = 'large';
        if (!parsed.logo1Title) parsed.logo1Title = DEFAULT_SETTINGS.logo1Title;
        if (!parsed.logo2Title) parsed.logo2Title = DEFAULT_SETTINGS.logo2Title;

        // Keep aliases synchronized
        parsed.fullOpenTimeMs = parsed.time0To3Dir1Ms;
        parsed.slowOpenTimeMs = parsed.time3To5Dir1Ms;
        parsed.closeTimeMs = parsed.timeHomeCloseDir2Ms;

        // Auto-save the updated calibrated timings to localStorage so they stick immediately
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            ...parsed,
            fullOpenTimeMs: parsed.fullOpenTimeMs,
            slowOpenTimeMs: parsed.slowOpenTimeMs,
            partialOpenTimeMs: parsed.partialOpenTimeMs,
            twentyPercentOpenTimeMs: parsed.twentyPercentOpenTimeMs,
            closeTimeMs: parsed.closeTimeMs,
          }));
        } catch {}

        const mergedAgeVideos = {
          '0-12': { ...DEFAULT_SETTINGS.ageVideos?.['0-12'], ...(parsed.ageVideos?.['0-12'] || {}) },
          '13-21': { ...DEFAULT_SETTINGS.ageVideos?.['13-21'], ...(parsed.ageVideos?.['13-21'] || {}) },
          '21+': { ...DEFAULT_SETTINGS.ageVideos?.['21+'], ...(parsed.ageVideos?.['21+'] || {}) },
        };

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          videoUrls: { ...DEFAULT_SETTINGS.videoUrls, ...(parsed.videoUrls || {}), ...(parsed.videos || {}) },
          videos: { ...DEFAULT_SETTINGS.videoUrls, ...(parsed.videoUrls || {}), ...(parsed.videos || {}) },
          ageVideos: mergedAgeVideos,
        };
      }
    } catch {
      // Fallback to default
    }
    return { ...DEFAULT_SETTINGS };
  }

  public async loadPersistedSettings(): Promise<DashboardSettings> {
    const baseSettings = this.getSettings();

    try {
      // Hydrate custom media files from IndexedDB
      const videoKeys: Array<{ key: string; categoryKey: string }> = [
        { key: 'video_1_TO_3_DAYS', categoryKey: '1_TO_3_DAYS' },
        { key: 'video_3_TO_5_DAYS', categoryKey: '3_TO_5_DAYS' },
        { key: 'video_5_TO_7_DAYS', categoryKey: '5_TO_7_DAYS' },
        { key: 'video_7_PLUS_DAYS', categoryKey: '7_PLUS_DAYS' },
        { key: 'video_0_TO_3_HOURS', categoryKey: '0_TO_3_HOURS' },
        { key: 'video_3_TO_5_HOURS', categoryKey: '3_TO_5_HOURS' },
        { key: 'video_5_PLUS_HOURS', categoryKey: '5_PLUS_HOURS' },
      ];

      const hydratedVideos = { ...baseSettings.videos, ...baseSettings.videoUrls };

      for (const { key, categoryKey } of videoKeys) {
        const blob = await this.getMediaBlob(key);
        if (blob) {
          const url = URL.createObjectURL(blob);
          this.mediaUrlCache.set(key, url);
          hydratedVideos[categoryKey] = url;
        }
      }

      // Hydrate age-based custom video uploads from IndexedDB
      const hydratedAgeVideos = {
        '0-12': { ...baseSettings.ageVideos?.['0-12'] },
        '13-21': { ...baseSettings.ageVideos?.['13-21'] },
        '21+': { ...baseSettings.ageVideos?.['21+'] },
      };

      const ageGroups: Array<'0-12' | '13-21' | '21+'> = ['0-12', '13-21', '21+'];
      const ageTiers: Array<'default' | 'healthy' | 'moderate' | 'highRisk'> = ['default', 'healthy', 'moderate', 'highRisk'];

      for (const ag of ageGroups) {
        for (const tier of ageTiers) {
          const storageKey = `age_video_${ag}_${tier}`;
          const blob = await this.getMediaBlob(storageKey);
          if (blob) {
            const url = URL.createObjectURL(blob);
            this.mediaUrlCache.set(storageKey, url);
            if (!hydratedAgeVideos[ag]) {
              hydratedAgeVideos[ag] = {};
            }
            hydratedAgeVideos[ag][tier] = url;
          }
        }
      }

      // Hydrate custom voice guidance audio
      let hydratedVoiceUrl = baseSettings.voiceGuidanceCustomAudioUrl;
      const voiceBlob = await this.getMediaBlob('voice_guidance_custom');
      if (voiceBlob) {
        const voiceUrl = URL.createObjectURL(voiceBlob);
        this.mediaUrlCache.set('voice_guidance_custom', voiceUrl);
        hydratedVoiceUrl = voiceUrl;
      }

      // Hydrate custom manual door media
      let hydratedManualDoorVideo = baseSettings.manualDoorVideoUrl;
      const manualDoorBlob = await this.getMediaBlob('manual_door_video_file');
      if (manualDoorBlob) {
        const manualVideoUrl = URL.createObjectURL(manualDoorBlob);
        this.mediaUrlCache.set('manual_door_video_file', manualVideoUrl);
        hydratedManualDoorVideo = manualVideoUrl;
      }

      // Hydrate 5+ hours God voice audio
      let hydratedPromiseVoiceUrl = baseSettings.promiseVoiceAudioUrl;
      const promiseVoiceBlob = await this.getMediaBlob('god_voice_5_plus_promise');
      if (promiseVoiceBlob) {
        const pUrl = URL.createObjectURL(promiseVoiceBlob);
        this.mediaUrlCache.set('god_voice_5_plus_promise', pUrl);
        hydratedPromiseVoiceUrl = pUrl;
      }

      // Hydrate Age Selection screen navigation voice audio
      let hydratedAgeNavVoiceUrl = baseSettings.ageNavVoiceAudioUrl;
      const ageNavBlob = await this.getMediaBlob('age_nav_voice_custom');
      if (ageNavBlob) {
        const navUrl = URL.createObjectURL(ageNavBlob);
        this.mediaUrlCache.set('age_nav_voice_custom', navUrl);
        hydratedAgeNavVoiceUrl = navUrl;
      }

      // Hydrate trained devotee reference promise audio sample
      let hydratedTrainedAudioUrl = baseSettings.trainedPromiseAudioUrl;
      const trainedAudioBlob = await this.getMediaBlob('trained_promise_audio_sample');
      if (trainedAudioBlob) {
        const tUrl = URL.createObjectURL(trainedAudioBlob);
        this.mediaUrlCache.set('trained_promise_audio_sample', tUrl);
        hydratedTrainedAudioUrl = tUrl;
      }

      // Hydrate Website Logos (Round Cropped)
      let hydratedLogo1Url = baseSettings.logo1Url;
      const logo1Blob = await this.getMediaBlob('logo_1_primary');
      if (logo1Blob) {
        const l1Url = URL.createObjectURL(logo1Blob);
        this.mediaUrlCache.set('logo_1_primary', l1Url);
        hydratedLogo1Url = l1Url;
      }

      let hydratedLogo2Url = baseSettings.logo2Url;
      const logo2Blob = await this.getMediaBlob('logo_2_secondary');
      if (logo2Blob) {
        const l2Url = URL.createObjectURL(logo2Blob);
        this.mediaUrlCache.set('logo_2_secondary', l2Url);
        hydratedLogo2Url = l2Url;
      }

      const fullSettings: DashboardSettings = {
        ...baseSettings,
        videoUrls: hydratedVideos,
        videos: hydratedVideos,
        ageVideos: hydratedAgeVideos,
        voiceGuidanceCustomAudioUrl: hydratedVoiceUrl,
        manualDoorVideoUrl: hydratedManualDoorVideo,
        promiseVoiceAudioUrl: hydratedPromiseVoiceUrl,
        ageNavVoiceAudioUrl: hydratedAgeNavVoiceUrl,
        trainedPromiseAudioUrl: hydratedTrainedAudioUrl,
        logo1Url: hydratedLogo1Url,
        logo2Url: hydratedLogo2Url,
      };

      return fullSettings;
    } catch (e) {
      console.warn('Error hydrating persisted media settings:', e);
      return baseSettings;
    }
  }

  public saveSettings(settings: DashboardSettings) {
    try {
      // Create a clean serializable clone without temporary in-memory blob URLs for localStorage
      const cleanSettings = { ...settings };
      
      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleanSettings));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
      // If quota exceeded due to any large fields, strip bulky audio strings and retry
      try {
        const fallbackSettings = {
          ...settings,
          voiceGuidanceCustomAudioUrl: settings.voiceGuidanceCustomAudioUrl?.startsWith('data:')
            ? ''
            : settings.voiceGuidanceCustomAudioUrl,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(fallbackSettings));
      } catch {
        // Ignore fallback errors
      }
    }

    // Save to IndexedDB as well for deep durability
    this.saveSettingsToIDB(settings).catch(() => {});

    // Notify listeners
    this.notifySubscribers(settings);
  }

  private async saveSettingsToIDB(settings: DashboardSettings): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, 'readwrite');
        const store = tx.objectStore(STORE_KV);
        const req = store.put(settings, 'dashboard_settings');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IDB save settings error:', e);
    }
  }

  public subscribe(callback: (settings: DashboardSettings) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notifySubscribers(settings: DashboardSettings) {
    this.subscribers.forEach((cb) => {
      try {
        cb(settings);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  public getHistory(): ScanRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    this.saveHistory(INITIAL_DEMO_RECORDS);
    return INITIAL_DEMO_RECORDS;
  }

  public saveHistory(records: ScanRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
    } catch (e) {
      console.warn('Could not save history:', e);
    }
  }

  public addScanRecord(record: Omit<ScanRecord, 'id' | 'timestamp'>): ScanRecord {
    const history = this.getHistory();
    const count = history.length + 101;
    const newRecord: ScanRecord = {
      ...record,
      id: `SAM-${count}`,
      timestamp: Date.now(),
    };
    const updated = [newRecord, ...history];
    this.saveHistory(updated);
    return newRecord;
  }

  public clearAllHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.warn('Could not clear history:', e);
    }
  }

  public exportCsv(records: ScanRecord[]) {
    if (records.length === 0) return;

    const headers = [
      'User ID',
      'Timestamp',
      'Date & Time',
      'Screen Time (Minutes)',
      'Screen Time (Formatted)',
      'Category',
      'Telugu Message',
      'Door Action',
      'Arduino Command',
      'Confidence (%)',
      'Scan Source',
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      r.timestamp,
      `"${new Date(r.timestamp).toLocaleString()}"`,
      r.screenTimeMinutes,
      `"${r.screenTimeString}"`,
      `"${r.category}"`,
      `"${r.teluguMessage.replace(/"/g, '""')}"`,
      `"${r.doorAction}"`,
      `"${r.arduinoCommand}"`,
      `${r.confidence}%`,
      `"${r.source}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `samathulyam_ganesha_scan_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const storageService = new StorageService();
