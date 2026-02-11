// Simple demo “ML” for common MRT service scenarios.
// Keeps intent/summary/tone/response consistent across sign + typing inputs.

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  context: string;
  tags: string[];
  detectedWords: string[];
}

export interface SummarizationResult {
  summary: string;
  tone: "neutral" | "urgent" | "polite" | "confused";
}

/** Canonical intents used across the app */
const INTENTS = {
  HOW_GO_EXIT_A: "HOW GO EXIT A",
  WHERE_LIFT: "WHERE LIFT",
  TRANSFER_LINE: "TRANSFER LINE",
  WHERE_TOILET: "WHERE TOILET",
  TOP_UP: "TOP UP",
  WHERE_STATION: "WHERE STATION",
  NEED_HELP: "NEED HELP",
  YES: "YES",
  NO: "NO",
} as const;

type CanonicalIntent = (typeof INTENTS)[keyof typeof INTENTS];

const TAGS_BY_INTENT: Record<CanonicalIntent, string[]> = {
  [INTENTS.HOW_GO_EXIT_A]: ["navigation", "exit"],
  [INTENTS.WHERE_LIFT]: ["accessibility", "lift"],
  [INTENTS.TRANSFER_LINE]: ["navigation", "transfer"],
  [INTENTS.WHERE_TOILET]: ["amenities", "toilet"],
  [INTENTS.TOP_UP]: ["ticketing", "topup"],
  [INTENTS.WHERE_STATION]: ["navigation", "station"],
  [INTENTS.NEED_HELP]: ["assistance", "urgent"],
  [INTENTS.YES]: ["confirmation"],
  [INTENTS.NO]: ["confirmation"],
};

const WORDS_BY_INTENT: Record<CanonicalIntent, string[]> = {
  [INTENTS.HOW_GO_EXIT_A]: ["HOW", "GO", "EXIT", "A"],
  [INTENTS.WHERE_LIFT]: ["WHERE", "LIFT"],
  [INTENTS.TRANSFER_LINE]: ["TRANSFER", "LINE"],
  [INTENTS.WHERE_TOILET]: ["WHERE", "TOILET"],
  [INTENTS.TOP_UP]: ["TOP", "UP"],
  [INTENTS.WHERE_STATION]: ["WHERE", "STATION"],
  [INTENTS.NEED_HELP]: ["HELP"],
  [INTENTS.YES]: ["YES"],
  [INTENTS.NO]: ["NO"],
};

const SUMMARY_BY_INTENT: Record<CanonicalIntent, string> = {
  [INTENTS.HOW_GO_EXIT_A]: "Asking how to go to Exit A",
  [INTENTS.WHERE_LIFT]: "Asking where the nearest lift is",
  [INTENTS.TRANSFER_LINE]: "Asking where to transfer lines",
  [INTENTS.WHERE_TOILET]: "Asking where the nearest toilet is",
  [INTENTS.TOP_UP]: "Asking how to top up the travel card",
  [INTENTS.WHERE_STATION]: "Asking where the station / platform is",
  [INTENTS.NEED_HELP]: "Needs urgent assistance",
  [INTENTS.YES]: "Confirming / yes",
  [INTENTS.NO]: "Declining / no",
};

const TONE_BY_INTENT: Record<CanonicalIntent, SummarizationResult["tone"]> = {
  [INTENTS.HOW_GO_EXIT_A]: "polite",
  [INTENTS.WHERE_LIFT]: "polite",
  [INTENTS.TRANSFER_LINE]: "neutral",
  [INTENTS.WHERE_TOILET]: "polite",
  [INTENTS.TOP_UP]: "neutral",
  [INTENTS.WHERE_STATION]: "neutral",
  [INTENTS.NEED_HELP]: "urgent",
  [INTENTS.YES]: "neutral",
  [INTENTS.NO]: "neutral",
};

