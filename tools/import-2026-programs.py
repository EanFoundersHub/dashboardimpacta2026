"""Integra iniciativas 2026 de Science2Venture y Conecta al directorio público."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl


REPO = Path(__file__).resolve().parents[1]
DOWNLOADS = Path(r"C:\Users\afcaballero\Downloads")
S2V_PATH = DOWNLOADS / "Science2Venture_2026_28_iniciativas (1).json"
CONNECT_PATH = DOWNLOADS / "Iniciativas_Conecta_Descripciones_Editadas.xlsx"
FOUNDERS_PATH = DOWNLOADS / "Seguimiento_Asignación mentor (14) 1.xlsx"


def norm(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", text)


def slug(value: str) -> str:
    base = norm(value)
    return base or "iniciativa2026"


def add_program(record: dict, program: str) -> None:
    record["anios"] = sorted(set([*(record.get("anios") or []), "2026"]))
    record["programas2026"] = list(dict.fromkeys([*(record.get("programas2026") or []), program]))
    record["activo"] = True


def main() -> None:
    startups_path = REPO / "data" / "startups.json"
    startups = json.loads(startups_path.read_text(encoding="utf-8"))
    by_name = {norm(item["nombre"]): item for item in startups}
    used_ids = {item["id"] for item in startups}
    created = {"Science2Venture": 0, "Conecta": 0, "FoundersHub": 0}
    updated = {"Science2Venture": 0, "Conecta": 0, "FoundersHub": 0}

    science = json.loads(S2V_PATH.read_text(encoding="utf-8"))
    for item in science["iniciativas"]:
        if norm(item["nombre"]) == "soma":
            continue
        key = norm(item["nombre"])
        record = by_name.get(key)
        if record is None:
            record_id = slug(item["nombre"])
            suffix = 2
            while record_id in used_ids:
                record_id = f"{slug(item['nombre'])}{suffix}"
                suffix += 1
            record = {"id": record_id, "nombre": item["nombre"]}
            startups.append(record)
            by_name[key] = record
            used_ids.add(record_id)
            created["Science2Venture"] += 1
        else:
            updated["Science2Venture"] += 1
        record["descripcion"] = item["descripcion"].strip()
        record["vertical"] = item.get("categoria") or record.get("vertical")
        record["sector"] = item.get("sector_de_aplicacion") or record.get("sector")
        record["cohorte"] = "Science2Venture 2026 · Cohorte I"
        record["baseTec"] = True
        add_program(record, "Science2Venture")
        record["science2venture2026"] = {
            "idFuente": item.get("id"),
            "trlValidado": item.get("trl_validado_unit"),
            "ventasReportadas": item.get("ventas_reportadas"),
            "financiacionAsignada": item.get("financiacion_asignada"),
            "montoFinanciacionCop": item.get("monto_financiacion_cop"),
            "financiacionTexto": item.get("financiacion_texto") if item.get("monto_financiacion_cop") else None,
            "prototipoReportado": item.get("prototipo_reportado") == "Sí",
            "clienteObjetivo": item.get("cliente_objetivo"),
            "objetivoPrograma": item.get("objetivo_en_science2venture"),
        }

    workbook = openpyxl.load_workbook(CONNECT_PATH, read_only=True, data_only=True)
    rows = list(workbook.active.iter_rows(values_only=True))
    headers = [str(value or "").strip() for value in rows[0]]
    for values in rows[1:]:
        row = dict(zip(headers, values))
        name = str(row.get("NOMBRE PROYECTO") or "").strip()
        if not name:
            continue
        key = norm(name)
        record = by_name.get(key)
        if record is None:
            record_id = slug(name)
            suffix = 2
            while record_id in used_ids:
                record_id = f"{slug(name)}{suffix}"
                suffix += 1
            record = {"id": record_id, "nombre": name}
            startups.append(record)
            by_name[key] = record
            used_ids.add(record_id)
            created["Conecta"] += 1
        else:
            updated["Conecta"] += 1
        description = str(row.get("DESCRIPCION") or "").strip()
        sector = str(row.get("SECTOR / VERTICAL") or "").strip()
        if description:
            record["descripcion"] = description
        if sector:
            record["sector"] = sector
            record["vertical"] = sector
        record["cohorte"] = "Conecta 2026 · Bridge for Billions"
        add_program(record, "Conecta - Bridge for Billions")

    founders_book = openpyxl.load_workbook(FOUNDERS_PATH, read_only=True, data_only=True)
    founders_rows = list(founders_book["Base Datos"].iter_rows(values_only=True))
    founders_headers = [str(value or "").strip() for value in founders_rows[0]]
    for values in founders_rows[1:]:
        row = dict(zip(founders_headers, values))
        name = str(row.get("Emprendimiento") or "").strip()
        if not name:
            continue
        key = norm(name)
        record = by_name.get(key)
        if record is None:
            record_id = slug(name)
            suffix = 2
            while record_id in used_ids:
                record_id = f"{slug(name)}{suffix}"
                suffix += 1
            record = {"id": record_id, "nombre": name}
            startups.append(record)
            by_name[key] = record
            used_ids.add(record_id)
            created["FoundersHub"] += 1
        else:
            updated["FoundersHub"] += 1
        description = str(row.get("Descripción") or "").strip()
        category = str(row.get("Categoría") or "").strip()
        stage = str(row.get("¿En qué etapa se encuentra la iniciativa o empresa?") or "").strip()
        if description:
            record["descripcion"] = description
        if category:
            category = {"tradicional": "Tradicional", "digital": "Digitales"}.get(category.lower(), category)
            record["vertical"] = category
            record["sector"] = category
        record["cohorte"] = "FoundersHub 2026"
        add_program(record, "FoundersHub")
        founder = str(row.get("Emprendedor") or "").strip()
        role = str(row.get("Rol") or "").strip()
        if founder and not record.get("equipo"):
            record["equipo"] = [{"nombre": founder, "rol": role}]
        sales = row.get("Ventas promedio mensuales")
        sells = isinstance(sales, (int, float)) and sales > 0
        record["foundersHub2026"] = {
            "etapa": stage or None,
            "categoria": category or None,
            "tipoOferta": str(row.get("Columna1") or "").strip() or None,
            "generaIngresos": sells,
            "vinculoEan": role or None,
        }

    startups_path.write_text(json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    program_data = {
        "science2venture": {
            "nombre": science["programa"]["nombre"],
            "descripcion": science["programa"]["descripcion"],
            "anio": 2026,
            "cifras": {
                "iniciativas": science["programa"]["iniciativas_activas"],
                "conPrototipo": science["programa"]["iniciativas_con_prototipo_reportado"],
                "conFinanciacion": science["programa"]["iniciativas_con_financiacion"],
            },
            "distribucion": science["distribucion_por_categoria"],
            "fuentes": science["fuentes"],
        },
        "conecta": {
            "nombre": "Conecta - Bridge for Billions",
            "descripcion": "Reúne las iniciativas acompañadas durante 2026 por el Programa Conecta - Bridge for Billions.",
            "anio": 2026,
            "cifras": {"iniciativas": sum(1 for item in startups if "Conecta - Bridge for Billions" in item.get("programas2026", []))},
            "fuente": CONNECT_PATH.name,
        },
        "foundershub": {
            "nombre": "FoundersHub",
            "descripcion": "FoundersHub reúne las iniciativas que recibieron diagnóstico y acompañamiento de mentoría durante 2026.",
            "anio": 2026,
            "cifras": {
                "iniciativas": sum(1 for item in startups if "FoundersHub" in item.get("programas2026", [])),
                "generanIngresos": sum(1 for item in startups if item.get("foundersHub2026", {}).get("generaIngresos")),
                "baseTecnologicaODigital": sum(1 for item in startups if item.get("foundersHub2026", {}).get("categoria") in {"Tech", "Digitales", "Innovación"}),
            },
            "fuente": FOUNDERS_PATH.name,
        },
        "importacion": {"creados": created, "actualizados": updated},
    }
    (REPO / "data" / "programs2026.json").write_text(json.dumps(program_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total_directorio": len(startups), **program_data["importacion"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
