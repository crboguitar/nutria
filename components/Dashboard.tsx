
import React, { useState, useRef } from 'react';
import { Profile, Measure, ProfileRole, Goal } from '../types';
import { Button } from './Button';

interface DashboardProps {
  profiles: Profile[];
  measures: Measure[];
  onUpdateProfile: (p: Profile) => void;
  onAddProfile: (p: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onAddMeasure: (m: Measure) => void;
}

const compressImage = (file: File, maxWidth = 300): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  profiles, 
  measures, 
  onUpdateProfile, 
  onAddProfile, 
  onDeleteProfile,
  onAddMeasure 
}) => {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isAddingMeasure, setIsAddingMeasure] = useState(false);

  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [measureData, setMeasureData] = useState<Partial<Measure>>({ 
    profile_id: profiles[0]?.profile_id || '',
    data: new Date().toISOString().split('T')[0] 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizeArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const finalProfile: Profile = {
      ...formData,
      profile_id: editingProfile ? editingProfile.profile_id : Date.now().toString(),
      restricoes: normalizeArray(formData.restricoes),
      preferencias: normalizeArray(formData.preferencias),
    } as Profile;

    if (editingProfile) {
      onUpdateProfile(finalProfile);
      setEditingProfile(null);
    } else {
      onAddProfile(finalProfile);
      setIsAddingProfile(false);
    }
    setFormData({});
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 200);
      setFormData(prev => ({ ...prev, foto_url: compressed }));
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto_url: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveMeasure = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeasure(measureData as Measure);
    setIsAddingMeasure(false);
  };

  const getProfileColor = (papel?: ProfileRole) => {
    switch (papel) {
      case ProfileRole.USER: return 'bg-blue-500';
      case ProfileRole.SPOUSE: return 'bg-pink-500';
      case ProfileRole.HUSBAND: return 'bg-indigo-600';
      case ProfileRole.CHILD: return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const closeModal = () => {
    setEditingProfile(null);
    setIsAddingProfile(false);
    setIsAddingMeasure(false);
    setFormData({});
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto overflow-y-auto h-full no-scrollbar pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cérebro Central</h2>
          <p className="text-slate-500 text-sm font-medium">Controle sua família e métricas de saúde.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsAddingMeasure(true)} className="gap-2 h-12 px-6 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-black text-[10px] tracking-widest">
             + Medição
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setIsAddingProfile(true); setFormData({ papel: ProfileRole.CHILD, objetivo: Goal.MAINTAIN }); }} className="gap-2 h-12 px-6 rounded-2xl shadow-lg shadow-emerald-200 font-black text-[10px] tracking-widest">
             + Perfil
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          Perfis Ativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((profile) => (
            <div key={profile.profile_id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group relative hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-5">
                {profile.foto_url ? (
                  <img src={profile.foto_url} alt={profile.nome} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-4 ring-slate-50 transition-transform group-hover:scale-105" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-sm text-xl ${getProfileColor(profile.papel)}`}>
                    {profile.nome.charAt(0)}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProfile(profile); setFormData(profile); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => { if(confirm('Excluir?')) onDeleteProfile(profile.profile_id); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-800 leading-tight mb-1">{profile.nome}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">{profile.papel}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                  <span className="block text-[9px] text-slate-400 font-black uppercase mb-1">Peso Atual</span>
                  <div className="flex items-end gap-1">
                    <span className="font-black text-slate-800 text-lg leading-none">{profile.peso_atual_kg}</span>
                    <span className="text-[9px] text-slate-400 font-black mb-0.5 uppercase tracking-tighter">kg</span>
                  </div>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/30">
                  <span className="block text-[9px] text-emerald-600/60 font-black uppercase mb-1">Objetivo</span>
                  <span className="font-black text-emerald-700 text-xs block capitalize truncate">{profile.objetivo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Perfil - UX ESTABILIZADA */}
      {(isAddingProfile || editingProfile) && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overscroll-none">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={closeModal} />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col h-[92dvh] sm:h-auto sm:max-h-[90vh]">
            
            {/* Header Fixo */}
            <div className="p-7 sm:p-9 pb-5 flex justify-between items-center shrink-0 bg-white rounded-t-[3rem] border-b border-slate-50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
                </h3>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Configuração Vital</p>
              </div>
              <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-full active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Scroll Interno com Padding para Teclado */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-7 sm:p-9 space-y-8 no-scrollbar overscroll-contain pb-[40vh] sm:pb-9">
              <div className="flex flex-col items-center justify-center py-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer transition-transform active:scale-95 mb-4"
                >
                  {formData.foto_url ? (
                    <img src={formData.foto_url} className="w-28 h-28 rounded-[2.5rem] object-cover ring-8 ring-emerald-50 shadow-2xl group-hover:ring-emerald-100 transition-all duration-300" />
                  ) : (
                    <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center font-black text-white text-4xl shadow-2xl ring-8 ring-slate-50 ${getProfileColor(formData.papel)} group-hover:opacity-90 transition-all`}>
                      {(formData.nome || 'N').charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-xl text-emerald-600 border border-emerald-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <input 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-bold text-base focus:bg-white focus:border-emerald-500 transition-all outline-none" 
                    placeholder="Como devemos chamar?" 
                    value={formData.nome || ''} 
                    onChange={e => setFormData({...formData, nome: e.target.value})} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vínculo</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none" 
                      value={formData.papel || ''} 
                      onChange={e => setFormData({...formData, papel: e.target.value as ProfileRole})}
                    >
                      <option value={ProfileRole.USER}>Usuário</option>
                      <option value={ProfileRole.SPOUSE}>Esposa</option>
                      <option value={ProfileRole.HUSBAND}>Marido</option>
                      <option value={ProfileRole.CHILD}>Filho(a)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none" 
                      value={formData.objetivo || ''} 
                      onChange={e => setFormData({...formData, objetivo: e.target.value as Goal})}
                    >
                      <option value={Goal.LOSE}>Emagrecer</option>
                      <option value={Goal.MAINTAIN}>Manter Peso</option>
                      <option value={Goal.GAIN}>Massa Muscular</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Idade</label>
                    <input type="number" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none" value={formData.idade || ''} onChange={e => setFormData({...formData, idade: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Altura</label>
                    <input type="number" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none" value={formData.altura_cm || ''} onChange={e => setFormData({...formData, altura_cm: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peso</label>
                    <input type="number" step="0.1" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none" value={formData.peso_atual_kg || ''} onChange={e => setFormData({...formData, peso_atual_kg: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Restrições</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none min-h-[100px] resize-none" 
                    placeholder="Ex: Lactose, Glúten..." 
                    value={Array.isArray(formData.restricoes) ? formData.restricoes.join(', ') : formData.restricoes || ''} 
                    // Cast to any to handle intermediate string state for array field
                    onChange={e => setFormData({...formData, restricoes: e.target.value as any})} 
                  />
                </div>
              </div>
            </form>

            {/* Footer Fixo do Modal */}
            <div className="p-7 sm:p-9 pt-4 bg-white border-t border-slate-50 shrink-0 flex gap-4">
              <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl text-slate-400 font-black tracking-widest text-[10px]" onClick={closeModal}>CANCELAR</Button>
              <Button type="button" variant="primary" className="flex-[2] h-16 rounded-2xl shadow-xl shadow-emerald-500/20 font-black tracking-widest text-[10px]" onClick={handleSaveProfile}>
                {editingProfile ? 'SALVAR ALTERAÇÕES' : 'CRIAR PERFIL'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Medição Simples */}
      {isAddingMeasure && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Log de Saúde</h3>
            <form onSubmit={handleSaveMeasure} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Perfil</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none appearance-none" 
                  value={measureData.profile_id} 
                  onChange={e => setMeasureData({...measureData, profile_id: e.target.value})}
                >
                  {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peso (kg)</label>
                <input type="number" step="0.1" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" required onChange={e => setMeasureData({...measureData, peso_kg: parseFloat(e.target.value)})} />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={closeModal}>CANCELAR</Button>
                <Button type="submit" variant="primary" className="flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20">SALVAR LOG</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
