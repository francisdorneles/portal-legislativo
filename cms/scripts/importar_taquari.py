"""
Importação de documentos da Câmara de Taquari para o SAPL.
Executa DENTRO do container: python /tmp/importar_taquari.py

Ordem de execução:
  Fase 0 - Criar tipos faltantes (TipoDocumentoAdministrativo, TipoNormaJuridica)
  Fase 1 - Normas: Decretos Legislativos
  Fase 2 - Normas: Resoluções
  Fase 3 - Sessões Plenárias (a partir das atas)
  Fase 4 - Upload das atas PDF
  Fase 5 - Documentos Administrativos: Ordem do Dia
  Fase 6 - Documentos Administrativos: Expediente
  Fase 7 - Compilações anuais: Requerimentos e Indicações
"""

import os
import re
import sys
import django

sys.path.insert(0, '/var/interlegis/sapl')
os.environ['DJANGO_SETTINGS_MODULE'] = 'sapl.settings'
django.setup()

from datetime import date
from django.core.files import File

from sapl.norma.models import NormaJuridica, TipoNormaJuridica
from sapl.parlamentares.models import SessaoLegislativa, Legislatura
from sapl.sessao.models import TipoSessaoPlenaria, SessaoPlenaria
from sapl.protocoloadm.models import TipoDocumentoAdministrativo, DocumentoAdministrativo

BASE = '/tmp/taquari'
LOG = []

def log(msg):
    print(msg)
    LOG.append(msg)

def ok(msg):  log(f'  ✓ {msg}')
def skip(msg): log(f'  - SKIP: {msg}')
def err(msg):  log(f'  ✗ ERRO: {msg}')


# ---------------------------------------------------------------------------
# FASE 0 — Tipos
# ---------------------------------------------------------------------------
def fase0_tipos():
    log('\n=== FASE 0: Tipos ===')

    # TipoNormaJuridica — Resolução de Mesa
    rm, c = TipoNormaJuridica.objects.get_or_create(
        sigla='RME',
        defaults={'descricao': 'Resolução de Mesa'}
    )
    ok(f'TipoNormaJuridica RME {"criado" if c else "já existia"}')

    # TipoDocumentoAdministrativo
    tipos = [
        ('OD',   'Ordem do Dia'),
        ('EXP',  'Expediente de Sessão'),
        ('REQC', 'Compilação de Requerimentos'),
        ('INDC', 'Compilação de Indicações'),
    ]
    for sigla, descricao in tipos:
        t, c = TipoDocumentoAdministrativo.objects.get_or_create(
            sigla=sigla,
            defaults={'descricao': descricao}
        )
        ok(f'TipoDocAdm {sigla} {"criado" if c else "já existia"}')

    # SessaoLegislativa 2024 (para documentos de 2024 da legislatura 16ª)
    leg16 = Legislatura.objects.filter(data_inicio__year=2021).first()
    if leg16:
        sl2024, c = SessaoLegislativa.objects.get_or_create(
            legislatura=leg16,
            numero=2,
            defaults={
                'tipo': 'O',
                'data_inicio': date(2024, 2, 1),
                'data_fim': date(2024, 12, 31),
            }
        )
        ok(f'SessaoLegislativa 2024 {"criada" if c else "já existia"} (id={sl2024.id})')


