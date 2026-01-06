import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GymSignUp() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agentId, setAgentId] = useState("");

  const [formData, setFormData] = useState({
    // Dados da Academia
    gymName: "",
    gymSlug: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",

    // Dados do Administrador
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const signUpMutation = trpc.gyms.signUp.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setAgentId(data.agentId);
      toast.success("Academia cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar academia");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUpMutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlugChange = (name: string) => {
    // Auto-generate slug from gym name
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens
      .trim();

    setFormData({ ...formData, gymName: name, gymSlug: slug });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-t-4 border-t-green-600 shadow-lg">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-700 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Academia Cadastrada!</CardTitle>
            <CardDescription>
              Sua academia foi cadastrada com sucesso. Siga as instruções abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h3 className="font-semibold mb-2">Próximos Passos:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Faça login com o email e senha cadastrados</li>
                <li>Configure seus planos de mensalidade</li>
                <li>Cadastre seus alunos</li>
                <li>
                  <strong>Configure o Agent Local</strong> (para reconhecimento facial):
                  <div className="ml-6 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                    <p>Seu Agent ID: <strong className="text-blue-600">{agentId}</strong></p>
                    <p className="mt-2">Configure no arquivo agent/.env:</p>
                    <p className="text-gray-600">AGENT_ID={agentId}</p>
                  </div>
                </li>
              </ol>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Ir para Login
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("/docs/AGENT-LOCAL.md", "_blank")}
              >
                Ver Documentação do Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-t-4 border-t-blue-600 shadow-lg">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Cadastrar Academia</CardTitle>
            <CardDescription>
              Preencha os dados para criar sua conta na plataforma SysFit Pro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Academia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados da Academia</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gymName">Nome da Academia *</Label>
                    <Input
                      id="gymName"
                      placeholder="Ex: Academia Fit Life"
                      value={formData.gymName}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gymSlug">
                      Identificador (URL) *
                      <span className="text-xs text-muted-foreground ml-2">
                        (gerado automaticamente)
                      </span>
                    </Label>
                    <Input
                      id="gymSlug"
                      placeholder="academia-fit-life"
                      value={formData.gymSlug}
                      onChange={(e) => setFormData({ ...formData, gymSlug: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL de acesso: https://www.sysfitpro.com.br/{formData.gymSlug}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@academia.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      placeholder="Rua, Número, Bairro"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="UF"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Administrador */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Administrador</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="adminName">Nome Completo *</Label>
                    <Input
                      id="adminName"
                      placeholder="Seu nome completo"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Senha *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar Academia"}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Ao cadastrar, você concorda com os termos de uso da plataforma
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
