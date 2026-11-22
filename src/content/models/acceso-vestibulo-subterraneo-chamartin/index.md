---
name: Acceso al vestíbulo subterráneo de Chamartín
summary: >-
  Dos tableros de salidas de MP Electronics y un reloj Festina en el acceso al
  vestíbulo subterráneo de Chamartín.
kind: installation
operators:
  - ref: adif
    role: owner
status: in-service
locations:
  - site: es/madrid-chamartin
    status: in-service
    note: En el acceso al nuevo vestíbulo subterráneo.
installation:
  # De momento la pared no se dibuja; su trazado se conserva.
  drawn: false
  size: { width: 1096, height: 240 }
  # The wall is painted white; a touch of grey keeps it apart from the page.
  background: '#f3f3f1'
  elements:
    - id: logotipo
      at: { x: 40, y: 24, width: 237, height: 78 }
      panel:
        fill: none
        lines: []
        logo: { kind: adif, height: 66, color: '#5c6670', symbolColor: '#3aaa35' }
    - id: administrador
      at: { x: 138, y: 82, width: 150, height: 16 }
      panel:
        fill: none
        valign: top
        lines:
          - { text: ADMINISTRADOR DE, size: 4.8, color: '#4a5056', align: left }
          - { text: INFRAESTRUCTURAS FERROVIARIAS, size: 4.8, color: '#4a5056', align: left }
    - id: salidas-1
      model: mp-electronics-adif-teleindicador
      serie: salidas
      at: { x: 304, y: 30, width: 300 }
    - id: salidas-2
      model: mp-electronics-adif-teleindicador
      serie: salidas
      at: { x: 612, y: 30, width: 300 }
    - id: reloj
      model: festina-adif-reloj-cuadrado
      at: { x: 918, y: 30, width: 130.7 }
    - id: nombre
      at: { x: 24, y: 174, width: 1048, height: 40 }
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
  - id: adif-vestibulo-subterraneo
    src: ./adif-vestibulo-subterraneo.jpg
    alt: >-
      La entrada al vestíbulo subterráneo, con los tornos de acceso. Encima,
      el logotipo de adif, dos tableros de salidas, un reloj cuadrado y el
      nombre de la estación en grandes letras metálicas.
    caption: El acceso al vestíbulo subterráneo, en una fotografía de Adif.
    place: Madrid-Chamartín-Clara Campoamor
    author: Adif Alta Velocidad
    sourceUrl: https://www.adifaltavelocidad.es/documents/34745/2301034/Estaci%C3%B3n+Madrid-Chamart%C3%ADn_nuevo+vest%C3%ADbulo+subterr%C3%A1neo_paneles+y+nombre+de+estaci%C3%B3n_DBM_3745.png/9a3051c8-54a7-733d-0644-207a2c766f10
    source: Adif Alta Velocidad
    license: rights-reserved-credited
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
    note: La fotografía de la pared que se reproduce arriba.
aliases:
  - salidas-vestibulo-subterraneo-chamartin
stage: stub
---

En la pared sobre el acceso al nuevo vestíbulo subterráneo de Chamartín
cuelgan dos [tableros de salidas de MP Electronics](../mp-electronics-adif-teleindicador/),
uno junto al otro, con los trenes en ámbar y la fila de avisos en rojo; el
de la derecha sigue con los trenes del de la izquierda. Al lado, un
[reloj Festina cuadrado](../festina-adif-reloj-cuadrado/).

Debajo van el logotipo de [adif](../../operadores/adif/) y el nombre de la
estación, «Madrid-Chamartín - Clara Campoamor», en grandes letras de aluminio.

## Lo que no se sabe

- **Desde cuándo están así.**
- **Las medidas.** El trazado de la pared se estima a partir de las
  proporciones de las fotografías; ninguna fuente las da.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
