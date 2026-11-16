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
components:
  - name: Esfera
    description: >-
      Blanca e iluminada por dentro, con números solo en el 12, el 3, el 6 y el
      9, una barra por cada minuto, más ancha en las horas, y la marca de
      Festina bajo las 12. La tinta es de un azul muy oscuro.
  - name: Agujas
    description: >-
      La de las horas y la de los minutos tienen la base maciza y la punta
      dibujada solo en contorno. El segundero es fino y lleva un aro cerca de
      la punta; en algunos es azul.
  - name: Caja
    description: >-
      Redonda, con un aro pulido que refleja lo que tiene alrededor, a veces
      con piezas azules en un tercio del aro; redonda con un aro oscuro; o cuadrada y
      negra. Las redondas cuelgan a menudo de un brazo, con esfera por las dos
      caras.
variants:
  - id: redondo-pulido
    name: Redondo, con aro pulido
    description: El más frecuente, de distintos tamaños, colgado de un brazo o en la pared.
    replicaPreset: {}
  - id: redondo-azul
    name: Redondo, con piezas azules
    description: >-
      El aro pulido lleva piezas azules en las horas, solo en un tercio del
      aro, como en Zaragoza-Delicias.
    replicaPreset:
      azul: true
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

## La réplica

Muestra la hora de la estación, así que coincide con cualquier panel de la
misma página, y con la fuente manual se puede poner a la hora que se quiera,
en marcha o parada. Las proporciones de la esfera y la forma de las agujas
están medidas sobre fotografías; la marca de Festina es un calco vectorial de
su logotipo.

## Lo que no se sabe

- **Cuándo se instalaron.** No antes de 2005, cuando se creó ADIF.
- **Cómo se mueven las agujas**: si cada reloj tiene su propio mecanismo de
  cuarzo o si obedecen a un reloj maestro, y si el segundero avanza a saltos
  o de forma continua.
- **Los tamaños** de las cajas.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
