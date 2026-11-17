---
name: Panel electromagnético de vestíbulo de PAGE Ibérica, 4 líneas
summary: >-
  Panel de vestíbulo de Renfe Cercanías Madrid con cuatro líneas flip-dot de 20
  caracteres, una por tren, para anunciar las próximas salidas de toda la
  estación. Visto en Cantoblanco y en Pinar de las Rozas.
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
variants:
  - id: dos-puntos
    name: Dos puntos en algunas líneas
    description: >-
      En Cantoblanco Universidad, la segunda línea lleva un vinilo de dos
      puntos, ámbar como «min.», antes de los dos últimos caracteres; las
      demás no. La réplica lo muestra así, y deja elegir las líneas.
installations:
  - site: es/cantoblanco
    line: C-4
    status: unknown
    note: En el vestíbulo. La estación tuvo también teleindicadores de andén de la misma familia, ya retirados.
  - site: es/pinar-de-las-rozas
    status: unknown
    note: En una pared. Grabado en vídeo en servicio.
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
  - id: pinar-video
    src: ./pinar-video.jpg
    alt: >-
      El panel de cuatro líneas en una pared amarilla, visto de frente, con
      las líneas flip-dot encendidas sobre sus tubos fluorescentes y la fila
      de LED roja recorriendo un aviso.
    caption: Pinar de las Rozas, en un fotograma del vídeo. En la fila de LED, la eñe sale como Q.
    place: Pinar de las Rozas
    author: Ferrocarril Ibérico - Canal Oficial
    sourceUrl: https://www.youtube.com/watch?v=8SDaOLen0Uw
    source: YouTube
    license: rights-reserved-credited
references:
  - title: Renfe Cercanías - Panel de información en Pinar
    author: Ferrocarril Ibérico - Canal Oficial
    publication: YouTube
    url: https://www.youtube.com/watch?v=8SDaOLen0Uw
    note: El panel de Pinar de las Rozas en servicio, con un aviso recorriendo la fila de LED.
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
Se ha visto otro en Pinar de las Rozas, en un
[vídeo](https://www.youtube.com/watch?v=8SDaOLen0Uw).
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

En el vídeo de Pinar de las Rozas, la fila de LED recorre un aviso que prohíbe
subir o bajar del tren una vez que suenan o se encienden las señales de
cierre de puertas.

## La eñe que sale como Q

En ese aviso, «SEÑALES» aparece en la fila de LED como «SEQALES». Es
probable que sea un problema de codificación: en la tabla de caracteres
ISO 8859-1 (Latin-1), la Ñ es el byte `0xD1`, y
si un enlace de 7 bits pierde el bit más significativo queda en `0x51`, que es
la Q. El
[cartel de andén](../page-iberica-anden-electromagnetico/#curiosidades) de la
misma familia tiene un arreglo en su línea flip-dot para un problema parecido
con su propia tabla de caracteres; la fila de LED de este panel, por lo que se
ve, no lo tenía.

Como los carteles de andén, estos paneles se han ido retirando, y es probable
que ya no quede ninguno en servicio.

Si tienes más fotografías o datos de estos paneles, [puedes aportarlos](../../contribuir/).
