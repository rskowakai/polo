import L from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  CircuitBoard,
  Gauge,
  Globe,
  Signal,
  Sun,
  Wind,
  Battery,
  ShieldAlert,
  SlidersHorizontal,
  Layers,
  MapPin,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ALL_MEASUREMENT_STATIONS,
  CITY_GRID_PROFILES,
  TRANSMISSION_LINES,
  MeasurementStation,
  CityGridProfile,
} from '@/data/networkStations';
import { NetworkDiagrams } from './NetworkDiagrams';

export function NetworkMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const linesRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'gpz' | 'renewable' | 'environmental' | 'bess' | 'cities'
  >('all');
  const [selectedStation, setSelectedStation] = useState<MeasurementStation | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityGridProfile | null>(null);
  const [showDiagrams, setShowDiagrams] = useState<boolean>(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Center map on Poland (Warszawa / Łódź latitude/longitude)
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([52.2, 19.3], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | PSE & GIOŚ Open Data',
        maxZoom: 18,
      }).addTo(map.current);

      markersRef.current = L.layerGroup().addTo(map.current);
      linesRef.current = L.layerGroup().addTo(map.current);
    }

    renderMapLayers();

    return () => {
      // Keep map instance across renders or cleanup on unmount
    };
  }, []);

  useEffect(() => {
    renderMapLayers();
  }, [activeFilter]);

  const renderMapLayers = () => {
    if (!map.current || !markersRef.current || !linesRef.current) return;

    markersRef.current.clearLayers();
    linesRef.current.clearLayers();

    // 1. Draw Transmission Lines (Linie Przesyłowe 400kV i 220kV)
    TRANSMISSION_LINES.forEach((line) => {
      const is400kV = line.voltageKv === 400;
      const poly = L.polyline([line.fromCoords, line.toCoords], {
        color: is400kV ? '#ef4444' : '#3b82f6',
        weight: is400kV ? 3.5 : 2.5,
        opacity: 0.75,
        dashArray: is400kV ? undefined : '6, 6',
      });

      poly.bindPopup(`
        <div class="p-2 text-xs">
          <div class="font-bold text-sm text-slate-900">${line.name}</div>
          <div class="text-slate-600 mt-1">Zdolność przesyłowa: <b>${line.capacityMw} MW</b></div>
          <div class="text-slate-600">Przepływ chwilowy: <b>${line.currentFlowMw} MW</b></div>
          <div class="text-slate-600">Obciążenie linii: <b class="${line.loadPct > 75 ? 'text-amber-600' : 'text-emerald-600'}">${line.loadPct}%</b></div>
        </div>
      `);

      linesRef.current?.addLayer(poly);
    });

    // 2. Draw Measurement Stations
    const stationsToRender = ALL_MEASUREMENT_STATIONS.filter((s) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'cities') return false;
      return s.category === activeFilter;
    });

    stationsToRender.forEach((station) => {
      const getBgColor = () => {
        if (station.category === 'gpz') return '#dc2626'; // red
        if (station.category === 'renewable') return '#0284c7'; // cyan/blue
        if (station.category === 'bess') return '#9333ea'; // purple
        return '#16a34a'; // green
      };

      const iconLabel = () => {
        if (station.category === 'gpz') return 'GPZ';
        if (station.category === 'renewable') return 'OZE';
        if (station.category === 'bess') return 'BESS';
        return 'GIOŚ';
      };

      const customIcon = L.divIcon({
        className: 'bg-transparent',
        html: `
          <div class="relative group cursor-pointer">
            <div style="background-color: ${getBgColor()}" class="w-7 h-7 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
              ${iconLabel()}
            </div>
            <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${
              station.status === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'
            } border border-white"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(station.position, { icon: customIcon });

      marker.bindPopup(`
        <div class="p-2 text-xs min-w-[200px]">
          <div class="font-bold text-sm text-slate-900">${station.name}</div>
          <div class="text-slate-500 mb-1.5">${station.city}, woj. ${station.voivodeship}</div>
          <div class="border-t pt-1.5 space-y-1 text-slate-700">
            <div>Poziom napięcia: <b>${station.voltageLevel}</b></div>
            <div>Napięcie pomiarowe: <b>${station.lastTelemetry.voltageKv} kV</b></div>
            <div>Prąd obciążenia: <b>${station.lastTelemetry.currentA} A</b></div>
            <div>Moc czynna P: <b>${station.lastTelemetry.activePowerMw} MW</b></div>
            <div>Współczynnik cos φ: <b>${station.lastTelemetry.cosPhi}</b></div>
            <div>Obciążenie transformatora: <b class="${station.lastTelemetry.transformerLoadingPct > 80 ? 'text-amber-600' : 'text-emerald-600'}">${station.lastTelemetry.transformerLoadingPct}%</b></div>
            ${
              station.lastTelemetry.environmental
                ? `<div class="mt-1 pt-1 border-t text-emerald-700 font-medium">PM2.5: ${station.lastTelemetry.environmental.pm25} µg/m³ | CO₂: ${station.lastTelemetry.environmental.co2Ppm} ppm</div>`
                : ''
            }
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedStation(station);
        setSelectedCity(null);
      });

      markersRef.current?.addLayer(marker);
    });

    // 3. Draw City Profiles Nodes ("strój miast")
    if (activeFilter === 'all' || activeFilter === 'cities') {
      CITY_GRID_PROFILES.forEach((city) => {
        const cityIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div class="relative cursor-pointer">
              <div class="bg-amber-500/90 text-slate-950 px-2 py-0.5 rounded-md shadow-md border-2 border-slate-900 font-bold text-[10px] whitespace-nowrap flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                ${city.name} (${city.currentDemandMw} MW)
              </div>
            </div>
          `,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        const cityMarker = L.marker(city.position, { icon: cityIcon });

        cityMarker.bindPopup(`
          <div class="p-2 text-xs min-w-[220px]">
            <div class="font-bold text-sm text-slate-900">${city.name} — Węzeł Miejski</div>
            <div class="text-slate-500 mb-1.5">Rola: <b>${city.role}</b></div>
            <div class="border-t pt-1.5 space-y-1 text-slate-700">
              <div>Bieżące zapotrzebowanie: <b class="text-amber-600">${city.currentDemandMw} MW</b> (Szczyt: ${city.peakDemandMw} MW)</div>
              <div>Generacja lokalna OZE: <b class="text-emerald-600">${city.renewableGenerationMw} MW</b></div>
              <div>Liczba stacji GPZ/SN: <b>${city.substationsCount} stacji</b></div>
              <div>Niezawodność SAIDI: <b>${city.reliabilitySaidiMin} min/rok</b></div>
              <div>Magazyny energii BESS: <b>${city.bessCapacityMwh} MWh</b></div>
              <div class="mt-1 pt-1 border-t text-emerald-700 font-semibold">
                Jakość powietrza: ${city.sensorsSummary.airQualityIndex} (${city.sensorsSummary.co2Ppm} ppm CO₂)
              </div>
            </div>
          </div>
        `);

        cityMarker.on('click', () => {
          setSelectedCity(city);
          setSelectedStation(null);
        });

        markersRef.current?.addLayer(cityMarker);
      });
    }
  };

  const resetView = (coords: [number, number], zoom = 11) => {
    map.current?.setView(coords, zoom);
  };

  return (
    <div className="grid gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Monitor Sieci Elektroenergetycznej i Stacji Pomiarowych
            </h2>
            <Globe
              className="w-5 h-5 text-primary animate-spin"
              style={{ animationDuration: '6s' }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Wszystkie stacje pomiarowe GPZ 110/15kV, OZE, GIOŚ oraz węzły miast Polski z otwartymi
            danymi telemetrii.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>KSE: 50.00 Hz | Nominalna</span>
          </Badge>
          <Button
            variant={showDiagrams ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDiagrams(!showDiagrams)}
            className="gap-1.5"
          >
            <CircuitBoard className="w-4 h-4" />
            <span>{showDiagrams ? 'Ukryj Diagramy' : 'Pokaż Diagramy'}</span>
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2 rounded-lg border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtruj obiekty:
        </span>

        <Button
          variant={activeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setActiveFilter('all')}
        >
          Wszystkie ({ALL_MEASUREMENT_STATIONS.length + CITY_GRID_PROFILES.length})
        </Button>
        <Button
          variant={activeFilter === 'gpz' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setActiveFilter('gpz')}
        >
          <CircuitBoard className="w-3 h-3 text-red-500" />
          Stacje GPZ 110/15kV ({ALL_MEASUREMENT_STATIONS.filter((s) => s.category === 'gpz').length}
          )
        </Button>
        <Button
          variant={activeFilter === 'renewable' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setActiveFilter('renewable')}
        >
          <Wind className="w-3 h-3 text-cyan-500" />
          Farmy OZE ({ALL_MEASUREMENT_STATIONS.filter((s) => s.category === 'renewable').length})
        </Button>
        <Button
          variant={activeFilter === 'cities' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setActiveFilter('cities')}
        >
          <MapPin className="w-3 h-3 text-amber-500" />
          Węzły Miast ({CITY_GRID_PROFILES.length})
        </Button>
        <Button
          variant={activeFilter === 'environmental' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setActiveFilter('environmental')}
        >
          <Gauge className="w-3 h-3 text-emerald-500" />
          Stacje GIOŚ/IMGW (
          {ALL_MEASUREMENT_STATIONS.filter((s) => s.category === 'environmental').length})
        </Button>
        <Button
          variant={activeFilter === 'bess' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setActiveFilter('bess')}
        >
          <Battery className="w-3 h-3 text-purple-500" />
          Magazyny BESS
        </Button>

        <div className="ml-auto hidden xl:flex items-center gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => resetView([54.37, 18.63], 10)}
          >
            Trójmiasto
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => resetView([52.23, 21.01], 10)}
          >
            Warszawa
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => resetView([50.06, 19.94], 10)}
          >
            Kraków
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => resetView([52.2, 19.3], 6)}
          >
            Polska (Całość)
          </Button>
        </div>
      </div>

      {/* MAP VIEWPORT & REAL-TIME SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 relative h-[520px] overflow-hidden border shadow-sm">
          <div ref={mapContainer} className="absolute inset-0 z-0" />

          {/* MAP OVERLAY LEGEND */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur border p-3 rounded-lg shadow-lg text-xs space-y-1.5 max-w-[260px]">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Legenda Sieci KSE</span>
              <span className="text-[10px] text-muted-foreground font-mono">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
              <span>Stacja GPZ 110/15 kV / SE 400 kV</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
              <span>Generacja OZE (Wiatr & PV)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
              <span>Magazyn Energii BESS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span>Stacja Monitoringu GIOŚ / IMGW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-red-500 inline-block" />
              <span>Linia przesyłowa 400 kV</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t border-dashed border-blue-500 inline-block" />
              <span>Linia przesyłowa 220 kV</span>
            </div>
          </div>
        </Card>

        {/* SELECTED OBJECT TELEMETRY INSPECTION PANEL */}
        <Card className="border shadow-sm flex flex-col justify-between">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Panel Telemetrii Obiektu
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {selectedStation ? 'Stacja' : selectedCity ? 'Miasto' : 'Aktywny'}
              </Badge>
            </div>

            {selectedStation ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="text-[11px] text-muted-foreground">Nazwa stacji:</div>
                  <div className="font-bold text-sm text-foreground">{selectedStation.name}</div>
                  <div className="text-muted-foreground">
                    {selectedStation.city}, {selectedStation.voivodeship}
                  </div>
                </div>

                <div className="bg-muted/40 p-2.5 rounded border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Napięcie szyn:</span>
                    <span className="font-bold">{selectedStation.lastTelemetry.voltageKv} kV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prąd roboczy:</span>
                    <span className="font-bold">{selectedStation.lastTelemetry.currentA} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moc czynna P:</span>
                    <span className="font-bold text-primary">
                      {selectedStation.lastTelemetry.activePowerMw} MW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Współczynnik cos φ:</span>
                    <span className="font-bold">{selectedStation.lastTelemetry.cosPhi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Obciążenie TR:</span>
                    <span
                      className={`font-bold ${selectedStation.lastTelemetry.transformerLoadingPct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {selectedStation.lastTelemetry.transformerLoadingPct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zniekształcenia THD:</span>
                    <span className="font-bold">{selectedStation.lastTelemetry.thdPct}%</span>
                  </div>
                </div>

                {selectedStation.lastTelemetry.environmental && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] space-y-1">
                    <div className="font-semibold text-emerald-700">
                      Pomiary Jakości Powietrza (GIOŚ)
                    </div>
                    <div>
                      PM2.5: {selectedStation.lastTelemetry.environmental.pm25} µg/m³ (Norma: 25)
                    </div>
                    <div>
                      PM10: {selectedStation.lastTelemetry.environmental.pm10} µg/m³ (Norma: 50)
                    </div>
                    <div>CO₂: {selectedStation.lastTelemetry.environmental.co2Ppm} ppm</div>
                  </div>
                )}
              </div>
            ) : selectedCity ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="text-[11px] text-muted-foreground">Węzeł miejski:</div>
                  <div className="font-bold text-base text-foreground">{selectedCity.name}</div>
                  <div className="text-muted-foreground">
                    {selectedCity.role} ({selectedCity.voivodeship})
                  </div>
                </div>

                <div className="bg-muted/40 p-2.5 rounded border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zapotrzebowanie:</span>
                    <span className="font-bold text-primary">
                      {selectedCity.currentDemandMw} MW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moc szczytowa:</span>
                    <span className="font-bold">{selectedCity.peakDemandMw} MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generacja OZE:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedCity.renewableGenerationMw} MW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stacje GPZ / SN:</span>
                    <span className="font-bold">{selectedCity.substationsCount} stacji</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Obciążenie sieci:</span>
                    <span className="font-bold">{selectedCity.gridLoadPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Magazyny BESS:</span>
                    <span className="font-bold">{selectedCity.bessCapacityMwh} MWh</span>
                  </div>
                </div>

                <div className="p-2.5 bg-primary/10 border border-primary/20 rounded text-[11px] space-y-1">
                  <div className="font-semibold text-primary">Jakość Środowiska Miejskiego</div>
                  <div>
                    Indeks: <b>{selectedCity.sensorsSummary.airQualityIndex}</b>
                  </div>
                  <div>
                    Stężenie CO₂: <b>{selectedCity.sensorsSummary.co2Ppm} ppm</b>
                  </div>
                  <div>
                    Temperatura: <b>{selectedCity.sensorsSummary.temp} °C</b>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>
                  Kliknij w dowolną stację pomiarową lub węzeł miasta na mapie, aby wyświetlić
                  szczegółową telemetrię.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GENERATED DIAGRAMS SECTION */}
      {showDiagrams && (
        <div className="mt-4">
          <NetworkDiagrams />
        </div>
      )}
    </div>
  );
}
