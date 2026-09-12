import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large payload (base64 camera snapshots)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Gemini Client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // ==========================================
  // Dedicated Certificate Image Storage & WhatsApp Preview API
  // ==========================================
  interface CertificateRecord {
    id: string;
    imageBase64: string;
    mimeType: string;
    recipientName: string;
    achievementTitle: string;
    certificateId: string;
    createdAt: number;
  }
  const certificateStore = new Map<string, CertificateRecord>();
  const CERT_STORAGE_FILE = path.join(process.cwd(), '.certificates_store.json');

  // Load persisted certificates on startup
  try {
    if (fs.existsSync(CERT_STORAGE_FILE)) {
      const storedData = JSON.parse(fs.readFileSync(CERT_STORAGE_FILE, 'utf-8'));
      if (Array.isArray(storedData)) {
        for (const item of storedData) {
          if (item && item.id) {
            certificateStore.set(item.id, item);
          }
        }
        console.log(`Loaded ${certificateStore.size} certificates from persistent cache.`);
      }
    }
  } catch (err) {
    console.warn('Could not load persistent certificates:', err);
  }

  const saveCertificatesToDisk = () => {
    try {
      const list = Array.from(certificateStore.values()).slice(-60); // keep most recent 60
      fs.writeFileSync(CERT_STORAGE_FILE, JSON.stringify(list), 'utf-8');
    } catch (err) {
      console.warn('Could not save certificates to disk:', err);
    }
  };

  // Certificate Upload API
  app.post('/api/certificate/upload', (req, res) => {
    try {
      const { id, imageBase64, recipientName, achievementTitle, certificateId } = req.body;
      if (!id || !imageBase64) {
        return res.status(400).json({ error: 'id and imageBase64 are required' });
      }

      // Extract raw base64 data
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      certificateStore.set(id, {
        id,
        imageBase64: cleanBase64,
        mimeType: 'image/png',
        recipientName: recipientName || 'Devotee',
        achievementTitle: achievementTitle || 'Sankalpam Dedication',
        certificateId: certificateId || id,
        createdAt: Date.now(),
      });

      // Maintain cache size to prevent memory bloat
      if (certificateStore.size > 200) {
        const oldestKey = certificateStore.keys().next().value;
        if (oldestKey) certificateStore.delete(oldestKey);
      }

      saveCertificatesToDisk();

      const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString();
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const computedUrl = `${proto}://${host}`.replace(/^http:/, 'https:');
      const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : computedUrl;

      return res.json({
        success: true,
        id,
        imageUrl: `${baseUrl}/api/certificate/image/${id}.png`,
        viewUrl: `${baseUrl}/api/certificate/view/${id}`,
      });
    } catch (err: any) {
      console.error('Certificate upload error:', err);
      return res.status(500).json({ error: err.message || 'Failed to store certificate' });
    }
  });

  // Certificate Image API (Direct Raw PNG buffer)
  app.get('/api/certificate/image/:id', (req, res) => {
    const rawId = req.params.id.replace(/\.png$/i, '');
    const cert = certificateStore.get(rawId);
    if (!cert) {
      return res.status(404).send('Certificate image not found or expired');
    }

    const buffer = Buffer.from(cert.imageBase64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', `inline; filename="Sankalpam-Certificate-${rawId}.png"`);
    return res.send(buffer);
  });

  // Certificate View API (Rich preview with Open Graph tags for WhatsApp cards)
  app.get('/api/certificate/view/:id', (req, res) => {
    const rawId = req.params.id.replace(/\.png$/i, '');
    const cert = certificateStore.get(rawId);

    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString();
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const computedUrl = `${proto}://${host}`.replace(/^http:/, 'https:');
    const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : computedUrl;

    if (!cert) {
      // Graceful temple-styled fallback page
      const notFoundHtml = `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 సంకల్ప పత్రం • Samatulyam Ganesha</title>
  <style>
    body {
      margin: 0;
      padding: 24px 16px;
      min-height: 100vh;
      background: radial-gradient(circle at center, #2b0813 0%, #120206 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fbe2b5;
      text-align: center;
      box-sizing: border-box;
    }
    .card {
      max-width: 540px;
      width: 100%;
      background: rgba(36, 9, 17, 0.95);
      border: 2px solid #ffd700;
      border-radius: 20px;
      padding: 32px 24px;
      box-shadow: 0 16px 50px rgba(0,0,0,0.85), 0 0 30px rgba(255,215,0,0.2);
    }
    h1 { color: #ffd700; font-size: 24px; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #f5e6d3; margin: 0 0 18px 0; }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.4);
      color: #ffd700;
      font-size: 12px;
      margin-bottom: 20px;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #ffd700, #f59e0b);
      color: #1a040a;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: bold;
      text-decoration: none;
      font-size: 15px;
      transition: transform 0.2s ease;
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.35);
    }
    .btn:hover { transform: scale(1.03); }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 12px;">🌸 🏛️ 🌸</div>
    <h1>॥ శ్రీ గణేశాయ నమః ॥</h1>
    <span class="badge">Certificate ID: ${rawId}</span>
    <p>
      ఈ సర్టిఫికేట్ లింక్ సర్వర్ పునఃప్రారంభం కావడం వల్ల తాత్కాలికంగా అందుబాటులో లేదు.<br>
      దయచేసి ప్రధాన దేవాలయ యాప్‌లోకి వెళ్లి <strong>"సంకల్ప పత్రం (Sankalpam Certificate)"</strong> నందు మీ సర్టిఫికేట్‌ను చూడవచ్చు లేదా పునఃడౌన్‌లోడ్ చేసుకోవచ్చు.
    </p>
    <a href="/?page=certificate" class="btn">
      🏛️ దేవాలయ యాప్‌ను తెరవండి (Open App)
    </a>
  </div>
</body>
</html>`;
      return res.status(200).send(notFoundHtml);
    }

    const imageUrl = `${baseUrl}/api/certificate/image/${rawId}.png`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 సంకల్ప దీక్షా సిద్ధి పత్రం — ${cert.recipientName}</title>
  
  <!-- WhatsApp & Social Media Rich Preview Cards -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="🌸 సంకల్ప దీక్షా సిద్ధి పత్రం: ${cert.recipientName}" />
  <meta property="og:description" content="శ్రీ గణేశుని దివ్య ఆశీస్సులతో సంకల్ప దీక్షా సిద్ధి • ${cert.achievementTitle} • Certificate #${cert.certificateId}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="850" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🌸 సంకల్ప దీక్షా సిద్ధి పత్రం — ${cert.recipientName}" />
  <meta name="twitter:description" content="శ్రీ గణేశుని దివ్య ఆశీస్సులతో డిజిటల్ స్క్రీన్ నియంత్రణ సంకల్పం" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <style>
    body {
      margin: 0;
      padding: 16px;
      min-height: 100vh;
      background: radial-gradient(circle at center, #2b0813 0%, #120206 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fbe2b5;
      box-sizing: border-box;
    }
    .container {
      max-width: 960px;
      width: 100%;
      text-align: center;
    }
    .header {
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0 0 6px 0;
      color: #ffd700;
      font-size: 22px;
      letter-spacing: 1px;
    }
    .header p {
      margin: 0;
      color: #e8cba4;
      font-size: 13px;
      opacity: 0.85;
    }
    .cert-frame {
      box-shadow: 0 12px 48px rgba(0,0,0,0.85), 0 0 40px rgba(255,215,0,0.25);
      border-radius: 12px;
      overflow: hidden;
      border: 3px solid #ffd700;
      background: #fffcf5;
    }
    .cert-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .actions {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: bold;
      text-decoration: none;
      font-size: 14px;
      transition: transform 0.15s ease;
    }
    .btn:hover {
      transform: scale(1.04);
    }
    .btn-gold {
      background: linear-gradient(135deg, #ffd700, #f59e0b);
      color: #1a040a;
    }
    .btn-dark {
      background: #360b17;
      color: #ffd700;
      border: 1px solid rgba(255,215,0,0.4);
    }
    .btn-green {
      background: linear-gradient(135deg, #25d366, #128c7e);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(37,211,102,0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌸 ॥ శ్రీ గణేశాయ నమః ॥ 🌸</h1>
      <p>Samatulyam Digital Wellbeing Sanctum • సంకల్ప దీక్షా సిద్ధి పత్రం</p>
    </div>
    <div class="cert-frame">
      <img src="${imageUrl}" alt="Sankalpam Certificate for ${cert.recipientName}" class="cert-img" id="cert-img-element" />
    </div>
    <div class="actions">
      <button onclick="shareDirectOnWhatsApp()" class="btn btn-green" id="wa-share-btn">
        💬 వాట్సాప్‌లో పంపండి (Share on WhatsApp)
      </button>
      <a href="${imageUrl}" download="Sankalpam-Certificate-${cert.recipientName.replace(/\s+/g, '_')}.png" class="btn btn-gold">
        ⬇️ సర్టిఫికేట్ డౌన్‌లోడ్ (PNG)
      </a>
      <a href="/?page=certificate" class="btn btn-dark">
        🪔 మందిర దర్శనం (Altar)
      </a>
    </div>
  </div>

  <script>
    async function shareDirectOnWhatsApp() {
      try {
        const response = await fetch('${imageUrl}');
        const blob = await response.blob();
        const file = new File([blob], 'Sankalpam-Certificate-${cert.recipientName.replace(/\s+/g, '_')}.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '🌸 సంకల్ప దీక్షా సిద్ధి పత్రం — ${cert.recipientName}',
            text: '🌸 శ్రీ గణేశుని దివ్య ఆశీస్సులతో సంకల్ప దీక్షా సిద్ధి పత్రం\\n👉 ${baseUrl}/api/certificate/view/${rawId}',
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.warn('Native share failed or cancelled:', err);
      }
      
      // Fallback
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('🌸 ॥ శ్రీ గణేశాయ నమః ॥ 🌸\\n📜 సంకల్ప దీక్షా సిద్ధి పత్రం: ${cert.recipientName}\\n👉 ${baseUrl}/api/certificate/view/${rawId}'));
    }
  </script>
</body>
</html>`;
    return res.send(html);
  });

  // Direct Server-to-WhatsApp Gateway Delivery API
  // Supports automated background delivery via Twilio, Meta WhatsApp Cloud API, UltraMsg, GreenAPI, CallMeBot, or Custom Webhook
  app.post('/api/certificate/send-direct-whatsapp', async (req, res) => {
    try {
      const {
        phone,
        certificateId,
        recipientName = 'Devotee',
        achievementTitle = 'Sacred Screen Time Balance',
        provider = 'auto',
        apiKey,
        accountSid,
        authToken,
        fromNumber,
        webhookUrl,
      } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Recipient phone number is required' });
      }

      const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString();
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const computedUrl = `${proto}://${host}`.replace(/^http:/, 'https:');
      const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : computedUrl;

      const viewUrl = `${baseUrl}/api/certificate/view/${certificateId || 'latest'}`;
      const imageUrl = `${baseUrl}/api/certificate/image/${certificateId || 'latest'}.png`;

      // Clean phone number (format e.g. +919876543210)
      let cleanPhone = phone.toString().replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

      const textMessage = `🌸 *॥ శ్రీ గణేశాయ నమః ॥* 🌸\n` +
        `*SAMATULYAM DIGITAL WELLBEING SANCTUM*\n` +
        `📜 *సంకల్ప దీక్షా సిద్ధి పత్రం (Sankalpam Certificate)*\n\n` +
        `🎉 Hearty Congratulations to *${recipientName}*!\n` +
        `⭐ *Achievement*: ${achievementTitle}\n` +
        `📜 *Certificate ID*: ${certificateId}\n\n` +
        `🖼️ *VIEW & DOWNLOAD CONSECRATED CERTIFICATE:* \n` +
        `👉 ${viewUrl}\n\n` +
        `🕉️ _॥ వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥_`;

      // 1. Check Twilio (via env or request payload)
      const twilioSid = accountSid || process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = authToken || process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = fromNumber || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

      if (twilioSid && twilioToken) {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
        params.append('To', `whatsapp:${formattedPhone}`);
        params.append('Body', textMessage);
        params.append('MediaUrl', imageUrl);

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const twilioData = await twilioRes.json();
        if (twilioRes.ok) {
          return res.json({
            success: true,
            provider: 'Twilio WhatsApp API',
            messageSid: twilioData.sid,
            status: 'Delivered directly to WhatsApp with certificate image attachment!',
          });
        } else {
          console.warn('Twilio WhatsApp error:', twilioData);
        }
      }

      // 2. Check Meta WhatsApp Cloud API
      const metaToken = apiKey || process.env.META_WHATSAPP_TOKEN;
      const metaPhoneId = fromNumber || process.env.META_PHONE_NUMBER_ID;
      if (metaToken && metaPhoneId) {
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'image',
            image: {
              link: imageUrl,
              caption: textMessage,
            },
          }),
        });
        const metaData = await metaRes.json();
        if (metaRes.ok) {
          return res.json({
            success: true,
            provider: 'Meta WhatsApp Cloud API',
            messageId: metaData?.messages?.[0]?.id,
            status: 'Delivered directly via Meta WhatsApp Cloud API!',
          });
        }
      }

      // 3. Check Custom Webhook
      const targetWebhook = webhookUrl || process.env.WHATSAPP_WEBHOOK_URL;
      if (targetWebhook) {
        const hookRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            recipientName,
            certificateId,
            imageUrl,
            viewUrl,
            message: textMessage,
          }),
        });
        if (hookRes.ok) {
          return res.json({
            success: true,
            provider: 'Custom WhatsApp Webhook',
            status: 'Dispatched directly to WhatsApp webhook gateway!',
          });
        }
      }

      // If no gateway is configured on server
      return res.json({
        success: false,
        gatewayConfigured: false,
        viewUrl,
        imageUrl,
        phone: formattedPhone,
        message: 'No direct WhatsApp gateway API is configured on the server. Use direct file share or WhatsApp Web.',
      });
    } catch (err: any) {
      console.error('Direct WhatsApp send error:', err);
      return res.status(500).json({ error: err.message || 'Failed to dispatch WhatsApp message' });
    }
  });

  // Helper for executing Gemini requests with automatic retry on transient 503/429 errors
  async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 150): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      if (retries > 0 && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return callWithRetry(fn, retries - 1, delayMs * 1.2);
      }
      throw err;
    }
  }

  // Permanent Server-side In-Memory Audio Cache for Divine Voice
  const divineVoiceCache = new Map<string, { audioBase64: string; mimeType: string; sampleRate: number }>();

  // Convert raw screen time strings (e.g. "2h 15m", "3 hrs 45 mins", "45 mins") into pure Telugu words for flawless pronunciation
  function formatTimeToTeluguWords(timeStr?: string): string {
    if (!timeStr) return 'సమతుల్య సమయం';

    const hourMatch = timeStr.match(/(\d+)\s*(?:h|hr|hrs|hours|గంటలు|గంట)/i);
    const minMatch = timeStr.match(/(\d+)\s*(?:m|min|mins|minutes|నిమిషాలు|నిమిషం)/i);
    const colonMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);

    let hours = 0;
    let minutes = 0;

    if (colonMatch) {
      hours = parseInt(colonMatch[1], 10);
      minutes = parseInt(colonMatch[2], 10);
    } else {
      if (hourMatch) hours = parseInt(hourMatch[1], 10);
      if (minMatch) minutes = parseInt(minMatch[1], 10);
    }

    if (!hourMatch && !minMatch && !colonMatch) {
      const rawNum = parseInt(timeStr.replace(/\D/g, ''), 10);
      if (!isNaN(rawNum) && rawNum > 0) {
        if (rawNum > 12) {
          hours = Math.floor(rawNum / 60);
          minutes = rawNum % 60;
        } else {
          hours = rawNum;
        }
      }
    }

    const teluguNumWords: Record<number, string> = {
      0: '',
      1: 'ఒక',
      2: 'రెండు',
      3: 'మూడు',
      4: 'నాలుగు',
      5: 'ఐదు',
      6: 'ఆరు',
      7: 'ఏడు',
      8: 'ఎనిమిది',
      9: 'తొమ్మిది',
      10: 'పది',
      11: 'పదకొండు',
      12: 'పన్నెండు',
      15: 'పదిహేను',
      20: 'ఇరవై',
      25: 'ఇరవై ఐదు',
      30: 'ముప్పై',
      35: 'ముప్పై ఐదు',
      40: 'నలభై',
      45: 'నలభై ఐదు',
      50: 'యాభై',
      55: 'యాభై ఐదు',
    };

    const getWord = (n: number): string => {
      if (teluguNumWords[n]) return teluguNumWords[n];
      if (n < 10) return teluguNumWords[n] || `${n}`;
      const tens = Math.floor(n / 10) * 10;
      const units = n % 10;
      const tensWord = teluguNumWords[tens] || `${tens}`;
      const unitWord = teluguNumWords[units] || `${units}`;
      return units === 0 ? tensWord : `${tensWord} ${unitWord}`;
    };

    const parts: string[] = [];
    if (hours > 0) {
      const hWord = hours === 1 ? 'ఒక గంట' : `${getWord(hours)} గంటల`;
      parts.push(hWord);
    }
    if (minutes > 0) {
      const mWord = `${getWord(minutes)} నిమిషాలు`;
      parts.push(mWord);
    }

    return parts.length > 0 ? parts.join(' ') : 'నిర్ణీత సమయం';
  }

  // Canonical Sanskrit Mantram for each category with pure, flawless pronunciation
  const CANONICAL_SPEECHES: Record<string, string> = {
    HEALTHY: '॥ ॐ गं गणपतये नमः ॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    '1_TO_3_DAYS': '॥ ॐ गं गणपतये नमः ॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    '3_TO_5_DAYS': '॥ ॐ श्री गणेशाय नमः ॥ एकदन्तं महाकायं तप्तकाञ्चनसन्निभम् । लम्बोदरं विशालाक्षं वन्देऽहं गणनायकम् ॥',
    WARNING: '॥ ॐ गजाननाय नमः ॥ अगजानन पद्मार्कं गजाननं महर्निशम् । अनेकदं तं भक्तानां एकदन्तमुपास्महे ॥',
    '5_TO_7_DAYS': '॥ ॐ गजाननाय नमः ॥ अगजानन पद्मार्कं गजाननं महर्निशम् । अनेकदं तं भक्तानां एकदन्तमुपास्महे ॥',
    HIGH_RISK: '॥ ॐ विघ्नराजाय नमः ॥ विद्यार्थी लभते विद्यां धनार्थी लभते धनम् । पुत्रार्थी लभते पुत्रान् मोक्षार्थी लभते गतिम् ॥',
    '7_PLUS_DAYS': '॥ ॐ विघ्नराजाय नमः ॥ विद्यार्थी लभते विद्यां धनार्थी लभते धनम् । पुत्रार्थी लभते पुत्रान् मोक्षार्थी लभते गतिम् ॥',
    PROMISE_REQUEST: 'ఓం శ్రీ గణేశాయ నమః. నాయనా, ఈరోజు నీ మొబైల్ స్క్రీన్ సమయం ఐదు గంటలు దాటిపోయింది. నీ ఆరోగ్యం మరియు సమతుల్యత కోసం గణపతికి ఒక పవిత్రమైన ప్రమాణం చేయి: నేను ఫోన్ తక్కువ చూస్తాను అని చెప్పు.',
    PROMISE_BLESSING: 'ధన్యుడవు నాయనా! నీ పవిత్ర ప్రమాణాన్ని గణపతి స్వీకరించారు. ఆలయ ద్వారాలు తెరుచుకుంటున్నాయి.',
  };

  /**
   * Generates authentic, loud, deep Telugu Male God voice using Microsoft Edge Neural TTS (te-IN-MohanNeural).
   * 100% Free, Unlimited, Zero API Key needed, Zero usage limits.
   */
  async function generateEdgeTeluguSpeechAudio(text: string): Promise<{ audioBase64: string; mimeType: string; sampleRate: number } | null> {
    try {
      const { MsEdgeTTS, OUTPUT_FORMAT, PITCH, RATE, VOLUME } = await import('msedge-tts');
      const tts = new MsEdgeTTS();
      await tts.setMetadata('te-IN-MohanNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      
      // Warm, affectionate, sweet male deity modulation with a touch of gentle bass
      const { audioStream } = tts.toStream(text, {
        pitch: '-2Hz',   // Natural, sweet male voice with pleasant warmth (not artificially dropped/wild)
        rate: '+0%',     // Natural, loving conversational flow
        volume: '+10%',  // Comfortable, clear and sweet volume
      });

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        audioStream.on('end', () => resolve());
        audioStream.on('error', reject);
      });

      try {
        tts.close();
      } catch {
        // Ignore
      }

      if (chunks.length === 0) return null;
      const fullBuffer = Buffer.concat(chunks);
      return {
        audioBase64: fullBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        sampleRate: 24000,
      };
    } catch (err) {
      console.warn('Edge Neural TTS error:', err);
      return null;
    }
  }

  /**
   * Fallback native Telugu speech generator
   */
  async function generateNativeTeluguSpeechAudio(text: string): Promise<{ audioBase64: string; mimeType: string; sampleRate: number } | null> {
    try {
      const sentences = text.split(/([!?.।\n]+)/).filter((s) => s.trim().length > 0);
      const phrases: string[] = [];
      let current = '';
      for (const s of sentences) {
        if ((current + s).length < 130) {
          current += s;
        } else {
          if (current.trim()) phrases.push(current.trim());
          current = s;
        }
      }
      if (current.trim()) phrases.push(current.trim());

      const https = await import('https');
      const buffers: Buffer[] = [];
      for (const p of phrases) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(p)}&tl=te&client=tw-ob`;
        const chunkBuf = await new Promise<Buffer>((resolve, reject) => {
          const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode !== 200) {
              return reject(new Error(`TTS chunk status ${res.statusCode}`));
            }
            const c: Buffer[] = [];
            res.on('data', (chunk) => c.push(chunk));
            res.on('end', () => resolve(Buffer.concat(c)));
          });
          req.on('error', reject);
        });
        buffers.push(chunkBuf);
      }

      const combined = Buffer.concat(buffers);
      return {
        audioBase64: combined.toString('base64'),
        mimeType: 'audio/mpeg',
        sampleRate: 24000,
      };
    } catch (err) {
      console.warn('Native Telugu TTS fallback error:', err);
      return null;
    }
  }

  async function generateDivineSpeechAudio(text: string): Promise<{ audioBase64: string; mimeType: string; sampleRate: number } | null> {
    // 1. PRIMARY: Edge Neural Telugu Male Voice (te-IN-MohanNeural) - Free, Unlimited, Deep God Tone
    const edgeAudio = await generateEdgeTeluguSpeechAudio(text);
    if (edgeAudio) {
      return edgeAudio;
    }

    // 2. SECONDARY: Gemini Neural Voice
    const ai = getGeminiClient();
    if (ai) {
      const speechPrompt = `You are Lord Ganesha (శ్రీ వినాయక స్వామి). Speak in a commanding, loud, deeply resonant Indian male voice with rich chest bass and divine affection, like God speaking directly to a devotee with clear Telugu diction. Speak ONLY the following Telugu words with sacred dignity: ${text}`;

      const voices = ['Orus', 'Charon', 'Fenrir'];
      const models = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'];

      for (const model of models) {
        for (const voiceName of voices) {
          try {
            const response = await callWithRetry(
              () =>
                ai.models.generateContent({
                  model,
                  contents: [{ parts: [{ text: speechPrompt }] }],
                  config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                      },
                    },
                  },
                }),
              1,
              250
            );

            const audioPart = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            const base64Audio = audioPart?.data;
            const mimeType = audioPart?.mimeType || 'audio/pcm;rate=24000';

            if (base64Audio) {
              return {
                audioBase64: base64Audio,
                mimeType,
                sampleRate: 24000,
              };
            }
          } catch {
            // Try next
          }
        }
      }
    }

    // 3. Fallback
    return generateNativeTeluguSpeechAudio(text);
  }

  // Pre-warm canonical category voices in background
  async function prewarmDivineVoices() {
    for (const [cat, speech] of Object.entries(CANONICAL_SPEECHES)) {
      if (!divineVoiceCache.has(`CAT_${cat}`)) {
        try {
          const audio = await generateDivineSpeechAudio(speech);
          if (audio) {
            divineVoiceCache.set(`CAT_${cat}`, audio);
            divineVoiceCache.set(speech, audio);
          }
        } catch {
          // Ignore
        }
      }
    }
  }

  // Trigger non-blocking pre-warm on start immediately
  setTimeout(() => {
    prewarmDivineVoices().catch(() => {});
  }, 20);

  // AI High-Fidelity Male God Voice (TTS) Endpoint
  app.post('/api/voice/ganesha-speak', async (req, res) => {
    try {
      const { text, category = 'HEALTHY' } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text prompt is required for speech' });
      }

      // Check text cache first
      if (divineVoiceCache.has(text)) {
        const cached = divineVoiceCache.get(text)!;
        return res.json({
          success: true,
          ...cached,
          cached: true,
        });
      }

      // Check category canonical cache
      const canonicalKey = `CAT_${category}`;

      try {
        const audio = await generateDivineSpeechAudio(text);
        if (audio) {
          divineVoiceCache.set(text, audio);
          if (!divineVoiceCache.has(canonicalKey)) {
            divineVoiceCache.set(canonicalKey, audio);
          }
          return res.json({
            success: true,
            ...audio,
          });
        }
      } catch (ttsErr: any) {
        console.warn('Gemini TTS direct call unavailable, checking category voice cache...');
      }

      // If specific dynamic text failed, use canonical cached category audio so the voice NEVER changes!
      if (divineVoiceCache.has(canonicalKey)) {
        const cachedCat = divineVoiceCache.get(canonicalKey)!;
        return res.json({
          success: true,
          ...cachedCat,
          fallbackCategory: true,
        });
      }

      // If canonical not yet cached, try generating canonical text
      const canonicalSpeech = CANONICAL_SPEECHES[category] || CANONICAL_SPEECHES.HEALTHY;
      try {
        const catAudio = await generateDivineSpeechAudio(canonicalSpeech);
        if (catAudio) {
          divineVoiceCache.set(canonicalKey, catAudio);
          divineVoiceCache.set(canonicalSpeech, catAudio);
          return res.json({
            success: true,
            ...catAudio,
          });
        }
      } catch (err) {
        console.warn('Canonical generation also temporarily unavailable');
      }

      return res.json({
        success: false,
        fallbackNeeded: true,
        error: 'TTS model currently busy',
      });
    } catch (err: any) {
      console.warn('Voice API handler handled error gracefully:', err?.message || err);
      return res.json({
        success: false,
        fallbackNeeded: true,
        error: err?.message || 'Error generating divine god voice',
      });
    }
  });

  // AI Multimodal Vision Screen-Time OCR Endpoint
  app.post('/api/ocr/analyze-screen', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          error: 'Image data is required',
          detected: false,
        });
      }

      // Strip data URL header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API is not configured. Falling back to local OCR.',
          detected: false,
          fallbackNeeded: true,
        });
      }

      const promptText = `Fast Screen Time Vision OCR:
Analyze this mobile screen, monitor, or screenshot image (Android Digital Wellbeing, iOS Screen Time, or timer display).
Identify screen time hours and minutes. Compute totalMinutes = hours * 60 + minutes, and formatted string (e.g. "3h 45m" or "45m").
If screen time numbers are detected, return detected=true, otherwise detected=false.`;

      // gemini-2.5-flash and gemini-2.5-flash-lite with zero thinking budget deliver sub-second (<400ms) latency
      const visionModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
      let lastError: any = null;
      let parsedData: any = null;

      for (const visionModel of visionModels) {
        try {
          const response = await ai.models.generateContent({
            model: visionModel,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
            config: {
              responseMimeType: 'application/json',
              thinkingConfig: {
                thinkingBudget: 0,
              },
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detected: {
                    type: Type.BOOLEAN,
                    description: 'True if screen time numbers were identified on any screen or device',
                  },
                  hours: {
                    type: Type.INTEGER,
                    description: 'Detected hours (0 to 24)',
                  },
                  minutes: {
                    type: Type.INTEGER,
                    description: 'Detected minutes (0 to 59)',
                  },
                  totalMinutes: {
                    type: Type.INTEGER,
                    description: 'Total calculated minutes (hours * 60 + minutes)',
                  },
                  formatted: {
                    type: Type.STRING,
                    description: 'Human readable format e.g. "3h 45m" or "3 hrs, 45 mins"',
                  },
                  rawSnippet: {
                    type: Type.STRING,
                    description: 'Exact text visible on screen around the time numbers',
                  },
                  deviceOrAppType: {
                    type: Type.STRING,
                    description: 'e.g. "Android Digital Wellbeing", "iOS Screen Time", "Phone Screen", "Desktop"',
                  },
                  confidence: {
                    type: Type.INTEGER,
                    description: 'Confidence score percentage from 0 to 100',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Brief notes on what was visible',
                  },
                },
                required: ['detected', 'hours', 'minutes', 'totalMinutes', 'formatted'],
              },
            },
          });

          const responseText = response.text || '{}';
          parsedData = JSON.parse(responseText);
          break;
        } catch (mErr) {
          lastError = mErr;
        }
      }

      if (!parsedData) {
        throw lastError || new Error('All vision models failed to process the image');
      }

      return res.json({
        success: true,
        ...parsedData,
      });
    } catch (err: any) {
      console.error('Gemini Vision OCR Error:', err);
      return res.status(500).json({
        error: err.message || 'Error analyzing screen image with Vision AI',
        detected: false,
        fallbackNeeded: true,
      });
    }
  });

  // Serve public directory for static video and media assets with byte range support
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Setup Vite middleware in Dev or Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, check if static files are in process.cwd()/dist or __dirname
    const cwdDist = path.join(process.cwd(), 'dist');
    const localDist = typeof __dirname !== 'undefined' ? __dirname : cwdDist;
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html'))
      ? cwdDist
      : localDist;

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`సమతుల్యం Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
