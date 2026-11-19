El archivo es un repositorio público: cada ficha es un archivo de texto y
cualquiera puede proponer cambios. No hace falta saber programar.

## Qué se puede aportar

- **Una fotografía** de un equipo en servicio, sobre todo si es antigua.
- **Un dato o una corrección**: un año, una estación, un fabricante, un error.
- **Una fuente**: un artículo de revista, un catálogo, un manual.
- **Un equipo nuevo**, aunque solo sepas que existió. Un esbozo con un nombre,
  una fotografía y dos líneas ya es útil.
- **Una réplica**, si programas.

En [Por documentar](../pendientes/) hay equipos de los que se sabe algo pero
todavía no tienen ficha, cada uno con lo que le falta.

## La forma más sencilla: abrir una incidencia

Los formularios de GitHub preguntan lo necesario en cada caso:

- [Proponer un teleindicador](https://github.com/oierlauzi/destinoteca/issues/new?template=proponer-teleindicador.yml)
- [Aportar una fotografía](https://github.com/oierlauzi/destinoteca/issues/new?template=aportar-fotografia.yml)
- [Corregir un dato](https://github.com/oierlauzi/destinoteca/issues/new?template=corregir-dato.yml)

## Escribir al mantenedor

Si prefieres no usar GitHub, escribe por correo a
[olauzirika@gmail.com](mailto:olauzirika@gmail.com) o por mensaje a
`oierlauzi` en Instagram, X o Bluesky. Basta con contar lo que sabes y
adjuntar las fotografías, con su autor y de dónde salen.

## Editar directamente

Al pie de cada ficha hay un enlace «Editar esta página» que abre su archivo en
GitHub. Al guardar, GitHub crea una propuesta de cambio que se revisa antes de
publicarse.

Cada ficha vive en su propia carpeta, `src/content/models/<id>/`, con un
archivo `index.md` y sus fotografías al lado. La cabecera del archivo contiene
los datos estructurados (tipo, tecnología, fabricantes, años, fotografías,
fuentes) y el resto es el artículo, escrito en Markdown.

## Reglas del archivo

**Una ficha por diseño.** Un tamaño de matriz o una caja distintos son una
ficha nueva dentro de la misma familia. Un cambio de rotulación, de montaje o
de color es una variante dentro de la ficha.

**Identificadores permanentes.** El identificador de una ficha es
`fabricante-modelo`, en minúsculas y con guiones, y no cambia nunca: es su
dirección. Si el fabricante no se conoce, se usa un nombre descriptivo.

**Esbozos y artículos.** Una ficha nueva empieza como esbozo y solo necesita
nombre, tipo, tecnología, medio de transporte, país y un resumen. Para pasar a
artículo debe tener además fabricante (o constar como desconocido), año de
inicio, operador, al menos una fuente y al menos una fotografía.

**Solo lo que se puede sostener.** Cada dato debería poder rastrearse hasta
una fuente o una fotografía. Si algo es una suposición, se dice que lo es; si
no se sabe, se deja en blanco.

## Fotografías

Toda fotografía necesita:

- un **texto alternativo** que describa lo que se ve,
- su **autor**,
- su **licencia**,
- y, si no es tuya, **de dónde sale** (un enlace o una cita).

Si la fotografía es tuya, al aportarla aceptas publicarla bajo una licencia
libre, por defecto CC BY-SA 4.0. Si es de otra persona y no tiene licencia
libre, puede incluirse con crédito, con fines de documentación, y se retira si
su autor lo pide. Lo ideal es contar con su permiso.

Los archivos no deben pasar de 1,5 MB aproximadamente.

## Más detalle

La guía completa, con todos los campos de una ficha y cómo añadir una réplica
o una fuente de datos, está en el archivo
[CONTRIBUTING.md](https://github.com/oierlauzi/destinoteca/blob/main/CONTRIBUTING.md)
del repositorio.
