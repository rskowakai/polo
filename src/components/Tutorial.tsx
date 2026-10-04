import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe2,
  CircuitBoard,
  Cpu,
  BatteryCharging,
  Bot,
  Cloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const tutorialSteps = [
  {
    step: 1,
    title: 'Witaj w Portalu Smart Grid Pomorza',
    subtitle: 'Nowoczesny system monitorowania infrastruktury elektroenergetycznej',
    icon: Globe2,
    badge: 'Krok 1 z 6',
    description:
      'Aplikacja łączy dane telemetryczne z 5 miast Pomorza (Gdańsk, Gdynia, Sopot, Słupsk, Ustka) oraz węzłów KSE w całej Polsce. Wykorzystuje w 100% darmowe, otwarte źródła online (Open-Meteo, PSE, GIOŚ).',
  },
  {
    step: 2,
    title: 'Interaktywna Mapa Sieci & Schematy SLD',
    subtitle: 'Monitoring GPZ 110/15kV i korytarzy przesyłowych 400/220kV',
    icon: CircuitBoard,
    badge: 'Krok 2 z 6',
    description:
      'W zakładce "Przestrzenie" znajdziesz mapę Polski i Pomorza ze stacjami pomiarowymi oraz Generator Diagramów Sieciowych: Schemat Jednokreskowy (SLD) z klikalnymi wyłącznikami Q0, diagram miksu wytwórczego i dobowy profil OZE.',
  },
  {
    step: 3,
    title: 'Bliźniak Cyfrowy 3D (Polo 3.0)',
    subtitle: 'Wirtualna trójwymiarowa stacja w WebGL / Three.js',
    icon: Cpu,
    badge: 'Krok 3 z 6',
    description:
      'W zakładce "Polo 3.0 & Digital Twin 3D" możesz wejść w interakcję z modelem transformatora, stacji ładowania EV oraz magazynu energii z animowanymi cyberpunktami i analizą predykcyjną.',
  },
  {
    step: 4,
    title: 'Infrastruktura Stacji Ładowania EV',
    subtitle: 'Hierarchia: Europa → Polska (16 Województw) → Pomorze (5 Miast)',
    icon: BatteryCharging,
    badge: 'Krok 4 z 6',
    description:
      'Przeglądaj stacje ładowania pojazdów elektrycznych na 3 poziomach: porównanie krajów Europy, stan 16 województw Polski oraz szczegółowe lokalizacje hubów HPC (do 350 kW) w 5 miastach Pomorza.',
  },
  {
    step: 5,
    title: 'Asystent AI z Bezpośrednimi Odsyłaczami',
    subtitle: 'Interaktywne przyciski nawigacji w oknie czatu',
    icon: Bot,
    badge: 'Krok 5 z 6',
    description:
      'Zapytaj asystenta o dowolne zagadnienie (np. "gdzie jest mapa sieci?", "pokaż stacje ładowania", "ile wynosi kosztorys?"), a asystent wygeneruje przyciski akcji, które natychmiast przeniosą Cię do właściwej sekcji!',
  },
  {
    step: 6,
    title: 'Dysk w Chmurze, Kompendium & Kosztorys',
    subtitle: 'Wszystkie narzędzia inżynierskie i biznesowe w jednym miejscu',
    icon: Cloud,
    badge: 'Krok 6 z 6',
    description:
      'Wgrywaj pliki do wirtualnego dysku, zapoznaj się z infografikami w Kompendium Wiedzy, sprawdź wycenę w roboczogodzinach (RBH) w Kosztorysie oraz zarządzaj zadaniami w Prywatnym Backlogu.',
  },
];

export function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial_v2');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }

    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('openSmartGridTutorial', handleOpen as EventListener);
    return () => {
      window.removeEventListener('openSmartGridTutorial', handleOpen as EventListener);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      localStorage.setItem('hasSeenTutorial_v2', 'true');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenTutorial_v2', 'true');
  };

  const StepIcon = tutorialSteps[currentStep].icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg p-6 bg-card border shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/5 text-xs font-mono"
            >
              {tutorialSteps[currentStep].badge}
            </Badge>
            <div className="flex gap-1">
              {tutorialSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold leading-tight">
                {tutorialSteps[currentStep].title}
              </DialogTitle>
              <div className="text-xs text-primary font-medium mt-0.5">
                {tutorialSteps[currentStep].subtitle}
              </div>
            </div>
          </div>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
            {tutorialSteps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row items-center justify-between pt-6 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-xs text-muted-foreground"
          >
            Pomiń samouczek
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Wstecz
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="text-xs gap-1">
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Zakończ i przejdź do aplikacji
                </>
              ) : (
                <>
                  Dalej
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
