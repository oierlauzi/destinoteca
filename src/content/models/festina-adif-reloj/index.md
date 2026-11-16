---
name: Reloj analógico de Festina para ADIF
summary: >-
  El reloj de agujas de muchas estaciones de ADIF: esfera blanca con el 12, el
  3, el 6 y el 9, una barra por minuto y la marca de Festina. La misma esfera
  va en cajas redondas de varios tamaños y en una grande cuadrada.
kind: clock
technologies:
  - analog
transportModes:
  - rail
manufacturers:
  - ref: festina
    role: manufacturer
operators:
  - ref: adif
    role: owner
countries:
  - es
status: in-service
variants:
  - id: redondo-pulido
    name: Redondo, con aro pulido
    description: El más frecuente, de distintos tamaños, colgado de un brazo o en la pared.
    replicaPreset: {}
  - id: redondo-azul
    name: Redondo, con piezas azules
    description: >-
      El aro pulido lleva piezas azules en las horas, solo en un tercio del
      aro, y el segundero es azul, como en Zaragoza-Delicias.
    replicaPreset:
      azul: true
      segundero: blue
  - id: redondo-oscuro
    name: Redondo, con aro oscuro
    replicaPreset:
      caja: dark
  - id: cuadrado
    name: Cuadrado
    description: >-
      Grande, en una caja negra cuadrada. Suele ir al lado de los tableros de
      salidas y llegadas de MP Electronics, o entre dos de ellos.
    replicaPreset:
      caja: square
installations:
  - site: es/zaragoza-delicias
    status: in-service
  - site: es/huesca
    status: in-service
photos:
  - id: reloj-cuadrado-2021
    src: ./reloj-cuadrado-2021.jpg
    alt: >-
      Un reloj Festina cuadrado y grande, de cerca, entre dos tableros de LED
      de adif.
    caption: El reloj cuadrado entre dos tableros, mayo de 2021.
    date: '2021-05-14'
    author: Un relojista
    sourceUrl: https://unrelojista.wordpress.com/wp-content/uploads/2021/05/img_20210514_163247.jpeg
    source: Un relojista
    license: rights-reserved-credited
  - id: reloj-cuatro-tableros-2026
    src: ./reloj-cuatro-tableros-2026.jpg
    alt: >-
      El acceso a las vías de alta velocidad de una estación, con controles
      de seguridad. Encima, un reloj Festina cuadrado entre cuatro tableros de
      salidas y llegadas.
    caption: Entre cuatro tableros de salidas y llegadas, enero de 2026.
    date: '2026-01-20'
    author: Agent Travel
    sourceUrl: https://agenttravel.es/Fotos/AVE%20Madrid%20Sevilla%2020ene26.jpg
    source: Agent Travel
    license: rights-reserved-credited
  - id: reloj-entre-tableros-2026
    src: ./reloj-entre-tableros-2026.jpg
    alt: >-
      Vestíbulo de una estación lleno de viajeros. Sobre el acceso a las vías,
      una fila de tableros de llegadas y de salidas con un reloj Festina
      cuadrado entre ellos.
    caption: En la fila de tableros de un vestíbulo, noviembre de 2026.
    date: '2026-11'
    author: El Mundo
    sourceUrl: https://e01-phantom-elmundo.uecdn.es/90003b1470ca7293765f921209945da9/crop/0x0/3072x2048/resize/828/f/jpg/assets/multimedia/imagenes/2026/11/09/17942568096223.jpg
    source: El Mundo
    license: rights-reserved-credited
cover: reloj-cuadrado-2021
replica:
  id: festina-adif
stage: stub
---

Es el reloj de agujas que se ve en muchas estaciones de
[ADIF](../../operadores/adif/), en el andén, en el vestíbulo o junto a los
paneles de información. La esfera y las agujas son siempre las mismas; lo que
cambia es el tamaño y la caja.

## Cómo es

La esfera es blanca y se ilumina por dentro. Solo lleva números en el 12, el
3, el 6 y el 9, gruesos y en un azul tan oscuro que parece negro, y una barra
por cada minuto, más ancha en las horas. Bajo las 12 va la marca de
[Festina](../../fabricantes/festina/).

Las agujas de las horas y de los minutos tienen la base maciza y la punta
dibujada solo en contorno, con la forma de una lanza en la de las horas. El
segundero es una varilla fina con un aro cerca de la punta; en Zaragoza-Delicias
es azul.

## Cajas

- **Redonda con aro pulido**, la más frecuente. El aro es metálico y refleja
  lo que tiene alrededor. Se ve en varios tamaños, colgada de un brazo con
  esfera por las dos caras o fijada a la pared. En algunas estaciones el aro
  lleva piezas azules en las horas, solo a lo largo de un tercio de su vuelta.
- **Redonda con aro oscuro.**
- **Cuadrada**, grande y negra. Suele colgar al lado de los
  [tableros de salidas y llegadas de MP Electronics](../mp-electronics-adif-teleindicador/),
  o entre dos de ellos.

No es el único reloj que Festina ha hecho para ADIF: hay otros modelos, que
todavía no están en el catálogo.

## Lo que no se sabe

- **Cuándo se instalaron.**
- **Cómo se mueven las agujas**: si cada reloj tiene su propio mecanismo de
  cuarzo o si obedecen a un reloj maestro, y si el segundero avanza a saltos
  o de forma continua.
- **Los tamaños** de las cajas.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
