import { Lesson } from '../types';

export const LESSONS_DATA: Lesson[] = [
  // --- TRILHA 1: SPEED FLOW (PROGRESSÃO NÍVEL 1 A 4 COM DESBLOQUEIO) ---
  {
    id: 'speed-tier-1',
    title: 'Speed Flow 1: Respiração Diafragmática & Divisão 4x4 ⚡',
    category: 'Speed Flow',
    difficulty: 'Iniciante',
    xpReward: 300,
    durationMinutes: 8,
    track: 'speedflow',
    tier: 1,
    targetSkill: 'speedflow',
    targetAge: ['kids', 'jovem', 'adulto', 'todas'],
    targetObjective: ['velocidade', 'flow'],
    recommendedBeatStyle: ['Trap', 'Boom Bap', 'Detroit'],
    description: 'Nível 1: Fundamento básico para acelerar a fala sem perder o fôlego usando pulsos de ar do diafragma.',
    theory: `O Speed Flow profissional não vem da velocidade da língua, mas do controle do ar nos pulmões e diafragma:
• Ponto de Respiração: Puxe 100% de ar no 4º tempo do compasso anterior.
• Liberação em Pulsos Curtos: Ao invés de soltar um sopro contínuo, solte pequenos blocos de ar a cada 2 sílabas.
• Postura Corporal: Mantenha ombros relaxados e peito aberto. A mandíbula não pode travar.`,
    exampleLyrics: [
      'Verso 1: Entro no ritmo puxando o ar do pulmão (A)',
      'Verso 2: Mantenho a calma e dobro a precisão (A)',
      'Verso 3: Se o beat acelera eu não perco o compasso (B)',
      'Verso 4: Firmo a pegada no corte do traço (B)',
    ],
    tips: [
      'Treine contar de 1 a 8 bem rápido soltando apenas um pouco de ar em cada número.',
      'Sempre termine a palavra com as vogais bem nítidas.',
    ],
    exercisePrompt: 'Escreva 4 versos treinando a divisão de 8 sílabas por linha mantendo o fôlego:',
    exerciseWords: ['pulmão', 'precisão', 'compasso', 'traço'],
    aiVoiceScript: 'Salve MC! Bem-vindo ao Treino de Speed Flow Nível 1. A chave do speed flow está na respiração diafragmática. Puxe o ar no contratempo e solte palavras em blocos curtos e percussivos. Ouça o exemplo: Entro no ritmo puxando o ar do pulmão, mantenho a calma e dobro a precisão!',
    interactiveDrill: {
      type: 'speed_metronome',
      targetBpm: 85,
      drillDescription: 'Treino de Metrônomo: Fale as 4 palavras nos tempos 1, 2, 3 e 4 do compasso.',
      drillHint: 'Puxe ar no tempo 4 e comece no tempo 1 com firmeza.'
    }
  },
  {
    id: 'speed-tier-2',
    title: 'Speed Flow 2: Articulação de Consoantes Oclusivas (P, T, K, D) ⚡',
    category: 'Speed Flow',
    difficulty: 'Intermediário',
    xpReward: 400,
    durationMinutes: 10,
    track: 'speedflow',
    tier: 2,
    prerequisiteLessonId: 'speed-tier-1',
    targetSkill: 'speedflow',
    targetAge: ['kids', 'jovem', 'adulto', 'todas'],
    targetObjective: ['velocidade', 'flow'],
    recommendedBeatStyle: ['Trap', 'Detroit'],
    description: 'Nível 2 (Desbloqueável): Como destravar a dicção em alta velocidade com consoantes duras sem enrolar a língua.',
    theory: `Para o speed flow soar compreensível a 110+ BPM, você precisa dominar o 'Punch Fonético':
• Consoantes Oclusivas: Letras como P, T, C/K, B, D e G criam pequenos estalos percussivos na boca que marcam o tempo.
• Economia de Movimento Labial: Não abra muito a boca nas vogais (prefira sons próximos de I e U fechados).
• Trava-Língua de Rap: Repetir fonemas explosivos para calejar a musculatura da língua.`,
    exampleLyrics: [
      'Verso 1: Passo a passo no compasso traço o laço da vitória (A)',
      'Verso 2: Trava a língua mas não para até cravar na memória (A)',
      'Verso 3: Pela pista pico o passo preparado pra bater (B)',
      'Verso 4: Tento tanto quanto posso pro talento prevalecer (B)',
    ],
    tips: [
      'Coloque uma caneta entre os caninos e fale os versos 3 vezes antes de gravar.',
      'Exagere a pronúncia da letra T e da letra P como se fossem pratos e caixas de bateria.',
    ],
    exercisePrompt: 'Escreva 4 versos rápidos usando predominantemente palavras com P, T e C:',
    exerciseWords: ['compasso', 'vitória', 'memória', 'prevalecer'],
    aiVoiceScript: 'Speed Flow Nível 2 liberado! Agora vamos focar na dicção percussiva. As consoantes P, T e K dão o estalo que faz o ouvinte entender cada palavra na velocidade da luz. Ouça a levada: Passo a passo no compasso traço o laço da vitória, trava a língua mas não para até cravar na memória!',
    interactiveDrill: {
      type: 'speed_metronome',
      targetBpm: 105,
      drillDescription: 'Drill de Dicção: Encaixe 8 sílabas percussivas sem engolir as consoantes finais.',
      drillHint: 'Mantenha a mandíbula solta e use a ponta da língua no céu da boca.'
    }
  },
  {
    id: 'speed-tier-3',
    title: 'Speed Flow 3: Triplet Double Time & Dobra de Sílabas (120+ BPM) ⚡',
    category: 'Speed Flow',
    difficulty: 'Avançado',
    xpReward: 500,
    durationMinutes: 12,
    track: 'speedflow',
    tier: 3,
    prerequisiteLessonId: 'speed-tier-2',
    targetSkill: 'speedflow',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['velocidade', 'flow', 'batalha'],
    recommendedBeatStyle: ['Trap', 'Drill', 'Detroit'],
    description: 'Nível 3 (Desbloqueável): Subdivisão em tercinas (1-2-3, 1-2-3) e técnica de dobro de tempo com troca de marcha.',
    theory: `O Double Time é a técnica de colocar 2x mais palavras dentro do mesmo compasso mantendo o encaixe rítmico:
• O Padrão Tercinado (Triplet): Dividir cada tempo do beat em 3 partes ("Ta-ka-ta, Ta-ka-ta, Ta-ka-ta, Ta-ka-ta").
• Troca de Marcha: Comece 2 compassos no flow reto e exploda no Double Time nos 2 compassos seguintes.
• Efeito Metralhadora: Mantenha o tom da voz firme para a rima soar agressiva e não parecer que você está afobado.`,
    exampleLyrics: [
      'Verso 1: Entro no beat cadenciado mostrando a levada com classe e respeito',
      'Verso 2: Só que de repente acelero no meio do rap e disparo direto no peito',
      'Verso 3: (DOUBLE TIME) Rapidamente disparando no mic acelero o processo mantendo a levada!',
      'Verso 4: (DOUBLE TIME) Quem desacredita da técnica toma rajada e não entende mais nada!',
    ],
    tips: [
      'Use rimas multissilábicas curtas para não tropeçar no meio da dobra.',
      'Sincronize a cabeça do compasso com a caixa mais pesada do beat.',
    ],
    exercisePrompt: 'Crie uma quadra que começa cadenciada e explode em Double Time nos versos 3 e 4:',
    exerciseWords: ['acelero', 'processo', 'rajada', 'nada'],
    aiVoiceScript: 'Speed Flow Nível 3! Aqui separamos os amadores dos monstros do microfone. Vamos fazer a troca de marcha: comece calmo e dobre o tempo em tercinas na segunda metade da quadra! Ouça: Rapidamente disparando no mic acelero o processo mantendo a levada!',
    interactiveDrill: {
      type: 'speed_metronome',
      targetBpm: 125,
      drillDescription: 'Drill Avançado de Dobra: Dispare 12 sílabas em 1 único compasso sem tropeçar.',
      drillHint: 'Pense no ritmo Ta-ka-ta Ta-ka-ta Ta-ka-ta Ta-ka-ta.'
    }
  },
  {
    id: 'speed-tier-4',
    title: 'Speed Flow 4: Mestre do Flow Sincopado & Transição de Batalha 👑',
    category: 'Speed Flow',
    difficulty: 'Avançado',
    xpReward: 650,
    durationMinutes: 15,
    track: 'speedflow',
    tier: 4,
    prerequisiteLessonId: 'speed-tier-3',
    targetSkill: 'speedflow',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['velocidade', 'batalha', 'flow'],
    recommendedBeatStyle: ['Detroit', 'Trap', 'Grime'],
    description: 'Nível 4 (Mestre Desbloqueável): Flow sincopado no estilo Detroit, paradas bruscas (brake beat) e finalização com punchline rápida.',
    theory: `O ápice do Speed Flow não é falar rápido o tempo todo, mas dominar a DINÂMICA:
• Pausas Dramáticas: Acelerar 16 sílabas e parar seco 1 milissegundo antes da caixa.
• Sincopado (Off-beat): Andar ligeiramente à frente ou atrás do tempo sem cair do beat.
• Fechamento em Punchline: Nunca termine o speed flow no vazio — a última palavra precisa ser o nocaute da batalha!`,
    exampleLyrics: [
      'Verso 1: Olha como eu dobro o compasso na fita mantendo a postura de quem não vacila',
      'Verso 2: Se você piscar já perdeu a levada porque minha métrica corta e fuzila',
      'Verso 3: (Pausa de 1 tempo)... Respiro no vácuo...',
      'Verso 4: E quando você achou que acabou... Eu volto no speed e fecho a sua cova!',
    ],
    tips: [
      'O silêncio antes da punchline gera 3x mais grito na plateia do que rima contínua.',
      'Grave a si mesmo e ouça se todas as palavras do verso rápido são 100% inteligíveis.',
    ],
    exercisePrompt: 'Escreva a quadra máxima de Speed Flow Mestre com aceleração, pausa estratégica e punchline fatal:',
    exerciseWords: ['postura', 'fuzila', 'vácuo', 'cova'],
    aiVoiceScript: 'Parabéns por chegar ao Nível Mestre de Speed Flow! O segredo dos campeões é o contraste: acelere tudo, dê uma pausa cirúrgica e finalize com a punchline na caixa!',
    interactiveDrill: {
      type: 'speed_metronome',
      targetBpm: 140,
      drillDescription: 'Desafio Mestre: Speed flow a 140 BPM com frenagem brusca no tempo 4.',
      drillHint: 'Corte a voz no tempo 3 e feche a rima pesada no tempo 4.'
    }
  },

  // --- TRILHA 2: PUNCHLINES & BATALHA (PROGRESSÃO NÍVEL 1 A 4 COM DESBLOQUEIO) ---
  {
    id: 'punch-tier-1',
    title: 'Punchline 1: Estrutura 4x4 e o Golpe no 4º Compasso 🥊',
    category: 'Punchlines',
    difficulty: 'Iniciante',
    xpReward: 300,
    durationMinutes: 8,
    track: 'punchline',
    tier: 1,
    targetSkill: 'punchline',
    targetAge: ['kids', 'jovem', 'adulto', 'todas'],
    targetObjective: ['batalha', 'composicao'],
    recommendedBeatStyle: ['Boom Bap', 'Detroit', 'Drill'],
    description: 'Nível 1: Fundamento clássico do ataque de batalha: Verso 1 (Conexão), Verso 2 (Desenvolvimento), Verso 3 (Setup) e Verso 4 (PUNCHLINE).',
    theory: `Em batalhas de MCs, a vitória é decidida pelo peso da punchline no 4º compasso:
• Verso 1 (Conexão): Rebata o que o oponente disse ou introduza o seu tema com autoridade.
• Verso 2 (Desenvolvimento): Adicione contexto, peso lírico e prepare a rima sonora A.
• Verso 3 (Setup / Gancho): Crie expectativa no público e aponte a mira para o alvo (rima B).
• Verso 4 (PUNCHLINE FATAL): A revelação ou golpe final que faz o público e os jurados vibrarem!`,
    exampleLyrics: [
      'Verso 1: Você fala de vitória mas nunca entrou na guerra (Conexão)',
      'Verso 2: Sua banca bate palma mas seu verso cai na terra (Desenvolvimento)',
      'Verso 3: Quer subir no pedestal pra tentar ser coroado (Setup)',
      'Verso 4: Mas esqueceu que no meu reino rei de plástico é derrubado! (PUNCHLINE)',
    ],
    tips: [
      'Pense PRIMEIRO no verso 4 e construa os versos 1, 2 e 3 de trás para frente na cabeça.',
      'Sempre termine a punchline junto com a pancada da caixa de bateria.',
    ],
    exercisePrompt: 'Monte uma quadra completa com conexão, desenvolvimento, setup e punchline forte no 4º verso:',
    exerciseWords: ['guerra', 'terra', 'coroado', 'derrubado'],
    aiVoiceScript: 'Salve guerreiro da rima! Bem-vindo à Trilha de Punchline Nível 1. A regra de ouro da batalha é: os 3 primeiros versos são a preparação da flecha, o 4º verso é o tiro certeiro no alvo! Ouça: Quer subir no pedestal pra tentar ser coroado, mas esqueceu que no meu reino rei de plástico é derrubado!',
    interactiveDrill: {
      type: 'punchline_finish',
      setupVerses: [
        'Verso 1: Você diz que manda rima pesada na cidade',
        'Verso 2: Mas quando sobe no palco falta originalidade',
        'Verso 3: Quer posar de leão rugindo na selva inteira...',
      ],
      expectedRhymeSuffix: 'eira',
      drillDescription: 'Complete o 4º verso com uma punchline destruidora rimando em "-eira".',
      drillHint: 'Pense em palavras de impacto como "brincadeira", "esteira", "fronteira", "poeira".'
    }
  },
  {
    id: 'punch-tier-2',
    title: 'Punchline 2: Quebra de Expectativa & Duplo Sentido 🥊',
    category: 'Punchlines',
    difficulty: 'Intermediário',
    xpReward: 400,
    durationMinutes: 10,
    track: 'punchline',
    tier: 2,
    prerequisiteLessonId: 'punch-tier-1',
    targetSkill: 'punchline',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['batalha', 'composicao'],
    recommendedBeatStyle: ['Detroit', 'Boom Bap'],
    description: 'Nível 2 (Desbloqueável): Como conduzir a mente do adversário para um caminho óbvio e surpreender com uma virada genial.',
    theory: `O cérebro da plateia tenta antecipar o final da rima. Se você entrega o óbvio, perde a nota dos jurados:
• Ilusão de Rima: Fazer parecer que você vai usar uma rima previsível no 4º verso e trocar por uma metáfora muito mais rica.
• Homofonia & Duplo Sentido: Usar palavras com o mesmo som que significam coisas completamente distintas (ex: "banco" financeiro vs "banco" de praça).
• Ironia Fina: Usar o próprio argumento do adversário como munição contra ele.`,
    exampleLyrics: [
      'Verso 1: Você diz que tem dinheiro e vive ostentando nota',
      'Verso 2: Que no bolso tem riqueza e que a banca toda bota',
      'Verso 3: Mas seu império é de areia e sua pose é um engano',
      'Verso 4: Seu saldo tá no vermelho e sua conta é de mentira faz mais de um ano!',
    ],
    tips: [
      'Use referências da cultura pop (filmes, games, futebol, história) para criar trocadilhos inesperados.',
      'A punchline com quebra de expectativa faz o oponente perder a fala na resposta.',
    ],
    exercisePrompt: 'Escreva uma quadra que começa com um tema cotidiano e termina com uma quebra de expectativa surpreendente:',
    exerciseWords: ['nota', 'bota', 'engano', 'ano'],
    aiVoiceScript: 'Punchline Nível 2 desbloqueado! A quebra de expectativa é a arma mais temida nas batalhas. Engane o oponente nos versos iniciais e entregue uma virada que ninguém esperava!',
    interactiveDrill: {
      type: 'punchline_finish',
      setupVerses: [
        'Verso 1: Falou que veio armado com verso de calibre pesado',
        'Verso 2: Que ia me derrubar e deixar o palco marcado',
        'Verso 3: Mas quando puxou o gatilho da sua imaginação...',
      ],
      expectedRhymeSuffix: 'ão',
      drillDescription: 'Dê a virada no verso 4 mostrando que a arma dele não tinha bala.',
      drillHint: 'Exemplo de finalização: "Descobriu que a arma era de plástico e o disparo deu em vão!"'
    }
  },
  {
    id: 'punch-tier-3',
    title: 'Punchline 3: Setup Invertido & Metáforas Construtivas Complexas 🥊',
    category: 'Punchlines',
    difficulty: 'Avançado',
    xpReward: 520,
    durationMinutes: 12,
    track: 'punchline',
    tier: 3,
    prerequisiteLessonId: 'punch-tier-2',
    targetSkill: 'punchline',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['batalha', 'composicao'],
    recommendedBeatStyle: ['Boom Bap', 'Drill', 'Detroit'],
    description: 'Nível 3 (Desbloqueável): Construção em 3 camadas de significado com analogias filosóficas, históricas e científicas.',
    theory: `Nas finais de grandes eventos (Red Bull FrancaMente, Aldeia 8 Anos), as punchlines mais memoráveis usam o Setup Invertido:
• Camada 1: O ataque literal ao oponente.
• Camada 2: A analogia com um fato histórico/científico/filosófico inquestionável.
• Camada 3: O fechamento poético irrefutável que não dá margem para réplica.`,
    exampleLyrics: [
      'Verso 1: Você tenta apagar minha luz com essa inveja barata',
      'Verso 2: Só que fogo que arde por dentro não tem água que bata',
      'Verso 3: Eu sou feito matéria escura no meio da imensidão',
      'Verso 4: Quanto mais você tenta me ver, mais você é engolido pela gravitação!',
    ],
    tips: [
      'Estude física quântica, mitologia grega e história do Brasil para criar analogias incomparáveis.',
      'Evite clichês de batalha ("eu sou o leão e você é a gazela"). Seja original.',
    ],
    exercisePrompt: 'Crie uma quadra usando uma metáfora científica ou astronômica com punchline irrefutável:',
    exerciseWords: ['barata', 'bata', 'imensidão', 'gravitação'],
    aiVoiceScript: 'Punchline Nível 3! Aqui a lírica atinge o nível de arte marcial. Use metáforas profundas e o setup em três camadas para construir argumentos que nenhum oponente consegue responder!',
    interactiveDrill: {
      type: 'punchline_finish',
      setupVerses: [
        'Verso 1: Seu ego quer voar alto feito Ícaro no céu de verão',
        'Verso 2: Esqueceu que as asas de cera não aguentam a aproximação',
        'Verso 3: Voou perto demais do sol da minha verdade...',
      ],
      expectedRhymeSuffix: 'ade',
      drillDescription: 'Finalize a metáfora de Ícaro com a queda do oponente no 4º verso.',
      drillHint: 'Sugestões de fechamento: "E agora cai no mar profundo da sua própria mediocridade!"'
    }
  },
  {
    id: 'punch-tier-4',
    title: 'Punchline 4: Resposta Fatal no Improviso & Rebatida 100% Viva 👑',
    category: 'Punchlines',
    difficulty: 'Avançado',
    xpReward: 700,
    durationMinutes: 15,
    track: 'punchline',
    tier: 4,
    prerequisiteLessonId: 'punch-tier-3',
    targetSkill: 'punchline',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['batalha', 'composicao'],
    recommendedBeatStyle: ['Detroit', 'Boom Bap', 'Drill'],
    description: 'Nível 4 (Mestre Desbloqueável): A arte suprema da rebatida de improviso imediato (Gastar a rima do oponente no 1º segundo).',
    theory: `O maior MC não é aquele que decora rimas em casa, mas o que escuta cada sílaba do adversário e rebate na hora:
• O Ponto Fraco do Oponente: Identifique a contradição no que ele acabou de rimar.
• Reutilização de Palavras-Chave: Pegue a mesma palavra de fechamento dele e use em um sentido 10x mais potente.
• A Entrega Cênica: Olhe nos olhos do oponente, projete a voz e feche a rima com postura inabalável.`,
    exampleLyrics: [
      'Verso 1: Você rimou sobre tempo e disse que é o dono da hora (Rebatida imediata)',
      'Verso 2: Só que o seu relógio parou e sua chance foi embora (Desenvolvimento)',
      'Verso 3: Se o tempo é ouro e a vida é uma moeda rara (Setup de reflexão)',
      'Verso 4: Você acabou de falir na frente da plateia cara a cara! (PUNCHLINE FINAL)',
    ],
    tips: [
      'Nunca pense no que você vai falar enquanto o adversário rima; ESCUTE ele com atenção total.',
      'Uma rebatida direta no 1º verso já ganha 50% dos jurados logo no início da sua entrada.',
    ],
    exercisePrompt: 'Simule uma rebatida imediata a uma rima sobre "ouro e poder", finalizando com punchline de mestre:',
    exerciseWords: ['hora', 'embora', 'rara', 'cara a cara'],
    aiVoiceScript: 'Parabéns por atingir o Nível Mestre de Punchline! O mestre do freestyle não apenas ataca, ele transforma o próprio golpe do oponente no nocaute da vitória. Use a técnica da rebatida e reine nas batalhas!',
    interactiveDrill: {
      type: 'punchline_finish',
      setupVerses: [
        'Verso 1: O adversário acabou de rimar que é o rei do tabuleiro de xadrez',
        'Verso 2: Só que não percebeu que essa é a sua última vez',
        'Verso 3: Moveu o peão errado achando que tava no comando...',
      ],
      expectedRhymeSuffix: 'ando',
      drillDescription: 'Aplique o Xeque-Mate na punchline do 4º verso.',
      drillHint: 'Exemplo: "E o meu cavalo no beat já deu xeque-mate enquanto você tava sonhando!"'
    }
  },

  // --- TRILHA 3: FUNDAMENTOS, MÉTRICA & OUTRAS CATEGORIAS ---
  {
    id: 'lesson-fund-1',
    title: '1. Anatomia da Rima e Esquemas Estruturais',
    category: 'Fundamentos',
    difficulty: 'Iniciante',
    xpReward: 200,
    durationMinutes: 6,
    track: 'fundamentos',
    tier: 1,
    targetSkill: 'contagem_versos',
    targetAge: ['kids', 'jovem', 'adulto', 'todas'],
    targetObjective: ['geral', 'composicao', 'batalha'],
    recommendedBeatStyle: ['Boom Bap', 'Todos'],
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
    aiVoiceScript: 'Salve família! Na aula de Anatomia da Rima, vamos entender como a métrica do rap se organiza em 4 compassos musicais. O esquema mais popular é o AABB, onde o primeiro rima com o segundo, e o terceiro rima com o quarto. Ouça com atenção!'
  },
  {
    id: 'lesson-beat-1',
    title: '2. Encaixe no Beat: O Casamento do Kick com a Caixa 🎯',
    category: 'Encaixe no Beat',
    difficulty: 'Iniciante',
    xpReward: 300,
    durationMinutes: 8,
    track: 'fundamentos',
    tier: 1,
    targetSkill: 'encaixe_beat',
    targetAge: ['kids', 'jovem', 'adulto', 'todas'],
    targetObjective: ['flow', 'geral', 'batalha'],
    recommendedBeatStyle: ['Boom Bap', 'Trap', 'Detroit'],
    description: 'Como identificar o bumbo no tempo 1/3 e a caixa no tempo 2/4 para cravar a rima final com perfeição.',
    theory: `O compasso clássico de rap tem 4 tempos:
• Tempo 1: BUMBO (Kick) -> Entrada da frase.
• Tempo 2: CAIXA (Snare) -> Conexão / Respiração.
• Tempo 3: BUMBO (Kick) -> Desenvolvimento.
• Tempo 4: CAIXA (Snare) -> RIMA FINAL OU PUNCHLINE!
Quando a última sílaba tônica da sua rima bate exatamente junto com a Caixa (Snare), o impacto sonoro é multiplicado por 10.`,
    exampleLyrics: [
      'Tempo 1 (Kick): Entro no beat...',
      'Tempo 2 (Snare): ...com disposição (A)',
      'Tempo 3 (Kick): Mostro a firmeza...',
      'Tempo 4 (Snare): ...da minha visão (A)',
    ],
    tips: [
      'Bata o pé no bumbo e estale os dedos na caixa para internalizar o pulso.',
      'Se perceber que está adiantado, prolongue a última vogal da palavra.',
    ],
    exercisePrompt: 'Encaixe 4 versos fazendo a última palavra coincidir milimetricamente com a caixa da bateria:',
    exerciseWords: ['disposição', 'visão', 'precisão', 'criação'],
    aiVoiceScript: 'O segredo de um flow impecável é o casamento da voz com a bateria. Sinta o bumbo no tempo um e crave sua rima na caixa do tempo quatro!'
  },
  {
    id: 'lesson-gast-1',
    title: '3. Batalha de Gastação: Humor, Deboche e Carisma de Palco 🟢',
    category: 'Gastação',
    difficulty: 'Intermediário',
    xpReward: 350,
    durationMinutes: 9,
    track: 'geral',
    tier: 2,
    targetSkill: 'gastacao',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['batalha', 'geral'],
    recommendedBeatStyle: ['Boom Bap', 'Detroit'],
    description: 'Como criar tiradas cômicas, usar ironia refinada e conquistar a plateia através do riso.',
    theory: `A rima de gastação vence pelo carisma e pela surpresa cômica.
• Foque em detalhes inusitados: roupas, expressões, gafes do oponente ou trocadilhos engraçados.
• Use a técnica da "Quebra Absurda": comece sério e termine com uma comparação cômica e inesperada.
• Mantenha o sorriso e a leveza corporal: o público vota no MC que se diverte no palco.`,
    exampleLyrics: [
      'Verso 1: Veio com essa pose de vilão de filme caro',
      'Verso 2: Mas olhando de perto o visual é bem bizarro',
      'Verso 3: Fala que tem fama e que todo mundo nota',
      'Verso 4: Mas tá usando tênis que comprou lá na quitanda com nota!',
    ],
    tips: [
      'Evite termos de baixo calão gratuitos — a gastação inteligente é 10x mais valorizada.',
      'Use referências de memes e situações do cotidiano brasileiro.',
    ],
    exercisePrompt: 'Crie uma quadra de gastação divertida usando ironia e humor:',
    exerciseWords: ['caro', 'bizarro', 'nota', 'bota'],
    aiVoiceScript: 'Na gastação, o deboche inteligente e o carisma valem ouro. Faça a plateia rir com tiradas limpas e criativas!'
  },
  {
    id: 'lesson-ideo-1',
    title: '4. Rima Ideológica: Filosofia de Rua e Consciência Crítica ⚪️',
    category: 'Ideológica',
    difficulty: 'Avançado',
    xpReward: 400,
    durationMinutes: 12,
    track: 'geral',
    tier: 3,
    targetSkill: 'ideologica',
    targetAge: ['jovem', 'adulto', 'todas'],
    targetObjective: ['composicao', 'batalha', 'geral'],
    recommendedBeatStyle: ['Boom Bap', 'Trap'],
    description: 'Como construir rimas com peso social, reflexões profundas sobre a vida e expansão de vocabulário poético.',
    theory: `Na rima ideológica (conhecimento/visão), a força reside no intelecto e na verdade:
• Use metáforas existenciais (tempo, efemeridade, superação, raízes culturais).
• Troque ofensas pessoais por questionamentos sobre o sistema, a sociedade e a arte.
• Enriqueça o repertório com rimas ricas (substantivos abstratos e adjetivos complexos).`,
    exampleLyrics: [
      'Verso 1: O asfalto da cidade testemunha a correria',
      'Verso 2: De quem busca o sustento antes de nascer o dia',
      'Verso 3: A minha arte é o escudo contra a desigualdade',
      'Verso 4: Pois a voz da poesia é o espelho da verdade!',
    ],
    tips: [
      'Leia poesias, crônicas e ouça clássicos do rap nacional (Racionais, Sabotage, Rashid).',
      'Foque na clareza da mensagem e na impostação de voz solene.',
    ],
    exercisePrompt: 'Escreva uma quadra ideológica refletindo sobre a realidade e os sonhos de quem veio de baixo:',
    exerciseWords: ['correria', 'dia', 'desigualdade', 'verdade'],
    aiVoiceScript: 'A rima ideológica é a alma do hip-hop. Use sua voz como instrumento de consciência, verdade e superação!'
  },
];
