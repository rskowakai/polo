import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calculator,
  Briefcase,
  Clock,
  Coins,
  TrendingUp,
  ShieldCheck,
  FileCheck2,
  Users2,
  Download,
  BookOpen,
  Award,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  baseHours: number;
  role: string;
  ratePlnPerHour: number;
}

const DEFAULT_PHASES: ProjectPhase[] = [
  {
    id: 'arch',
    name: '1. Architektura Systemu i Integracja Danych IoT/OT',
    description:
      'Projekt architektury wysokiej dostępności, konektory protokołów IEC 61850, Modbus TCP, MQTT oraz bezpieczny proxy API.',
    baseHours: 240,
    role: 'Lead Cloud & Systems Architect',
    ratePlnPerHour: 240,
  },
  {
    id: 'twin-sld',
    name: '2. Bliźniak Cyfrowy 3D i Schematy Jednokreskowe SLD',
    description:
      'Implementacja silnika WebGL Three.js, wektorowych schematów synoptycznych stacji GPZ oraz interaktywnej mapy GIS.',
    baseHours: 320,
    role: 'Senior Frontend & Graphics Engineer',
    ratePlnPerHour: 190,
  },
  {
    id: 'ai-apis',
    name: '3. Integracja Otwartych Źródeł API & Algorytmy OZE',
    description:
      'Integracja z danymi PSE, Open-Meteo, GIOŚ, modelowanie miksu KSE, algorytmy bilansowania magazynów BESS i asystent AI.',
    baseHours: 280,
    role: 'Senior Fullstack & Data Scientist',
    ratePlnPerHour: 210,
  },
  {
    id: 'sec-deploy',
    name: '4. Cyberbezpieczeństwo OT (IEC 62443 / NIS2) i Wdrożenie',
    description:
      'Testy penetracyjne, audyt uprawnień SSO/RBAC, wdrożenie kontenerowe Kubernetes i dokumentacja techniczna.',
    baseHours: 180,
    role: 'Cybersecurity & DevOps Specialist',
    ratePlnPerHour: 220,
  },
];

