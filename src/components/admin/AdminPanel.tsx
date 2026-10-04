import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  FileText,
  Activity,
  Server,
  Users,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  UserProfile,
  UserRole,
  getCurrentUser,
  setCurrentUserRole,
  loginWithSSO,
  logoutUser,
} from '@/services/authService';

export function AdminPanel() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [auditLogs, setAuditLogs] = useState<
    Array<{ id: string; time: string; user: string; event: string; status: 'ok' | 'warn' }>
  >([
    {
      id: '1',
      time: '10:42:15',
      user: 'admin@pse.pl',
      event: 'Modyfikacja nastaw zabezpieczenia GPZ Gdańsk Południe',
      status: 'ok',
    },
    {
      id: '2',
      time: '10:28:40',
      user: 'operator@energa-operator.pl',
      event: 'Przełączenie łącznika Q0-TR1 na stacji 110/15 kV',
      status: 'ok',
    },
    {
      id: '3',
      time: '10:15:02',
      user: 'gosc@smartgrid.pomorskie.pl',
      event: 'Odmowa zapisu: Próba eksportu danych telemetrycznych przez gościa',
      status: 'warn',
    },
    {
      id: '4',
      time: '09:55:12',
      user: 'sso-system',
      event: 'Uwierzytelnienie SSO Enterprise SAML 2.0 (Polskie Sieci Elektroenergetyczne)',
      status: 'ok',
    },
  ]);

  useEffect(() => {
    const handleAuthChange = (e: CustomEvent<UserProfile>) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener('authRoleChanged', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('authRoleChanged', handleAuthChange as EventListener);
    };
  }, []);

  const handleRoleChange = (role: UserRole) => {
    const updated = setCurrentUserRole(role);
    setCurrentUser(updated);
    toast({
      title: `Przełączono rolę na: ${role.toUpperCase()}`,
      description: `Zaktualizowano uprawnienia profilu (${updated.name}).`,
    });
  };

  const handleSSOLogin = (provider: 'google' | 'github' | 'enterprise') => {
    const updated = loginWithSSO(provider);
    setCurrentUser(updated);
    toast({
      title: 'Pomyślne logowanie SSO',
      description: `Zalogowano przez ${provider.toUpperCase()} jako ${updated.name}`,
    });
  };

  const handleLogout = () => {
    const updated = logoutUser();
    setCurrentUser(updated);
    toast({
      title: 'Wylogowano z systemu',
      description: 'Zmieniono profil na konto Gościa (tryb tylko do odczytu).',
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER & PROFILE OVERVIEW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <Badge
                variant="outline"
                className={`text-xs uppercase font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : currentUser.role === 'user'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                }`}
              >
                {currentUser.role === 'admin'
                  ? 'Administrator'
                  : currentUser.role === 'user'
                    ? 'Operator (Użytkownik)'
                    : 'Gość (Tylko odczyt)'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentUser.email} • {currentUser.organization}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dostawca tożsamości:{' '}
              <span className="font-mono text-primary">{currentUser.provider}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role !== 'guest' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-red-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj (Przełącz na Gościa)
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSSOLogin('enterprise')}
              className="gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Zaloguj przez SSO
            </Button>
          )}
        </div>
      </div>

      {/* QUICK ROLE SWITCHER (DEMO CONTROL) */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">
                Szybki Przełącznik Ról & Wersja Demo
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Szybki test uprawnień
            </Badge>
          </div>
          <CardDescription>
            Wybierz rolę, aby natychmiast przetestować działanie interfejsu z perspektywy Gościa,
            Operatora lub Administratora.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GOŚĆ */}
            <div
              onClick={() => handleRoleChange('guest')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentUser.role === 'guest'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30 bg-muted/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm">1. Panel Gościa</div>
                {currentUser.role === 'guest' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Podstawowy dostęp publiczny. Podgląd mapy sieci, diagramów i wykresów w trybie tylko
                do odczytu.
              </p>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Podgląd telemetrii i mapy
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  ✗ Blokada eksportu raportów
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  ✗ Brak sterowania aparatami GPZ
                </div>
              </div>
            </div>

            {/* OPERATOR / ZAREJESTROWANY */}
            <div
              onClick={() => handleRoleChange('user')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentUser.role === 'user'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30 bg-muted/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm">2. Operator (Zarejestrowany)</div>
                {currentUser.role === 'user' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Pełny dostęp inżynierski. Sterowanie łącznikami na schemacie SLD, eksporty
                PDF/JPG/CSV, wgrywanie plików.
              </p>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Sterowanie łącznikami GPZ
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Wgrywanie plików do dysku
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Zarządzanie prywatnym backlogiem
                </div>
              </div>
            </div>

            {/* ADMINISTRATOR */}
            <div
              onClick={() => handleRoleChange('admin')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentUser.role === 'admin'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30 bg-muted/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm">3. Administrator Systemu</div>
                {currentUser.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Najwyższy poziom uprawnień. Pełne zarządzanie konfiguracją sieci, audyt
                bezpieczeństwa, logi zdarzeń.
              </p>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Dostęp do panelu administracyjnego
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Przeglądanie logów audytowych
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  ✓ Konfiguracja integracji API i SSO
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSO PROVIDERS INTEGRATION */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Uwierzytelnianie Jednokrotne (Single Sign-On - SSO)
          </CardTitle>
          <CardDescription>
            Zaloguj się przy użyciu korporacyjnego konta tożsamości federacyjnej OIDC/SAML.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSSOLogin('google')}
              className="justify-start gap-2 h-11 border text-xs font-semibold"
            >
              <span className="w-5 h-5 flex items-center justify-center font-bold text-red-500">
                G
              </span>
              Zaloguj przez Google SSO
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSSOLogin('github')}
              className="justify-start gap-2 h-11 border text-xs font-semibold"
            >
              <span className="w-5 h-5 flex items-center justify-center font-bold text-slate-900 dark:text-white">
                GH
              </span>
              Zaloguj przez GitHub Enterprise
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSSOLogin('enterprise')}
              className="justify-start gap-2 h-11 border text-xs font-semibold border-primary/40 bg-primary/5"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              SAML 2.0 / Entra ID (PSE/Energa)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AUDIT LOGS & SYSTEM INTEGRITY */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">
                Dziennik Zdarzeń i Audyt Bezpieczeństwa
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Ochrona IEC 62443
            </Badge>
          </div>
          <CardDescription>
            Rejestr operacji dyspozytorskich i uwierzytelniania w czasie rzeczywistym.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded bg-muted/40 border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground whitespace-nowrap">[{log.time}]</span>
                  <span className="font-semibold text-primary truncate">{log.user}:</span>
                  <span className="truncate">{log.event}</span>
                </div>
                <div>
                  <Badge
                    variant={log.status === 'ok' ? 'secondary' : 'destructive'}
                    className="text-[10px] uppercase"
                  >
                    {log.status === 'ok' ? 'Sukces' : 'Ostrzeżenie'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
