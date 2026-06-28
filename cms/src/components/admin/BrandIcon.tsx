import { camara } from '@/lib/camara.config'

/** Ícone da marca no admin do Payload (favicon/nav compacto). Branding leve. */
export function BrandIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 28, height: 28, display: 'grid', placeItems: 'center',
        background: '#0a2540', color: '#fff', borderRadius: 7,
        fontWeight: 800, fontSize: '0.95rem', fontFamily: 'system-ui, sans-serif',
      }}
    >
      {camara.inicial}
    </span>
  )
}
