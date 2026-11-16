---
name: Teleindicador LED de salidas y llegadas de MP Electronics para ADIF
summary: >-
  El tablero de salidas y llegadas de las estaciones de largo recorrido de
  ADIF: siete trenes en paneles de LED rojos y verdes, con hora, destino o
  procedencia, tren, vía y observaciones, y una fila ancha de avisos. Poco a
  poco lo sustituyen pantallas de vídeo.
kind: departure-board
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
status: retiring
components:
  - name: Cabecera
    description: >-
      Una franja verde con «Salidas» o «Llegadas» en castellano, en la lengua
      cooficial si la hay y en inglés, y el logotipo de adif a la derecha. En
      algunas estaciones el título va sobre una pestaña gris claro.
  - name: Rótulos de las columnas
    description: >-
      «Hora», «Destino» o «Procedencia», «Tren», «Vía» y «Observaciones»:
      castellano, lengua cooficial en negrita e inglés en versalitas.
  - name: Filas de trenes
    description: >-
      Siete, cada una de cinco paneles de LED separados: la hora (5
      caracteres), el destino o la procedencia (18), el tren (13: el producto
      a la izquierda y el número a la derecha), la vía (4) y las observaciones
      (14).
  - name: Fila ancha
    description: >-
      Bajo los trenes, de la columna del destino a la de las observaciones:
      avisos que se desplazan, casi siempre en rojo, o «SALIDAS/DEPARTURES».
  - name: LED
    description: >-
      Bicolores, rojos y verdes: el texto puede ser verde, rojo o ámbar, con
      los dos encendidos. Los paneles tienen 13 filas de LED.
variants:
  - id: castellano
    name: Castellano e inglés
    description: >-
      Cabecera toda verde y filas en ámbar, como en las estaciones de Madrid.
      Los rótulos de las columnas tienen dos líneas y el tablero es más bajo.
    replicaPreset: {}
  - id: catalan
    name: Castellano, catalán e inglés
    description: >-
      Pestaña gris con «Salidas | Sortides | DEPARTURES», filas en verde y
      observaciones en catalán («ESTIMAT», «DEMORAT», «SUPRIMIT»), como en
      Barcelona Sants.
    replicaPreset:
      lengua: ca
      cabecera: tab
      color: '#5df08f'
  - id: valenciano
    name: Castellano, valenciano e inglés
    description: >-
      «Llegadas | Arribades | ARRIVALS», con las filas en rojo, como se ha
      fotografiado en la Comunitat Valenciana.
    replicaPreset:
      lengua: va
      modo: arrivals
      color: '#ff3b30'
  - id: sin-logotipo
    name: Sin logotipo
    description: >-
      Los primeros tableros, fotografiados en Madrid Puerta de Atocha hacia
      2009, no llevan el logotipo de adif en la cabecera.
    replicaPreset:
      logo: false
installations:
  - site: es/madrid-chamartin
    status: in-service
    note: En el vestíbulo inferior, dos tableros de salidas uno junto al otro.
  - site: es/madrid-puerta-de-atocha
    status: in-service
    note: Según las fuentes de las fotografías.
  - site: es/leon
    status: in-service
    note: Un tablero de llegadas, según la fuente de la fotografía.
photos:
  - id: chamartin-vestibulo-inferior
    src: ./chamartin-vestibulo-inferior.jpg
    alt: >-
      Dos tableros de salidas de adif, uno junto al otro, en lo alto de una
      pared blanca con las letras «MADRID-CHAMARTÍN - CLARA CAMPOAMOR» y, a la
      derecha, un reloj. El de la derecha anuncia trenes a Badajoz, Albacete
      Los Llanos, Soria, Jaén, Cercedilla y Alcázar de San Juan, con «BUS» en
      la columna de la vía de uno de ellos, «ACCESO A» y «POR OBRA» en las
      observaciones y «SALIDAS / DEPARTURES» en rojo.
    caption: >-
      Dos tableros de salidas en el vestíbulo inferior de Chamartín, cada uno
      con sus siete trenes. En uno, la vía dice «BUS».
    place: Madrid Chamartín-Clara Campoamor
    author: Oier Lauzirika Zarrabeitia
    ownWork: true
    license: cc-by-sa-4.0
