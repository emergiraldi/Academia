import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Users, DollarSign, TrendingUp, Plus, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();

  // Buscar lista de academias
  const { data: gyms, isLoading } = trpc.gyms.list.useQuery();

  // Calcular estatísticas
  const totalGyms = gyms?.length || 0;
  const activeGyms = gyms?.filter(g => g.status === "active")?.length || 0;

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Visão geral do sistema</p>
          </div>
          <Button
            onClick={() => setLocation('/super-admin/gyms')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Academia
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Total de Academias</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? "-" : totalGyms}
                  </p>
                  <p className="text-xs text-gray-500">Cadastradas no sistema</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Academias Ativas</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? "-" : activeGyms}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalGyms > 0 ? `${((activeGyms / totalGyms) * 100).toFixed(0)}% do total` : "-"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Total de Alunos</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    -
                  </p>
                  <p className="text-xs text-gray-500">Em todas as academias</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Receita Total</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    -
                  </p>
                  <p className="text-xs text-gray-500">Mês atual</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setLocation('/super-admin/gyms')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Gerenciar Academias</h4>
                    <p className="text-sm text-gray-600">Cadastrar e editar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setLocation('/super-admin/settings')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <Settings className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Configurações</h4>
                    <p className="text-sm text-gray-600">Sistema global</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Relatórios</h4>
                    <p className="text-sm text-gray-600">Visualizar dados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Gyms */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academias Recentes</h3>
          <Card className="shadow-md">
            <CardContent className="p-6">
              {isLoading ? (
                <p className="text-gray-600">Carregando...</p>
              ) : gyms && gyms.length > 0 ? (
                <div className="space-y-4">
                  {gyms.slice(0, 5).map((gym, index) => {
                    const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-orange-500'];
                    return (
                      <div
                        key={gym.id}
                        className={`border-l-4 ${borderColors[index % borderColors.length]} bg-gray-50 p-4 rounded hover:bg-gray-100 transition cursor-pointer`}
                        onClick={() => setLocation('/super-admin/gyms')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{gym.name}</h4>
                            <p className="text-sm text-gray-600">@{gym.slug}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {gym.status === "active" ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Ativa
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                Inativa
                              </span>
                            )}
                          </div>
                        </div>
                        {gym.city && gym.state && (
                          <p className="text-xs text-gray-500 mt-2">
                            {gym.city}, {gym.state}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Nenhuma academia cadastrada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
