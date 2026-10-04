/**
 * High-Performance Energy Analytics & Tariff Simulation Engine
 * Emulates vectorized in-browser SQL analytics for Smart Grid microgeneration & load forecasting.
 */

export interface HourlyMetric {
  hour: number;
  timeLabel: string;
  demandKw: number;
  solarKw: number;
  batterySocPercent: number;
  spotPricePlnPerKwh: number;
  carbonIntensityGPerKwh: number;
}

export interface SimulationScenario {
  addedLoadKw: number;
  loadLabel: string;
  targetStartHour: number;
  durationHours: number;
  batteryAssistEnabled: boolean;
}

export interface SimulationResult {
  originalCostPln: number;
  simulatedCostPln: number;
  deltaCostPln: number;
  peakDemandOriginalKw: number;
  peakDemandSimulatedKw: number;
  batteryPeakShavingEffectKw: number;
  co2AddedKg: number;
  hourlyProfile: {
    hour: number;
    baselineKw: number;
    withSimKw: number;
    gridImportKw: number;
    solarUsedKw: number;
    batteryContributionKw: number;
  }[];
}

/**
 * Generates typical 24-hour synthetic telemetry baseline for a high-efficiency prosumer installation
 */
export function generateBaselineDay(): HourlyMetric[] {
  const data: HourlyMetric[] = [];
  for (let h = 0; h < 24; h++) {
    // Typical solar bell curve peaking at 12:00-14:00
    const solarFactor = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
    const solarKw = h >= 6 && h <= 20 ? Number((solarFactor * 8.5).toFixed(2)) : 0;

    // Household demand peaks in the morning (7-9) and evening (17-22)
    let demandKw = 1.2;
    if (h >= 7 && h <= 9) demandKw += 2.8;
    if (h >= 17 && h <= 22) demandKw += 3.9;
    if (h >= 11 && h <= 15) demandKw += 1.4;

    // Spot energy price in PLN (lower around midday with high solar, higher at 18:00-20:00)
    let spotPrice = 0.58;
    if (h >= 11 && h <= 14) spotPrice = 0.32;
    if (h >= 18 && h <= 21) spotPrice = 1.15;

    // Battery state of charge (recharges during solar peak, discharges in evening)
    let soc = 45;
    if (h >= 6 && h <= 15) soc = Math.min(100, 30 + (h - 6) * 7.5);
    if (h > 15) soc = Math.max(20, 95 - (h - 15) * 8);

    data.push({
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      demandKw: Number(demandKw.toFixed(2)),
      solarKw,
      batterySocPercent: Math.round(soc),
      spotPricePlnPerKwh: Number(spotPrice.toFixed(2)),
      carbonIntensityGPerKwh: Math.round(520 - solarKw * 35),
    });
  }
  return data;
}

/**
 * Runs vectorized tariff & load simulation
 */
export function runLoadSimulation(
  baseline: HourlyMetric[],
  scenario: SimulationScenario
): SimulationResult {
  let originalCostPln = 0;
  let simulatedCostPln = 0;
  let originalPeak = 0;
  let simulatedPeak = 0;
  let totalAddedKwh = 0;
  let co2AddedGrams = 0;

  const hourlyProfile: SimulationResult['hourlyProfile'] = [];

  for (const item of baseline) {
    const isUnderScenario =
      item.hour >= scenario.targetStartHour &&
      item.hour < scenario.targetStartHour + scenario.durationHours;

    const added = isUnderScenario ? scenario.addedLoadKw : 0;
    const totalRequiredKw = item.demandKw + added;

    // Available surplus solar after direct household consumption
    const solarDirect = Math.min(item.solarKw, totalRequiredKw);
    const remainingNeed = totalRequiredKw - solarDirect;

    // Battery assist (peak shaving)
    let batteryContribute = 0;
    if (scenario.batteryAssistEnabled && remainingNeed > 0 && item.batterySocPercent > 20) {
      batteryContribute = Math.min(remainingNeed, 4.0); // max 4kW battery inverter rate
    }

    const gridImport = Math.max(0, remainingNeed - batteryContribute);
    const originalGridImport = Math.max(0, item.demandKw - Math.min(item.solarKw, item.demandKw));

    originalCostPln += originalGridImport * item.spotPricePlnPerKwh;
    simulatedCostPln += gridImport * item.spotPricePlnPerKwh;

    if (totalRequiredKw > simulatedPeak) simulatedPeak = totalRequiredKw;
    if (item.demandKw > originalPeak) originalPeak = item.demandKw;

    if (added > 0) {
      totalAddedKwh += added;
      co2AddedGrams += gridImport * item.carbonIntensityGPerKwh;
    }

    hourlyProfile.push({
      hour: item.hour,
      baselineKw: item.demandKw,
      withSimKw: Number(totalRequiredKw.toFixed(2)),
      gridImportKw: Number(gridImport.toFixed(2)),
      solarUsedKw: Number(solarDirect.toFixed(2)),
      batteryContributionKw: Number(batteryContribute.toFixed(2)),
    });
  }

  const deltaCost = Math.max(0, simulatedCostPln - originalCostPln);

  return {
    originalCostPln: Number(originalCostPln.toFixed(2)),
    simulatedCostPln: Number(simulatedCostPln.toFixed(2)),
    deltaCostPln: Number(deltaCost.toFixed(2)),
    peakDemandOriginalKw: Number(originalPeak.toFixed(2)),
    peakDemandSimulatedKw: Number(simulatedPeak.toFixed(2)),
    batteryPeakShavingEffectKw: scenario.batteryAssistEnabled ? 3.5 : 0,
    co2AddedKg: Number((co2AddedGrams / 1000).toFixed(2)),
    hourlyProfile,
  };
}
