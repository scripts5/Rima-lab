import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Music, 
  Sparkles, 
  Zap, 
  Flame, 
  Disc, 
  Check, 
  CornerDownLeft, 
  Hash, 
  Radio, 
  ExternalLink, 
  Send, 
  HelpCircle, 
  Plus, 
  ListMusic, 
  Sliders, 
  Headphones,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Beat, UserProfile } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';

interface DiscordBeatBotProps {
  profile: UserProfile | null;
  currentBeat: Beat;
  setCurrentBeat: (beat: Beat) => void;
  isPlayingBeat: boolean;
  setIsPlayingBeat: (playing: boolean) => void;
  onSendToStudio: (beat: Beat) => void;
}

interface BotMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  authorName: string;
  authorAvatar?: string;
  isBot?: boolean;
  timestamp: string;
  commandText?: string;
  text?: string;
  embed?: {
    title: string;
    description?: string;
    color?: string; // hex
    fields?: { name: string; value: string; inline?: boolean }[];
    thumbnail?: string;
    footer?: string;
    beatData?: Beat;
    audioUrl?: string;
    flowTip?: string;
  };
}

const SLASH_COMMANDS = [
  { cmd: '/play', desc: 'Toca uma música, link do YouTube/SoundCloud/MP3 ou busca na biblioteca', example: '/play https://... ou /play Trap 808' },
  { cmd: '/avaliar', desc: 'Avalia seus versos com a IA Jurado Técnico Profissional', example: '/avaliar Minha mente é uma máquina criando poesia...' },
  { cmd: '/pause', desc: 'Pausa a reprodução do beat atual', example: '/pause' },
  { cmd: '/resume', desc: 'Retoma o beat que estava pausado', example: '/resume' },
  { cmd: '/skip', desc: 'Pula para o próximo beat da fila', example: '/skip' },
  { cmd: '/queue', desc: 'Exibe os beats na lista de espera', example: '/queue' },
  { cmd: '/bpm', desc: 'Altera a velocidade do beat (BPM)', example: '/bpm 140' },
  { cmd: '/volume', desc: 'Ajusta o volume do bot (0 a 100)', example: '/volume 80' },
  { cmd: '/loop', desc: 'Ativa ou desativa a repetição contínua', example: '/loop' },
  { cmd: '/search', desc: 'Busca beats específicos por estilo ou energia', example: '/search Drill' },
  { cmd: '/studio', desc: 'Envia o beat atual para o Studio de Gravação e Freestyle', example: '/studio' },
  { cmd: '/help', desc: 'Mostra todos os comandos disponíveis do bot', example: '/help' },
];

const CURATED_COMMUNITY_BEATS: (Beat & { category: string; descriptionLong: string })[] = [
  {
    id: 'comm_beat_01',
    title: '808 Mayhem - Dark Trap Anthem',
    style: 'Trap',
    bpm: 140,
    key: 'F Min',
    producer: 'Kush Producer #Cypher',
    energy: 'Agressivo',
    description: 'Subgrave 808 distorcido com hi-hats rápidos em tercinas e claps secos para flow acelerado.',
    category: 'Trap & 808',
    descriptionLong: 'Ideal para treinar rimas rápidas com punchlines agressivas e trocadilhos de impacto.',
    source: 'synth',
    durationFormatted: '02:45',
  },
  {
    id: 'comm_beat_02',
    title: 'Brooklyn 1994 - Golden Era Boom Bap',
    style: 'Boom Bap',
    bpm: 90,
    key: 'C Min',
    producer: 'DJ Vinyl Master',
    energy: 'Médio',
    description: 'Groove pesado e nostálgico com caixa estalada, bumbo encorpado e linha de baixo acústica.',
    category: 'Boom Bap Vintage',
    descriptionLong: 'Perfeito para treinar métrica clássica de 4x4, storytelling e rimas multissilábicas.',
    source: 'synth',
    durationFormatted: '03:20',
  },
  {
    id: 'comm_beat_03',
    title: 'London 3AM - UK Drill Glide',
    style: 'Drill',
    bpm: 142,
    key: 'E Min',
    producer: 'GhostDrill UK',
    energy: 'Agressivo',
    description: 'Contratempos sincopados, graves 808 com deslizes (glides) e hi-hats cortantes.',
    category: 'UK / BR Drill',
    descriptionLong: 'Excelente para treinar pausas métricas, rimas quebradas e cadência agressiva de batalha.',
    source: 'synth',
    durationFormatted: '03:10',
  },
  {
    id: 'comm_beat_04',
    title: 'Midnight Coffee - Lo-Fi Chill Hop',
    style: 'Lo-Fi',
    bpm: 82,
    key: 'A Maj',
    producer: 'Tape Nostalgia',
    energy: 'Chill',
    description: 'Poerinha de vinil suave, acordes de Rhodes e bateria relaxada para freestyle reflexivo.',
    category: 'Lo-Fi & Poesia',
    descriptionLong: 'Perfeito para treinar mensagens com profundidade lírica, metáforas e flow melódico.',
    source: 'synth',
    durationFormatted: '03:40',
  },
  {
    id: 'comm_beat_05',
    title: 'Speed Demon - Double Time Rush',
    style: 'Speed Flow',
    bpm: 115,
    key: 'G Min',
    producer: 'Flow Monster BR',
    energy: 'Épico',
    description: 'Bateria contínua sem pausas para acelerar o raciocínio e dobrar as sílabas por segundo.',
    category: 'Speed Flow',
    descriptionLong: 'Treino de velocidade máxima, respiração diafragmática e dicção de alta precisão.',
    source: 'synth',
    durationFormatted: '02:30',
  },
  {
    id: 'comm_beat_06',
    title: 'Detroit Flute Hustle 2026',
    style: 'Trap',
    bpm: 102,
    key: 'C# Min',
    producer: 'Midwest Sound Lab',
    energy: 'Agressivo',
    description: 'Flauta hipnótica contínua, bumbos sem corte e espaço para rimas fora do tempo (off-beat flow).',
    category: 'Detroit Rap',
    descriptionLong: 'O som característico de Detroit: rime começando antes ou depois da caixa com punchlines sem refrão.',
    source: 'synth',
    durationFormatted: '02:55',
  },
  {
    id: 'comm_beat_07',
    title: 'SP Cypher Battle Royale - Underground',
    style: 'Boom Bap',
    bpm: 88,
    key: 'G# Min',
    producer: 'Batalha da Leste',
    energy: 'Médio',
    description: 'Trompete sombrio de jazz com bateria pesada para treino de ataque e respostas rápidas.',
    category: 'Batalha de Rima',
    descriptionLong: 'Simulador sonoro de batalhas de MCs. Use para treinar respostas no 4x4 ou 8x8.',
    source: 'synth',
    durationFormatted: '03:15',
  },
  {
    id: 'comm_beat_08',
    title: 'Grime Energy Storm 140',
    style: 'Grime',
    bpm: 140,
    key: 'D Min',
    producer: 'London Underground',
    energy: 'Épico',
    description: 'Sintetizador cortante com ritmo acelerado para treinar explosão e impacto vocal.',
    category: 'Grime & Bass',
    descriptionLong: 'Ideal para quem busca treinar presença de palco e projeção de voz potente.',
    source: 'synth',
    durationFormatted: '03:00',
  }
];

