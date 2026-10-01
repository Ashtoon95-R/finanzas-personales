import json
from collections import defaultdict

p = "analisis_datos/finanzas-backup-2026-10-01.json"
d = json.load(open(p, encoding="utf-8"))
by_m = defaultdict(list)
for i in d["ingresos"]:
    f = i["fecha"][:7]
    if f in ("2026-07", "2026-08", "2026-09"):
        by_m[f].append(i)
print("n", sum(len(v) for v in by_m.values()))
for m in ("2026-07", "2026-08", "2026-09"):
    s = sum(x["importe"] for x in by_m[m])
    print(m, len(by_m[m]), round(s, 2))
    for x in by_m[m]:
        notas = (x.get("notas") or "")[:50]
        print(f"  {x['concepto'][:42]:42} {x['importe']:10.2f} {x['estado']:10} {notas}")
tot = sum(x["importe"] for xs in by_m.values() for x in xs)
print("TOTAL", round(tot, 2))
print("IVA21", round(tot * 0.21, 2))
