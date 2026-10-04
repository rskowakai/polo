import { closestCenter, DndContext } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { motion, useScroll, useTransform } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Sparkles,
  Zap,
  BookOpen,
  Calculator,
  Cloud,
  ListTodo,
  ShieldCheck,
  GraduationCap,
  Activity,
  Layers,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { CompanyAnalysis } from '@/components/analysis/CompanyAnalysis';
import { Chatbot } from '@/components/Chatbot';
import { CompanySidebar } from '@/components/CompanySidebar';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { EnergyChart } from '@/components/dashboard/EnergyChart';
import { PowerStats } from '@/components/dashboard/PowerStats';
import { InnovationLab } from '@/components/digitaltwin/InnovationLab';
import { ExperimentsPanel } from '@/components/experiments/ExperimentsPanel';
import { FileUpload } from '@/components/FileUpload';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import { IntegrationsPanel } from '@/components/integrations/IntegrationsPanel';
import { LanguageSelector } from '@/components/LanguageSelector';
import EnergyMap from '@/components/map/EnergyMap';
import { DeviceStatus } from '@/components/network/DeviceStatus';
import { FailureAnalysis } from '@/components/network/FailureAnalysis';
import { NetworkMap } from '@/components/network/NetworkMap';
import SensorsPanel from '@/components/sensors/SensorsPanel';
import { ApiKeySettings } from '@/components/settings/ApiKeySettings';
import { IoTStatus } from '@/components/status/IoTStatus';
import { Tutorial } from '@/components/Tutorial';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/ui/notifications/NotificationCenter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ChargingStationsExplorer } from '@/components/charging/ChargingStationsExplorer';
import { KnowledgeCompendium } from '@/components/knowledge/KnowledgeCompendium';
import { CostEstimationAndGuide } from '@/components/business/CostEstimationAndGuide';
import { PrivateBacklog } from '@/components/backlog/PrivateBacklog';
import { CloudDrive } from '@/components/cloud/CloudDrive';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { getCurrentUser, UserProfile } from '@/services/authService';
import '../i18n/config';

