import { camara } from '@/lib/camara.config'

/** Logo da marca no admin do Payload (tela de login e topo). Branding leve. */
export function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      <span
        aria-hidden="true"
        style={{
          width: 44, height: 44, display: 'grid', placeItems: 'center',
          background: '#0a2540', color: '#fff', borderRadius: 10,
          fontWeight: 800, fontSize: '1.3rem', fontFamily: 'system-ui, sans-serif',
        }}
      >
        {camara.inicial}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <strong style={{ fontSize: '1rem' }}>{camara.nomeCurto}</strong>
        <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>Painel de conteúdo</span>
      </span>
    </div>
  )
}
