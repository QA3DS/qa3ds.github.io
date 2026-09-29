"""Genera proceso/liofilizacion-sin-conexion.html: la página de presentación en un
único archivo (CSS, JS y logo embebidos) para proyectar sin internet.
Volver a correrlo cada vez que cambie proceso/index.html, styles.css o liofilizacion.js:

    python3 tools/build_offline.py
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://qa3ds.github.io/"

html = (ROOT / "proceso/index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
js = (ROOT / "assets/js/liofilizacion.js").read_text(encoding="utf-8")
logo = base64.b64encode((ROOT / "assets/img/logo-qa3ds.webp").read_bytes()).decode()
fav = base64.b64encode((ROOT / "favicon.png").read_bytes()).decode()

def swap(s, old, new):
    assert old in s, f"no encontrado: {old[:60]}"
    return s.replace(old, new)

html = swap(html, '<link rel="stylesheet" href="../assets/css/styles.css">', f"<style>\n{css}\n</style>")
html = swap(html, '<script src="../assets/js/liofilizacion.js" defer></script>', f"<script>\n{js}\n</script>")
html = swap(html, 'src="../assets/img/logo-qa3ds.webp"', f'src="data:image/webp;base64,{logo}"')
html = swap(html, 'href="../favicon.png"', f'href="data:image/png;base64,{fav}"')
html = swap(html, '\n    <span><a href="liofilizacion-sin-conexion.html" download>Descargar versión sin conexión</a></span>', "")
html = html.replace('href="../#proyecto"', f'href="{SITE}#proyecto"').replace('href="../"', f'href="{SITE}"')
# El script inline se ejecuta antes que el DOM de abajo: moverlo al final ya está hecho (va antes de </body>).
(ROOT / "proceso/liofilizacion-sin-conexion.html").write_text(html, encoding="utf-8")
print("OK", len(html) // 1024, "KB")
