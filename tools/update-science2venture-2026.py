"""Actualiza Science2Venture 2026 desde el JSON institucional sin tocar otros programas."""

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\afcaballero\Downloads\Science2Venture_2026_28_iniciativas (1).json")
STARTUPS = ROOT / "data" / "startups.json"
PROGRAMS = ROOT / "data" / "programs2026.json"


def norm(value):
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", text)


science = json.loads(SOURCE.read_text(encoding="utf-8"))
startups = json.loads(STARTUPS.read_text(encoding="utf-8"))
programs = json.loads(PROGRAMS.read_text(encoding="utf-8"))
# Corrección editorial validada: SOMA no pertenece a la cohorte; Liminal sí.
startups = [item for item in startups if not (norm(item.get("nombre")) == "soma" and item.get("programas2026") == ["Science2Venture"])]
by_name = {norm(item.get("nombre")): item for item in startups}
updated = 0

for item in science["iniciativas"]:
    if norm(item["nombre"]) == "soma":
        continue
    record = by_name.get(norm(item["nombre"]))
    if record is None:
        raise RuntimeError(f"Iniciativa Science2Venture no vinculada: {item['nombre']}")
    record["descripcion"] = item["descripcion"].strip()
    record["vertical"] = item.get("categoria") or record.get("vertical")
    record["sector"] = item.get("sector_de_aplicacion") or record.get("sector")
    record["cohorte"] = "Science2Venture 2026 · Cohorte I"
    record["baseTec"] = True
    record["activo"] = True
    record["anios"] = sorted(set([str(x) for x in record.get("anios", [])] + ["2026"]))
    record["programas2026"] = list(dict.fromkeys(record.get("programas2026", []) + ["Science2Venture"]))
    amount = item.get("monto_financiacion_cop")
    record["science2venture2026"] = {
        "idFuente": item.get("id"),
        "trlValidado": item.get("trl_validado_unit"),
        "ventasReportadas": item.get("ventas_reportadas"),
        "financiacionAsignada": item.get("financiacion_asignada"),
        "montoFinanciacionCop": amount,
        "financiacionTexto": item.get("financiacion_texto") if amount else None,
        "prototipoReportado": item.get("prototipo_reportado") == "Sí",
        "clienteObjetivo": item.get("cliente_objetivo"),
        "objetivoPrograma": item.get("objetivo_en_science2venture"),
    }
    updated += 1

programs["science2venture"] = {
    "nombre": science["programa"]["nombre"],
    "descripcion": science["programa"]["descripcion"],
    "anio": 2026,
    "cifras": {
        "iniciativas": science["programa"]["iniciativas_activas"],
        "conPrototipo": science["programa"]["iniciativas_con_prototipo_reportado"],
        "conFinanciacion": science["programa"]["iniciativas_con_financiacion"],
    },
    "financiacion": science["financiacion"],
    "distribucion": [dict(item, iniciativas=item["iniciativas"] - (1 if item["categoria"] == "AI / software" else 0)) for item in science["distribucion_por_categoria"]],
    "fuentes": science["fuentes"],
}

STARTUPS.write_text(json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
PROGRAMS.write_text(json.dumps(programs, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"actualizadas": updated, "mvpFuncionales": science["programa"]["iniciativas_con_prototipo_reportado"], "conFinanciacion": science["programa"]["iniciativas_con_financiacion"], "financiacionTotalCop": science["programa"]["financiacion_total_cop"]}, ensure_ascii=False))
