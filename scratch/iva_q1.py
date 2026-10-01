import json
from collections import defaultdict

p = "analisis_datos/finanzas-backup-2026-10-01.json"
d = json.load(open(p, encoding="utf-8"))
by_m = defaultdict(list)
for i in d["ingresos"]:
    f = i["fecha"][:7]
    if f.startswith("2026-"):
        by_m[f].append(i)

for m in ("2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"):
    rows = by_m[m]
    s = sum(x["importe"] for x in rows)
    print("==", m, len(rows), round(s, 2), "IVA", round(s * 0.21, 2))
    for x in rows:
        notas = (x.get("notas") or "")[:60]
        print(f"  {x['concepto'][:42]:42} {x['importe']:10.2f} {x['estado']:10} {notas}")

print("\nQ1", round(sum(x["importe"] for m in ("2026-01", "2026-02", "2026-03") for x in by_m[m]), 2))
print("Q2", round(sum(x["importe"] for m in ("2026-04", "2026-05", "2026-06") for x in by_m[m]), 2))

print("\nGASTOS impuestos:")
for g in d["gastosVariables"]:
    if g.get("categoria") == "impuestos":
        print(g)
