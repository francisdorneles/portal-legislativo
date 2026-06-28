/**
 * Monta o link wa.me a partir do telefone. Só dígitos; se não tiver código do país,
 * assume Brasil (55). Retorna null se não houver telefone utilizável.
 */
export function linkWhatsApp(telefone: string | null | undefined): string | null {
  if (!telefone) return null
  let digitos = telefone.replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length <= 11) digitos = `55${digitos}` // DDD + número, sem país
  return `https://wa.me/${digitos}`
}
