---
name: Teleindicadores electromagnéticos de PAGE Ibérica para Renfe Cercanías Madrid
summary: >-
  Los carteles flip-dot que PAGE Ibérica instaló en Cercanías Madrid desde
  1994, con electrónica de Telenorma: carteles de andén con el próximo tren y
  sus minutos, y paneles de vestíbulo de varias filas, gobernados desde el
  control de tráfico centralizado.
manufacturers:
  - page-iberica
  - telenorma
cover: page-iberica-anden-electromagnetico
aliases:
  - page-iberica-electromagneticos
references:
  - title: renfe-flipdot-re. Ingeniería inversa de un teleindicador PAGE Ibérica PI-T100-M
    author: Oier Lauzirika Zarrabeitia
    date: '2026'
    url: https://github.com/oierlauzi/renfe-flipdot-re
    note: La electrónica, el firmware, el juego de caracteres y el protocolo de una línea recuperada de un cartel de andén.
  - title: Cercanías
    publication: Vía Libre
    date: '1994-10'
    note: Breve sobre la instalación piloto de PAGE Ibérica en los andenes de la línea C-5, entre Embajadores y Móstoles-El Soto.
  - title: Un sistema de información basado en teleindicadores
    publication: Vía Libre
    date: '1996-12'
    note: Recuadro sobre los teleindicadores del Pasillo Verde, sin nombre de fabricante.
  - title: Teleindicadores de andén electromagnéticos
    publication: Vía Libre
    date: '1997-03'
    note: Apartado de un reportaje sobre la información al viajero en Cercanías, con declaraciones de José María Navarro, de PAGE Ibérica. El mismo dossier da los nueve minutos con que aparece el tren en los carteles.
---

Durante treinta años, quien esperaba un tren en muchas estaciones de
Cercanías de Madrid miraba hacia uno de estos carteles: una caja colgada sobre
el andén que decía, en puntos flip-dot, adónde iba el próximo tren y cuántos
minutos faltaban. Los instaló [PAGE Ibérica](../../fabricantes/page-iberica/)
desde 1994, con electrónica de [Telenorma](../../fabricantes/telenorma/), y se
retiran a medida que se reforman las estaciones.

Casi todos comparten el mismo lenguaje: caja negra, rótulos blancos fijos,
texto en puntos flip-dot de 5 × 7 y una fila de LED roja para el texto que se
mueve. Los de Atocha Cercanías, de caja gris, son la excepción.

## Los carteles

Se han visto en servicio estos montajes:

- **Cartel de andén de una cara**, con una línea de 16 caracteres y una fila
  de LED debajo. Es el
  [teleindicador de andén](../../catalogo/page-iberica-anden-electromagnetico/),
  el más extendido.
- **Cartel de andén de matriz continua**, una
  [versión posterior](../../catalogo/page-iberica-anden-continuo/) con la
  misma caja, una matriz flip-dot continua iluminada por LED y la hora de
  salida en lugar de los minutos. Solo se conoce en Alcalá de Henares, ya
  retirado.
- **Cartel de andén sin fila de LED**, el
  [mismo cartel reducido a su línea flip-dot](../../catalogo/page-iberica-anden-sin-led/),
  con los minutos y el «min.» pero sin más rótulos. Visto en Vallecas.
- **Cartel de andén de dos vías**, con
  [dos carteles en una caja](../../catalogo/page-iberica-anden-dos-vias/), uno
  encima del otro, cada uno con su vía, su línea flip-dot y su fila de LED.
- **Cartel de andén de dos caras**, para andenes centrales. Todavía no tiene
  ficha propia.
