"""Vincula los recursos extraidos de Canva con el directorio publico.

Los originales permanecen intactos en Ean Startup Report. Para GitHub Pages se
generan derivados WebP adecuados para pantalla y se enriquecen startups.json.
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
import unicodedata
from pathlib import Path


REPORT = Path(r"C:\Users\afcaballero\OneDrive - universidadean.edu.co\Documentos\ChatGPT\Champions IA\Ean Startup Report")
REPO = Path(r"C:\Users\afcaballero\OneDrive - universidadean.edu.co\Documentos\ChatGPT\Dashboard 2026 Impacta\dashboardimpacta2026-publish")
FFMPEG = Path(r"C:\Users\afcaballero\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe")

ALIASES = {
    "Agroservicios Integrales Antioquia": "agroserviciosintegralesantioquiaamaychoc",
    "Craton": "academiaruralparalaamazoniacraton",
}

# Composiciones de Canva o fichas con texto/datos de contacto incrustados. No
# deben publicarse como fotografías; se espera un original limpio.
BLOCKED_CAPTURE_IDS = {
    "bisvita",
    "circula",
    "deicompanyhannu",
    "demetria",
    "deterquinecopacs",
}


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode().lower()
    value = re.sub(r"\b(sas|s a s|bic|sa|esp|zomac|fundacion|corporacion|empresa)\b", " ", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def media_file(folder: Path, kind: str) -> Path:
    files = sorted((folder / kind).glob("*"))
    if len(files) != 1:
        raise RuntimeError(f"Se esperaba un archivo en {folder / kind}; se encontraron {len(files)}")
    return files[0]


def webp(source: Path, target: Path, max_width: int, quality: int) -> None:
    if target.exists() and target.stat().st_size:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    command = [
        str(FFMPEG), "-loglevel", "error", "-y", "-i", str(source),
        "-vf", f"scale='min({max_width},iw)':-2:force_original_aspect_ratio=decrease",
        "-c:v", "libwebp", "-quality", str(quality), "-compression_level", "3", str(target),
    ]
    subprocess.run(command, check=True)


def main() -> None:
    startups_path = REPO / "data" / "startups.json"
    startups = json.loads(startups_path.read_text(encoding="utf-8"))
    by_norm = {norm(item["nombre"]): item for item in startups}
    by_id = {item["id"]: item for item in startups}
    rows = list(csv.DictReader((REPORT / "indice_perfiles.csv").open(encoding="utf-8-sig")))

    linked = []
    for row in rows:
        name = row["emprendimiento"]
        alias_id = ALIASES.get(name)
        if norm(name) in {"craton", "cratn"}:
            alias_id = "academiaruralparalaamazoniacraton"
        startup = by_id.get(alias_id or "") or by_norm.get(norm(name))
        if not startup:
            raise RuntimeError(f"Sin correspondencia segura: {name}")

        folder = REPORT / row["carpeta"]
        logo_source = media_file(folder, "logos")
        photo_source = media_file(folder, "fotos")
        destination = REPO / "assets" / "startups" / startup["id"]
        logo_target = destination / "logo.webp"
        photo_target = destination / "foto.webp"
        webp(logo_source, logo_target, 480, 88)

        startup["logo"] = f"assets/startups/{startup['id']}/logo.webp"
        photo_url = f"assets/startups/{startup['id']}/foto.webp"
        photo_name = photo_source.stem.lower()
        is_pending = photo_name.startswith("pendiente")
        is_generic = any(token in photo_name for token in ("foto_equipo", "contacto", "co_founder", "n_pagina"))
        if startup["id"] in BLOCKED_CAPTURE_IDS:
            startup.pop("foto", None)
            startup.pop("fotoEquipo", None)
            startup.pop("equipo", None)
            startup["fotoPendiente"] = True
            startup["mediaObservacion"] = "La imagen disponible es una composición de Canva; se requiere fotografía original limpia."
        elif is_pending:
            startup["fotoPendiente"] = True
        else:
            webp(photo_source, photo_target, 1200, 84)
            if is_generic:
                startup["fotoEquipo"] = photo_url
            else:
                startup["foto"] = photo_url
                person = row.get("persona", "").strip()
                if person:
                    startup["equipo"] = [{"nombre": person, "rol": row.get("rol", "").strip(), "foto": photo_url}]

        startup["mediaFuente"] = {
            "canva": "https://www.canva.com/design/DAG33uQ07js/dK79rC-Tx2ZhdnIm0yk9Bg/edit",
            "pagina": row["paginas"],
            "logoOriginal": f"{row['carpeta']}/logos/{logo_source.name}",
            "fotoOriginal": f"{row['carpeta']}/fotos/{photo_source.name}",
        }
        linked.append(startup["id"])

    startups_path.write_text(json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"perfiles_vinculados": len(linked), "ids": linked}, ensure_ascii=False))


if __name__ == "__main__":
    main()
