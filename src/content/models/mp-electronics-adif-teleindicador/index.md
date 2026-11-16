---
name: Teleindicador LED de salidas y llegadas de MP Electronics para ADIF
summary: >-
  El tablero de salidas y llegadas de las estaciones de largo recorrido de
  ADIF: siete trenes en paneles de LED, con hora, destino o
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
variants:
  - id: castellano
    name: Castellano e inglés
    description: >-
      Cabecera toda verde y filas en ámbar, como en las estaciones de Madrid.
      Los rótulos de las columnas tienen dos líneas.
    replicaPreset: {}
  - id: catalan
    name: Castellano, catalán e inglés
    description: >-
      Título sobre una pestaña gris, filas en verde y observaciones en
      catalán, como en Barcelona Sants.
    replicaPreset:
      lengua: ca
      cabecera: tab
      color: '#5df08f'
  - id: valenciano
    name: Castellano, valenciano e inglés
    description: >-
      Con las filas en rojo, como se ha fotografiado en la Comunitat
      Valenciana.
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
    note: Vestíbulo inferior.
  - site: es/madrid-puerta-de-atocha
    status: in-service
  - site: es/barcelona-sants
    status: in-service
  - site: es/leon
    status: in-service
    note: Un tablero de llegadas, según la fuente de la fotografía.
photos:
  - id: chamartin-vestibulo-inferior
    src: ./chamartin-vestibulo-inferior.jpg
    alt: >-
      Dos tableros de salidas de adif, uno junto al otro, en lo alto de una
      pared blanca con el nombre de la estación, junto a un reloj.
    caption: Vestíbulo inferior de Madrid Chamartín-Clara Campoamor.
    place: Madrid Chamartín-Clara Campoamor
    author: Oier Lauzirika Zarrabeitia
    ownWork: true
    license: cc-by-sa-4.0
  - id: reloj-cuatro-tableros-2026
    src: ./reloj-cuatro-tableros-2026.jpg
    alt: >-
      El acceso a las vías de alta velocidad de una estación. Encima, cuatro
      tableros de salidas y llegadas, dos a cada lado de un reloj Festina.
    caption: Cuatro tableros de alta velocidad con un reloj Festina en medio, enero de 2026.
    date: '2026-01-20'
    author: Agent Travel
    sourceUrl: https://agenttravel.es/Fotos/AVE%20Madrid%20Sevilla%2020ene26.jpg
    source: Agent Travel
    license: rights-reserved-credited
  - id: reloj-entre-tableros-2026
    src: ./reloj-entre-tableros-2026.jpg
    alt: >-
      Vestíbulo de una estación lleno de viajeros, con una fila de tableros de
      llegadas y de salidas sobre el acceso a las vías.
    caption: Una fila de tableros de llegadas y de salidas, noviembre de 2026.
    date: '2026-11'
    author: El Mundo
    sourceUrl: https://e01-phantom-elmundo.uecdn.es/90003b1470ca7293765f921209945da9/crop/0x0/3072x2048/resize/828/f/jpg/assets/multimedia/imagenes/2026/11/09/17942568096223.jpg
    source: El Mundo
    license: rights-reserved-credited
cover: chamartin-vestibulo-inferior
references:
  - title: Sobre nosotros
    author: MP Electronics
    url: https://www.mpelectronics.es/sobre-nosotros/
    note: La historia de la empresa, que cita las estaciones de ADIF de Atocha, Sants y Chamartín entre sus grandes encargos.
replica:
  id: mp-electronics-adif
stage: stub
---

Es el tablero de salidas y llegadas que se ve en las estaciones de largo
recorrido de ADIF, a menudo en grupo: en las grandes estaciones cuelgan
varios uno al lado del otro, o uno encima de otro, y cada uno sigue con los
trenes del anterior. Entre ellos suele colgar un
[reloj Festina](../festina-adif-reloj/) cuadrado. Sigue en servicio, pero
poco a poco lo sustituyen pantallas de vídeo.

Lo fabricó [MP Electronics](../../fabricantes/mp-electronics/), de Palamós
(Girona), cuyo nombre aparece en una pequeña placa bajo los paneles. La
empresa cuenta las estaciones de ADIF de Atocha, Sants y Chamartín entre sus
grandes encargos.

## Cómo es

Bajo una cabecera verde con el título y el logotipo de adif, los rótulos
impresos de las columnas y siete filas de trenes. Cada fila no es una sola
pantalla, sino cinco paneles de LED separados, uno por columna:

| Columna | Caracteres |
| --- | --- |
| Hora | 5 |
| Destino o procedencia | 18 |
| Tren | 13 |
| Vía | 4 |
| Observaciones | 14 |

En el tren, el producto va a la izquierda y el número a la derecha. Cuando
dos trenes van acoplados se escriben los dos números, y del producto solo cabe
la primera letra.

Debajo, una fila más ancha da avisos que se desplazan de derecha a izquierda,
casi siempre en rojo; sin avisos, repite el título del tablero.

## La tipografía

Cada carácter ocupa 7 columnas y una en blanco, en paneles de 11 filas que
las mayúsculas llenan de arriba abajo. Los trazos verticales tienen dos LED de
grueso y los horizontales uno, y el cero lleva una barra. Como no queda sitio
para una tilde sobre una mayúscula, las vocales acentuadas y la eñe se
escriben en minúscula, con la tilde encima.

## Variantes

La cabecera cambia según la región: siempre en castellano y en inglés, y en
medio, si la hay, en la lengua cooficial (catalán, valenciano, euskera o
gallego); con tres lenguas, los rótulos de las columnas ocupan tres líneas en
lugar de dos. Unos tableros tienen la
cabecera toda verde y otros llevan el título en una pestaña gris claro. Los
más antiguos no tienen el logotipo de adif. El rótulo inglés de las
observaciones tampoco es el mismo en todos.

## Lo que no se sabe

- **Los rótulos en euskera y en gallego.** La réplica usa las palabras
  habituales, pero no se han visto en ninguna fotografía.
- **Cuándo se instalaron.** La historia de la empresa menciona estos
  encargos antes de los cambios de 2008, pero no da fechas; tampoco se sabe
  en qué año llegó cada estación, ni si alguno es un equipo anterior
  reformado.
- **En qué otras estaciones hay o hubo.**
- **Qué deciden las observaciones**: desde cuántos minutos de retraso se
  avisa, y cuándo se da la hora estimada y cuándo solo el retraso.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
