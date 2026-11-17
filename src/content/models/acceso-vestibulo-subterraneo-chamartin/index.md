---
name: Acceso al vestíbulo subterráneo de Chamartín
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
  size: { width: 1048, height: 192 }
  elements:
    - id: logotipo
      at: { x: 16, y: 0, width: 237, height: 78 }
      panel:
        fill: none
        lines: []
        logo: { kind: adif, height: 66, color: '#5c6670', symbolColor: '#3aaa35' }
    - id: administrador
      at: { x: 114, y: 58, width: 150, height: 16 }
      panel:
        fill: none
        valign: top
        lines:
          - { text: ADMINISTRADOR DE, size: 4.8, color: '#4a5056', align: left }
          - { text: INFRAESTRUCTURAS FERROVIARIAS, size: 4.8, color: '#4a5056', align: left }
    - id: salidas-1
      model: mp-electronics-adif-teleindicador
      params: { color: '#5df08f' }
      serie: salidas
      at: { x: 280, y: 6, width: 300 }
    - id: salidas-2
      model: mp-electronics-adif-teleindicador
      params: { color: '#5df08f' }
      serie: salidas
      at: { x: 588, y: 6, width: 300 }
    - id: reloj
      model: festina-adif-reloj-cuadrado
      at: { x: 894, y: 6, width: 130.7 }
    - id: nombre
      at: { x: 0, y: 150, width: 1048, height: 40 }
      panel:
        fill: none
        lines:
          - text: "MADRID\u2013CHAMARTÍN\u00a0\u00a0\u00a0\u2013\u00a0\u00a0\u00a0CLARA CAMPOAMOR"
            size: 32
            weight: 700
            align: left
            stretch: true
            finish: aluminium
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
aliases:
  - salidas-vestibulo-subterraneo-chamartin
stage: stub
---

En la pared sobre el acceso al nuevo vestíbulo subterráneo de Chamartín
cuelgan dos [tableros de salidas de MP Electronics](../mp-electronics-adif-teleindicador/),
uno junto al otro, con las filas en verde; el de la derecha sigue con los
trenes del de la izquierda. Al lado, un
[reloj Festina cuadrado](../festina-adif-reloj-cuadrado/).

Debajo van el logotipo de [adif](../../operadores/adif/) y el nombre de la
estación, «Madrid-Chamartín - Clara Campoamor», en grandes letras de aluminio.

En una pared detrás de esta colgaban
[dos tableros de Cercanías](../cercanias-vestibulo-subterraneo-chamartin/).

## Lo que no se sabe

- **Desde cuándo están así.**
- **Las medidas.** La composición las estima a partir de las fotografías.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
