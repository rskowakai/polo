import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { companiesData } from '@/data/companies';
import { useToast } from '@/hooks/use-toast';
import { ChatInputSchema } from '@/lib/validation';
import { generateRAGResponse } from '@/utils/ragUtils';

export interface ActionButton {
  label: string;
  targetTab?: string;
  targetSection?: string;
  url?: string;
  icon?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  dataVisualizations?: Array<{
    type: 'consumption' | 'production' | 'efficiency';
    title: string;
  }>;
  actionButtons?: ActionButton[];
}

const getDashboardValue = (
  query: string
): {
  text: string;
  visualizations?: Message['dataVisualizations'];
  actionButtons?: ActionButton[];
} => {
  const q = query.toLowerCase();

  // 1. MAPA SIECI & GPZ
  if (
    q.includes('mapa') ||
    q.includes('gpz') ||
    q.includes('stacj') ||
    q.includes('sieci') ||
    q.includes('przesyłow')
  ) {
    return {
      text: 'Mapa Sieci Elektroenergetycznej zawiera wszystkie stacje pomiarowe GPZ 110/15kV, elektrownie OZE, magazyny BESS oraz węzły miast Polski z otwartą telemetrią. Możesz też przejść do Generatora Diagramów (SLD).',
      actionButtons: [
        { label: '📍 Otwórz Mapę Sieci', targetTab: 'spaces', targetSection: 'network-map' },
        {
          label: '⚡ Diagramy & SLD 110/15kV',
          targetTab: 'spaces',
          targetSection: 'network-diagrams',
        },
        { label: '🌐 Otwarte Dane PSE (KSE)', url: 'https://www.pse.pl/dane-systemowe' },
      ],
    };
  }

  // 2. STACJE ŁADOWANIA EV (EUROPA / POLSKA / POMORZE)
  if (
    q.includes('ładowan') ||
    q.includes('ladowan') ||
    q.includes('ev') ||
    q.includes('samochód') ||
    q.includes('samochod') ||
    q.includes('hpc') ||
    q.includes('auto')
  ) {
    return {
      text: 'Moduł Infrastruktury Stacji Ładowania EV obejmuje 3 poziomy hierarchii: porównanie krajów Europy, 16 województw Polski oraz szczegółowe lokalizacje hubów HPC (do 350 kW) w 5 miastach Pomorza (Gdańsk, Gdynia, Sopot, Słupsk, Ustka).',
      actionButtons: [
        { label: '🔌 Otwórz Stacje Ładowania EV', targetTab: 'charging' },
        { label: '📍 Huby HPC Pomorze (5 Miast)', targetTab: 'charging' },
        { label: '🌐 Obserwatorium Europejskie EAFO', url: 'https://eafo.eu' },
      ],
    };
  }

  // 3. KOMPENDIUM WIEDZY & 5 MIAST
  if (
    q.includes('kompendium') ||
    q.includes('wiedzy') ||
    q.includes('wyjaśnij') ||
    q.includes('co to') ||
    q.includes('miast') ||
    q.includes('gdańsk') ||
    q.includes('gdynia') ||
    q.includes('sopot') ||
    q.includes('słupsk') ||
    q.includes('ustka')
  ) {
    return {
      text: 'W Kompendium Wiedzy znajdziesz infografiki wyjaśniające działanie stacji GPZ, Bliźniaka Cyfrowego, magazynów BESS, DSR, standardów IEC 61850 oraz szczegółową charakterystykę energetyczną 5 miast projektu.',
      actionButtons: [
        { label: '📚 Otwórz Kompendium Wiedzy', targetTab: 'knowledge' },
        { label: '🏙️ Profile 5 Miast Pomorza', targetTab: 'knowledge' },
      ],
    };
  }

  // 4. KOSZTORYS & BIZNESPLAN
  if (
    q.includes('koszt') ||
    q.includes('rbh') ||
    q.includes('roboczogodzin') ||
    q.includes('cen') ||
    q.includes('pracodawc') ||
    q.includes('inwestor') ||
    q.includes('biznes')
  ) {
    return {
      text: 'Przygotowaliśmy wstępny kosztorys w roboczogodzinach (RBH) z podziałem na role (Architekt, Frontend, IoT, Data Science, QA) oraz poradnik prowadzenia biznesu EnergyTech z modelami SaaS i finansowaniem.',
      actionButtons: [
        { label: '💼 Otwórz Kosztorys w RBH', targetTab: 'business' },
        { label: '📈 Poradnik Biznesowy EnergyTech', targetTab: 'business' },
      ],
    };
  }

  // 5. DYSK W CHMURZE & PLIKI
  if (
    q.includes('dysk') ||
    q.includes('chmur') ||
    q.includes('plik') ||
    q.includes('upload') ||
    q.includes('wgraj') ||
    q.includes('dokument')
  ) {
    return {
      text: 'Wirtualny Dysk w Chmurze pozwala na bezpieczne przechowywanie, pobieranie i podgląd plików (PDF, CSV, XLSX, JSON) oraz ich natychmiastowe przesyłanie do analizy przez asystenta AI.',
      actionButtons: [
        { label: '☁️ Otwórz Dysk w Chmurze', targetTab: 'cloud' },
        { label: '📁 Wgraj Nowy Plik', targetTab: 'cloud' },
      ],
    };
  }

  // 6. PRYWATNY BACKLOG
  if (
    q.includes('backlog') ||
    q.includes('zadania') ||
    q.includes('funkcjonalnośc') ||
    q.includes('plan') ||
    q.includes('kanban')
  ) {
    return {
      text: 'Prywatny Backlog to interaktywna tablica Kanban z zadaniami do wdrożenia, szacunkami RBH, filtrami i możliwością dodawania własnych zgłoszeń z zapisem lokalnym.',
      actionButtons: [{ label: '📋 Otwórz Prywatny Backlog', targetTab: 'backlog' }],
    };
  }

  // 7. PANEL ADMINISTRACYJNY, SSO & UPRAWNIENIA
  if (
    q.includes('admin') ||
    q.includes('sso') ||
    q.includes('użytkownik') ||
    q.includes('uprawnien') ||
    q.includes('rola') ||
    q.includes('konto') ||
    q.includes('logowan')
  ) {
    return {
      text: 'Panel Administracyjny & SSO umożliwia logowanie jednokrotne (Google, GitHub, Enterprise SAML/OIDC) oraz natychmiastowy test ról: Gość (tylko odczyt), Operator (sterowanie i eksport) oraz Administrator.',
      actionButtons: [{ label: '🛡️ Panel Uprawnień & SSO', targetTab: 'admin' }],
    };
  }

  // 8. OTWARTE API & INTERNET SEARCH
  if (
    q.includes('api') ||
    q.includes('otwart') ||
    q.includes('darmow') ||
    q.includes('open-meteo') ||
    q.includes('pse') ||
    q.includes('gios') ||
    q.includes('internet') ||
    q.includes('szukaj')
  ) {
    return {
      text: 'Projekt integruje 8 darmowych, otwartych interfejsów API dla Pomorza i Polski: PSE Open Data, Open-Meteo Solar & Wind, GIOŚ, ARMAAG Trójmiasto, Otwarte Dane Gdańsk oraz ENTSO-E.',
      actionButtons: [
        { label: '🌐 Katalog Otwartych API Pomorza', targetTab: 'integrations' },
        { label: '☀️ Darmowe API Open-Meteo', url: 'https://open-meteo.com/en/docs' },
        { label: '📊 Otwarte Dane PSE', url: 'https://www.pse.pl/dane-systemowe' },
      ],
    };
  }

  // 9. BLIŹNIAK CYFROWY 3D
  if (
    q.includes('bliźniak') ||
    q.includes('blizniak') ||
    q.includes('digital twin') ||
    q.includes('polo') ||
    q.includes('3d')
  ) {
    return {
      text: 'Bliźniak Cyfrowy 3D (Polo 3.0) wizualizuje stację energetyczną w WebGL Three.js z animowanymi cyberpunktami i analizą wibracyjno-termiczną transformatora.',
      actionButtons: [{ label: '✨ Otwórz Bliźniak Cyfrowy 3D', targetTab: 'innovation' }],
    };
  }

  // 10. SAMOUCZEK
  if (
    q.includes('samouczek') ||
    q.includes('pomoc') ||
    q.includes('przewodnik') ||
    q.includes('tutorial')
  ) {
    return {
      text: 'Możesz w każdej chwili uruchomić ulepszony samouczek strony, który krok po kroku zaprezentuje wszystkie moduły systemu monitoringu.',
      actionButtons: [{ label: '🎓 Uruchom Samouczek Strony', targetSection: 'trigger-tutorial' }],
    };
  }

  // Check for visualization requests
  if (q.includes('zużycie') || q.includes('zuzycie')) {
    return {
      text: 'Oto wykres zużycia energii w czasie dla monitorowanych obiektów:',
      visualizations: [{ type: 'consumption', title: 'Zużycie energii' }],
      actionButtons: [
        { label: '📊 Zobacz Wykresy Energii', targetTab: 'spaces', targetSection: 'energy-chart' },
      ],
    };
  }

  if (q.includes('produkcja')) {
    return {
      text: 'Oto wykres produkcji energii w czasie:',
      visualizations: [{ type: 'production', title: 'Produkcja energii' }],
      actionButtons: [
        { label: '📊 Zobacz Wykresy Energii', targetTab: 'spaces', targetSection: 'energy-chart' },
      ],
    };
  }

  if (q.includes('wydajność') || q.includes('wydajnosc')) {
    return {
      text: 'Oto wykres wydajności transformatorów i sieci w czasie:',
      visualizations: [{ type: 'efficiency', title: 'Wydajność' }],
      actionButtons: [
        { label: '⚡ Zobacz Status Urządzeń', targetTab: 'spaces', targetSection: 'device-status' },
      ],
    };
  }

  const matchingStat = companiesData[0]?.stats.find((stat) => {
    const title = stat.title.toLowerCase();
    return q.includes(title);
  });

  if (matchingStat) {
    return {
      text: `${matchingStat.title}: ${matchingStat.value}${matchingStat.unit ? ' ' + matchingStat.unit : ''} (${matchingStat.description})`,
      actionButtons: [
        { label: '📍 Otwórz Mapę Sieci', targetTab: 'spaces', targetSection: 'network-map' },
      ],
    };
  }

  return {
    text: 'Nie znalazłem bezpośredniej odpowiedzi na to pytanie, ale możesz skorzystać z poniższych skrótów nawigacyjnych do głównych sekcji portalu:',
    actionButtons: [
      { label: '📍 Mapa Sieci & GPZ', targetTab: 'spaces', targetSection: 'network-map' },
      { label: '🔌 Stacje Ładowania EV', targetTab: 'charging' },
      { label: '📚 Kompendium Wiedzy', targetTab: 'knowledge' },
      { label: '💼 Kosztorys (RBH)', targetTab: 'business' },
      { label: '☁️ Dysk w Chmurze', targetTab: 'cloud' },
    ],
  };
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Witaj! Jestem inteligentnym asystentem sieci elektroenergetycznej Pomorza. Zapytaj mnie o dowolne zagadnienie (np. "gdzie jest mapa sieci?", "pokaż stacje ładowania", "ile wynosi kosztorys w roboczogodzinach?"), a wyświetlę szczegółowe wyjaśnienie wraz z bezpośrednimi przyciskami nawigacyjnymi.',
      timestamp: new Date(),
      actionButtons: [
        { label: '📍 Mapa Sieci & GPZ', targetTab: 'spaces', targetSection: 'network-map' },
        { label: '🔌 Stacje Ładowania EV', targetTab: 'charging' },
        { label: '📚 Kompendium Wiedzy', targetTab: 'knowledge' },
        { label: '💼 Kosztorys (RBH)', targetTab: 'business' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const clearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Witaj! Konwersacja została zresetowana. W czym mogę pomóc?',
        timestamp: new Date(),
        actionButtons: [
          { label: '📍 Mapa Sieci & GPZ', targetTab: 'spaces', targetSection: 'network-map' },
          { label: '🔌 Stacje Ładowania EV', targetTab: 'charging' },
        ],
      },
    ]);
    toast({
      title: 'Konwersacja wyczyszczona',
      description: 'Historia czatu została zresetowana.',
    });
  };

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (input: string) => {
      const dashboardValue = getDashboardValue(input);
      if (dashboardValue.text !== 'Nie znalazłem tej informacji w panelu.') {
        return dashboardValue;
      }
      const response = await generateRAGResponse(input);
      return { text: response, actionButtons: dashboardValue.actionButtons };
    },
    onSuccess: (response) => {
      const newMessage: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        dataVisualizations: response.visualizations,
        actionButtons: response.actionButtons,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    onError: () => {
      toast({
        title: 'Błąd asystenta',
        description: 'Nie udało się przetworzyć wiadomości.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessage(input);
    setInput('');
  };

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isPending,
    clearConversation,
  };
};
