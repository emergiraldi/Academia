import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StudentResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extrair email e código da query string
  const urlParams = new URLSearchParams(searchParams);
  const email = urlParams.get("email") || "";
  const code = urlParams.get("code") || "";

  useEffect(() => {
    if (!email || !code) {
      toast.error("Dados incompletos. Volte e tente novamente.");
      setLocation("/student/forgot-password");
    }
  }, [email, code, setLocation]);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Senha alterada com sucesso!");
      // Redirecionar para login após sucesso
      setTimeout(() => {
        setLocation("/student/login");
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha. Tente novamente.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordMutation.mutateAsync({
        email,
        code,
        newPassword,
      });
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
          onClick={() => setLocation(`/student/verify-code?email=${encodeURIComponent(email)}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600 dark:text-purple-300" />
            </div>
            <CardTitle className="text-2xl">Nova Senha</CardTitle>
            <CardDescription>
              Defina uma nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">
                  As senhas não coincidem
                </p>
              )}

              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-destructive">
                  A senha deve ter no mínimo 6 caracteres
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 6
                }
              >
                {isLoading ? "Alterando..." : "Alterar Senha"}
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
