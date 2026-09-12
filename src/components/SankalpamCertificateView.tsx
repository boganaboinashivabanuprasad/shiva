import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import {
  Printer,
  Sparkles,
  Download,
  ArrowLeft,
  CheckCircle2,
  Award,
  ShieldCheck,
  Calendar,
  User,
  HeartHandshake,
  Edit3,
  X,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  QrCode,
  Clock,
  FileCheck,
  RefreshCw,
  History,
  Layers,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { DashboardSettings, UserAgeGroup, AppPage, ScanRecord } from '../types';
import { ASSETS } from '../assets';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { WebsiteLogo } from './WebsiteLogo';

function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.476-.15-.677.15-.2.301-.777.98-.952 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.175-.3-.019-.462.132-.612.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.63-.928-2.235-.245-.589-.494-.509-.677-.518-.175-.009-.376-.009-.577-.009s-.527.075-.802.376c-.276.301-1.053 1.028-1.053 2.508s1.078 2.909 1.229 3.109c.15.2 2.122 3.241 5.141 4.545.718.31 1.279.495 1.716.634.721.229 1.377.197 1.896.12.578-.086 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.2-.577-.35zM12.04 2C6.5 2 2.015 6.485 2.015 12.025c0 1.965.57 3.88 1.65 5.515L2 22l4.635-1.615A9.98 9.98 0 0 0 12.04 22c5.54 0 10.025-4.485 10.025-10.025C22.065 6.485 17.58 2 12.04 2zm0 18.25c-1.715 0-3.375-.52-4.78-1.5l-.345-.24-2.825.98.995-2.755-.265-.37A8.226 8.226 0 0 1 3.79 12.025C3.79 7.47 7.485 3.775 12.04 3.775c4.555 0 8.25 3.695 8.25 8.25s-3.695 8.25-8.25 8.25z" />
    </svg>
  );
}

interface SankalpamCertificateViewProps {
  settings: DashboardSettings;
  onNavigate: (page: AppPage) => void;
  defaultRecipientName?: string;
  defaultAgeGroup?: UserAgeGroup;
}

