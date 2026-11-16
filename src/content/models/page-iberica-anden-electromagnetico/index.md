---
name: Teleindicador de andén electromagnético de PAGE Ibérica
alsoKnownAs:
  - Teleindicador flip-dot de Cercanías Madrid
summary: >-
  Cartel de andén de Renfe Cercanías Madrid, instalado desde mediados de los
  años noventa: una línea flip-dot de 16 caracteres para el destino y los
  minutos, y debajo una fila de LED para las paradas.
kind: platform-indicator
technologies:
  - flip-dot
  - led
transportModes:
  - rail
features:
  - scrolling-text
  - night-lighting
  - printed-legends
manufacturers:
  - ref: page-iberica
    role: integrator
  - ref: telenorma
    role: electronics
operators:
  - ref: renfe-cercanias-madrid
    role: operator
family: page-iberica-electromagneticos
countries:
  - es
years:
  from: 1996
  circa: true
status: retiring
components:
  - name: Línea de texto flip-dot
    designation: PI-T100-M
    description: >-
      Una línea de 16 caracteres de 5 × 7 puntos y 100 mm de altura, con su
      electrónica de control. Muestra el destino y los minutos.
    manufacturer: telenorma
  - name: Matriz de LED
    description: >-
      Fila de texto móvil bajo la línea flip-dot, para las paradas y los
      avisos. Modelo desconocido: no se conserva en la unidad estudiada.
  - name: Tubo fluorescente
    description: Ilumina el panel de noche. Tiene su propia alimentación de red.
  - name: Cristal serigrafiado
    description: Lleva los rótulos fijos «Vía», «Próxima Llegada» y «min.», y el logotipo de Cercanías.
installations:
  - site: es/mostoles
    status: unknown
    note: Fotografiado en servicio en 1997.
  - site: es/villalba
    status: unknown
    note: Fotografiado en servicio en 1997, montado sobre poste.
  - site: es/pitis
    to: 2026
    status: retired
    note: En servicio hasta 2026.
  - site: es/aravaca
    to: 2026
    status: retired
    note: Una unidad desmontada sobre el andén en junio de 2026.
  - site: es/mendez-alvaro
    line: C-5
    status: in-service
    note: Los únicos que se sabe que siguen en servicio a noviembre de 2026.
variants:
  - id: marquesina
    name: Colgado de la marquesina
    description: Suspendido sobre el andén, bajo la marquesina.
  - id: poste
    name: Sobre poste
    description: Montado en un poste, en andenes sin marquesina.
  - id: sin-numero-de-via
    name: Sin número de vía
    description: >-
      El número de vía es un vinilo que se añadía en cada instalación. Algunos
      carteles nunca lo recibieron y dicen solo «Vía».
    replicaPreset:
      via: ''
photos:
  - id: via-libre-1997
    src: ./via-libre-1997.jpg
    alt: >-
      Cartel de andén visto de cerca: «Vía 1» y «Próxima Llegada» en blanco
      sobre el cristal, el logotipo de Cercanías y, en puntos amarillos,
      «ATOCH-CHAMAR».
    caption: El cartel en servicio, tal como lo publicó *Vía Libre* en 1997.
    date: '1997'
    author: Vía Libre
    source: Revista Vía Libre, 1997
    license: rights-reserved-credited
  - id: mostoles-1997
    src: ./mostoles-1997.jpg
    alt: >-
      Andén de Móstoles lleno de viajeros junto a un tren de Cercanías. Sobre
      ellos, el cartel dice «Vía 1, FUENLABRADA, 1 min.» y la fila de LED roja
      está encendida.
    caption: Móstoles, 1997. Se ve encendida la fila de LED, que no se conserva en la unidad estudiada.
    date: '1997'
    place: Móstoles
    author: Publicación en Facebook
    sourceUrl: https://www.facebook.com/groups/574304876033372/permalink/4106013116195846/
    license: rights-reserved-credited
  - id: villalba-1997
    src: ./villalba-1997.jpg
    alt: >-
      Andén de la estación de Villalba con bancos rojos. A la derecha, un
      cartel montado sobre un poste dice «Vía 0, P.PIO-CHAMAR».
    caption: Villalba, 1997, en la variante sobre poste.
    date: '1997'
    place: Villalba
    author: Publicación en Facebook
    sourceUrl: https://www.facebook.com/groups/574304876033372/permalink/4097551237042034/
    license: rights-reserved-credited
  - id: anuncio-via-libre-1997
    src: ./anuncio-via-libre-1997.jpg
    alt: >-
      Anuncio de PAGE Ibérica, S.A.: su logotipo, una lista de actividades y la
      fotografía de un cartel que dice «Vía 1, ATOCH-T.CANT, 6 min.».
    caption: Anuncio de PAGE Ibérica en *Vía Libre*, marzo de 1997.
    date: '1997-03'
    author: PAGE Ibérica, S.A.
    source: Revista Vía Libre, marzo de 1997
    license: rights-reserved-credited
  - id: pitis-2026
    src: ./pitis-2026.jpg
    alt: >-
      Cartel colgado de la marquesina de Pitis que dice «Vía» sin número y
      «SI PARADA», con una letra perdida. En la vía, un tren de coches azules
      y amarillos y viajeros en el andén.
    caption: Pitis, 2026, unos meses antes de su retirada, junto al *Tren de los 80*. A «SIN PARADA» le falta una letra.
    date: '2026'
    place: Pitis
    author: Gonzalo Vázquez Hidalgo
    license: rights-reserved-credited
  - id: aravaca-2026
    src: ./aravaca-retired.jpg
    alt: >-
      Un cartel desmontado y apoyado en el suelo del andén de Aravaca, con el
      cristal suelto. Todavía se lee «Vía 2» y «LAS ROZAS».
    caption: Aravaca, junio de 2026. Ya sin alimentación, sigue mostrando el último destino que recibió.
    date: '2026-06'
    place: Aravaca
    author: '@David_82C'
    sourceUrl: https://x.com/David_82C/status/2069312279259062477
    license: rights-reserved-credited
  - id: unidad-preservada
    src: ./unidad-preservada.jpg
    alt: >-
      La línea flip-dot, sin el resto del cartel, colocada sobre una estantería
      de madera. Muestra «CHAMARTIN» y un 8 junto al rótulo «min.».
    caption: La línea PI-T100-M recuperada para el proyecto de ingeniería inversa, de nuevo en marcha.
    author: Oier Lauzirika Zarrabeitia
    ownWork: true
    sourceUrl: https://github.com/oierlauzi/renfe-flipdot-re
    license: cc-by-sa-4.0
