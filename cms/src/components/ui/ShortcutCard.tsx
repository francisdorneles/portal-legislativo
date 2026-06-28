import Link from 'next/link'
import { Icon, type IconName } from './Icon'

export interface Shortcut {
  href: string
  titulo: string
  desc: string
  icon: IconName
}

/** Card de atalho de serviço ao cidadão. */
export function ShortcutCard({ href, titulo, desc, icon }: Shortcut) {
  return (
    <Link className="atalho" href={href}>
      <Icon name={icon} className="ic" size={44} />
      <h3>{titulo}</h3>
      <p>{desc}</p>
    </Link>
  )
}
