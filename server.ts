import { GoogleGenAI, GenerateVideosOperation, LiveServerMessage, Modality } from '@google/genai';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { ChatInputSchema, ExtractedTextSchema } from './src/lib/validation';
import { scrubPII } from './src/utils/guardrails';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

function getAI(): GoogleGenAI {
  if (!ai) {
    const currentKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY || '';
    if (currentKey) {
      ai = new GoogleGenAI({
        apiKey: currentKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  if (!ai) {
    throw new Error('Klucz API Gemini (GEMINI_API_KEY) nie został skonfigurowany.');
  }
  return ai;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(ai || process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. MULTI-TURN GEMINI CHATBOT
// Supports gemini-3.1-pro-preview (complex), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { messages, prompt, systemInstruction, model } = req.body;

    const selectedModel = model || 'gemini-3.5-flash';
    const activeSystemInstruction =
      systemInstruction ||
      'Jesteś zaawansowanym inżynierem energetyki i asystentem Smart Grid dla regionu Pomorza. Odpowiadaj profesjonalnie, precyzyjnie i zwięźle po polsku.';

    // Format chat history if provided
    let contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    } else if (prompt) {
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    } else {
      return res.status(400).json({ error: 'Brak treści wiadomości (prompt lub messages).' });
    }

    const response = await client.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: activeSystemInstruction,
      },
    });

    const reply = response.text || '';
    return res.json({ reply, modelUsed: selectedModel });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error.message || 'Błąd generowania odpowiedzi czatu.',
      reply: 'Wystąpił błąd podczas komunikacji z modelem AI.',
    });
  }
});

// 2. SEARCH GROUNDING (gemini-3.5-flash with googleSearch)
app.post('/api/search-grounding', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Wymagane pole prompt.' });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'Jesteś asystentem badawczym Smart Grid. Używaj danych z Google Search do podawania najświeższych, rzetelnych informacji energetycznych i technologicznych.',
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter(Boolean);

    return res.json({
      reply: text,
      sources: webSources,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    return res.status(500).json({ error: error.message || 'Błąd Google Search Grounding.' });
  }
});

// 3. MAPS GROUNDING (gemini-3.5-flash with googleMaps)
app.post('/api/maps-grounding', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { prompt, latitude, longitude } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Wymagane pole prompt.' });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude && longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        },
      };
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapPlaces = groundingChunks
      .map((chunk: any) => chunk.maps)
      .filter(Boolean);

    return res.json({
      reply: text,
      places: mapPlaces,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    return res.status(500).json({ error: error.message || 'Błąd Google Maps Grounding.' });
  }
});

// 4. CREATE & EDIT IMAGES (gemini-3.1-flash-image-preview / gemini-3.1-flash-image)
app.post('/api/image-edit', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { prompt, imageBase64, mimeType } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Wymagany prompt do wygenerowania lub edycji obrazu.' });
    }

    let contents: any;
    if (imageBase64) {
      // Editing existing image
      contents = {
        parts: [
          {
            inlineData: {
              data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
              mimeType: mimeType || 'image/png',
            },
          },
          { text: prompt },
        ],
      };
    } else {
      // Text to image
      contents = prompt;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents,
    });

    let generatedImageUrl = '';
    let responseText = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        responseText += part.text;
      }
    }

    return res.json({
      imageUrl: generatedImageUrl,
      description: responseText,
      modelUsed: 'gemini-3.1-flash-image-preview',
    });
  } catch (error: any) {
    console.error('Image generation/edit error:', error);
    return res.status(500).json({ error: error.message || 'Błąd generowania obrazu.' });
  }
});

// 5. ANIMATE IMAGE INTO VIDEO & TEXT-TO-VIDEO (veo-3.1-fast-generate-preview)
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { prompt, imageBase64, mimeType, aspectRatio } = req.body;

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const videoPrompt = prompt || 'Cinematic smart grid futuristic infrastructure in high resolution';

    let videoPayload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: validAspectRatio,
      },
    };

    if (imageBase64) {
      videoPayload.image = {
        imageBytes: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: mimeType || 'image/png',
      };
    }

    const operation = await client.models.generateVideos(videoPayload);
    return res.json({
      operationName: operation.name,
      aspectRatio: validAspectRatio,
      modelUsed: 'veo-3.1-fast-generate-preview',
    });
  } catch (error: any) {
    console.error('Video generation start error:', error);
    return res.status(500).json({ error: error.message || 'Błąd uruchamiania generowania wideo Veo.' });
  }
});

