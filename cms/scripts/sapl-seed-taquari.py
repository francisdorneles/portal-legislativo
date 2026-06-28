"""
Popula o SAPL de Taquari com os vereadores reais da legislatura 2025-2028.
Rodar dentro do container: docker exec -i taquari-sapl-1 python /code/manage.py shell < sapl-seed-taquari.py
"""
from parlamentares.models import Parlamentar, Partido, Filiacao
from django.utils import timezone
import datetime

# 1. Remove parlamentares falsos
Filiacao.objects.all().delete()
Parlamentar.objects.all().delete()
print("Parlamentares antigos removidos.")

# 2. Cria/garante os partidos
PARTIDOS = [
    ("PDT", "Partido Democrático Trabalhista"),
    ("PP",  "Progressistas"),
    ("PT",  "Partido dos Trabalhadores"),
    ("Avante", "Avante"),
]
partidos_map = {}
for sigla, nome in PARTIDOS:
    p, _ = Partido.objects.get_or_create(sigla=sigla, defaults={"nome": nome})
    partidos_map[sigla] = p
    print(f"Partido: {sigla}")

# 3. Cria os vereadores e filia
VEREADORES = [
    ("Ademir Bica Fagundes",           "M", "PDT"),
    ("Aldo Gregory",                   "M", "PP"),
    ("Angélica Hassen",                "F", "PT"),
    ("Antônio Porfírio de Araújo Costa","M","Avante"),
    ("José Harry Saraiva Dias",        "M", "PDT"),
    ("Luciano Fabiano Maria da Silva", "M", "PT"),
    ("Luis Henrique Quadros Porto",    "M", "PDT"),
    ("Marcelo Bernstein Lopes",        "M", "PDT"),
    ("Renato Scherer da Silva",        "M", "PDT"),
]

inicio = datetime.date(2025, 1, 1)

for nome, sexo, partido_sigla in VEREADORES:
    v = Parlamentar.objects.create(
        nome_completo=nome,
        nome_parlamentar=nome,
        sexo=sexo,
        ativo=True,
    )
    Filiacao.objects.create(
        parlamentar=v,
        partido=partidos_map[partido_sigla],
        data=inicio,
    )
    print(f"✅ {nome} ({partido_sigla})")

print("\nPronto! Acesse http://localhost:8020/admin para conferir.")