cover: via-libre-1997
references:
  - title: renfe-flipdot-re. Ingeniería inversa de un teleindicador PAGE Ibérica PI-T100-M
    author: Oier Lauzirika Zarrabeitia
    date: '2026'
    url: https://github.com/oierlauzi/renfe-flipdot-re
    note: Descripción del equipo, del firmware y del panel a partir de una unidad recuperada. Fuente principal de esta ficha.
  - title: Teleindicadores de andén electromagnéticos
    publication: Vía Libre
    date: '1997-03'
    note: Apartado de un reportaje sobre la información al viajero en Cercanías, con declaraciones de José María Navarro, de PAGE Ibérica.
replica:
  id: page-iberica-anden-electromagnetico
  poster:
    text: CHAMARTIN
    min: 6
    via: 1
    led: 'PARA EN: ATOCHA'
stage: article
---

Durante treinta años, quien esperaba un tren en muchas estaciones de Cercanías
de Madrid miraba hacia este cartel: una caja negra colgada sobre el andén que
decía, en puntos amarillos, adónde iba el próximo tren y cuántos minutos
faltaban. Se instalaron desde mediados de los años noventa y se están
retirando a medida que se reforman las estaciones.

## Qué muestra

El cartel es un conjunto de varias piezas, cada una con su papel:

| Elemento | Contenido |
| --- | --- |
| Rótulos fijos en el cristal | «Vía», «Próxima Llegada» y «min.» |
| Número de vía | Un vinilo, colocado junto a «Vía» en cada instalación |
| Línea flip-dot | Destino del próximo tren y minutos que faltan |
| Fila de LED | Texto móvil con las estaciones en las que para, y avisos |
| Tubo fluorescente | Ilumina el panel de noche |

Como «min.» está impreso en el cristal y no dibujado con puntos, la línea se
compone con el destino a la izquierda y la cifra empujada al extremo derecho.
Es una convención de quien enviaba el texto, no algo que el cartel sepa.

El cartel, de hecho, no calcula nada. No formatea números ni lleva la cuenta
atrás: la línea completa de 16 caracteres le llegaba ya hecha desde un equipo
situado aguas arriba, que volvía a enviarla cada vez que cambiaba el minuto.

## La línea flip-dot: PI-T100-M

La designación PI-T100-M no corresponde al cartel entero, sino a la línea de
texto flip-dot que lleva dentro. Así lo dice la etiqueta de su chasis:

| Campo | Valor |
| --- | --- |
| Fabricante | PAGE Ibérica, S.A., Tres Cantos (Madrid) |
| Modelo | PI-T100-M |
| Función | MAESTRA |
| Descripción | «1 línea de texto. Módulos de PLACA MÓVIL de 100 mm» |

«Placa móvil» es el nombre que da la etiqueta a la tecnología
[flip-dot](../../tecnologias/flip-dot/). La línea tiene 16 caracteres; cada
uno es un módulo independiente de 5 puntos de ancho por 7 de alto y 100 mm de
altura, lo que suma 560 puntos. Los módulos van montados por parejas en ocho
placas portadoras.

