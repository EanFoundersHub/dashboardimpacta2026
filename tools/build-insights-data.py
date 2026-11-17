import json, re, sys, unicodedata
from pathlib import Path
import pandas as pd

survey_path, directory_path, output_path = map(Path, sys.argv[1:4])
survey = pd.read_excel(survey_path)
directory = pd.read_excel(directory_path, sheet_name="Directorio Consolidado")
survey = survey[survey["Nombre empresa/emprendimiento"].notna()].copy()

def plain(value):
    if pd.isna(value): return ""
    return re.sub(r"\s+", " ", str(value)).strip()

def key(value):
    text = unicodedata.normalize("NFKD", plain(value)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", text)

def col(frame, phrase):
    return next(c for c in frame.columns if phrase.lower() in str(c).lower())

survey["_key"] = survey["Nombre empresa/emprendimiento"].map(key)
survey["_time"] = pd.to_datetime(survey["Hora de finalización"], errors="coerce")
survey = survey.sort_values("_time").drop_duplicates("_key", keep="last")

fields = {
    "name": "Nombre empresa/emprendimiento",
    "cohort": col(survey, "Cohorte"),
    "phase": col(survey, "fase del programa"),
    "sector": col(survey, "Sub-sector"),
    "vertical": col(survey, "Vertical de sostenibilidad"),
    "newProductFlag": col(survey, "nuevo producto o servicio desde"),
    "newProduct": col(survey, "Cuál es el nuevo producto"),
    "technology": col(survey, "tecnologías emergentes"),
    "ipFlag": col(survey, "activos de propiedad intelectual"),
    "ipType": col(survey, "Especifique el tipo"),
    "certification": col(survey, "Cuentan con alguna certificación"),
    "certificationName": col(survey, "Nombre las certificaciones"),
    "exportFlag": col(survey, "Han exportado"),
    "exportRegion": col(survey, "A qué región ha exportado"),
    "internationalPlan": col(survey, "planes de exportación"),
    "seekingInvestment": col(survey, "Están buscando inversión"),
    "raisedInvestment": col(survey, "Han levantado inversión"),
    "grant": col(survey, "beneficiario de recursos no reembolsables"),
    "award": col(survey, "ganado premios"),
    "awardName": col(survey, "Mencione cuáles premios"),
}

def yes(value): return plain(value).lower() in {"si", "sí"}
def positive(value):
    text = plain(value)
    return "" if text.lower() in {"", "no", "ninguna", "n/a", "na"} else text.rstrip(";")
def record(row, detail="", type_value=""):
    return {k: v for k, v in {
        "name": plain(row[fields["name"]]), "cohort": plain(row[fields["cohort"]]),
        "phase": plain(row[fields["phase"]]).replace(" (Incubación)", "").replace(" (Aceleración)", "").replace(";", " · ").strip(" ·"),
        "sector": plain(row[fields["sector"]]), "vertical": plain(row[fields["vertical"]]),
        "detail": positive(detail), "type": positive(type_value)
    }.items() if v}

definitions = [
    ("new-products", "Nuevos productos y servicios", "Desarrollaron un nuevo producto o servicio después de su participación en Impacta.", "newProductFlag", "newProduct", ""),
    ("technology", "Tecnologías emergentes", "Integraron tecnologías emergentes en sus productos, servicios o procesos.", "technology", "", "technology"),
    ("intellectual-property", "Propiedad intelectual", "Declararon activos de propiedad intelectual.", "ipFlag", "", "ipType"),
    ("certifications", "Certificaciones", "Reportaron certificaciones de sostenibilidad, ambiente, calidad o cumplimiento sectorial.", "certification", "certificationName", "certification"),
    ("international-markets", "Mercados internacionales", "Exportaron productos o prestaron servicios internacionalmente.", "exportFlag", "exportRegion", ""),
    ("international-plans", "Proyección internacional", "Proyectan alcanzar mercados internacionales durante los próximos cinco años.", "internationalPlan", "", ""),
    ("seeking-investment", "Búsqueda de inversión", "Actualmente buscan inversión para fortalecer su crecimiento.", "seekingInvestment", "", ""),
    ("raised-investment", "Inversión levantada", "Declararon haber levantado inversión.", "raisedInvestment", "", ""),
    ("grants", "Recursos no reembolsables", "Declararon haber recibido recursos no reembolsables.", "grant", "", ""),
    ("awards", "Premios y reconocimientos", "Obtuvieron premios o reconocimientos.", "award", "awardName", ""),
]

insights=[]
for insight_id, title, description, flag, detail, type_field in definitions:
    rows=[]
    for _, row in survey.iterrows():
        value=row[fields[flag]]
        include = yes(value) if flag not in {"technology", "certification"} else bool(positive(value))
        if include:
            rows.append(record(row, row[fields[detail]] if detail else "", row[fields[type_field]] if type_field else ""))
    insights.append({"id":insight_id,"title":title,"description":description,"count":len(rows),"percentage":round(len(rows)/len(survey)*100,1),"denominator":len(survey),"records":rows})

# Leadership uses the complete Construye–Crece directory, not the survey.
core = directory[directory["Fase"].fillna("").astype(str).str.strip().isin(["Construye", "Crece"])].copy()
core["_key"] = core["Nombre de la empresa"].map(key)
leaders=[]
for _, group in core.groupby("_key", sort=False):
    values={plain(v).lower() for v in group["¿Tiene mujer en liderazgo?"]}
    if values & {"si", "sí"}:
        row=group.iloc[-1]
        leaders.append({k:v for k,v in {"name":plain(row["Nombre de la empresa"]),"cohort":plain(row["Año de participación"]),"phase":plain(row["Fase"]),"sector":plain(row["Sector económico"]),"vertical":plain(row["Vertical de sostenibilidad"])}.items() if v})
insights.append({"id":"women-leadership","title":"Liderazgo femenino","description":"Cuentan con mujeres en posiciones de liderazgo.","count":len(leaders),"percentage":round(len(leaders)/core["_key"].nunique()*100,1),"denominator":int(core["_key"].nunique()),"records":leaders})

payload={"generated":"2026-11-17","surveyUnique":len(survey),"coreDirectoryUnique":int(core["_key"].nunique()),"insights":insights}
output_path.write_text("window.IMPACTA_INSIGHTS="+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
