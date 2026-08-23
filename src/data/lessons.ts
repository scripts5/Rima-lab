import { Lesson } from '../types';

export const LESSONS_DATA: Lesson[] = [
  {
    id: 'lesson-fund-1',
    title: '1. Anatomia da Rima e Esquemas Estruturais',
    category: 'Fundamentos',
    difficulty: 'Iniciante',
    xpReward: 200,
    durationMinutes: 6,
    description: 'Aprenda os padrões clássicos de rima (AABB, ABAB, ABCB) e a contagem métrica de 4 compassos no rap.',
    theory: `No rap e freestyle, a unidade básica é a quadra (4 versos dentro de 4 compassos 4/4 do beat).
Os esquemas mais utilizados são:
• AABB (Rima emparelhada): O 1º rima com 2º, o 3º com o 4º. Ideal para punchlines rápidas.
• ABAB (Rima alternada): O 1º rima com 3º, o 2º com 4º. Muito fluida para contar histórias.
• ABCB (Rima livre inicial): O 1º e 3º são livres, focando toda a energia na rima do 2º com 4º.`,
    exampleLyrics: [
      'Verso 1: Entro no beat com foco e precisão (A)',
      'Verso 2: Cada palavra traz peso e visão (A)',
      'Verso 3: Se o microfone tá na minha mão (B)',
      'Verso 4: Eu mostro a força da improvisação (B)',
    ],
    tips: [
      'Respire no contratempo do 4º tempo do compasso.',
      'Não se preocupe em acertar palavras difíceis no início — priorize a métrica e o tempo.',
      'Sempre termine o verso na cabeça do tempo forte do compasso.',
    ],
    exercisePrompt: 'Improvise 4 versos no esquema AABB usando as palavras-guia abaixo:',
    exerciseWords: ['precisão', 'visão', 'criação', 'evolução'],
  },
  {
    id: 'lesson-fund-2',
    title: '2. Rimas Ricas vs. Rimas Pobres no Hip-Hop',
    category: 'Fundamentos',
    difficulty: 'Iniciante',
    xpReward: 250,
    durationMinutes: 8,
    description: 'Entenda como fugir de rimas óbvias de verbos no infinitivo (-ar, -er, -ir) e enriquecer sua lírica com substantivos e adjetivos.',
    theory: `• Rima Pobre: Quando rimamos palavras da mesma classe gramatical simples (ex: andar / falar / cantar / sonhar). Embora válidas, empobrecem o freestyle quando repetidas.
• Rima Rica: Quando conectamos diferentes classes gramaticais (ex: substantivo com adjetivo, advérbio com substantivo — "castelo / singelo", "mente / potente").
• Rima Preciosa: Rimas raras ou construídas com contrações e palavras inusitadas.`,
    exampleLyrics: [
      'Verso 1: Minha mensagem atravessa o asfalto (Substantivo)',
      'Verso 2: Mantendo a lírica num nível alto (Adjetivo)',
      'Verso 3: Sem tropeçar na pedra do caminho (Substantivo)',
      'Verso 4: Construo o meu império passo a passo sozinho (Adjetivo)',
    ],
    tips: [
      'Desafie-se a nunca usar dois verbos rimando em sequência numa batalha.',
      'Use o dicionário de sinônimos mental para substituir palavras comuns.',
    ],
    exercisePrompt: 'Crie 4 versos rimando substantivos com adjetivos sem usar verbos no infinitivo no final:',
    exerciseWords: ['asfalto', 'alto', 'resgate', 'combate'],
  },
  {
    id: 'lesson-flow-1',
    title: '3. Divisão Métrica & Variação de Flow',
    category: 'Métrica & Flow',
    difficulty: 'Intermediário',
    xpReward: 300,
    durationMinutes: 10,
    description: 'Como subdividir as batidas (tercinas, semínimas, colcheias) para alterar a velocidade do flow sem perder o tempo.',
    theory: `Flow é o casamento rítmico da voz com o instrumental.
• Flow Reto (No tempo): 1 sílaba por tempo ou colcheias simples. Muito claro e pesado em Boom Bap.
• Flow Tercinado (Triplet / Migos Flow): Dividir o tempo em 3 partes ("1-2-3, 1-2-3"). Muito usado em Trap e Drill.
• Double Time (Speed Flow): Dobrar a quantidade de palavras por compasso mantendo a articulação nítida.`,
    exampleLyrics: [
      'Flow Reto: Olha como eu chego, piso no compasso certo.',
      'Triplet Flow: Já chego / rimando / quebrando / no trap / mandando / a ideia / que bate.',
      'Double Time: Rapidamente no mic acelero o processo mantendo a levada no topo do verso.',
    ],
    tips: [
      'Treine a articulação labial e trava-línguas antes de acelerar.',
      'Alterne entre um compasso rápido e dois compassos cadenciados para criar dinâmica.',
    ],
    exercisePrompt: 'Grave 4 versos alternando: 2 versos em flow cadenciado + 2 versos com aceleração rítmica:',
    exerciseWords: ['velocidade', 'tempestade', 'habilidade', 'cidade'],
  },
  {
    id: 'lesson-punch-1',
    title: '4. Estrutura de Punchline & Setup em Batalhas',
    category: 'Punchlines',
    difficulty: 'Avançado',
    xpReward: 350,
    durationMinutes: 12,
    description: 'Como construir o setup (preparação) nos 3 primeiros versos e desferir o golpe (punchline) no 4º verso com impacto máximo.',
    theory: `Em batalhas de rap (estilo Aldeia, Red Bull, etc.), uma rima vencedora não é apenas sonora, é estratégica:
• Verso 1 (Conexão / Ataque ao argumento): Puxa o tema ou rebate o oponente.
• Verso 2 (Desenvolvimento): Adiciona profundidade ou metáfora.
• Verso 3 (Setup / Gancho): Prepara a expectativa do público e rima sonora.
• Verso 4 (Punchline Fatal): A quebra de expectativa ou revelação que faz o público explodir.`,
    exampleLyrics: [
      'Verso 1: Você fala que é o rei, mas esqueceu a coroa',
      'Verso 2: Sua rima é rasa, flutuando à toa',
      'Verso 3: Eu sou a tempestade que desmonta o castelo',
      'Verso 4: E você é só a chuva que molha o seu próprio ego!',
    ],
    tips: [
      'Pense primeiro na punchline (verso 4) e construa os versos 1, 2 e 3 de trás para frente na cabeça.',
      'Use analogias com cultura pop, esportes, ciência e história para surpreender.',
    ],
    exercisePrompt: 'Monte uma quadra completa com setup perfeito e punchline impactante no 4º verso:',
    exerciseWords: ['coroa', 'à toa', 'castelo', 'ego'],
  },
  {
    id: 'lesson-imp-1',
    title: '5. Técnicas de Freestyle: Pensamento Antecipado',
    category: 'Batalhas & Improviso',
    difficulty: 'Avançado',
    xpReward: 400,
    durationMinutes: 15,
    description: 'O método do "Buffer Mental": como estar 2 compassos à frente do que a sua boca está pronunciando.',
    theory: `O maior segredo dos campeões de freestyle não é pensar rápido na hora que o verso termina, mas sim:
1. Fixar a palavra final do 4º verso antes de começar a falar o 1º verso.
2. Usar palavras-gatilho de preenchimento rítmico consciente enquanto o cérebro monta o fechamento.
3. Observar objetos do ambiente para ter estímulos visuais infinitos.`,
    exampleLyrics: [
      'Técnica do Objeto: Vejo um relógio na parede -> Penso em "tempo/vento/momento".',
      'Resultado: "O ponteiro não para marcando o meu momento / Minha rima é rápida e corre feito o vento!"',
    ],
    tips: [
      'Pratique olhar para 5 objetos ao seu redor e rimar 2 versos com cada um sem parar o beat.',
      'Nunca faça careta quando errar a rima — disfarce com flow e continue no tempo!',
    ],
    exercisePrompt: 'Improvise sem interrupção por 45 segundos usando 3 palavras que surgirão na sua mente:',
    exerciseWords: ['labirinto', 'instinto', 'horizonte', 'ponte'],
  },
];
