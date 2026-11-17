---
name: Reloj redondo de Festina para ADIF
alsoKnownAs:
  - Reloj analógico de Festina para ADIF
summary: >-
  El reloj de agujas de muchas estaciones de ADIF: esfera blanca con el 12, el
  3, el 6 y el 9, una barra por minuto y la marca de Festina, en una caja
  redonda de varios tamaños.
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
cambia es el tamaño y el aro. La misma esfera va también en un
[reloj grande y cuadrado](../festina-adif-reloj-cuadrado/), sin segundero.

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

No es el único reloj que Festina ha hecho para ADIF: hay otros modelos, que
todavía no están en el archivo.

## Lo que no se sabe

- **Cuándo se instalaron.**
- **Cómo se mueven las agujas**: si cada reloj tiene su propio mecanismo de
  cuarzo o si obedecen a un reloj maestro, y si el segundero avanza a saltos
  o de forma continua.
- **Los tamaños** de las cajas.

Si tienes fotografías o datos, [puedes aportarlos](../../contribuir/).
