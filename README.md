# destinoteca

Archivo para documentar y preservar los teleindicadores, paneles de salidas y
relojes de estación: su historia, fotografías en servicio y, cuando es posible,
una **réplica web** que funciona en el navegador.

**<https://oierlauzi.github.io/destinoteca/>**

Cada ficha documenta un equipo (quién lo fabricó, dónde y cuándo estuvo en
servicio, qué mostraba, curiosidades) y puede llevar una réplica interactiva
que se alimenta de datos simulados, de trenes reales o de lo que escribas a
mano, y que se puede insertar en otra página, ver a pantalla completa o
descargar como SVG.

La primera ficha es el teleindicador electromagnético de andén de PAGE
Ibérica, el cartel flip-dot de Cercanías Madrid, cuya ingeniería inversa está
en [renfe-flipdot-re](https://github.com/oierlauzi/renfe-flipdot-re).

## Contribuir

El repositorio es el archivo: cada ficha es un archivo de texto en
`src/content/`. Se puede aportar una fotografía, un dato, una fuente o un
equipo nuevo sin saber programar. Empieza por
[CONTRIBUTING.md](CONTRIBUTING.md) o por la página
[Contribuir](https://oierlauzi.github.io/destinoteca/contribuir/).

## Desarrollo

Hace falta Node.js 22.23 o posterior.

```sh
npm install
npm run dev        # el sitio en local
npm test           # pruebas de la biblioteca
npm run check      # tipos y esquemas del catálogo
npm run build      # el sitio estático, en dist/
```

Cómo está hecho, y cómo añadir una réplica o una fuente de datos:
[ARCHITECTURE.md](ARCHITECTURE.md) (en inglés, como el código).

## Insertar una réplica

Cada réplica tiene una dirección propia que se configura entera desde sus
parámetros. La página de cada ficha genera el código; por ejemplo:

```html
<iframe src="https://oierlauzi.github.io/destinoteca/embed/page-iberica-anden-electromagnetico/?text=CHAMARTIN&min=6&via=1"
        width="1200" height="510" style="border:0;max-width:100%;height:auto;aspect-ratio:190.9/81.2"
        allow="fullscreen" loading="lazy"></iframe>
```

## Licencia

- Código: [MIT](LICENSE).
- Textos del catálogo: [CC BY-SA 4.0](LICENSE-CONTENT).
- Fotografías: pertenecen a sus autores. Cada una indica autor, procedencia y
  licencia en su ficha; las que no son libres se reproducen con crédito, con
  fines de documentación y preservación, y se retiran si su autor lo pide.
- Datos y código de terceros: [NOTICE](NOTICE).

Proyecto de aficionado, no oficial. No afiliado, respaldado ni patrocinado por
Renfe, Adif ni por los fabricantes citados. Las marcas y logotipos pertenecen
a sus propietarios y se muestran solo para identificar los equipos
documentados.

---

**In English:** a catalog of electronic railway destination signs, departure
boards and station clocks, each with its history and, where possible, a web
replica that runs in the browser and can be embedded elsewhere. The site is in
Spanish; the code and [ARCHITECTURE.md](ARCHITECTURE.md) are in English.