const Index = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const spacesRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const headerTranslateY = useTransform(scrollY, [0, 100], [0, -100]);

  const [activeTab, setActiveTab] = useState<string>('spaces');
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());

  const handleExport = async (format: 'pdf' | 'jpg') => {
    if (!spacesRef.current) return;

    try {
      const canvas = await html2canvas(spacesRef.current);

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('przestrzenie-export.pdf');

        toast({
          title: 'Eksport zakończony',
          description: 'Plik PDF został pobrany',
        });
      } else {
        const link = document.createElement('a');
        link.download = 'przestrzenie-export.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();

        toast({
          title: 'Eksport zakończony',
          description: 'Plik JPG został pobrany',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Błąd eksportu',
        description: 'Nie udało się wyeksportować sekcji',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');

    const handleAuthChange = (e: CustomEvent<UserProfile>) => {
      setCurrentUser(e.detail);
    };

    // Deep navigation listener from Assistant action buttons
    const handleNav = (e: CustomEvent<{ tab?: string; section?: string }>) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      if (e.detail?.section) {
        setTimeout(() => {
          const el = document.getElementById(e.detail.section!);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.add('ring-4', 'ring-primary', 'transition-all');
            setTimeout(() => el.classList.remove('ring-4', 'ring-primary'), 2500);
          }
        }, 200);
      }
    };

    window.addEventListener('authRoleChanged', handleAuthChange as EventListener);
    window.addEventListener('navigateToSection', handleNav as EventListener);

    return () => {
      window.removeEventListener('authRoleChanged', handleAuthChange as EventListener);
      window.removeEventListener('navigateToSection', handleNav as EventListener);
    };
  }, []);

  useHotkeys('?', () => {
    toast({
      title: t('availableShortcuts', 'Available keyboard shortcuts'),
      description: 'Ctrl+K: Search\nCtrl+/: Help\nCtrl+B: Side menu',
    });
  });

  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    toast({
      title: t('search'),
      description: t('searchDescription', 'Search function will be available soon'),
    });
  });

  const launchTutorial = () => {
    window.dispatchEvent(new CustomEvent('openSmartGridTutorial'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Tutorial />
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{
          opacity: headerOpacity,
          y: headerTranslateY,
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
            <ApiKeySettings />
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-center sm:text-left tracking-tight">
                  {t('monitoringPanel')}
                </h1>
                <Badge
                  variant="outline"
                  onClick={() => setActiveTab('admin')}
                  className="cursor-pointer text-[10px] font-bold uppercase transition-all hover:bg-primary/10 border-primary/40 text-primary"
                  title="Kliknij, aby otworzyć panel ról i SSO"
                >
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Rola: {currentUser.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                {t('smartgridDescription')} • Woj. Pomorskie & KSE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={launchTutorial}
              className="text-xs gap-1.5 h-8 border-primary/30 hover:bg-primary/5 font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>Samouczek</span>
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <LanguageSelector />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('changeLanguage', 'Change language')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <NotificationCenter />
            <DarkModeToggle />
          </div>
        </div>
      </motion.div>

      <div className="pt-28">
        <SidebarProvider>
          <div className="min-h-screen flex w-full flex-col lg:flex-row">
            <CompanySidebar />
            <main className="flex-1 p-4 lg:pl-[320px] transition-all duration-300">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col gap-6"
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto flex-wrap gap-1 bg-muted/40 p-1.5">
                    <TabsTrigger value="spaces" className="gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('spaces')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="charging"
                      className="gap-1.5 font-bold text-emerald-500 data-[state=active]:text-emerald-400"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Stacje Ładowania EV</span>
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Kompendium Wiedzy</span>
                    </TabsTrigger>
                    <TabsTrigger value="business" className="gap-1.5">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Kosztorys & Biznesplan</span>
                    </TabsTrigger>
                    <TabsTrigger value="cloud" className="gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Dysk w Chmurze</span>
                    </TabsTrigger>
                    <TabsTrigger value="backlog" className="gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>Prywatny Backlog</span>
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Panel Uprawnień & SSO</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights">{t('analysis')}</TabsTrigger>
                    <TabsTrigger value="status">{t('status')}</TabsTrigger>
                    <TabsTrigger value="sensors">{t('sensors')}</TabsTrigger>
                    <TabsTrigger value="integrations">Otwarte API</TabsTrigger>
                    <TabsTrigger value="experiments">Eksperymenty</TabsTrigger>
                    <TabsTrigger
                      value="innovation"
                      className="font-semibold text-indigo-400 data-[state=active]:text-indigo-300 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Polo 3.0 & Digital Twin
                      3D
                    </TabsTrigger>
                  </TabsList>

                  {/* 1. SPACES (DASHBOARD & NETWORK MAP) */}
                  <TabsContent value="spaces" className="space-y-6">
                    <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => handleExport('jpg')}>
                        Eksportuj do JPG
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                        Eksportuj do PDF
                      </Button>
                    </div>
                    <div ref={spacesRef}>
                      <DndContext collisionDetection={closestCenter}>
                        <SortableContext items={[]} strategy={rectSortingStrategy}>
                          <div
                            id="power-stats"
                            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                          >
                            <PowerStats />
                          </div>
                        </SortableContext>
                      </DndContext>

                      <div id="energy-chart" className="grid gap-6 p-4 md:p-8">
                        <EnergyChart />
                      </div>

                      <div id="device-status" className="grid gap-6 p-4 md:p-8">
                        <DeviceStatus />
                      </div>

                      <div id="network-map" className="grid gap-6 p-4 md:p-8">
                        <NetworkMap />
                      </div>

                      <div id="failure-analysis" className="grid gap-6 p-4 md:p-8">
                        <FailureAnalysis />
                      </div>

                      <div id="energy-map" className="grid gap-6 p-4 md:p-8">
                        <EnergyMap />
                      </div>

                      <div id="chat-section" className="mt-8 grid gap-8 md:grid-cols-2">
                        <div id="file-upload" className="w-full">
                          <h2 className="text-2xl font-bold mb-4">{t('Wgraj pliki')}</h2>
                          <FileUpload />
                        </div>
                        <div id="chatbot" className="w-full">
                          <h2 className="text-2xl font-bold mb-4">{t('Asystent AI')}</h2>
                          <Chatbot />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 2. EV CHARGING STATIONS EXPLORER */}
                  <TabsContent value="charging" className="space-y-6">
                    <ChargingStationsExplorer />
                  </TabsContent>

                  {/* 3. KNOWLEDGE COMPENDIUM */}
                  <TabsContent value="knowledge" className="space-y-6">
                    <KnowledgeCompendium />
                  </TabsContent>

                  {/* 4. COST ESTIMATION & BUSINESS GUIDE */}
                  <TabsContent value="business" className="space-y-6">
                    <CostEstimationAndGuide />
                  </TabsContent>

                  {/* 5. CLOUD DRIVE */}
                  <TabsContent value="cloud" className="space-y-6">
                    <CloudDrive />
                  </TabsContent>

                  {/* 6. PRIVATE BACKLOG */}
                  <TabsContent value="backlog" className="space-y-6">
                    <PrivateBacklog />
                  </TabsContent>

                  {/* 7. ADMIN PANEL & SSO */}
                  <TabsContent value="admin" className="space-y-6">
                    <AdminPanel />
                  </TabsContent>

                  {/* 8. COMPANY ANALYSIS */}
                  <TabsContent value="insights">
                    <CompanyAnalysis />
                  </TabsContent>

                  {/* 9. IOT STATUS */}
                  <TabsContent value="status">
                    <IoTStatus />
                  </TabsContent>

                  {/* 10. SENSORS PANEL */}
                  <TabsContent value="sensors">
                    <SensorsPanel />
                  </TabsContent>

                  {/* 11. OPEN APIS & INTEGRATIONS */}
                  <TabsContent value="integrations">
                    <IntegrationsPanel />
                  </TabsContent>

                  {/* 12. EXPERIMENTS */}
                  <TabsContent value="experiments">
                    <ExperimentsPanel />
                  </TabsContent>

                  {/* 13. DIGITAL TWIN 3D */}
                  <TabsContent value="innovation">
                    <InnovationLab />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </main>
          </div>
        </SidebarProvider>
        <FloatingChatbot />
      </div>
    </div>
  );
};

export default Index;
