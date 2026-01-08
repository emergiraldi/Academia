import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StudentForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Código enviado! Verifique seu email.");
      // Redirecionar para tela de verificação com o email
      setLocation(`/student/verify-code?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar código. Tente novamente.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsLoading(true);
    try {
      await requestResetMutation.mutateAsync({ email });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/student/login")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Login
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Digite seu email e enviaremos um código de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email cadastrado</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Enviaremos um código de 6 dígitos para este email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? "Enviando..." : "Enviar Código"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Lembrou sua senha?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setLocation("/student/login")}
                >
                  Fazer login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
