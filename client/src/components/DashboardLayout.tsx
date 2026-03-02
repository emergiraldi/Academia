import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGym } from "@/_core/hooks/useGym";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard,
  LogOut,
  Users,
  CreditCard,
  GraduationCap,
  UserCog,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Shield,
  FileText,
  Receipt,
  Wallet,
  UserPlus,
  Calendar,
  Ruler,
  Tag,
  Building2,
  Target,
  Settings,
  Landmark,
  UserCheck,
  Dumbbell,
  DoorOpen,
  Loader2,
  MessageCircle,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { gymSlug } = useGym();

  // Query gym settings to determine turnstile type
  const { data: settings } = trpc.gymSettings.get.useQuery(
    { gymSlug: gymSlug || '' },
    { enabled: !!gymSlug }
  );

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if any child path in a section is active
  const isSectionActive = (paths: string[]) => paths.some(p => location === p);

  // Nav link component
  const NavLink = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const isActive = location === path;
    return (
      <button
        onClick={() => { setLocation(path); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition border-l-[3px] ${
          isActive
            ? "border-blue-300 bg-white/10 text-white font-medium"
            : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  // Collapsible section component
  const NavSection = ({ icon: Icon, label, sectionKey, children: items }: {
    icon: any; label: string; sectionKey: string;
    children: Array<{ icon: any; label: string; path: string }>;
  }) => {
    const isOpen = openSections[sectionKey] || isSectionActive(items.map(i => i.path));
    return (
      <div>
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-5 py-2.5 text-sm transition border-l-[3px] ${
            isSectionActive(items.map(i => i.path))
              ? "border-blue-300 bg-white/10 text-white font-medium"
              : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
        </button>
        {isOpen && (
          <div className="pb-1">
            {items.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { setLocation(item.path); setSidebarOpen(false); }}
                  className={`w-full text-left px-5 py-1.5 pl-12 text-[13px] transition ${
                    isActive
                      ? "text-white bg-white/5"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10 text-center">
          <div className="flex items-center justify-center gap-2">
            <Dumbbell className="w-6 h-6 text-white" />
            <h1 className="text-white text-xl font-bold">
              Sys<span className="text-blue-200">Fit</span> Pro
            </h1>
          </div>
          <p className="text-white/50 text-xs mt-1">Gestão de Academia</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* Direct links */}
          <NavLink icon={LayoutDashboard} label="Dashboard" path="/admin/dashboard" />
          <NavLink icon={Users} label="Alunos" path="/admin/students" />
          <NavLink icon={GraduationCap} label="Professores" path="/admin/professors" />
          <NavLink icon={UserCog} label="Funcionários" path="/admin/staff" />
          <NavLink icon={CreditCard} label="Planos" path="/admin/plans" />

          {/* Financeiro - collapsible */}
          <NavSection icon={DollarSign} label="Financeiro" sectionKey="financeiro">
            {[
              { icon: DollarSign, label: "Pagamentos", path: "/admin/payments" },
              { icon: Calendar, label: "Mensalidades", path: "/admin/billing" },
              { icon: Receipt, label: "Contas a Pagar", path: "/admin/accounts-payable" },
              { icon: AlertCircle, label: "Inadimplentes", path: "/admin/defaulters" },
              { icon: Wallet, label: "Fluxo de Caixa", path: "/admin/cash-flow" },
              { icon: TrendingUp, label: "Resumo Financeiro", path: "/admin/financial" },
              { icon: Landmark, label: "Contas Bancárias", path: "/admin/bank-accounts" },
              { icon: CreditCard, label: "Formas de Pagamento", path: "/admin/payment-methods" },
              { icon: Tag, label: "Categorias", path: "/admin/categories" },
              { icon: Building2, label: "Fornecedores", path: "/admin/suppliers" },
              { icon: Target, label: "Centros de Custo", path: "/admin/cost-centers" },
            ]}
          </NavSection>

          <NavLink icon={Calendar} label="Horários e Aulas" path="/admin/schedule" />
          <NavLink icon={Ruler} label="Avaliações" path="/admin/assessments" />
          <NavLink icon={UserPlus} label="CRM / Leads" path="/admin/crm" />

          {/* Controle de Acesso - collapsible */}
          <NavSection icon={Shield} label="Controle de Acesso" sectionKey="acesso">
            {[
              { icon: Shield, label: "Control ID", path: "/admin/control-id-devices" },
              ...(settings?.turnstileType === 'toletus_hub'
                ? [{ icon: Shield, label: "Toletus HUB", path: "/admin/toletus-devices" }]
                : []),
            ]}
          </NavSection>

          {/* Wellhub - collapsible */}
          <NavSection icon={Dumbbell} label="Wellhub" sectionKey="wellhub">
            {[
              { icon: Users, label: "Membros", path: "/admin/wellhub/members" },
              { icon: UserCheck, label: "Check-in", path: "/admin/wellhub/checkin" },
            ]}
          </NavSection>

          <NavLink icon={MessageCircle} label="WhatsApp" path="/admin/whatsapp" />
          <NavLink icon={FileText} label="Relatórios" path="/admin/reports" />
          <NavLink icon={Settings} label="Configurações" path="/admin/settings" />
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 px-3 py-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition rounded-md"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 -ml-2 mr-1 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Dumbbell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SysFit Pro</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarFallback className="text-sm font-medium bg-blue-100 text-blue-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>

      {/* FAB Liberar Catraca - so aparece se usa Toletus HUB */}
      {settings?.turnstileType === 'toletus_hub' && (
        <TurnstileReleaseFAB gymSlug={gymSlug} />
      )}
    </div>
  );
}

function TurnstileReleaseFAB({ gymSlug }: { gymSlug: string | null }) {
  const [open, setOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [message, setMessage] = useState("Bem-vindo!");

  const { data: devices = [] } = trpc.toletusDevices.list.useQuery(undefined, {
    enabled: !!gymSlug,
  });

  const releaseEntryMutation = trpc.toletusDevices.releaseEntry.useMutation({
    onSuccess: () => {
      toast.success("Catraca liberada com sucesso!");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao liberar catraca");
    },
  });

  const handleOpen = () => {
    // Auto-seleciona o primeiro dispositivo se so tiver 1
    if ((devices as any[]).length === 1) {
      setSelectedDeviceId(String((devices as any[])[0].id));
    }
    setMessage("Bem-vindo!");
    setOpen(true);
  };

  const handleRelease = () => {
    if (!selectedDeviceId) {
      toast.error("Selecione um dispositivo");
      return;
    }
    releaseEntryMutation.mutate({
      deviceId: Number(selectedDeviceId),
      message,
    });
  };

  return (
    <>
      {/* Botao flutuante */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        title="Liberar Catraca"
      >
        <DoorOpen className="w-6 h-6" />
      </button>

      {/* Dialog de liberacao */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-green-600" />
              Liberar Catraca
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(devices as any[]).length > 1 ? (
              <div>
                <Label>Dispositivo</Label>
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dispositivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(devices as any[]).map((device: any) => (
                      <SelectItem key={device.id} value={String(device.id)}>
                        {device.name}{device.ip ? ` (${device.ip})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (devices as any[]).length === 1 ? (
              <p className="text-sm text-muted-foreground">
                Dispositivo: <span className="font-medium text-foreground">{(devices as any[])[0].name}</span>
              </p>
            ) : null}

            <div>
              <Label>Mensagem no display</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bem-vindo!"
              />
            </div>

            <Button
              onClick={handleRelease}
              disabled={releaseEntryMutation.isPending || !selectedDeviceId}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg"
            >
              {releaseEntryMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <DoorOpen className="w-5 h-5 mr-2" />
              )}
              Liberar Entrada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
