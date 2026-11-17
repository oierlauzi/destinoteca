---
name: Cartel de dos vías de Ikusi, Atocha Cercanías
summary: >-
  Dos teleindicadores de cristal líquido de Ikusi en lo alto de un poste, uno
  para cada vía, en los andenes de Atocha Cercanías.
kind: installation
operators:
  - ref: renfe-cercanias-madrid
    role: operator
status: retired
locations:
  - site: es/madrid-atocha-cercanias
    status: retired
    note: Sobre los andenes, uno por andén, entre las dos vías.
installation:
  size: { width: 261.5, height: 92.8 }
  elements:
    - id: izquierda
      model: ikusi-anden-atocha
      variant: izquierda
      platforms: ['3']
      at: { x: 0, y: 0, width: 120.4 }
    # Between the two signs, over the pole.
    - id: junta
      at: { x: 120.4, y: 0.3, width: 20.7, height: 52.14 }
      panel:
        fill: '#1e2122'
        edge: '#3b4042'
        lines: []
    - id: derecha
      model: ikusi-anden-atocha
      variant: derecha
      platforms: ['4']
      at: { x: 141.1, y: 0, width: 120.4 }
    - id: poste
      at: { x: 125.75, y: 52.74, width: 10, height: 40 }
      panel:
        fill: '#8f9497'
        lines: []
photos:
  - id: archivo-renfe-vias-7-8
    src: ./archivo-renfe-vias-7-8.jpg
    alt: >-
      Andén de Atocha Cercanías visto desde arriba, con un tren de puertas
      abiertas a la izquierda y viajeros movidos por la larga exposición a la
      derecha. Al fondo, sobre un poste, el cartel de dos vías.
    caption: Vías 8 y 7.
    place: Atocha Cercanías
    author: Archivo Renfe
    source: Facebook, compartida por Bvemike
    license: rights-reserved-credited
cover: archivo-renfe-vias-7-8
stage: stub
---

En los andenes de Atocha Cercanías, cada poste llevaba en lo alto dos
[teleindicadores de andén de Ikusi](../ikusi-anden-atocha/), uno para cada
vía del andén, colgados uno junto al otro como una sola caja alargada. Entre
los dos, sobre el poste, hay una junta que los separa.

Cada uno es la imagen en espejo del otro: los rótulos impresos de las vías,
«VIA 3» y «VIA 4», quedan juntos en el centro, sobre el poste, y la hora de
cada vía, hacia el extremo de su lado. Así aparecen en todas las fotografías
que se conocen, entre 1989 y 1997.

## Lo que no se sabe

- **Las medidas.** Se estiman a partir de las fotografías: unos 260 cm de
  ancho en total, con una junta de unos 20 cm entre los dos carteles. El
  largo del poste es aproximado.
- **Cuándo se instalaron y cuándo se retiraron.**

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
