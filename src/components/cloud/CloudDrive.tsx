import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Cloud,
  HardDrive,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileCheck,
  Download,
  Trash2,
  Sparkles,
  Search,
  Eye,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface StoredFile {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  category: 'Raporty KSE' | 'Pomiary Telemetryczne' | 'Schematy i Modele' | 'Dokumentacja OZE';
  uploadedAt: string;
  summary: string;
  contentSample?: string;
}

const INITIAL_FILES: StoredFile[] = [
  {
    id: 'f-1',
    name: 'Raport_Roczny_Krajowego_Systemu_Elektroenergetycznego_2026.pdf',
    sizeBytes: 1420000,
    type: 'application/pdf',
    category: 'Raporty KSE',
    uploadedAt: '2026-10-02 14:30',
    summary:
      'Oficjalny bilans generacji i zapotrzebowania mocy w KSE. Analiza integracji morskich farm wiatrowych na Bałtyku i magazynów energii.',
    contentSample:
      'Krajowe zapotrzebowanie na moc w 2026 roku osiągnęło poziom szczytowy 27.8 GW. Udział OZE w bilansie wzrósł do 34.2%.',
  },
  {
    id: 'f-2',
    name: 'Pomiary_Telemetria_GPZ_Gdansk_Poludnie_110kV.csv',
    sizeBytes: 428000,
    type: 'text/csv',
    category: 'Pomiary Telemetryczne',
    uploadedAt: '2026-10-03 09:15',
    summary:
      '15-minutowe profile obciążeń transformatora TR1, prąd szyn, napięcia fazowe i wskaźnik THD dla GPZ Gdańsk Południe.',
    contentSample:
      'timestamp,voltage_kv,current_a,p_mw,q_mvar,cos_phi,thd_pct\n2026-10-03 00:00,112.4,284,44.2,8.6,0.98,1.8',
  },
  {
    id: 'f-3',
    name: 'Miks_Wytworczy_Pomorze_Offshore_Q3.xlsx',
    sizeBytes: 865000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'Dokumentacja OZE',
    uploadedAt: '2026-10-03 16:45',
    summary:
      'Kwartalne zestawienie produkcji z farm wiatrowych Potęgowo, Zwartowo PV oraz prognozy dla MFW Bałtyk Środkowy.',
    contentSample:
      'Farma,Typ,Moc_Zainstalowana,Generacja_Q3_MWh\nZwartowo,PV,204 MWp,68400\nPotęgowo,Wiatr,219 MW,142500',
  },
  {
    id: 'f-4',
    name: 'Schemat_Jednokreskowy_SLD_Trojmiasto.json',
    sizeBytes: 124000,
    type: 'application/json',
    category: 'Schematy i Modele',
    uploadedAt: '2026-10-04 08:20',
    summary:
      'Topologiczna struktura węzłów sieciowych 110/15 kV Trójmiasta w formacie wymiany danych IEC 61970 CIM.',
    contentSample:
      '{"gridName": "Trojmiasto-110kV", "nodes": [{"id": "GDA-POL", "type": "GPZ", "voltage": 110}]}',
  },
];

const STORAGE_KEY = 'smartgrid_cloud_drive_files';

export function CloudDrive() {
  const { toast } = useToast();
  const [files, setFiles] = useState<StoredFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse files from localStorage', e);
    }
    return INITIAL_FILES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save cloud files to localStorage', e);
    }
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newFiles: StoredFile[] = Array.from(uploaded).map((file, i) => {
      let category: StoredFile['category'] = 'Pomiary Telemetryczne';
      if (file.name.endsWith('.pdf')) category = 'Raporty KSE';
      else if (file.name.endsWith('.json')) category = 'Schematy i Modele';
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))
        category = 'Dokumentacja OZE';

      return {
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        sizeBytes: file.size,
        type: file.type || 'application/octet-stream',
        category,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        summary: `Plik użytkownika zaimportowany do chmury: ${file.name}. Gotowy do analizy AI.`,
        contentSample: `Podgląd metadanych: Plik "${file.name}" o rozmiarze ${formatFileSize(file.size)}.`,
      };
    });

    setFiles((prev) => [...newFiles, ...prev]);
    toast({
      title: 'Pliki dodane do chmury',
      description: `Pomyślnie zapisano ${newFiles.length} plik(ów) w wirtualnym dysku.`,
    });
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast({
      title: 'Plik usunięty',
      description: 'Plik został trwale usunięty z dysku w chmurze.',
    });
  };

  const handleSendToAI = (file: StoredFile) => {
    const query = `Przeanalizuj plik "${file.name}": ${file.summary}. Treść: ${file.contentSample || ''}`;
    window.dispatchEvent(new CustomEvent('setInitialQuery', { detail: query }));
    toast({
      title: 'Wysłano do Asystenta AI',
      description: `Otwarto czat z załadowanym kontekstem pliku: "${file.name}".`,
    });
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalBytes = files.reduce((s, f) => s + f.sizeBytes, 0);

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Wirtualny Dysk w Chmurze (Smart Grid Cloud Storage)
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Bezpieczne Przechowywanie & Analiza AI
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Repozytorium plików pomiarowych, raportów KSE i schematów sieci z możliwością
              bezpośredniej analizy w asystencie AI.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Zajętość: {formatFileSize(totalBytes)} ({files.length} plików)
            </Badge>
            <label className="cursor-pointer">
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              <Button asChild size="sm" className="gap-1.5 text-xs">
                <span>
                  <Upload className="w-3.5 h-3.5" />
                  Wgraj Plik do Chmury
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Szukaj plików w chmurze..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1 text-[11px] uppercase">Kategoria:</span>
            {[
              'all',
              'Raporty KSE',
              'Pomiary Telemetryczne',
              'Schematy i Modele',
              'Dokumentacja OZE',
            ].map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'Wszystkie' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* FILES TABLE */}
        <div className="border rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="p-3">Nazwa Pliku</th>
                <th className="p-3">Kategoria</th>
                <th className="p-3">Rozmiar</th>
                <th className="p-3">Data wgrania</th>
                <th className="p-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-foreground text-sm flex items-center gap-2">
                      {file.name.endsWith('.pdf') ? (
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      ) : file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="truncate max-w-xs">{file.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{file.summary}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">
                      {file.category}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">
                    {formatFileSize(file.sizeBytes)}
                  </td>
                  <td className="p-3 text-muted-foreground">{file.uploadedAt}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendToAI(file)}
                        className="h-7 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        title="Analizuj w Asystencie AI"
                      >
                        <Sparkles className="w-3 h-3" />
                        Analizuj AI
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPreviewFile(file)}
                        title="Podgląd"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(file.id)}
                        title="Usuń"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PREVIEW MODAL */}
        {previewFile && (
          <div className="p-4 bg-muted/30 border rounded-lg space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                Podgląd pliku: {previewFile.name}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                className="h-6 text-xs"
              >
                Zamknij podgląd
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">{previewFile.summary}</div>
            <pre className="p-3 bg-card border rounded font-mono text-xs overflow-x-auto max-h-40">
              {previewFile.contentSample || 'Brak tekstowego podglądu zawartości pliku binarnego.'}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
