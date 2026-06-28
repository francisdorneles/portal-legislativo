/**
 * Configuração do gateway de IA (híbrido). Tudo via env — nada hard-coded.
 *
 * Dimensão dos embeddings = 1536 (coluna pgvector `vector(1536)`). O modelo de embedding
 * escolhido DEVE produzir 1536 dims (ex.: OpenAI text-embedding-3-small). Se usar um modelo
 * local de outra dimensão, ajuste a coluna no schema.
 */
export const DIM = 1024 // bge-m3 (Ollama). Trocou de modelo de embedding? alinhe coluna + DIM.

export type Tier = 'local' | 'fronteira'

export const iaConfig = {
  // 'stub' roda offline (determinístico) — default p/ dev/testes sem chave/modelo.
  embedProvider: (process.env.IA_EMBED_PROVIDER ?? 'stub') as 'stub' | 'ollama' | 'openai',

  ollama: {
    url: process.env.IA_OLLAMA_URL ?? 'http://localhost:11434',
    embedModel: process.env.IA_OLLAMA_EMBED_MODEL ?? 'bge-m3',
    genModel: process.env.IA_OLLAMA_GEN_MODEL ?? 'qwen2.5:14b',
  },

  // embeddings OpenAI (text-embedding-3-small com dimensions=1024) + transcrição (Whisper)
  openai: {
    url: process.env.IA_OPENAI_URL ?? 'https://api.openai.com/v1',
    key: process.env.IA_OPENAI_KEY ?? '',
    embedModel: process.env.IA_OPENAI_EMBED_MODEL ?? 'text-embedding-3-small',
    transcribeModel: process.env.IA_OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1',
  },

  // visão (foto → relato): usa um modelo multimodal. Default = modelo de fronteira (gpt-4o-mini
  // tem visão); override por env se a fronteira não for multimodal.
  visionModel: process.env.IA_VISION_MODEL ?? '',

  // provedor de fronteira (formato OpenAI-compatible — serve várias APIs)
  fronteira: {
    url: process.env.IA_FRONTIER_URL ?? '',
    key: process.env.IA_FRONTIER_KEY ?? '',
    model: process.env.IA_FRONTIER_MODEL ?? '',
  },

  // roteamento de geração por tier: tarefas baratas no local, difíceis na fronteira.
  genProviderLocal: (process.env.IA_GEN_LOCAL ?? 'stub') as 'stub' | 'ollama' | 'openai',
  genProviderFronteira: (process.env.IA_GEN_FRONTIER ?? 'stub') as 'stub' | 'ollama' | 'openai',
} as const
