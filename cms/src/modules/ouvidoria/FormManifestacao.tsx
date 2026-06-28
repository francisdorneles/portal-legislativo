'use client'

import { useActionState } from 'react'
import { enviarManifestacao, type EstadoManifestacao } from './manifestacoes.actions'

const ESTADO_INICIAL: EstadoManifestacao = { ok: false }

type Props = {
  tipo: 'esic' | 'ouvidoria'
  /** Mostra o seletor de categoria (útil na Ouvidoria). */
  comCategoria?: boolean
}

export function FormManifestacao({ tipo, comCategoria }: Props) {
  const [estado, formAction, pendente] = useActionState(enviarManifestacao, ESTADO_INICIAL)

  if (estado.ok) {
    return (
      <div className="form-sucesso" role="status">
        <strong>Manifestação registrada!</strong>
        <p>
          Guarde seu número de protocolo: <span className="protocolo">{estado.protocolo}</span>
        </p>
        <p>Você receberá a resposta no e-mail informado, dentro do prazo legal.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="form-manifestacao">
      <input type="hidden" name="tipo" value={tipo} />

      {comCategoria && (
        <label>
          Tipo de manifestação
          <select name="categoria" defaultValue="reclamacao">
            <option value="reclamacao">Reclamação</option>
            <option value="denuncia">Denúncia</option>
            <option value="sugestao">Sugestão</option>
            <option value="elogio">Elogio</option>
            <option value="solicitacao">Solicitação</option>
          </select>
        </label>
      )}

      <div className="form-linha">
        <label>
          Tipo de solicitante
          <select name="solicitanteTipo" defaultValue="fisica">
            <option value="fisica">Pessoa física</option>
            <option value="juridica">Pessoa jurídica</option>
          </select>
        </label>
        <label>
          CPF / CNPJ *
          <input type="text" name="documento" inputMode="numeric" autoComplete="off" required />
        </label>
      </div>

      <div className="form-linha">
        <label>
          Nome / Razão social *
          <input type="text" name="nome" required autoComplete="name" />
        </label>
        <label>
          E-mail *
          <input type="email" name="email" required autoComplete="email" />
        </label>
      </div>

      <div className="form-linha">
        <label>
          Telefone
          <input type="tel" name="telefone" autoComplete="tel" />
        </label>
        <label>
          Forma de resposta
          <select name="formaResposta" defaultValue="email">
            <option value="email">E-mail</option>
            <option value="presencial">Retirar na Câmara</option>
            <option value="correio">Correspondência</option>
          </select>
        </label>
      </div>

      <label>
        Assunto *
        <input type="text" name="assunto" required />
      </label>

      <label>
        Mensagem *
        <textarea name="mensagem" rows={6} required />
      </label>

      <label className="form-check">
        <input type="checkbox" name="consentimento" value="1" required />
        <span>
          Autorizo o tratamento dos meus dados pessoais para análise e resposta desta manifestação,
          conforme a LGPD.
        </span>
      </label>

      {estado.erro && (
        <p className="form-erro" role="alert">
          {estado.erro}
        </p>
      )}

      <button type="submit" className="btn btn-am" disabled={pendente}>
        {pendente ? 'Enviando…' : 'Enviar manifestação'}
      </button>
    </form>
  )
}
