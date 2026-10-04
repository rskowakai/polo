import { WeatherPanel } from '@/components/weather/WeatherPanel';
import { BikeStationsCard } from './bikes/BikeStationsCard';
import { ChargingStationsCard } from './charging/ChargingStationsCard';
import { EnergyCard } from './EnergyCard';

export const ExperimentsPanel = () => {
  return (
    <div className="space-y-6">
      <WeatherPanel />
      <EnergyCard />
      <ChargingStationsCard />
      <BikeStationsCard />
    </div>
  );
};