export const DiscordBeatBot: React.FC<DiscordBeatBotProps> = ({
  profile,
  currentBeat,
  setCurrentBeat,
  isPlayingBeat,
  setIsPlayingBeat,
  onSendToStudio,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState(80);
  const [customBpm, setCustomBpm] = useState(currentBeat.bpm);
  const [activeChannel, setActiveChannel] = useState<'commands' | 'requests' | 'queue' | 'station'>('commands');
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [queue, setQueue] = useState<Beat[]>([
    CURATED_COMMUNITY_BEATS[0],
    CURATED_COMMUNITY_BEATS[1],
    CURATED_COMMUNITY_BEATS[2],
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Discord Bot Messages History
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'msg_welcome_bot',
      sender: 'system',
      authorName: 'RimaBot Music v3.5',
      isBot: true,
      timestamp: 'Hoje às 14:20',
      embed: {
        title: '🤖 RimaBot Music v3.5 inicializado com sucesso!',
        description: 'Digite `/play [link da música/beat ou nome]` para carregar e tocar qualquer beat instantaneamente! Você também pode enviar o beat direto para o **Studio** para rimar com a câmera e detecção de speed flow.',
        color: '#5865F2',
        fields: [
          { name: 'Comandos Populares', value: '`/play [link/nome]` • `/skip` • `/pause` • `/bpm [bpm]` • `/loop` • `/queue` • `/studio`', inline: false },
          { name: 'Canais de Voz', value: '🔊 ┊ Estúdio ao Vivo (MC Conectado)', inline: true },
          { name: 'Status do Áudio', value: '🟢 Sintetizador 16-Step Web Audio Online', inline: true },
        ],
        footer: 'Dica: Digite uma barra "/" na caixa de texto para abrir a lista rápida de comandos.',
      },
    },
    {
      id: 'msg_initial_now_playing',
      sender: 'bot',
      authorName: 'RimaBot Music',
      isBot: true,
      timestamp: 'Hoje às 14:21',
      embed: {
        title: `🎶 Tocando Agora: ${currentBeat.title}`,
        description: currentBeat.description,
        color: '#23a55a',
        fields: [
          { name: 'Estilo', value: currentBeat.style, inline: true },
          { name: 'BPM', value: `${currentBeat.bpm} BPM`, inline: true },
          { name: 'Tom', value: currentBeat.key || 'C Min', inline: true },
          { name: 'Produtor', value: currentBeat.producer || 'RimaLab Originals', inline: true },
          { name: 'Energia', value: currentBeat.energy || 'Médio', inline: true },
          { name: 'Duração', value: currentBeat.durationFormatted || '03:00', inline: true },
        ],
        flowTip: 'Encaixe o início de cada punchline no 4º compasso para maximizar o impacto.',
        beatData: currentBeat,
      },
    },
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync BPM state when currentBeat changes
  useEffect(() => {
    setCustomBpm(currentBeat.bpm);
  }, [currentBeat]);

  const handleCommandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputCommand(val);
    if (val.startsWith('/')) {
      setShowSlashSuggestions(true);
    } else {
      setShowSlashSuggestions(false);
    }
  };

  const executePlayQuery = async (query: string) => {
    if (!query.trim()) return;

    const userMsgId = `usr_${Date.now()}`;
    const userName = profile?.artisticName || 'MC Foco & Flow';
    const userAvatar = profile?.avatarUrl;

    // Add user message
    const newMsg: BotMessage = {
      id: userMsgId,
      sender: 'user',
      authorName: userName,
      authorAvatar: userAvatar,
      isBot: false,
      timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      commandText: query.startsWith('/') ? query : `/play ${query}`,
    };

    setMessages(prev => [...prev, newMsg]);
    setIsProcessing(true);

    const cleanInput = query.trim();

    // Check slash commands
    if (cleanInput === '/pause') {
      globalBeatEngine.stop();
      setIsPlayingBeat(false);
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          authorName: 'RimaBot Music',
          isBot: true,
          timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          embed: {
            title: '⏸️ Beat Pausado',
            description: `O beat **${currentBeat.title}** foi pausado. Digite \`/resume\` ou clique em tocar para continuar.`,
            color: '#f0b232',
          },
        },
      ]);
      return;
    }

    if (cleanInput === '/resume') {
      globalBeatEngine.start();
      setIsPlayingBeat(true);
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          authorName: 'RimaBot Music',
          isBot: true,
          timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          embed: {
            title: '▶️ Beat Retomado',
            description: `Tocando agora: **${currentBeat.title}** (${currentBeat.bpm} BPM).`,
            color: '#23a55a',
            beatData: currentBeat,
          },
        },
      ]);
      return;
    }

    if (cleanInput === '/loop') {
      const nextLoop = !isLooping;
      setIsLooping(nextLoop);
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          authorName: 'RimaBot Music',
          isBot: true,
          timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          embed: {
            title: nextLoop ? '🔁 Modo Loop Ativado' : '➡️ Modo Loop Desativado',
            description: nextLoop ? 'O beat atual repetirá indefinidamente para seu treino de freestyle.' : 'O bot avançará na fila quando o beat terminar.',
            color: '#5865F2',
          },
        },
      ]);
      return;
    }

    if (cleanInput === '/skip') {
      setIsProcessing(false);
      if (queue.length > 0) {
        const nextBeat = queue[0];
        setQueue(prev => prev.slice(1));
        setCurrentBeat(nextBeat);
        globalBeatEngine.setBeat(nextBeat);
        globalBeatEngine.start();
        setIsPlayingBeat(true);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `⏭️ Pulado! Tocando: ${nextBeat.title}`,
              description: nextBeat.description,
              color: '#23a55a',
              fields: [
                { name: 'Estilo', value: nextBeat.style, inline: true },
                { name: 'BPM', value: `${nextBeat.bpm} BPM`, inline: true },
                { name: 'Restantes na Fila', value: `${queue.length - 1} beats`, inline: true },
              ],
              beatData: nextBeat,
            },
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: '⚠️ Fila Vazia',
              description: 'Não há mais músicas na fila. Adicione novas músicas com `/play [link ou nome]`.',
              color: '#f23f43',
            },
          },
        ]);
      }
      return;
    }

    if (cleanInput === '/queue') {
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          authorName: 'RimaBot Music',
          isBot: true,
          timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          embed: {
            title: '📜 Fila de Reprodução Atual',
            description: queue.length > 0
              ? queue.map((b, i) => `**${i + 1}.** ${b.title} \`[${b.bpm} BPM | ${b.style}]\` - *${b.producer}*`).join('\n')
              : 'A fila está vazia no momento. Adicione mais beats usando `/play`!',
            color: '#5865F2',
            fields: [
              { name: 'Tocando Agora', value: `🎶 ${currentBeat.title} (${currentBeat.bpm} BPM)`, inline: false },
            ],
          },
        },
      ]);
      return;
    }

    if (cleanInput.startsWith('/bpm')) {
      const parts = cleanInput.split(' ');
      const newBpmVal = parseInt(parts[1], 10);
      setIsProcessing(false);
      if (!isNaN(newBpmVal) && newBpmVal >= 60 && newBpmVal <= 200) {
        setCustomBpm(newBpmVal);
        globalBeatEngine.setBpm(newBpmVal);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `🎚️ Velocidade Ajustada para ${newBpmVal} BPM`,
              description: `O andamento do beat foi atualizado em tempo real para **${newBpmVal} BPM**.`,
              color: '#5865F2',
            },
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: '❌ Valor de BPM Inválido',
              description: 'Use o comando no formato: `/bpm [60 a 200]`. Exemplo: `/bpm 140`.',
              color: '#f23f43',
            },
          },
        ]);
      }
      return;
    }

    if (cleanInput.startsWith('/volume')) {
      const parts = cleanInput.split(' ');
      const volVal = parseInt(parts[1], 10);
      setIsProcessing(false);
      if (!isNaN(volVal) && volVal >= 0 && volVal <= 100) {
        setVolume(volVal);
        globalBeatEngine.setVolume(volVal / 100);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `🔊 Volume Definido para ${volVal}%`,
              description: `Volume ajustado para ${volVal}%.`,
              color: '#5865F2',
            },
          },
        ]);
      }
      return;
    }

    if (cleanInput.startsWith('/avaliar ') || cleanInput.startsWith('/rima ') || cleanInput.startsWith('/judge ')) {
      const lyricText = cleanInput
        .replace('/avaliar ', '')
        .replace('/rima ', '')
        .replace('/judge ', '')
        .trim();

      if (!lyricText) {
        setIsProcessing(false);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Jurado IA',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: '⚖️ Como usar o /avaliar',
              description: 'Digite `/avaliar [seus versos ou rimas]` para receber uma análise técnica profissional e direta ao ponto.',
              color: '#f0b232',
            },
          },
        ]);
        return;
      }

      try {
        const analyzeRes = await fetch('/api/practice/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: lyricText,
            duration: 30,
            beatStyle: currentBeat.style || 'Boom Bap',
            bpm: currentBeat.bpm || 90,
          }),
        });

        const data = await analyzeRes.json();
        const analysis = data.analysis;
        setIsProcessing(false);

        const verdict = analysis?.evaluationVerdict || 'Sólido';
        const verdictColor = verdict === 'Lendário' ? '#f59e0b' : verdict === 'Excelente' ? '#10b981' : verdict === 'Sólido' ? '#3b82f6' : '#a855f7';

        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Jurado Técnico',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `⚖️ Avaliação Técnica: ${analysis?.overallScore || 75}/100 PTS [${verdict}]`,
              description: analysis?.directFeedback || analysis?.aiCommentary || 'Avaliação técnica processada com sucesso.',
              color: verdictColor,
              fields: [
                { name: 'Qualidade da Rima', value: `${analysis?.rhymeQuality || 70}%`, inline: true },
                { name: 'Métrica & Compasso', value: `${analysis?.metricScore || 75}%`, inline: true },
                { name: 'Cadência & Flow', value: `${analysis?.flowScore || 70}%`, inline: true },
                { name: 'Punchline & Impacto', value: `${analysis?.punchlineImpact || 70}%`, inline: true },
                { name: 'Vocabulário Único', value: `${Math.round((analysis?.uniqueWordsRatio || 0.7) * 100)}%`, inline: true },
                { name: 'Coerência Temática', value: `${analysis?.coherenceScore || 75}%`, inline: true },
                ...(analysis?.corrections && analysis.corrections.length > 0 ? [{
                  name: '🎯 Correção Cirúrgica',
                  value: analysis.corrections.join('\n'),
                  inline: false,
                }] : []),
                ...(analysis?.strengths && analysis.strengths.length > 0 ? [{
                  name: '✅ Ponto Forte',
                  value: analysis.strengths[0],
                  inline: true,
                }] : []),
                ...(analysis?.improvements && analysis.improvements.length > 0 ? [{
                  name: '⚡ Para Evoluir',
                  value: analysis.improvements[0],
                  inline: true,
                }] : []),
                ...(analysis?.nextExercise ? [{
                  name: '💡 Próximo Treino Recomendado',
                  value: analysis.nextExercise,
                  inline: false,
                }] : []),
              ],
            },
          },
        ]);
      } catch (err) {
        setIsProcessing(false);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Jurado IA',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: '❌ Erro ao Processar Avaliação',
              description: 'Ocorreu uma instabilidade momentânea ao avaliar a rima. Tente novamente.',
              color: '#f23f43',
            },
          },
        ]);
      }
      return;
    }

    if (cleanInput === '/studio') {
      setIsProcessing(false);
      onSendToStudio(currentBeat);
      return;
    }

    if (cleanInput === '/help') {
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          authorName: 'RimaBot Music',
          isBot: true,
          timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          embed: {
            title: '📖 Lista Completa de Comandos do RimaBot',
            description: 'Aqui estão os comandos que você pode digitar a qualquer momento:',
            color: '#5865F2',
            fields: SLASH_COMMANDS.map(sc => ({
              name: `${sc.cmd}`,
              value: `${sc.desc}\n*Exemplo:* \`${sc.example}\``,
              inline: false,
            })),
          },
        },
      ]);
      return;
    }

    // Default /play handling (either `/play query` or just raw text/link)
    let queryPayload = cleanInput;
    if (queryPayload.startsWith('/play ')) {
      queryPayload = queryPayload.replace('/play ', '').trim();
    } else if (queryPayload.startsWith('/search ')) {
      queryPayload = queryPayload.replace('/search ', '').trim();
    }

    // Check if query matches any of our community preset beats directly
    const directMatch = [...CURATED_COMMUNITY_BEATS, ...PRESET_BEATS].find(b => 
      b.title.toLowerCase().includes(queryPayload.toLowerCase()) || 
      b.style.toLowerCase() === queryPayload.toLowerCase()
    );

    try {
      // Call backend API to parse link or generate smart beat metadata
      const res = await fetch('/api/bot/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsedBeat: Beat = data.beat || (directMatch || {
          id: `custom_${Date.now()}`,
          title: queryPayload,
          style: 'Boom Bap',
          bpm: 90,
          key: 'C Min',
          producer: 'Custom Beat Loader',
          energy: 'Médio',
          description: `Beat selecionado: ${queryPayload}`,
        });

        // Set Beat and Play!
        setCurrentBeat(parsedBeat);
        globalBeatEngine.setBeat(parsedBeat);
        globalBeatEngine.start();
        setIsPlayingBeat(true);

        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `🎶 Tocando Agora: ${parsedBeat.title}`,
              description: data.isYouTube 
                ? `Link do YouTube detectado e carregado com sucesso! Álbum e áudio prontos para treino.` 
                : (parsedBeat.description || 'Beat carregado e sincronizado com o metrônomo do estúdio.'),
              color: '#23a55a',
              thumbnail: parsedBeat.thumbnailUrl || (data.youtubeVideoId ? `https://img.youtube.com/vi/${data.youtubeVideoId}/hqdefault.jpg` : undefined),
              fields: [
                { name: 'Estilo / Gênero', value: `🏷️ ${parsedBeat.style}`, inline: true },
                { name: 'Velocidade', value: `⚡ ${parsedBeat.bpm} BPM`, inline: true },
                { name: 'Tom Musical', value: `🎹 ${parsedBeat.key || 'C Min'}`, inline: true },
                { name: 'Produtor', value: `🎧 ${parsedBeat.producer || 'Cypher Producer'}`, inline: true },
                { name: 'Energia', value: `🔥 ${parsedBeat.energy || 'Médio'}`, inline: true },
                { name: 'Duração', value: `⏱️ ${parsedBeat.durationFormatted || '03:15'}`, inline: true },
              ],
              flowTip: data.beat?.flowTip || 'Dica de Rima: Tente dobrar o tempo no 3º verso para acelerar a dicção.',
              beatData: parsedBeat,
            },
          },
        ]);
      } else {
        // Fallback local play
        const fallbackBeat: Beat = directMatch || {
          id: `custom_${Date.now()}`,
          title: queryPayload,
          style: 'Boom Bap',
          bpm: 92,
          key: 'C Min',
          producer: 'RimaLab Custom Loader',
          energy: 'Médio',
          description: `Beat selecionado: ${queryPayload}`,
        };

        setCurrentBeat(fallbackBeat);
        globalBeatEngine.setBeat(fallbackBeat);
        globalBeatEngine.start();
        setIsPlayingBeat(true);

        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            authorName: 'RimaBot Music',
            isBot: true,
            timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            embed: {
              title: `🎶 Tocando Agora: ${fallbackBeat.title}`,
              description: 'Beat carregado e tocando em sincronia.',
              color: '#23a55a',
              fields: [
                { name: 'Estilo', value: fallbackBeat.style, inline: true },
                { name: 'BPM', value: `${fallbackBeat.bpm} BPM`, inline: true },
              ],
              beatData: fallbackBeat,
            },
          },
        ]);
      }
    } catch (err) {
      console.warn('Bot play request error:', err);
      // Fallback
      if (directMatch) {
        setCurrentBeat(directMatch);
        globalBeatEngine.setBeat(directMatch);
        globalBeatEngine.start();
        setIsPlayingBeat(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim() || isProcessing) return;
    const cmd = inputCommand;
    setInputCommand('');
    setShowSlashSuggestions(false);
    executePlayQuery(cmd);
  };

  const handleSelectSlashCommand = (cmd: string) => {
    setInputCommand(`${cmd} `);
    setShowSlashSuggestions(false);
    inputRef.current?.focus();
  };

  const handleQuickPlayPreset = (beat: Beat) => {
    executePlayQuery(`/play ${beat.title}`);
  };

  const handleTogglePlay = () => {
    const isPlaying = globalBeatEngine.togglePlay();
    setIsPlayingBeat(isPlaying);
  };

  const handleBpmChange = (newBpm: number) => {
    setCustomBpm(newBpm);
    globalBeatEngine.setBpm(newBpm);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    globalBeatEngine.setVolume(newVol / 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-4 pb-12 animate-in fade-in duration-300">
      
      {/* Top Banner introducing the Discord Bot Feature */}
      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-2xl border border-[#5865F2]/40 bg-[#1e1f22] p-4 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-black tracking-tight text-white">
                RimaBot Beats • Estilo Discord
              </h2>
              <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                BOT
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Digite <code className="bg-[#2b2d31] px-1.5 py-0.5 rounded text-amber-400 font-mono font-bold">/play [link ou nome do beat]</code> para escolher qualquer beat ou playlist e tocar na hora!
            </p>
          </div>
        </div>

        {/* Action button to test in studio */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            id="discord-bot-send-studio-btn"
            onClick={() => onSendToStudio(currentBeat)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-transform active:scale-95"
          >
            <Radio className="h-4 w-4" />
            <span>🎙️ Rimar com este Beat no Studio</span>
          </button>
        </div>
      </div>

      {/* Discord Layout Main Container (Sidebar + Chat Area + Beats Soundboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Sidebar: Discord Server Channels */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          
          {/* Server Info Card */}
          <div className="rounded-2xl border border-neutral-800 bg-[#2b2d31] p-3 text-neutral-200 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-700/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-neutral-950 font-black text-xs">
                  RL
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">Cypher Brasil • Discord</span>
                  <span className="text-[9px] text-[#5865F2] font-semibold">Cargos & Salas Exclusivas</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                ● 142 MCs
              </span>
            </div>

            {/* User Selected Discord Roles Badges */}
            {profile?.roles && profile.roles.length > 0 && (
              <div className="mb-2.5 pb-2 border-b border-neutral-700/60">
                <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1 px-1">
                  Seus Cargos no Servidor ({profile.roles.length}):
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                  {profile.roles.map((roleId) => {
                    const roleNames: Record<string, { label: string; color: string }> = {
                      mc_freestyle: { label: '🎤 MC Freestyle', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                      produtor: { label: '🎧 Beatmaker', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
                      jurado: { label: '👑 Jurado Oficial', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                      iniciante: { label: '🌱 Aluno RimaLab', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                      speed_demon: { label: '⚡ Speed Flow', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
                      cypher_organizer: { label: '🔥 Host de Batalha', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                    };
                    const r = roleNames[roleId] || { label: `#${roleId}`, color: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
                    return (
                      <span
                        key={roleId}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.color}`}
                      >
                        {r.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Channels List */}
            <div className="space-y-1 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1">
                Canais de Texto
              </div>
              
              <button
                onClick={() => setActiveChannel('commands')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                  activeChannel === 'commands' 
                    ? 'bg-[#35373c] text-white font-bold' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="h-4 w-4 text-neutral-400" />
                <span>🎵・comandos-de-beat</span>
              </button>

              <button
                onClick={() => setActiveChannel('requests')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                  activeChannel === 'requests' 
                    ? 'bg-[#35373c] text-white font-bold' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="h-4 w-4 text-neutral-400" />
                <span>🔥・pedidos-da-cypher</span>
              </button>

              <button
                onClick={() => setActiveChannel('queue')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                  activeChannel === 'queue' 
                    ? 'bg-[#35373c] text-white font-bold' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="h-4 w-4 text-neutral-400" />
                <span>📜・fila-de-espera</span>
                {queue.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#5865F2] px-1.5 py-0.2 text-[9px] font-bold text-white">
                    {queue.length}
                  </span>
                )}
              </button>

              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 pt-3 pb-1">
                Canais de Voz
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <div className="flex flex-col">
                  <span>🔊 ┊ Estúdio ao Vivo</span>
                  <span className="text-[10px] text-emerald-400/80 font-normal">
                    {isPlayingBeat ? `Tocando: ${currentBeat.title}` : 'Aguardando /play'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Soundboard / Preset Beat Cards */}
          <div className="rounded-2xl border border-neutral-800 bg-[#2b2d31] p-3 shadow-md flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Disc className="h-4 w-4 text-amber-400" />
                Beats Rápidos da Fila
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">/play rapido</span>
            </div>
            
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {CURATED_COMMUNITY_BEATS.map((beat) => {
                const isCurrent = currentBeat.id === beat.id || currentBeat.title === beat.title;
                return (
                  <div
                    key={beat.id}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all text-xs ${
                      isCurrent
                        ? 'border-amber-500/60 bg-amber-500/10 text-white'
                        : 'border-neutral-700/60 bg-[#1e1f22] text-neutral-300 hover:border-[#5865F2]/50 hover:bg-[#35373c]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate text-white">{beat.title}</span>
                        {isCurrent && (
                          <span className="rounded bg-amber-500 px-1 py-0.2 text-[9px] font-black text-neutral-950">
                            ON
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                        <span>{beat.style}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-400/90">{beat.bpm} BPM</span>
                      </div>
                    </div>

                    <button
                      id={`preset-play-${beat.id}`}
                      onClick={() => handleQuickPlayPreset(beat)}
                      className={`p-1.5 rounded-lg shrink-0 transition-transform active:scale-95 ${
                        isCurrent && isPlayingBeat
                          ? 'bg-red-500 text-white'
                          : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
                      }`}
                      title={isCurrent && isPlayingBeat ? 'Pausar' : `Digitar /play ${beat.title}`}
                    >
                      {isCurrent && isPlayingBeat ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Main Center Area: Discord Chat Terminal with Embeds & Playback Bar */}
        <div className="lg:col-span-9 flex flex-col rounded-2xl border border-neutral-800 bg-[#313338] shadow-2xl overflow-hidden min-h-[580px]">
          
          {/* Discord Chat Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-[#2b2d31] px-4 py-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-neutral-400" />
              <span className="font-bold text-sm text-white">comandos-de-beat</span>
              <span className="text-xs text-neutral-400 hidden sm:inline">
                | Insira comandos como <code className="text-amber-400 font-mono">/play [link ou nome]</code>
              </span>
            </div>

            {/* Quick Player Bar in Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#1e1f22] px-2.5 py-1 rounded-lg border border-neutral-700/60 text-xs">
                <button
                  id="discord-toggle-play-btn"
                  onClick={handleTogglePlay}
                  className={`p-1 rounded font-bold ${
                    isPlayingBeat ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  title={isPlayingBeat ? 'Pausar' : 'Tocar'}
                >
                  {isPlayingBeat ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
                    {currentBeat.title}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono">
                    {customBpm} BPM • {currentBeat.style}
                  </span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#1e1f22] px-2 py-1 rounded-lg border border-neutral-700/60">
                <button 
                  onClick={() => handleVolumeChange(volume === 0 ? 80 : 0)}
                  className="text-neutral-400 hover:text-white"
                >
                  {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-14 h-1 bg-neutral-700 accent-amber-500 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[440px]">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs leading-relaxed group">
                
                {/* Author Avatar */}
                {msg.isBot ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5865F2] text-white font-bold shadow">
                    🤖
                  </div>
                ) : (
                  <img
                    src={msg.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={msg.authorName}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-full object-cover border border-neutral-700 shrink-0"
                  />
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-xs hover:underline cursor-pointer">
                      {msg.authorName}
                    </span>
                    {msg.isBot && (
                      <span className="rounded bg-[#5865F2] px-1 py-0.2 text-[9px] font-extrabold text-white">
                        BOT
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400">{msg.timestamp}</span>
                  </div>

                  {/* If user command */}
                  {msg.commandText && (
                    <div className="mb-2 inline-block rounded-lg bg-[#2b2d31] px-3 py-1.5 font-mono text-xs text-amber-400 border border-neutral-700/60">
                      {msg.commandText}
                    </div>
                  )}

                  {/* Standard Text */}
                  {msg.text && (
                    <p className="text-neutral-200 whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Rich Discord Embed */}
                  {msg.embed && (
                    <div className="mt-1 max-w-2xl rounded-xl border-l-4 border-neutral-800 bg-[#2b2d31] p-3.5 shadow-md space-y-3" style={{ borderLeftColor: msg.embed.color || '#5865F2' }}>
                      
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            {msg.embed.title}
                          </h4>
                          {msg.embed.description && (
                            <p className="text-xs text-neutral-300 mt-1 leading-normal">
                              {msg.embed.description}
                            </p>
                          )}
                        </div>

                        {/* Thumbnail */}
                        {msg.embed.thumbnail && (
                          <img
                            src={msg.embed.thumbnail}
                            alt="Cover"
                            referrerPolicy="no-referrer"
                            className="h-16 w-16 rounded-lg object-cover border border-neutral-700 shrink-0 shadow"
                          />
                        )}
                      </div>

                      {/* Fields Grid */}
                      {msg.embed.fields && msg.embed.fields.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-neutral-700/50">
                          {msg.embed.fields.map((f, idx) => (
                            <div key={idx} className={f.inline === false ? 'col-span-full' : ''}>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                {f.name}
                              </div>
                              <div className="text-xs font-semibold text-neutral-200 mt-0.5">
                                {f.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Flow Tip Badge */}
                      {msg.embed.flowTip && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-300 font-medium">
                          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                          <span><strong>Dica de Flow IA:</strong> {msg.embed.flowTip}</span>
                        </div>
                      )}

                      {/* Embed Action Buttons */}
                      {msg.embed.beatData && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-700/60">
                          <button
                            id={`embed-toggle-${msg.id}`}
                            onClick={() => {
                              if (currentBeat.id !== msg.embed?.beatData?.id) {
                                setCurrentBeat(msg.embed!.beatData!);
                                globalBeatEngine.setBeat(msg.embed!.beatData!);
                                globalBeatEngine.start();
                                setIsPlayingBeat(true);
                              } else {
                                handleTogglePlay();
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
                              currentBeat.id === msg.embed.beatData.id && isPlayingBeat
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
                            }`}
                          >
                            {currentBeat.id === msg.embed.beatData.id && isPlayingBeat ? (
                              <>
                                <Pause className="h-3.5 w-3.5" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Tocar Este Beat</span>
                              </>
                            )}
                          </button>

                          <button
                            id={`embed-send-studio-${msg.id}`}
                            onClick={() => onSendToStudio(msg.embed!.beatData!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all shadow active:scale-95"
                          >
                            <Radio className="h-3.5 w-3.5" />
                            <span>🎙️ Usar no Studio</span>
                          </button>

                          <button
                            onClick={() => executePlayQuery('/loop')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#35373c] hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                            title="Alternar repetição contínua"
                          >
                            <Repeat className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Loop</span>
                          </button>
                        </div>
                      )}

                      {/* Footer */}
                      {msg.embed.footer && (
                        <div className="text-[10px] text-neutral-400 pt-1">
                          {msg.embed.footer}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 p-2 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-[#5865F2] animate-ping" />
                <span>RimaBot está analisando o link do beat, detectando BPM e preparando a reprodução...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Slash Command Pill Helper Buttons */}
          <div className="border-t border-neutral-800 bg-[#2b2d31] px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
              Atalhos Rápidos:
            </span>
            <button
              onClick={() => executePlayQuery('/play Boom Bap 90s Classic')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /play Boom Bap
            </button>
            <button
              onClick={() => executePlayQuery('/play Trap 808 Pesado')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /play Trap 808
            </button>
            <button
              onClick={() => executePlayQuery('/play UK Drill London')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /play UK Drill
            </button>
            <button
              onClick={() => executePlayQuery('/play Lo-Fi Midnight Vinyl')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /play Lo-Fi
            </button>
            <button
              onClick={() => executePlayQuery('/play Speed Flow 160BPM')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /play Speed Flow
            </button>
            <button
              onClick={() => executePlayQuery('/queue')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /queue
            </button>
            <button
              onClick={() => executePlayQuery('/skip')}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e1f22] hover:bg-[#35373c] text-[11px] font-mono text-neutral-300 hover:text-amber-400 transition-colors border border-neutral-700/50"
            >
              /skip
            </button>
          </div>

          {/* Slash Commands Dropdown Menu when typing "/" */}
          {showSlashSuggestions && (
            <div className="border-t border-neutral-700 bg-[#2b2d31] p-2 space-y-1 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1">
                Comandos de Barra (Slash Commands)
              </div>
              {SLASH_COMMANDS.filter(s => s.cmd.toLowerCase().includes(inputCommand.toLowerCase())).map((cmd) => (
                <button
                  key={cmd.cmd}
                  type="button"
                  onClick={() => handleSelectSlashCommand(cmd.cmd)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[#35373c] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{cmd.cmd}</span>
                    <span className="text-neutral-300">{cmd.desc}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">{cmd.example}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <div className="p-3 bg-[#383a40] border-t border-neutral-800">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 text-neutral-400">
                <span className="font-bold text-amber-400 text-sm">/</span>
              </div>
              <input
                ref={inputRef}
                id="discord-bot-chat-input"
                type="text"
                value={inputCommand}
                onChange={handleCommandInputChange}
                placeholder="Digite /play [link do YouTube/MP3 ou nome do beat] para tocar..."
                className="w-full rounded-xl bg-[#313338] pl-7 pr-24 py-3 text-xs text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all font-mono"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!inputCommand.trim() || isProcessing}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputCommand.trim() && !isProcessing
                      ? 'bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <span>Enviar</span>
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400 px-1">
              <span>Pressione <strong>Enter ↵</strong> para enviar o comando de beat</span>
              <span>Suporta links do YouTube, SoundCloud, MP3 direto ou pesquisa inteligente com IA</span>
            </div>
          </div>

        </div>

      </div>

      {/* Beats Soundboard & Catalog Grid below */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-amber-500" />
              Catálogo Oficial de Beats da Cypher
            </h3>
            <p className="text-xs text-neutral-400">
              Escolha um beat para carregar via comando <code className="text-amber-400 font-mono">/play</code> ou testar no Studio
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {CURATED_COMMUNITY_BEATS.length} Beats Disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CURATED_COMMUNITY_BEATS.map((beat) => {
            const isCurrent = currentBeat.id === beat.id || currentBeat.title === beat.title;
            return (
              <div
                key={beat.id}
                className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-neutral-800 bg-[#1e1f22] hover:border-neutral-700 hover:bg-[#2b2d31]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      beat.style === 'Boom Bap' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      beat.style === 'Trap' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      beat.style === 'Drill' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      beat.style === 'Speed Flow' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {beat.style}
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-300">
                      {beat.bpm} BPM
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                    {beat.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                    {beat.descriptionLong || beat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400">
                    {beat.producer}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`card-play-${beat.id}`}
                      onClick={() => handleQuickPlayPreset(beat)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 ${
                        isCurrent && isPlayingBeat
                          ? 'bg-red-500 text-white'
                          : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
                      }`}
                    >
                      {isCurrent && isPlayingBeat ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      <span>{isCurrent && isPlayingBeat ? 'Pausar' : '/play'}</span>
                    </button>

                    <button
                      id={`card-studio-${beat.id}`}
                      onClick={() => onSendToStudio(beat)}
                      title="Usar no Studio de Freestyle"
                      className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors"
                    >
                      <Radio className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
