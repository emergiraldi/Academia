import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  LogOut,
  Building2,
  Settings,
  Dumbbell,
  Users,
  Package,
  FileText,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin/dashboard" },
  { icon: Building2, label: "Academias", path: "/super-admin/gyms" },
  { icon: Package, label: "Planos SaaS", path: "/super-admin/plans" },
  { icon: FileText, label: "Relatórios", path: "/super-admin/reports" },
  { icon: Users, label: "Usuários", path: "/super-admin/users" },
  { icon: Settings, label: "Configurações", path: "/super-admin/settings" },
];

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  // Verificar se é super admin
  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  return <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>;
}

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SysFit Pro</h1>
                <p className="text-xs text-gray-500 font-medium">Super Admin</p>
              </div>
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
                      Super Admin
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
