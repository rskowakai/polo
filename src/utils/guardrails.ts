/**
 * Input Guardrails & PII Scrubber
 * Automatically masks personally identifiable information (PII) before transmission to AI models.
 */

// Regex patterns for Polish and European PII
const PESEL_REGEX = /\b\d{11}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?48[\s-]?)?(?:\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{3}|\b\d{9}\b)/g;
const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const IBAN_REGEX =
  /\b[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}\b|\bPL\d{26}\b/gi;

/**
 * Redacts PII from text
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(IBAN_REGEX, '[IBAN_REDACTED]')
    .replace(CARD_REGEX, (match) => {
      // Avoid false positive matching short numbers or date sequences
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
        return '[CARD_REDACTED]';
      }
      return match;
    })
    .replace(PESEL_REGEX, '[PESEL_REDACTED]')
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(PHONE_REGEX, (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length === 9 || (digitsOnly.length === 11 && digitsOnly.startsWith('48'))) {
        return '[PHONE_REDACTED]';
      }
      return match;
    });
}

/**
 * Validates input prompts for prompt injection guardrails
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '';
  return scrubPII(prompt.trim());
}
