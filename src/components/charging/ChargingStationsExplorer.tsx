import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Zap,
  Globe2,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Navigation,
  BatteryCharging,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 1. DATA FOR EUROPE (COUNTRIES)
interface EuropeanCountryEV {
  code: string;
  name: string;
  flag: string;
  totalPoints: number;
  fastHpcPoints: number;
  installedCapacityMw: number;
  evSharePct: number;
  leadingNetwork: string;
}

const EUROPE_COUNTRIES: EuropeanCountryEV[] = [
  {
    code: 'PL',
    name: 'Polska',
    flag: '🇵🇱',
    totalPoints: 7280,
    fastHpcPoints: 2150,
    installedCapacityMw: 410,
    evSharePct: 4.2,
    leadingNetwork: 'GreenWay / Orlen Charge / Ionity',
  },
  {
    code: 'DE',
    name: 'Niemcy',
    flag: '🇩🇪',
    totalPoints: 124500,
    fastHpcPoints: 28400,
    installedCapacityMw: 6200,
    evSharePct: 18.5,
    leadingNetwork: 'EnBW / Ionity / Aral pulse',
  },
  {
    code: 'NL',
    name: 'Holandia',
    flag: '🇳🇱',
    totalPoints: 152000,
    fastHpcPoints: 14800,
    installedCapacityMw: 4800,
    evSharePct: 32.1,
    leadingNetwork: 'Fastned / Allego / Shell Recharge',
  },
  {
    code: 'FR',
    name: 'Francja',
    flag: '🇫🇷',
    totalPoints: 118000,
    fastHpcPoints: 19500,
    installedCapacityMw: 5100,
    evSharePct: 16.8,
    leadingNetwork: 'TotalEnergies / Ionity',
  },
  {
    code: 'NO',
    name: 'Norwegia',
    flag: '🇳🇴',
    totalPoints: 26800,
    fastHpcPoints: 9200,
    installedCapacityMw: 2400,
    evSharePct: 88.6,
    leadingNetwork: 'Mer / Recharge / Tesla Supercharger',
  },
  {
    code: 'SE',
    name: 'Szwecja',
    flag: '🇸🇪',
    totalPoints: 34500,
    fastHpcPoints: 7100,
    installedCapacityMw: 1950,
    evSharePct: 41.2,
    leadingNetwork: 'InCharge / Ionity',
  },
  {
    code: 'IT',
    name: 'Włochy',
    flag: '🇮🇹',
    totalPoints: 47200,
    fastHpcPoints: 8900,
    installedCapacityMw: 2100,
    evSharePct: 5.4,
    leadingNetwork: 'Enel X Way / Free To X',
  },
  {
    code: 'ES',
    name: 'Hiszpania',
    flag: '🇪🇸',
    totalPoints: 32100,
    fastHpcPoints: 6400,
    installedCapacityMw: 1650,
    evSharePct: 6.8,
    leadingNetwork: 'Iberdrola / Endesa X',
  },
  {
    code: 'UK',
    name: 'Wielka Brytania',
    flag: '🇬🇧',
    totalPoints: 62400,
    fastHpcPoints: 11800,
    installedCapacityMw: 3200,
    evSharePct: 17.9,
    leadingNetwork: 'Gridserve / Pod Point / bp pulse',
  },
  {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    totalPoints: 22800,
    fastHpcPoints: 5100,
    installedCapacityMw: 1250,
    evSharePct: 21.0,
    leadingNetwork: 'Smatrics / Ionity',
  },
  {
    code: 'DK',
    name: 'Dania',
    flag: '🇩🇰',
    totalPoints: 19400,
    fastHpcPoints: 4600,
    installedCapacityMw: 1100,
    evSharePct: 38.4,
    leadingNetwork: 'Clever / E.ON',
  },
  {
    code: 'CZ',
    name: 'Czechy',
    flag: '🇨🇿',
    totalPoints: 5100,
    fastHpcPoints: 1450,
    installedCapacityMw: 290,
    evSharePct: 3.8,
    leadingNetwork: 'ČEZ / PRE',
  },
];

// 2. DATA FOR POLAND (16 VOIVODESHIPS)
interface VoivodeshipEV {
  id: string;
  name: string;
  capital: string;
  totalStations: number;
  totalConnectors: number;
  fastDcPct: number;
  gridLoadPct: number;
}

