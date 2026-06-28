import { NextResponse } from 'next/server'
import { painelAoVivo } from '@/modules/legislativo/painel.queries'

// Proxy do painel ao vivo: o público nunca fala com o SAPL direto. Dinâmico,
// sem cache — cada requisição reflete o estado atual da sessão.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const estado = await painelAoVivo()
  return NextResponse.json(estado, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
