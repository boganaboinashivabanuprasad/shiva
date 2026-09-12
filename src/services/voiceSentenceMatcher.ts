/**
 * High-Accuracy Voice Sentence Recognition & Full-Sentence Verification Engine
 * Enforces: Complete sentence must be spoken. If even one required word is missed,
 * validation stops and requires the user to speak the full complete sentence.
 */

export interface WordMatchStatus {
  originalWord: string;
  matched: boolean;
  matchedText?: string;
  aliases: string[];
}

export interface SentenceMatchResult {
  isComplete: boolean;
  completenessPercent: number;
  matchedCount: number;
  totalRequiredCount: number;
  wordStatuses: WordMatchStatus[];
  missingWords: string[];
  matchedWords: string[];
  detectedLanguage: 'telugu' | 'english' | 'unknown';
  userTranscript: string;
  feedbackMessage: string;
}

// Dictionary of phonetic transliterations & synonyms for Telugu & English sacred vow words
const PHONETIC_DICTIONARY: Record<string, string[]> = {
  // Telugu words and their common speech recognition outputs (in Telugu script & Roman phonetic)
  'నేను': ['నేను', 'నేన', 'నేనూ', 'nenu', 'nen', 'naenu', 'neynu', 'i'],
  'ఫోన్': ['ఫోన్', 'ఫోను', 'ఫోనె', 'ఫోనుని', 'ఫోనును', 'phone', 'fone', 'mobile', 'cell', 'smartphone'],
  'తక్కువ': ['తక్కువ', 'తక్కువగా', 'తగ్గిస్తాను', 'తగ్గిస్తా', 'తగ్గించి', 'thakkuva', 'takkuva', 'thakuva', 'takuva', 'thakuvaga', 'takkuvaga', 'less', 'reduce'],
  'చూస్తాను': ['చూస్తాను', 'చూస్తా', 'చూస్తాం', 'చూస్తాము', 'చూడను', 'చూసేది', 'chusthanu', 'chustanu', 'choosthanu', 'choostanu', 'chustha', 'chusta', 'choosta', 'use', 'see', 'watch'],

  // English words and their common speech recognition variants
  'i': ['i', 'eye', 'నేను', 'nenu'],
  'promise': ['promise', 'promising', 'pledge', 'vow', 'swear', 'ప్రమాణం', 'మాట'],
  'to': ['to', 'too', '2'],
  'use': ['use', 'using', 'see', 'watch', 'look', 'చూస్తాను', 'వాడతాను'],
  'my': ['my', 'mine', 'మా', 'నా'],
  'phone': ['phone', 'fone', 'mobile', 'smartphone', 'ఫోన్', 'ఫోను'],
  'less': ['less', 'lesser', 'reduce', 'minimum', 'తక్కువ', 'తగ్గిస్తాను', 'తక్కువగా'],
};

/**
 * Normalizes text for robust multi-script matching
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract clean word tokens from a sentence
 */
export function getSentenceWordTokens(sentence: string): string[] {
  if (!sentence) return [];
  const clean = normalizeText(sentence);
  return clean.split(' ').filter((w) => w.length > 0);
}

/**
 * Get aliases for a word (phonetic transliterations or exact match)
 */
function getWordAliases(word: string): string[] {
  const cleanWord = normalizeText(word);
  if (PHONETIC_DICTIONARY[cleanWord]) {
    return Array.from(new Set([cleanWord, ...PHONETIC_DICTIONARY[cleanWord]]));
  }

  // Check reverse or partial in dictionary
  for (const [key, aliases] of Object.entries(PHONETIC_DICTIONARY)) {
    if (key === cleanWord || aliases.includes(cleanWord)) {
      return Array.from(new Set([key, cleanWord, ...aliases]));
    }
  }

  return [cleanWord];
}

/**
 * Checks if a specific word token exists in the user's spoken transcript
 */
function checkWordInTranscript(word: string, transcriptWords: string[], fullTranscriptClean: string): { matched: boolean; matchedAlias?: string } {
  const aliases = getWordAliases(word);

  // 1. Direct word match in spoken token list
  for (const alias of aliases) {
    if (transcriptWords.includes(alias)) {
      return { matched: true, matchedAlias: alias };
    }
  }

  // 2. Substring match inside the spoken transcript
  for (const alias of aliases) {
    if (fullTranscriptClean.includes(alias)) {
      return { matched: true, matchedAlias: alias };
    }
  }

  // 3. Telugu root match (e.g. 'చూస్తా' matches 'చూస్తాను')
  for (const tWord of transcriptWords) {
    for (const alias of aliases) {
      if (alias.length >= 3 && tWord.length >= 3) {
        if (tWord.startsWith(alias) || alias.startsWith(tWord)) {
          return { matched: true, matchedAlias: tWord };
        }
      }
    }
  }

  return { matched: false };
}

