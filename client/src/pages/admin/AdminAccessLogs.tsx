import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Search, LogIn, ShieldX, Activity, FileText, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper: retorna YYYY-MM-DD em hora LOCAL (evita problema de UTC)
function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminAccessLogs() {
  const today = getLocalDateStr(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [accessTypeFilter, setAccessTypeFilter] = useState<string>("all");
  const [dateStart, setDateStart] = useState<string>(today);
  const [dateEnd, setDateEnd] = useState<string>(today);

  const { gymSlug } = useGym();

  const { data: settings } = trpc.settings.get.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: accessLogs = [] } = trpc.accessLogs.list.useQuery(undefined, {
    enabled: !!gymSlug,
    refetchInterval: 30000,
  });

  const gymName = settings?.gymName || "Academia";

  // Filtrar logs
  const filteredLogs = (accessLogs as any[]).filter((log: any) => {
    const personName = log.studentName || log.staffName || "";

    // Busca por nome
    if (searchTerm && !personName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro de tipo de acesso
    if (accessTypeFilter === "presenca" && log.accessType !== "entry" && log.accessType !== "exit") {
      return false;
    }
    if (accessTypeFilter === "denied" && log.accessType !== "denied") {
      return false;
    }

    // Filtro de data (usa hora LOCAL, nao UTC)
    const logLocalDate = getLocalDateStr(new Date(log.timestamp));
    if (dateStart && logLocalDate < dateStart) {
      return false;
    }
    if (dateEnd && logLocalDate > dateEnd) {
      return false;
    }

    return true;
  });

  // Calcular resumos do periodo filtrado
  // entry e exit = presenca (pessoa passou na leitora), denied = negado
  const totalPresenca = filteredLogs.filter((l: any) => l.accessType === "entry" || l.accessType === "exit").length;
  const totalDenied = filteredLogs.filter((l: any) => l.accessType === "denied").length;

  const getAccessBadge = (type: string) => {
    switch (type) {
      case "entry":
      case "exit":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><LogIn className="w-3 h-3 mr-1" /> Presenca</Badge>;
      case "denied":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><ShieldX className="w-3 h-3 mr-1" /> Negado</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getAccessTypeText = (type: string) => {
    switch (type) {
      case "entry":
      case "exit":
        return "Presenca";
      case "denied": return "Negado";
      default: return type;
    }
  };

  const getPeriodLabel = () => {
    if (dateStart === dateEnd) {
      if (dateStart === today) return "Hoje";
      return new Date(dateStart + "T12:00:00").toLocaleDateString("pt-BR");
    }
    return `${new Date(dateStart + "T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(dateEnd + "T12:00:00").toLocaleDateString("pt-BR")}`;
  };

  // Gerar PDF
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      if (settings?.logoUrl) {
        try {
          doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 30);
        } catch (e) {
          console.log('Logo not added:', e);
        }
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(gymName, settings?.logoUrl ? 50 : 14, 20);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(59, 130, 246);
      doc.text("Lista de Presenca", settings?.logoUrl ? 50 : 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Periodo: ${getPeriodLabel()}`, settings?.logoUrl ? 50 : 14, 36);

      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR")}`, settings?.logoUrl ? 50 : 14, 42);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 48, pageWidth - 14, 48);

      // Resumo boxes
      let yPos = 55;
      const boxWidth = (pageWidth - 35) / 2;

      // Presencas
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(14, yPos, boxWidth, 20, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.text("Presencas", 14 + boxWidth / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(16);
      doc.text(String(totalPresenca), 14 + boxWidth / 2, yPos + 16, { align: 'center' });

      // Negados
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(14 + boxWidth + 7, yPos, boxWidth, 20, 3, 3, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(10);
      doc.text("Negados", 14 + boxWidth + 7 + boxWidth / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(16);
      doc.text(String(totalDenied), 14 + boxWidth + 7 + boxWidth / 2, yPos + 16, { align: 'center' });

      yPos += 28;

      // Filtros aplicados
      const filters: string[] = [];
      if (searchTerm) filters.push(`Nome: "${searchTerm}"`);
      if (accessTypeFilter !== "all") filters.push(`Tipo: ${getAccessTypeText(accessTypeFilter)}`);
      if (filters.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Filtros: ${filters.join(" | ")}`, 14, yPos);
        yPos += 6;
      }

      // Tabela
      doc.setTextColor(0, 0, 0);

      const tableData = filteredLogs.map((log: any) => [
        new Date(log.timestamp).toLocaleString("pt-BR"),
        log.studentName || log.staffName || "Desconhecido",
        getAccessTypeText(log.accessType),
        log.studentName ? "Aluno" : log.staffName ? "Funcionario" : "-",
        log.deviceType === "control_id" ? "Control ID" : "Toletus",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Horario", "Nome", "Tipo", "Perfil", "Dispositivo"]],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 55 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 28 },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Pagina ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(gymName, 14, pageHeight - 10);
      }

      const dateLabel = dateStart === dateEnd
        ? dateStart.replace(/-/g, '')
        : `${dateStart.replace(/-/g, '')}_${dateEnd.replace(/-/g, '')}`;
      doc.save(`lista_presenca_${dateLabel}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lista de Presenca</h1>
            <p className="text-muted-foreground">Registros de entrada e saida pela catraca</p>
          </div>
          <Button onClick={generatePDF} className="gap-2" disabled={filteredLogs.length === 0}>
            <FileText className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presencas</CardTitle>
              <LogIn className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalPresenca}</div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negados</CardTitle>
              <ShieldX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalDenied}</div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
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
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Data Inicio</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>

              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
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
                    <SelectItem value="presenca">Presencas</SelectItem>
                    <SelectItem value="denied">Negados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do aluno..."
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Registros de Acesso</CardTitle>
              <CardDescription>
                {filteredLogs.length} registro(s) encontrado(s)
              </CardDescription>
            </div>
            {filteredLogs.length > 0 && (
              <Button variant="outline" size="sm" onClick={generatePDF} className="gap-2">
                <Download className="w-4 h-4" />
                Salvar PDF
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horario</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Motivo Negacao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum registro de acesso encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Total de registros no servidor: {(accessLogs as any[]).length}</p>
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
                          {log.studentName ? "Aluno" : log.staffName ? "Funcionario" : "-"}
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
