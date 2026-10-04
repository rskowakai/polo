import { z } from 'zod';

/**
 * Strict MIME Types & Extensions Whitelist
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/xml',
  'text/xml',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/quicktime',
] as const;

export const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_TOTAL_UPLOAD_SIZE = 200 * 1024 * 1024; // 200MB

// Dangerous extensions that must never be permitted regardless of claimed MIME
const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.vbs',
  '.js',
  '.mjs',
  '.ts',
  '.html',
  '.htm',
  '.php',
  '.phtml',
  '.py',
  '.rb',
  '.ps1',
  '.scr',
  '.jar',
  '.dll',
  '.so',
  '.com',
  '.msi',
];

/**
 * Enhanced PII Scrubbing patterns (PESEL, IBAN, Cards, Polish/Intl Phones, Emails, Postal Codes)
 */
const PESEL_REGEX = /\b\d{11}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?48[\s-]?)?(?:\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{3}|\b\d{9}\b)/g;
const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const IBAN_REGEX =
  /\b[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}\b|\bPL\d{26}\b/gi;
const POSTAL_CODE_REGEX = /\b\d{2}-\d{3}\b/g;

export interface PIIScrubResult {
  sanitized: string;
  piiDetected: boolean;
  redactedTypes: string[];
}

/**
 * Basic & Robust PII Scrubber
 */
export function scrubPIIWithAudit(text: string): PIIScrubResult {
  if (!text || typeof text !== 'string') {
    return { sanitized: '', piiDetected: false, redactedTypes: [] };
  }

  const typesFound = new Set<string>();
  let result = text;

  if (IBAN_REGEX.test(result)) {
    typesFound.add('IBAN');
    result = result.replace(IBAN_REGEX, '[IBAN_REDACTED]');
  }

  if (CARD_REGEX.test(result)) {
    result = result.replace(CARD_REGEX, (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
        typesFound.add('CREDIT_CARD');
        return '[CARD_REDACTED]';
      }
      return match;
    });
  }

  if (PESEL_REGEX.test(result)) {
    typesFound.add('PESEL');
    result = result.replace(PESEL_REGEX, '[PESEL_REDACTED]');
  }

  if (EMAIL_REGEX.test(result)) {
    typesFound.add('EMAIL');
    result = result.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');
  }

  if (PHONE_REGEX.test(result)) {
    result = result.replace(PHONE_REGEX, (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length === 9 || (digitsOnly.length === 11 && digitsOnly.startsWith('48'))) {
        typesFound.add('PHONE');
        return '[PHONE_REDACTED]';
      }
      return match;
    });
  }

  if (POSTAL_CODE_REGEX.test(result)) {
    typesFound.add('POSTAL_CODE');
    result = result.replace(POSTAL_CODE_REGEX, '[KOD_REDACTED]');
  }

  return {
    sanitized: result,
    piiDetected: typesFound.size > 0,
    redactedTypes: Array.from(typesFound),
  };
}

export function scrubPII(text: string): string {
  return scrubPIIWithAudit(text).sanitized;
}

/**
 * 1. ZOD SCHEMA: File Metadata Validation
 */