const POLAND_VOIVODESHIPS: VoivodeshipEV[] = [
  {
    id: 'pomorskie',
    name: 'Pomorskie',
    capital: 'Gdańsk',
    totalStations: 540,
    totalConnectors: 1180,
    fastDcPct: 38,
    gridLoadPct: 68,
  },
  {
    id: 'mazowieckie',
    name: 'Mazowieckie',
    capital: 'Warszawa',
    totalStations: 1420,
    totalConnectors: 3120,
    fastDcPct: 42,
    gridLoadPct: 82,
  },
  {
    id: 'slaskie',
    name: 'Śląskie',
    capital: 'Katowice',
    totalStations: 760,
    totalConnectors: 1650,
    fastDcPct: 36,
    gridLoadPct: 79,
  },
  {
    id: 'wielkopolskie',
    name: 'Wielkopolskie',
    capital: 'Poznań',
    totalStations: 680,
    totalConnectors: 1490,
    fastDcPct: 35,
    gridLoadPct: 71,
  },
  {
    id: 'dolnoslaskie',
    name: 'Dolnośląskie',
    capital: 'Wrocław',
    totalStations: 710,
    totalConnectors: 1540,
    fastDcPct: 39,
    gridLoadPct: 74,
  },
  {
    id: 'malopolskie',
    name: 'Małopolskie',
    capital: 'Kraków',
    totalStations: 650,
    totalConnectors: 1410,
    fastDcPct: 34,
    gridLoadPct: 76,
  },
  {
    id: 'lodzkie',
    name: 'Łódzkie',
    capital: 'Łódź',
    totalStations: 490,
    totalConnectors: 1050,
    fastDcPct: 37,
    gridLoadPct: 70,
  },
  {
    id: 'zachodniopomorskie',
    name: 'Zachodniopomorskie',
    capital: 'Szczecin',
    totalStations: 380,
    totalConnectors: 820,
    fastDcPct: 32,
    gridLoadPct: 65,
  },
  {
    id: 'kujawsko-pomorskie',
    name: 'Kujawsko-Pomorskie',
    capital: 'Bydgoszcz / Toruń',
    totalStations: 340,
    totalConnectors: 730,
    fastDcPct: 31,
    gridLoadPct: 64,
  },
  {
    id: 'lubelskie',
    name: 'Lubelskie',
    capital: 'Lublin',
    totalStations: 280,
    totalConnectors: 590,
    fastDcPct: 29,
    gridLoadPct: 62,
  },
  {
    id: 'podkarpackie',
    name: 'Podkarpackie',
    capital: 'Rzeszów',
    totalStations: 250,
    totalConnectors: 530,
    fastDcPct: 30,
    gridLoadPct: 61,
  },
  {
    id: 'podlaskie',
    name: 'Podlaskie',
    capital: 'Białystok',
    totalStations: 190,
    totalConnectors: 410,
    fastDcPct: 26,
    gridLoadPct: 58,
  },
  {
    id: 'swietokrzyskie',
    name: 'Świętokrzyskie',
    capital: 'Kielce',
    totalStations: 170,
    totalConnectors: 360,
    fastDcPct: 28,
    gridLoadPct: 59,
  },
  {
    id: 'opolskie',
    name: 'Opolskie',
    capital: 'Opole',
    totalStations: 160,
    totalConnectors: 340,
    fastDcPct: 32,
    gridLoadPct: 63,
  },
  {
    id: 'lubuskie',
    name: 'Lubuskie',
    capital: 'Zielona Góra / Gorzów Wlkp.',
    totalStations: 210,
    totalConnectors: 460,
    fastDcPct: 34,
    gridLoadPct: 60,
  },
  {
    id: 'warminsko-mazurskie',
    name: 'Warmińsko-Mazurskie',
    capital: 'Olsztyn',
    totalStations: 220,
    totalConnectors: 480,
    fastDcPct: 27,
    gridLoadPct: 57,
  },
];

// 3. DATA FOR POMERANIA (5 CORE PROJECT CITIES)
interface StationItem {
  id: string;
  name: string;
  city: 'Gdańsk' | 'Gdynia' | 'Sopot' | 'Słupsk' | 'Ustka';
  address: string;
  powerKw: number;
  connectors: string[];
  status: 'available' | 'occupied' | 'maintenance';
  priceKwhPln: number;
  greenEnergyPct: number;
  network: string;
}