export function SankalpamCertificateView({
  settings,
  onNavigate,
  defaultRecipientName = 'Chi. Arjun Kumar',
  defaultAgeGroup = '0-12',
}: SankalpamCertificateViewProps) {
  // Load scan history to pull the latest user data
  const [historyRecords, setHistoryRecords] = useState<ScanRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [showSessionPicker, setShowSessionPicker] = useState<boolean>(false);

  // Recipient info
  const [recipientName, setRecipientName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samatulyam_devotee_name');
      if (saved && saved.trim()) return saved.trim();
    }
    return defaultRecipientName;
  });

  const [ageGroup, setAgeGroup] = useState<UserAgeGroup>(defaultAgeGroup);
  const [achievementTitle, setAchievementTitle] = useState<string>(
    'ఉత్తమ స్క్రీన్ నియంత్రణ & నేత్ర సంరక్షణ (< 3 గంటలు)'
  );
  const [mentorName, setMentorName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samatulyam_mentor_name');
      if (saved && saved.trim()) return saved.trim();
    }
    return 'తల్లిదండ్రులు / గురువు గారి సాక్షి (Parent / Guardian)';
  });

  // Telugu month names for authentic Telugu date representation
  const teluguMonths = [
    'జనవరి',
    'ఫిబ్రవరి',
    'మార్చి',
    'ఏప్రిల్',
    'మే',
    'జూన్',
    'జూలై',
    'ఆగస్టు',
    'సెప్టెంబర్',
    'అక్టోబర్',
    'నవంబర్',
    'డిసెంబర్',
  ];

  const formatTeluguDate = (d: Date) => {
    const day = d.getDate();
    const month = teluguMonths[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const [issueDate, setIssueDate] = useState<string>(() => formatTeluguDate(new Date()));

  const [customNote, setCustomNote] = useState<string>(
    'స్మార్ట్‌ఫోన్ మరియు డిజిటల్ స్క్రీన్ వాడకాన్ని నియంత్రించి, శ్రీ విఘ్నేశ్వరుని ఎదుట చేసిన పవిత్ర సంకల్ప ప్రతిజ్ఞను నిలబెట్టుకుంటూ, కంటిచూపును మరియు సమయాన్ని కాపాడుకున్నందుకు గాను ఈ సిద్ధి పత్రం సమర్పించడమైనది.'
  );

  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);

  // Stable Unique Certificate Verification ID
  const [certificateId, setCertificateId] = useState<string>(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `SANKALPAM-${new Date().getFullYear()}-${rand}`;
  });

  // Load history records from Storage on mount
  useEffect(() => {
    const records = storageService.getHistory();
    setHistoryRecords(records);
    if (records.length > 0) {
      setSelectedRecordId(records[0].id);
    }
  }, []);

  // Compute selected record or fallback to latest
  const activeRecord = useMemo<ScanRecord | null>(() => {
    if (historyRecords.length === 0) return null;
    const found = historyRecords.find((r) => r.id === selectedRecordId);
    return found || historyRecords[0];
  }, [historyRecords, selectedRecordId]);

  // Synchronize certificate fields when an active record is selected/updated
  useEffect(() => {
    if (!activeRecord) return;

    // Date from the user's actual scan in Telugu format
    const scanDate = new Date(activeRecord.timestamp);
    setIssueDate(formatTeluguDate(scanDate));

    // Age group if present on record
    if (activeRecord.ageGroup) {
      setAgeGroup(activeRecord.ageGroup);
    }

    // Dynamic achievement tailored to user's actual screen time category in pure Telugu
    if (activeRecord.category === 'HEALTHY' || activeRecord.screenTimeMinutes <= 180) {
      setAchievementTitle('ఉత్తమ స్క్రీన్ నియంత్రణ & నేత్ర సంరక్షణ (< 3 గంటలు)');
      setCustomNote(
        `రోజూవారీ డిజిటల్ స్క్రీన్ సమయాన్ని కేవలం ${activeRecord.screenTimeString} పరిమితిలో ఉంచి, శ్రీ విఘ్నేశ్వరుని ఎదుట చేసిన పవిత్ర సంకల్పాన్ని నిలబెట్టుకుంటూ, కంటిచూపును మరియు సమయాన్ని కాపాడుకున్నందుకు గాను ఈ సిద్ధి పత్రం సమర్పించడమైనది.`
      );
    } else if (activeRecord.category === 'WARNING' || activeRecord.screenTimeMinutes <= 300) {
      setAchievementTitle('జాగరూకతతో కూడిన స్క్రీన్ సంయమనం (< 5 గంటలు)');
      setCustomNote(
        `డిజిటల్ పరికరాల వినియోగంపై అప్రమత్తతతో ఉంటూ (${activeRecord.screenTimeString}), అనవసరపు ఫోన్ వాడకాన్ని తగ్గించి, ఆత్మనిగ్రహాన్ని ప్రదర్శించినందుకు గాను ఈ ప్రశంసా పత్రం సమర్పించడమైనది.`
      );
    } else {
      setAchievementTitle('శ్రీ మహాగణపతి ఎదుట పవిత్ర సంకల్ప దీక్షా సిద్ధి');
      setCustomNote(
        `శ్రీ విఘ్నేశ్వరుని సన్నిధిలో పవిత్రమైన కంఠస్వర ప్రతిజ్ఞ ("నేను ఫోన్ తక్కువ చూస్తాను") చేసి, స్మార్ట్‌ఫోన్ వాడకాన్ని తగ్గించి, నేత్రారోగ్యాన్ని కాపాడుకుంటానని శపథం చేసినందుకు గాను ఈ సిద్ధి పత్రం సమర్పించడమైనది.`
      );
    }
  }, [activeRecord]);

  // Save changes to devotee & mentor names for future sessions
  const handleSaveDevoteeName = (name: string) => {
    setRecipientName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samatulyam_devotee_name', name);
    }
  };

  const handleSaveMentorName = (name: string) => {
    setMentorName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samatulyam_mentor_name', name);
    }
  };

  // WhatsApp Integration State
  const [whatsappCountryCode, setWhatsappCountryCode] = useState<string>('91');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [showWhatsappModal, setShowWhatsappModal] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [whatsappStatus, setWhatsappStatus] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [hostedViewUrl, setHostedViewUrl] = useState<string>('');
  const [hostedImageUrl, setHostedImageUrl] = useState<string>('');
  const [certificatePreviewDataUrl, setCertificatePreviewDataUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showDesktopGuidanceModal, setShowDesktopGuidanceModal] = useState<boolean>(false);

  // Generate QR Code pointing to public verification link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const certViewUrl = `${window.location.origin}/api/certificate/view/${certificateId}`;
      QRCode.toDataURL(certViewUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#350b14',
          light: '#ffffff',
        },
      })
        .then(setQrCodeDataUrl)
        .catch((e) => console.warn('QR code gen error:', e));
    }
  }, [certificateId]);

  const certificateRef = useRef<HTMLDivElement | null>(null);

  // A4 Paper Format & ISO Standard Sizing
  const [a4Orientation, setA4Orientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Generate ISO 216 A4 PDF (210mm x 297mm) directly via jsPDF
  const handleDownloadA4Pdf = async (orientationToUse: 'portrait' | 'landscape' = a4Orientation) => {
    if (!certificateRef.current) return;
    try {
      setIsGeneratingPdf(true);
      soundService.playTempleBell(1.2);
      setWhatsappStatus('⏳ ప్రామాణిక A4 PDF తయారవుతోంది (Generating ISO A4 PDF)...');

      // Render at scale 3 for crisp 300 DPI print quality
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fffdf7',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: orientationToUse,
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = orientationToUse === 'portrait' ? 210 : 297;
      const pdfHeight = orientationToUse === 'portrait' ? 297 : 210;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const cleanName = (recipientName || 'Devotee').trim().replace(/\s+/g, '_');
      const filename = `Sankalpam-Certificate-${cleanName}-A4-${orientationToUse.toUpperCase()}.pdf`;
      pdf.save(filename);
      setWhatsappStatus(`✅ ప్రామాణిక A4 PDF డౌన్‌లోడ్ అయ్యింది (${filename})!`);
    } catch (err) {
      console.error('Failed to generate A4 PDF:', err);
      setWhatsappStatus('⚠️ A4 PDF తయారుచేయడంలో సమస్య ఎదురైంది.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // High-Resolution A4 PNG (Print Ready 300 DPI)
  const handleDownloadA4Png = async () => {
    if (!certificateRef.current) return;
    try {
      setIsGeneratingImage(true);
      soundService.playTempleBell(1.1);
      setWhatsappStatus('⏳ A4 హై-రిజల్యూషన్ ముద్రణ చిత్రం తయారవుతోంది (300 DPI Print Ready)...');

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fffdf7',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const cleanName = (recipientName || 'Devotee').trim().replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.download = `Sankalpam-Certificate-${cleanName}-A4-${a4Orientation.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
      setWhatsappStatus('✅ A4 ప్రింట్ రెడీ PNG చిత్రం డౌన్‌లోడ్ అయ్యింది!');
    } catch (err) {
      console.error('Failed to generate A4 image:', err);
      setWhatsappStatus('⚠️ చిత్రం తయారుచేయడంలో లోపం.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    soundService.playTempleBell(1.2);
    window.print();
  };

  const handleCelebrate = () => {
    soundService.playTempleBell(1.3);
    setTimeout(() => soundService.playTempleBell(1.1), 350);
  };

  const ageLabels: Record<UserAgeGroup, { title: string; category: string; telugu: string }> = {
    '0-12': {
      title: 'బాల సంకల్ప దీక్ష (0 - 12 సం॥)',
      category: 'బాల సంకల్ప దీక్ష',
      telugu: 'బాల సంకల్ప దీక్ష (Children 0-12)',
    },
    '13-21': {
      title: 'యువ సంకల్ప దీక్ష (13 - 21 సం॥)',
      category: 'యువ సంకల్ప దీక్ష',
      telugu: 'యువ సంకల్ప దీక్ష (Youth 13-21)',
    },
    '21+': {
      title: 'ప్రౌఢ సంకల్ప దీక్ష (21+ సం॥)',
      category: 'ప్రౌఢ సంకల్ప దీక్ష',
      telugu: 'ప్రౌఢ సంకల్ప దీక్ష (Adults 21+)',
    },
  };

  // Convert English screen time into readable Telugu/Tenglish format
  const getScreenTimeTelugu = (timeStr: string) => {
    if (!timeStr) return '1 గం 50 ని (1h 50m)';
    // e.g. "1h 50m" -> "1 గం 50 ని (1h 50m)"
    const match = timeStr.match(/(\d+)h(?:\s*(\d+)m)?/);
    if (match) {
      const h = match[1];
      const m = match[2] || '0';
      return `${h} గం ${m} ని (${timeStr})`;
    }
    return `${timeStr}`;
  };

  const generateWhatsAppMessage = (viewUrlOverride?: string, imageUrlOverride?: string) => {
    const cleanName = recipientName.trim() || 'భక్తుడు (Devotee)';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const certViewUrl =
      viewUrlOverride || hostedViewUrl || `${baseUrl}/api/certificate/view/${certificateId}`;
    const userTime = activeRecord?.screenTimeString || '1h 50m';
    const userSessionId = activeRecord?.id || 'SAM-101';

    return (
      `🌸 *॥ శ్రీ గణేశాయ నమః ॥* 🌸\n` +
      `📜 *సంకల్ప దీక్షా సిద్ధి పత్రం (Sankalpam Certificate)*\n\n` +
      `🖼️ *దివ్య సంకల్ప పత్రం చిత్రమును ఇక్కడ చూడండి:* \n` +
      `👉 ${certViewUrl}\n\n` +
      `🎉 *${cleanName}* గారికి హృదయపూర్వక అభినందనలు!\n` +
      `శ్రీ విఘ్నేశ్వరుని సమక్షంలో చేసిన డిజిటల్ స్క్రీన్ నియంత్రణ సంకల్పం విజయవంతంగా నెరవేరినందుకు గాను ఈ పవిత్ర ప్రశంసా పత్రం ప్రదానం చేయబడినది!\n\n` +
      `⏱️ *పరిశీలించిన స్క్రీన్ సమయం*: ${userTime}\n` +
      `🆔 *దీక్షా రికార్డు ఐడీ*: #${userSessionId}\n` +
      `⭐ *సాధించిన ఘనత*: ${achievementTitle}\n` +
      `🏆 *దీక్షా విభాగం*: ${ageLabels[ageGroup].title}\n` +
      `🛡️ *పవిత్ర ప్రతిజ్ఞ*: "నేను ఫోన్ తక్కువ చూస్తాను" (ఫోన్ వాడకాన్ని తగ్గించి, కంటిచూపును కాపాడుకుంటాను)\n` +
      `📜 *సర్టిఫికేట్ ఐడీ*: ${certificateId}\n` +
      `📅 *ప్రదానం చేసిన తేదీ*: ${issueDate}\n` +
      `✍️ *మార్గదర్శి సాక్షి*: ${mentorName}\n\n` +
      `🕉️ _॥ వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥_\n` +
      `_"శ్రీ వినాయకుని దివ్య అనుగ్రహంతో డిజిటల్ అలసట తొలగి, తీక్షణమైన దృష్టి, విజ్ఞానం, ఏకాగ్రత లభించుగాక."_\n` +
      `🪔 *సమతుల్యం డిజిటల్ సంక్షేమ మందిరం (Samatulyam Sanctum)*`
    );
  };

  const generateAndUploadCertificateImage = async (): Promise<{
    dataUrl: string;
    blob: Blob | null;
    viewUrl: string;
    imageUrl: string;
  } | null> => {
    if (!certificateRef.current) return null;
    try {
      setIsGeneratingImage(true);
      setWhatsappStatus('⏳ హై-రిజల్యూషన్ సర్టిఫికేట్ చిత్రం తయారవుతోంది...');

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#fffcf5',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCertificatePreviewDataUrl(dataUrl);

      const baseUrl = window.location.origin;
      let finalViewUrl = `${baseUrl}/api/certificate/view/${certificateId}`;
      let finalImageUrl = `${baseUrl}/api/certificate/image/${certificateId}.png`;

      // Upload to server so it has a permanent hosted URL with Open Graph tags for WhatsApp
      try {
        const base64Content = dataUrl.replace(/^data:image\/png;base64,/, '');
        const uploadRes = await fetch('/api/certificate/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: certificateId,
            imageBase64: base64Content,
            recipientName: recipientName.trim() || 'Devotee',
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.viewUrl) {
            finalViewUrl = uploadData.viewUrl.startsWith('http')
              ? uploadData.viewUrl
              : `${baseUrl}${uploadData.viewUrl}`;
            setHostedViewUrl(finalViewUrl);
          }
          if (uploadData.imageUrl) {
            finalImageUrl = uploadData.imageUrl.startsWith('http')
              ? uploadData.imageUrl
              : `${baseUrl}${uploadData.imageUrl}`;
            setHostedImageUrl(finalImageUrl);
          }
        }
      } catch (uploadErr) {
        console.warn('Certificate upload warning:', uploadErr);
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      return { dataUrl, blob, viewUrl: finalViewUrl, imageUrl: finalImageUrl };
    } catch (err) {
      console.error('Error rendering certificate canvas:', err);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSendToWhatsApp = async () => {
    const cleanNum = whatsappNumber.replace(/\D/g, '');
    if (!cleanNum) {
      setWhatsappStatus('⚠️ దయచేసి సరైన వాట్సాప్ మొబైల్ నంబర్‌ను నమోదు చేయండి.');
      return;
    }

    let finalNumber = cleanNum;
    if (cleanNum.length === 10) {
      finalNumber = `${whatsappCountryCode}${cleanNum}`;
    } else if (cleanNum.startsWith('0') && cleanNum.length === 11) {
      finalNumber = `${whatsappCountryCode}${cleanNum.slice(1)}`;
    }

    soundService.playTempleBell(1.2);
    setWhatsappStatus('⏳ సర్టిఫికేట్ చిత్రాన్ని వాట్సాప్‌కు సిద్ధం చేస్తున్నాము...');

    const result = await generateAndUploadCertificateImage();

    // 1. If device supports native file share, ATTACH THE ACTUAL CERTIFICATE IMAGE DIRECTLY!
    if (result?.blob && typeof navigator !== 'undefined' && (navigator as any).share && (navigator as any).canShare) {
      try {
        const file = new File(
          [result.blob],
          `Sankalpam-Certificate-${(recipientName || 'Devotee').replace(/\s+/g, '_')}.png`,
          { type: 'image/png' }
        );

        if ((navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({
            title: `🌸 సంకల్ప పత్రం — ${recipientName || 'Devotee'}`,
            text: generateWhatsAppMessage(result.viewUrl, result.imageUrl),
            files: [file],
          });
          setWhatsappStatus('✅ సర్టిఫికేట్ చిత్రం వాట్సాప్‌కు పంపబడింది!');
          return;
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') return;
        console.warn('Direct file share fallback to Web URL:', shareErr);
      }
    }

    // 2. Auto download image file so it is directly on user's device ready to send
    if (result?.dataUrl) {
      const link = document.createElement('a');
      link.download = `Sankalpam-Certificate-${(recipientName || 'Devotee').replace(/\s+/g, '_')}.png`;
      link.href = result.dataUrl;
      link.click();
    }

    // 3. Open WhatsApp Web / App with clean top certificate link
    const message = generateWhatsAppMessage(result?.viewUrl, result?.imageUrl);
    const encoded = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${finalNumber}&text=${encoded}`;

    window.open(waUrl, '_blank');

    // 4. Show desktop paste & attach guidance overlay
    setShowDesktopGuidanceModal(true);
    setWhatsappStatus(
      '✅ వాట్సాప్ తెరవబడింది! సర్టిఫికేట్ చిత్రం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది. వాట్సాప్ మెసేజ్ బాక్స్‌లో Ctrl+V (Paste) నొక్కండి!'
    );
  };

  const handleCopyImageToClipboard = async () => {
    if (!certificateRef.current) return;
    try {
      soundService.playTempleBell(1.1);
      setWhatsappStatus('⏳ సర్టిఫికేట్ చిత్రాన్ని క్లిప్‌బోర్డ్‌కు కాపీ చేస్తున్నాము...');
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#fffcf5',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImage(true);
          setWhatsappStatus(
            '✅ సర్టిఫికేట్ చిత్రం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది! వాట్సాప్‌లో Ctrl+V నొక్కి పంపవచ్చు.'
          );
          setTimeout(() => setCopiedImage(false), 3000);
        } else {
          setWhatsappStatus(
            '⚠️ ఈ బ్రౌజర్‌లో డైరెక్ట్ ఇమేజ్ కాపీ పనిచేయదు. క్రింద ఉన్న "చిత్రం డౌన్‌లోడ్" బటన్ ఉపయోగించండి.'
          );
        }
      }, 'image/png');
    } catch (err) {
      setWhatsappStatus('⚠️ ఇమేజ్ కాపీ చేయలేకపోయాము.');
    }
  };

  const handleCopyMessage = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleDownloadPng = async () => {
    if (!certificateRef.current) return;
    try {
      soundService.playTempleBell(1.1);
      const result = await generateAndUploadCertificateImage();
      if (result?.dataUrl) {
        const link = document.createElement('a');
        link.download = `Sankalpam-Certificate-${(recipientName || 'Devotee').replace(/\s+/g, '_')}.png`;
        link.href = result.dataUrl;
        link.click();
        setWhatsappStatus(
          '✅ సర్టిఫికేట్ PNG చిత్రం డౌన్‌లోడ్ అయ్యింది! వాట్సాప్‌లో 📎 పిన్ ద్వారా సులభంగా పంపవచ్చు.'
        );
      }
    } catch (err) {
      console.error('Failed to generate certificate image:', err);
      setWhatsappStatus('⚠️ సర్టిఫికేట్ చిత్రం తయారుకాలేదు.');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#140306] text-[#f5f2ed] flex flex-col items-center justify-start py-4 sm:py-6 px-3 sm:px-6 selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="w-full max-w-5xl mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 rounded-xl border border-[#ffd700]/50 bg-[#2b0c16] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#ffd700] hover:bg-[#3d1220] transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>మందిరానికి తిరిగి వెళ్లు (Altar)</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Send to WhatsApp Button */}
          <button
            onClick={() => {
              setShowWhatsappModal(true);
              setShowCustomizer(false);
            }}
            id="send-whatsapp-top-btn"
            className="flex items-center space-x-1.5 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-black text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(37,211,102,0.4)]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>వాట్సాప్‌కు పంపు (WhatsApp)</span>
          </button>

          {/* Download A4 PDF Document */}
          <button
            onClick={() => handleDownloadA4Pdf(a4Orientation)}
            disabled={isGeneratingPdf}
            id="download-a4-pdf-top-btn"
            className="flex items-center space-x-1.5 rounded-xl border-2 border-[#ffd700] bg-gradient-to-r from-[#ffd700] via-amber-400 to-[#f59e0b] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-black text-[#1a040b] hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,215,0,0.4)] disabled:opacity-50"
            title="ISO A4 PDF డాక్యుమెంట్‌ను డౌన్‌లోడ్ చేసుకోండి"
          >
            <FileText className="h-4 w-4 text-[#1a040b]" />
            <span className="hidden sm:inline">
              {isGeneratingPdf ? 'సిద్ధమవుతోంది...' : 'A4 PDF డౌన్‌లోడ్'}
            </span>
          </button>

          {/* Download A4 PNG Certificate Image */}
          <button
            onClick={handleDownloadA4Png}
            disabled={isGeneratingImage}
            id="download-png-top-btn"
            className="flex items-center space-x-1.5 rounded-xl border border-amber-500/60 bg-[#2b0c16] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all shadow-md disabled:opacity-50"
            title="A4 300 DPI ప్రింట్ రెడీ చిత్రాన్ని డౌన్‌లోడ్ చేసుకోండి"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isGeneratingImage ? 'సిద్ధమవుతోంది...' : 'A4 చిత్రం (PNG)'}
            </span>
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={handlePrint}
            id="print-certificate-top-btn"
            className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/60 bg-[#2b0c16] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all shadow-md"
            title="A4 పేపర్‌పై ప్రింట్ చేయండి లేదా PDF గా భద్రపరుచుకోండి"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">A4 ప్రింట్</span>
          </button>

          {/* Customize Certificate */}
          <button
            onClick={() => {
              setShowCustomizer((prev) => !prev);
              setShowWhatsappModal(false);
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/60 bg-[#220710] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-[#fbe2b5] hover:bg-[#330c1a] transition-all shadow-md"
          >
            <Edit3 className="h-4 w-4 text-[#ffd700]" />
            <span>{showCustomizer ? 'ఎడిటర్ మూసివేయి' : 'సవరించు (Customize)'}</span>
          </button>

          {/* Ring Temple Bell */}
          <button
            onClick={handleCelebrate}
            className="flex items-center space-x-1.5 rounded-xl border border-amber-500/60 bg-amber-950/70 px-3 py-2 text-xs sm:text-sm font-bold text-amber-200 hover:bg-amber-900/80 transition-all shadow-md"
            title="ఆలయ గంటలు మోగించండి"
          >
            <Sparkles className="h-4 w-4 text-[#ffd700]" />
            <span className="hidden md:inline">గంటానాదం</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          A4 PAPER FORMAT & SPECIFICATION CONTROLS BAR (ISO 216 STANDARD: 210 × 297 MM)
         ========================================================================= */}
      <div className="w-full max-w-5xl mb-4 rounded-2xl border-2 border-[#ffd700] bg-gradient-to-r from-[#290814] via-[#3a0d1d] to-[#250612] p-3 sm:p-4 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[#ffd700] via-amber-400 to-[#f59e0b] flex items-center justify-center text-[#1a040b] shadow-md shrink-0">
            <FileText className="h-6 w-6 font-bold" />
          </div>
          <div className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-telugu-noto text-xs sm:text-sm font-extrabold text-[#ffd700]">
                ప్రామాణిక A4 పరిమాణం (ISO 216 Standard A4: 210 × 297 mm)
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd700]/20 border border-[#ffd700]/60 text-[#ffd700]">
                {a4Orientation === 'portrait' ? 'A4 Portrait (210×297 mm)' : 'A4 Landscape (297×210 mm)'}
              </span>
            </div>
            <p className="text-xs text-[#e8cba4]/90 mt-0.5 font-telugu-noto">
              ఈ సంకల్ప దీక్షా సిద్ధి పత్రం అంతర్జాతీయ A4 పేపర్ కొలతలకు (210×297 mm) సరిగ్గా సరిపోయేలా అమర్చబడింది. సింగిల్ పేజీలో పూర్తి స్పష్టతతో A4 PDF మరియు ముద్రణ లభిస్తుంది.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* A4 Orientation Toggle */}
          <div className="flex items-center bg-[#150308] p-1 rounded-xl border border-[#ffd700]/40 shadow-inner">
            <button
              onClick={() => {
                setA4Orientation('portrait');
                soundService.playTempleBell(1.0);
              }}
              id="a4-orientation-portrait-btn"
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                a4Orientation === 'portrait'
                  ? 'bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-[#1a040b] shadow-md'
                  : 'text-[#e8cba4] hover:text-[#ffd700]'
              }`}
              title="A4 నిలువు పరిమాణం (210 × 297 mm)"
            >
              <span>📄 A4 నిలువు (Portrait)</span>
            </button>
            <button
              onClick={() => {
                setA4Orientation('landscape');
                soundService.playTempleBell(1.0);
              }}
              id="a4-orientation-landscape-btn"
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                a4Orientation === 'landscape'
                  ? 'bg-gradient-to-r from-[#ffd700] to-[#f59e0b] text-[#1a040b] shadow-md'
                  : 'text-[#e8cba4] hover:text-[#ffd700]'
              }`}
              title="A4 అడ్డంగా పరిమాణం (297 × 210 mm)"
            >
              <span>📜 A4 అడ్డంగా (Landscape)</span>
            </button>
          </div>

          {/* Direct Download A4 PDF Button */}
          <button
            onClick={() => handleDownloadA4Pdf(a4Orientation)}
            disabled={isGeneratingPdf}
            id="download-a4-pdf-action-btn"
            className="flex items-center space-x-1.5 rounded-xl border-2 border-[#ffd700] bg-gradient-to-r from-[#ffd700] via-amber-400 to-[#f59e0b] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-black text-[#1a040b] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.45)] disabled:opacity-50"
            title="అధికారిక ISO A4 PDF డాక్యుమెంట్‌ను డౌన్‌లోడ్ చేసుకోండి"
          >
            <FileText className="h-4 w-4 text-[#1a040b]" />
            <span>{isGeneratingPdf ? 'A4 PDF సిద్ధమవుతోంది...' : 'A4 PDF డౌన్‌లోడ్'}</span>
          </button>

          {/* Direct Print A4 */}
          <button
            onClick={handlePrint}
            id="print-a4-action-btn"
            className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/70 bg-[#2b0c16] px-3 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all shadow-md"
            title="A4 పేపర్‌పై ప్రింట్ చేయండి"
          >
            <Printer className="h-4 w-4" />
            <span>A4 ప్రింట్</span>
          </button>
        </div>
      </div>

      {/* LAST USER DATA VERIFICATION & SESSION CONNECTOR BAR (Hidden in print) */}
      <div className="w-full max-w-5xl mb-5 rounded-2xl border-2 border-[#d4af37]/70 bg-gradient-to-r from-[#20050d] via-[#2c0915] to-[#1a040b] p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-[#1a040b] shadow-md shrink-0">
            <FileCheck className="h-6 w-6 font-bold" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700] flex items-center space-x-1 font-telugu-noto">
                <span>ధ్రువీకరించిన భక్తుని తాజా స్క్రీన్ డేటా (Latest User Data)</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-400 text-emerald-300">
                <Check className="h-3 w-3 mr-0.5" /> కనెక్ట్ అయ్యింది
              </span>
            </div>
            <p className="text-xs text-[#e8cba4] mt-0.5 font-telugu-noto">
              {activeRecord ? (
                <span>
                  దీక్షా రికార్డు <strong className="text-[#ffd700]">#{activeRecord.id}</strong> •
                  స్క్రీన్ సమయం:{' '}
                  <strong className="text-white bg-black/40 px-1.5 py-0.5 rounded font-mono">
                    {activeRecord.screenTimeString}
                  </strong>{' '}
                  • స్థితి:{' '}
                  <strong
                    className={
                      activeRecord.category === 'HEALTHY'
                        ? 'text-emerald-400'
                        : activeRecord.category === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {activeRecord.category === 'HEALTHY'
                      ? 'ఆరోగ్యకరమైన నియంత్రణ (< 3 గంటలు)'
                      : activeRecord.category === 'WARNING'
                      ? 'మితమైన వినియోగం (3-5 గంటలు)'
                      : 'సంకల్ప ప్రతిజ్ఞ సిద్ధి'}
                  </strong>
                </span>
              ) : (
                <span>గత స్క్రీన్ డేటా కనుగొనబడలేదు. ప్రారంభ రికార్డు ఉపయోగించబడుతోంది.</span>
              )}
            </p>
          </div>
        </div>

        {/* Scan Selector Switcher Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {historyRecords.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSessionPicker((prev) => !prev)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#ffd700]/50 bg-[#350b18] hover:bg-[#461022] text-xs font-bold text-[#ffd700] transition-all"
                title="గతంలో పరిశీలించిన రికార్డును ఎంచుకోండి"
              >
                <History className="h-3.5 w-3.5 text-amber-300" />
                <span>స్క్రీన్ సెషన్ మార్చు ({historyRecords.length})</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showSessionPicker && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border-2 border-[#ffd700] bg-[#1f050d] shadow-2xl p-2 z-50 animate-in fade-in space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#ffd700] border-b border-[#ffd700]/30 flex items-center justify-between">
                    <span>సర్టిఫికేట్ కోసం రికార్డును ఎంచుకోండి:</span>
                    <button
                      onClick={() => setShowSessionPicker(false)}
                      className="text-xs text-[#e8cba4] hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pt-1">
                    {historyRecords.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setSelectedRecordId(rec.id);
                          setShowSessionPicker(false);
                          soundService.playTempleBell(1.0);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                          rec.id === activeRecord?.id
                            ? 'bg-[#481223] text-[#ffd700] font-bold border border-[#ffd700]/60'
                            : 'text-[#f5f2ed] hover:bg-[#320a17]'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-[11px] text-amber-300 block">
                            #{rec.id}
                          </span>
                          <span className="text-[11px] text-[#e8cba4]">
                            {new Date(rec.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold block text-white">
                            {rec.screenTimeString}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold ${
                              rec.category === 'HEALTHY'
                                ? 'text-emerald-400'
                                : rec.category === 'WARNING'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {rec.category === 'HEALTHY'
                              ? 'ఆరోగ్యకరం'
                              : rec.category === 'WARNING'
                              ? 'మితం'
                              : 'దీక్షా సిద్ధి'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (historyRecords.length > 0) {
                setSelectedRecordId(historyRecords[0].id);
                soundService.playTempleBell(1.1);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/80 hover:bg-emerald-900 text-xs font-bold text-emerald-200 transition-all shadow"
            title="తాజా రికార్డుకు రీసెట్ చేయండి"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>తాజా స్కాన్ డేటా</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP MODAL POPUP (Hidden during printing) */}
      {showWhatsappModal && (
        <div className="w-full max-w-5xl mb-6 p-4 sm:p-6 rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-br from-[#0c2415] via-[#08170e] to-[#040c07] shadow-[0_0_50px_rgba(37,211,102,0.35)] space-y-4 print:hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <WhatsAppIcon className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-telugu-noto text-base sm:text-lg font-bold text-emerald-300">
                  సంకల్ప పత్రం చిత్రాన్ని వాట్సాప్‌కు పంపండి
                </h3>
                <p className="text-xs text-[#cde6d2]/80">
                  భక్తుని మొబైల్ నంబరుకు గణపతి దివ్య ఆశీస్సులతో కూడిన హై-రిజల్యూషన్ సర్టిఫికేట్ పంపబడుతుంది.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWhatsappModal(false)}
              className="h-8 w-8 rounded-full border border-emerald-500/40 bg-black/40 flex items-center justify-center text-[#e8cba4] hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
            {/* Left Form: Number input & actions */}
            <div className="lg:col-span-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#ffd700] mb-1.5 font-telugu-noto">
                  స్వీకర్త వాట్సాప్ మొబైల్ నంబర్:
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={whatsappCountryCode}
                    onChange={(e) => setWhatsappCountryCode(e.target.value)}
                    className="rounded-xl border border-emerald-500/50 bg-[#09170e] px-2.5 py-2 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="91">🇮🇳 +91 (భారతదేశం - India)</option>
                    <option value="1">🇺🇸 +1 (USA/Canada)</option>
                    <option value="44">🇬🇧 +44 (UK)</option>
                    <option value="971">🇦🇪 +971 (UAE)</option>
                    <option value="65">🇸🇬 +65 (Singapore)</option>
                    <option value="61">🇦🇺 +61 (Australia)</option>
                    <option value="60">🇲🇾 +60 (Malaysia)</option>
                    <option value="966">🇸🇦 +966 (Saudi Arabia)</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400/70" />
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="ఉదా: 9876543210"
                      className="w-full rounded-xl border border-emerald-500/50 bg-[#09170e] pl-9 pr-3 py-2 text-sm font-mono font-bold text-[#ffffff] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-[#e8cba4]/30"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-[#e8cba4]/60 mt-1 block font-telugu-noto">
                  సూచన: 10 అంకెల మొబైల్ నంబరును నమోదు చేయండి
                </span>
              </div>

              {whatsappStatus && (
                <div className="p-3 rounded-xl border border-emerald-500/60 bg-emerald-950/80 text-xs text-emerald-200 font-semibold animate-in fade-in leading-relaxed font-telugu-noto">
                  {whatsappStatus}
                </div>
              )}

              {/* How Certificate Image is Delivered */}
              <div className="p-3.5 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#1a070f] to-[#0d1f14] space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ffd700] flex items-center space-x-1.5 font-telugu-noto">
                    <ImageIcon className="h-4 w-4 text-emerald-400" />
                    <span>సర్టిఫికేట్ చిత్రం ఎలా అందుతుంది?</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 font-mono border border-emerald-500/40">
                    ఆటో కాపీ &amp; లింక్
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-[#e8cba4]/90 leading-snug font-telugu-noto">
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">1️⃣</span>
                    <span>
                      <strong>డైరెక్ట్ హై-రిజల్యూషన్ లింక్:</strong> వాట్సాప్ సందేశంలో సర్టిఫికేట్ ఇమేజ్ డైరెక్ట్ లింక్ ఉంటుంది.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">2️⃣</span>
                    <span>
                      <strong>క్లిప్‌బోర్డ్‌కు ఆటో కాపీ:</strong> బటన్ నొక్కగానే చిత్రం మీ క్లిప్‌బోర్డ్‌కు కాపీ అవుతుంది. వాట్సాప్‌లో <strong>Ctrl+V</strong> (లేదా పేస్ట్) చేసి పంపవచ్చు!
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">3️⃣</span>
                    <span>
                      <strong>డివైజ్‌లో భద్రపరచబడుతుంది:</strong> హై-రిజల్యూషన్ PNG ఫైల్ కూడా సేవ్ అవుతుంది; వాట్సాప్ 📎 పేపర్‌క్లిప్ ద్వారా అటాచ్ చేయవచ్చు.
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  onClick={handleSendToWhatsApp}
                  disabled={isGeneratingImage}
                  id="send-to-wa-confirm-btn"
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 px-4 py-3 text-sm font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(37,211,102,0.45)] disabled:opacity-50 cursor-pointer font-telugu-noto"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>
                    {isGeneratingImage ? 'చిత్రం సిద్ధమవుతోంది...' : 'వాట్సాప్‌కు సర్టిఫికేట్ పంపు'}
                  </span>
                </button>

                <button
                  onClick={handleCopyImageToClipboard}
                  disabled={isGeneratingImage}
                  className="flex items-center justify-center space-x-1.5 px-3.5 py-3 rounded-xl border border-amber-400/60 bg-amber-950/60 text-xs font-bold text-amber-200 hover:bg-amber-900 transition-all font-telugu-noto"
                  title="సర్టిఫికేట్ చిత్రాన్ని క్లిప్‌బోర్డ్‌కు కాపీ చేసుకోండి"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedImage ? 'కాపీ అయ్యింది!' : 'ఇమేజ్ కాపీ చేయి'}</span>
                </button>
              </div>
            </div>

            {/* Right Form: Live WhatsApp Message Preview, QR Code & Live Link */}
            <div className="lg:col-span-6 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1 font-telugu-noto">
                  <span>వాట్సాప్ సందేశం ముందస్తు రూపం:</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center space-x-1 text-[11px] text-emerald-300 hover:text-emerald-100 font-telugu-noto"
                  >
                    {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMessage ? 'కాపీ అయ్యింది' : 'టెక్స్ట్ కాపీ చేయి'}</span>
                  </button>
                </div>
              </div>

              {/* Message Preview */}
              <div className="flex-1 rounded-2xl border border-emerald-500/30 bg-[#07130b] p-3 text-[11px] font-telugu-noto leading-relaxed text-[#cde6d2] overflow-y-auto max-h-48 whitespace-pre-wrap select-all shadow-inner">
                {generateWhatsAppMessage()}
              </div>

              {/* QR Code & Mobile Fast-Share Box */}
              <div className="p-3 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-[#0a180e] via-[#102416] to-[#0a180e] flex items-center justify-between gap-3">
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#ffd700] font-telugu-noto">
                    <QrCode className="h-4 w-4 text-emerald-400" />
                    <span>మొబైల్ కెమెరాతో స్కాన్ చేయండి:</span>
                  </div>
                  <p className="text-[11px] text-[#e8cba4]/90 leading-tight font-telugu-noto">
                    మీ మొబైల్ కెమెరాతో ఈ కోడ్‌ను స్కాన్ చేసి ఫోన్‌లో నేరుగా చిత్రం సహా వాట్సాప్‌లో షేర్ చేయండి!
                  </p>
                  <a
                    href={
                      hostedViewUrl ||
                      `/api/certificate/view/${certificateId}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold text-emerald-300 hover:underline pt-0.5"
                  >
                    <span>డైరెక్ట్ వెబ్ లింక్ (Open Link)</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {qrCodeDataUrl ? (
                  <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0 border border-emerald-400/50">
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan Certificate QR"
                      className="h-20 w-20 rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-emerald-950/60 flex items-center justify-center text-xs text-emerald-400 shrink-0">
                    <QrCode className="h-8 w-8 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Guidance Modal (Appears when WhatsApp Web opens) */}
      {showDesktopGuidanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-b from-[#0c2617] via-[#122b1c] to-[#07130b] shadow-[0_0_50px_rgba(16,185,129,0.5)] text-left space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                  <WhatsAppIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-telugu-noto text-base sm:text-lg font-bold text-emerald-300">
                    వాట్సాప్ చాట్ తెరవబడింది!
                  </h3>
                  <p className="text-xs text-[#e8cba4]/80 font-telugu-noto">
                    సర్టిఫికేట్ చిత్రాన్ని పంపడానికి కేవలం ఒక్క క్షణం:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopGuidanceModal(false)}
                className="h-8 w-8 rounded-full border border-emerald-500/40 bg-black/40 flex items-center justify-center text-[#e8cba4] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-telugu-noto">
              <div className="p-3 rounded-2xl border border-amber-400/50 bg-[#1e0a13] flex items-start space-x-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 font-bold shrink-0 text-sm">
                  1
                </div>
                <div className="flex-1 text-xs text-[#fbe2b5] leading-relaxed">
                  <span className="font-bold text-[#ffd700] block text-sm mb-0.5">
                    📋 వాట్సాప్ చాట్‌లో Ctrl + V (పేస్ట్) నొక్కండి!
                  </span>
                  సర్టిఫికేట్ చిత్రం <strong>మీ క్లిప్‌బోర్డ్‌లో సిద్ధంగా ఉంది</strong>. వాట్సాప్ మెసేజ్ బాక్స్‌పై క్లిక్ చేసి <strong>Ctrl+V</strong> (లేదా Right Click → Paste) నొక్కితే చిత్రం జతచేయబడుతుంది!
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-emerald-500/40 bg-[#081a10] flex items-start space-x-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-300 font-bold shrink-0 text-sm">
                  2
                </div>
                <div className="flex-1 text-xs text-[#cde6d2] leading-relaxed">
                  <span className="font-bold text-emerald-300 block text-sm mb-0.5">
                    ⬇️ లేదా 📎 పేపర్‌క్లిప్ ద్వారా అటాచ్ చేయండి
                  </span>
                  సర్టిఫికేట్ PNG ఫైల్ మీ డౌన్‌లోడ్స్ ఫోల్డర్‌లో కూడా భద్రపరచబడింది.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-emerald-500/30">
              <button
                onClick={handleCopyImageToClipboard}
                className="px-4 py-2 rounded-xl border border-amber-400/60 bg-amber-950/60 text-xs font-bold text-amber-200 hover:bg-amber-900/80 transition-all flex items-center space-x-1.5 font-telugu-noto"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>మళ్లీ ఇమేజ్ కాపీ చేయి</span>
              </button>
              <button
                onClick={() => setShowDesktopGuidanceModal(false)}
                className="px-5 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-500 text-xs font-black text-white hover:bg-emerald-600 transition-all shadow-md font-telugu-noto"
              >
                అర్థమైంది (Got It!)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customizer Drawer / Form (Hidden during printing) */}
      {showCustomizer && (
        <div className="w-full max-w-5xl mb-6 p-4 sm:p-5 rounded-2xl border-2 border-[#ffd700]/60 bg-[#220710]/95 backdrop-blur-md shadow-2xl space-y-4 print:hidden animate-in fade-in text-left">
          <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#ffd700]" />
              <h3 className="font-telugu-noto text-base sm:text-lg font-bold text-[#ffd700]">
                సంకల్ప పత్రం వివరాలను సవరించండి
              </h3>
            </div>
            <span className="text-xs text-[#e8cba4]/70 font-telugu-noto">వెంటనే అప్‌డేట్ అవుతుంది</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-telugu-noto">
            <div>
              <label className="block text-xs font-bold text-[#ffd700] mb-1">
                స్వీకర్త / భక్తుని పేరు (Name in Telugu / Tenglish):
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => handleSaveDevoteeName(e.target.value)}
                placeholder="ఉదా: Chi. Arjun Kumar"
                className="w-full rounded-xl border border-[#ffd700]/40 bg-[#160308] px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ffd700] mb-1">దీక్షా వయో విభాగం:</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as UserAgeGroup)}
                className="w-full rounded-xl border border-[#ffd700]/40 bg-[#160308] px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-none"
              >
                <option value="0-12">బాల సంకల్ప దీక్ష (0 - 12 సం॥)</option>
                <option value="13-21">యువ సంకల్ప దీక్ష (13 - 21 సం॥)</option>
                <option value="21+">ప్రౌఢ సంకల్ప దీక్ష (21+ సం॥)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ffd700] mb-1">ఘనత / పురస్కార శీర్షిక:</label>
              <select
                value={achievementTitle}
                onChange={(e) => setAchievementTitle(e.target.value)}
                className="w-full rounded-xl border border-[#ffd700]/40 bg-[#160308] px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-none"
              >
                <option value="ఉత్తమ స్క్రీన్ నియంత్రణ & నేత్ర సంరక్షణ (< 3 గంటలు)">
                  ఉత్తమ స్క్రీన్ నియంత్రణ &amp; నేత్ర సంరక్షణ (&lt; 3 గంటలు)
                </option>
                <option value="జాగరూకతతో కూడిన స్క్రీన్ సంయమనం (< 5 గంటలు)">
                  జాగరూకతతో కూడిన స్క్రీన్ సంయమనం (&lt; 5 గంటలు)
                </option>
                <option value="శ్రీ మహాగణపతి ఎదుట పవిత్ర సంకల్ప దీక్షా సిద్ధి">
                  శ్రీ మహాగణపతి ఎదుట పవిత్ర సంకల్ప దీక్షా సిద్ధి
                </option>
                <option value="7 రోజుల నిరంతర స్క్రీన్ సమతుల్య దీక్షా సిద్ధి">
                  7 రోజుల నిరంతర స్క్రీన్ సమతుల్య దీక్షా సిద్ధి
                </option>
                <option value="ఉత్తమ విద్యాభ్యాస ఏకాగ్రత & డిజిటల్ క్రమశిక్షణ">
                  ఉత్తమ విద్యాభ్యాస ఏకాగ్రత &amp; డిజిటల్ క్రమశిక్షణ
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ffd700] mb-1">
                తల్లిదండ్రులు / గురువు గారి సంతకం:
              </label>
              <input
                type="text"
                value={mentorName}
                onChange={(e) => handleSaveMentorName(e.target.value)}
                placeholder="తల్లి / తండ్రి పేరు (Parent / Mentor)"
                className="w-full rounded-xl border border-[#ffd700]/40 bg-[#160308] px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-none"
              />
            </div>
          </div>

          <div className="font-telugu-noto">
            <label className="block text-xs font-bold text-[#ffd700] mb-1">
              ప్రశంసా వాక్యము / ఆశీర్వచనములు:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full rounded-xl border border-[#ffd700]/40 bg-[#160308] px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          THE SACRED TEMPLE CONSECRATION CERTIFICATE (ISO 216 STANDARD A4: 210 × 297 MM)
         ========================================================================= */}
      <div
        ref={certificateRef}
        id="sankalpam-certificate-printable"
        className={`w-full bg-[#fffdf7] text-[#240810] rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 border-[6px] sm:border-[8px] border-[#9c6f19] ${
          a4Orientation === 'portrait'
            ? 'max-w-[794px] p-3 sm:p-5 md:p-6'
            : 'max-w-[1123px] p-3 sm:p-5 md:p-6'
        }`}
        style={{
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 45px rgba(212, 175, 55, 0.45)',
          backgroundImage:
            'radial-gradient(circle at 50% 18%, #ffffff 0%, #fffbf2 45%, #fff5df 85%, #faedd0 100%)',
        }}
      >
        {/* Ornate Concentric Gold & Maroon Inner Borders */}
        <div className="border-[2px] border-[#c59b27] rounded-2xl p-1.5 sm:p-2 relative bg-transparent">
          {/* Micro-printed Security Border Thread (In Pure Telugu with Sanskrit Invocations) */}
          <div className="border border-[#e2caa1] rounded-xl p-2.5 sm:p-4 md:p-5 relative bg-gradient-to-b from-transparent via-[#ffffff]/40 to-transparent">
            {/* Corner Floral Rosettes */}
            <div className="absolute top-2 left-2 text-[#9c6f19] font-royal text-xl sm:text-2xl select-none leading-none">
              ❖
            </div>
            <div className="absolute top-2 right-2 text-[#9c6f19] font-royal text-xl sm:text-2xl select-none leading-none">
              ❖
            </div>
            <div className="absolute bottom-2 left-2 text-[#9c6f19] font-royal text-xl sm:text-2xl select-none leading-none">
              ❖
            </div>
            <div className="absolute bottom-2 right-2 text-[#9c6f19] font-royal text-xl sm:text-2xl select-none leading-none">
              ❖
            </div>

            {/* Top Micro-Security Ribbon in Telugu */}
            <div className="w-full text-center mb-2 select-none overflow-hidden text-[7px] sm:text-[8px] font-telugu-noto tracking-[0.2em] text-[#9c6f19]/80 uppercase border-b border-[#c59b27]/30 pb-1">
              ॥ శ్రీ గణేశాయ నమః ॥ • సమతుల్యం డిజిటల్ సంక్షేమ మందిరం • సంకల్ప దీక్షా సిద్ధి పత్రం • పవిత్ర ధ్రువీకరణ రికార్డు • SAMATULYAM SANCTUM •
            </div>

            {/* Top Header Row: Dual Round Logos & Sacred Om Emblem */}
            <div className="flex items-center justify-between border-b-2 border-[#b8860b]/40 pb-2 mb-3">
              {/* Logo 1 / Left Sacred Diya Frame */}
              <div className="flex items-center justify-start min-w-[60px]">
                {settings && settings.showLogos !== false ? (
                  <div className="p-1 rounded-full border-2 border-[#b8860b] bg-[#3a0d1b] shadow-md">
                    <WebsiteLogo
                      logoNumber={1}
                      url={settings.logo1Url}
                      title={settings.logo1Title}
                      size="md"
                      scale={settings.logoSize || 'large'}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-[#b8860b] bg-[#3a0d1b] flex items-center justify-center text-[#ffd700] shadow-md">
                    <span className="font-royal font-bold text-lg">🪔</span>
                  </div>
                )}
              </div>

              {/* Center Sacred Vedic Invocation & Seal */}
              <div className="flex flex-col items-center text-center mx-2">
                <span className="font-telugu-noto text-xs sm:text-sm font-extrabold text-[#70081d] tracking-widest uppercase">
                  ॥ శ్రీ గణేశాయ నమః ॥
                </span>
                <div className="my-1 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-[#b8860b] bg-gradient-to-br from-[#470d1e] to-[#25040d] shadow-md text-[#ffd700]">
                  <span className="text-xl sm:text-2xl font-bold font-royal leading-none drop-shadow">
                    ॐ
                  </span>
                </div>
                <h3 className="font-telugu-noto text-xs sm:text-sm md:text-base font-black tracking-wider text-[#7a5818]">
                  సమతుల్యం డిజిటల్ సంక్షేమ మందిరం
                </h3>
                <span className="font-telugu-noto text-[9px] sm:text-[10px] font-bold text-[#8d6215]">
                  శ్రీ విఘ్నేశ్వర దివ్య సంకల్ప దీక్షా పీఠం &bull; An KPROJECTXX Initiative
                </span>
              </div>

              {/* Logo 2 / Right Temple Bell Frame */}
              <div className="flex items-center justify-end min-w-[60px]">
                {settings && settings.showLogos !== false ? (
                  <div className="p-1 rounded-full border-2 border-[#b8860b] bg-[#3a0d1b] shadow-md">
                    <WebsiteLogo
                      logoNumber={2}
                      url={settings.logo2Url}
                      title={settings.logo2Title}
                      size="md"
                      scale={settings.logoSize || 'large'}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-[#b8860b] bg-[#3a0d1b] flex items-center justify-center text-[#ffd700] shadow-md">
                    <span className="font-royal font-bold text-lg">🔔</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Certificate Title (Full Telugu + Sanskrit) */}
            <div className="text-center space-y-1 mb-3">
              <h2 className="font-telugu-noto text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#63081a] tracking-wide drop-shadow-sm">
                సంకల్ప దీక్షా సిద్ధి పత్రం
              </h2>
              <h1 className="font-telugu-noto text-xs sm:text-sm md:text-base font-black text-[#8d6215] tracking-wide">
                శ్రీ మహాగణపతి డిజిటల్ సంయమన &amp; నేత్ర సంరక్షణ ప్రశంసా పత్రం
              </h1>
              <p className="font-telugu-noto text-[10px] sm:text-xs text-[#543b17] font-semibold italic">
                ॥ నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥ &bull; శ్రీ విఘ్నేశ్వరుని దివ్య ఆశీస్సులతో ప్రదానం చేయబడినది
              </p>
            </div>

            {/* Content Layout: Portrait (single-column) vs Landscape (two-column) */}
            {a4Orientation === 'portrait' ? (
              /* ================= PORTRAIT A4 LAYOUT (210 × 297 MM) ================= */
              <>
                {/* Center Lord Ganesha Lotus Locket & Presentation */}
                <div className="my-2.5 flex flex-col items-center">
                  <div className="relative mb-2 flex h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 items-center justify-center rounded-full border-[3px] border-[#b8860b] bg-[#3a0d1b] p-1 shadow-xl">
                    <img
                      src={ASSETS.ganeshaLotus}
                      alt="Lord Ganesha Blessing"
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-full object-cover shadow-inner"
                    />
                    <div className="absolute -bottom-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-0.5 rounded-full border border-yellow-200 shadow-md tracking-wider font-telugu-noto">
                      దివ్య అనుగ్రహం
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs text-[#5a421b] font-telugu-noto tracking-wider font-bold">
                    ఈ పవిత్ర సంకల్ప దీక్షా సిద్ధి పత్రం సగౌరవంగా సమర్పించడమైనది:
                  </span>

                  {/* Devotee Recipient Calligraphy Display */}
                  <div className="my-1.5 border-b-2 border-[#b8860b]/70 px-6 sm:px-10 pb-0.5 text-center">
                    <span className="font-playfair text-2xl sm:text-3xl md:text-4xl font-black text-[#5e091b] tracking-wide drop-shadow-sm">
                      {recipientName || 'Chi. Devotee'}
                    </span>
                  </div>

                  {/* Filigree Leaf Divider */}
                  <div className="text-[#9c6f19] text-xs font-serif select-none my-0.5">
                    ❖ ════════════ ❈ ════════════ ❖
                  </div>

                  {/* Age Category & Milestone Badges in Telugu */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
                    <span className="px-3 py-0.5 rounded-full bg-[#3d0d1c] text-[#ffd700] text-[10px] sm:text-[11px] font-bold font-telugu-noto border border-[#ffd700]/60 shadow-sm">
                      {ageLabels[ageGroup].title}
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-900 text-emerald-100 text-[10px] sm:text-[11px] font-bold font-telugu-noto border border-emerald-400 shadow-sm flex items-center space-x-1">
                      <Award className="h-3 w-3 text-amber-300 mr-1 inline" />
                      <span>{achievementTitle}</span>
                    </span>
                  </div>

                  {/* Commendation Note in Pure Telugu */}
                  <p className="mt-1.5 max-w-2xl text-center text-[11px] sm:text-xs leading-relaxed text-[#352110] font-telugu-noto font-semibold">
                    {customNote}
                  </p>
                </div>

                {/* Audit & Evaluation Metrics Table (In Full Telugu) */}
                <div className="my-3 rounded-xl border border-[#b8860b] bg-gradient-to-r from-[#fff9ea] via-[#fffdf7] to-[#fff9ea] p-2.5 sm:p-3 shadow-sm text-left">
                  <div className="flex items-center justify-between border-b border-[#b8860b]/40 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="h-5 w-5 rounded-md bg-[#5e091b] flex items-center justify-center text-[#ffd700]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-telugu-noto text-[11px] sm:text-xs font-bold text-[#5e091b] tracking-wide">
                        శ్రీ గణేశ మందిర డిజిటల్ స్క్రీన్ పరిశీలన &amp; భక్తుని రికార్డు (Sanctum Audit)
                      </span>
                    </div>
                    <span className="text-[9px] font-telugu-noto font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400">
                      ✓ అధికారిక ధ్రువీకరణ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {/* Metric 1 */}
                    <div className="p-1.5 rounded-lg border border-[#c59b27]/40 bg-[#ffffff] shadow-sm">
                      <div className="flex items-center justify-center space-x-1 text-[#7a5818] text-[9px] sm:text-[10px] font-bold mb-0.5 font-telugu-noto">
                        <Clock className="h-2.5 w-2.5 text-emerald-700" />
                        <span>స్క్రీన్ సమయం</span>
                      </div>
                      <span className="font-mono text-sm sm:text-base font-black text-[#5e091b] block">
                        {activeRecord?.screenTimeString || '1h 50m'}
                      </span>
                      <span className="text-[8px] text-[#7a5818] block font-telugu-noto truncate">
                        {activeRecord && activeRecord.screenTimeMinutes <= 180
                          ? 'ఆరోగ్యకర పరిమితి (< 3h)'
                          : 'సంకల్ప నియంత్రణ'}
                      </span>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-1.5 rounded-lg border border-[#c59b27]/40 bg-[#ffffff] shadow-sm">
                      <div className="flex items-center justify-center space-x-1 text-[#7a5818] text-[9px] sm:text-[10px] font-bold mb-0.5 font-telugu-noto">
                        <Award className="h-2.5 w-2.5 text-amber-700" />
                        <span>సంకల్ప స్థితి</span>
                      </div>
                      <span className="font-telugu-noto text-[11px] sm:text-xs font-black block text-emerald-700 truncate">
                        {activeRecord?.category === 'HEALTHY'
                          ? 'ఆరోగ్యకర సంయమనం'
                          : 'సంకల్ప దీక్షా సిద్ధి'}
                      </span>
                      <span className="text-[8px] text-[#7a5818] block font-telugu-noto truncate">
                        ఆలయ తలుపులు ఓపెన్ (100%)
                      </span>
                    </div>

                    {/* Metric 3 */}
                    <div className="p-1.5 rounded-lg border border-[#c59b27]/40 bg-[#ffffff] shadow-sm">
                      <div className="flex items-center justify-center space-x-1 text-[#7a5818] text-[9px] sm:text-[10px] font-bold mb-0.5 font-telugu-noto">
                        <FileCheck className="h-2.5 w-2.5 text-blue-700" />
                        <span>దీక్షా రికార్డు (ID)</span>
                      </div>
                      <span className="font-mono text-[11px] sm:text-xs font-black text-[#2b0c16] block">
                        #{activeRecord?.id || 'SAM-101'}
                      </span>
                      <span className="text-[8px] text-[#7a5818] block font-telugu-noto truncate">
                        సెన్సార్ ధ్రువీకరణ
                      </span>
                    </div>

                    {/* Metric 4 */}
                    <div className="p-1.5 rounded-lg border border-[#c59b27]/40 bg-[#ffffff] shadow-sm">
                      <div className="flex items-center justify-center space-x-1 text-[#7a5818] text-[9px] sm:text-[10px] font-bold mb-0.5 font-telugu-noto">
                        <Calendar className="h-2.5 w-2.5 text-purple-700" />
                        <span>ప్రదానం చేసిన తేదీ</span>
                      </div>
                      <span className="font-telugu-noto text-[10px] sm:text-[11px] font-bold text-[#5e091b] block truncate">
                        {issueDate}
                      </span>
                      <span className="text-[8px] text-[#7a5818] block font-telugu-noto truncate">
                        అధికారిక దీక్ష
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sacred Devotee Daily Vow */}
                <div className="my-2.5 p-2 sm:p-2.5 rounded-xl border border-[#b8860b]/60 bg-[#fff5dc] text-center space-y-0.5">
                  <span className="text-[9px] font-telugu-noto uppercase font-extrabold tracking-wider text-[#70081d] block">
                    భక్తుని నిత్య సంకల్ప ప్రతిజ్ఞ (Sacred Daily Vow)
                  </span>
                  <p className="font-telugu-noto text-xs sm:text-sm font-extrabold text-[#5e091b]">
                    &ldquo;నేను ఫోన్ తక్కువ చూస్తాను &bull; చదువు, ఆరోగ్యం మరియు కుటుంబం కోసం సమయాన్ని సద్వినియోగం చేసుకుంటాను.&rdquo;
                  </p>
                </div>

                {/* Sacred Sanskrit Shloka Box */}
                <div className="my-2.5 p-2 sm:p-2.5 rounded-xl border border-[#b8860b] bg-gradient-to-r from-[#faedd0] via-[#fff4dc] to-[#faedd0] text-center space-y-0.5 shadow-inner">
                  <p className="font-telugu-noto text-xs sm:text-sm font-extrabold text-[#5e091b] tracking-wide">
                    ॥ వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#543b17] font-telugu-noto font-semibold italic">
                    &ldquo;కోటి సూర్యుల తేజస్సు గల ఓ విఘ్నేశ్వరా! మా డిజిటల్ అలసటను తొలగించి, మాకు నిత్య ఏకాగ్రతను, జ్ఞానాన్ని ప్రసాదించుము.&rdquo;
                  </p>
                </div>

                {/* Bottom Signatures, Stamp & QR Code */}
                <div className="mt-4 pt-2.5 border-t-2 border-[#b8860b]/50 flex flex-wrap items-end justify-between gap-2 px-2 sm:px-4 text-center">
                  {/* Seal 1 */}
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-dashed border-[#70081d] bg-[#fff5dc] p-0.5 flex items-center justify-center shadow-inner">
                      <div className="h-full w-full rounded-full border border-[#b8860b] bg-gradient-to-br from-[#68081c] to-[#3a0610] text-[#ffd700] flex flex-col items-center justify-center shadow-md">
                        <span className="text-xs font-royal font-black">ॐ</span>
                        <span className="text-[6px] uppercase font-black tracking-tighter text-[#ffd700]/95 leading-none font-telugu-noto">
                          దివ్య ముద్ర
                        </span>
                      </div>
                    </div>
                    <span className="mt-0.5 text-[9px] sm:text-[10px] font-telugu-noto font-extrabold text-[#63081a]">
                      శ్రీ గణేశ అనుగ్రహం
                    </span>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-0.5">
                    {qrCodeDataUrl ? (
                      <div className="bg-white p-1 rounded-md border border-[#b8860b]/60 shadow-sm">
                        <img src={qrCodeDataUrl} alt="Verify QR" className="h-11 w-11 sm:h-12 sm:w-12 rounded" />
                      </div>
                    ) : (
                      <div className="h-11 w-11 bg-white rounded flex items-center justify-center border border-[#b8860b]/60">
                        <QrCode className="h-6 w-6 text-[#5e091b]" />
                      </div>
                    )}
                    <span className="text-[7px] tracking-wider text-[#7a5818] font-bold font-telugu-noto">
                      ధ్రువీకరణ క్యూఆర్ (Verify QR)
                    </span>
                    <span className="text-[8px] font-mono text-[#5e091b] font-bold">
                      {certificateId}
                    </span>
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className="w-28 sm:w-36 border-b border-[#543b17] mb-0.5 pb-0.5">
                      <span className="font-script text-lg sm:text-xl text-[#5e091b] block">
                        {mentorName || 'Parent / Mentor'}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#63081a] font-telugu-noto">
                      సాక్షి &amp; మార్గదర్శి సంతకం
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-[#6d5024] font-telugu-noto">
                      తల్లిదండ్రులు / గురువు గారి ఆశీస్సులు
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* ================= LANDSCAPE A4 LAYOUT (297 × 210 MM) ================= */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch my-2">
                {/* Left Column: Divine Medal, Devotee, Badges, Vow & Shloka */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-2 border-r-0 md:border-r border-[#b8860b]/30 md:pr-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-1.5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-[2px] border-[#b8860b] bg-[#3a0d1b] p-0.5 shadow-md">
                      <img
                        src={ASSETS.ganeshaLotus}
                        alt="Lord Ganesha Blessing"
                        referrerPolicy="no-referrer"
                        className="h-full w-full rounded-full object-cover shadow-inner"
                      />
                      <div className="absolute -bottom-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[7px] font-black px-2 py-0.5 rounded-full border border-yellow-200 shadow font-telugu-noto">
                        దివ్య అనుగ్రహం
                      </div>
                    </div>

                    <span className="text-[10px] text-[#5a421b] font-telugu-noto font-bold">
                      ఈ పవిత్ర సంకల్ప దీక్షా సిద్ధి పత్రం సగౌరవంగా సమర్పించడమైనది:
                    </span>

                    <div className="my-1 border-b-2 border-[#b8860b]/70 px-6 pb-0.5 text-center">
                      <span className="font-playfair text-2xl sm:text-3xl font-black text-[#5e091b] tracking-wide">
                        {recipientName || 'Chi. Devotee'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#3d0d1c] text-[#ffd700] text-[10px] font-bold font-telugu-noto border border-[#ffd700]/60">
                        {ageLabels[ageGroup].title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-100 text-[10px] font-bold font-telugu-noto border border-emerald-400">
                        <Award className="h-3 w-3 text-amber-300 mr-1 inline" />
                        {achievementTitle}
                      </span>
                    </div>
                  </div>

                  {/* Sacred Daily Vow */}
                  <div className="p-2 rounded-xl border border-[#b8860b]/60 bg-[#fff5dc] text-center">
                    <span className="text-[8px] font-telugu-noto uppercase font-extrabold text-[#70081d] block">
                      భక్తుని నిత్య సంకల్ప ప్రతిజ్ఞ (Daily Vow)
                    </span>
                    <p className="font-telugu-noto text-[11px] font-extrabold text-[#5e091b]">
                      &ldquo;నేను ఫోన్ తక్కువ చూస్తాను &bull; చదువు, ఆరోగ్యం కోసం సమయాన్ని సద్వినియోగం చేసుకుంటాను.&rdquo;
                    </p>
                  </div>

                  {/* Sanskrit Shloka */}
                  <div className="p-2 rounded-xl border border-[#b8860b] bg-gradient-to-r from-[#faedd0] via-[#fff4dc] to-[#faedd0] text-center shadow-inner">
                    <p className="font-telugu-noto text-[11px] font-extrabold text-[#5e091b]">
                      ॥ వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥
                    </p>
                  </div>
                </div>

                {/* Right Column: Audit Metrics, Commendation, Stamp, QR & Signature */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-2 md:pl-2">
                  {/* Sanctum Audit Metrics */}
                  <div className="rounded-xl border border-[#b8860b] bg-gradient-to-r from-[#fff9ea] to-[#fffdf7] p-2 text-left">
                    <div className="flex items-center justify-between border-b border-[#b8860b]/40 pb-1 mb-1.5">
                      <div className="flex items-center space-x-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#5e091b]" />
                        <span className="font-telugu-noto text-[10px] font-bold text-[#5e091b]">
                          డిజిటల్ స్క్రీన్ పరిశీలన రికార్డు (Audit)
                        </span>
                      </div>
                      <span className="text-[8px] font-telugu-noto font-bold px-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-400">
                        ✓ ధ్రువీకరించబడినది
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-center">
                      <div className="p-1 rounded border border-[#c59b27]/40 bg-white">
                        <span className="text-[8px] text-[#7a5818] block font-telugu-noto">స్క్రీన్ సమయం</span>
                        <span className="font-mono text-sm font-black text-[#5e091b] block">
                          {activeRecord?.screenTimeString || '1h 50m'}
                        </span>
                      </div>
                      <div className="p-1 rounded border border-[#c59b27]/40 bg-white">
                        <span className="text-[8px] text-[#7a5818] block font-telugu-noto">సంకల్ప స్థితి</span>
                        <span className="font-telugu-noto text-[10px] font-black text-emerald-700 block truncate">
                          ఆరోగ్యకర సంయమనం
                        </span>
                      </div>
                      <div className="p-1 rounded border border-[#c59b27]/40 bg-white">
                        <span className="text-[8px] text-[#7a5818] block font-telugu-noto">దీక్షా రికార్డు ID</span>
                        <span className="font-mono text-[10px] font-black text-[#2b0c16] block">
                          #{activeRecord?.id || 'SAM-101'}
                        </span>
                      </div>
                      <div className="p-1 rounded border border-[#c59b27]/40 bg-white">
                        <span className="text-[8px] text-[#7a5818] block font-telugu-noto">తేదీ</span>
                        <span className="font-telugu-noto text-[10px] font-bold text-[#5e091b] block truncate">
                          {issueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commendation Note */}
                  <div className="p-1.5 rounded-lg bg-white/70 border border-[#b8860b]/30 text-center">
                    <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#352110] font-telugu-noto font-semibold">
                      {customNote}
                    </p>
                  </div>

                  {/* Stamp, QR & Signature Row */}
                  <div className="pt-2 border-t border-[#b8860b]/40 flex items-center justify-between px-1 text-center">
                    {/* Official Stamp */}
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full border border-dashed border-[#70081d] bg-[#fff5dc] p-0.5 flex items-center justify-center">
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-[#68081c] to-[#3a0610] text-[#ffd700] flex flex-col items-center justify-center">
                          <span className="text-[10px] font-royal font-black">ॐ</span>
                          <span className="text-[5px] uppercase font-black text-[#ffd700]">ముద్ర</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-telugu-noto font-bold text-[#63081a]">
                        శ్రీ గణేశ అనుగ్రహం
                      </span>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Verify QR" className="h-9 w-9 rounded border border-[#b8860b]/60" />
                      ) : (
                        <QrCode className="h-9 w-9 text-[#5e091b]" />
                      )}
                      <span className="text-[7px] font-mono text-[#5e091b] font-bold">
                        {certificateId}
                      </span>
                    </div>

                    {/* Mentor Signature */}
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className="w-24 border-b border-[#543b17] pb-0.5">
                        <span className="font-script text-base text-[#5e091b] block">
                          {mentorName || 'Parent / Mentor'}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold text-[#63081a] font-telugu-noto">
                        సాక్షి &amp; మార్గదర్శి
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fine Print / Security Footer */}
            <div className="mt-3 pt-1.5 border-t border-[#b8860b]/30 text-center">
              <span className="text-[7px] sm:text-[8px] font-telugu-noto font-bold tracking-wider text-[#7a5818]/90 uppercase">
                సమతుల్యం డిజిటల్ సంక్షేమ మందిరం &bull; శ్రీ విఘ్నేశ్వర పవిత్ర సంకల్ప దీక్షా పత్రం &bull; AN KPROJECTXX INITIATIVE &bull; SAMATULYAM SANCTUM &bull; ISO 216 STANDARD A4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom WhatsApp & Download Callout (Hidden in print) */}
      <div className="w-full max-w-4xl mt-6 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-[#0d2a1a] via-[#16080e] to-[#0d2a1a] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shadow-xl">
        <div className="flex items-center space-x-3 text-left">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <WhatsAppIcon className="h-7 w-7" />
          </div>
          <div>
            <h4 className="font-telugu-noto text-base sm:text-lg font-bold text-emerald-300">
              సర్టిఫికేట్ చిత్రాన్ని వాట్సాప్‌కు పంపండి
            </h4>
            <p className="text-xs text-[#e8cba4]/80 font-telugu-noto">
              మొబైల్ నంబరును నమోదు చేసి శ్రీ గణపతి ఆశీస్సులతో కూడిన A4 సంకల్ప పత్రం చిత్రాన్ని నేరుగా వాట్సాప్‌లో పొందండి!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowWhatsappModal(true);
              setShowCustomizer(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            id="bottom-whatsapp-btn"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-xl border-2 border-emerald-400 bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-black text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,211,102,0.4)] font-telugu-noto"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>వాట్సాప్ నంబర్ నమోదు</span>
          </button>

          <button
            onClick={() => handleDownloadA4Pdf(a4Orientation)}
            disabled={isGeneratingPdf}
            id="bottom-a4-pdf-btn"
            className="flex items-center justify-center space-x-1.5 rounded-xl border-2 border-[#ffd700] bg-gradient-to-r from-[#ffd700] via-amber-400 to-[#f59e0b] px-3.5 py-2.5 text-xs font-black text-[#1a040b] hover:scale-105 transition-all shadow-md disabled:opacity-50 font-telugu-noto"
            title="ISO A4 PDF డౌన్‌లోడ్ చేసుకోండి"
          >
            <FileText className="h-4 w-4 text-[#1a040b]" />
            <span>{isGeneratingPdf ? 'సిద్ధమవుతోంది...' : 'A4 PDF డౌన్‌లోడ్'}</span>
          </button>

          <button
            onClick={handleDownloadA4Png}
            disabled={isGeneratingImage}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-[#ffd700]/50 bg-[#2b0c16] px-3 py-2.5 text-xs font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all disabled:opacity-50 font-telugu-noto"
            title="A4 చిత్రం డౌన్‌లోడ్ చేసుకోండి"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">A4 చిత్రం (PNG)</span>
          </button>
        </div>
      </div>

      {/* Exact ISO 216 Standard A4 Print Stylesheet (210mm × 297mm) */}
      <style>{`
        @page {
          size: A4 ${a4Orientation};
          margin: 0mm;
        }
        @media print {
          html, body {
            width: ${a4Orientation === 'portrait' ? '210mm' : '297mm'} !important;
            height: ${a4Orientation === 'portrait' ? '297mm' : '210mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          #sankalpam-certificate-printable {
            width: ${a4Orientation === 'portrait' ? '210mm' : '297mm'} !important;
            height: ${a4Orientation === 'portrait' ? '297mm' : '210mm'} !important;
            max-width: ${a4Orientation === 'portrait' ? '210mm' : '297mm'} !important;
            max-height: ${a4Orientation === 'portrait' ? '297mm' : '210mm'} !important;
            min-height: ${a4Orientation === 'portrait' ? '297mm' : '210mm'} !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: ${a4Orientation === 'portrait' ? '6mm 7mm' : '4mm 6mm'} !important;
            border-width: 4mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