const RESPONSE_BY_INTENT: Record<CanonicalIntent, string> = {
  [INTENTS.HOW_GO_EXIT_A]: "Take the escalator up and turn left.",
  [INTENTS.WHERE_LIFT]: "The nearest lift is beside the control station.",
  [INTENTS.TRANSFER_LINE]: "Follow the signs to the transfer platform; it’s one level down.",
  [INTENTS.WHERE_TOILET]: "The toilet is near Exit B, beside the fare gates.",
  [INTENTS.TOP_UP]: "You can top up at the ticketing machine near the entrance.",
  [INTENTS.WHERE_STATION]: "Go straight and follow the platform signs; it’s on your right.",
  [INTENTS.NEED_HELP]: "I’m here—please stay where you are. I’ll assist you now.",
  [INTENTS.YES]: "Okay, got it.",
  [INTENTS.NO]: "No problem—let’s try again.",
};

/** Demo sign detection: cycles through a short set so judges see variety */
const SIGN_DEMO_SEQUENCE: CanonicalIntent[] = [
  INTENTS.HOW_GO_EXIT_A,
  INTENTS.WHERE_LIFT,
  INTENTS.TRANSFER_LINE,
  INTENTS.WHERE_TOILET,
  INTENTS.TOP_UP,
];
let signDemoIdx = 0;

function normalizeToIntent(input: string): CanonicalIntent | null {
  const s = input.trim().toLowerCase();

  // Exact-ish matches for your preset buttons / common phrases
  if (s === "transfer line" || s.includes("transfer")) return INTENTS.TRANSFER_LINE;
  if (s === "how to go" || s.includes("how") || s.includes("go exit")) return INTENTS.HOW_GO_EXIT_A;
  if (s === "nearest lift" || s.includes("lift")) return INTENTS.WHERE_LIFT;
  if (s.includes("toilet") || s.includes("washroom") || s.includes("bathroom")) return INTENTS.WHERE_TOILET;
  if (s.includes("top up") || s.includes("topup")) return INTENTS.TOP_UP;
  if (s.includes("station") || s.includes("platform") || s.includes("where am i")) return INTENTS.WHERE_STATION;
  if (s.includes("help") || s.includes("emergency") || s.includes("lost")) return INTENTS.NEED_HELP;

  if (s === "yes" || s === "y") return INTENTS.YES;
  if (s === "no" || s === "n") return INTENTS.NO;

  return null;
}

function tokenizeUpper(input: string): string[] {
  return input
    .trim()
    .toUpperCase()
    .split(/[\s,.;:!?]+/)
    .filter(Boolean)
    .slice(0, 6);
}

// Sign language detection (demo)
export function simulateSignLanguageDetection(context: string): IntentDetectionResult {
  const intent = SIGN_DEMO_SEQUENCE[signDemoIdx % SIGN_DEMO_SEQUENCE.length];
  signDemoIdx += 1;

  return {
    intent,
    confidence: 0.92,
    context,
    tags: TAGS_BY_INTENT[intent],
    detectedWords: WORDS_BY_INTENT[intent],
  };
}

// Summarization + tone (demo)
export function simulateSummarization(intent: string, context: string): SummarizationResult {
  const canonical = normalizeToIntent(intent) ?? (intent as CanonicalIntent);

  if ((SUMMARY_BY_INTENT as Record<string, string>)[canonical]) {
    return {
      summary: SUMMARY_BY_INTENT[canonical as CanonicalIntent],
      tone: TONE_BY_INTENT[canonical as CanonicalIntent],
    };
  }

  // Fallback for unknown input
  const trimmed = intent.trim();
  return {
    summary: trimmed.substring(0, 70) + (trimmed.length > 70 ? "…" : ""),
    tone: "confused",
  };
}

// Typing detection (demo)
export function simulateTypingDetection(input: string, context: string): IntentDetectionResult {
  const canonical = normalizeToIntent(input);
  const intent: string = canonical ?? input.trim();

  return {
    intent,
    confidence: canonical ? 0.93 : 0.75,
    context,
    tags: canonical ? TAGS_BY_INTENT[canonical] : ["typed"],
    detectedWords: canonical ? WORDS_BY_INTENT[canonical] : tokenizeUpper(input),
  };
}

// Staff reply (demo)
export function getHardcodedResponse(detectedIntent: string): string {
  const canonical = normalizeToIntent(detectedIntent);

  if (canonical) return RESPONSE_BY_INTENT[canonical];

  // If it already matches a canonical intent string, handle that too
  const direct = (RESPONSE_BY_INTENT as Record<string, string>)[detectedIntent];
  if (direct) return direct;

  return "I’m here to help. Could you repeat that in another way?";
}
