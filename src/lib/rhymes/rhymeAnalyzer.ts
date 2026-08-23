import { RhymeAnalysis, RhymePair } from '../../types';

// Portuguese normalization helper
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (match, offset, str) => {
      // Keep nasal tildes for Portuguese rhyme checking ('ã', 'õ')
      const char = str[offset - 1];
      if (match === '\u0303') return '~'; // represents tilde
      return '';
    })
    .replace(/[^a-z0-9~]/g, '');
}

// Get the phonetic ending (last 2-4 characters)
function getEnding(word: string, length = 3): string {
  const norm = normalizeWord(word);
  return norm.slice(-length);
}

// Check rhyme similarity between two words
function evaluateWordRhyme(w1: string, w2: string): { matches: boolean; type: 'perfeita' | 'toante' | 'aliteracao' | 'assonancia'; similarity: number } {
  const norm1 = normalizeWord(w1);
  const norm2 = normalizeWord(w2);

  if (norm1.length < 3 || norm2.length < 3 || norm1 === norm2) {
    return { matches: false, type: 'perfeita', similarity: 0 };
  }

  // Exact last 3 or 2 characters match (Rhyme Perfeita / Consoante)
  if (norm1.endsWith(norm2.slice(-3)) || norm2.endsWith(norm1.slice(-3))) {
    return { matches: true, type: 'perfeita', similarity: 0.95 };
  }

  if (norm1.endsWith(norm2.slice(-2)) || norm2.endsWith(norm1.slice(-2))) {
    return { matches: true, type: 'perfeita', similarity: 0.85 };
  }

  // Portuguese standard rhyme suffixes
  const commonSuffixes = ['ao~', 'ado', 'ada', 'ando', 'endo', 'indo', 'ente', 'eza', 'ista', 'oso', 'osa', 'al', 'ar', 'or', 'er', 'ir', 'ico', 'ica', 'uto', 'ura', 'eio', 'inho', 'inha', 'ismo', 'ario', 'aria'];
  for (const suf of commonSuffixes) {
    if (norm1.endsWith(suf) && norm2.endsWith(suf)) {
      return { matches: true, type: 'perfeita', similarity: 0.9 };
    }
  }

  // Assonância (Vowel match in ending)
  const vowels1 = norm1.replace(/[^aeiou~]/g, '').slice(-2);
  const vowels2 = norm2.replace(/[^aeiou~]/g, '').slice(-2);
  if (vowels1.length >= 2 && vowels1 === vowels2) {
    return { matches: true, type: 'toante', similarity: 0.7 };
  }

  // Aliteração (Initial phonetic match)
  if (norm1.slice(0, 3) === norm2.slice(0, 3)) {
    return { matches: true, type: 'aliteracao', similarity: 0.6 };
  }

  return { matches: false, type: 'perfeita', similarity: 0 };
}

