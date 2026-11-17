# Cómo contribuir

Gracias por querer aportar. El archivo entero vive en este repositorio, así
que contribuir es proponer un cambio en un archivo de texto. Hay tres maneras,
de menos a más técnica:

1. **Abrir una incidencia** con uno de los
   [formularios](https://github.com/oierlauzi/destinoteca/issues/new/choose):
   proponer un teleindicador, aportar una fotografía o corregir un dato.
2. **Editar una ficha en GitHub** con el enlace «Editar esta página» que hay
   al pie de cada una. GitHub crea la propuesta de cambio por ti.
3. **Clonar el repositorio** y trabajar en local (ver [Desarrollo](#desarrollo)).

Antes de publicarse, cada cambio pasa unas comprobaciones automáticas y una
revisión.

## Las reglas del archivo

- **Una ficha por diseño.** Un tamaño de matriz o una caja distintos son una
  ficha nueva dentro de la misma familia. Un cambio de rotulación, de montaje
  o de color es una variante dentro de la ficha. Una pieza con modelo propio
  dentro de un equipo (la línea flip-dot PI-T100-M de un cartel de andén) es
  un componente de la ficha, no la ficha.
- **Identificadores permanentes.** El identificador es el nombre de la
  carpeta: `fabricante-modelo` (o un nombre descriptivo si no hay modelo), en
  minúsculas y con guiones. Es la dirección de la ficha y no cambia nunca. Si
  hay que renombrar, el antiguo se deja en `aliases` y sigue funcionando.
- **Esbozos y artículos.** Una ficha nueva es un esbozo (`stage: stub`) y solo
  necesita nombre, resumen, tipo, tecnología, medio de transporte y país. Para
  ser artículo (`stage: article`) necesita además fabricante (o
  `manufacturerUnknown: true`), operador, una fuente y una fotografía.
- **Solo lo que se puede sostener.** Cada dato debería poder rastrearse hasta
  una fuente o una fotografía. Lo que es una suposición se presenta como tal;
  lo que no se sabe se deja en blanco.

## Añadir una ficha

Crea `src/content/models/<id>/index.md`. La cabecera, entre `---`, son los
datos; el resto es el artículo, en Markdown.

```yaml
---
name: Nombre del equipo
summary: Una o dos frases (300 caracteres como mucho).
kind: platform-indicator      # o departure-board, clock, onboard…
technologies: [flip-dot]      # fichas de src/content/technologies/
transportModes: [rail]
countries: [es]
stage: stub
---

Lo que sepas, aunque sean dos líneas.
```

Los valores admitidos en cada campo, y todos los campos opcionales
(`manufacturers`, `operators`, `families`, `years`, `status`, `components`,
`locations`, `variants`, `photos`, `references`, `replica`, `aliases`),
están en [`src/content.config.ts`](src/content.config.ts) y en
[`src/lib/catalog/vocab.ts`](src/lib/catalog/vocab.ts). La ficha
[`page-iberica-anden-electromagnetico`](src/content/models/page-iberica-anden-electromagnetico/index.md)
sirve de ejemplo completo.

Fabricantes, operadores, familias y tecnologías son fichas propias, cada una
en su carpeta de `src/content/`. Las estaciones están en
`src/content/sites/`. Si citas uno que no existe, créalo: un nombre basta.

Los enlaces dentro de un artículo son relativos
(`../../fabricantes/telenorma/`), nunca empiezan por `/`.

## Añadir una fotografía

Pon el archivo en la carpeta de la ficha y decláralo en su cabecera:

```yaml
photos:
  - id: mostoles-1997
    src: ./mostoles-1997.jpg
    alt: Qué se ve en la imagen, para quien no puede verla.
    caption: Móstoles, 1997.
    author: Nombre del autor
    sourceUrl: https://…          # de dónde sale, si no es tuya
    license: rights-reserved-credited
```

- **Tuya:** `ownWork: true` y una licencia libre (`cc-by-sa-4.0` por defecto).
- **De otra persona, con licencia libre:** indica cuál.
- **De otra persona, sin licencia libre:** `rights-reserved-credited`. Se
  reproduce con crédito, con fines de documentación, y se retira si su autor
  lo pide. Si tienes su permiso, anótalo en `permission`.

Siempre con texto alternativo, autor y licencia. Tamaño máximo orientativo:
1,5 MB.

## Desarrollo

Node.js 22.23 o posterior.

```sh
npm install
npm run dev
```

Antes de proponer un cambio:

```sh
npm run check && npm test && npm run build && npm run lint:dist
```

`npm run build` falla si una ficha cita algo que no existe, repite un
identificador o le faltan datos obligatorios, y dice cuál.

## Añadir una réplica o una fuente de datos

Esto ya es programar. La arquitectura, las interfaces y los pasos están en
[ARCHITECTURE.md](ARCHITECTURE.md). En resumen:

- Una **réplica** es una carpeta en `src/lib/replicas/` que sabe convertir
  los trenes que le tocan en lo que muestra, y dibujarlo. No sabe de dónde
  vienen los datos.
- Una **fuente** es una carpeta en `src/lib/sources/` que entrega lo que sabe
  de una estación en el modelo de datos común. No sabe quién lo va a mostrar.
- Los formularios de ajustes, los parámetros de la dirección y el código para
  insertar salen solos de los esquemas que declara cada una.

El código, sus comentarios y `ARCHITECTURE.md` están en inglés; el sitio y las
fichas, en español.