export function CostEstimationAndGuide() {
  const { toast } = useToast();
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0); // 0.8 (MVP) - 1.5 (Enterprise)

  const totalHours = Math.round(
    DEFAULT_PHASES.reduce((acc, p) => acc + p.baseHours * scaleMultiplier, 0)
  );

  const totalCostPln = Math.round(
    DEFAULT_PHASES.reduce((acc, p) => acc + p.baseHours * scaleMultiplier * p.ratePlnPerHour, 0)
  );

  const totalCostEur = Math.round(totalCostPln / 4.3);
  const estimatedSprints = Math.ceil(totalHours / 160); // 160h = 1 inżynier-miesiąc

  const handleExportEstimate = () => {
    toast({
      title: 'Kosztorys wygenerowany',
      description: `Wstępna wycena: ${totalHours} RBH (${totalCostPln.toLocaleString()} PLN) została przygotowana do pobrania.`,
    });
  };

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Kosztorys Inżynierski (RBH) & Poradnik Biznesowy
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Materiały dla Pracodawców i Inwestorów
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Szacunkowy kosztorys w roboczogodzinach, struktura zespołu, modele komercjalizacji
              oraz praktyczny przewodnik prowadzenia biznesu Smart Grid.
            </CardDescription>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportEstimate} className="gap-1.5">
            <Download className="w-4 h-4 text-primary" />
            Eksportuj Kosztorys PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs defaultValue="estimation" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-2 mb-6">
            <TabsTrigger value="estimation" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span>1. Wstępny Kosztorys w Roboczogodzinach (RBH)</span>
            </TabsTrigger>
            <TabsTrigger value="guide" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span>2. Poradnik Prowadzenia Biznesu EnergyTech</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COST ESTIMATION */}
          <TabsContent value="estimation" className="space-y-6">
            {/* SCALE SELECTOR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-muted/40 border">
              <div>
                <div className="font-semibold text-sm">Zakres wdrożenia systemu:</div>
                <div className="text-xs text-muted-foreground">
                  Wybierz wariant, aby przeliczyć zapotrzebowanie na roboczogodziny.
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={scaleMultiplier === 0.75 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScaleMultiplier(0.75)}
                  className="h-8 text-xs"
                >
                  Wariant MVP (75%)
                </Button>
                <Button
                  variant={scaleMultiplier === 1.0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScaleMultiplier(1.0)}
                  className="h-8 text-xs"
                >
                  Wariant Standard (100%)
                </Button>
                <Button
                  variant={scaleMultiplier === 1.4 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScaleMultiplier(1.4)}
                  className="h-8 text-xs"
                >
                  Wariant Enterprise OSD (140%)
                </Button>
              </div>
            </div>

            {/* PHASES BREAKDOWN TABLE */}
            <div className="border rounded-lg overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3">Etap / Moduł Wdrożenia</th>
                    <th className="p-3">Główna Rola w Zespole</th>
                    <th className="p-3 text-right">Roboczogodziny (RBH)</th>
                    <th className="p-3 text-right">Stawka rynkowa</th>
                    <th className="p-3 text-right">Wartość etapu</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {DEFAULT_PHASES.map((p) => {
                    const hours = Math.round(p.baseHours * scaleMultiplier);
                    const cost = hours * p.ratePlnPerHour;
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground text-sm">{p.name}</div>
                          <div className="text-muted-foreground text-[11px] mt-0.5">
                            {p.description}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-primary">{p.role}</td>
                        <td className="p-3 text-right font-bold text-sm">{hours} h</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {p.ratePlnPerHour} PLN/h
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {cost.toLocaleString()} PLN
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SUMMARY KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-primary/5 border-primary/20 space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  Łączny Nakład Pracy
                </div>
                <div className="text-2xl font-black text-primary">{totalHours} RBH</div>
                <div className="text-[11px] text-muted-foreground">
                  Ok. {estimatedSprints} sprintów 2-tygodniowych (zespół 3-4 os.)
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  Szacowany Budżet Projektu
                </div>
                <div className="text-2xl font-black text-foreground">
                  {totalCostPln.toLocaleString()} PLN
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Ok. {totalCostEur.toLocaleString()} EUR netto
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Współczynnik ROI dla OSD / Miast
                </div>
                <div className="text-2xl font-black text-emerald-600">~14-18 m-cy</div>
                <div className="text-[11px] text-muted-foreground">
                  Zwrot z ograniczenia strat sieciowych i kar SAIDI
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: BUSINESS HANDBOOK */}
          <TabsContent value="guide" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION A: BUSINESS MODELS */}
              <div className="p-5 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-base">
                  <TrendingUp className="w-5 h-5" />
                  Modele Monetyzacji & Oferta Handlowa
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      1. Model SaaS B2B dla Operatorów OSD (Energa, PGE, Enea, Tauron):
                    </span>
                    Miesięczna lub roczna subskrypcja za licencję stacyjną (np. 1500 PLN / GPZ /
                    miesiąc) obejmująca monitoring w czasie rzeczywistym, predykcję awarii i
                    aktualizacje.
                  </li>
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      2. Wdrożenia dedykowane On-Premise dla Samorządów:
                    </span>
                    Jednorazowa opłata licencyjna i integracyjna dla Urzędów Miast (Gdańsk, Gdynia,
                    Sopot itd.) do zarządzania klastrem energii i stacjami ładowania.
                  </li>
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      3. Usługi Agregacji DSR & Elastyczności:
                    </span>
                    Prowizja (Success Fee 15-20%) od wolumenu zbilansowanej energii na rynku mocy i
                    w programach DSR prowadzonych przez PSE.
                  </li>
                </ul>
              </div>

              {/* SECTION B: LEGAL & FUNDING */}
              <div className="p-5 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  Wymogi Prawne, Certyfikacja i Finansowanie
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      Normy Bezpieczeństwa OT:
                    </span>
                    Zgodność z normą <b>IEC 62443</b> (Cyberbezpieczeństwo przemysłowych systemów
                    automatyki) oraz wymogami europejskiej dyrektywy <b>NIS 2</b> dla infrastruktury
                    krytycznej.
                  </li>
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      Źródła Finansowania i Dotacje:
                    </span>
                    Fundusze z <b>KPO (Krajowy Plan Odbudowy - transformacja energetyczna)</b>,
                    programy NFOŚiGW "Inteligentne Sieci Energetyczne", oraz europejski program
                    "Horyzont Europa" dla projektów demonstracyjnych.
                  </li>
                  <li className="p-2.5 bg-muted/40 rounded border">
                    <span className="font-bold text-foreground block mb-0.5">
                      Certyfikacja Komunikacyjna:
                    </span>
                    Testy zgodności ze standardem <b>IEC 61850</b> (oprogramowanie zgodne z
                    profilami PSE/DNO) oraz OCPP 2.0.1 dla infrastruktury ładowania pojazdów.
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
