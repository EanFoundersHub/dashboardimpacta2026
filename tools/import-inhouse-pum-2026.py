import json, re, unicodedata, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = Path(r"C:\Users\afcaballero\Downloads\dashboard_prototipos_2026_actualizado 2 (1).html")
PUM = Path(r"C:\Users\afcaballero\Downloads\PUM - Founders Hub convocatoria (1-33).xlsx")
STARTUPS = ROOT / "data" / "startups.json"
PROGRAMS = ROOT / "data" / "programs2026.json"
NS = {"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main","r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

def norm(value):
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", value)

def rows_from_xlsx(path):
    with zipfile.ZipFile(path) as z:
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            strings = ["".join(t.text or "" for t in node.findall(".//m:t", NS)) for node in root.findall("m:si", NS)]
        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        relmap = {x.attrib["Id"]: x.attrib["Target"] for x in rels}
        sheet = next(iter(workbook.find("m:sheets", NS)))
        target = relmap[sheet.attrib["{" + NS["r"] + "}id"]]
        target = target if target.startswith("xl/") else "xl/" + target.lstrip("/")
        xml = ET.fromstring(z.read(target))
        output = []
        for row in xml.findall(".//m:sheetData/m:row", NS):
            record = {}
            for cell in row.findall("m:c", NS):
                column = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                value = cell.find("m:v", NS)
                inline = cell.find("m:is", NS)
                if cell.attrib.get("t") == "s" and value is not None:
                    text = strings[int(value.text)]
                elif cell.attrib.get("t") == "inlineStr" and inline is not None:
                    text = "".join(t.text or "" for t in inline.findall(".//m:t", NS))
                else:
                    text = value.text if value is not None else ""
                record[column] = (text or "").strip()
            output.append(record)
        return output[1:]

def faculty(row):
    program = " ".join(row.get(k, "") for k in ("BC", "BI", "BF", "BL")).lower()
    if any(x in program for x in ("ingenier", "ciencias de datos")):
        return "Facultad de Ingeniería"
    if "lenguas modernas" in program:
        return "Facultad de Humanidades y Ciencias Sociales"
    if any(x in program for x in ("administra", "mercadeo", "negocios", "cadena de abastecimiento", "gerencia de proyectos")):
        return "Facultad de Administración, Finanzas y Ciencias Económicas"
    return "Programa no especificado"

def sales(value):
    raw = (value or "").strip().lower()
    if not raw or raw in {"na", "n/a"} or not re.search(r"\d", raw):
        return None
    digits = re.sub(r"[^0-9]", "", raw)
    if not digits:
        return None
    amount = int(digits)
    if "millon" in raw and amount < 1_000_000:
        amount *= 1_000_000
    return amount

startups = json.loads(STARTUPS.read_text(encoding="utf-8"))
programs = json.loads(PROGRAMS.read_text(encoding="utf-8"))
by_name = {norm(s.get("nombre")): s for s in startups}

html = HTML.read_text(encoding="utf-8", errors="ignore")
match = re.search(r"const prototypes = (\[[\s\S]*?\]);\s*const modal", html)
if not match:
    raise RuntimeError("No se encontró el arreglo prototypes en el HTML")
prototypes = [p for p in json.loads(match.group(1)) if p.get("process") == "Impacta in House"]

for p in prototypes:
    name = (p.get("name") or "").strip()
    if not name:
        continue
    item = by_name.get(norm(name))
    if item is None:
        base = norm(name) or "iniciativa"
        used = {s["id"] for s in startups}
        identifier = base
        n = 2
        while identifier in used:
            identifier = f"{base}{n}"; n += 1
        item = {"id": identifier, "nombre": name}
        startups.append(item); by_name[norm(name)] = item
    if p.get("description"):
        item["descripcion"] = p["description"].strip()
    item["activo"] = True
    item["anios"] = sorted(set([str(x) for x in item.get("anios", [])] + ["2026"]))
    phases = [x for x in item.get("fases", []) if x != "Impacta InHouse"]
    line = (p.get("line") or "").lower()
    unit = (p.get("unit") or "").strip().lower()
    if "minor" in line:
        phase = "Minor"
    elif "articulaci" in line:
        phase = "Articulación Academia"
    elif unit == "sandbox":
        phase = "Sandbox"
    else:
        phase = "Sandbox Emprendedores"
    item["fases"] = sorted(set(phases + [phase]))
    item["programas2026"] = sorted(set(item.get("programas2026", []) + ["Impacta InHouse"]))
    item["sector"] = item.get("sector") or p.get("classification")
    item["vertical"] = item.get("vertical") or p.get("line")
    item["impactaInHouse2026"] = {
        "ciclo": p.get("cycle"), "unidad": p.get("unit"), "linea": p.get("line"),
        "clasificacion": p.get("classification"), "prototipoConImagen": bool(p.get("has_proto_img"))
    }

programs["impacta-inhouse"] = {
    "nombre":"Impacta InHouse", "descripcion":"Programa 2026 que articula mentorías y acompañamiento con unidades académicas para desarrollar iniciativas y prototipos.",
    "anio":2026,
    "cifras":{"iniciativas":318,"digitales":128,"fisicos":127,"hibridos":36,"servicios":26},
    "ciclos":[{"ciclo":"Ciclo 1","iniciativas":57},{"ciclo":"Ciclo 2","iniciativas":136},{"ciclo":"Ciclo 3","iniciativas":125}],
    "alcanceAcademico":{"estudiantesReportados":1977,"docentesReportados":34,"mentoresYEspaciosReportados":91},
    "fuentes":["dashboard_prototipos_2026_actualizado 2 (1).html","Cuadro Maestro Descubre.xlsx"]
}

pum_rows = rows_from_xlsx(PUM)
unique = {}
for row in pum_rows:
    if row.get("BU"):
        unique.setdefault(norm(row["BU"]), row)
sales_total = 0
for row in unique.values():
    name = row["BU"].strip()
    item = by_name.get(norm(name))
    if item is None:
        base = norm(name) or "iniciativa"
        used = {s["id"] for s in startups}; identifier = base; n = 2
        while identifier in used:
            identifier = f"{base}{n}"; n += 1
        item = {"id":identifier,"nombre":name}; startups.append(item); by_name[norm(name)] = item
    if row.get("CG"):
        item["descripcion"] = row["CG"].strip()
    item["activo"] = True
    item["anios"] = sorted(set([str(x) for x in item.get("anios", [])] + ["2026"]))
    item["programas2026"] = sorted(set(item.get("programas2026", []) + ["PUM"]))
    item["ubicacion"] = item.get("ubicacion") or ", ".join(x for x in (row.get("CA"), row.get("BX")) if x)
    item["sector"] = item.get("sector") or row.get("CJ")
    amount = sales(row.get("CV")); sales_total += amount or 0
    item["pum2026"] = {"facultad":faculty(row),"programaAcademico":row.get("BC") or row.get("BI") or row.get("BF") or row.get("BL"),"ventas2025Cop":amount,"reto":row.get("DB") or None,"conocimientoRequerido":row.get("DE") or None}

programs["pum"] = {
    "nombre":"PUM", "descripcion":"Mentorías internacionales para fortalecer retos comerciales, operativos y de crecimiento de iniciativas vinculadas a la comunidad Eanista.", "anio":2026,
    "cifras":{"iniciativas":32,"ventasDeclaradasCop":sales_total,"facultades":3,"retos":32},
    "facultades":[{"facultad":"Facultad de Administración, Finanzas y Ciencias Económicas","iniciativas":19},{"facultad":"Facultad de Ingeniería","iniciativas":5},{"facultad":"Facultad de Humanidades y Ciencias Sociales","iniciativas":4},{"facultad":"Programa no especificado","iniciativas":4}],
    "fuente":"PUM - Founders Hub convocatoria (1-33).xlsx", "nota":"33 respuestas consolidadas en 32 iniciativas únicas. No se publican datos personales."
}

# Ajuste validado de clasificación: Solar+Tech + Financing pertenece a Impacta InHouse como fase.
rocasol = by_name.get(norm("Rocasol"))
if rocasol:
    rocasol["anios"] = sorted(set([str(x) for x in rocasol.get("anios", [])] + ["2026"]))
    rocasol["programas2026"] = sorted(set(rocasol.get("programas2026", []) + ["Impacta InHouse"]))
    rocasol["fases"] = sorted(set([x for x in rocasol.get("fases", []) if x != "Fondo Impacta"] + ["Solar+Tech + Financing"]))
    if (rocasol.get("vertical") or "").lower().startswith("solartech"):
        rocasol.pop("vertical", None)

STARTUPS.write_text(json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
PROGRAMS.write_text(json.dumps(programs, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"impactaInHouse":len(prototypes),"pum":len(unique),"ventasPum2025Cop":sales_total,"startupsTotal":len(startups)}, ensure_ascii=False))
