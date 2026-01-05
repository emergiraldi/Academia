import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Sistema de <span className="text-gradient">Academia</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gestão completa com controle de acesso biométrico, pagamentos automáticos e treinos personalizados
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {/* Student Access */}
          <Card className="card-hover cursor-pointer" onClick={() => setLocation("/student/login")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sou Aluno</CardTitle>
              <CardDescription className="text-base">
                Acesse seus treinos, pagamentos e carteirinha digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Entrar como Aluno
              </Button>
            </CardContent>
          </Card>

          {/* Professor Access */}
          <Card className="card-hover cursor-pointer" onClick={() => setLocation("/professor/login")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sou Professor</CardTitle>
              <CardDescription className="text-base">
                Crie e gerencie exercícios e treinos personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Entrar como Professor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Controle de Acesso Facial</h3>
                <p className="text-sm text-muted-foreground">
                  Integração com Control ID para reconhecimento facial
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pagamento PIX Automático</h3>
                <p className="text-sm text-muted-foreground">
                  Liberação de acesso em tempo real após confirmação
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Treinos Personalizados</h3>
                <p className="text-sm text-muted-foreground">
                  Professores criam exercícios com fotos e vídeos
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestão de Exames Médicos</h3>
                <p className="text-sm text-muted-foreground">
                  Controle de validade e bloqueio automático
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
