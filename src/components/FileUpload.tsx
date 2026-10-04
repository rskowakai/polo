import { AnimatePresence, motion } from 'framer-motion';
import { FileText, HelpCircle, Image as ImageIcon, ShieldCheck, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ExtractedTextSchema, MAX_TOTAL_UPLOAD_SIZE, validateFileWithZod } from '@/lib/validation';
import { processDocxFile, processImageFile, processPdfFile } from '@/utils/fileProcessing';
import { processDocumentForRAG } from '@/utils/ragUtils';
import { Button } from './ui/button';
import { FileInfo } from './upload/FileInfo';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  preview?: string;
  speed?: string;
  error?: string;
}

const ALLOWED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/xml': ['.xml'],
  'audio/*': ['.mp3', '.wav'],
  'video/*': ['.mp4', '.mov'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB

export function FileUpload() {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const calculateSpeed = (bytesUploaded: number, startTime: number) => {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const bytesPerSecond = bytesUploaded / elapsedSeconds;
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const validateFile = (file: File) => {
    // 1. Zod Schema Validation (MIME type, size, extension consistency, path safety)
    const zodValidation = validateFileWithZod(file);
    if (!zodValidation.success) {
      return zodValidation.error;
    }

    // 2. Check total batch size
    const currentTotalSize = uploadingFiles.reduce((acc, f) => acc + f.file.size, 0);
    if (currentTotalSize + file.size > MAX_TOTAL_UPLOAD_SIZE) {
      return `Przekroczono łączny limit rozmiaru plików (${formatFileSize(MAX_TOTAL_UPLOAD_SIZE)})`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const startTime = Date.now();
    let preview;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        variant: 'destructive',
        title: 'Błąd walidacji',
        description: validationError,
      });
      return;
    }

    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    const newFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
      preview,
    };

    setUploadingFiles((prev) => [...prev, newFile]);

    try {
      let text = '';
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) => {
            if (f.file === file && f.progress < 100) {
              const newProgress = Math.min(f.progress + 10, 100);
              return {
                ...f,
                progress: newProgress,
                speed: calculateSpeed((newProgress / 100) * file.size, startTime),
              };
            }
            return f;
          })
        );
      }, 200);

      if (file.type.startsWith('image/')) {
        text = await processImageFile(file);
      } else if (file.type === 'application/pdf') {
        text = await processPdfFile(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        text = await processDocxFile(file);
      } else {
        throw new Error('Nieobsługiwany format pliku');
      }

      // Zod Content Validation & PII Scrubbing
      const sanitizedDoc = ExtractedTextSchema.parse({
        rawText: text,
        fileName: file.name,
      });

      if (sanitizedDoc.piiDetected) {
        toast({
          title: 'Ochrona prywatności (PII Scrubbing)',
          description: `Zanonimizowano dane (${sanitizedDoc.redactedTypes.join(', ')}) przed analizą AI.`,
        });
      }

      const result = await processDocumentForRAG(sanitizedDoc.cleanText);

      if (result) {
        setTopics(result.topics);
      }

      clearInterval(progressInterval);

      setUploadingFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, progress: 100, status: 'completed' } : f))
      );

      toast({
        title: 'Sukces',
        description: `Przetworzono plik: ${file.name}`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Nieznany błąd',
              }
            : f
        )
      );
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: `Błąd podczas przetwarzania pliku: ${file.name}`,
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: MAX_FILE_SIZE,
    accept: ALLOWED_FILE_TYPES,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleCancelUpload = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
    toast({
      description: `Anulowano wgrywanie pliku: ${file.name}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Wgraj pliki</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Obsługiwane formaty: PDF, DOCX, TXT, CSV, XML, obrazy, audio, wideo</p>
              <p>Maksymalny rozmiar: {formatFileSize(MAX_FILE_SIZE)} na plik</p>
              <p>Łączny limit: {formatFileSize(MAX_TOTAL_SIZE)}</p>
              <p>Limit plików: 5</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card
        {...getRootProps()}
        className={`p-6 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <AnimatePresence>
            {isDragActive ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center gap-2"
              >
                <Upload className="h-12 w-12 text-primary" />
                <p className="text-sm text-primary">Upuść pliki tutaj...</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="text-sm text-gray-600">
                  Przeciągnij i upuść pliki lub kliknij, aby wybrać
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Obsługiwane formaty: PDF, DOCX, TXT, CSV, XML, obrazy, audio, wideo (max{' '}
                  {formatFileSize(MAX_FILE_SIZE)} na plik)
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {uploadingFiles.map((uploadingFile) => (
              <Card key={uploadingFile.file.name} className="p-4">
                <div className="flex items-start gap-4">
                  {uploadingFile.preview ? (
                    <img
                      src={uploadingFile.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCancelUpload(uploadingFile.file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                    <div className="mt-2">
                      <Progress value={uploadingFile.progress} className="h-2" />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{uploadingFile.progress}%</span>
                      {uploadingFile.speed && uploadingFile.status === 'uploading' && (
                        <span>{uploadingFile.speed}</span>
                      )}
                    </div>
                    {uploadingFile.error && (
                      <p className="mt-1 text-xs text-destructive">{uploadingFile.error}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {uploadingFiles.length > 0 && uploadingFiles.some((f) => f.status === 'completed') && (
        <>
          {uploadingFiles
            .filter((f) => f.status === 'completed')
            .map((completedFile) => (
              <FileInfo key={completedFile.file.name} file={completedFile.file} topics={topics} />
            ))}
        </>
      )}
    </div>
  );
}
