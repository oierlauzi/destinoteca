---
name: Panel electromagnético de vestíbulo de PAGE Ibérica, 4 líneas
summary: >-
  Panel de vestíbulo de Renfe Cercanías Madrid con cuatro líneas flip-dot de 20
  caracteres, una por tren, para anunciar las próximas salidas de toda la
  estación. Visto en Cantoblanco.
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
      4 líneas de 20 caracteres de 5 × 7 puntos. Cada una muestra la vía, el
      destino y los minutos de un tren.
  - name: Matriz de LED
    description: Fila de texto móvil bajo las líneas flip-dot, algo más ancha que ellas.
  - name: Rótulos fijos
    description: >-
      «Vía» con el logotipo de Cercanías encima, «Destino», «Próxima Llegada» y
      un «min.» al final de cada línea.
variants:
  - id: dos-puntos
    name: Con dos puntos
    description: >-
      Algunos paneles llevan un vinilo de dos puntos, ámbar como «min.», entre
      el penúltimo carácter y el anterior. No se sabe en cuáles.
    replicaPreset:
      dospuntos: true
installations:
  - site: es/cantoblanco
    line: C-4
    status: unknown
    note: En el vestíbulo. La estación tuvo también teleindicadores de andén de la misma familia, ya retirados.
photos:
  - id: cantoblanco-vestibulo
    src: ./cantoblanco-vestibulo-1.jpg
    alt: >-
      Vestíbulo de Cantoblanco Universidad. Sobre las puertas de los andenes
      de la línea C-4, un reloj y el panel de cuatro líneas.
    caption: El panel de Cantoblanco Universidad, junto al reloj del vestíbulo.
    place: Cantoblanco Universidad
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/ffrVRkup8ibVMKjk9
    source: Google Maps
    license: rights-reserved-credited
  - id: cantoblanco-vestibulo-2023
    src: ./cantoblanco-vestibulo-2.jpg
    alt: >-
      El vestíbulo de Cantoblanco Universidad desde más lejos, con la escalera
      a la izquierda y las puertas de los andenes. Arriba, el panel de cuatro
      líneas con la fila de LED encendida en rojo.
    caption: Cantoblanco Universidad, junio de 2023.
    date: '2023-06'
    place: Cantoblanco Universidad
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/NMZHqnzu1PT5AkTeA
    source: Google Maps
    license: rights-reserved-credited
replica:
  id: page-iberica-vestibulo-4-lineas
  poster:
    via1: 2
    dest1: CHAMARTIN
    min1: 8
    via2: 1
    dest2: COLMENAR VIEJO
    min2: 8
    via3: 2
    dest3: ATOCHA
    min3: 15
    via4: 1
    dest4: ALCOBENDAS
    min4: 22
stage: stub
---

Además de los [teleindicadores de andén](../page-iberica-anden-electromagnetico/),
algunas estaciones de Cercanías Madrid tuvieron en el vestíbulo un panel que
anunciaba los próximos trenes de toda la estación. Este tiene cuatro líneas; en
Cantoblanco convivió con los carteles de andén de la misma familia, que ya no están.
Existe también una versión de
[2 líneas](../page-iberica-vestibulo-2-lineas/).

## Qué muestra

| Elemento | Contenido |
| --- | --- |
| Cabecera | «Vía» con el logotipo de Cercanías encima, sobre los dos primeros caracteres; «Destino», más o menos del séptimo al decimotercero; «Próxima Llegada» a la derecha |
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
