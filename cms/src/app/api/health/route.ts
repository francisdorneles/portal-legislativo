export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = { app: 'ok' }
  let status = 200

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3000)
    const r = await fetch(`${process.env.SAPL_API_BASE}/api/`, { signal: ctrl.signal })
    clearTimeout(t)
    checks.sapl = r.ok ? 'ok' : `http_${r.status}`
    if (!r.ok) status = 503
  } catch {
    checks.sapl = 'down'
    status = 503
  }

  return Response.json(
    { status: status === 200 ? 'healthy' : 'degraded', checks },
    { status },
  )
}
