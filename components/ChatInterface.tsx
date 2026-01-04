
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Profile, UserSession, Meal, Recipe, Measure } from '../types';
import { GeminiService } from '../services/geminiService';
import { QUICK_REPLIES_DEFAULT } from '../constants';
import { Tab } from '../App';
import { googleService } from '../services/googleService';

interface ChatInterfaceProps {
  profiles: Profile[];
  contextTab: Tab;
  session: UserSession;
  appData: {
    profiles: Profile[];
    meals: Meal[];
    recipes: Recipe[];
    measures: Measure[];
  };
}

const gemini = new GeminiService();

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profiles, contextTab, session, appData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá! Sou o **NutrIA**. Estou aqui para cuidar da saúde da sua família. Deseja organizar os dados de hoje ou planejar a próxima refeição?`,
      timestamp: new Date(),
      quickReplies: QUICK_REPLIES_DEFAULT
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, syncStatus]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const contextText = `Membros da Família: ${profiles.map(p => p.nome).join(', ')}. Intenção: ${text}. Contexto do App: ${contextTab}`;
      const response = await gemini.generateResponse(history, contextText);

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'organizeAndSaveToDrive') {
            if (!session.token) {
              const assistantMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `⚠️ Preciso que você esteja conectado ao Google Drive para salvar seus dados. Por favor, faça login na aba **Conta**.`,
                timestamp: new Date(),
                quickReplies: ["Ir para Conta"]
              };
              setMessages(prev => [...prev, assistantMessage]);
              continue;
            }

            setSyncStatus('syncing');
            try {
              const actualFolderName = await googleService.syncAllData(session.token, appData);
              setSyncStatus('success');
              
              const assistantMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `✅ Sincronização concluída com sucesso! Salvei todos os dados da família na pasta **"${actualFolderName}"** do seu Google Drive, organizada por data.`,
                timestamp: new Date(),
                quickReplies: QUICK_REPLIES_DEFAULT
              };
              setMessages(prev => [...prev, assistantMessage]);
            } catch (err) {
              setSyncStatus('error');
              const assistantMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ Houve um erro ao sincronizar com o Google Drive. Verifique sua conexão e tente novamente.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, assistantMessage]);
            } finally {
              setTimeout(() => setSyncStatus('idle'), 3000);
            }
          }
        }
      } else {
        const responseText = response.text || "";
        const quickReplyRegex = /\[([^\]]+)\]/g;
        const foundReplies: string[] = [];
        let match;
        while ((match = quickReplyRegex.exec(responseText)) !== null) {
          foundReplies.push(match[1]);
        }
        const cleanedText = responseText.replace(/\[([^\]]+)\]/g, '').trim();

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: cleanedText || responseText,
          timestamp: new Date(),
          quickReplies: foundReplies.length > 0 ? foundReplies : QUICK_REPLIES_DEFAULT
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'err', role: 'assistant', content: 'Ops, tive um problema de conexão. Vamos tentar de novo?', timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualSuggestions = (tab: Tab): { label: string, prompt: string }[] => {
    switch (tab) {
      case Tab.MEALS:
        return [
          { label: "🌅 Registrar café", prompt: "Quero registrar o café da manhã da família" },
          { label: "🛒 Gerar lista IA", prompt: "Gerar lista de compras para a semana" },
          { label: "🔥 Calorias do dia", prompt: "Quantas calorias consumimos hoje no total?" }
        ];
      case Tab.DASHBOARD:
        return [
          { label: "📈 Evolução de peso", prompt: "Como está o progresso de peso do Cláudio?" },
          { label: "➕ Novo membro", prompt: "Como adiciono um novo perfil familiar?" },
          { label: "🏥 Resumo de saúde", prompt: "Resumo de saúde da família" }
        ];
      case Tab.RECIPES:
        return [
          { label: "🍝 Sugestão de jantar", prompt: "Sugira um jantar saudável para hoje" },
          { label: "🚫 Sem lactose", prompt: "Receitas rápidas sem lactose" },
          { label: "🍰 Sobremesa fit", prompt: "Receita de sobremesa fit" }
        ];
      case Tab.SETTINGS:
        return [
          { label: "☁️ Backup agora", prompt: "Fazer backup completo no Google Drive" },
          { label: "🔒 Meus dados", prompt: "Como meus dados são protegidos?" },
          { label: "📄 Exportar PDF", prompt: "Como exportar meu diário para PDF?" }
        ];
      default:
        return [
          { label: "🤔 O que posso fazer?", prompt: "O que você pode fazer por mim?" },
          { label: "🥗 Planejar cardápio", prompt: "Ajude-me a planejar o cardápio de amanhã" }
        ];
    }
  };

  const currentSuggestions = getContextualSuggestions(contextTab);

  return (
    <div className="flex flex-col h-full bg-white max-w-2xl mx-auto shadow-2xl relative">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-slate-50/30"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[88%] rounded-[2rem] px-6 py-4 shadow-sm border ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none' 
                : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
            }`}>
              <div className="prose prose-sm prose-slate leading-relaxed">
                {msg.content.split('\n').map((line, i) => (
                   <p key={i} className="mb-2 last:mb-0 font-medium text-[15px]">{line}</p>
                ))}
              </div>
            </div>
            {msg.quickReplies && msg.quickReplies.length > 0 && msg.role === 'assistant' && (
              <div className="flex flex-wrap gap-2 mt-4 px-1">
                {msg.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(reply)}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-100 active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {syncStatus === 'syncing' && (
          <div className="flex justify-center py-4">
            <div className="bg-emerald-600 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border border-emerald-400">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">Sincronizando com Drive</span>
                <span className="text-[10px] opacity-70">Enviando dados da família...</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && syncStatus === 'idle' && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 shadow-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-500 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 mb-1">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atalhos sugeridos</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {currentSuggestions.map((s, idx) => (
             <button
               key={idx}
               onClick={() => handleSend(s.prompt)}
               className="whitespace-nowrap bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-transparent hover:border-emerald-100 active:scale-95 shadow-sm"
             >
               {s.label}
             </button>
           ))}
        </div>
      </div>

      <div className="p-6 pt-2 bg-white shrink-0">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Como o NutrIA pode ajudar hoje?"
            className="w-full bg-slate-50 hover:bg-slate-100 border-none rounded-[2rem] pl-6 pr-16 py-5 text-base font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all outline-none text-slate-800"
          />
          <button 
            onClick={() => handleSend(input)} 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all active:scale-90 hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale shadow-lg shadow-emerald-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