export const FileMetadataSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nazwa pliku nie może być pusta')
      .max(255, 'Nazwa pliku jest zbyt długa (maks. 255 znaków)')
      .refine((name) => !name.includes('\0'), 'Nazwa pliku zawiera niedozwolone znaki')
      .refine(
        (name) => !name.includes('..') && !name.includes('/') && !name.includes('\\'),
        'Niedozwolona próba path traversal w nazwie pliku'
      )
      .refine((name) => {
        const lower = name.toLowerCase();
        return !FORBIDDEN_EXTENSIONS.some((ext) => lower.endsWith(ext));
      }, 'Plik ma niedozwolone rozszerzenie wykonywalne'),
    size: z
      .number()
      .positive('Rozmiar pliku musi być większy niż 0')
      .max(MAX_FILE_SIZE, `Plik przekracza dopuszczalny limit ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
    type: z
      .string()
      .min(1, 'Brak typu MIME')
      .refine((type) => {
        // Allow exact match or wildcard match for images/audio/video
        const isAllowed = ALLOWED_MIME_TYPES.some((allowed) => {
          if (allowed === type) return true;
          if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) {
            return true;
          }
          return false;
        });
        return isAllowed;
      }, 'Niedozwolony typ MIME pliku'),
    lastModified: z.number().optional(),
  })
  .refine(
    (data) => {
      // Cross-verify extension with MIME type
      const lowerName = data.name.toLowerCase();
      const allowedExts = MIME_EXTENSION_MAP[data.type];
      if (!allowedExts) {
        if (data.type.startsWith('image/')) {
          return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].some((ext) =>
            lowerName.endsWith(ext)
          );
        }
        if (data.type.startsWith('audio/')) {
          return ['.mp3', '.wav', '.ogg', '.m4a'].some((ext) => lowerName.endsWith(ext));
        }
        if (data.type.startsWith('video/')) {
          return ['.mp4', '.mov', '.webm', '.avi'].some((ext) => lowerName.endsWith(ext));
        }
        return true;
      }
      return allowedExts.some((ext) => lowerName.endsWith(ext));
    },
    {
      message: 'Niezgodność rozszerzenia pliku z jego zadeklarowanym typem MIME',
      path: ['name'],
    }
  );

export type ValidatedFileMetadata = z.infer<typeof FileMetadataSchema>;

/**
 * Validates a browser File instance with Zod
 */
export function validateFileWithZod(
  file: File
): { success: true; data: ValidatedFileMetadata } | { success: false; error: string } {
  const result = FileMetadataSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
  });

  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => e.message).join('. ');
    return { success: false, error: errorMsg };
  }

  return { success: true, data: result.data };
}

/**
 * 2. ZOD SCHEMA: User Chat / Query Input with Auto PII Scrubbing
 */
export const ChatInputSchema = z.object({
  prompt: z
    .string({ required_error: 'Pole prompt jest wymagane' })
    .trim()
    .min(1, 'Zapytanie nie może być puste')
    .max(4000, 'Zapytanie przekracza limit 4000 znaków')
    .transform((val) => scrubPII(val)),
  context: z
    .string()
    .max(150000, 'Kontekst przekracza dopuszczalny limit 150k znaków')
    .optional()
    .transform((val) => (val ? scrubPII(val) : '')),
});

export type ValidatedChatInput = z.infer<typeof ChatInputSchema>;

/**
 * 3. ZOD SCHEMA: Extracted Document Content with Auto PII Scrubbing
 */
export const ExtractedTextSchema = z
  .object({
    rawText: z
      .string()
      .min(1, 'Wyodrębniony tekst jest pusty')
      .max(1000000, 'Dokument przekracza maksymalny rozmiar tekstu (1M znaków)'),
    fileName: z.string().max(255).optional(),
  })
  .transform((data) => {
    const audit = scrubPIIWithAudit(data.rawText);
    return {
      fileName: data.fileName,
      cleanText: audit.sanitized,
      piiDetected: audit.piiDetected,
      redactedTypes: audit.redactedTypes,
    };
  });

/**
 * 4. ZOD SCHEMA: Pre-dispatch Simulation Scenario
 */
export const SimulationScenarioSchema = z.object({
  addedLoadKw: z
    .number()
    .min(0.1, 'Minimalne obciążenie to 0.1 kW')
    .max(50, 'Maksymalne obciążenie to 50 kW'),
  loadLabel: z.string().min(1).max(100).default('Urządzenie testowe'),
  targetStartHour: z.number().int().min(0).max(23),
  durationHours: z.number().int().min(1).max(24),
  batteryAssistEnabled: z.boolean().default(true),
});
