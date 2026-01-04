
import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { MealTracker } from './components/MealTracker';
import { Recipes } from './components/Recipes';
import { LoginScreen } from './components/LoginScreen';
import { Profile, Meal, Measure, Recipe, UserSession } from './types';
import { INITIAL_PROFILES } from './constants';

export enum Tab { CHAT = 'chat', MEALS = 'meals', RECIPES = 'recipes', DASHBOARD = 'dashboard', SETTINGS = 'settings' }

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [session, setSession] = useState<UserSession | null>(() => {
    const s = localStorage.getItem('nutria_session');
    return s ? JSON.parse(s) : null;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const s = localStorage.getItem('np_profiles');
    return s ? JSON.parse(s) : INITIAL_PROFILES;
  });
  const [meals, setMeals] = useState<Meal[]>(() => {
    const s = localStorage.getItem('np_meals');
    return s ? JSON.parse(s) : [];
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const s = localStorage.getItem('np_recipes');
    return s ? JSON.parse(s) : [];
  });
  const [measures, setMeasures] = useState<Measure[]>(() => {
    const s = localStorage.getItem('np_measures');
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    if (session) localStorage.setItem('nutria_session', JSON.stringify(session));
    else localStorage.removeItem('nutria_session');
  }, [session]);

  useEffect(() => {
    localStorage.setItem('np_profiles', JSON.stringify(profiles));
    localStorage.setItem('np_meals', JSON.stringify(meals));
    localStorage.setItem('np_recipes', JSON.stringify(recipes));
    localStorage.setItem('np_measures', JSON.stringify(measures));
  }, [profiles, meals, recipes, measures]);

  if (!session) return <LoginScreen onLoginSuccess={setSession} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="bg-white p-5 px-8 flex justify-between items-center border-b z-20">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Nutr<span className="text-emerald-600">IA</span></h2>
        <div className="flex items-center gap-4">
           {session.photoURL && <img src={session.photoURL} className="w-8 h-8 rounded-full border border-slate-100" />}
           <button onClick={() => setSession(null)} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Sair</button>
        </div>
      </header>
      
      <main className="flex-1 relative overflow-hidden">
        {activeTab === Tab.CHAT && <ChatInterface session={session} profiles={profiles} appData={{profiles, meals, recipes, measures}} contextTab={activeTab} />}
        {activeTab === Tab.DASHBOARD && <Dashboard profiles={profiles} measures={measures} onAddProfile={p=>setProfiles([...profiles, p])} onUpdateProfile={p=>setProfiles(profiles.map(o=>o.profile_id===p.profile_id?p:o))} onDeleteProfile={id=>setProfiles(profiles.filter(p=>p.profile_id!==id))} onAddMeasure={m=>setMeasures([m, ...measures])} />}
        {activeTab === Tab.MEALS && <MealTracker profiles={profiles} meals={meals} recipes={recipes} onAddMeal={m=>setMeals([m, ...meals])} onDeleteMeal={id=>setMeals(meals.filter(m=>m.meal_id!==id))} />}
        {activeTab === Tab.RECIPES && <Recipes recipes={recipes} onAdd={r=>setRecipes([...recipes, r])} onUpdate={r=>setRecipes(recipes.map(o=>o.recipe_id===r.recipe_id?r:o))} onDelete={id=>setRecipes(recipes.filter(r=>r.recipe_id!==id))} />}
      </main>

      <nav className="bg-slate-900 mx-6 mb-8 mt-2 p-2.5 rounded-[2.5rem] flex justify-around items-center shadow-2xl">
        {[Tab.CHAT, Tab.MEALS, Tab.RECIPES, Tab.DASHBOARD].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)}
            className={`px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t === Tab.CHAT ? 'Chat' : t === Tab.MEALS ? 'Diário' : t === Tab.RECIPES ? 'Livro' : 'Painel'}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
