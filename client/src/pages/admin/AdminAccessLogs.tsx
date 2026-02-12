import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, LogIn, LogOut, ShieldX, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminAccessLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accessTypeFilter, setAccessTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);

  const { gymSlug } = useGym();

  const { data: accessLogs = [] } = trpc.accessLogs.list.useQuery(undefined, {
    enabled: !!gymSlug,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Filtrar logs
  const filteredLogs = (accessLogs as any[]).filter((log: any) => {
    const personName = log.studentName || log.staffName || "";

    // Busca por nome
    if (searchTerm && !personName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro de tipo de acesso
    if (accessTypeFilter !== "all" && log.accessType !== accessTypeFilter) {
      return false;
    }

    // Filtro de data
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (logDate !== dateFilter) {
        return false;
      }
    }

    return true;
  });

  // Calcular resumos do dia selecionado
  const dayLogs = (accessLogs as any[]).filter((log: any) => {
    if (!dateFilter) return true;
    const logDate = new Date(log.timestamp).toISOString().split("T")[0];
    return logDate === dateFilter;
  });

  const totalEntries = dayLogs.filter((l: any) => l.accessType === "entry").length;
  const totalExits = dayLogs.filter((l: any) => l.accessType === "exit").length;
  const totalDenied = dayLogs.filter((l: any) => l.accessType === "denied").length;

  const getAccessBadge = (type: string) => {
    switch (type) {
      case "entry":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><LogIn className="w-3 h-3 mr-1" /> Entrada</Badge>;
      case "exit":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><LogOut className="w-3 h-3 mr-1" /> Saída</Badge>;
      case "denied":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><ShieldX className="w-3 h-3 mr-1" /> Negado</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lista de Presença</h1>
          <p className="text-muted-foreground">Registros de entrada e saída pela catraca</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <LogIn className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                {dateFilter === new Date().toISOString().split("T")[0] ? "Hoje" : new Date(dateFilter + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <LogOut className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalExits}</div>
              <p className="text-xs text-muted-foreground">
                {dateFilter === new Date().toISOString().split("T")[0] ? "Hoje" : new Date(dateFilter + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negados</CardTitle>
              <ShieldX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalDenied}</div>
              <p className="text-xs text-muted-foreground">
                {dateFilter === new Date().toISOString().split("T")[0] ? "Hoje" : new Date(dateFilter + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div>
                <Label>Tipo de Acesso</Label>
                <Select value={accessTypeFilter} onValueChange={setAccessTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entry">Entradas</SelectItem>
                    <SelectItem value="exit">Saídas</SelectItem>
                    <SelectItem value="denied">Negados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do aluno ou funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Logs Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Registros de Acesso</CardTitle>
            <CardDescription>
              {filteredLogs.length} registro(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Motivo Negação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum registro de acesso encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.studentName || log.staffName || "Desconhecido"}
                      </TableCell>
                      <TableCell>
                        {getAccessBadge(log.accessType)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.studentName ? "Aluno" : log.staffName ? "Funcionário" : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.deviceType === "control_id" ? "Control ID" : "Toletus"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.denialReason || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
