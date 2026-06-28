"""
seed_camara_padrao.py — Seed de tipos padrão para nova câmara municipal.

Executa DENTRO do container SAPL:
  python /tmp/seed_camara_padrao.py

O que faz:
  - Garante que todos os tipos legislativos essenciais existam
  - Idempotente: pode rodar múltiplas vezes sem duplicar dados
  - NÃO cria tipos específicos de importação histórica (OD, EXP, REQC, INDC)
    — esses são workarounds de migração, não fluxo padrão
"""

import os
import sys
import django

sys.path.insert(0, '/var/interlegis/sapl')
os.environ['DJANGO_SETTINGS_MODULE'] = 'sapl.settings'
django.setup()

from sapl.norma.models import TipoNormaJuridica
from sapl.materia.models import TipoMateriaLegislativa
from sapl.sessao.models import TipoSessaoPlenaria

def seed(model, chave, defaults, label):
    obj, criado = model.objects.get_or_create(**{chave: defaults[chave]}, defaults=defaults)
    status = "criado" if criado else "já existia"
    print(f"  {'✓' if criado else '-'} {defaults[chave]:6s}  {defaults.get('descricao', defaults.get('nome', ''))} [{status}]")
    return obj, criado


print("\n=== SEED PADRÃO — CÂMARA MUNICIPAL ===\n")

# ---------------------------------------------------------------------------
# TipoNormaJuridica
# ---------------------------------------------------------------------------
print("── Tipos de Norma Jurídica ──")
normas = [
    {'sigla': 'LEI',  'descricao': 'Lei Ordinária'},
    {'sigla': 'LC',   'descricao': 'Lei Complementar'},
    {'sigla': 'DLE',  'descricao': 'Decreto Legislativo'},
    {'sigla': 'RES',  'descricao': 'Resolução'},
    {'sigla': 'RME',  'descricao': 'Resolução de Mesa'},
    {'sigla': 'ELO',  'descricao': 'Emenda à Lei Orgânica'},
    {'sigla': 'PORT', 'descricao': 'Portaria da Mesa'},
]
for d in normas:
    seed(TipoNormaJuridica, 'sigla', d, 'TipoNormaJuridica')

# ---------------------------------------------------------------------------
# TipoMateriaLegislativa
# ---------------------------------------------------------------------------
print("\n── Tipos de Matéria Legislativa ──")
materias = [
    {'sigla': 'PL',   'descricao': 'Projeto de Lei Ordinária'},
    {'sigla': 'PLC',  'descricao': 'Projeto de Lei Complementar'},
    {'sigla': 'PDL',  'descricao': 'Projeto de Decreto Legislativo'},
    {'sigla': 'PRES', 'descricao': 'Projeto de Resolução'},
    {'sigla': 'PELO', 'descricao': 'Proposta de Emenda à Lei Orgânica'},
    {'sigla': 'REQ',  'descricao': 'Requerimento'},
    {'sigla': 'IND',  'descricao': 'Indicação'},
    {'sigla': 'MOC',  'descricao': 'Moção'},
    {'sigla': 'VET',  'descricao': 'Veto'},
    {'sigla': 'EMD',  'descricao': 'Emenda'},
    {'sigla': 'PIN',  'descricao': 'Pedido de Informação'},
    {'sigla': 'SUB',  'descricao': 'Substitutivo'},
]
for d in materias:
    seed(TipoMateriaLegislativa, 'sigla', d, 'TipoMateriaLegislativa')

# ---------------------------------------------------------------------------
# TipoSessaoPlenaria
# ---------------------------------------------------------------------------
print("\n── Tipos de Sessão Plenária ──")
sessoes = [
    {'nome': 'Sessão Ordinária'},
    {'nome': 'Sessão Extraordinária'},
    {'nome': 'Sessão Solene'},
    {'nome': 'Sessão Especial'},
    {'nome': 'Sessão de Instalação'},
]
for d in sessoes:
    seed(TipoSessaoPlenaria, 'nome', d, 'TipoSessaoPlenaria')

print("\n=== SEED CONCLUÍDO ===")
print("""
Próximos passos manuais no admin SAPL:
  1. Criar Legislatura (número, datas de início e fim)
  2. Criar Sessão Legislativa (1º período do mandato)
  3. Cadastrar parlamentares e seus mandatos
  4. Configurar Mesa Diretora
  5. Configurar Comissões e suas composições
""")
