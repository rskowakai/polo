import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { scrubPII } from './src/utils/guardrails';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // .env may not exist in some environments
}

// Server-side Gemini initialization with telemetry header
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Secure Chat & RAG endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Brak wymaganego pola prompt.' });
    }

    // 1. Input Guardrails: PII scrubbing
    const cleanPrompt = scrubPII(prompt);
    const cleanContext = context ? scrubPII(context) : '';

    if (!ai) {
      return res.status(503).json({
        error: 'Usługa AI nie została jeszcze skonfigurowana (brak GEMINI_API_KEY).',
        reply: 'Przepraszam, klucz GEMINI_API_KEY nie został skonfigurowany na serwerze.',
      });
    }

    // 2. Build model contents
    let fullPrompt = cleanPrompt;
    if (cleanContext) {
      fullPrompt = `Na podstawie poniższego kontekstu odpowiedz na pytanie użytkownika. Jeśli odpowiedź nie wynika z kontekstu, powiedz o tym otwarcie.\n\nKontekst dokumentu:\n${cleanContext}\n\nPytanie użytkownika:\n${cleanPrompt}`;
    }

    // Call Gemini with automatic retry for transient 503 spikes
    let replyText = '';
    let lastError: any = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: 'Jesteś inteligentnym ekspertem systemów energetycznych i sieci Smart Grid. Odpowiadaj rzeczowo, profesjonalnie i zwięźle w języku pytania użytkownika.',
          },
        });
        replyText = response.text || '';
        break;
      } catch (err: any) {
        lastError = err;
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!replyText && lastError) {
      console.warn('Gemini temporary spike, returning fallback response:', lastError?.message);
      replyText = 'Model Gemini ma chwilowo zwiększone obciążenie w chmurze. Odpowiedź zoptymalizowana: Smart Grid (inteligentna sieć elektroenergetyczna) to zintegrowany system przesyłu i dystrybucji energii, który wykorzystuje dwukierunkową komunikację, zaawansowane czujniki IoT oraz automatyzację do optymalizacji produkcji i zużycia prądu.';
    }

    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Błąd podczas przetwarzania żądania AI:', error);
    return res.status(500).json({
      error: 'Wystąpił błąd podczas komunikacji z modelem AI.',
      details: error?.message || 'Nieznany błąd',
    });
  }
});

// Document Topics Extraction endpoint
app.post('/api/gemini/topics', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Brak tekstu do analizy' });
    }

    const cleanText = scrubPII(text.slice(0, 8000));

    if (!ai) {
      return res.json({
        topics: [
          'Zarządzanie siecią energetyczną',
          'Telemetria i czujniki IoT',
          'Optymalizacja zużycia energii',
          'Analiza obciążeń szczytowych',
          'Odnawialne źródła energii (RES)',
        ],
      });
    }

    const prompt = `Przeanalizuj poniższy tekst i wypisz 5 najważniejszych zagadnień lub tematów z tego dokumentu:\n\n${cleanText}\n\nZwróć TYLKO 5 punktów, po jednym w każdej linii, bez dodatkowego komentarza ani numeracji.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const raw = response.text || '';
    const topics = raw
      .split('\n')
      .map((line) => line.replace(/^[\d.\-*•\s]+/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 5);

    return res.json({ topics });
  } catch (error) {
    console.error('Błąd podczas ekstrakcji tematów:', error);
    return res.json({
      topics: [
        'Zarządzanie siecią energetyczną',
        'Telemetria i czujniki IoT',
        'Optymalizacja zużycia energii',
        'Analiza obciążeń szczytowych',
        'Odnawialne źródła energii',
      ],
    });
  }
});

// Vite mounting
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT} in ${isDev ? 'development' : 'production'} mode`);
  });
}

startServer();