app.post('/api/video-status', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'Wymagane pole operationName.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await client.operations.getVideosOperation({ operation: op });
    return res.json({ done: Boolean(updated.done) });
  } catch (error: any) {
    console.error('Video status error:', error);
    return res.status(500).json({ error: error.message || 'Błąd sprawdzania statusu wideo.' });
  }
});

app.post('/api/video-download', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'Wymagane pole operationName.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await client.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Nie znaleziono wideo lub generowanie w toku.' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey || '' },
    });
    res.setHeader('Content-Type', 'video/mp4');
    videoRes.body!.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
      })
    );
  } catch (error: any) {
    console.error('Video download error:', error);
    return res.status(500).json({ error: error.message || 'Błąd pobierania wideo.' });
  }
});

// 6. AUDIO TRANSCRIPTION (gemini-3.5-transcribe)
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Wymagane pole audioBase64.' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const response = await client.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Dokonaj wiernej i dokładnej transkrypcji tego nagrania audio na tekst po polsku. Zwróć tylko rozpoznany tekst.',
          },
        ],
      },
    });

    const transcript = response.text || '';
    return res.json({ transcript, modelUsed: 'gemini-3.5-transcribe' });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({ error: error.message || 'Błąd transkrypcji dźwięku.' });
  }
});

// 7. INTELLIGENT DOCUMENT SCANNER & OCR (gemini-3.5-flash)
app.post('/api/scan-document', async (req: Request, res: Response) => {
  try {
    const client = getAI();
    const { imageBase64, mimeType, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Wymagany obraz lub plik do zeskanowania.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:(image|application)\/[a-z0-9\-]+;base64,/, '');

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: `Jesteś ekspertem systemów technicznych i dokumentacji Smart Grid. Przeanalizuj ten dokument (${fileName || 'dokument'}).
1. Wyodrębnij cały odczytany tekst (OCR).
2. Sklasyfikuj dokument do jednej z kategorii: "Schemat techniczny GPZ / SLD", "Faktura za energię / Taryfa", "Raport generacji OZE", "Audyt infrastruktury EV", "Specyfikacja aparatury SCADA", "Inne".
3. Sporządź zwięzłe podsumowanie wykonawcze (3-5 zdań kluczowych faktów i liczb).
4. Wypisz kluczowe parametry techniczne w punktach (np. moce, napięcia, stawki, daty).

Sformatuj odpowiedź czytelnie z nagłówkami Markdown.`,
          },
        ],
      },
    });

    const analysis = response.text || '';
    return res.json({
      analysis,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (error: any) {
    console.error('Document scan error:', error);
    return res.status(500).json({ error: error.message || 'Błąd skanera dokumentów.' });
  }
});

// Vite mounting & HTTP Server creation
const server = http.createServer(app);

// 8. WEBSOCKET FOR VOICE CONVERSATIONS (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini Live voice stream');
  let liveSession: any = null;

  try {
    const client = getAI();
    liveSession = await client.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'Jesteś dynamicznym, mówionym asystentem inżynierskim sieci elektroenergetycznej Smart Grid. Odpowiadaj krótko, naturalnie i konwersacyjnie po polsku.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('Error forwarding audio to Live session:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Voice client disconnected');
      if (liveSession && typeof liveSession.close === 'function') {
        liveSession.close();
      }
    });
  } catch (err) {
    console.error('Gemini Live session error:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Nie udało się połączyć z modelem gemini-3.8-live.' }));
      clientWs.close();
    }
  }
});

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

  server.listen(PORT, HOST, () => {
    console.log(
      `Full-stack server running at http://${HOST}:${PORT} in ${isDev ? 'development' : 'production'} mode`
    );
  });
}

startServer();
