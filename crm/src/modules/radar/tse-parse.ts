/**
 * Parser PURO do CSV do TSE (votação nominal por seção) → linhas de ResultadoEleitoral.
 *
 * Sem I/O e sem Prisma de propósito: é a parte testável (recebe o texto, devolve dados).
 * O CSV do TSE é `;`-delimitado, com campos entre aspas duplas. A correção de encoding
 * (mojibake) é responsabilidade de quem lê o arquivo (tse-import); aqui recebemos texto já ok.
 *
 * Origem do dado é a SEÇÃO (zona/seção/local de votação); a agregação por bairro
 * (UnidadeTerritorial) acontece numa etapa posterior do Radar.
 */

export type LinhaResultadoTse = {
  ano: number
  cargo: string
  candidatoNome: string
  partido: string | null // CSV de votação por seção não traz sigla — fica null
  votos: number
  zona: number | null
  secao: number | null
  localVotacao: string | null
}

/** Quebra uma linha CSV `;`-delimitada respeitando aspas duplas ("" = aspa literal). */
function splitCsvLine(linha: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroAspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else {
        dentroAspas = !dentroAspas
      }
    } else if (c === ';' && !dentroAspas) {
      campos.push(atual)
      atual = ''
    } else {
      atual += c
    }
  }
  campos.push(atual)
  return campos.map((s) => s.trim())
}

function paraInt(v: string | undefined): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/**
 * Converte o conteúdo bruto do CSV (já decodificado em latin1) em linhas tipadas.
 * Mapeia colunas pelo NOME do header (robusto a reordenação de colunas do TSE).
 */
export function parseCsvTse(conteudo: string): LinhaResultadoTse[] {
  const linhas = conteudo.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (linhas.length < 2) return []

  const header = splitCsvLine(linhas[0])
  const idx = (nome: string) => header.indexOf(nome)
  const iAno = idx('ANO_ELEICAO')
  const iCargo = idx('DS_CARGO')
  const iNome = idx('NM_VOTAVEL')
  const iVotos = idx('QT_VOTOS')
  const iZona = idx('NR_ZONA')
  const iSecao = idx('NR_SECAO')
  const iLocal = idx('NM_LOCAL_VOTACAO')

  if (iAno < 0 || iNome < 0 || iVotos < 0) {
    throw new Error(
      'CSV do TSE inesperado: faltam colunas ANO_ELEICAO/NM_VOTAVEL/QT_VOTOS no header.',
    )
  }

  const out: LinhaResultadoTse[] = []
  for (let i = 1; i < linhas.length; i++) {
    const c = splitCsvLine(linhas[i])
    const ano = paraInt(c[iAno])
    const votos = paraInt(c[iVotos])
    if (ano == null || votos == null) continue // linha malformada → ignora
    out.push({
      ano,
      cargo: iCargo >= 0 ? c[iCargo] : 'Vereador',
      candidatoNome: c[iNome],
      partido: null,
      votos,
      zona: iZona >= 0 ? paraInt(c[iZona]) : null,
      secao: iSecao >= 0 ? paraInt(c[iSecao]) : null,
      localVotacao: iLocal >= 0 ? c[iLocal] || null : null,
    })
  }
  return out
}
