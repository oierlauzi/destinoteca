---
name: Salidas de largo recorrido del vestíbulo de Chamartín
summary: >-
  Pares de paneles de paletas de Solari bajo un mismo marco claro con el
  rótulo «Salidas largo recorrido», colgados en fila sobre el vestíbulo de
  Chamartín.
kind: composition
operators:
  - ref: renfe
    role: operator
status: retired
installations:
  - site: es/madrid-chamartin
    status: retired
    note: En el vestíbulo, sobre las taquillas y los accesos a las vías.
composition:
  size: { width: 601, height: 138 }
  elements:
    - id: marco
      at: { x: 0, y: 0, width: 601, height: 138 }
      panel: { fill: '#e8e3cc', edge: '#b8b297', lines: [] }
    - id: rotulo
      at: { x: 0, y: 0, width: 601, height: 14 }
      panel:
        fill: '#e8e3cc'
        lines:
          - { text: SALIDAS LARGO RECORRIDO, size: 10, spacing: 4, color: '#3b3a35' }
    - id: fabricante
      at: { x: 181.8, y: 130, width: 116, height: 6 }
      panel:
        fill: '#e8e3cc'
        lines:
          - { text: 'solari&c. udine, italy', size: 1.8, align: right, color: '#57554c' }
    - id: panel-1
      model: paletas-chamartin-vestibulo
      params: { marco: false }
      serie: salidas
      at: { x: 5, y: 14, width: 292.8 }
    - id: panel-2
      model: paletas-chamartin-vestibulo
      params: { marco: false }
      serie: salidas
      at: { x: 303.2, y: 14, width: 292.8 }
photos:
  - id: chamartin-anos-80
    src: ./chamartin-anos-80.jpg
    alt: >-
      El vestíbulo de Chamartín con viajeros caminando bajo dos paneles de
      salidas de largo recorrido que comparten marco y rótulo.
    caption: Chamartín, años ochenta.
    place: Madrid Chamartín
    author: José Miguel Gómez
    sourceUrl: https://x.com/ger58056/status/2087574002772357238
    source: X (@ger58056)
    license: rights-reserved-credited
  - id: chamartin-archivo-renfe
    src: ./chamartin-archivo-renfe.jpg
    alt: >-
      El vestíbulo de Chamartín desde un mostrador de información, con una
      larga fila de paneles de salidas de paletas en lo alto.
    caption: Chamartín, años ochenta, en una fotografía del archivo de Renfe.
    place: Madrid Chamartín
    author: Archivo Renfe
    sourceUrl: https://x.com/ger58056/status/1602384737305513986
    source: X (@ger58056)
    license: rights-reserved-credited
stage: stub
---

Los [paneles de paletas de Solari](../paletas-chamartin-vestibulo/) de las
salidas de largo recorrido no colgaban sueltos en el vestíbulo de
Chamartín: iban de dos en dos bajo un mismo marco claro, con el rótulo
«Salidas largo recorrido» a lo largo de los dos y el nombre del fabricante en
el borde inferior. El segundo panel de cada par sigue con los trenes del
primero.

Los pares se sucedían en fila a lo largo del vestíbulo. La composición
muestra uno.

## Lo que no se sabe

- **Cuántos pares había**, y si todos eran de salidas de largo recorrido.
- **Las medidas.** La composición las estima a partir de las fotografías.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
