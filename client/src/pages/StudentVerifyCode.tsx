import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StudentVerifyCode() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Extrair email da query string
  const email = new URLSearchParams(searchParams).get("email") || "";

  useEffect(() => {
    if (!email) {
      toast.error("Email não encontrado. Volte e tente novamente.");
      setLocation("/student/forgot-password");
    }
  }, [email, setLocation]);

  const verifyCodeMutation = trpc.auth.verifyResetCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Código verificado!");
      // Redirecionar para tela de redefinir senha
      setLocation(`/student/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
    },
    onError: (error) => {
      toast.error(error.message || "Código inválido ou expirado");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error("O código deve ter 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      await verifyCodeMutation.mutateAsync({ email, code });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/student/forgot-password")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle className="text-2xl">Verificar Código</CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos enviado para<br />
              <span className="font-semibold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificação</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground text-center">
                  O código expira em 15 minutos
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "Verificando..." : "Verificar Código"}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o código?
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setLocation("/student/forgot-password")}
                >
                  Solicitar novo código
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
