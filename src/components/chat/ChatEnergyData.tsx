import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCompanyStore } from '@/components/CompanySidebar';
import { Card } from '@/components/ui/card';
import { companiesData } from '@/data/companies';

interface ChatEnergyDataProps {
  dataType: 'consumption' | 'production' | 'efficiency';
  title: string;
}

export function ChatEnergyData({ dataType, title }: ChatEnergyDataProps) {
  const { selectedCompanyId } = useCompanyStore();
  const selectedCompany = companiesData.find((company) => company.id === selectedCompanyId);

  const getDataColor = () => {
    switch (dataType) {
      case 'consumption':
        return '#ef4444';
      case 'production':
        return '#34d399';
      case 'efficiency':
        return '#60a5fa';
      default:
        return '#60a5fa';
    }
  };

  return (
    <Card className="w-full p-4 my-4">
      <h4 className="text-sm font-medium mb-4">{title}</h4>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={selectedCompany?.energyData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={dataType}
              stroke={getDataColor()}
              strokeWidth={2}
              dot={{ strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