Al cambiar el texto solo se redibujan los caracteres que han cambiado.

## Quién lo fabricó

[PAGE Ibérica](../../fabricantes/page-iberica/) firmaba el cartel, pero no lo
construyó entero. La electrónica y el panel flip-dot son de
[Telenorma](../../fabricantes/telenorma/), la empresa alemana heredera de
*Telefonbau und Normalzeit*, de Fráncfort: su logotipo está en la placa base y
en las placas portadoras del panel, y su etiqueta en la memoria EPROM. PAGE
Ibérica los integró en un cartel: la caja, el tubo fluorescente y la placa
exterior. Esa placa dice «FABRICADO», lo que encaja tanto con una fabricación
bajo licencia como con un montaje alrededor de piezas compradas.

El firmware apunta en la misma dirección. No es un programa hecho a medida para
RENFE, sino un terminal de visualización genérico, capaz de gobernar trece
tipos de panel distintos, que se eligen con unos interruptores.

La EPROM lleva una pegatina que dice `TELENORMA 18 JUN 96`: el firmware de la
unidad estudiada se grabó el 18 de junio de 1996. El resto de marcas de la
unidad coincide en una fabricación de mediados de los noventa.

## Dónde se instaló

En marzo de 1997 la revista *Vía Libre* dedicó un reportaje a la información
al viajero en Cercanías, con un apartado titulado «Teleindicadores de andén
electromagnéticos». En él José María Navarro, de PAGE Ibérica, describe el
cartel:

> En los andenes anuncia en un panel, con una línea de excitación
> electromagnética, qué tren va a llegar y cuántos minutos falta para su
> detención en la parada, y en otra línea de texto móvil, de diodos,
> información sobre las estaciones sucesivas donde el tren va a tener las
> siguientes paradas.

Según ese reportaje, el sistema de PAGE Ibérica estaba instalado en las líneas
C-5 (Móstoles, Atocha, Fuenlabrada), C-8 (Atocha, Villalba) y C-10 (Villalba,
Príncipe Pío, Atocha, Chamartín), y se estaba instalando en la C-4 y la C-1.
Era un sistema de Madrid: en otras ciudades los suministradores eran otros,
como AEG-Matra en Málaga y Valencia, Electrans en Barcelona o Ikusi en Bilbao.

El mismo reportaje cuenta de dónde salían los datos. Venían del control de
tráfico centralizado; si ese enlace fallaba, el sistema podía gobernarse desde
el centro de control de Cercanías o desde el ordenador instalado en cada
estación. Los enlaces iban por cuadretes telefónicos y fibra óptica, y todos
los componentes se describían como comerciales, comprados en el mercado para
facilitar el mantenimiento.

El montaje variaba según la estación: bajo la marquesina o sobre un poste. El
número de vía era un vinilo que no todas las estaciones recibieron, y algunos
carteles pasaron toda su vida útil diciendo «Vía» y nada más.

## Curiosidades

**Los corazones.** Hacia el final los carteles fallaban a menudo, sobre todo en
las comunicaciones: caracteres perdidos o equivocados eran una imagen corriente
en el andén. Un fallo era especialmente reconocible: un corazón en mitad del
destino. El juego de caracteres del cartel tiene un corazón en la posición
`0x03`, y `0x03` es también el byte con el que el firmware marca el final del
mensaje.

**La eñe duplicada.** El juego de caracteres es el CP437 de los primeros PC,
con un cambio: la `ñ` y la `Ñ` están repetidas en las posiciones `0x24` y
`0x25`, donde deberían estar `$` y `%`. Así sobreviven a un enlace serie de
siete bits.

**El último mensaje.** Los puntos flip-dot son mecánicos y conservan su
posición sin corriente. Un cartel desmontado sigue mostrando el último destino
que recibió, como el de Aravaca de la fotografía.

**El barrido de arranque.** Al dar tensión, un zumbido recorre el panel de un
extremo a otro: todos los puntos se llevan a negro, por grupos.

**Legible de día.** El panel se lee con luz natural sin iluminación propia. El
tubo fluorescente solo es una luz de lectura para la noche.

## Retirada

Los carteles se desmontan a medida que se reforman las estaciones. El de Pitis
seguía en su sitio en 2026, pocos meses antes de su retirada; en junio de ese
año se fotografió otro ya desmontado en el andén de Aravaca. A noviembre de
2026, los únicos que se sabe que siguen en servicio están en Méndez Álvaro, en
la línea C-5.

Una unidad de la línea PI-T100-M se ha recuperado y documentado en el proyecto
[renfe-flipdot-re](https://github.com/oierlauzi/renfe-flipdot-re), que describe
su electrónica, su firmware y el protocolo serie con el que se le envía texto.
De su memoria salen los caracteres que usa la réplica de esta página.
