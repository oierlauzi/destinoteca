---
name: Teleindicador LED de andén de MP Electronics para ADIF
summary: >-
  El cartel de andén de las estaciones de ADIF, del mismo fabricante y con el
  mismo diseño que sus tableros de salidas: el próximo tren en tres filas de
  paneles de LED y el número de vía, grande, junto a una franja verde.
kind: platform-indicator
technologies:
  - led
transportModes:
  - rail
features:
  - scrolling-text
  - printed-legends
manufacturers:
  - ref: mp-electronics
    role: manufacturer
operators:
  - ref: adif
    role: owner
countries:
  - es
status: in-service
variants:
  - id: izquierda
    name: Vía a la izquierda
    description: El número de vía y la franja verde a la izquierda de las filas.
    replicaPreset:
      lado: left
  - id: derecha
    name: Vía a la derecha
    description: El número de vía y la franja verde a la derecha de las filas.
    replicaPreset:
      lado: right
photos:
  - id: anden-esradio
    src: ./anden-esradio.jpg
    alt: >-
      Un cartel de andén encendido visto de cerca, con el número de vía y la
      franja verde a la izquierda y tres filas de LED en ámbar y rojo.
    caption: Publicada por esRadio Castilla y León.
    author: esRadio Castilla y León
    sourceUrl: https://www.esradiocastillayleon.es/uploads/media/670x377/07/11967-Imagen26.jpg?v=1-0
    source: esRadio Castilla y León
    license: rights-reserved-credited
replica:
  id: mp-electronics-adif-anden
stage: stub
---

Es el cartel que anuncia el próximo tren de una vía en las estaciones de
[ADIF](../../operadores/adif/). Lo hizo [MP Electronics](../../fabricantes/mp-electronics/)
con el mismo diseño que sus
[tableros de salidas y llegadas](../mp-electronics-adif-teleindicador/): caja
oscura, rótulos impresos en castellano e inglés (y en la lengua cooficial
donde la hay) y paneles de LED separados, con la misma tipografía.

Tiene tres filas. En la primera van la hora y el tren; en la segunda, el
destino; la tercera recorre las paradas o los avisos. Al lado, el número de vía impreso en grande y una franja verde que
llega de arriba abajo.

Se hace en dos manos: con la vía y la franja a la izquierda de las filas o a
la derecha. Hay también una versión con
[un reloj Festina a un lado](../mp-electronics-adif-anden-reloj/) y otra
[con el reloj encima de las filas](../mp-electronics-adif-anden-vertical/).

## Lo que no se sabe

- **Cuándo se instalaron**, y en qué estaciones.
- **Qué decide la tercera fila**: cuándo recorre las paradas y cuándo da
  otros avisos.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
