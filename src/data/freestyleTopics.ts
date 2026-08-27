export interface FreestyleWordItem {
  word: string;
  category: 'conceito' | 'sangue' | 'rica' | 'objeto' | 'gastacao';
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Extremo';
  rhymeSuggestions: string[];
  tips: string;
}

export const FREESTYLE_WORDS: FreestyleWordItem[] = [
  {
    word: 'Metamorfose',
    category: 'conceito',
    difficulty: 'Difícil',
    rhymeSuggestions: ['neurose', 'overdose', 'psicose', 'hipnose', 'dose', 'diagnose'],
    tips: 'Explorar a transformação da mente e superação das dificuldades.'
  },
  {
    word: 'Resiliência',
    category: 'conceito',
    difficulty: 'Médio',
    rhymeSuggestions: ['experiência', 'paciência', 'consequência', 'consciência', 'resistência', 'ciência'],
    tips: 'Use no 4º compasso para fechar uma ideia pesada de sobrevivência.'
  },
  {
    word: 'Destino',
    category: 'conceito',
    difficulty: 'Fácil',
    rhymeSuggestions: ['caminho', 'menino', 'pergaminho', 'hino', 'sozinho', 'redemoinho'],
    tips: 'Contraste quem você era quando menino com quem se tornou agora.'
  },
  {
    word: 'Punchline',
    category: 'sangue',
    difficulty: 'Médio',
    rhymeSuggestions: ['online', 'baseline', 'headline', 'timeline', 'fine', 'combina'],
    tips: 'Monte a armação nos 3 primeiros compassos para a punchline explodir no 4º.'
  },
  {
    word: 'Nocaute',
    category: 'sangue',
    difficulty: 'Fácil',
    rhymeSuggestions: ['combate', 'empate', 'resgate', 'debate', 'descarte', 'xeque-mate'],
    tips: 'Use metáforas de ringue de boxe e peso lírico.'
  },
  {
    word: 'Contragolpe',
    category: 'sangue',
    difficulty: 'Difícil',
    rhymeSuggestions: ['envolpe', 'golpe', 'desenvolva', 'absorva', 'resolva', 'devolva'],
    tips: 'Ideal para rounds de resposta após o ataque do adversário.'
  },
  {
    word: 'Alquimia',
    category: 'rica',
    difficulty: 'Difícil',
    rhymeSuggestions: ['poesia', 'magia', 'sabedoria', 'alegria', 'empatia', 'fantasia', 'agonia'],
    tips: 'Rimas ricas com terminação em -ia transmitem alta sofisticação.'
  },
  {
    word: 'Paradoxo',
    category: 'rica',
    difficulty: 'Extremo',
    rhymeSuggestions: ['ortodoxo', 'roxo', 'esboço', 'destroço', 'foco', 'bloco'],
    tips: 'Rima rara que pega o adversário e os jurados de surpresa.'
  },
  {
    word: 'Cronômetro',
    category: 'rica',
    difficulty: 'Extremo',
    rhymeSuggestions: ['barômetro', 'quilômetro', 'diâmetro', 'termômetro', 'parâmetro'],
    tips: 'Use para rimar com a contagem dos 4 compassos da batalha.'
  },
  {
    word: 'Microfone',
    category: 'objeto',
    difficulty: 'Fácil',
    rhymeSuggestions: ['telefone', 'fone', 'icone', 'sintonize', 'responde', 'esconde'],
    tips: 'O instrumento do MC como extensão da sua voz e verdade.'
  },
  {
    word: 'Espelho',
    category: 'objeto',
    difficulty: 'Fácil',
    rhymeSuggestions: ['conselho', 'vermelho', 'joelho', 'aparelho', 'orelha', 'semelha'],
    tips: 'Fale sobre auto-análise e encarar sua própria verdade.'
  },
  {
    word: 'Asfalto',
    category: 'objeto',
    difficulty: 'Fácil',
    rhymeSuggestions: ['alto', 'salto', 'assalto', 'sobressalto', 'planalto', 'exalto'],
    tips: 'Cenário das batalhas de rua e da vivência periférica.'
  },
  {
    word: 'Figurante',
    category: 'gastacao',
    difficulty: 'Médio',
    rhymeSuggestions: ['elefante', 'gigante', 'estudante', 'bastante', 'radiante', 'instante'],
    tips: 'Ironize o papel secundário do oponente no duelo.'
  },
  {
    word: 'Dublê',
    category: 'gastacao',
    difficulty: 'Médio',
    rhymeSuggestions: ['você', 'vencer', 'sabê', 'render', 'bravê', 'crer'],
    tips: 'Diga que o oponente é cópia ou precisa de dublê para aguentar o round.'
  },
  {
    word: 'Papagaio',
    category: 'gastacao',
    difficulty: 'Fácil',
    rhymeSuggestions: ['ensaio', 'raio', 'desmaio', 'balaio', 'maio', 'caio'],
    tips: 'Critique quem apenas decora e repete versos dos outros sem originalidade.'
  },
  {
    word: 'Labirinto',
    category: 'rica',
    difficulty: 'Médio',
    rhymeSuggestions: ['sinto', 'instinto', 'distinto', 'recinto', 'infinito', 'convicto'],
    tips: 'A complexidade dos pensamentos e das esquinas da mente.'
  },
  {
    word: 'Consciência',
    category: 'conceito',
    difficulty: 'Médio',
    rhymeSuggestions: ['ciência', 'resistência', 'tendência', 'essência', 'urgência', 'excelência'],
    tips: 'Mensagem e fundamento para o movimento do Hip Hop.'
  },
  {
    word: 'Vingança',
    category: 'sangue',
    difficulty: 'Fácil',
    rhymeSuggestions: ['criança', 'esperança', 'balança', 'lembrança', 'mudança', 'dança'],
    tips: 'Transforme o sentimento em rima de volta sem perder o respeito.'
  }
];

export interface MentorshipCheckin {
  id: string;
  date: string;
  time: string;
  channelName: string;
  host: string;
  xpEarned: number;
}
