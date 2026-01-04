
import React, { useState } from 'react';
import { Recipe } from '../types';
import { Button } from './Button';

interface RecipesProps {
  recipes: Recipe[];
  onAdd: (r: Recipe) => void;
  onUpdate: (r: Recipe) => void;
  onDelete: (id: string) => void;
}

export const Recipes: React.FC<RecipesProps> = ({ recipes, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Recipe>>({});

  const filteredRecipes = recipes.filter(r => 
    r.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Normalizing input data to ensure correct types for Recipe object
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string inputs back to arrays if they were edited as strings
    const normalizedTags = typeof formData.tags === 'string' 
      ? (formData.tags as string).split(',').map(s => s.trim()).filter(Boolean)
      : (formData.tags || []);
      
    const normalizedIngredientes = typeof formData.ingredientes === 'string'
      ? (formData.ingredientes as string).split('\n').map(s => s.trim()).filter(Boolean)
      : (formData.ingredientes || []);

    const finalRecipe: Recipe = {
      ...formData,
      recipe_id: editingRecipe ? editingRecipe.recipe_id : Date.now().toString(),
      tags: normalizedTags,
      ingredientes: normalizedIngredientes,
    } as Recipe;

    if (editingRecipe) {
      onUpdate(finalRecipe);
    } else {
      onAdd(finalRecipe);
    }
    setIsModalOpen(false);
    setEditingRecipe(null);
    setFormData({});
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto h-full overflow-y-auto no-scrollbar pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Acervo de Receitas</h2>
          <p className="text-slate-500 text-sm">Organizadas por perfil e restrições.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Nova Receita</Button>
      </header>

      <div className="relative">
        <input 
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          placeholder="Buscar por nome, ingrediente ou tag..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <p className="text-lg">Nenhuma receita encontrada.</p>
            <p className="text-sm">Tente outros termos ou adicione uma nova.</p>
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <div key={recipe.recipe_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="absolute bottom-3 left-3 flex gap-1">
                  {recipe.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 uppercase">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">{recipe.nome}</h4>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{recipe.modo_preparo}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recipe.tempo_preparo}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingRecipe(recipe); setFormData(recipe); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => { if(confirm('Remover receita?')) onDelete(recipe.recipe_id); }} className="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editingRecipe ? 'Editar Receita' : 'Nova Receita'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Nome da Receita" 
                  value={formData.nome || ''} 
                  onChange={e => setFormData({...formData, nome: e.target.value})} 
                  required 
                />
                <input 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Tempo (ex: 30 min)" 
                  value={formData.tempo_preparo || ''} 
                  onChange={e => setFormData({...formData, tempo_preparo: e.target.value})} 
                />
              </div>
              <input 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Tags (ex: café, sem glúten, rápido)" 
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')} 
                  // Cast to any to allow intermediate string state for array field
                  onChange={e => setFormData({...formData, tags: e.target.value as any})} 
              />
              <textarea 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500" 
                placeholder="Ingredientes (um por linha)" 
                rows={4}
                value={Array.isArray(formData.ingredientes) ? formData.ingredientes.join('\n') : (formData.ingredientes || '')}
                // Cast to any to allow intermediate string state for array field
                onChange={e => setFormData({...formData, ingredientes: e.target.value as any})}
              />
              <textarea 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500" 
                placeholder="Modo de Preparo" 
                rows={4}
                value={formData.modo_preparo || ''}
                onChange={e => setFormData({...formData, modo_preparo: e.target.value})}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Usuário</label>
                  <input className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs" placeholder="Porção" value={formData.porcao_usuario || ''} onChange={e => setFormData({...formData, porcao_usuario: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Esposa</label>
                  <input className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs" placeholder="Porção" value={formData.porcao_esposa || ''} onChange={e => setFormData({...formData, porcao_esposa: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Filho</label>
                  <input className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs" placeholder="Porção" value={formData.porcao_crianca || ''} onChange={e => setFormData({...formData, porcao_crianca: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2 pt-4 mt-auto">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => { setIsModalOpen(false); setEditingRecipe(null); }}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">Salvar Receita</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
