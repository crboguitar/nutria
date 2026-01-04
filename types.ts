
export enum ProfileRole {
  USER = 'usuario',
  SPOUSE = 'esposa',
  HUSBAND = 'marido',
  CHILD = 'filho'
}

export enum Goal {
  LOSE = 'emagrecer',
  MAINTAIN = 'manter',
  GAIN = 'ganhar'
}

export interface GoogleAuth {
  accessToken: string;
  expiresAt: number;
  user: {
    name: string;
    email: string;
    picture: string;
  };
}

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authType: 'google' | 'local';
  token?: string;
}

export interface Profile {
  profile_id: string;
  nome: string;
  papel: ProfileRole;
  foto_url?: string;
  idade: number;
  altura_cm: number;
  peso_atual_kg: number;
  objetivo: Goal;
  restricoes: string[];
  preferencias: string[];
  horarios_refeicao?: string;
}

export interface Meal {
  meal_id: string;
  profile_ids: string[];
  data: string;
  tipo: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'extra';
  descricao: string;
  foto_url?: string;
  calorias_estimadas?: number;
}

export interface Measure {
  profile_id: string;
  data: string;
  peso_kg: number;
}

export interface Recipe {
  recipe_id: string;
  nome: string;
  tags: string[];
  ingredientes: string[];
  modo_preparo: string;
  tempo_preparo: string;
  porcao_usuario: string;
  porcao_esposa: string;
  porcao_crianca: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}