export function analyzeRhymesDeterministically(transcript: string, durationSeconds = 30): RhymeAnalysis {
  if (!transcript || transcript.trim().length === 0) {
    return {
      wordsCount: 0,
      rhymesCount: 0,
      uniqueWordsRatio: 0,
      rhymeQuality: 0,
      flowScore: 0,
      creativityScore: 0,
      coherenceScore: 0,
      overallScore: 0,
      heuristicScore: 0,
      rhymePairs: [],
      strengths: ['Comece a falar ou rimar para obter métricas ao vivo.'],
      improvements: ['Solte a voz mantendo o ritmo do beat.'],
      suggestions: ['Tente esquemas simples de rima AABB ou ABAB.'],
      nextExercise: 'Prática de Rimas Básicas com Palavras do Dia',
    };
  }

  // Extract lines and words
  const lines = transcript
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  const rawWords = transcript
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1);

  const wordsCount = rawWords.length;
  const uniqueWords = new Set(rawWords.map(w => normalizeWord(w)));
  const uniqueWordsRatio = wordsCount > 0 ? uniqueWords.size / wordsCount : 0;

  // Find rhyme pairs across lines or nearby words
  const rhymePairs: RhymePair[] = [];
  const lineEndWords: string[] = [];

  // Line end rhymes (classic hip-hop structure)
  for (const line of lines) {
    const tokens = line.split(/\s+/).filter(w => w.length > 2);
    if (tokens.length > 0) {
      lineEndWords.push(tokens[tokens.length - 1]);
    }
  }

  // Compare end words of lines
  for (let i = 0; i < lineEndWords.length; i++) {
    for (let j = i + 1; j < Math.min(i + 4, lineEndWords.length); j++) {
      const w1 = lineEndWords[i];
      const w2 = lineEndWords[j];
      const check = evaluateWordRhyme(w1, w2);
      if (check.matches) {
        // avoid duplicate pairs
        const alreadyExists = rhymePairs.some(p => (p.word1 === w1 && p.word2 === w2) || (p.word1 === w2 && p.word2 === w1));
        if (!alreadyExists) {
          rhymePairs.push({
            word1: w1,
            word2: w2,
            type: check.type,
            similarity: check.similarity,
          });
        }
      }
    }
  }

  // Internal rhymes (within same or adjacent lines)
  for (let i = 0; i < rawWords.length; i++) {
    for (let j = i + 1; j < Math.min(i + 8, rawWords.length); j++) {
      const w1 = rawWords[i];
      const w2 = rawWords[j];
      if (w1.length >= 3 && w2.length >= 3 && Math.abs(i - j) >= 2) {
        const check = evaluateWordRhyme(w1, w2);
        if (check.matches && check.similarity > 0.8) {
          const alreadyExists = rhymePairs.some(p => (p.word1 === w1 && p.word2 === w2) || (p.word1 === w2 && p.word2 === w1));
          if (!alreadyExists) {
            rhymePairs.push({
              word1: w1,
              word2: w2,
              type: check.type,
              similarity: check.similarity,
            });
          }
        }
      }
    }
  }

  const rhymesCount = rhymePairs.length;

  // Heuristic Scoring
  // Flow cadence: target 2 to 3.5 words/second for freestyle
  const duration = Math.max(5, durationSeconds);
  const wordsPerSec = wordsCount / duration;
  let flowScore = 50;
  if (wordsPerSec >= 1.5 && wordsPerSec <= 3.8) {
    flowScore = Math.min(95, Math.round(70 + (wordsPerSec / 3.0) * 25));
  } else if (wordsPerSec > 3.8) {
    flowScore = 80; // fast / speed flow
  } else {
    flowScore = Math.max(35, Math.round(wordsPerSec * 40));
  }

  // Rhyme Quality
  const perfectRhymes = rhymePairs.filter(p => p.type === 'perfeita').length;
  const rhymeQuality = Math.min(96, Math.max(30, Math.round(40 + perfectRhymes * 10 + rhymesCount * 5)));

  // Creativity Score based on unique vocab & rich words
  const avgWordLen = wordsCount > 0 ? rawWords.reduce((acc, w) => acc + w.length, 0) / wordsCount : 0;
  const creativityScore = Math.min(98, Math.max(40, Math.round(uniqueWordsRatio * 50 + avgWordLen * 6 + 15)));

  // Metric score based on syllabic balance across lines
  const linesCount = Math.max(1, lines.length);
  const avgWordsPerLine = wordsCount / linesCount;
  const lineBalancePenalty = Math.abs(avgWordsPerLine - 7) * 2.5;
  const metricScore = Math.min(96, Math.max(35, Math.round(85 - lineBalancePenalty)));

  // Punchline impact estimation (looks for punchy final line or strong ending words)
  const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';
  const punchlineBonus = lastLine.length > 15 && rhymesCount >= 2 ? 15 : 0;
  const punchlineImpact = Math.min(95, Math.max(30, Math.round(creativityScore * 0.5 + rhymeQuality * 0.3 + punchlineBonus)));

  // Coherence based on structure & length
  const coherenceScore = Math.min(95, Math.max(45, Math.round(80 - lineBalancePenalty + (rhymesCount > 2 ? 10 : 0))));

  // Overall Heuristic Score (0-100)
  const heuristicScore = Math.min(
    98,
    Math.max(25, Math.round(rhymeQuality * 0.3 + flowScore * 0.25 + metricScore * 0.2 + punchlineImpact * 0.15 + coherenceScore * 0.1))
  );

  // Evaluation Verdict
  let evaluationVerdict: 'Lendário' | 'Excelente' | 'Sólido' | 'Em Evolução' | 'Precisa de Ajustes' = 'Sólido';
  if (heuristicScore >= 90) evaluationVerdict = 'Lendário';
  else if (heuristicScore >= 80) evaluationVerdict = 'Excelente';
  else if (heuristicScore >= 68) evaluationVerdict = 'Sólido';
  else if (heuristicScore >= 50) evaluationVerdict = 'Em Evolução';
  else evaluationVerdict = 'Precisa de Ajustes';

  // Strengths & Improvements feedback (Direct & Professional Judge Tone)
  const strengths: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];
  const corrections: string[] = [];

  if (rhymesCount >= 3) {
    strengths.push(`Boa conexão métrica com ${rhymesCount} pares de rimas identificados.`);
  } else {
    strengths.push('Entrega com cadência audível e presença no microfone.');
  }

  if (uniqueWordsRatio >= 0.7) {
    strengths.push('Vocabulário bem distribuído, sem recorrer a vícios repetitivos de linguagem.');
  } else {
    improvements.push('Evite finais de verso repetitivos (-ar, -ão). Explore substantivos e adjetivos incomuns.');
  }

  if (flowScore >= 75) {
    strengths.push('Cadência bem cravada no tempo do compasso.');
  } else {
    improvements.push('Mantenha o tempo do compasso 4/4 sem acelerar ou tropeçar no final das frases.');
  }

  if (perfectRhymes > 0) {
    suggestions.push('Evolua para rimas multissilábicas (combinando 2 palavras simultâneas no desfecho).');
  } else {
    suggestions.push('Feche a punchline no quarto tempo com rima soando forte no bumbo ou na caixa.');
  }

  if (lines.length >= 2) {
    corrections.push(`Foque em manter os versos equilibrados: tente limitar cada linha a 6-9 palavras para não embolar o flow.`);
  }

  const directFeedback = heuristicScore >= 80
    ? `Rima com boa colocação e métrica firme. Você encaixou os finais de frase com peso e manteve a coerência no andamento do beat.`
    : heuristicScore >= 60
    ? `Linhas consistentes, mas você pode arriscar mais nos trocadilhos e evitar rimas fáceis no final das barras. Foque na contagem silábica.`
    : `O flow precisa de mais disciplina rítmica e vocabulário. Não tente correr antes de cravar a métrica no tempo do compasso.`;

  const punchlineFeedback = punchlineImpact >= 75
    ? 'Fechamento assertivo com boa intenção na barra final.'
    : 'A punchline final precisa de mais impacto e contraste em relação aos versos de preparação.';

  const flowTips = `Mantenha a respiração entre a 2ª e a 3ª barra para que a 4ª barra entre cheia e pontual.`;

  const nextExercise =
    rhymesCount < 2
      ? 'Treino de Terminações Rápidas (30 segundos por palavra-chave)'
      : creativityScore < 70
      ? 'Desafio de Metáforas & Analogias Inusitadas'
      : 'Treino de Punchlines & Respostas de Batalha em 4 Versos';

  return {
    wordsCount,
    rhymesCount,
    uniqueWordsRatio,
    rhymeQuality,
    flowScore,
    creativityScore,
    coherenceScore,
    metricScore,
    punchlineImpact,
    overallScore: heuristicScore,
    heuristicScore,
    evaluationVerdict,
    rhymePairs,
    strengths,
    improvements,
    suggestions,
    corrections,
    punchlineFeedback,
    flowTips,
    directFeedback,
    nextExercise,
    aiCommentary: directFeedback,
  };
}
