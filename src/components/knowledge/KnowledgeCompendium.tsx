import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen,
  CircuitBoard,
  Cpu,
  Battery,
  Zap,
  Activity,
  Network,
  Building2,
  Wind,
  Sun,
  Flame,
  Ship,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export function KnowledgeCompendium() {
  const [activeTopic, setActiveTopic] = useState<
    'gpz' | 'twin' | 'bess' | 'dsr' | 'quality' | 'standards'
  >('gpz');

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Kompendium Wiedzy Smart Grid & Energetyka Pomorza
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Baza Wiedzy & Infografiki
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Wizualne omówienie kluczowych pojęć inteligentnych sieci elektroenergetycznych oraz
              charakterystyka energetyczna 5 miast projektu.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs defaultValue="concepts" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-2 mb-6">
            <TabsTrigger value="concepts" className="gap-2">
              <CircuitBoard className="h-4 w-4" />
              <span>Podstawowe Zagadnienia & Infografiki</span>
            </TabsTrigger>
            <TabsTrigger value="cities" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span>Charakterystyka Energetyczna 5 Miast Projektu</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SMART GRID CONCEPTS & INFOGRAPHICS */}
          <TabsContent value="concepts" className="space-y-6">
            {/* TOPIC SELECTOR PILLS */}
            <div className="flex flex-wrap gap-2 pb-2 border-b">
              {[
                { id: 'gpz', label: '1. GPZ i Schematy SLD', icon: CircuitBoard },
                { id: 'twin', label: '2. Bliźniak Cyfrowy (Digital Twin)', icon: Cpu },
                { id: 'bess', label: '3. Magazyny Energii BESS', icon: Battery },
                { id: 'dsr', label: '4. DSR i Elastyczność Sieci', icon: Zap },
                { id: 'quality', label: '5. Jakość Energii (THD, cos φ)', icon: Activity },
                { id: 'standards', label: '6. Standardy IEC 61850 i OCPP', icon: Network },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <Button
                    key={t.id}
                    variant={activeTopic === t.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setActiveTopic(t.id as any)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </Button>
                );
              })}
            </div>

            {/* CONCEPT CONTENT */}
            {activeTopic === 'gpz' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-sm">
                  <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                    Infrastruktura WN / SN
                  </Badge>
                  <h3 className="text-xl font-bold">Główny Punkt Zasilania (GPZ 110/15 kV)</h3>
                  <p className="text-muted-foreground">
                    GPZ to kluczowy węzeł transformacji energii elektrycznej z poziomu sieci
                    wysokiego napięcia (WN 110 kV) na średnie napięcie rozdzielcze (SN 15 kV lub 20
                    kV), z którego zasilane są stacje transformatorowe osiedlowe, miejskie i zakłady
                    przemysłowe.
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">• Szyny zbiorcze:</span>
                      <span>
                        Układy jedno- lub dwusystemowe umożliwiające bezprzerwowe przełączanie torów
                        zasilania w czasie remontu.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">• Transformatory mocy:</span>
                      <span>
                        Jednostki 25 MVA lub 31.5 MVA wyposażone w przełączniki zaczepów pod
                        obciążeniem (OLTC) stabilizujące napięcie w sieci miejskiej.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">
                        • Automatyka zabezpieczeniowa EAZ:
                      </span>
                      <span>
                        Cyfrowe przekaźniki zabezpieczeniowe wyłączające zwarcia w czasie poniżej 40
                        milisekund.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-muted/30 border rounded-xl space-y-3 font-mono text-xs">
                  <div className="font-bold text-foreground flex items-center justify-between pb-2 border-b">
                    <span>Infografika Przepływu Mocy w GPZ</span>
                    <Badge variant="secondary">WN → SN → nN</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded flex justify-between items-center text-red-600 dark:text-red-400">
                      <span>Sieć Przesyłowa 400/220/110 kV (PSE)</span>
                      <span className="font-bold">Linie Napowietrzne</span>
                    </div>
                    <div className="text-center text-muted-foreground text-xs font-sans">
                      ↓ Odłączniki i wyłączniki mocy Q0
                    </div>
                    <div className="p-2.5 bg-primary/10 border border-primary/30 rounded flex justify-between items-center text-primary">
                      <span>Transformator Mocy 110/15 kV (31.5 MVA)</span>
                      <span className="font-bold">Regulacja OLTC</span>
                    </div>
                    <div className="text-center text-muted-foreground text-xs font-sans">
                      ↓ Rozdzielnica SN 15 kV
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Odpływy Kablowe do Miast & Przemysłu</span>
                      <span className="font-bold">Szpitale, Tramwaje, EV, Odbiorcy nN</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'twin' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-sm">
                  <Badge
                    variant="outline"
                    className="text-indigo-500 border-indigo-500/30 bg-indigo-500/10"
                  >
                    Innowacja & Modelowanie 3D
                  </Badge>
                  <h3 className="text-xl font-bold">
                    Bliźniak Cyfrowy (Digital Twin) w Energetyce
                  </h3>
                  <p className="text-muted-foreground">
                    Bliźniak cyfrowy to wirtualna, trójwymiarowa i matematyczna replika rzeczywistej
                    infrastruktury energetycznej zasilana danymi telemetrycznymi w czasie
                    rzeczywistym (SCADA/IoT).
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500">
                        • Symulacja stanów awaryjnych (What-If):
                      </span>
                      <span>
                        Testowanie skutków odłączenia linii kablowej lub nagłego spadku generacji
                        wiatrowej przed podjęciem decyzji dyspozytorskiej.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500">• Predictive Maintenance:</span>
                      <span>
                        Wykrywanie mikrouszkodzeń izolacji transformatorów na podstawie analizy
                        temperatury oleju i drgań akustycznych.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 bg-card border rounded-xl shadow-inner space-y-3 text-xs">
                  <div className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Architektura Bliźniaka Cyfrowego Polo 3.0
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-muted rounded border">
                      <div className="font-semibold text-foreground">Sensory IoT (Warstwa 1)</div>
                      <div className="text-muted-foreground">
                        Pomiary prądu, napięcia, THD, temperatury
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded border">
                      <div className="font-semibold text-foreground">Strumieniowanie Danych</div>
                      <div className="text-muted-foreground">MQTT Broker & WebSockets 60fps</div>
                    </div>
                    <div className="p-2 bg-muted rounded border">
                      <div className="font-semibold text-foreground">Silnik Three.js / WebGL</div>
                      <div className="text-muted-foreground">
                        Wizualizacja stacji i cyberpunktów w 3D
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded border">
                      <div className="font-semibold text-foreground">Algorytmy Predykcji</div>
                      <div className="text-muted-foreground">Estymacja obciążeń i prognoza OZE</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'bess' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-sm">
                  <Badge
                    variant="outline"
                    className="text-purple-500 border-purple-500/30 bg-purple-500/10"
                  >
                    Magazynowanie Energii
                  </Badge>
                  <h3 className="text-xl font-bold">Wielkoskalowe Magazyny BESS</h3>
                  <p className="text-muted-foreground">
                    Magazyny energii BESS (Battery Energy Storage Systems) stabilizują sieć zasilaną
                    ze zmiennych źródeł wiatrowych i słonecznych, absorbując nadwyżki mocy w
                    południe i oddając je w wieczornym szczycie zapotrzebowania.
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      • <b>FCR (Frequency Containment Reserve):</b> Reakcja w ułamku sekundy na
                      odchylenia częstotliwości 50 Hz.
                    </div>
                    <div>
                      • <b>Peak Shaving:</b> Ścinanie szczytów obciążeń stacji transformatorowych
                      bez konieczności kosztownej wymiany kabli.
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-purple-300">
                    Przykład Pomorski: BESS Żarnowiec 200 MW / 800 MWh
                  </div>
                  <p className="text-muted-foreground">
                    Największy magazyn bateryjny w Europie Środkowej, współpracujący bezpośrednio z
                    morskimi farmami wiatrowymi na Bałtyku i Elektrownią Szczytowo-Pompową
                    Żarnowiec.
                  </p>
                </div>
              </div>
            )}

            {activeTopic === 'dsr' && (
              <div className="space-y-3 text-sm">
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-500/30 bg-amber-500/10"
                >
                  Zarządzanie Popytem
                </Badge>
                <h3 className="text-xl font-bold">
                  DSR (Demand Side Response) & Dynamiczne Taryfy
                </h3>
                <p className="text-muted-foreground">
                  DSR to mechanizm elastyczności, w którym odbiorcy przemysłowi i komunalni (np.
                  oczyszczalnie ścieków, chłodnie, floty autobusów EV) celowo ograniczają pobór
                  energii w zamian za wynagrodzenie rynkowe w momentach deficytu mocy w systemie.
                </p>
              </div>
            )}

            {activeTopic === 'quality' && (
              <div className="space-y-3 text-sm">
                <Badge
                  variant="outline"
                  className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                >
                  Parametry Jakościowe
                </Badge>
                <h3 className="text-xl font-bold">
                  Jakość Energii: Współczynnik cos φ i Harmoniczne THD
                </h3>
                <p className="text-muted-foreground">
                  Prawidłowa praca odbiorników wymaga napięcia o niskiej zawartości wyższych
                  harmonicznych (THD &lt; 3%) oraz współczynnika mocy bliskiego jedności
                  ($\cos\varphi \ge 0.95$). Baterie kondensatorów i dławiki kompensują moc bierną,
                  obniżając straty przesyłowe w sieci miejskiej.
                </p>
              </div>
            )}

            {activeTopic === 'standards' && (
              <div className="space-y-3 text-sm">
                <Badge
                  variant="outline"
                  className="text-blue-500 border-blue-500/30 bg-blue-500/10"
                >
                  Protokoły Komunikacyjne
                </Badge>
                <h3 className="text-xl font-bold">Standardy IEC 61850, Modbus TCP i OCPP 2.0.1</h3>
                <p className="text-muted-foreground">
                  Nowoczesny Smart Grid opiera się na otwartych standardach interoperacyjności: IEC
                  61850 (komunikacja stacyjna), MQTT/REST (integracja sensorów IoT) oraz OCPP 2.0.1
                  (zarządzanie stacjami ładowania pojazdów elektrycznych i technologią
                  Vehicle-to-Grid - V2G).
                </p>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: 5 CITIES ENERGY CHARACTERISTICS */}
          <TabsContent value="cities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. GDAŃSK */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base text-primary">1. Gdańsk</h4>
                  <Badge variant="secondary">Zapotrzebowanie: ~880 MW</Badge>
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Ship className="w-3.5 h-3.5 text-blue-500" />
                  Hub portowy i lądowisko kabli morskich farm wiatrowych
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Największy ośrodek konsumpcji energii na Pomorzu. Zasilany z węzła SE Gdańsk
                  Błonia 400/110 kV oraz GPZ Południe. W Gdańsku zbiegają się korytarze
                  wyprowadzenia mocy z morskich farm wiatrowych Baltica na Bałtyku.
                  Elektrociepłownia EC Wybrzeże zapewnia stabilną kogenerację ciepła i prądu.
                </p>
                <div className="pt-2 border-t text-[11px] space-y-1">
                  <div>
                    <b>Główne źródła:</b> Elektrociepłownie gazowo-parowe, morski wiatr offshore,
                    PV.
                  </div>
                  <div>
                    <b>Wyzwanie:</b> Integracja ładowania flot kontenerowych Baltic Hub i transportu
                    miejskiego.
                  </div>
                </div>
              </div>

              {/* 2. GDYNIA */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base text-primary">2. Gdynia</h4>
                  <Badge variant="secondary">Zapotrzebowanie: ~490 MW</Badge>
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Ship className="w-3.5 h-3.5 text-cyan-500" />
                  Port Morski & Zelektryfikowana E-Mobilność
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gdynia wyróżnia się pionierskim systemem zasilania statków z lądu (Cold Ironing /
                  Onshore Power Supply), który eliminuje emisje spalin z silników okrętowych w
                  porcie. Miasto posiada zelektryfikowaną sieć trolejbusową z zasobnikami
                  bateryjnymi oraz autobusy wodorowe.
                </p>
                <div className="pt-2 border-t text-[11px] space-y-1">
                  <div>
                    <b>Główne stacje:</b> GPZ Gdynia Port 110/15 kV, GPZ Chylonia, GPZ Karwiny.
                  </div>
                  <div>
                    <b>Specyfika:</b> Zasilanie terminali kontenerowych BCT i GCT o wysokim
                    zapotrzebowaniu na moc.
                  </div>
                </div>
              </div>

              {/* 3. SOPOT */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base text-primary">3. Sopot</h4>
                  <Badge variant="secondary">Zapotrzebowanie: ~110 MW</Badge>
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Uzdrowisko & Inteligentne Mikrosieci
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Jako kurort uzdrowiskowy, Sopot stawia na bezemisyjność i mikroinstalacje
                  fotowoltaiczne na budynkach komunalnych. Zasilany głównie przez GPZ Sopot Kamienny
                  Potok. Projekt Smart Sopot integruje inteligentne oświetlenie LED z wbudowanymi
                  stacjami ładowania EV.
                </p>
                <div className="pt-2 border-t text-[11px] space-y-1">
                  <div>
                    <b>Priorytety:</b> Czyste powietrze (restrykcyjne normy PM2.5), pompy ciepła,
                    geotermia.
                  </div>
                  <div>
                    <b>Niezawodność:</b> Najwyższy wskaźnik niezawodności SAIDI (22 min/rok).
                  </div>
                </div>
              </div>

              {/* 4. SŁUPSK */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base text-primary">4. Słupsk</h4>
                  <Badge variant="secondary">Zapotrzebowanie: ~190 MW</Badge>
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  Klastry Energii & Korytarz Wiatrowy Północy
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lider samowystarczalności energetycznej w regionie. Wokół Słupska funkcjonują
                  liczne lądowe farmy wiatrowe oraz biogazownie komunalne zasilające miejską
                  oczyszczalnię i sieć ciepłowniczą. Powstał tu Słupski Klaster Bioenergetyczny.
                </p>
                <div className="pt-2 border-t text-[11px] space-y-1">
                  <div>
                    <b>Infrastruktura:</b> GPZ Słupsk Wschód 110/15 kV, GPZ Przemysłowa.
                  </div>
                  <div>
                    <b>Potencjał:</b> Wysoki współczynnik generacji wiatrowej w stosunku do
                    lokalnego zużycia.
                  </div>
                </div>
              </div>

              {/* 5. USTKA */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base text-primary">5. Ustka</h4>
                  <Badge variant="secondary">Zapotrzebowanie: ~75 MW</Badge>
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <AnchorIcon className="w-3.5 h-3.5 text-cyan-600" />
                  Port Serwisowy Morskich Farm Wiatrowych (Offshore)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ustka przekształca się w strategiczny port serwisowy dla obsługi morskich farm
                  wiatrowych na Bałtyku (Offshore Wind). Sieć energetyczna miasta została
                  zmodernizowana przez GPZ Ustka Przewłoka, wspierając bazę operacyjno-serwisową i
                  stacje szybkiego ładowania jednostek pływających.
                </p>
                <div className="pt-2 border-t text-[11px] space-y-1">
                  <div>
                    <b>Rola:</b> Hub logistyczny i serwisowy OZE dla morskiego wiatru.
                  </div>
                  <div>
                    <b>Specyfika:</b> Silny sezonowy wzrost zapotrzebowania w miesiącach letnich.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AnchorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}