cover: chamartin-vestibulo-inferior
replica:
  id: mp-electronics-adif
stage: stub
---

Es el tablero de salidas y llegadas que se ve en las estaciones de largo
recorrido de ADIF, a menudo en grupo: en las grandes estaciones cuelgan
varios uno al lado del otro, o uno encima de otro, y cada uno sigue con los
trenes del anterior, como los dos del vestíbulo inferior de Chamartín. Lo fabricó [MP Electronics](../../fabricantes/mp-electronics/),
cuyo nombre aparece en una pequeña placa bajo los paneles. Sigue en servicio,
pero poco a poco lo sustituyen pantallas de vídeo.

## Cómo es

Bajo una cabecera verde con el título y el logotipo de adif, los rótulos
impresos de las columnas y siete filas de trenes. Cada fila no es una sola
pantalla, sino cinco paneles de LED separados, uno por columna:

| Columna | Caracteres | Ejemplo |
| --- | --- | --- |
| Hora | 5 | `10:45` |
| Destino o procedencia | 18 | `MADRID PTA. ATOCHA` |
| Tren | 13 | `IRYO    06110`, `A 03073/34073` |
| Vía | 4 | `   3`, `-` si aún no se sabe, `BUS` si el tren es un autobús |
| Observaciones | 14 | `ESTIMADO 15:41`, `CANCELADO` |

En el tren, el producto va a la izquierda y el número a la derecha. Cuando
dos trenes van acoplados se escriben los dos números, y del producto solo cabe
la primera letra.

Debajo, una fila más ancha da avisos que se desplazan de derecha a izquierda,
casi siempre en rojo; sin avisos, puede decir «SALIDAS/DEPARTURES».

## Los LED y la tipografía

Los LED son bicolores, rojos y verdes. Cada estación eligió su color para las
filas: ámbar (los dos encendidos) en Madrid, verde en Barcelona, rojo en la
Comunitat Valenciana.

Cada carácter ocupa 7 columnas y una en blanco, en paneles de 13 filas. Las
mayúsculas usan las 11 de abajo; las 2 de arriba son para la tilde de la Ñ.
Los trazos verticales tienen dos LED de grueso y los horizontales uno, y el
cero lleva una barra. Las vocales acentuadas se escriben en minúscula, con el
acento encima: «CASTELLó LA PLANA».

## Variantes

La cabecera cambia según la región: siempre en castellano y en inglés, y en
medio, si la hay, en la lengua cooficial (catalán, valenciano, euskera o
gallego). Con tres lenguas, los rótulos de las columnas ocupan tres líneas y
la franja que les deja el tablero es más alta. Unos tableros tienen la
cabecera toda verde y otros llevan el título en una pestaña gris claro. Los
más antiguos no tienen el logotipo de adif. En inglés, la última columna se
llama «REMARKS» en unos y «OBSERVATIONS» en otros.

## Averías

En las fotografías se ven paneles enteros apagados y, sobre todo, filas de LED
que no se encienden en un panel, que convierten «BARCELONA SANTS» en
«BARCFI ONNA SANTS». La réplica puede mostrar las dos cosas.

## La réplica

Está medida sobre fotografías y dibujada a escuadra. La tipografía se ha
reconstruido con la regla de los trazos descrita arriba: la L, la ó, la Ñ y
el cero se han leído punto por punto, y el resto puede diferir en detalles de
los reales. Las observaciones salen de los retrasos y las cancelaciones; los
textos libres de las estaciones («PLANTA BAJA», «ACCES 11:49H.») solo se
pueden escribir a mano.

## Lo que no se sabe

- **Los rótulos en euskera y en gallego.** La réplica usa las palabras
  habituales, pero no se han visto en ninguna fotografía.
- **Cuándo se instalaron**, y en qué estaciones hay o hubo.
- **Qué deciden las observaciones**: cuándo se dice «ESTIMADO» y cuándo
  «DEMORADO», y desde cuántos minutos de retraso.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
