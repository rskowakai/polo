import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button'; // Added this import
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchConsumptionForecast,
  fetchPowerData,
  fetchPowerForecast,
} from '@/utils/electricityApi';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import { ForecastSummary } from './components/ForecastSummary';
import { Header } from './components/Header';
import { LoadingState } from './components/LoadingState';
import { EUROPEAN_COUNTRIES } from './constants';
import { ForecastChart } from './ForecastChart';
import { ProductionChart } from './ProductionChart';

export function EnergyCard() {
  const [selectedCountry, setSelectedCountry] = useState(EUROPEAN_COUNTRIES[0]);
  const { toast } = useToast();

  const handleApiKeySet = () => {
    const apiKey = prompt('Please enter your Electricity Maps API key:');
    if (apiKey) {
      localStorage.setItem('ELECTRICITY_MAPS_API_KEY', apiKey);
      toast({
        title: 'API Key Saved',
        description: 'Your API key has been saved. Refreshing data...',
      });
      refetchAll();
    }
  };

  const {
    data: powerData,
    isLoading: isPowerLoading,
    error: powerError,
    refetch: refetchPower,
  } = useQuery({
    queryKey: ['power-data', selectedCountry.id],
    queryFn: () => fetchPowerData(selectedCountry.lat, selectedCountry.lon),
    refetchInterval: 300000,
  });

  const {
    data: productionForecast,
    isLoading: isProductionLoading,
    error: productionError,
    refetch: refetchProduction,
  } = useQuery({
    queryKey: ['production-forecast', selectedCountry.id],
    queryFn: () => fetchPowerForecast(selectedCountry.id),
    refetchInterval: 300000,
  });

  const {
    data: consumptionForecast,
    isLoading: isConsumptionLoading,
    error: consumptionError,
    refetch: refetchConsumption,
  } = useQuery({
    queryKey: ['consumption-forecast', selectedCountry.id],
    queryFn: () => fetchConsumptionForecast(selectedCountry.lat, selectedCountry.lon),
    refetchInterval: 300000,
  });

  const refetchAll = () => {
    refetchPower();
    refetchProduction();
    refetchConsumption();
  };

  if (!localStorage.getItem('ELECTRICITY_MAPS_API_KEY')) {
    return (
      <Card className="w-full">
        <ApiKeyPrompt onSetApiKey={handleApiKeySet} />
      </Card>
    );
  }

  const isLoading = isPowerLoading || isProductionLoading || isConsumptionLoading;
  const error = powerError || productionError || consumptionError;

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-red-500">Error loading energy data. Please check your API key.</div>
          <Button onClick={handleApiKeySet} className="mt-4">
            Update API Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  console.log('Production Forecast:', productionForecast);
  console.log('Consumption Forecast:', consumptionForecast);

  return (
    <Card className="w-full">
      <CardHeader>
        <Header
          powerData={powerData}
          selectedCountry={selectedCountry}
          onCountrySelect={(value) => {
            const country = EUROPEAN_COUNTRIES.find((c) => c.id === value);
            if (country) setSelectedCountry(country);
          }}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            {powerData && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Production</h3>
                <ProductionChart data={powerData.powerProductionBreakdown} />
              </div>
            )}
            {productionForecast && consumptionForecast && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Production vs Consumption Forecast</h3>
                <ForecastChart
                  productionForecast={productionForecast}
                  consumptionForecast={consumptionForecast}
                />
                <ForecastSummary
                  productionForecast={productionForecast}
                  consumptionForecast={consumptionForecast}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
