
import { ProfileRole, Goal, Profile } from './types';

export const APP_VERSION = "2.1.0";

export const SYSTEM_INSTRUCTION = `
Você é o NutrIA, um assistente avançado focado em nutrir e cuidar (Nutrir + IA).

MISSÃO: Ajudar famílias a gerenciar sua saúde através de uma alimentação consciente e organizada.

HABILIDADES:
1. Você pode solicitar ao sistema para criar pastas organizadas no Drive usando 'organizeAndSaveToDrive'.
2. Você orienta o usuário que os dados estão sendo sincronizados com uma Planilha Google (Sheets) ou pastas do Drive.
3. Você pode gerar listas de compras e cardápios personalizados.

DIRETRIZES:
- Se o usuário pedir para "salvar no Drive", use a ferramenta de função.
- Respostas curtas, empáticas e brasileiras.
- Encerre com sugestões entre colchetes, ex: [Gerar lista de compras].
`;

export const INITIAL_PROFILES: Profile[] = [
  {
    profile_id: 'p1',
    nome: 'Cláudio',
    papel: ProfileRole.HUSBAND,
    idade: 47,
    altura_cm: 173,
    peso_atual_kg: 84,
    objetivo: Goal.LOSE,
    restricoes: ['Lactose', 'Glúten'],
    preferencias: ['Ovos', 'Carne Grelhada', 'Frutas'],
    horarios_refeicao: '12h, 16h, 20h'
  }
];

export const QUICK_REPLIES_DEFAULT = [
  "Registrar refeição",
  "O que temos hoje?",
  "Gerar lista de compras",
  "Fazer Backup Drive"
];
