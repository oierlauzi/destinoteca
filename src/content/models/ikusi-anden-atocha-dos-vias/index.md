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
      derecha. Al fondo, sobre un poste, un cartel de dos mitades con el
      destino en amarillo y una línea roja bajo cada una.
    caption: Vías 8 y 7.
    place: Atocha Cercanías
    author: Archivo Renfe
    source: Facebook, compartida por Bvemike
    license: rights-reserved-credited
  - id: archivo-renfe-vias-1-2
    src: ./archivo-renfe-vias-1-2.jpg
    alt: >-
      Un andén lleno de viajeros esperando, visto desde arriba. Al fondo,
      sobre un poste, un cartel de dos mitades con texto en amarillo y, debajo,
      en rojo.
    caption: Vías 2 y 1. En la vía 1, un aviso en lugar del destino.
    author: Archivo Renfe
    source: Facebook, compartida por Bvemike
    license: rights-reserved-credited
  - id: via-libre-1995
    src: ./via-libre-1995.jpg
    alt: >-
      Un cartel alargado en lo alto de un poste, bajo la estructura de
      hormigón y los lucernarios de la estación, con el texto en amarillo
      verdoso y una línea roja bajo cada mitad.
    caption: Vías 4 y 3, tal como lo publicó *Vía Libre* en enero de 1995.
    date: '1995-01'
    place: Atocha Cercanías
    author: Vía Libre
    source: Revista Vía Libre, enero de 1995
    license: rights-reserved-credited
  - id: atocha-vias-3-4
    src: ./atocha-vias-3-4.jpg
    alt: >-
      Un cartel de dos mitades visto desde arriba, sobre un tren de Cercanías
      parado en el andén, con viajeros asomados a las ventanillas y gente en
      el andén.
    caption: Vías 3 y 4, con un tren de la serie 440 en el andén.
    place: Atocha Cercanías
    author: Archivo Renfe
    source: Facebook, compartida por Bvemike
    license: rights-reserved-credited
  - id: trenes-hoy-1989
    src: ./trenes-hoy-1989.jpg
    alt: >-
      La estación vista desde lo alto, con un tren a la izquierda, un andén
      abarrotado y, al fondo, las escaleras y la pasarela. En medio del andén,
      un cartel de dos mitades.
    caption: Vías 3 y 1, en la fotografía más antigua que se conoce de los carteles.
    date: '1989'
    place: Atocha Cercanías
    author: Trenes Hoy
    source: Revista Trenes Hoy, n.º 26, 1989
    license: rights-reserved-credited
  - id: via-libre-1990
    src: ./via-libre-1990.jpg
    alt: >-
      Un andén abarrotado de viajeros visto desde arriba, con un cartel de dos
      mitades sobre un poste en medio de la gente.
    caption: Vías 3 y 4, tal como lo publicó *Vía Libre* en febrero de 1990.
    date: '1990-02'
    place: Atocha Cercanías
    author: Luna
    source: Revista Vía Libre, febrero de 1990
    license: rights-reserved-credited
  - id: trenes-hoy-1991
    src: ./trenes-hoy-1991.jpg
    alt: >-
      Viajeros esperando en un andén, alrededor de un poste con un cartel de
      dos mitades.
    caption: Vías 3 y 4, en *Trenes Hoy*, 1991.
    date: '1991'
    place: Atocha Cercanías
    author: Trenes Hoy
    source: Revista Trenes Hoy, n.º 42, 1991
    license: rights-reserved-credited
  - id: via-libre-1996
    src: ./via-libre-1996.jpg
    alt: >-
      Un andén con bancos rojos y viajeros esperando junto a un tren. Arriba,
      colgado de la estructura, un cartel de dos mitades y, junto al andén, el
      rótulo de la estación.
    caption: Vías 4 y 3, junto al rótulo de Madrid-Atocha, en *Vía Libre*, enero de 1996.
    date: '1996-01'
    place: Atocha Cercanías
    author: Luna
    source: Revista Vía Libre, enero de 1996
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
que se conocen, entre 1989 y 1997. Probablemente estaban ahí desde que se
inauguró la estación, en 1988.

## Lo que no se sabe

- **Las medidas.** Se estiman a partir de las fotografías: unos 260 cm de
  ancho en total, con una junta de unos 20 cm entre los dos carteles. El
  largo del poste es aproximado.
- **Cuándo se instalaron y cuándo se retiraron.** Que se instalaran con la
  estación, entre 1988 y 1989, es una suposición.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
