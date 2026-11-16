---
name: Panel de vestíbulo electromagnético de PAGE Ibérica, 4 líneas
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
status: unknown
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
      de la línea C-4, un reloj y el panel de cuatro líneas, con «Vía»,
      «Destino» y «Próxima Llegada» en la cabecera y trenes a Chamartín y a
      Colmenar.
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
    caption: Cantoblanco Universidad, junio de 2023. La fila de LED está encendida.
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
    dest4: ALCOBENDAS-S.S.R.
    min4: 22
    led: 'PROHIBIDO CRUZAR LAS VIAS'
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

## La réplica

La réplica reutiliza las piezas de la del cartel de andén: los mismos puntos,
el mismo juego de caracteres, la misma fila de LED y los mismos defectos. Sus
medidas, en cambio, son una estimación hecha a partir de las fotografías de
esta ficha, tomadas en ángulo: no se ha medido ninguna unidad. El tubo
fluorescente de cada línea no se dibuja, pero sí el espacio que ocupa. Cada línea se actualiza a la
vez que las demás, como si cada una tuviera su propio controlador; es una
suposición basada en que la línea del cartel de andén se identifica como
«MAESTRA».

Lo que muestra la fila de LED cuando hay trenes (las paradas del primero) es
una elección de la réplica: no hay fotografías que lo muestren.

Si tienes más fotografías o datos de estos paneles, [puedes aportarlos](../../contribuir/).
