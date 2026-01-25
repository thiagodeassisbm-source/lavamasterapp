'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Wrench, ArrowRight, CheckCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoLM from '@/lib/presentation/components/LogoLM';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Ensure animations play after mount and check for remembered credentials
  useEffect(() => {
    setIsMounted(true);

    // Check if user is already logged in (Auto-redirect)
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await fetch('/api/usuarios/me');
          if (res.ok) {
            router.push('/dashboard');
          }
        } catch (e) {
          console.error("Session check failed", e);
        }
      }
    };
    checkSession();

    // Load remembered credentials
    const savedEmail = localStorage.getItem('remember_email');
    const savedPass = localStorage.getItem('remember_pass');
    if (savedEmail && savedPass) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        password: savedPass,
        rememberMe: true
      }));
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao entrar');
      }

      // Handle Remember Me
      if (formData.rememberMe) {
        localStorage.setItem('remember_email', formData.email);
        localStorage.setItem('remember_pass', formData.password);
      } else {
        localStorage.removeItem('remember_email');
        localStorage.removeItem('remember_pass');
      }

      toast.success(`Bem-vindo, ${data.user.nome}!`);

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      router.push(data.redirect || '/dashboard');

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className={`w-full max-w-6xl grid lg:grid-cols-2 gap-8 z-10 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Left Side - Hero Content */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative">
          <div className="relative z-10 space-y-8">
            <LogoLM size="xl" className="animate-fade-in" />

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight text-white mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Lava Master
                </span> <br />
                Estética Automotiva
              </h1>
              <p className="text-xl text-slate-400 max-w-md leading-relaxed">
                Gestão completa para sua estética automotiva. Controle total, onde você estiver.
              </p>
            </div>

            <div className="pt-8 space-y-4">
              {[
                "Painel de Dashboard em Tempo Real",
                "Gestão de Agendamentos Inteligente",
                "Controle Financeiro Completo"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300 animate-slide-up" style={{ animationDelay: `${i * 100 + 300}ms` }}>
                  <div className="p-1 rounded-full bg-blue-500/20 text-blue-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form (Glass Card) */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">

            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Login</h2>
                <p className="text-slate-400">Acesse sua conta para continuar.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="group/input space-y-2">
                    <label className="text-sm font-medium text-slate-400 group-focus-within/input:text-blue-400 transition-colors">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="admin@lavamaster.com"
                      />
                    </div>
                  </div>

                  <div className="group/input space-y-2">
                    <label className="text-sm font-medium text-slate-400 group-focus-within/input:text-blue-400 transition-colors">Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group/check">
                        <div className="relative flex items-center h-5">
                          <input
                            name="rememberMe"
                            type="checkbox"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border border-slate-800 bg-slate-950/50 flex items-center justify-center transition-all group-hover/check:border-blue-500/50 ${formData.rememberMe ? 'border-blue-500/50' : ''}`}>
                            {formData.rememberMe && <Check className="w-3.5 h-3.5 text-blue-500" strokeWidth={4} />}
                          </div>
                        </div>
                        <span className="text-sm text-slate-500 group-hover/check:text-slate-300 transition-colors">Manter conectado</span>
                      </label>
                      <a href="/forgot-password" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">Esqueceu sua senha?</a>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/20 transform transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer text removed as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