# ---------------------------------------------------------------------------
# FASE 1 — Decretos Legislativos
# ---------------------------------------------------------------------------
def parse_decreto(fname):
    """Retorna (numero_str, ano_int) ou None."""
    # Decreto 001.18.pdf  |  Decreto 001.19.pdf
    m = re.match(r'Decreto\s+(\d+)\.(\d{2})\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2))

    # Decreto-Legislativo n° 001.25.pdf
    m = re.match(r'Decreto[- _]Legislativo[\s\w°]*?(\d+)[.\-](\d{2})\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2))

    # Decreto_Legislativo_001-24.pdf
    m = re.match(r'Decreto_Legislativo_(\d+)-(\d{2})\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2))

    return None


def fase1_decretos():
    log('\n=== FASE 1: Decretos Legislativos ===')
    pasta = os.path.join(BASE, 'decretos')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    tipo = TipoNormaJuridica.objects.get(sigla='DLE')
    importados = 0

    for fname in sorted(os.listdir(pasta)):
        if not fname.lower().endswith('.pdf'):
            skip(fname); continue

        parsed = parse_decreto(fname)
        if not parsed:
            skip(f'{fname} (nome não reconhecido)'); continue

        numero, ano = parsed
        fpath = os.path.join(pasta, fname)

        if NormaJuridica.objects.filter(tipo=tipo, numero=numero, ano=ano).exists():
            skip(f'Decreto {numero}/{ano} já existe')
            continue

        try:
            norma = NormaJuridica(
                tipo=tipo,
                numero=numero,
                ano=ano,
                esfera_federacao='M',
                ementa=f'Decreto Legislativo nº {numero}, de {ano}.',
                data=date(ano, 1, 1),
            )
            with open(fpath, 'rb') as f:
                norma.texto_integral.save(fname, File(f), save=False)
            norma.save()
            ok(f'Decreto {numero}/{ano}')
            importados += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total importados: {importados}')


# ---------------------------------------------------------------------------
# FASE 2 — Resoluções
# ---------------------------------------------------------------------------
def parse_resolucao(fname):
    """Retorna (numero_str, ano_int, tipo_sigla) ou None."""
    # Resolução de Mesa 001-26.pdf
    m = re.match(r'Resolu[cç][aã]o de Mesa\s+(\d+)-(\d{2})\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2)), 'RME'

    # Resolução 943-26.pdf  |  Resolucao_001-20.pdf  |  Resolucao_933-20_1.pdf
    m = re.match(r'Resolu[cç][aã]o_?(\d+)-(\d{2})(?:_\d+)?\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2)), 'RES'

    # Resolução 943-26.pdf (com espaço e acento)
    m = re.match(r'Resolu[cç][aã]o\s+(\d+)-(\d{2})\.pdf$', fname, re.IGNORECASE)
    if m:
        return m.group(1).lstrip('0') or '0', 2000 + int(m.group(2)), 'RES'

    return None


def fase2_resolucoes():
    log('\n=== FASE 2: Resoluções ===')
    pasta = os.path.join(BASE, 'resolucoes')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    importados = 0
    vistos = set()  # evitar duplicatas (933-20_1, _2, _3)

    for fname in sorted(os.listdir(pasta)):
        if not fname.lower().endswith('.pdf'):
            skip(fname); continue

        parsed = parse_resolucao(fname)
        if not parsed:
            skip(f'{fname} (nome não reconhecido)'); continue

        numero, ano, sigla = parsed
        chave = (numero, ano, sigla)

        if chave in vistos:
            skip(f'{fname} (parte duplicada de {numero}/{ano})'); continue
        vistos.add(chave)

        tipo = TipoNormaJuridica.objects.get(sigla=sigla)
        fpath = os.path.join(pasta, fname)

        if NormaJuridica.objects.filter(tipo=tipo, numero=numero, ano=ano).exists():
            skip(f'Resolução {sigla} {numero}/{ano} já existe')
            continue

        try:
            norma = NormaJuridica(
                tipo=tipo,
                numero=numero,
                ano=ano,
                esfera_federacao='M',
                ementa=f'Resolução nº {numero}, de {ano}.',
                data=date(ano, 1, 1),
            )
            with open(fpath, 'rb') as f:
                norma.texto_integral.save(fname, File(f), save=False)
            norma.save()
            ok(f'Resolução {sigla} {numero}/{ano}')
            importados += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total importados: {importados}')


# ---------------------------------------------------------------------------
# FASE 3 — Sessões Plenárias
# ---------------------------------------------------------------------------
MESES = {'jan':1,'fev':2,'mar':3,'abr':4,'mai':5,'jun':6,
          'jul':7,'ago':8,'set':9,'out':10,'nov':11,'dez':12}

def parse_ata(fname):
    """
    Retorna (seq, data_sessao_ou_None, tipo_id) ou None se não reconhecida.
    seq = número sequencial (int), ex: 10 para 'Ata 4.010'
    """
    if not fname.lower().endswith('.pdf'):
        return None

    # Extrair sequência: Ata 4.XXX  ou  Ata nº 4.XXX
    m_seq = re.match(r'Ata\s+(?:n[°º]\s+)?4\.(\d+)', fname, re.IGNORECASE)
    if not m_seq:
        return None
    seq = int(m_seq.group(1))

    # Tipo de sessão
    tipo_id = 1  # Ordinária por padrão
    if re.search(r'Extraordin[áa]ria', fname, re.IGNORECASE):
        tipo_id = 2
    elif re.search(r'Solene', fname, re.IGNORECASE):
        tipo_id = 3

    # Data: DD.MM.YY ou DD.MM.YYYY
    m_data = re.search(r'(\d{1,2})\.(\d{2})\.(\d{2,4})\.?pdf$', fname, re.IGNORECASE)
    if m_data:
        dia = int(m_data.group(1))
        mes = int(m_data.group(2))
        ano_s = m_data.group(3)
        ano = 2000 + int(ano_s) if len(ano_s) == 2 else int(ano_s)
        try:
            return seq, date(ano, mes, dia), tipo_id
        except ValueError:
            pass

    # Datas conhecidas sem data no nome
    DATAS_FIXAS = {
        16: (date(2025, 12, 1), 3),  # Eleição da Mesa, Sessão Solene
        67: (date(2025, 12, 1), 3),  # Eleição da Mesa, Sessão Solene
    }
    if seq in DATAS_FIXAS:
        data_fixa, tipo_fixa = DATAS_FIXAS[seq]
        return seq, data_fixa, tipo_fixa

    # Sem data (sem mapeamento conhecido)
    return seq, None, tipo_id


def sessao_legislativa_para_ano(ano):
    """Retorna SessaoLegislativa correspondente ao ano, ou None."""
    return SessaoLegislativa.objects.filter(
        data_inicio__lte=date(ano, 12, 31),
        data_fim__gte=date(ano, 1, 1)
    ).first()


def fase3_sessoes():
    log('\n=== FASE 3: Sessões Plenárias ===')
    pasta = os.path.join(BASE, 'atas')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    leg = Legislatura.objects.get(id=3)  # 20ª legislatura
    criadas = 0
    vistos = set()

    for fname in sorted(os.listdir(pasta)):
        parsed = parse_ata(fname)
        if not parsed:
            continue  # atas antigas ou docx

        seq, data_sessao, tipo_id = parsed

        if seq in vistos:
            skip(f'{fname} (seq {seq} duplicada)')
            continue
        vistos.add(seq)

        if data_sessao is None:
            skip(f'{fname} (sem data no nome — será associada manualmente)')
            continue

        # Verificar se pertence à legislatura 20ª (2025-2028)
        if data_sessao.year < 2025:
            skip(f'{fname} (ano {data_sessao.year} fora da 20ª legislatura)')
            continue

        sl = sessao_legislativa_para_ano(data_sessao.year)
        if not sl:
            skip(f'{fname} (sem SessaoLegislativa para {data_sessao.year})')
            continue

        if SessaoPlenaria.objects.filter(sessao_legislativa=sl, numero=seq).exists():
            skip(f'Sessão {seq} já existe na SessaoLegislativa {sl.id}')
            continue

        tipo = TipoSessaoPlenaria.objects.get(id=tipo_id)
        try:
            SessaoPlenaria.objects.create(
                legislatura=leg,
                sessao_legislativa=sl,
                tipo=tipo,
                numero=seq,
                data_inicio=data_sessao,
                hora_inicio='09:00',
                hora_fim='',
            )
            ok(f'Sessão {seq} — {tipo.nome} em {data_sessao}')
            criadas += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total criadas: {criadas}')


# ---------------------------------------------------------------------------
# FASE 4 — Upload das Atas PDF
# ---------------------------------------------------------------------------
def fase4_upload_atas():
    log('\n=== FASE 4: Upload das Atas ===')
    pasta = os.path.join(BASE, 'atas')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    uploads = 0
    vistos = set()

    for fname in sorted(os.listdir(pasta)):
        parsed = parse_ata(fname)
        if not parsed:
            continue

        seq, data_sessao, _ = parsed

        if seq in vistos or data_sessao is None or data_sessao.year < 2025:
            continue
        vistos.add(seq)

        sl = sessao_legislativa_para_ano(data_sessao.year)
        if not sl:
            continue

        sessao = SessaoPlenaria.objects.filter(sessao_legislativa=sl, numero=seq).first()
        if not sessao:
            skip(f'Sessão {seq} não encontrada para upload')
            continue

        if sessao.upload_ata:
            skip(f'Sessão {seq} já tem ata')
            continue

        fpath = os.path.join(pasta, fname)
        try:
            with open(fpath, 'rb') as f:
                sessao.upload_ata.save(fname, File(f), save=True)
            ok(f'Ata {seq} ({fname})')
            uploads += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total uploads: {uploads}')


# ---------------------------------------------------------------------------
# FASE 5 — Documentos Administrativos: Ordem do Dia
# ---------------------------------------------------------------------------
def parse_data_doc(fname):
    """Extrai date de 'Ordem do Dia - DD.MM.YY.pdf' ou 'Ordem do Dia - DD.MM.YY - Extra.pdf'."""
    # Remove sufixos opcionais como " - Extra", " - extra" antes do .pdf
    nome = re.sub(r'\s*-\s*[Ee]xtra\s*$', '', os.path.splitext(fname)[0])
    m = re.search(r'(\d{1,2})[.\-/](\d{2})[.\-/](\d{2,4})$', nome)
    if m:
        dia, mes = int(m.group(1)), int(m.group(2))
        ano_s = m.group(3)
        ano = 2000 + int(ano_s) if len(ano_s) == 2 else int(ano_s)
        try:
            return date(ano, mes, dia)
        except ValueError:
            return None
    return None


def sessao_do_dia(data):
    """Retorna SessaoPlenaria com data_inicio == data, se existir."""
    return SessaoPlenaria.objects.filter(data_inicio=data).first()


def fase5_ordem_do_dia():
    log('\n=== FASE 5: Ordem do Dia ===')
    pasta = os.path.join(BASE, 'ordemdodia')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    tipo = TipoDocumentoAdministrativo.objects.get(sigla='OD')
    importados = 0
    seq = DocumentoAdministrativo.objects.filter(tipo=tipo).count() + 1

    for fname in sorted(os.listdir(pasta)):
        if not fname.lower().endswith('.pdf'):
            skip(fname); continue

        data = parse_data_doc(fname)
        if not data:
            skip(f'{fname} (data não reconhecida)'); continue

        is_extra = bool(re.search(r'[Ee]xtra', fname))
        assunto = f'Ordem do Dia{"(Extraordinária) " if is_extra else " "}da Sessão de {data.strftime("%d/%m/%Y")}'

        if DocumentoAdministrativo.objects.filter(tipo=tipo, data=data, assunto=assunto).exists():
            skip(f'Ordem do Dia {data}{"(Extra)" if is_extra else ""} já existe'); continue

        fpath = os.path.join(pasta, fname)
        try:
            doc = DocumentoAdministrativo(
                tipo=tipo,
                numero=seq,
                ano=data.year,
                data=data,
                assunto=assunto,
            )
            with open(fpath, 'rb') as f:
                doc.texto_integral.save(fname, File(f), save=False)
            doc.save()
            ok(f'Ordem do Dia {data}')
            seq += 1
            importados += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total importados: {importados}')


# ---------------------------------------------------------------------------
# FASE 6 — Documentos Administrativos: Expediente
# ---------------------------------------------------------------------------
def fase6_expediente():
    log('\n=== FASE 6: Expediente ===')
    pasta = os.path.join(BASE, 'expediente')
    if not os.path.isdir(pasta):
        err(f'Pasta não encontrada: {pasta}'); return

    tipo = TipoDocumentoAdministrativo.objects.get(sigla='EXP')
    importados = 0
    seq = DocumentoAdministrativo.objects.filter(tipo=tipo).count() + 1

    for fname in sorted(os.listdir(pasta)):
        if not fname.lower().endswith('.pdf'):
            skip(fname); continue

        data = parse_data_doc(fname)
        if not data:
            skip(f'{fname} (data não reconhecida)'); continue

        if DocumentoAdministrativo.objects.filter(tipo=tipo, data=data).exists():
            skip(f'Expediente {data} já existe'); continue

        fpath = os.path.join(pasta, fname)
        try:
            doc = DocumentoAdministrativo(
                tipo=tipo,
                numero=seq,
                ano=data.year,
                data=data,
                assunto=f'Expediente da Sessão de {data.strftime("%d/%m/%Y")}',
            )
            with open(fpath, 'rb') as f:
                doc.texto_integral.save(fname, File(f), save=False)
            doc.save()
            ok(f'Expediente {data}')
            seq += 1
            importados += 1
        except Exception as e:
            err(f'{fname}: {e}')

    log(f'  Total importados: {importados}')


# ---------------------------------------------------------------------------
# FASE 7 — Compilações anuais (Requerimentos + Indicações)
# ---------------------------------------------------------------------------
def fase7_compilacoes():
    log('\n=== FASE 7: Compilações anuais ===')

    for sigla_tipo, pasta_nome, prefixo_busca, label in [
        ('REQC', 'requerimentos', 'requerimentos', 'Requerimentos'),
        ('INDC', 'indicacoes',    'indicacoes',    'Indicações'),
    ]:
        pasta = os.path.join(BASE, pasta_nome)
        if not os.path.isdir(pasta):
            err(f'Pasta não encontrada: {pasta}'); continue

        tipo = TipoDocumentoAdministrativo.objects.get(sigla=sigla_tipo)
        importados = 0
        seq = DocumentoAdministrativo.objects.filter(tipo=tipo).count() + 1

        for fname in sorted(os.listdir(pasta)):
            if not re.match(rf'{prefixo_busca}\d{{4}}\.(pdf|docx?)$', fname, re.IGNORECASE):
                skip(f'{fname}'); continue

            m = re.search(r'(\d{4})', fname)
            if not m:
                skip(fname); continue
            ano = int(m.group(1))

            if DocumentoAdministrativo.objects.filter(tipo=tipo, ano=ano).exists():
                skip(f'{label} {ano} já existe'); continue

            fpath = os.path.join(pasta, fname)
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ('.pdf', '.doc', '.docx'):
                skip(fname); continue

            try:
                doc = DocumentoAdministrativo(
                    tipo=tipo,
                    numero=seq,
                    ano=ano,
                    data=date(ano, 12, 31),
                    assunto=f'Compilação de {label} — {ano}',
                )
                with open(fpath, 'rb') as f:
                    doc.texto_integral.save(fname, File(f), save=False)
                doc.save()
                ok(f'{label} {ano}')
                seq += 1
                importados += 1
            except Exception as e:
                err(f'{fname}: {e}')

        log(f'  {label}: {importados} importados')


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    log('=== IMPORTAÇÃO TAQUARI ===')
    log(f'Base de arquivos: {BASE}')

    try:
        fase0_tipos()
        fase1_decretos()
        fase2_resolucoes()
        fase3_sessoes()
        fase4_upload_atas()
        fase5_ordem_do_dia()
        fase6_expediente()
        fase7_compilacoes()
    except KeyboardInterrupt:
        log('\nInterrompido.')

    erros = [l for l in LOG if '✗' in l]
    log(f'\n=== CONCLUÍDO — {len(erros)} erros ===')
    if erros:
        log('\nErros encontrados:')
        for e in erros:
            log(f'  {e}')
