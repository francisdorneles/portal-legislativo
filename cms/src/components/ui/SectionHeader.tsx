import Link from 'next/link'

/** Cabeçalho de seção: barra amarela + título + link opcional ("ver todos"). */
export function SectionHeader({
  id,
  titulo,
  link,
}: {
  id?: string
  titulo: string
  link?: { href: string; label: string }
}) {
  return (
    <div className="sec-head">
      <span className="bar" aria-hidden="true" />
      <h2 id={id}>{titulo}</h2>
      {link && (
        <Link href={link.href}>{link.label}</Link>
      )}
    </div>
  )
}
