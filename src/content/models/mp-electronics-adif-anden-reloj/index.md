---
name: Teleindicador LED de andén con reloj de MP Electronics para ADIF
summary: >-
  El cartel de andén de MP Electronics para ADIF con un reloj redondo al
  lado de las filas de LED, en el extremo opuesto al número de vía.
kind: platform-indicator
technologies:
  - led
  - analog
transportModes:
  - rail
features:
  - integrated-clock
  - scrolling-text
  - printed-legends
manufacturers:
  - ref: mp-electronics
    role: manufacturer
  - ref: festina
    role: manufacturer
operators:
  - ref: adif
    role: owner
families:
  - mp-electronics-adif
countries:
  - es
status: in-service
variants:
  - id: izquierda
    name: Vía a la izquierda
    description: El número de vía y la franja verde a la izquierda; el reloj, a la derecha.
    replicaPreset:
      lado: left
  - id: derecha
    name: Vía a la derecha
    description: El número de vía y la franja verde a la derecha; el reloj, a la izquierda.
    replicaPreset:
      lado: right
  - id: esfera-mp
    name: Con esfera de MP Electronics
    description: El reloj lleva la esfera de MP Electronics, sin números y con agujas de barra, en lugar de la de Festina.
    replicaPreset:
      esfera: mp
installations:
  - site: es/alcazar-de-san-juan
    status: in-service
photos:
  - id: alcazar-de-san-juan
    src: ./alcazar-de-san-juan.jpg
    alt: >-
      Andén cubierto de una estación con la fachada naranja. Arriba, un cartel
      de andén apagado con la franja verde y el número de vía a la izquierda y
      un reloj iluminado a la derecha.
    caption: Alcázar de San Juan, con la esfera de MP Electronics.
    place: Alcázar de San Juan
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/Zztvoae2x7iE432w9
    source: Google Maps
    license: rights-reserved-credited
replica:
  id: mp-electronics-adif-anden-reloj
stage: stub
---

Es el [cartel de andén de MP Electronics](../mp-electronics-adif-anden/) con
un reloj de agujas al lado de las filas de LED, en el extremo contrario al
número de vía. El reloj es redondo, con aro metálico, y en la mayoría de las
fotografías lleva la esfera del [reloj Festina de ADIF](../festina-adif-reloj/);
en Alcázar de San Juan lleva en su lugar la de MP Electronics: su marca, sin
números y con agujas sencillas, de barra.

Como el cartel sin reloj, se hace en dos manos: con la vía y la franja verde
a la izquierda, y el reloj a la derecha, o al revés.

## Lo que no se sabe

- **Cuándo se instalaron**, y en qué estaciones.
- **Cuándo lleva el reloj una esfera y cuándo la otra.**

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
