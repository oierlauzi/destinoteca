---
name: Teleindicador electromagnético de acceso a andén de PAGE Ibérica
summary: >-
  El cartel que anuncia, a la entrada de cada andén de Atocha Cercanías, el
  próximo tren: destino y hora en una línea flip-dot iluminada por LED, y una
  fila de LED roja debajo. Caja gris.
kind: platform-indicator
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
status: in-service
components:
  - name: Línea flip-dot
    description: >-
      Una matriz continua de 7 filas, de unas 104 columnas, con un LED junto a
      cada punto. El destino se escribe a la izquierda y la hora de salida a
      la derecha, en una tipografía proporcional de trazo fino.
  - name: Matriz de LED
    description: Una fila roja de 7 puntos de alto, separada de la línea flip-dot.
  - name: Rótulos fijos
    description: >-
      En la cabecera, el logotipo de Cercanías, «Vía» con el número del andén
      y «Próximo tren» en dos líneas.
  - name: Placa del fabricante
    description: El logotipo de PAGE, con el globo a la izquierda, en una placa blanca centrada bajo la pantalla.
installations:
  - site: es/madrid-atocha-cercanias
    status: in-service
    note: A la entrada de los andenes.
photos:
  - id: atocha-acceso-via-7
    src: ./atocha-acceso-via-7.jpg
    alt: >-
      Cartel de caja gris montado en una pared, con la línea flip-dot en verde
      y la fila de LED en rojo, y la placa de PAGE bajo la pantalla.
    caption: Vía 7, octubre de 2026.
    date: '2026-10'
    place: Atocha Cercanías
    author: Europa Press
    sourceUrl: https://img.europapress.es/fotoweb/fotonoticia_20261029112601_1200.jpg
    source: Europa Press
    license: rights-reserved-credited
cover: atocha-acceso-via-7
replica:
  id: page-iberica-acceso-atocha
  poster:
    text: SIN SERVICIO
    hora: '04:35'
    via: 7
    led: PROXIMA SALIDA
stage: stub
---

Es uno de los carteles de PAGE Ibérica que siguen en servicio en Atocha
Cercanías, en la caja gris que comparten todos los de la estación. Anuncia el
próximo tren de un andén a quien va a entrar en él.

Su línea flip-dot es una matriz continua iluminada por LED, como la del
[cartel de Alcalá de Henares](../page-iberica-anden-continuo/), pero escribe
con otra tipografía, de trazo fino: la misma que el
[teleindicador de andén](../page-iberica-anden-atocha/) de la estación. Como
el de Alcalá, muestra la hora de salida y no los minutos que faltan.

La fila de LED roja va aparte, en su propia franja de la caja, y no integrada
bajo la línea flip-dot. La réplica le pone la misma fila que los carteles
anteriores de la familia, tan ancha como la línea flip-dot.

## La réplica

Está medida sobre la fotografía de la vía 7. La línea flip-dot tiene en ella
104 columnas: es lo que da la fotografía suponiendo el mismo paso de punto que
el cartel de Alcalá. El texto empieza en la segunda columna y la hora
termina a dos del final.

Las letras S, I, N, E, R, V, C, O y los dígitos 0, 3, 4 y 5 se han copiado punto por punto
de esta fotografía; el resto, de las del teleindicador de andén o, si no
aparecen en ninguna, dibujadas en el mismo estilo.

## Lo que no se sabe

- **Qué muestra la fila de LED** con el servicio en marcha. La réplica pone
  las paradas del tren, como en los demás carteles de la familia.
- **Cuándo se instalaron.**

Si tienes más fotografías o datos, [puedes aportarlos](../../contribuir/).
