---
name: Tableros de alta velocidad de Sevilla-Santa Justa
summary: >-
  Dos tableros de llegadas y dos de salidas con placa de DSTA, con un reloj
  Festina en medio, sobre el acceso a las vías de alta velocidad de
  Sevilla-Santa Justa.
kind: installation
technologies:
  - led
operators:
  - ref: adif
    role: owner
status: in-service
locations:
  - site: es/sevilla-santa-justa
    status: in-service
    note: Sobre el acceso a las vías de alta velocidad.
installation:
  size: { width: 784, height: 266 }
  background: '#1d1f21'
  elements:
    # Los cuatro tableros no tienen ficha en el archivo: de ellos queda su
    # sitio en la pared y las proporciones que se leen en la fotografía.
    - id: llegadas-1
      at: { x: 0, y: 0, width: 300, height: 130.69 }
    - id: llegadas-2
      at: { x: 0, y: 134.7, width: 300, height: 130.69 }
    - id: rotulo-trenes
      at: { x: 304, y: 0, width: 176, height: 55.7 }
      panel:
        fill: '#00703c'
        lines:
          - { text: TRENES ALTA, size: 9, weight: 500 }
          - { text: VELOCIDAD, size: 9, weight: 500 }
        logo: { kind: adif, height: 4 }
    - id: caja-reloj
      at: { x: 304, y: 57.7, width: 176, height: 150 }
      panel: { fill: '#2b2d30', lines: [] }
    - id: reloj
      model: festina-adif-reloj-cuadrado
      at: { x: 317, y: 57.7, width: 150 }
    - id: rotulo-trains
      at: { x: 304, y: 209.7, width: 176, height: 55.7 }
      panel:
        fill: '#00703c'
        lines:
          - { text: HIGH SPEED, size: 9, weight: 500 }
          - { text: TRAINS, size: 9, weight: 500 }
        logo: { kind: adif, height: 4 }
    - id: salidas-1
      at: { x: 484, y: 0, width: 300, height: 130.69 }
    - id: salidas-2
      at: { x: 484, y: 134.7, width: 300, height: 130.69 }
photos:
  - id: reloj-cuatro-tableros-2026
    src: ./reloj-cuatro-tableros-2026.jpg
    alt: >-
      El acceso a las vías de alta velocidad, con controles de seguridad.
      Encima, dos tableros a cada lado de un reloj Festina cuadrado.
    caption: Enero de 2026.
    date: '2026-01-20'
    place: Sevilla-Santa Justa
    author: Agent Travel
    sourceUrl: https://agenttravel.es/Fotos/AVE%20Madrid%20Sevilla%2020ene26.jpg
    source: Agent Travel
    license: rights-reserved-credited
# Los tableros llevan placa de DSTA, que todavía no tiene ficha en el archivo,
# así que el archivo no muestra esta instalación: dibujarla con la réplica de
# MP Electronics sería atribuirles lo que no se sabe. La ficha se conserva
# entera; su dirección lleva a «Por documentar» (src/site/withdrawn.ts).
published: false
stage: stub
---

Sobre el acceso a las vías de alta velocidad de Santa Justa cuelgan cuatro
tableros de LED de adif: los de llegadas a la izquierda y los de salidas a la
derecha. En cada lado, el de abajo sigue con los trenes del de arriba. Sus
cabeceras nombran el servicio, «Alta velocidad».

Tienen el aspecto del
[panel LED de MP Electronics para ADIF](../mp-electronics-adif-teleindicador/),
pero llevan placa de [DSTA](../../pendientes/#dsta), de Tres Cantos, que
presenta como suyos tableros de vestíbulo de esta estación. DSTA todavía no
tiene ficha en el archivo, así que estos tableros tampoco.

En medio, un [reloj Festina cuadrado](../festina-adif-reloj-cuadrado/), entre dos
placas verdes con el logotipo de adif: «Trenes alta velocidad» encima y
«High speed trains» debajo.

## Lo que no se sabe

- **Cuándo se colgaron así.** La fotografía es de enero de 2026.
- **Una fotografía de la placa.** Se ha leído en los tableros, pero no hay
  ninguna fotografía que lo recoja.
- **Quién hizo cada tablero de este diseño.** En las estaciones de adif hay
  tableros de este aspecto con placa de MP Electronics, de DSTA —la de estos—
  y [de Alba Electrónica](../../pendientes/#alba-electrónica). Distinguirlos
  está por hacer.
- **Las medidas.** El trazado de la pared se estima a partir de las
  proporciones de la fotografía; ninguna fuente las da.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
