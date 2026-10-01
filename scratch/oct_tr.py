import json

d = json.load(open("analisis_datos/finanzas-backup-2026-10-01.json", encoding="utf-8"))
fijos = [g for g in d["gastosFijos"] if g.get("activo")]
tf = round(sum(g["importe"] for g in fijos), 2)
print("FIJOS", tf)
for g in sorted(fijos, key=lambda x: x["diaCobro"]):
    print(f"  dia {g['diaCobro']:2} {g['concepto'][:40]:40} {g['importe']}")

oct_ing = [i for i in d["ingresos"] if i["fecha"].startswith("2026-10")]
print("\nINGRESOS OCT")
for i in oct_ing:
    print(f"  {i['estado']:10} {i['importe']:10.2f} {i['concepto'][:40]} | {i.get('notas','')[:50]}")
print("total", round(sum(i["importe"] for i in oct_ing), 2))
print("cobrado", round(sum(i["importe"] for i in oct_ing if i["estado"]=="cobrado"), 2))
print("pendiente", round(sum(i["importe"] for i in oct_ing if i["estado"]!="cobrado"), 2))

c = d["configuracion"][0]
imagin = c["saldoCuentaOperativa"]
revolut = c.get("saldoRevolut", 0)
colchon = c["colchonActual"]
ocio_hecho = c.get("planDia1PorMes", {}).get("2026-10", {}).get("ocio", {})
print("\nSALDOS", imagin, revolut, colchon, "ocio", ocio_hecho)
iva = 4854.74
necesidad_oct = tf + iva
print("necesidad fijos+iva", round(necesidad_oct, 2))
# conservative: don't count pending invoices
tras_oct_sin_ing = round(imagin - necesidad_oct, 2)
print("Imagin tras fijos+IVA sin ingresos pendientes", tras_oct_sin_ing)
# IRPF nov 5 - if they want buffer until Nov 5
irpf = 3748.95
print("si reserva también IRPF nov", round(imagin - necesidad_oct - irpf, 2))
print("techo 2*fijos", round(2*tf, 2))
print("exceso sobre techo", round(imagin - 2*tf - iva, 2))
print("a TR conservador (dejar en Imagin fijos rest + IVA)", round(max(0, imagin - (tf + iva)), 2))
print("a TR si dejas 2 meses fijos + IVA en Imagin", round(max(0, imagin - (2*tf + iva)), 2))
