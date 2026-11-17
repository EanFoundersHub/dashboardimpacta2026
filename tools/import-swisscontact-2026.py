import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\afcaballero\.codex\attachments\1b7efccc-1b69-450c-9d66-4cb13192d37e\Texto pegado.txt")

def norm(value):
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"\b(s\.?a\.?s\.?|sas|s\.?a\.?s\.?\s*bic|bic)\b", "", value)
    return re.sub(r"[^a-z0-9]+", "", value)

source = json.loads(SOURCE.read_text(encoding="utf-8-sig"))
startups_path = ROOT / "data" / "startups.json"
programs_path = ROOT / "data" / "programs2026.json"
startups = json.loads(startups_path.read_text(encoding="utf-8"))
programs = json.loads(programs_path.read_text(encoding="utf-8"))
index = {norm(s.get("nombre")): s for s in startups}
created = matched = 0

for company in source["empresas"]:
    ident = company.get("identificacion") or {}
    name = ident.get("nombre_comercial") or ident.get("razon_social")
    key = norm(name)
    record = index.get(key)
    if record is None:
        record = {"id": key[:48], "nombre": name}
        startups.append(record); index[key] = record; created += 1
    else:
        matched += 1
    record.setdefault("descripcion", (company.get("oferta") or {}).get("descripcion"))
    record.setdefault("sector", ident.get("sector"))
    record.setdefault("vertical", ident.get("sector"))
    record["activo"] = True
    record["anios"] = sorted(set([str(x) for x in record.get("anios", [])] + ["2026"]))
    record["programas2026"] = sorted(set(record.get("programas2026", []) + ["Swisscontact"]), key=str.lower)
    progress = company.get("avance_acompanamiento") or {}
    record["swisscontact2026"] = {
        "acompanamientoEfectivo": company.get("acompanamiento_efectivo") is True,
        "diagnosticoEstado": (progress.get("diagnostico") or {}).get("estado"),
        "diagnosticoPorcentaje": (progress.get("diagnostico") or {}).get("porcentaje"),
        "planAccionEstado": (progress.get("plan_accion") or {}).get("estado"),
        "dataRoomEstado": (progress.get("data_room") or {}).get("estado"),
        "indiceFinanciabilidad": (progress.get("preparacion_inversion") or {}).get("indice_financiabilidad"),
        "preparacionDeuda": (progress.get("preparacion_inversion") or {}).get("preparacion_deuda"),
        "preparacionEquity": (progress.get("preparacion_inversion") or {}).get("preparacion_equity"),
        "scoreIR": (progress.get("preparacion_inversion") or {}).get("score_ir"),
        "estadoComercial": (company.get("oferta") or {}).get("estado_comercial"),
        "objetivoPrograma": company.get("objetivo_programa"),
    }

summary = source["resumen_portafolio"]
programs["swisscontact"] = {
    "nombre": source["programa"]["nombre"],
    "nombreCorto": "Swisscontact",
    "descripcion": source["programa"]["descripcion"],
    "anio": 2026,
    "fechaCorte": source["programa"]["fecha_corte"],
    "cifras": {
        "iniciativas": summary["empresas_unicas"],
        "acompanamientoEfectivo": summary["acompanamiento_efectivo"]["cantidad"],
        "diagnosticosCompletos": next(x["cantidad"] for x in summary["diagnosticos_por_estado"] if x["estado"] == "completo"),
        "planesAccionDisponibles": next(x["cantidad"] for x in summary["planes_accion_por_estado"] if x["estado"] == "disponible"),
    },
    "sectores": summary["distribucion_sector"],
    "fuente": SOURCE.name,
    "notaPublicacion": "No se publican contactos, identificadores fiscales ni montos financieros."
}
programs.setdefault("importacion", {}).setdefault("creados", {})["Swisscontact"] = created
programs["importacion"].setdefault("actualizados", {})["Swisscontact"] = matched
startups_path.write_text(json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
programs_path.write_text(json.dumps(programs, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"total": len(startups), "swisscontact": len(source["empresas"]), "creados": created, "vinculados": matched}, ensure_ascii=False))
