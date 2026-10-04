import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getGeminiResponse } from '@/lib/gemini';
import { calculateTFIDF } from './searchUtils';
import { scrubPII } from './guardrails';

let documentChunks: { text: string; metadata?: Record<string, any> }[] = [];

export const generateRAGResponse = async (query: string): Promise<string> => {
  console.log('Generuję odpowiedź dla zapytania:', query);

  if (documentChunks.length === 0) {
    console.log('Brak dokumentów w pamięci');
    return "Nie wgrano jeszcze żadnego dokumentu. Proszę najpierw wgrać dokument, aby móc zadawać pytania.";
  }

  const relevantChunks = searchRelevantChunks(query);
  
  if (relevantChunks.length === 0) {
    console.log('Nie znaleziono pasujących fragmentów');
    return "Nie znalazłem odpowiednich informacji w wgranym dokumencie, które pomogłyby odpowiedzieć na to pytanie.";
  }

  const context = relevantChunks.join('\n\n');
  const prompt = `Na podstawie poniższego kontekstu, ${query === 'podsumuj' ? 'przedstaw krótkie podsumowanie głównych punktów dokumentu' : 'odpowiedz na pytanie'}. Jeśli odpowiedź nie znajduje się w kontekście, powiedz o tym.

Kontekst:
${context}

${query === 'podsumuj' ? 'Podsumuj najważniejsze informacje z dokumentu.' : `Pytanie: ${query}`}`;

  console.log('Wysyłam zapytanie do serwera Gemini z kontekstem długości:', context.length);
  return getGeminiResponse(prompt, context);
};

export const searchRelevantChunks = (query: string): string[] => {
  console.log('Szukam fragmentów dla zapytania:', query);
  
  if (documentChunks.length === 0) {
    console.log("Brak przetworzonych dokumentów w pamięci");
    return [];
  }

  if (query.toLowerCase() === 'podsumuj') {
    console.log('Zapytanie o podsumowanie - zwracam wszystkie fragmenty');
    return documentChunks.map(chunk => chunk.text);
  }

  const results = calculateTFIDF(
    query,
    documentChunks.map(chunk => chunk.text)
  );

  // Return top 3 most relevant chunks
  return results.slice(0, 3).map(result => result.text);
};

async function extractMainTopics(text: string): Promise<string[]> {
  try {
    const cleanText = scrubPII(text);
    const response = await fetch('/api/gemini/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: cleanText }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        return data.topics;
      }
    }

    return [
      "Zarządzanie siecią energetyczną",
      "Telemetria i sensoryka IoT",
      "Optymalizacja zużycia energii",
      "Analiza obciążeń szczytowych",
      "Odnawialne źródła energii (RES)"
    ];
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [
      "Zarządzanie siecią energetyczną",
      "Telemetria i sensoryka IoT",
      "Optymalizacja zużycia energii",
      "Analiza obciążeń szczytowych",
      "Odnawialne źródła energii (RES)"
    ];
  }
}

export const processDocumentForRAG = async (text: string) => {
  try {
    console.log('Rozpoczynam przetwarzanie dokumentu dla RAG, długość tekstu:', text.length);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([text]);
    documentChunks = chunks.map(chunk => ({
      text: chunk.pageContent,
      metadata: chunk.metadata,
    }));

    console.log(`Dokument przetworzony na ${documentChunks.length} fragmentów`);

    // Wywołaj funkcję do ekstrakcji tematów przez backend
    const mainTopics = await extractMainTopics(text);

    return {
      message: `Dokument został przetworzony na ${documentChunks.length} fragmentów`,
      chunks: documentChunks,
      topics: mainTopics
    };
  } catch (error) {
    console.error("Błąd podczas przetwarzania dokumentu:", error);
    throw new Error("Wystąpił błąd podczas przetwarzania dokumentu");
  }
};
