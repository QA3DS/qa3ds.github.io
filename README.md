# qa3ds.github.io

Sitio del grupo **QA3DS** (Química Aplicada al Ambiente, los Alimentos y el Desarrollo Sostenible, UTN FRTDF), publicado con GitHub Pages en <https://qa3ds.github.io/>.

Es un sitio estático: HTML y CSS sin dependencias ni paso de compilación. Para cambiarlo alcanza con editar un archivo y hacer *push*, y GitHub Pages lo publica en uno o dos minutos.

## Estructura

```
index.html              ← todo el contenido, organizado por secciones con comentarios <!-- ... -->
assets/css/styles.css   ← estilos (colores en :root)
assets/img/             ← imágenes optimizadas (.webp)
favicon.png
.nojekyll               ← evita que GitHub procese el sitio con Jekyll
```

## Tareas frecuentes

| Quiero… | Dónde |
|---|---|
| Actualizar el equipo | `index.html` → sección `<!-- EQUIPO -->` |
| Agregar una publicación | `index.html` → sección `<!-- DIFUSIÓN -->`, un `<li>` por ítem (el más reciente arriba) |
| Sumar un hito | `index.html` → sección `<!-- TRAYECTORIA -->` (`class="hl"` lo resalta en rojo) |
| Cambiar una cifra de resultados | `index.html` → sección `<!-- RESULTADOS -->` |
| Agregar una imagen | guardarla en `assets/img/` (idealmente .webp y de hasta ~1200 px de ancho) |

## Reglas de contenido

- **Las cifras de resultados salen de [`resultados_clave.md`](https://github.com/QA3DS/PID-Liofilizados/blob/main/resultados_clave.md) del repo del PID**, nunca de memoria. En particular, no presentar "36 h" como tiempo óptimo a secas: el rango práctico es 36–48 h, y la meseta con el dataset compilado aparece a las 48 h (congelado/ultracongelado) y a las 72 h (fresco).
- No publicar datos personales (DNI, teléfonos, correos personales) de integrantes.
- Una publicación se marca como "Publicado" recién cuando tiene DOI o enlace; mientras tanto, "Redactado" o "En preparación".

## Vista previa local

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

## Dominio propio (opcional)

Si se recupera un dominio (p. ej. el antiguo `qa3ds-frtdf.tech`), se agrega un archivo `CNAME` con el dominio y se configura el DNS según la [guía de GitHub Pages](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site).
