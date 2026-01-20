'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Wrench, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao entrar');
      }

      // Sucesso
      toast.success(`Bem-vindo, ${data.user.nome}!`);

      // Salva dados básicos no localStorage para uso facil no front
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      // Cookie já foi definido pelo servidor, redireciona
      router.push('/dashboard');

    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao conectar com o servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-white font-sans overflow-hidden">

      {/* Left Side - Visual & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative flex-col justify-between p-16 bg-slate-900 border-r border-white/5 overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse delay-2000" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestão Automotiva <br /> Profissional
          </h1>
          <p className="text-xl text-slate-400 max-w-md leading-relaxed">
            Otimize processos, controle seu financeiro e fidelize clientes com a plataforma mais completa do mercado.
          </p>
        </div>

        <div className="relative z-10 glass-effect rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-white/5 max-w-sm">
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500">★</div>
            ))}
          </div>
          <p className="text-slate-300 italic mb-4">"Um sistema que transformou completamente a organização da nossa estética automotiva."</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-white/10" />
            <div>
              <p className="font-semibold text-white">Carlos Mendes</p>
              <p className="text-xs text-slate-500">Proprietário Estética BR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-lg space-y-10">

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
            <p className="text-slate-400">Insira suas credenciais para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-slate-400 mb-2 group-focus-within:text-blue-400 transition-colors">Email</label>
                <div className="relative duration-300">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="w-6 h-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-14 pr-4 py-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-slate-900 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">Senha</label>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Esqueceu?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="w-6 h-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-14 pr-14 py-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-slate-900 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-600/20 transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="text-center">
              <span className="text-slate-500">Ainda não tem conta? </span>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-white hover:text-blue-400 font-semibold transition-colors"
              >
                Criar conta agora
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
