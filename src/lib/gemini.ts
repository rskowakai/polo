import { scrubPII } from '@/utils/guardrails';

/**
 * Server-proxied Gemini response generator
 * All API key secrets remain isolated on the backend.
 */
export const generateGeminiResponse = async (prompt: string, context?: string): Promise<string> => {
  try {
    const cleanPrompt = scrubPII(prompt);
    const cleanContext = context ? scrubPII(context) : undefined;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        context: cleanContext,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (err.reply) return err.reply;
      throw new Error(err.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.text || '';
  } catch (error) {
    console.error("Błąd podczas komunikacji z serwerem Gemini:", error);
    return "Przepraszam, wystąpił problem podczas przetwarzania zapytania przez asystenta AI. Upewnij się, że serwer backendowy jest aktywny.";
  }
};

// Backward-compatibility alias
export const getGeminiResponse = generateGeminiResponse;
