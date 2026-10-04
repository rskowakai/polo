import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CircuitBoard,
  Activity,
  Layers,
  Zap,
  Download,
  RefreshCw,
  Sun,
  Wind,
  Battery,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ALL_MEASUREMENT_STATIONS,
  CITY_GRID_PROFILES,
  TRANSMISSION_LINES,
  MeasurementStation,
  CityGridProfile,
} from '@/data/networkStations';
import {
  fetchCityOpenMeteoTelemetry,
  getLiveKSEGeneration,
  KSELiveGeneration,
  OpenMeteoTelemetry,
} from '@/services/openGridService';

export function NetworkDiagrams() {
  const [selectedStationId, setSelectedStationId] = useState<string>('gpz-gda-poludnie');
  const [selectedCityId, setSelectedCityId] = useState<string>('gdansk');
  const [breakerStates, setBreakerStates] = useState<Record<string, boolean>>({
    'Q0-W1': true,
    'Q0-W2': true,
    'Q0-TR1': true,
    'Q0-TR2': true,
    'Q0-SN-SEK': true,
    'Q0-F1': true,
    'Q0-F2': true,
    'Q0-F3': true,
    'Q0-F4': true,
    'Q0-BESS': true,
    'Q0-KOMP': true,
  });

  const [liveKSE, setLiveKSE] = useState<KSELiveGeneration>(getLiveKSEGeneration());
  const [weatherTelemetry, setWeatherTelemetry] = useState<OpenMeteoTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  const selectedStation =
    ALL_MEASUREMENT_STATIONS.find((s) => s.id === selectedStationId) || ALL_MEASUREMENT_STATIONS[0];
  const selectedCity =
    CITY_GRID_PROFILES.find((c) => c.id === selectedCityId) || CITY_GRID_PROFILES[0];

  useEffect(() => {
    async function loadTelemetry() {
      setIsLoadingTelemetry(true);
      const data = await fetchCityOpenMeteoTelemetry(
        selectedCity.position[0],
        selectedCity.position[1]
      );
      if (data) {
        setWeatherTelemetry(data);
        setLiveKSE(getLiveKSEGeneration(data.solarRadiation, data.windSpeed10m));
      }
      setIsLoadingTelemetry(false);
    }
    loadTelemetry();
  }, [selectedCityId]);

  const toggleBreaker = (id: string) => {
    setBreakerStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Generation Mix pie data
  const generationData = [
    { name: 'Węgiel kamienny', value: liveKSE.generationBySource.hardCoalMw, color: '#475569' },
    { name: 'Węgiel brunatny', value: liveKSE.generationBySource.ligniteMw, color: '#78716c' },
    { name: 'Gaz ziemny', value: liveKSE.generationBySource.gasMw, color: '#f97316' },
    {
      name: 'Wiatr (Onshore/Offshore)',
      value: liveKSE.generationBySource.windMw,
      color: '#06b6d4',
    },
    {
      name: 'Fotowoltaika (PV)',
      value: liveKSE.generationBySource.photovoltaicMw,
      color: '#eab308',
    },
    {
      name: 'Hydro & Szczytowo-pompowe',
      value: liveKSE.generationBySource.hydroMw + liveKSE.generationBySource.pumpedStorageMw,
      color: '#3b82f6',
    },
    { name: 'Biomasa & OZE', value: liveKSE.generationBySource.biomassMw, color: '#22c55e' },
    { name: 'Magazyny BESS', value: liveKSE.generationBySource.batteryStorageMw, color: '#a855f7' },
  ];

  // 24-hour diurnal load vs renewable forecast
  const hours24Data = Array.from({ length: 24 }).map((_, h) => {
    const baseHourDemand = [
      14800, 14200, 14000, 14100, 14500, 15800, 18200, 20400, 21800, 22400, 22800, 23100, 23000,
      22700, 22100, 21800, 21900, 22600, 23200, 22800, 21500, 19800, 17900, 16100,
    ][h];

    // Solar curve peaking around 12:00 - 13:00
    const solarCurve = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
    const solarMw =
      h >= 6 && h <= 20
        ? Math.round(solarCurve * (weatherTelemetry ? weatherTelemetry.solarRadiation * 14 : 7000))
        : 0;
    const windMw = Math.round(
      4800 + Math.sin(h * 0.4) * 1200 + (weatherTelemetry?.windSpeed10m || 15) * 80
    );

    return {
      hour: `${h.toString().padStart(2, '0')}:00`,
      zapotrzebowanie: baseHourDemand,
      generacjaOZE: solarMw + windMw,
      fotowoltaika: solarMw,
      wiatr: windMw,
      konwencjonalne: Math.max(4000, baseHourDemand - (solarMw + windMw)),
    };
  });

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CircuitBoard className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Generator Diagramów Sieciowych (Open Data)
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                100% Darmowe Źródła Online
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Interaktywne schematy jednokreskowe (SLD), topologia KSE, miks wytwórczy i bilans mocy
              oparty na danych Open-Meteo i PSE.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <Badge
              variant="secondary"
              className="px-3 py-1 font-mono text-xs flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Częstotliwość KSE: {liveKSE.frequency.toFixed(3)} Hz
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLiveKSE(getLiveKSEGeneration());
              }}
              disabled={isLoadingTelemetry}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTelemetry ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs defaultValue="sld" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="sld" className="gap-2">
              <CircuitBoard className="h-4 w-4" />
              <span>Schemat Jednokreskowy (SLD)</span>
            </TabsTrigger>
            <TabsTrigger value="topology" className="gap-2">
              <Layers className="h-4 w-4" />
              <span>Topologia i Przepływy KSE</span>
            </TabsTrigger>
            <TabsTrigger value="mix" className="gap-2">
              <Zap className="h-4 w-4" />
              <span>Miks Wytwórczy i Bilans</span>
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="gap-2">
              <Activity className="h-4 w-4" />
              <span>Profil Dobowy & OZE</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. SINGLE-LINE DIAGRAM (SLD) */}
          <TabsContent value="sld" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Wybierz stację pomiarową:
                </span>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="bg-background border rounded px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
                >
                  {ALL_MEASUREMENT_STATIONS.filter((s) => s.category === 'gpz').map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                  <span>Załączony (Zamknięty)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span>Rozłączony (Otwarty)</span>
                </div>
                <span className="text-muted-foreground italic hidden md:inline">
                  (Kliknij w aparat Q0/Q, aby zmienić stan łącznika)
                </span>
              </div>
            </div>

            {/* INTERACTIVE SYNOPTIC SVG DIAGRAM */}
            <div className="relative border rounded-lg bg-card/60 p-4 overflow-x-auto shadow-inner">
              <svg
                viewBox="0 0 950 520"
                className="w-full min-w-[750px] h-[480px] font-sans select-none"
              >
                <defs>
                  <linearGradient id="busGradWN" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="busGradSN" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* BACKGROUND GRID LINES */}
                <rect width="950" height="520" fill="transparent" />

                {/* HEADER / TELEMETRY BADGE */}
                <rect x="20" y="15" width="460" height="42" rx="6" fill="#1e293b" opacity="0.9" />
                <text x="35" y="38" fill="#f8fafc" fontSize="13" fontWeight="bold">
                  {selectedStation.name} — Napięcie: {selectedStation.lastTelemetry.voltageKv} kV |
                  Obciążenie: {selectedStation.lastTelemetry.transformerLoadingPct}%
                </text>
                <text x="35" y="50" fill="#94a3b8" fontSize="10">
                  Prąd szyn: {selectedStation.lastTelemetry.currentA} A | THD:{' '}
                  {selectedStation.lastTelemetry.thdPct}% | cos φ:{' '}
                  {selectedStation.lastTelemetry.cosPhi}
                </text>

                {/* HIGH VOLTAGE BUSBARS (110 kV) */}
                <text x="30" y="85" fill="#ef4444" fontSize="12" fontWeight="bold">
                  SZYNA I (110 kV)
                </text>
                <line
                  x1="20"
                  y1="95"
                  x2="920"
                  y2="95"
                  stroke="url(#busGradWN)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                <text x="30" y="125" fill="#dc2626" fontSize="12" fontWeight="bold">
                  SZYNA II (110 kV)
                </text>
                <line
                  x1="20"
                  y1="135"
                  x2="920"
                  y2="135"
                  stroke="url(#busGradWN)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* INCOMING LINES (LINIE WN) */}
                {/* Linia 1 */}
                <line x1="120" y1="40" x2="120" y2="95" stroke="#ef4444" strokeWidth="2.5" />
                <rect x="95" y="45" width="50" height="20" rx="3" fill="#334155" />
                <text x="120" y="58" fill="#f8fafc" fontSize="9" textAnchor="middle">
                  Linia 1 WN
                </text>

                {/* Breaker Q0-W1 */}
                <g onClick={() => toggleBreaker('Q0-W1')} className="cursor-pointer">
                  <rect
                    x="108"
                    y="72"
                    width="24"
                    height="16"
                    rx="3"
                    fill={breakerStates['Q0-W1'] ? '#ef4444' : '#10b981'}
                    filter="url(#shadow)"
                  />
                  <text
                    x="120"
                    y="83"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {breakerStates['Q0-W1'] ? 'ZAŁ' : 'ROZ'}
                  </text>
                </g>

                {/* Linia 2 */}
                <line x1="280" y1="40" x2="280" y2="95" stroke="#ef4444" strokeWidth="2.5" />
                <rect x="255" y="45" width="50" height="20" rx="3" fill="#334155" />
                <text x="280" y="58" fill="#f8fafc" fontSize="9" textAnchor="middle">
                  Linia 2 WN
                </text>

                {/* Breaker Q0-W2 */}
                <g onClick={() => toggleBreaker('Q0-W2')} className="cursor-pointer">
                  <rect
                    x="268"
                    y="72"
                    width="24"
                    height="16"
                    rx="3"
                    fill={breakerStates['Q0-W2'] ? '#ef4444' : '#10b981'}
                    filter="url(#shadow)"
                  />
                  <text
                    x="280"
                    y="83"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {breakerStates['Q0-W2'] ? 'ZAŁ' : 'ROZ'}
                  </text>
                </g>

                {/* TRANSFORMER TR1 */}
                <line x1="220" y1="135" x2="220" y2="185" stroke="#ef4444" strokeWidth="2.5" />
                {/* Breaker TR1 */}
                <g onClick={() => toggleBreaker('Q0-TR1')} className="cursor-pointer">
                  <rect
                    x="208"
                    y="155"
                    width="24"
                    height="16"
                    rx="3"
                    fill={breakerStates['Q0-TR1'] ? '#ef4444' : '#10b981'}
                    filter="url(#shadow)"
                  />
                  <text
                    x="220"
                    y="166"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Q0-T1
                  </text>
                </g>

                {/* TR1 Symbol: Two interlocking circles */}
                <g transform="translate(220, 215)">
                  <circle cx="0" cy="-12" r="18" fill="none" stroke="#64748b" strokeWidth="3" />
                  <circle cx="0" cy="12" r="18" fill="none" stroke="#3b82f6" strokeWidth="3" />
                  <rect x="28" y="-18" width="115" height="38" rx="4" fill="#1e293b" />
                  <text x="35" y="-3" fill="#f8fafc" fontSize="10" fontWeight="bold">
                    TR1 (110/15 kV)
                  </text>
                  <text x="35" y="11" fill="#93c5fd" fontSize="9">
                    31.5 MVA | T: 46°C
                  </text>
                </g>
                <line x1="220" y1="245" x2="220" y2="310" stroke="#3b82f6" strokeWidth="2.5" />

                {/* TRANSFORMER TR2 */}
                <line x1="680" y1="135" x2="680" y2="185" stroke="#ef4444" strokeWidth="2.5" />
                {/* Breaker TR2 */}
                <g onClick={() => toggleBreaker('Q0-TR2')} className="cursor-pointer">
                  <rect
                    x="668"
                    y="155"
                    width="24"
                    height="16"
                    rx="3"
                    fill={breakerStates['Q0-TR2'] ? '#ef4444' : '#10b981'}
                    filter="url(#shadow)"
                  />
                  <text
                    x="680"
                    y="166"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Q0-T2
                  </text>
                </g>

                {/* TR2 Symbol */}
                <g transform="translate(680, 215)">
                  <circle cx="0" cy="-12" r="18" fill="none" stroke="#64748b" strokeWidth="3" />
                  <circle cx="0" cy="12" r="18" fill="none" stroke="#3b82f6" strokeWidth="3" />
                  <rect x="28" y="-18" width="115" height="38" rx="4" fill="#1e293b" />
                  <text x="35" y="-3" fill="#f8fafc" fontSize="10" fontWeight="bold">
                    TR2 (110/15 kV)
                  </text>
                  <text x="35" y="11" fill="#93c5fd" fontSize="9">
                    31.5 MVA | T: 43°C
                  </text>
                </g>
                <line x1="680" y1="245" x2="680" y2="310" stroke="#3b82f6" strokeWidth="2.5" />

                {/* MEDIUM VOLTAGE BUSBAR (15 kV) */}
                <text x="30" y="300" fill="#3b82f6" fontSize="12" fontWeight="bold">
                  ROZDZIELNICA SN (15 kV) — SEKCJA A / B
                </text>
                <line
                  x1="20"
                  y1="310"
                  x2="440"
                  y2="310"
                  stroke="url(#busGradSN)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Sekcjonowanie Szyny SN */}
                <g onClick={() => toggleBreaker('Q0-SN-SEK')} className="cursor-pointer">
                  <rect
                    x="448"
                    y="302"
                    width="38"
                    height="16"
                    rx="3"
                    fill={breakerStates['Q0-SN-SEK'] ? '#ef4444' : '#10b981'}
                    filter="url(#shadow)"
                  />
                  <text
                    x="467"
                    y="313"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    SEKCJA
                  </text>
                </g>
                <line
                  x1="492"
                  y1="310"
                  x2="920"
                  y2="310"
                  stroke="url(#busGradSN)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* OUTGOING FEEDERS (ODPŁYWY SN 15 kV) */}
                {/* Feeder 1: Śródmieście / Szpital */}
                <line x1="100" y1="310" x2="100" y2="440" stroke="#3b82f6" strokeWidth="2" />
                <g onClick={() => toggleBreaker('Q0-F1')} className="cursor-pointer">
                  <rect
                    x="88"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-F1'] ? '#ef4444' : '#10b981'}
                  />
                  <text x="100" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    Q0-1
                  </text>
                </g>
                <rect x="60" y="440" width="80" height="38" rx="4" fill="#0f172a" />
                <text
                  x="100"
                  y="456"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  F1: Szpital
                </text>
                <text x="100" y="470" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  8.4 MW | I: 340 A
                </text>

                {/* Feeder 2: Port / Przemysł */}
                <line x1="220" y1="310" x2="220" y2="440" stroke="#3b82f6" strokeWidth="2" />
                <g onClick={() => toggleBreaker('Q0-F2')} className="cursor-pointer">
                  <rect
                    x="208"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-F2'] ? '#ef4444' : '#10b981'}
                  />
                  <text x="220" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    Q0-2
                  </text>
                </g>
                <rect x="180" y="440" width="80" height="38" rx="4" fill="#0f172a" />
                <text
                  x="220"
                  y="456"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  F2: Przemysł
                </text>
                <text x="220" y="470" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  14.2 MW | I: 575 A
                </text>

                {/* Feeder 3: Trakcja & Hub EV */}
                <line x1="340" y1="310" x2="340" y2="440" stroke="#3b82f6" strokeWidth="2" />
                <g onClick={() => toggleBreaker('Q0-F3')} className="cursor-pointer">
                  <rect
                    x="328"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-F3'] ? '#ef4444' : '#10b981'}
                  />
                  <text x="340" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    Q0-3
                  </text>
                </g>
                <rect x="300" y="440" width="80" height="38" rx="4" fill="#0f172a" />
                <text
                  x="340"
                  y="456"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  F3: Trakcja & EV
                </text>
                <text x="340" y="470" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  6.5 MW | I: 260 A
                </text>

                {/* Feeder 4: Osiedla Mieszkaniowe */}
                <line x1="580" y1="310" x2="580" y2="440" stroke="#3b82f6" strokeWidth="2" />
                <g onClick={() => toggleBreaker('Q0-F4')} className="cursor-pointer">
                  <rect
                    x="568"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-F4'] ? '#ef4444' : '#10b981'}
                  />
                  <text x="580" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    Q0-4
                  </text>
                </g>
                <rect x="540" y="440" width="80" height="38" rx="4" fill="#0f172a" />
                <text
                  x="580"
                  y="456"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  F4: Osiedle
                </text>
                <text x="580" y="470" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  11.8 MW | I: 470 A
                </text>

                {/* Feeder 5: BESS (Magazyn Energii) */}
                <line
                  x1="720"
                  y1="310"
                  x2="720"
                  y2="440"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
                <g onClick={() => toggleBreaker('Q0-BESS')} className="cursor-pointer">
                  <rect
                    x="708"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-BESS'] ? '#a855f7' : '#10b981'}
                  />
                  <text x="720" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    BESS
                  </text>
                </g>
                <rect
                  x="675"
                  y="440"
                  width="90"
                  height="38"
                  rx="4"
                  fill="#2e1065"
                  stroke="#a855f7"
                  strokeWidth="1"
                />
                <text
                  x="720"
                  y="456"
                  fill="#d8b4fe"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  F5: Magazyn BESS
                </text>
                <text x="720" y="470" fill="#c084fc" fontSize="9" textAnchor="middle">
                  ±10 MW | SOC 84%
                </text>

                {/* Feeder 6: Kompensacja Baterią Kondensatorów */}
                <line x1="840" y1="310" x2="840" y2="440" stroke="#10b981" strokeWidth="2" />
                <g onClick={() => toggleBreaker('Q0-KOMP')} className="cursor-pointer">
                  <rect
                    x="828"
                    y="340"
                    width="24"
                    height="15"
                    rx="2"
                    fill={breakerStates['Q0-KOMP'] ? '#10b981' : '#64748b'}
                  />
                  <text x="840" y="351" fill="#fff" fontSize="8" textAnchor="middle">
                    Q0-C
                  </text>
                </g>
                <rect
                  x="800"
                  y="440"
                  width="85"
                  height="38"
                  rx="4"
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <text
                  x="842"
                  y="456"
                  fill="#a7f3d0"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Bateria Kond.
                </text>
                <text x="842" y="470" fill="#6ee7b7" fontSize="9" textAnchor="middle">
                  5.0 Mvar (cos φ 0.99)
                </text>
              </svg>
            </div>
          </TabsContent>

          {/* 2. TOPOLOGY & TRANSMISSION CORRIDORS */}
          <TabsContent value="topology" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border rounded-lg p-4 bg-muted/20">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Korytarze Przesyłowe 400 kV i 220 kV (Krajowy System Elektroenergetyczny)
                </h4>
                <div className="space-y-3">
                  {TRANSMISSION_LINES.map((line) => (
                    <div
                      key={line.id}
                      className="p-3 bg-card rounded border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              line.voltageKv === 400 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                          />
                          {line.name}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          Zdolność przesyłowa: {line.capacityMw} MW | Przepływ chwilowy:{' '}
                          {line.currentFlowMw} MW
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            line.loadPct > 75
                              ? 'border-amber-500 text-amber-500'
                              : 'border-emerald-500 text-emerald-500'
                          }
                        >
                          Obciążenie {line.loadPct}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CITY PROFILE CARD */}
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Profil Sieci Miejskiej ("Strój Miasta")
                  </h4>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="bg-muted border rounded px-2 py-1 text-xs"
                  >
                    {CITY_GRID_PROFILES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Rola w systemie:</span>
                    <span className="font-semibold">{selectedCity.role}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Bieżące zapotrzebowanie:</span>
                    <span className="font-bold text-primary">
                      {selectedCity.currentDemandMw} MW
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Generacja lokalna OZE:</span>
                    <span className="font-semibold text-emerald-500">
                      {selectedCity.renewableGenerationMw} MW
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Liczba stacji GPZ/SN:</span>
                    <span className="font-semibold">{selectedCity.substationsCount} stacji</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Stopień obciążenia sieci:</span>
                    <span className="font-semibold">{selectedCity.gridLoadPct}%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Pojemność magazynów BESS:</span>
                    <span className="font-semibold">{selectedCity.bessCapacityMwh} MWh</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Wskaźnik SAIDI (niezawodność):</span>
                    <span className="font-semibold">
                      {selectedCity.reliabilitySaidiMin} min/rok
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Jakość powietrza (GIOŚ):</span>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      {selectedCity.sensorsSummary.airQualityIndex} (
                      {selectedCity.sensorsSummary.co2Ppm} ppm)
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. GENERATION MIX & POWER BALANCE */}
          <TabsContent value="mix" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PIE CHART */}
              <div className="border rounded-lg p-4 bg-card">
                <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                  <span>Miks Wytwórczy KSE (Moc: {liveKSE.totalGenerationMw} MW)</span>
                  <Badge variant="outline">Dane Otwarte PSE</Badge>
                </h4>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={generationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {generationData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} MW`, 'Moc']} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* LIVE TELEMETRY WEATHER STATS */}
              <div className="border rounded-lg p-4 bg-card flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Telemetria Środowiskowa i Potencjał OZE (Open-Meteo API)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-muted/40 rounded border">
                      <div className="text-xs text-muted-foreground">Promieniowanie słoneczne</div>
                      <div className="text-xl font-bold text-amber-500">
                        {weatherTelemetry?.solarRadiation ?? 420} W/m²
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Darmowe API bez klucza
                      </div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded border">
                      <div className="text-xs text-muted-foreground">Prędkość wiatru (10m)</div>
                      <div className="text-xl font-bold text-cyan-500">
                        {weatherTelemetry?.windSpeed10m ?? 18.2} km/h
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Potencjał turbin: Wysoki
                      </div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded border">
                      <div className="text-xs text-muted-foreground">Temperatura otoczenia</div>
                      <div className="text-xl font-bold">
                        {weatherTelemetry?.temperature ?? 19.5} °C
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Wpływ na opór linii kablowych
                      </div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded border">
                      <div className="text-xs text-muted-foreground">Ciśnienie atmosferyczne</div>
                      <div className="text-xl font-bold">
                        {weatherTelemetry?.pressure ?? 1014} hPa
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Stabilne warunki przesyłowe
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Bilans Krajowego Systemu Elektroenergetycznego
                  </div>
                  <div>
                    Zapotrzebowanie KSE: <span className="font-bold">{liveKSE.totalLoadMw} MW</span>
                  </div>
                  <div>
                    Generacja całkowita:{' '}
                    <span className="font-bold">{liveKSE.totalGenerationMw} MW</span>
                  </div>
                  <div>
                    Wymiana transgraniczna:{' '}
                    <span className="font-bold">
                      {liveKSE.crossBorderFlowMw > 0
                        ? `+${liveKSE.crossBorderFlowMw} MW (Eksport)`
                        : `${liveKSE.crossBorderFlowMw} MW (Import)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4. 24H DIURNAL DISPATCH PROFILE */}
          <TabsContent value="dispatch" className="space-y-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                <div>
                  <h4 className="text-sm font-semibold">
                    24-Godzinny Profil Obciążenia vs. OZE (Wiatr & PV)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Prognoza nasłonecznienia i wiatru z otwartego API Open-Meteo skorelowana z KSE
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Generacja OZE w szczycie: {Math.max(...hours24Data.map((d) => d.generacjaOZE))} MW
                </Badge>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hours24Data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="hour" fontSize={11} />
                    <YAxis fontSize={11} unit=" MW" />
                    <Tooltip formatter={(value: any) => [`${value} MW`, '']} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="zapotrzebowanie"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      name="Zapotrzebowanie KSE"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="fotowoltaika"
                      stroke="#eab308"
                      fill="#eab308"
                      fillOpacity={0.4}
                      name="Fotowoltaika (PV)"
                    />
                    <Area
                      type="monotone"
                      dataKey="wiatr"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.4}
                      name="Generacja wiatrowa"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
