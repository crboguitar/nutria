
import React, { useState, useRef, useMemo } from 'react';
import { Meal, Profile, Recipe } from '../types';
import { Button } from './Button';
import { geminiService } from '../services/geminiService';

interface MealTrackerProps {
  profiles: Profile[];
  meals: Meal[];
  recipes: Recipe[];
  onAddMeal: (meal: Meal) => void;
  onDeleteMeal: (id: string) => void;
}

const compressImage = (file: File, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

export const MealTracker: React.FC<MealTrackerProps> = ({ profiles, meals, recipes, onAddMeal, onDeleteMeal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [shoppingListContent, setShoppingListContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Meal>>({
    profile_ids: [],
    tipo: 'almoco',
    data: new Date().toISOString()
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 600);
      setFormData(prev => ({ ...prev, foto_url: compressed }));
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, foto_url: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profile_ids?.length || !formData.descricao) return;

    const estimatedCals = formData.calorias_estimadas || Math.floor(Math.random() * (600 - 200 + 1) + 200);

    const newMeal: Meal = {
      ...formData,
      meal_id: Date.now().toString(),
      data: new Date().toISOString(),
      calorias_estimadas: estimatedCals
    } as Meal;

    onAddMeal(newMeal);
    setIsModalOpen(false);
    setFormData({ profile_ids: [], tipo: 'almoco', data: new Date().toISOString() });
  };

  const handleGenerateShoppingList = async () => {
    if (meals.length === 0) {
      alert("Registre algumas refeições primeiro para gerar a lista.");
      return;
    }
    setIsGenerating(true);
    try {
      const list = await geminiService.generateShoppingList(meals, profiles);
      setShoppingListContent(list);
      setIsShoppingListOpen(true);
    } catch (e) {
      alert("Erro ao gerar lista.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleProfile = (id: string) => {
    const current = formData.profile_ids || [];
    if (current.includes(id)) {
      setFormData({ ...formData, profile_ids: current.filter(p => p !== id) });
    } else {
      setFormData({ ...formData, profile_ids: [...current, id] });
    }
  };

  const getMealIcon = (tipo: string) => {
    switch(tipo) {
      case 'cafe': return '🌅';
      case 'almoco': return '☀️';
      case 'lanche': return '🍎';
      case 'jantar': return '🌙';
      default: return '🍴';
    }
  };

  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchesType = !typeFilter || meal.tipo === typeFilter;
      const matchesProfile = !profileFilter || meal.profile_ids.includes(profileFilter);
      return matchesType && matchesProfile;
    });
  }, [meals, typeFilter, profileFilter]);

  const totalCalories = useMemo(() => {
    return filteredMeals.reduce((acc, meal) => acc + (meal.calorias_estimadas || 0), 0);
  }, [filteredMeals]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto h-full overflow-y-auto no-scrollbar pb-32">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diário Alimentar</h2>
          <p className="text-slate-500 text-sm">O que sua família consumiu hoje.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="rounded-2xl shadow-lg shadow-emerald-200">
          + Refeição
        </Button>
      </header>

      {/* Resumo Dinâmico */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 012 2h2a2 2 0 012-2" /></svg>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              {profileFilter || typeFilter ? 'Consumo Filtrado' : 'Consumo do Dia'}
            </span>
            <button 
              onClick={handleGenerateShoppingList}
              disabled={isGenerating}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 backdrop-blur-md border border-white/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              )}
              {isGenerating ? 'Gerando...' : 'Lista de Compras IA'}
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tighter">{totalCalories}</span>
            <span className="text-emerald-100 font-bold text-lg">kcal</span>
          </div>
          <div className="flex gap-2 pt-2">
            {(profileFilter || typeFilter) && (
              <button 
                onClick={() => { setProfileFilter(null); setTypeFilter(null); }}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Filtros */}
      <section className="space-y-6">
        {/* Filtro por Perfil */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Membros da Família</label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            <button
              onClick={() => setProfileFilter(null)}
              className={`whitespace-nowrap px-5 py-3 rounded-2xl text-xs font-black transition-all border-2 ${!profileFilter ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 border-slate-50'}`}
            >
              Todos
            </button>
            {profiles.map(p => (
              <button
                key={p.profile_id}
                onClick={() => setProfileFilter(profileFilter === p.profile_id ? null : p.profile_id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${profileFilter === p.profile_id ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white border-slate-50 text-slate-500 shadow-sm'}`}
              >
                {p.foto_url ? (
                  <img src={p.foto_url} className="w-6 h-6 rounded-lg object-cover" alt={p.nome} />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">{p.nome.charAt(0)}</div>
                )}
                {p.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Tipo */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Momentos do Dia</label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {['cafe', 'almoco', 'lanche', 'jantar'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-2xl text-xs font-black transition-all border-2 capitalize ${typeFilter === type ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white border-slate-50 text-slate-500 shadow-sm'}`}
              >
                <span className="text-lg">{getMealIcon(type)}</span>
                {type === 'cafe' ? 'Café' : type === 'almoco' ? 'Almoço' : type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline de Refeições */}
      <div className="space-y-5 pt-4">
        {filteredMeals.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="text-5xl mb-6">🥑</div>
            <h4 className="text-slate-800 font-black text-lg mb-2">Nada por aqui!</h4>
            <p className="text-slate-400 text-sm max-w-[200px] mx-auto leading-relaxed">Não encontramos refeições com esses filtros. Tente mudar sua busca.</p>
          </div>
        ) : (
          filteredMeals.map(meal => (
            <div key={meal.meal_id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 group hover:border-emerald-100 transition-all animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className="text-3xl bg-slate-50 w-14 h-14 flex items-center justify-center rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    {getMealIcon(meal.tipo)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 capitalize tracking-tight">{meal.tipo}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {new Date(meal.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => onDeleteMeal(meal.meal_id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-700 font-semibold leading-relaxed text-sm">{meal.descricao}</p>
                
                {meal.foto_url && (
                  <div className="relative rounded-[1.5rem] overflow-hidden shadow-inner border border-slate-50">
                    <img src={meal.foto_url} className="w-full h-56 object-cover" alt="Refeição" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-3">
                    {meal.profile_ids.map(pid => {
                      const p = profiles.find(pr => pr.profile_id === pid);
                      return p?.foto_url ? (
                        <img key={pid} src={p.foto_url} className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" title={p.nome} />
                      ) : (
                        <div key={pid} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm" title={p?.nome}>
                          {p?.nome.charAt(0)}
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100/50 shadow-sm">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">{meal.calorias_estimadas} kcal</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Lista de Compras IA */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="text-emerald-600">IA</span> Lista de Compras
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Baseado no histórico familiar</p>
              </div>
              <button onClick={() => setIsShoppingListOpen(false)} className="p-3 text-slate-300 hover:text-slate-800 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              <div className="bg-slate-50 rounded-[2rem] p-6 text-slate-700 prose prose-sm max-w-none">
                {shoppingListContent?.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 font-medium">{line}</p>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex gap-3 shrink-0">
               <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl" 
                onClick={() => {
                  navigator.clipboard.writeText(shoppingListContent || '');
                  alert("Copiado!");
                }}
               >
                 Copiar Lista
               </Button>
               <Button 
                variant="primary" 
                className="flex-[2] h-14 rounded-2xl shadow-xl shadow-emerald-500/20" 
                onClick={() => setIsShoppingListOpen(false)}
               >
                 Entendido!
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Refeição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nova Refeição</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quem participou?</label>
                <div className="flex flex-wrap gap-3">
                  {profiles.map(p => (
                    <button
                      key={p.profile_id}
                      type="button"
                      onClick={() => toggleProfile(p.profile_id)}
                      className={`flex items-center gap-2 p-2.5 pr-4 rounded-2xl border-2 transition-all ${formData.profile_ids?.includes(p.profile_id) ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50 text-slate-400 opacity-60'}`}
                    >
                      {p.foto_url ? (
                        <img src={p.foto_url} className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-xs">{p.nome.charAt(0)}</div>
                      )}
                      <span className="text-xs font-black">{p.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {['cafe', 'almoco', 'lanche', 'jantar'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, tipo: type as any})}
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${formData.tipo === type ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50'}`}
                  >
                    <span className="text-2xl">{getMealIcon(type)}</span>
                    <span className="text-[9px] font-black uppercase text-slate-500">{type === 'cafe' ? 'Café' : type === 'almoco' ? 'Almoço' : type}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">O que comeram?</label>
                <textarea
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-5 text-slate-800 font-bold focus:border-emerald-500 focus:bg-white outline-none min-h-[120px] transition-all"
                  placeholder="Ex: Frango grelhado com salada de rúcula..."
                  value={formData.descricao || ''}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Foto da Refeição</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-emerald-200 transition-all group overflow-hidden"
                >
                  {formData.foto_url ? (
                    <>
                      <img src={formData.foto_url} className="w-full h-full object-cover rounded-[1.8rem]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white px-5 py-2.5 rounded-2xl text-xs font-black text-slate-800 shadow-2xl">TROCAR FOTO</span>
                      </div>
                      <button 
                        onClick={removePhoto}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2.5 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-transform"
                        title="Remover foto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abrir Câmera ou Galeria</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-[1.25rem]" onClick={() => setIsModalOpen(false)}>CANCELAR</Button>
                <Button type="submit" variant="primary" className="flex-[2] h-16 rounded-[1.25rem] shadow-xl shadow-emerald-500/20 font-black tracking-tight">SALVAR REFEIÇÃO</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
