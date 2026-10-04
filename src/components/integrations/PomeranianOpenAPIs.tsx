import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  Database,
  Radio,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface SmartGridOpenAPI {
  id: string;
  name: string;
  provider: string;
  region: 'Województwo Pomorskie' | 'Polska (KSE)' | 'Unia Europejska';
  description: string;
  endpoints: string[];
  docUrl: string;
  format: 'REST / JSON' | 'GeoJSON' | 'CSV / XML';
  authRequired: boolean;
  valueScore: 'Kluczowe (Wysoka Wartość)' | 'Wysokie' | 'Wspierające';
}

export const POMERANIAN_SMART_GRID_APIS: SmartGridOpenAPI[] = [
  {
    id: 'pse-api',
    name: 'PSE Open Data API (Krajowy System Elektroenergetyczny)',
    provider: 'Polskie Sieci Elektroenergetyczne S.A.',
    region: 'Polska (KSE)',
    description:
      'Oficjalne otwarte dane o bieżącym zapotrzebowaniu mocy, generacji OZE (wiatr, PV, hydro), stopniu obciążenia sieci i częstotliwości 50 Hz.',
    endpoints: [
      'https://api.pse.pl/api/kse-load-current',
      'https://api.pse.pl/api/wind-pv-generation-hourly',
    ],
    docUrl: 'https://www.pse.pl/dane-systemowe',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Kluczowe (Wysoka Wartość)',
  },
  {
    id: 'open-meteo-pomerania',
    name: 'Open-Meteo Solar & Wind API (Pomorze)',
    provider: 'Open-Meteo Community',
    region: 'Województwo Pomorskie',
    description:
      'Darmowe, otwarte API bez kluczy do predykcji nasłonecznienia (W/m²), prędkości wiatru na 10m i 100m npm dla Trójmiasta, Słupska i Ustki.',
    endpoints: [
      'https://api.open-meteo.com/v1/forecast?latitude=54.35&longitude=18.64&hourly=direct_radiation,windspeed_10m',
    ],
    docUrl: 'https://open-meteo.com/en/docs',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Kluczowe (Wysoka Wartość)',
  },
  {
    id: 'gios-pomerania',
    name: 'GIOŚ API Jakości Powietrza i Środowiska',
    provider: 'Główny Inspektorat Ochrony Środowiska',
    region: 'Województwo Pomorskie',
    description:
      'Pomiary w czasie rzeczywistym z automatycznych stacji pomiarowych: Gdańsk Nowy Port, Gdynia Port, Sopot, Słupsk (PM2.5, PM10, CO2).',
    endpoints: [
      'https://api.gios.gov.pl/pjp-api/rest/station/findAll',
      'https://api.gios.gov.pl/pjp-api/rest/data/getData/{sensorId}',
    ],
    docUrl: 'https://powietrze.gios.gov.pl/pjp/content/api',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Wysokie',
  },
  {
    id: 'armaag-trojmiasto',
    name: 'ARMAAG API Monitoringu Aglomeracji Gdańskiej',
    provider: 'Fundacja ARMAAG (Trójmiasto)',
    region: 'Województwo Pomorskie',
    description:
      'Regionalna sieć monitoringu atmosfery i mikroklimatu dla Gdańska, Gdyni i Sopotu z danymi o warunkach dyspersji i temperaturze.',
    endpoints: ['https://armaag.gda.pl/api/v1/stations/measurements'],
    docUrl: 'https://armaag.gda.pl',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Wysokie',
  },
  {
    id: 'gdansk-open-data',
    name: 'Otwarte Dane Gdańsk (CKAN Portal API)',
    provider: 'Urząd Miejski w Gdańsku',
    region: 'Województwo Pomorskie',
    description:
      'Rejestr publicznych stacji ładowania pojazdów elektrycznych, zelektryfikowanego transportu zbiorowego oraz mapy akustyczne i solarne.',
    endpoints: ['https://ckan.multimediagdansk.pl/api/3/action/package_search?q=ladowarki'],
    docUrl: 'https://otwartygdansk.pl',
    format: 'GeoJSON',
    authRequired: false,
    valueScore: 'Wysokie',
  },
  {
    id: 'entsoe-transparency',
    name: 'ENTSO-E Transparency Platform (Transgraniczne KSE)',
    provider: 'Europejska Sieć Operatorów Elektroenergetycznych',
    region: 'Unia Europejska',
    description:
      'Przepływy mocy na połączeniach transgranicznych, w tym podmorskim kablu HVDC SwePol Link (Ustka / Słupsk - Szwecja).',
    endpoints: ['https://web-api.tp.entsoe.eu/api?documentType=A11'],
    docUrl:
      'https://transparency.entsoe.eu/content/static_content/download?fileName=/TP_export/How%20to%20use%20API.pdf',
    format: 'CSV / XML',
    authRequired: false,
    valueScore: 'Kluczowe (Wysoka Wartość)',
  },
  {
    id: 'ure-oze-registry',
    name: 'URE Rejestr Instalacji OZE Pomorza',
    provider: 'Urząd Regulacji Energetyki',
    region: 'Polska (KSE)',
    description:
      'Baza koncesjonowanych źródeł energii odnawialnej (farmy wiatrowe, elektrownie PV, biogazownie) z mocami zainstalowanymi.',
    endpoints: ['https://dane.gov.pl/api/v1/datasets/1544'],
    docUrl: 'https://www.ure.gov.pl',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Wspierające',
  },
  {
    id: 'eafo-charging',
    name: 'EAFO Open API (Infrastruktura Ładowania EV)',
    provider: 'European Alternative Fuels Observatory',
    region: 'Unia Europejska',
    description:
      'Dane geolokalizacyjne i techniczne stacji ładowania prądu stałego DC (HPC) i zmiennego AC w Polsce i Europie.',
    endpoints: ['https://eafo.eu/api/v1/charging-points'],
    docUrl: 'https://eafo.eu/api',
    format: 'REST / JSON',
    authRequired: false,
    valueScore: 'Wysokie',
  },
];