const POMERANIAN_5_CITIES_STATIONS: StationItem[] = [
  // Gdańsk
  {
    id: 'gda-matarnia-hpc',
    name: 'Hub Szybkiego Ładowania HPC Matarnia (Obwodnica)',
    city: 'Gdańsk',
    address: 'ul. Złota Karczma 26, 80-298 Gdańsk',
    powerKw: 350,
    connectors: ['CCS2 (350kW)', 'CCS2 (350kW)', 'CHAdeMO (50kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.89,
    greenEnergyPct: 100,
    network: 'Ionity / Energa',
  },
  {
    id: 'gda-olivia-business',
    name: 'Olivia Centre E-Mobility Hub',
    city: 'Gdańsk',
    address: 'al. Grunwaldzka 472, 80-309 Gdańsk',
    powerKw: 150,
    connectors: ['CCS2 (150kW)', 'CCS2 (150kW)', 'Type 2 (22kW)'],
    status: 'occupied',
    priceKwhPln: 2.39,
    greenEnergyPct: 100,
    network: 'GreenWay',
  },
  {
    id: 'gda-port-hpc',
    name: 'Terminal Kontenerowy Baltic Hub EV',
    city: 'Gdańsk',
    address: 'ul. Kontenerowa 9, 80-601 Gdańsk',
    powerKw: 180,
    connectors: ['CCS2 (180kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.45,
    greenEnergyPct: 95,
    network: 'Orlen Charge',
  },

  // Gdynia
  {
    id: 'gdy-port-hpc',
    name: 'Hub EV Port Gdynia & Baza Promowa',
    city: 'Gdynia',
    address: 'ul. Polska 4, 81-339 Gdynia',
    powerKw: 300,
    connectors: ['CCS2 (300kW)', 'CCS2 (150kW)', 'CHAdeMO (50kW)'],
    status: 'available',
    priceKwhPln: 2.79,
    greenEnergyPct: 100,
    network: 'GreenWay',
  },
  {
    id: 'gdy-glowna-station',
    name: 'Dworzec Gdynia Główna P+R Hub',
    city: 'Gdynia',
    address: 'pl. Konstytucji 1, 81-354 Gdynia',
    powerKw: 100,
    connectors: ['CCS2 (100kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.19,
    greenEnergyPct: 90,
    network: 'Tauron / Energa',
  },

  // Sopot
  {
    id: 'sopot-centrum-hub',
    name: 'Sopot Centrum E-Mobility Park',
    city: 'Sopot',
    address: 'ul. Dworcowa 7, 81-704 Sopot',
    powerKw: 120,
    connectors: ['CCS2 (120kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.29,
    greenEnergyPct: 100,
    network: 'GreenWay',
  },
  {
    id: 'sopot-opera-lesna',
    name: 'Opera Leśna Zielona Stacja EV',
    city: 'Sopot',
    address: 'ul. Moniuszki 12, 81-829 Sopot',
    powerKw: 50,
    connectors: ['CCS2 (50kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 1.99,
    greenEnergyPct: 100,
    network: 'EcoSopot',
  },

  // Słupsk
  {
    id: 'slupsk-wschod-hpc',
    name: 'Słupsk Hub Wschód (Korytarz DK6)',
    city: 'Słupsk',
    address: 'ul. Szczecińska 36, 76-200 Słupsk',
    powerKw: 150,
    connectors: ['CCS2 (150kW)', 'CHAdeMO (50kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.35,
    greenEnergyPct: 95,
    network: 'Orlen Charge',
  },
  {
    id: 'slupsk-centrum-market',
    name: 'Galeria Słupsk E-Car Station',
    city: 'Słupsk',
    address: 'ul. Tuwima 32, 76-200 Słupsk',
    powerKw: 60,
    connectors: ['CCS2 (60kW)', 'Type 2 (22kW)'],
    status: 'occupied',
    priceKwhPln: 2.05,
    greenEnergyPct: 85,
    network: 'GreenWay',
  },

  // Ustka
  {
    id: 'ustka-port-oze',
    name: 'Ustka Port Baza Offshore EV Hub',
    city: 'Ustka',
    address: 'ul. Westerplatte 1, 76-270 Ustka',
    powerKw: 120,
    connectors: ['CCS2 (120kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 2.25,
    greenEnergyPct: 100,
    network: 'Baltic Power / Energa',
  },
  {
    id: 'ustka-promenada-eco',
    name: 'Promenada Nadmorska E-Mobility',
    city: 'Ustka',
    address: 'ul. Marynarki Polskiej 45, 76-270 Ustka',
    powerKw: 50,
    connectors: ['CCS2 (50kW)', 'Type 2 (22kW)'],
    status: 'available',
    priceKwhPln: 1.95,
    greenEnergyPct: 100,
    network: 'Gmina Ustka OZE',
  },
];

export function ChargingStationsExplorer() {
  const { toast } = useToast();
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = POMERANIAN_5_CITIES_STATIONS.filter((station) => {
    const matchesCity =
      selectedCityFilter === 'all' ||
      station.city.toLowerCase() === selectedCityFilter.toLowerCase();
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.network.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const handleNavigate = (stationName: string) => {
    toast({
      title: 'Trasa wyznaczona',
      description: `Wysłano współrzędne stacji "${stationName}" do systemu nawigacji pojazdu.`,
    });
  };

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BatteryCharging className="h-6 w-6 text-emerald-500" />
              <CardTitle className="text-xl font-bold">
                Infrastruktura Stacji Ładowania EV
              </CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
              >
                Hierarchia: Europa → Polska (16 Województw) → Pomorze (5 Miast)
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Kompleksowy monitoring sieci stacji ładowania pojazdów elektrycznych od poziomu Unii
              Europejskiej po lokalne huby na Pomorzu.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              ⚡ Szybkie Huby HPC: do 350 kW
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs defaultValue="pomerania" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-6">
            <TabsTrigger value="europe" className="gap-2">
              <Globe2 className="h-4 w-4" />
              <span>1. Europa (Kraje)</span>
            </TabsTrigger>
            <TabsTrigger value="poland" className="gap-2">
              <Layers className="h-4 w-4" />
              <span>2. Polska (16 Województw)</span>
            </TabsTrigger>
            <TabsTrigger
              value="pomerania"
              className="gap-2 font-bold text-emerald-600 dark:text-emerald-400"
            >
              <Zap className="h-4 w-4" />
              <span>3. Woj. Pomorskie (5 Miast Projektu)</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EUROPE */}
          <TabsContent value="europe" className="space-y-4">
            <div className="border rounded-lg overflow-x-auto bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3">Kraj</th>
                    <th className="p-3">Punkty Ładowania</th>
                    <th className="p-3">Szybkie HPC (≥150 kW)</th>
                    <th className="p-3">Moc Zainstalowana</th>
                    <th className="p-3">Udział EV we flocie</th>
                    <th className="p-3">Główne Sieci Ładowania</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {EUROPE_COUNTRIES.map((c) => (
                    <tr key={c.code} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 flex items-center gap-2 font-bold">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                        {c.code === 'PL' && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            Kraj Projektu
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-semibold">{c.totalPoints.toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-bold">
                        {c.fastHpcPoints.toLocaleString()}
                      </td>
                      <td className="p-3">{c.installedCapacityMw} MW</td>
                      <td className="p-3">
                        <span className="font-semibold">{c.evSharePct}%</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{c.leadingNetwork}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 2: POLAND (16 VOIVODESHIPS) */}
          <TabsContent value="poland" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {POLAND_VOIVODESHIPS.map((voiv) => (
                <div
                  key={voiv.id}
                  className={`p-4 rounded-lg border bg-card hover:shadow-sm transition-all ${
                    voiv.id === 'pomorskie' ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {voiv.name}
                        {voiv.id === 'pomorskie' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 border-emerald-500"
                          >
                            Projekt
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Stolica: {voiv.capital}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {voiv.totalStations} stacji
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs mt-3 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Punkty ładowania:</span>
                      <span className="font-semibold">{voiv.totalConnectors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Udział szybkich DC:</span>
                      <span className="font-bold text-emerald-600">{voiv.fastDcPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Obciążenie sieci:</span>
                      <span className="font-medium">{voiv.gridLoadPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: POMERANIA (5 CITIES PROJECT) */}
          <TabsContent value="pomerania" className="space-y-4">
            {/* 5 CITIES FILTER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/30 p-3 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  Wybierz miasto:
                </span>
                {['all', 'Gdańsk', 'Gdynia', 'Sopot', 'Słupsk', 'Ustka'].map((city) => (
                  <Button
                    key={city}
                    variant={
                      selectedCityFilter.toLowerCase() === city.toLowerCase()
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedCityFilter(city)}
                  >
                    {city === 'all' ? 'Wszystkie 5 Miast' : city}
                  </Button>
                ))}
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Szukaj stacji, ulicy lub sieci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* STATIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStations.map((station) => (
                <div key={station.id} className="p-4 rounded-lg border bg-card shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {station.city}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            station.status === 'available'
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                              : station.status === 'occupied'
                                ? 'border-amber-500 text-amber-600 bg-amber-500/10'
                                : 'border-red-500 text-red-600'
                          }
                        >
                          {station.status === 'available'
                            ? '● Wolna'
                            : station.status === 'occupied'
                              ? '● Zajęta'
                              : 'W konserwacji'}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm mt-1">{station.name}</h4>
                      <p className="text-xs text-muted-foreground">{station.address}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-600">
                        {station.powerKw} kW
                      </div>
                      <div className="text-[10px] text-muted-foreground">{station.network}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-muted/40 rounded border text-xs space-y-1">
                    <div className="text-[11px] text-muted-foreground font-semibold">
                      Dostępne złącza:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {station.connectors.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-background rounded border text-[10px] font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Cena: </span>
                      <span className="font-bold">{station.priceKwhPln} PLN / kWh</span>
                      <span className="text-[10px] text-emerald-600 ml-2 font-medium">
                        🌱 {station.greenEnergyPct}% OZE
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigate(station.name)}
                      className="h-7 text-xs gap-1"
                    >
                      <Navigation className="w-3 h-3 text-primary" />
                      Nawiguj
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