- **Los carteles de Atocha Cercanías**, de caja gris y con la placa de PAGE
  bajo la pantalla. Sus líneas flip-dot son matrices continuas iluminadas por
  LED, con una tipografía de trazo fino: el
  [teleindicador de andén](../../catalogo/page-iberica-anden-atocha/), con un
  panel LED bicolor de dos líneas debajo; el de
  [acceso a andén](../../catalogo/page-iberica-acceso-anden-atocha/), con una
  fila de LED roja; el [panel de la pasarela](../../catalogo/page-iberica-pasarela-atocha/),
  con dos pantallas de cinco líneas, y el antiguo panel del vestíbulo, ya
  retirado, con columnas para Cercanías y para Largo Recorrido y Regionales,
  que todavía no tiene ficha: está
  [por documentar](../../pendientes/#panel-del-vestíbulo-de-atocha-cercanías).
  Sustituyeron a unos [carteles de cristal líquido de Ikusi](../../catalogo/ikusi-anden-atocha/).
- **Paneles de vestíbulo**, que apilan de dos a cuatro filas de 20 caracteres
  para anunciar los trenes de toda la estación: el de
  [dos líneas](../../catalogo/page-iberica-vestibulo-2-lineas/), visto en Tres
  Cantos y en Delicias, y el de [cuatro líneas](../../catalogo/page-iberica-vestibulo-4-lineas/),
  visto en Cantoblanco y en Pinar de las Rozas.

## Dónde se instalaron

La primera noticia es de octubre de 1994. *Vía Libre* contaba entonces que
los viajeros de la línea C-5 veían ya, en paneles teleindicadores instalados
en los andenes de las estaciones entre Embajadores y Móstoles-El Soto,
cuántos minutos faltaban para el próximo tren, su destino y sus paradas. La
revista lo presentaba como una instalación piloto de Cercanías, desarrollada,
instalada y puesta a punto por PAGE Ibérica.

En diciembre de 1996, *Vía Libre* describía el sistema de teleindicadores del
Pasillo Verde, abierto ese año con las estaciones de Delicias y Méndez Álvaro,
como un sistema «que ya funcionaba en las líneas C-5 y C-4». No nombra a su
fabricante.

En marzo de 1997, según un reportaje de la misma revista, el sistema de PAGE
Ibérica estaba instalado en las líneas C-5 (Móstoles, Atocha, Fuenlabrada),
C-8 (Atocha, Villalba) y C-10 (Villalba, Príncipe Pío, Atocha, Chamartín), y
se estaba instalando en la C-4 (Atocha, Parla) y la C-1 (Tres Cantos, Atocha,
Alcalá de Henares). Era un sistema de Madrid: en otras ciudades los
suministradores eran otros, como AEG-Matra en Málaga y Valencia, Electrans en
Barcelona o Ikusi en Bilbao.

## Cómo funcionaba

Los datos venían del control de tráfico centralizado, que conoce la posición
de cada tren por la señalización y enviaba a cada andén lo que le
correspondía; el corazón del sistema estaba en la sala de pantallas de
Madrid-Atocha. Si ese enlace fallaba, el sistema podía gobernarse desde el
centro de control de Cercanías o desde el ordenador instalado en cada
estación. Los enlaces iban por cuadretes telefónicos y fibra óptica, y todos
los componentes se describían como comerciales, comprados en el mercado para
facilitar el mantenimiento.

Un tren aparecía en los carteles cuando faltaban nueve minutos para su
llegada, y la megafonía automática lo anunciaba cuando faltaba uno.

Los carteles no calculan nada. La línea recuperada de un cartel de andén
recibe su texto ya compuesto por un enlace serie RS-422, y es el equipo de
aguas arriba el que vuelve a enviarlo cada vez que cambia el minuto.

## Quién los hizo

PAGE Ibérica firmaba los carteles, pero no los construyó enteros. En la línea
recuperada de un [cartel de andén](../../catalogo/page-iberica-anden-electromagnetico/),
la electrónica y el panel flip-dot son de Telenorma, la empresa alemana
heredera de *Telefonbau und Normalzeit*, de Fráncfort: su logotipo está en la
placa base y en las placas portadoras del panel, y su etiqueta en la memoria
EPROM. PAGE Ibérica los integró en un cartel: la caja, el tubo fluorescente y
la placa exterior. Esa placa dice «FABRICADO», lo que encaja tanto con una
fabricación bajo licencia como con un montaje alrededor de piezas compradas.

El firmware apunta en la misma dirección. No es un programa hecho a medida
para RENFE, sino un terminal de visualización genérico, capaz de gobernar
trece tipos de panel distintos, que se eligen con unos interruptores. Encaja
con que el ancho de la línea cambie de un miembro a otro de la familia: 16
caracteres en el cartel de andén y 20 en los paneles de vestíbulo.

## Las líneas flip-dot

Cada carácter es un módulo independiente de 5 puntos de ancho por 7 de alto y
100 mm de altura, de «placa móvil», como llama la etiqueta de la línea a la
tecnología [flip-dot](../../tecnologias/flip-dot/). Al cambiar el texto solo
se redibujan los caracteres que han cambiado.

La línea se lee con luz natural sin iluminación propia. Un tubo fluorescente
debajo de cada línea la alumbra de noche, y por eso las líneas de los paneles
de vestíbulo están tan separadas.

## Curiosidades

**Los corazones.** Hacia el final los carteles fallaban a menudo, sobre todo en
las comunicaciones: caracteres perdidos o equivocados eran una imagen corriente
en el andén. Un fallo era especialmente reconocible: un corazón en mitad del
destino. El juego de caracteres tiene un corazón en la posición `0x03`, y
`0x03` es también el byte con el que el firmware marca el final del mensaje.

**La eñe duplicada.** El juego de caracteres es el CP437 de los primeros PC,
con un cambio pensado para enlaces serie de 7 bits. En CP437 la `ñ` y la `Ñ`
están en las posiciones `0xA4` y `0xA5`. Un enlace de 7 bits no transmite el
bit más significativo, así que esos dos códigos llegan convertidos en `0x24` y
`0x25`, que en CP437 son `$` y `%`. Para que la eñe se lea bien también en ese
caso, la línea tiene dibujadas una `ñ` y una `Ñ` en esas dos posiciones, en
lugar de `$` y `%`, además de las que ya tiene en su sitio. La fila de LED del
[panel de cuatro líneas de Pinar de las Rozas](../../catalogo/page-iberica-vestibulo-4-lineas/#la-eñe-que-sale-como-q)
no tenía ese arreglo, y allí la eñe salía como una Q.

**El último mensaje.** Los puntos flip-dot son mecánicos y conservan su
posición sin corriente. Un cartel desmontado sigue mostrando el último destino
que recibió.

## Retirada

Los carteles se desmontan a medida que se reforman las estaciones. A noviembre
de 2026, los únicos que se sabe que siguen en servicio son los carteles de
andén de Méndez Álvaro y los de caja gris de Atocha Cercanías.

Si tienes fotografías o documentación de cualquiera de ellos, [puedes aportarlas](../../contribuir/).
