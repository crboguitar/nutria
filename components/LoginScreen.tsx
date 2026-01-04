
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { googleService } from '../services/googleService';
import { UserSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(googleService.getClientId() || '');
  const [detectedOrigin, setDetectedOrigin] = useState('');

  useEffect(() => {
    setDetectedOrigin(window.location.origin);
  }, []);

  const handleGoogleLogin = async () => {
    if (!googleService.isConfigured()) {
      setIsConfigOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const auth = await googleService.login();
      onLoginSuccess({
        uid: 'google_' + auth.user.email,
        email: auth.user.email,
        displayName: auth.user.name,
        photoURL: auth.user.picture,
        authType: 'google',
        token: auth.accessToken
      });
    } catch (e: any) {
      console.error("Login Fail:", e);
      setIsLoading(false);
      setIsConfigOpen(true);
    }
  };

  const saveConfig = () => {
    googleService.setClientId(clientIdInput);
    setIsConfigOpen(false);
    alert("Configuração salva. Tente entrar novamente.");
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
           <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none">
             <path d="M30 80V35C30 20 45 20 45 20C55 20 60 30 60 40V80" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
             <path d="M60 40C85 35 85 20 85 20C85 5 70 5 60 20C50 35 60 40 60 40Z" fill="#10b981" />
           </svg>
        </div>
        <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">Nutr<span className="text-emerald-600">IA</span></h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Saúde Familiar Inteligente</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full h-20 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl disabled:opacity-50"
        >
          {isLoading ? 'Conectando...' : 'Entrar e Sincronizar'}
        </button>

        <button 
          onClick={() => onLoginSuccess({ uid: 'local', email: 'local@nutria.com', displayName: 'Usuário Local', authType: 'local' })}
          className="w-full h-16 bg-white border-2 border-slate-100 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
        >
          Usar Modo Local (Sem Nuvem)
        </button>

        <button 
          onClick={() => setIsConfigOpen(true)}
          className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8 hover:text-emerald-500 transition-colors"
        >
          Configurar Client ID / Erro 400
        </button>
      </div>

      {isConfigOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/98 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-start mb-8">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cloud Setup</h3>
               <button onClick={() => setIsConfigOpen(false)} className="text-slate-300 hover:text-red-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="space-y-6 text-left">
              <div className="bg-red-50 border border-red-100 p-6 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">⚠️ Para corrigir o Erro 400:</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">O Google exige que você autorize a URL abaixo em seu console como <strong>Origem Autorizada</strong>:</p>
                <code className="block bg-white p-4 rounded-xl border border-red-200 text-[10px] font-mono break-all select-all text-red-900">{detectedOrigin}</code>
                <button 
                  onClick={() => { navigator.clipboard.writeText(detectedOrigin); alert("URL Copiada!"); }}
                  className="w-full h-12 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest mt-2"
                >
                  COPIAR URL PARA O CONSOLE
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seu Google Client ID</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-mono outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  rows={2}
                  value={clientIdInput}
                  onChange={e => setClientIdInput(e.target.value)}
                  placeholder="6011...apps.googleusercontent.com"
                />
              </div>

              <Button className="w-full h-16 rounded-2xl shadow-xl shadow-emerald-500/20" onClick={saveConfig}>
                SALVAR CONFIGURAÇÃO
              </Button>
              
              <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="w-full text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4 hover:text-red-500"
              >
                Limpar Todos os Dados e Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