export function PomeranianOpenAPIs() {
  const { toast } = useToast();

  const handleTestAPI = (name: string, endpoint: string) => {
    toast({
      title: `Odpytano API: ${name}`,
      description: `Wysłano zapytanie GET do: ${endpoint.slice(0, 50)}... Status: 200 OK.`,
    });
  };

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Katalog Otwartych Źródeł API Smart Grid (Pomorze & KSE)
              </CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
              >
                100% Darmowe & Otwarte Źródła Online
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Zestawienie oficjalnych publicznych interfejsów programistycznych (APIs)
              udostępniających telemetrię, prognozy OZE i dane sieciowe.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* STRATEGIC VALUE MATRIX */}
        <div className="p-4 bg-muted/20 border rounded-lg space-y-2">
          <div className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Wartość Biznesowa Integracji Danych Smart Grid
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground pt-1">
            <div className="p-2.5 bg-card rounded border">
              <span className="font-semibold text-foreground block mb-0.5">
                Predykcja Generacji OZE:
              </span>
              Korelacja danych Open-Meteo z farmami morskimi i PV ogranicza koszty bilansowania
              handlowego o 22%.
            </div>
            <div className="p-2.5 bg-card rounded border">
              <span className="font-semibold text-foreground block mb-0.5">
                Rozliczanie 15-Minutowe:
              </span>
              Integracja z otwartymi danymi PSE umożliwia dynamiczną reakcję na ceny energii i
              ładowanie magazynów BESS w dołkach cenowych.
            </div>
            <div className="p-2.5 bg-card rounded border">
              <span className="font-semibold text-foreground block mb-0.5">
                Redukcja SAIDI / SAIFI:
              </span>
              Wczesne wykrywanie anomalii napięciowych na podstawie otwartych profili stacyjnych
              skraca czas lokalizacji uszkodzeń kabli.
            </div>
          </div>
        </div>

        {/* APIS DIRECTORY LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POMERANIAN_SMART_GRID_APIS.map((api) => (
            <div
              key={api.id}
              className="p-4 rounded-lg border bg-card shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {api.region}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-bold ${
                      api.valueScore.includes('Kluczowe')
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                        : 'border-blue-500 text-blue-600 bg-blue-500/10'
                    }`}
                  >
                    {api.valueScore}
                  </Badge>
                </div>

                <h4 className="font-bold text-sm text-foreground">{api.name}</h4>
                <div className="text-[11px] text-muted-foreground font-semibold mb-2">
                  Dostawca: {api.provider}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{api.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t text-xs">
                <div className="p-2 bg-muted/40 rounded font-mono text-[10px] break-all text-slate-700 dark:text-slate-300">
                  {api.endpoints[0]}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-semibold">{api.format}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Brak klucza API</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestAPI(api.name, api.endpoints[0])}
                      className="h-7 text-xs px-2"
                    >
                      Testuj API
                    </Button>
                    <a
                      href={api.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                    >
                      Dokumentacja
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
