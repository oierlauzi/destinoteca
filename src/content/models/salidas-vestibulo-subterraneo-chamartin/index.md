---
name: Salidas del vestíbulo subterráneo de Chamartín
summary: >-
  En el acceso al nuevo vestíbulo subterráneo de Madrid-Chamartín-Clara
  Campoamor, dos tableros de salidas de MP Electronics y un reloj Festina
  cuadrado, sobre el logotipo de adif y el nombre de la estación.
kind: composition
operators:
  - ref: adif
    role: owner
status: in-service
installations:
  - site: es/madrid-chamartin
    status: in-service
    note: En el acceso al nuevo vestíbulo subterráneo.
composition:
  size: { width: 1040, height: 210 }
  background: '#ecebe7'
  elements:
    - id: salidas-1
      model: mp-electronics-adif-teleindicador
      params: { color: '#5df08f' }
      serie: salidas
      at: { x: 175, y: 20, width: 300 }
    - id: salidas-2
      model: mp-electronics-adif-teleindicador
      params: { color: '#5df08f' }
      serie: salidas
      at: { x: 479, y: 20, width: 300 }
    - id: reloj
      model: festina-adif-reloj-cuadrado
      at: { x: 794, y: 0, width: 150 }
    - id: logotipo
      at: { x: 0, y: 95, width: 165, height: 50 }
      panel:
        fill: none
        lines: []
        logo: { kind: adif, height: 42, color: '#5c6670', symbolColor: '#3aaa35' }
    - id: nombre
      at: { x: 0, y: 162, width: 1040, height: 44 }
      panel:
        fill: none
        lines:
          - { text: MADRID-CHAMARTÍN - CLARA CAMPOAMOR, size: 32, weight: 600, color: '#5a5e62', align: left }
photos:
  - id: vestibulo-subterraneo
    src: ./chamartin-vestibulo-inferior.jpg
    alt: >-
      Dos tableros de salidas de adif, uno junto al otro, en lo alto de una
      pared blanca con el nombre de la estación, junto a un reloj cuadrado.
    place: Madrid-Chamartín-Clara Campoamor
    author: Oier Lauzirika Zarrabeitia
    ownWork: true
    license: cc-by-sa-4.0
references:
  - title: Estación Madrid-Chamartín, nuevo vestíbulo subterráneo, paneles y nombre de estación
    author: Adif Alta Velocidad
    url: https://www.adifaltavelocidad.es/documents/34745/2301034/Estaci%C3%B3n+Madrid-Chamart%C3%ADn_nuevo+vest%C3%ADbulo+subterr%C3%A1neo_paneles+y+nombre+de+estaci%C3%B3n_DBM_3745.png/9a3051c8-54a7-733d-0644-207a2c766f10
    note: Fotografía de la misma pared.
stage: stub
---

En la pared sobre el acceso al nuevo vestíbulo subterráneo de Chamartín
cuelgan dos [tableros de salidas de MP Electronics](../mp-electronics-adif-teleindicador/),
uno junto al otro, con las filas en verde; el de la derecha sigue con los
trenes del de la izquierda. Al lado, un
[reloj Festina cuadrado](../festina-adif-reloj-cuadrado/).

Debajo van el logotipo de [adif](../../operadores/adif/) y el nombre de la
estación, «Madrid-Chamartín - Clara Campoamor», en grandes letras grises.

En una pared detrás de esta colgaban
[dos tableros de Cercanías](../cercanias-vestibulo-subterraneo-chamartin/).

## Lo que no se sabe

- **Desde cuándo están así.**
- **Las medidas.** La composición las estima a partir de las fotografías.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
