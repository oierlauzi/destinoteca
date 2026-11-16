---
name: Panel electromagnético de vestíbulo de PAGE Ibérica, 2 líneas
summary: >-
  Panel de vestíbulo de Renfe Cercanías Madrid con dos líneas flip-dot de 20
  caracteres, una por tren, para anunciar las próximas salidas de toda la
  estación. Visto en Tres Cantos y en Delicias.
kind: concourse-board
technologies:
  - flip-dot
  - led
transportModes:
  - rail
features:
  - scrolling-text
  - printed-legends
manufacturers:
  - ref: page-iberica
    role: integrator
operators:
  - ref: renfe-cercanias-madrid
    role: operator
family: page-iberica-electromagneticos
countries:
  - es
status: retiring
components:
  - name: Líneas de texto flip-dot
    description: >-
      2 líneas de 20 caracteres de 5 × 7 puntos. Cada una muestra la vía, el
      destino y los minutos de un tren.
  - name: Matriz de LED
    description: Fila de texto móvil bajo las líneas flip-dot, algo más ancha que ellas.
  - name: Rótulos fijos
    description: >-
      «Vía» con el logotipo de Cercanías encima, «Destino» y un «min.» al final
      de cada línea.
variants:
  - id: dos-puntos
    name: Con dos puntos
    description: >-
      Algunos paneles llevan un vinilo de dos puntos, ámbar como «min.», entre
      el penúltimo carácter y el anterior. No se sabe en cuáles.
    replicaPreset:
      dospuntos: true
  - id: proxima-llegada
    name: Con «Próxima Llegada»
    description: >-
      En Delicias la cabecera lleva también «Próxima Llegada» sobre los
      minutos, como el panel de cuatro líneas. En Tres Cantos no.
installations:
  - site: es/tres-cantos
    line: C-4
    status: unknown
    note: En el vestíbulo. La estación tuvo también teleindicadores de andén de la misma familia, ya retirados.
  - site: es/delicias
    status: unknown
    note: En el vestíbulo.
photos:
  - id: tres-cantos-vestibulo
    src: ./tres-cantos-vestibulo.jpg
    alt: >-
      Pasillo de acceso a los andenes de Tres Cantos. Encima de la entrada,
      junto a un reloj, cuelga el panel de dos líneas con la fila de LED
      encendida.
    caption: El panel de Tres Cantos, sobre el pasillo que lleva a los andenes.
    place: Tres Cantos
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/cucRjHfCNvZRMeam8
    source: Google Maps
    license: rights-reserved-credited
  - id: delicias-vestibulo
    src: ./delicias-vestibulo.jpg
    alt: >-
      El panel de dos líneas de Delicias visto de cerca, desde abajo, con sus
      rótulos blancos y las líneas flip-dot iluminadas.
    caption: Delicias.
    place: Delicias
    author: Gonzalo Vázquez Hidalgo
    license: rights-reserved-credited
replica:
  id: page-iberica-vestibulo-2-lineas
  poster:
    via1: 1
    dest1: CHAMARTIN
    min1: 2
    via2: 2
    dest2: COLMENAR VIEJO
    min2: 13
stage: stub
---

Además de los [teleindicadores de andén](../page-iberica-anden-electromagnetico/),
algunas estaciones de Cercanías Madrid tuvieron en el vestíbulo un panel que
anunciaba los próximos trenes de toda la estación. Este tiene dos líneas; se
ha visto en Tres Cantos, donde convivió con los carteles de andén de la misma
familia, que ya no están, y en Delicias.
Existe también una versión de
[4 líneas](../page-iberica-vestibulo-4-lineas/).

## Qué muestra

| Elemento | Contenido |
| --- | --- |
| Cabecera | «Vía» con el logotipo de Cercanías encima, sobre los dos primeros caracteres, y «Destino», más o menos del séptimo al decimotercero. En Tres Cantos no lleva «Próxima Llegada»; en Delicias, como el de cuatro líneas, sí |
| Líneas flip-dot | Una por tren: la vía, el destino y los minutos que faltan, junto a un «min.» fijo. Bajo cada línea hay un tubo fluorescente que la ilumina, y por eso están tan separadas |
| Fila de LED | Texto móvil debajo de las líneas, algo más ancha que ellas |

Cada línea tiene 20 caracteres, cuatro más que la del cartel de andén. Por lo
demás comparte su lenguaje: la caja negra, los rótulos fijos en blanco, los
puntos flip-dot de 5 × 7 y la fila de LED roja. Es probable que también
comparta piezas, empezando por los módulos de cada carácter, pero no se ha
comprobado en ninguna unidad.

Como los carteles de andén, estos paneles se han ido retirando, y es probable
que ya no quede ninguno en servicio.

Si tienes más fotografías o datos de estos paneles, [puedes aportarlos](../../contribuir/).
