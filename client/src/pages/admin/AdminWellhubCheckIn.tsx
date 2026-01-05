import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QrCode, CheckCircle, XCircle, UserCheck, History, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminWellhubCheckIn() {
  const [wellhubId, setWellhubId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data: recentCheckIns = [], refetch: refetchCheckIns } = trpc.wellhub.listCheckIns.useQuery({
    validationStatus: undefined,
  });

  // Mutations
  const validateCheckIn = trpc.wellhub.validateCheckIn.useMutation({
    onSuccess: (data) => {
      toast.success(`Check-in validado! Bem-vindo, ${data.memberName}!`, {
        duration: 5000,
      });
      setWellhubId("");
      setIsProcessing(false);
      refetchCheckIns();
    },
    onError: (error) => {
      toast.error(`Erro no check-in: ${error.message}`, {
        duration: 5000,
      });
      setIsProcessing(false);
    },
  });

  const handleCheckIn = () => {
    if (!wellhubId) {
      toast.error("Digite o Wellhub ID");
      return;
    }

    if (wellhubId.length !== 13) {
      toast.error("Wellhub ID deve ter 13 dígitos");
      return;
    }

    setIsProcessing(true);
    validateCheckIn.mutate({
      wellhubId,
      method: 'manual',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckIn();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      validated: (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Validado
        </Badge>
      ),
      pending: (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      ),
      rejected: (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejeitado
        </Badge>
      ),
      expired: (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      ),
    };
    return badges[status] || badges.pending;
  };

  // Get today's validated check-ins count
  const todayCheckIns = recentCheckIns.filter((checkIn: any) => {
    const checkInDate = new Date(checkIn.checkInTime);
    const today = new Date();
    return (
      checkInDate.getDate() === today.getDate() &&
      checkInDate.getMonth() === today.getMonth() &&
      checkInDate.getFullYear() === today.getFullYear() &&
      checkIn.validationStatus === 'validated'
    );
  }).length;

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Check-in Wellhub"
          description="Validar entrada de membros Wellhub na academia"
        />

        {/* Stats Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Hoje</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCheckIns}</div>
              <p className="text-xs text-muted-foreground">
                Membros Wellhub que entraram hoje
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCheckIns.length}</div>
              <p className="text-xs text-muted-foreground">
                Histórico de check-ins registrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status da Integração</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ativa</div>
              <p className="text-xs text-muted-foreground">
                Wellhub conectado e funcionando
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Form */}
        <Card className="border-2 border-primary shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Validar Check-in
            </CardTitle>
            <CardDescription>
              Digite ou escaneie o Wellhub ID do membro (13 dígitos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="wellhubId">Wellhub ID</Label>
                  <Input
                    id="wellhubId"
                    placeholder="1234567890123"
                    value={wellhubId}
                    onChange={(e) => setWellhubId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={13}
                    className="text-lg font-mono"
                    autoFocus
                    disabled={isProcessing}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCheckIn}
                    disabled={isProcessing}
                    size="lg"
                    className="h-[42px]"
                  >
                    {isProcessing ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validar Check-in
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Instruções:</strong>
                  <br />
                  1. Peça ao membro para mostrar o Wellhub ID no app (canto superior esquerdo)
                  <br />
                  2. Digite o ID de 13 dígitos no campo acima ou escaneie o QR Code
                  <br />
                  3. Pressione Enter ou clique em "Validar Check-in"
                  <br />
                  4. Aguarde a confirmação antes de liberar o acesso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Check-ins Recentes
            </CardTitle>
            <CardDescription>
              Últimos check-ins registrados (mais recentes primeiro)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Wellhub ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCheckIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum check-in registrado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCheckIns.slice(0, 10).map((checkIn: any) => (
                    <TableRow key={checkIn.id}>
                      <TableCell>
                        {new Date(checkIn.checkInTime).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {checkIn.wellhubId}
                      </TableCell>
                      <TableCell>{checkIn.memberName || "-"}</TableCell>
                      <TableCell className="capitalize">{checkIn.method}</TableCell>
                      <TableCell>{getStatusBadge(checkIn.validationStatus)}</TableCell>
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
