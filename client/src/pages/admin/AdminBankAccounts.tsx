import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Pencil, Trash2, Building } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useGym } from "@/_core/hooks/useGym";

const BANCOS = [
  { codigo: 1, nome: "Banco do Brasil" },
  { codigo: 33, nome: "Santander" },
  { codigo: 77, nome: "Banco Inter" },
  { codigo: 104, nome: "Caixa Econômica Federal" },
  { codigo: 237, nome: "Bradesco" },
  { codigo: 341, nome: "Itaú" },
  { codigo: 756, nome: "Sicoob" },
  { codigo: 748, nome: "Sicredi" },
  { codigo: 260, nome: "Nubank" },
  { codigo: 336, nome: "C6 Bank" },
  { codigo: 323, nome: "Mercado Pago" }, // Código oficial do Mercado Pago
];

const TIPOS_CHAVE_PIX = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "Email", label: "E-mail" },
  { value: "Telefone", label: "Telefone" },
  { value: "Aleatoria", label: "Chave Aleatória" },
];

export default function AdminBankAccounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Form state
  const [titular, setTitular] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [agenciaDv, setAgenciaDv] = useState("");
  const [conta, setConta] = useState("");
  const [contaDv, setContaDv] = useState("");

  // PIX fields
  const [pixAtivo, setPixAtivo] = useState("N");
  const [pixProvedor, setPixProvedor] = useState("sicoob"); // 'sicoob' ou 'mercadopago'
  const [pixChave, setPixChave] = useState("");
  const [pixTipoChave, setPixTipoChave] = useState("");
  const [pixTipoAmbiente, setPixTipoAmbiente] = useState("P");

  // Campos Sicoob
  const [pixClientId, setPixClientId] = useState("");
  const [pixClientSecret, setPixClientSecret] = useState("");
  const [pixCertificado, setPixCertificado] = useState("");
  const [pixChavePrivada, setPixChavePrivada] = useState("");
  const [pixSenhaCertificado, setPixSenhaCertificado] = useState("");
  const [pixUrlBase, setPixUrlBase] = useState("");
  const [pixUrlToken, setPixUrlToken] = useState("");

  // Campos Mercado Pago
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");

  const { gymSlug } = useGym();

  const { data: accounts = [], refetch } = trpc.bankAccounts.list.useQuery(
    { gymSlug: gymSlug || "" },
    { enabled: !!gymSlug }
  );

  const createMutation = trpc.bankAccounts.create.useMutation({
    onSuccess: () => {
      toast.success("Conta cadastrada com sucesso!");
      refetch();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar conta");
    },
  });

  const updateMutation = trpc.bankAccounts.update.useMutation({
    onSuccess: () => {
      toast.success("Conta atualizada com sucesso!");
      refetch();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar conta");
    },
  });

  const deleteMutation = trpc.bankAccounts.delete.useMutation({
    onSuccess: () => {
      toast.success("Conta excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir conta");
    },
  });

  const togglePixMutation = trpc.bankAccounts.update.useMutation({
    onSuccess: () => {
      toast.success("Status PIX atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status PIX");
    },
  });

  const resetForm = () => {
    setEditingAccount(null);
    setTitular("");
    setBanco("");
    setAgencia("");
    setAgenciaDv("");
    setConta("");
    setContaDv("");
    setPixAtivo("N");
    setPixProvedor("sicoob");
    setPixChave("");
    setPixTipoChave("");
    setPixTipoAmbiente("P");
    setPixClientId("");
    setPixClientSecret("");
    setPixCertificado("");
    setPixChavePrivada("");
    setPixSenhaCertificado("");
    setPixUrlBase("");
    setPixUrlToken("");
    setMpAccessToken("");
    setMpPublicKey("");
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setTitular(account.titular_nome || "");
    setBanco(account.banco?.toString() || "");
    setAgencia(account.agencia_numero || "");
    setAgenciaDv(account.agencia_dv || "");
    setConta(account.conta_numero || "");
    setContaDv(account.conta_dv || "");
    setPixAtivo(account.pix_ativo || "N");
    setPixProvedor(account.pix_provedor || "sicoob");
    setPixChave(account.pix_chave || "");
    setPixTipoChave(account.pix_tipo_chave || "");
    setPixTipoAmbiente(account.pix_tipo_ambiente || "P");
    setPixClientId(account.pix_client_id || "");
    setPixClientSecret(account.pix_client_secret || "");
    setPixCertificado(account.pix_certificado || "");
    setPixChavePrivada(account.pix_chave_privada || "");
    setPixSenhaCertificado(account.pix_senha_certificado || "");
    setPixUrlBase(account.pix_url_base || "");
    setPixUrlToken(account.pix_url_token || "");
    setMpAccessToken(account.mp_access_token || "");
    setMpPublicKey(account.mp_public_key || "");
    setDialogOpen(true);
  };

  const handleFileRead = (file: File, callback: (content: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      callback(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!banco) {
      toast.error("Selecione um banco");
      return;
    }

    const data = {
      gymSlug,
      titularNome: titular,
      banco: parseInt(banco),
      agenciaNumero: agencia,
      agenciaDv: agenciaDv,
      contaNumero: conta,
      contaDv: contaDv,
      pixAtivo,
      pixProvedor,
      pixChave,
      pixTipoChave,
      pixTipoAmbiente,
      pixClientId,
      pixClientSecret,
      pixCertificado,
      pixChavePrivada,
      pixSenhaCertificado,
      pixUrlBase,
      pixUrlToken,
      mpAccessToken,
      mpPublicKey,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      deleteMutation.mutate({ id, gymSlug });
    }
  };

  const handleTogglePix = (account: any) => {
    const newStatus = account.pix_ativo === "S" ? "N" : "S";
    const action = newStatus === "S" ? "ativar" : "desativar";

    if (confirm(`Tem certeza que deseja ${action} o PIX desta conta?`)) {
      togglePixMutation.mutate({
        id: account.id,
        gymSlug,
        pixAtivo: newStatus,
      });
    }
  };

  const getBancoNome = (codigo: number) => {
    const banco = BANCOS.find((b) => b.codigo === codigo);
    return banco ? `${banco.codigo} - ${banco.nome}` : `Banco ${codigo}`;
  };

  return (
    <DashboardLayout role="gym_admin">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contas Bancárias</h1>
            <p className="text-muted-foreground">
              Gerencie as contas bancárias e configurações PIX
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Editar Conta Bancária" : "Nova Conta Bancária"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da conta bancária e configurações PIX
                </DialogDescription>
              </DialogHeader>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
                {/* Informações Básicas */}
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Informações da Conta
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nome do Titular</Label>
                      <Input
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                        placeholder="Nome completo ou razão social"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Banco *</Label>
                      <Select value={banco} onValueChange={setBanco}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANCOS.map((b) => (
                            <SelectItem key={b.codigo} value={b.codigo.toString()}>
                              {b.codigo} - {b.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Agência</Label>
                      <Input
                        value={agencia}
                        onChange={(e) => setAgencia(e.target.value)}
                        placeholder="0000"
                      />
                    </div>

                    <div>
                      <Label>DV Agência</Label>
                      <Input
                        value={agenciaDv}
                        onChange={(e) => setAgenciaDv(e.target.value)}
                        placeholder="0"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label>Conta</Label>
                      <Input
                        value={conta}
                        onChange={(e) => setConta(e.target.value)}
                        placeholder="00000000"
                      />
                    </div>

                    <div>
                      <Label>DV Conta</Label>
                      <Input
                        value={contaDv}
                        onChange={(e) => setContaDv(e.target.value)}
                        placeholder="0"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Configurações PIX */}
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 border-t pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Configurações PIX
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>PIX Ativo</Label>
                      <Select value={pixAtivo} onValueChange={setPixAtivo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">Sim</SelectItem>
                          <SelectItem value="N">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Ambiente</Label>
                      <Select value={pixTipoAmbiente} onValueChange={setPixTipoAmbiente}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P">Produção</SelectItem>
                          <SelectItem value="H">Homologação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Provedor PIX</Label>
                      <Select value={pixProvedor} onValueChange={setPixProvedor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sicoob">Sicoob</SelectItem>
                          <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha qual provedor usar para gerar cobranças PIX
                      </p>
                    </div>

                    <div>
                      <Label>Tipo de Chave PIX</Label>
                      <Select value={pixTipoChave} onValueChange={setPixTipoChave}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CHAVE_PIX.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Chave PIX</Label>
                      <Input
                        value={pixChave}
                        onChange={(e) => setPixChave(e.target.value)}
                        placeholder="Chave PIX"
                      />
                    </div>

                    {/* Campos específicos do Sicoob */}
                    {pixProvedor === "sicoob" && (
                      <>
                        <div className="col-span-2">
                          <Label>Client ID (Sicoob)</Label>
                          <Input
                            value={pixClientId}
                            onChange={(e) => setPixClientId(e.target.value)}
                            placeholder="Client ID OAuth Sicoob"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Client Secret (Sicoob)</Label>
                          <Input
                            type="password"
                            value={pixClientSecret}
                            onChange={(e) => setPixClientSecret(e.target.value)}
                            placeholder="Client Secret OAuth Sicoob"
                          />
                        </div>
                      </>
                    )}

                    {/* Campos específicos do Mercado Pago */}
                    {pixProvedor === "mercadopago" && (
                      <>
                        <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            💳 Configurações Mercado Pago
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label>Access Token (Obrigatório)</Label>
                              <Input
                                type="password"
                                value={mpAccessToken}
                                onChange={(e) => setMpAccessToken(e.target.value)}
                                placeholder="APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="font-mono text-sm"
                              />
                              <p className="text-xs text-blue-700 mt-1">
                                📍 Obtenha em: mercadopago.com.br/developers/panel
                              </p>
                            </div>

                            <div>
                              <Label>Public Key (Opcional)</Label>
                              <Input
                                value={mpPublicKey}
                                onChange={(e) => setMpPublicKey(e.target.value)}
                                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Campos específicos do Sicoob */}
                    {pixProvedor === "sicoob" && (
                      <>
                        <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                            🏦 Configurações Sicoob
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label>Certificado PIX (.pem)</Label>
                              <Input
                                type="file"
                                accept=".pem,.crt,.cer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileRead(file, (content) => {
                                      setPixCertificado(content);
                                      toast.success("Certificado carregado com sucesso!");
                                    });
                                  }
                                }}
                              />
                              {pixCertificado && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✓ Certificado {editingAccount ? "atualizado" : "carregado"} ({pixCertificado.length} bytes)
                                </p>
                              )}
                              {editingAccount && !pixCertificado && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  💡 Deixe em branco para manter o certificado atual
                                </p>
                              )}
                            </div>

                            <div>
                              <Label>Chave Privada PIX (.key ou .pem)</Label>
                              <Input
                                type="file"
                                accept=".key,.pem"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileRead(file, (content) => {
                                      setPixChavePrivada(content);
                                      toast.success("Chave privada carregada com sucesso!");
                                    });
                                  }
                                }}
                              />
                              {pixChavePrivada && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✓ Chave privada {editingAccount ? "atualizada" : "carregada"} ({pixChavePrivada.length} bytes)
                                </p>
                              )}
                              {editingAccount && !pixChavePrivada && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  💡 Deixe em branco para manter a chave privada atual
                                </p>
                              )}
                            </div>

                            <div>
                              <Label>Senha do Certificado (opcional)</Label>
                              <Input
                                type="password"
                                value={pixSenhaCertificado}
                                onChange={(e) => setPixSenhaCertificado(e.target.value)}
                                placeholder="Senha (se houver)"
                              />
                            </div>

                            <div>
                              <Label>URL Base da API PIX</Label>
                              <Input
                                value={pixUrlBase}
                                onChange={(e) => setPixUrlBase(e.target.value)}
                                placeholder="https://api.sicoob.com.br/pix/api/v2"
                              />
                            </div>

                            <div>
                              <Label>URL Token OAuth</Label>
                              <Input
                                value={pixUrlToken}
                                onChange={(e) => setPixUrlToken(e.target.value)}
                                placeholder="https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingAccount ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Contas Cadastradas</CardTitle>
            <CardDescription>
              Lista de todas as contas bancárias configuradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>PIX</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma conta cadastrada
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {getBancoNome(account.banco)}
                      </TableCell>
                      <TableCell>{account.titular_nome || "-"}</TableCell>
                      <TableCell>
                        {account.agencia_numero}
                        {account.agencia_dv && `-${account.agencia_dv}`}
                      </TableCell>
                      <TableCell>
                        {account.conta_numero}
                        {account.conta_dv && `-${account.conta_dv}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            {account.pix_ativo === "S" ? (
                              <>
                                <Badge className="bg-green-100 text-green-800 w-fit">
                                  Ativo
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700"
                                  onClick={() => handleTogglePix(account)}
                                  title="Desativar PIX"
                                >
                                  Desativar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="secondary" className="w-fit">Inativo</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                                  onClick={() => handleTogglePix(account)}
                                  title="Ativar PIX"
                                >
                                  Ativar
                                </Button>
                              </>
                            )}
                          </div>
                          {account.pix_ativo === "S" && (
                            <div>
                              {account.pix_provedor === "mercadopago" ? (
                                <Badge className="bg-blue-100 text-blue-800 w-fit text-xs">
                                  💳 Mercado Pago
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 w-fit text-xs">
                                  🏦 Sicoob
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
