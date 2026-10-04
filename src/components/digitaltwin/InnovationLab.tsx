import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DigitalTwinCanvas } from './DigitalTwinCanvas';
import { generateBaselineDay, runLoadSimulation } from '@/lib/duckdb-analytics';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Database,
  Flame,
  CheckCircle2,
  Sun,
} from 'lucide-react';

interface SimulatedCertificate {
  id: number;
  producer: string;
  mwhAmount: number;
  source: 'SOLAR' | 'WIND';
  meterId: string;
  txHash: string;
  retired: boolean;
  timestamp: string;
}

export const InnovationLab: React.FC = () => {
  // Simulation parameters
  const [extraLoad, setExtraLoad] = useState<number>(2.0); // 2kW load
  const [loadType, setLoadType] = useState<string>('Pompa Ciepła / HVAC');
  const [startHour, setStartHour] = useState<number>(18); // 18:00
  const [duration, setDuration] = useState<number>(3); // 3 hours
  const [batteryAssist, setBatteryAssist] = useState<boolean>(true);

  // Smart Contract EAC Sandbox state
  const [certificates, setCertificates] = useState<SimulatedCertificate[]>([
    {
      id: 1042,
      producer: '0x71C...a49B',
      mwhAmount: 1.0,
      source: 'SOLAR',
      meterId: 'PL-AMI-GD-8921',
      txHash: '0x8f3c...b219 (Base L2)',
      retired: false,
      timestamp: 'Dzisiaj, 11:30',
    },
    {
      id: 1041,
      producer: '0x71C...a49B',
      mwhAmount: 1.0,
      source: 'SOLAR',
      meterId: 'PL-AMI-GD-8921',
      txHash: '0x4d1a...c990 (Base L2)',
      retired: true,
      timestamp: 'Wczoraj, 14:15',
    },
  ]);
  const [isMinting, setIsMinting] = useState<boolean>(false);

  // Baseline 24h day & simulation
  const baseline = useMemo(() => generateBaselineDay(), []);
  const simResult = useMemo(
    () =>
      runLoadSimulation(baseline, {
        addedLoadKw: extraLoad,
        loadLabel: loadType,
        targetStartHour: startHour,
        durationHours: duration,
        batteryAssistEnabled: batteryAssist,
      }),
    [baseline, extraLoad, loadType, startHour, duration, batteryAssist]
  );

  const handleMintEAC = () => {
    setIsMinting(true);
    setTimeout(() => {
      const newCert: SimulatedCertificate = {
        id: certificates.length + 1042,
        producer: '0x71C...a49B',
        mwhAmount: 1.0,
        source: 'SOLAR',
        meterId: 'PL-AMI-GD-8921',
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)} (Base L2)`,
        retired: false,
        timestamp: 'Przed chwilą',
      };
      setCertificates([newCert, ...certificates]);
      setIsMinting(false);
    }, 800);
  };

  const handleRetireEAC = (id: number) => {
    setCertificates(
      certificates.map((c) => (c.id === id ? { ...c, retired: true } : c))
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            POLO 3.0 INNOVATION LAB • 2027-2028 ROADMAP
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Digital Twin 3D & Wirtualny Pre-Dispatch
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Interaktywny model 3D budynku ze standardem Matter 1.4, pre-dispatch symulator w DuckDB-WASM, oraz tokenizacja certyfikatów energii odnawialnej EAC na Base L2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs">
            <Cpu className="w-3.5 h-3.5 mr-1.5" /> WebGPU Compute Ready
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-xs">
            <Database className="w-3.5 h-3.5 mr-1.5" /> In-Memory Vector Engine
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="digital-twin" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-xl mx-auto h-11 bg-muted/60 p-1">
          <TabsTrigger value="digital-twin" className="text-xs md:text-sm font-medium">
            <Layers className="w-4 h-4 mr-2" /> Digital Twin 3D
          </TabsTrigger>
          <TabsTrigger value="eac-blockchain" className="text-xs md:text-sm font-medium">
            <Award className="w-4 h-4 mr-2" /> Certyfikaty EAC (Base L2)
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs md:text-sm font-medium">
            <Activity className="w-4 h-4 mr-2" /> 8 Innowacji Polo 3.0
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DIGITAL TWIN 3D & PRE-DISPATCH */}
        <TabsContent value="digital-twin" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 3D Canvas Column */}
            <div className="lg:col-span-7">
              <DigitalTwinCanvas
                solarKw={6.8}
                demandKw={2.3}
                batterySoc={78}
                isSimulating={true}
                extraLoadKw={extraLoad}
              />
            </div>

            {/* Simulation Controls Column */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Pre-dispatch: Symulacja Obciążenia
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      Matter 1.4 Testbench
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Przetestuj wpływ włączenia odbiornika dużej mocy na profil kosztowy i baterię.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Preset device buttons */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Wybierz odbiornik:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: 'Pompa Ciepła', kw: 2.2 },
                        { name: 'Wallbox EV', kw: 7.4 },
                        { name: 'Klimatyzacja', kw: 1.5 },
                      ].map((dev) => (
                        <Button
                          key={dev.name}
                          type="button"
                          variant={extraLoad === dev.kw ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs font-mono"
                          onClick={() => {
                            setExtraLoad(dev.kw);
                            setLoadType(dev.name);
                          }}
                        >
                          {dev.name} ({dev.kw} kW)
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Load slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Moc obciążenia:</span>
                      <span className="font-mono font-bold text-primary">{extraLoad.toFixed(1)} kW</span>
                    </div>
                    <Slider
                      value={[extraLoad]}
                      min={0.5}
                      max={11.0}
                      step={0.1}
                      onValueChange={(val) => setExtraLoad(val[0])}
                    />
                  </div>

                  {/* Timing controls */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-muted-foreground">Godzina startu:</span>
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(Number(e.target.value))}
                        className="w-full h-9 rounded-md border border-input bg-background px-2.5 font-mono text-xs"
                      >
                        {Array.from({ length: 24 }).map((_, h) => (
                          <option key={h} value={h}>
                            {h.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-muted-foreground">Czas pracy:</span>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full h-9 rounded-md border border-input bg-background px-2.5 font-mono text-xs"
                      >
                        {[1, 2, 3, 4, 6].map((dur) => (
                          <option key={dur} value={dur}>
                            {dur} godz.
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Battery Peak Shaving Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="battery-assist" className="text-xs font-semibold cursor-pointer">
                        Autonomiczne Peak Shaving (ESS)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Bateria automatycznie rozładowuje się, by uciąć szczyt importu z sieci.
                      </p>
                    </div>
                    <Switch
                      id="battery-assist"
                      checked={batteryAssist}
                      onCheckedChange={setBatteryAssist}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Simulation Result KPIs */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Szczyt bazowy</div>
                  <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                    {simResult.peakDemandOriginalKw} kW
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Szczyt w symulacji</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {simResult.peakDemandSimulatedKw} kW
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Dodatkowy koszt</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    +{simResult.deltaCostPln} zł
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: EAC SMART CONTRACTS ON BASE L2 */}
        <TabsContent value="eac-blockchain" className="space-y-6">
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    P-EAC (Energy Attribute Certificate) • ERC-721 na Base L2
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tokenizacja zielonej energii prosumenckiej w standardzie 1 MWh = 1 EAC Token z kryptograficznym podpisem licznika AMI.
                  </CardDescription>
                </div>

                <Button
                  onClick={handleMintEAC}
                  disabled={isMinting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-2"
                >
                  <Award className="w-4 h-4" />
                  {isMinting ? 'Weryfikacja podpisu AMI...' : 'Mint 1.0 MWh EAC'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-6 text-[11px] font-mono uppercase bg-muted/60 text-muted-foreground px-4 py-2.5 border-b border-border/60">
                  <span>Token ID</span>
                  <span>Wolumen</span>
                  <span>Źródło</span>
                  <span>Licznik AMI</span>
                  <span>Transakcja Base L2</span>
                  <span className="text-right">Akcja / Status</span>
                </div>

                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="grid grid-cols-6 items-center px-4 py-3 border-b last:border-0 border-border/40 text-xs font-mono"
                  >
                    <span className="font-bold text-foreground">#{cert.id}</span>
                    <span className="text-emerald-400 font-semibold">{cert.mwhAmount} MWh</span>
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      {cert.source}
                    </span>
                    <span className="text-muted-foreground">{cert.meterId}</span>
                    <span className="text-indigo-400 truncate pr-2">{cert.txHash}</span>
                    <div className="text-right">
                      {cert.retired ? (
                        <Badge variant="outline" className="border-zinc-500 text-zinc-400 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-zinc-400" /> Retired (Spalony)
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleRetireEAC(cert.id)}
                        >
                          Umorz certyfikat
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Proof-of-Green & Anti Double-Counting:</strong> Po umorzeniu (retire) token EAC jest trwale oznaczony w kontrakcie jako zrealizowany offset węglowy. Inteligentny licznik nie może wygenerować podwójnego certyfikatu dla tego samego interwału czasu dzięki hashowaniu `sha256(meterId + timestamp + kWh)`.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: 8 INNOWACJI POLO 3.0 */}
        <TabsContent value="roadmap" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Federated Learning TinyML',
                desc: 'Trening modeli LSTM na mikrokontrolerach ESP32 w licznikach. Agregacja tylko wag (FedAvg), zero kWh w chmurze.',
                badge: 'Prywatność 100%',
                icon: Cpu,
                color: 'text-indigo-400',
              },
              {
                title: 'Digital Twin + Matter 1.4',
                desc: 'Trójwymiarowy model instalacji zintegrowany ze standardem Matter dla urządzeń PV, baterii, pomp i EVSE.',
                badge: 'Matter Cluster',
                icon: Layers,
                color: 'text-cyan-400',
              },
              {
                title: 'WebGPU Compute Shaders',
                desc: 'Symulacje Monte-Carlo i prognozy ARIMA 100,000 scenariuszy w 4ms bezpośrednio w VRAM karty graficznej (WGSL).',
                badge: '100x Szybciej',
                icon: Zap,
                color: 'text-amber-400',
              },
              {
                title: 'CRDT + Automerge P2P',
                desc: 'Lokalna baza i bezkonfliktowa współpraca operatorów offline przez WebRTC DataChannel (jak Google Docs P2P).',
                badge: 'Offline-First',
                icon: Database,
                color: 'text-violet-400',
              },
              {
                title: 'P2P Marketplace & EAC',
                desc: 'Tokenizacja zielonej energii na Base L2. Bezpośrednia sprzedaż nadwyżek sąsiadom z certyfikatem Proof-of-Green.',
                badge: 'Base L2 / Solidity',
                icon: Award,
                color: 'text-emerald-400',
              },
              {
                title: 'Gemini Live Multimodal',
                desc: 'Komunikacja głosowa z dyspozytorem sieci w czasie rzeczywistym oraz Computer Vision do odczytu liczników analogowych.',
                badge: 'Voice + Vision',
                icon: Sparkles,
                color: 'text-pink-400',
              },
              {
                title: 'WASM Rust Plugins',
                desc: 'Możliwość pisania własnych algorytmów taryfowych i arbitrażu w języku Rust, uruchamianych w bezpiecznym sandboxie WASM.',
                badge: 'Wasmtime Sandbox',
                icon: Flame,
                color: 'text-orange-400',
              },
              {
                title: 'Edge AI Orchestrator',
                desc: 'Ultralekki routing zapytań analitycznych na brzegu sieci (Hono + Vercel AI SDK streaming) z automatycznym PII sanitizingiem.',
                badge: 'Sub-50ms TTFT',
                icon: Activity,
                color: 'text-teal-400',
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <Card key={item.title} className="border-border/60 bg-card/70 hover:border-primary/50 transition-all p-5">
                  <div className="flex items-center justify-between mb-3">
                    <IconComp className={`w-5 h-5 ${item.color}`} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
