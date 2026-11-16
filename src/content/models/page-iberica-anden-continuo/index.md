---
name: Teleindicador electromagnético de andén de PAGE Ibérica, matriz continua
summary: >-
  Versión posterior del cartel de andén de Cercanías Madrid: la misma caja,
  pero con una matriz flip-dot continua iluminada por LED, una tipografía
  gruesa y proporcional, y la hora de salida en lugar de los minutos.
kind: platform-indicator
technologies:
  - flip-dot
  - led
transportModes:
  - rail
features:
  - scrolling-text
  - printed-legends
manufacturers:
  - ref: page-iberica
    role: integrator
operators:
  - ref: renfe-cercanias-madrid
    role: operator
family: page-iberica-electromagneticos
countries:
  - es
status: retired
components:
  - name: Matriz flip-dot continua
    description: >-
      Una sola matriz de 7 filas de puntos, sin módulos separados por
      carácter. Junto a cada punto, en la esquina inferior derecha, hay un LED
      que lo ilumina.
  - name: Matriz de LED
    description: Fila de texto móvil bajo la matriz flip-dot, como en la versión anterior.
  - name: Rótulos fijos
    description: >-
      El logotipo de Cercanías y «Vía» con el número del andén. No lleva
      «Próxima Llegada» ni «min.».
installations:
  - site: es/alcala-de-henares
    status: retired
    note: El único lugar donde se conoce esta versión. Fotografiados los de las vías 1, 2 y 4; ya retirados.
photos:
  - id: alcala-via-2
    src: ./alcala-via-2.jpg
    alt: >-
      Cartel colgado de la marquesina de un andén de Alcalá de Henares, con
      trenes de Cercanías al fondo. Dice «Vía 2» y, en la matriz flip-dot,
      «CHAMARTIN» a la izquierda y «10:12» a la derecha.
    caption: Alcalá de Henares. En lugar de los minutos que faltan, la hora de salida.
    place: Alcalá de Henares
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/H5NzRqnCifdzj52T7
    source: Google Maps
    license: rights-reserved-credited
  - id: alcala-via-1
    src: ./alcala-via-1.jpg
    alt: >-
      Cartel colgado de la marquesina de un andén, sobre un tren de Cercanías
      que pasa en primer plano, movido. Dice «Vía 1» y, en la matriz flip-dot,
      «GUADALAJARA» en puntos amarillos verdosos.
    caption: Vía 1, con un tren hacia Guadalajara. Publicada por la Cadena SER en mayo de 2019.
    place: Alcalá de Henares
    author: SER Guadalajara
    sourceUrl: https://cadenaser.com/emisora/2019/05/09/ser_guadalajara/1557400293_287651.html
    source: Cadena SER
    license: rights-reserved-credited
  - id: alcala-via-4
    src: ./alcala-via-4.jpg
    alt: >-
      Cartel colgado bajo la marquesina de Alcalá de Henares, junto a un reloj
      de estación, sobre un andén lleno de gente y de personal de seguridad. Dice
      «Vía 4» y «SIN SERVICIO» en puntos amarillos verdosos; la fila de LED
      está apagada.
    caption: Vía 4, fuera de servicio tras un accidente. Cada letra ocupa una anchura distinta.
    place: Alcalá de Henares
    author: Dream Alcalá
    sourceUrl: https://www.dream-alcala.com/accidente-tren-la-estacion-renfe-alcala-henares/
    source: Dream Alcalá
    license: rights-reserved-credited
cover: alcala-via-2
replica:
  id: page-iberica-anden-continuo
  poster:
    text: CHAMARTIN
    hora: '10:12'
    via: 2
stage: stub
---

Es una versión posterior del
[teleindicador de andén](../page-iberica-anden-electromagnetico/) de la misma
familia, que solo se conoce en Alcalá de Henares, donde ya se ha retirado. Conserva la caja, el logotipo de Cercanías, el vinilo con el número
de vía y la fila de LED roja de debajo, pero cambia casi todo lo demás.

## Qué cambia

| | Versión anterior | Esta versión |
| --- | --- | --- |
| Línea flip-dot | 16 módulos de carácter separados, de 5 × 7 puntos | Una sola matriz continua de 7 filas |
| Iluminación | Un tubo fluorescente bajo la línea | Un LED en la esquina inferior derecha de cada punto |
| Tipografía | 5 × 7, de ancho fijo | Gruesa, con trazos de dos puntos, y de ancho variable |
| A la derecha | Los minutos que faltan, junto a un «min.» fijo | La hora de salida |
| Rótulos | «Vía», «Próxima Llegada» y «min.» | Solo «Vía» |

## La tipografía

Las letras tienen entre 4 y 7 puntos de ancho (la I y el 1 son estrechos; la
D, la M, la S y la V, anchos) y se separan por una columna en blanco. Las que
aparecen en fotografías (A, C, D, E, G, H, I, J, L, M, N, O, R, S, T y V, los
dígitos 0, 1 y 2 y los dos puntos) se han copiado punto por punto en la
réplica; el resto se han dibujado en el mismo estilo y pueden no coincidir con
las reales.

## Lo que no se sabe

- **El ancho exacto de la matriz.** La réplica supone 96 columnas: el mismo
  paso de punto que los módulos de la versión anterior a lo largo del mismo
  ancho. Encaja con «CHAMARTIN 10:12», pero en la fotografía de «SIN SERVICIO»
  el texto ocupa casi toda la matriz, lo que apuntaría a menos columnas.
- **Qué mostraba la fila de LED.** Está apagada en todas las fotografías.
- **Cuándo se instalaron y cuándo se retiraron**, y si hubo más en otras estaciones.

Si tienes más fotografías o datos, [puedes aportarlos](../../contribuir/).
