import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in with a real session
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Digite seu email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, nome);
        // Tentar login imediato (funciona se confirmação de email está desabilitada)
        try {
          await signIn(email, password);
          toast.success("Conta criada com sucesso!");
          navigate("/");
        } catch {
          // Se falhar (email não confirmado), mostrar mensagem amigável
          toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
          setIsSignUp(false);
        }
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("already registered") || msg.includes("already_exists")) {
        toast.error("Este email já está cadastrado. Use 'Entrar' para fazer login.");
        setIsSignUp(false);
      } else if (msg.includes("Invalid login")) {
        toast.error("Email ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Email não confirmado. Verifique sua caixa de entrada.");
      } else {
        toast.error(msg || "Erro ao autenticar");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="w-full max-w-md mx-4">
          <div className="glass-card-premium p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg font-bold text-white mb-3">
                EA
              </div>
              <h1 className="text-2xl font-bold text-foreground">Sistema Esquadria</h1>
              <p className="text-sm text-muted-foreground">Gestão de Esquadrias de Alumínio</p>
            </div>
            <h2 className="text-lg font-semibold text-foreground text-center mb-2">Recuperar senha</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground mt-6">
              <button onClick={() => setIsForgotPassword(false)} className="text-primary font-medium hover:underline">
                Voltar ao login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-md mx-4">
        <div className="glass-card-premium p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg font-bold text-white mb-3">
              EA
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sistema Esquadria</h1>
            <p className="text-sm text-muted-foreground">Gestão de Esquadrias de Alumínio</p>
          </div>

          <h2 className="text-lg font-semibold text-foreground text-center mb-6">
            {isSignUp ? "Criar conta" : "Entrar no sistema"}
          </h2>

          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
            <p className="font-semibold mb-1">Aviso de Teste / Desenvolvimento:</p>
            <p>Se o Supabase (Authentication &gt; Providers &gt; Email) tiver a opção <strong>"Confirm email"</strong> ativada, você precisará usar um e-mail real e confirmá-lo. Para usar dados fictícios e entrar direto, desabilite esta configuração no seu painel do Supabase.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
