"""Inventory Canva PDF links and make proof sheets for pending portraits."""
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import pymupdf

pdf = pymupdf.open(sys.argv[1])
output = Path(sys.argv[2])
output.mkdir(exist_ok=True)
startups = json.loads(Path("data/startups.json").read_text(encoding="utf-8"))
links = {}
candidates = []
for startup in startups:
    source = startup.get("mediaFuente")
    if not source:
        continue
    page = pdf[int(source["pagina"]) - 1]
    links[startup["id"]] = list(dict.fromkeys(
        link["uri"] for link in page.get_links() if link.get("uri")
    ))
    if not startup.get("fotoPendiente"):
        continue
    candidates.append((startup["id"], 0, page.get_pixmap(matrix=pymupdf.Matrix(.22, .22))))
    for image in page.get_image_info(xrefs=True):
        xref = image["xref"]
        x0, y0, x1, y1 = image["bbox"]
        if not xref or x0 > page.rect.width * .5 or y0 > page.rect.height * .65:
            continue
        if image["width"] < 380 or image["height"] < 380 or x1-x0 > page.rect.width * .95:
            continue
        pix = pymupdf.Pixmap(pdf, xref)
        if pix.colorspace and pix.colorspace.n > 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        while max(pix.width, pix.height) > 380:
            pix.shrink(1)
        candidates.append((startup["id"], xref, pix))

(output / "links.json").write_text(json.dumps(links, indent=2), encoding="utf-8")
for offset in range(0, len(candidates), 24):
    sheet = pymupdf.open()
    page = sheet.new_page(width=1000, height=960)
    for i, (name, xref, pix) in enumerate(candidates[offset:offset+24]):
        x, y = i % 4 * 250, i // 4 * 160
        page.insert_text((x+5, y+13), f"{name[:31]} {xref}", fontsize=9)
        page.insert_image(pymupdf.Rect(x+4, y+18, x+246, y+157), pixmap=pix)
    page.get_pixmap().save(output / f"sheet-{offset//24}.png")

if len(sys.argv) == 4:
    # Each embedded image was compared visually with its Canva page.
    portraits = dict(
        ambardesign=6713, ancestraliagcosmeticanatural=5803, imail=7898,
        bionaturalsolutionsbns=5407, bisvita=8622, cannabissalud=9100,
        circool=13207, circula=6902, cityhuertas=7931, clevermarket=8984,
        communitylab=7100, deicompanyhannu=8450, demetria=5479, disruptia=8479,
        ecolairesp=13341, fincasguilius=6009, garantto=13409,
        hwestrellaabonosorganicos=5554, lahuertahotel=9365,
        molinillitopalitodeazucarypanela=6236, musadeltropico=6292,
        neosiqenergy=8196, nunalabs=6308, ocelote=8046, onetotree=8368,
        paguro=7530, proyectocrudo=7594, siembravertical=5689, sumasacha=6533,
        torna=7809, twoglass=7030, verdemontana=6560, xiclo=13585,
    )
    teams = {"cityhuertas", "clevermarket", "neosiqenergy"}
    tracking = {"igsh", "igshid", "fbclid", "srsltid", "originalSubdomain"}
    networks = {"instagram.com": "Instagram", "linkedin.com": "LinkedIn",
                "facebook.com": "Facebook", "tiktok.com": "TikTok"}
    for startup in startups:
        key = startup["id"]
        if key not in links:
            continue
        verified = {}
        for raw in links[key]:
            url = urlsplit(raw)
            host = url.hostname or ""
            if url.scheme not in {"http", "https"} or not host or url.username:
                continue
            if host.endswith("universidadean.edu.co"):
                continue
            if key != "hydraecohomeia" and "hydraecohomeia" in raw.lower():
                continue
            path = re.sub(r"/overlay/about-this-profile/?$", "/", url.path)
            path = re.sub(r"/%20/?$", "/", path)
            query = urlencode([(k, v) for k, v in parse_qsl(url.query)
                               if k not in tracking and not k.startswith("utm_")])
            href = urlunsplit((url.scheme, url.netloc, path or "/", query, url.fragment))
            label = next((label for domain, label in networks.items()
                          if host == domain or host.endswith("." + domain)), "Sitio web")
            if label == "LinkedIn" and path.startswith("/in/"):
                label = "LinkedIn del equipo"
            verified[href] = {"nombre": label, "url": href}
        if verified:
            startup["enlacesCanva"] = list(verified.values())
        if key not in portraits or not startup.get("fotoPendiente"):
            continue
        source_page = str(startup["mediaFuente"]["pagina"])
        xref = portraits[key]
        assert xref in {info["xref"] for info in pdf[int(source_page)-1].get_image_info(xrefs=True)}
        pix = pymupdf.Pixmap(pdf, xref)
        if pix.colorspace and pix.colorspace.n > 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        original = output / f"{key}.png"
        pix.save(original)
        target = Path("assets/startups") / key / "retrato-canva.webp"
        subprocess.run([sys.argv[3], "-v", "error", "-y", "-i", str(original),
                        "-vf", "scale=min(1200\\,iw):-2", "-c:v", "libwebp",
                        "-quality", "88", str(target)], check=True)
        if key in teams:
            startup["fotoEquipo"] = target.as_posix()
        else:
            startup["foto"] = target.as_posix()
            if len(startup.get("equipo", [])) == 1:
                startup["equipo"][0]["foto"] = target.as_posix()
        startup["mediaFuente"]["fotoXrefPDF"] = xref
        startup.pop("fotoPendiente", None)
        startup.pop("mediaObservacion", None)
    Path("data/startups.json").write_text(
        json.dumps(startups, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
