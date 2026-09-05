import React, { useState } from 'react';
import { 
  Boxes, 
  Lock, 
  User, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Database,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { SystemUser } from '../types.ts';
import * as api from '../services/api.ts';

interface LoginScreenProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Por favor, informe o usuário e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.login(username.trim(), password);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card container */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/20 mb-3.5">
            <Boxes className="w-7 h-7 stroke-[2.3]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Sistema de Almoxarifado
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de Estoque, Bipagem & Gestão de Acesso
          </p>

          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>SQLite Persistente • Autenticação Segura</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-username">
              Usuário / Login
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin ou marcos"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Validando Acesso...
              </span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
              Acesso Rápido para Teste
            </span>
          </div>
        </div>

        {/* Quick select profiles */}
        <div className="space-y-2">
          {/* Admin */}
          <button
            type="button"
            onClick={() => handleQuickFill('admin', 'admin123')}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              username === 'admin' 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                👑
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Administrador
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Acesso Total
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Login: <strong>admin</strong> | Senha: <strong>admin123</strong></p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
              Preencher
            </span>
          </button>

          {/* Operador */}
          <button
            type="button"
            onClick={() => handleQuickFill('marcos', '123')}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              username === 'marcos' 
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300' 
                : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                👷
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Marcos Almeida
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    Operador
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Login: <strong>marcos</strong> | Senha: <strong>123</strong></p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
              Preencher
            </span>
          </button>

          {/* Consulta */}
          <button
            type="button"
            onClick={() => handleQuickFill('visitante', '123')}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              username === 'visitante' 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                🔍
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Auditoria & Consulta
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Leitura
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Login: <strong>visitante</strong> | Senha: <strong>123</strong></p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
              Preencher
            </span>
          </button>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            Senhas criptografadas com SHA-256 e controle de permissões por perfil.
          </p>
        </div>

      </div>
    </div>
  );
};
