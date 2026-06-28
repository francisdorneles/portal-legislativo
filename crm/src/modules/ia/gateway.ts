/**
 * Gateway de IA — ponto único de entrada. Roteia geração por TIER:
 *   - 'local'     → tarefas baratas (extração, classificação) no provedor local
 *   - 'fronteira' → tarefas difíceis (redigir proposição, raciocínio) na API de fronteira
 * Embeddings usam o provedor de embedding configurado. Trocar provedor = mudar env.
 */
import { iaConfig, type Tier } from './config.js'
import { embed, gerar as gerarProvider, transcrever, lerImagem, type GerarOpts } from './providers.js'

export { embed, transcrever, lerImagem }
export type { Tier, GerarOpts }

export async function gerar(opts: GerarOpts & { tier?: Tier }): Promise<string> {
  const tier: Tier = opts.tier ?? 'local'
  const provider = tier === 'fronteira' ? iaConfig.genProviderFronteira : iaConfig.genProviderLocal
  return gerarProvider(provider, opts)
}

/** Formata um vetor JS para o literal aceito pelo pgvector: [a,b,c]. */
export function vetorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}
