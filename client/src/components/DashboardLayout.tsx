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
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

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

  // Base menu items
  const baseMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Alunos", path: "/admin/students" },
    { icon: UserPlus, label: "CRM / Leads", path: "/admin/crm" },
    { icon: CreditCard, label: "Planos", path: "/admin/plans" },
    { icon: Calendar, label: "Agendamento", path: "/admin/schedule" },
    { icon: Ruler, label: "Avaliações", path: "/admin/assessments" },
    { icon: GraduationCap, label: "Professores", path: "/admin/professors" },
    { icon: UserCog, label: "Funcionários", path: "/admin/staff" },
    { icon: DollarSign, label: "Pagamentos", path: "/admin/payments" },
    { icon: Calendar, label: "Mensalidades", path: "/admin/billing" },
    { icon: Receipt, label: "Contas a Pagar", path: "/admin/accounts-payable" },
    { icon: Tag, label: "Categorias", path: "/admin/categories" },
    { icon: Building2, label: "Fornecedores", path: "/admin/suppliers" },
    { icon: Target, label: "Centros de Custo", path: "/admin/cost-centers" },
    { icon: CreditCard, label: "Formas de Pagamento", path: "/admin/payment-methods" },
    { icon: Landmark, label: "Contas Bancárias", path: "/admin/bank-accounts" },
    { icon: Wallet, label: "Fluxo de Caixa", path: "/admin/cash-flow" },
    { icon: TrendingUp, label: "Financeiro", path: "/admin/financial" },
    { icon: AlertCircle, label: "Inadimplentes", path: "/admin/defaulters" },
  ];

  // Conditional turnstile menu item
  const turnstileMenuItem = settings?.turnstileType === 'toletus_hub'
    ? { icon: Shield, label: "Toletus HUB", path: "/admin/toletus-devices" }
    : { icon: Shield, label: "Control ID", path: "/admin/control-id-devices" };

  // Bottom menu items
  const bottomMenuItems = [
    { icon: Users, label: "Wellhub - Membros", path: "/admin/wellhub/members" },
    { icon: UserCheck, label: "Wellhub - Check-in", path: "/admin/wellhub/checkin" },
    { icon: FileText, label: "Relatórios", path: "/admin/reports" },
    { icon: Settings, label: "Parâmetros", path: "/admin/settings" },
  ];

  // Combine all menu items
  const menuItems = [...baseMenuItems, turnstileMenuItem, ...bottomMenuItems];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-20 bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col space-y-2">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
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
    </div>
  );
}
