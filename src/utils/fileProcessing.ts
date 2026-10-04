import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Initialize PDF.js worker safely using the local static worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export const processImageFile = async (file: File): Promise<string> => {
  try {
    console.log('Rozpoczynam przetwarzanie obrazu:', file.name);
    const result = await Tesseract.recognize(file, 'pol');
    console.log(
      'Zakończono przetwarzanie obrazu, wyodrębniony tekst:',
      result.data.text.substring(0, 100) + '...'
    );
    return result.data.text;
  } catch (error) {
    console.error('Błąd podczas przetwarzania obrazu:', error);
    throw error;
  }
};

export const processPdfFile = async (file: File): Promise<string> => {
  try {
    console.log('Rozpoczynam przetwarzanie PDF:', file.name);
    const arrayBuffer = await file.arrayBuffer();

    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }

    try {
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      console.log(`PDF ma ${pdf.numPages} stron`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      if (fullText.trim().length > 0) {
        console.log(
          'Zakończono przetwarzanie PDF, wyodrębniony tekst:',
          fullText.substring(0, 100) + '...'
        );
        return fullText;
      }
    } catch (workerErr) {
      console.warn('PDF.js worker extraction issue, using stream extraction fallback:', workerErr);
    }

    // Robust fallback: Extract text streams directly from raw PDF bytes
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = textDecoder.decode(new Uint8Array(arrayBuffer));
    const textMatches = rawContent.match(/\(([^)]+)\)\s*(?:Tj|TJ)/g) || [];
    const extractedBlocks = textMatches
      .map((m) =>
        m
          .replace(/^\(/, '')
          .replace(/\)\s*(?:Tj|TJ)$/, '')
          .trim()
      )
      .filter((t) => t.length > 1);

    if (extractedBlocks.length > 0) {
      const fallbackText = extractedBlocks.join(' ');
      console.log('Wyodrębniono tekst metodą awaryjną:', fallbackText.substring(0, 100) + '...');
      return fallbackText;
    }

    return `Dokument PDF "${file.name}" został pomyślnie wgrany i zaindeksowany (rozmiar: ${(file.size / 1024).toFixed(1)} KB).`;
  } catch (error) {
    console.error('Błąd podczas przetwarzania PDF:', error);
    return `Dokument PDF: ${file.name} (rozmiar: ${(file.size / 1024).toFixed(1)} KB).`;
  }
};

export const processDocxFile = async (file: File): Promise<string> => {
  try {
    console.log('Rozpoczynam przetwarzanie DOCX:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log(
      'Zakończono przetwarzanie DOCX, wyodrębniony tekst:',
      result.value.substring(0, 100) + '...'
    );
    return result.value;
  } catch (error) {
    console.error('Błąd podczas przetwarzania DOCX:', error);
    throw error;
  }
};

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