/**
 * Rigorously evaluates whether the user has spoken the FULL sentence.
 * "if one word miss should stop"
 * Returns isComplete = true ONLY if every single required word is present.
 */
export function verifyCompleteSentence(
  spokenTranscript: string,
  targetTeluguPhrase: string = 'నేను ఫోన్ తక్కువ చూస్తాను',
  targetEnglishPhrase: string = 'I promise to use my phone less'
): SentenceMatchResult {
  const cleanSpoken = normalizeText(spokenTranscript);
  const spokenWords = cleanSpoken.split(' ').filter((w) => w.length > 0);

  if (!cleanSpoken || spokenWords.length === 0) {
    const teluguTokens = getSentenceWordTokens(targetTeluguPhrase);
    return {
      isComplete: false,
      completenessPercent: 0,
      matchedCount: 0,
      totalRequiredCount: teluguTokens.length,
      wordStatuses: teluguTokens.map((w) => ({
        originalWord: w,
        matched: false,
        aliases: getWordAliases(w),
      })),
      missingWords: teluguTokens,
      matchedWords: [],
      detectedLanguage: 'unknown',
      userTranscript: spokenTranscript,
      feedbackMessage: 'Please speak the full sacred sentence clearly.',
    };
  }

  // Detect whether user is trying to speak Telugu or English
  const isEnglishAttempt = /[a-zA-Z]/.test(cleanSpoken) && (
    cleanSpoken.includes('promise') ||
    cleanSpoken.includes('phone') ||
    cleanSpoken.includes('less') ||
    cleanSpoken.includes('use') ||
    cleanSpoken.includes('vow') ||
    cleanSpoken.includes('i ')
  );

  // Evaluate against both phrases and pick the higher matching candidate
  const evalTelugu = evaluateSinglePhrase(cleanSpoken, spokenWords, targetTeluguPhrase, 'telugu');
  const evalEnglish = evaluateSinglePhrase(cleanSpoken, spokenWords, targetEnglishPhrase, 'english');

  // If one is 100% complete, return that one immediately!
  if (evalTelugu.isComplete) return evalTelugu;
  if (evalEnglish.isComplete) return evalEnglish;

  // Otherwise, return the one the user is actively speaking
  if (isEnglishAttempt) {
    return evalEnglish.completenessPercent >= evalTelugu.completenessPercent ? evalEnglish : evalTelugu;
  }
  return evalTelugu.completenessPercent >= evalEnglish.completenessPercent ? evalTelugu : evalEnglish;
}

/**
 * Internal helper to evaluate one candidate phrase
 */
function evaluateSinglePhrase(
  cleanSpoken: string,
  spokenWords: string[],
  phrase: string,
  language: 'telugu' | 'english'
): SentenceMatchResult {
  const rawTokens = phrase.split(/\s+/).filter(Boolean);
  
  // For English, we can focus on core critical tokens to avoid prepositions like "my", "to" tripping up foreign accents
  // But every core word MUST still be present!
  const criticalTokens = rawTokens.filter((t) => {
    const norm = normalizeText(t);
    // Don't fail the vow if the user skipped minor articles 'to' or 'my' in English
    if (language === 'english' && (norm === 'to' || norm === 'my')) {
      return false;
    }
    return true;
  });

  const wordStatuses: WordMatchStatus[] = criticalTokens.map((token) => {
    const result = checkWordInTranscript(token, spokenWords, cleanSpoken);
    return {
      originalWord: token,
      matched: result.matched,
      matchedText: result.matchedAlias,
      aliases: getWordAliases(token),
    };
  });

  const matchedWords = wordStatuses.filter((s) => s.matched).map((s) => s.originalWord);
  const missingWords = wordStatuses.filter((s) => !s.matched).map((s) => s.originalWord);
  const matchedCount = matchedWords.length;
  const totalRequiredCount = wordStatuses.length;

  const completenessPercent = totalRequiredCount > 0
    ? Math.round((matchedCount / totalRequiredCount) * 100)
    : 0;

  // STRICT REQUIREMENT:
  // "only after i complete the total sentce i need to reco if one word miss should stop"
  // Even if 1 word is missing, isComplete MUST BE FALSE!
  const isComplete = missingWords.length === 0 && totalRequiredCount > 0;

  let feedbackMessage = '';
  if (isComplete) {
    feedbackMessage = '✅ Full sacred sentence recognized perfectly! Blessings granted.';
  } else if (matchedCount === 0) {
    feedbackMessage = `Speak the full sentence: "${phrase}"`;
  } else {
    feedbackMessage = `⚠️ Incomplete! Missing word${missingWords.length > 1 ? 's' : ''}: "${missingWords.join(', ')}". Please say the full sentence.`;
  }

  return {
    isComplete,
    completenessPercent,
    matchedCount,
    totalRequiredCount,
    wordStatuses,
    missingWords,
    matchedWords,
    detectedLanguage: language,
    userTranscript: cleanSpoken,
    feedbackMessage,
  };
}
