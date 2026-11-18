---
name: Teleindicador electromagnético de andén de PAGE Ibérica
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
families:
  - page-iberica-electromagneticos-cercanias-madrid
countries:
  - es
status: retiring
locations:
  - site: es/embajadores
    line: C-5
    status: retired
    note: Colgado del techo del andén subterráneo. Fotografiado en 1994, la fotografía más antigua que se conoce del cartel.
  - site: es/mostoles
    status: retired
    note: Fotografiado en servicio en 1997.
  - site: es/villalba
    status: retired
    note: Fotografiado en servicio en 1997, montado sobre poste.
  - site: es/pitis
    to: 2026
    status: retired
    note: En servicio hasta 2026.
  - site: es/aravaca
    to: 2026
    status: retired
    note: Una unidad desmontada sobre el andén en junio de 2026.
  - site: es/tres-cantos
    line: C-4
    status: retired
    note: Sobre postes, uno por vía, con un reloj entre ambos. Ya no están. En el vestíbulo hubo un panel de dos líneas de la misma familia.
  - site: es/cantoblanco
    line: C-4
    status: retired
    note: Ya no están. En el vestíbulo hubo un panel de cuatro líneas de la misma familia.
  - site: es/el-goloso
    line: C-4
    status: retired
    note: Sobre postes, uno por vía, con un reloj entre ambos.
  - site: es/delicias
    status: retired
    note: Uno por andén, colgados de la marquesina. Fotografiados en servicio en 2016.
  - site: es/cercedilla
    status: retired
  - site: es/los-molinos
    status: retired
  - site: es/collado-mediano
    status: retired
  - site: es/galapagar
    status: retired
    note: Sobre poste.
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
    description: >-
      Montado en un poste, en andenes sin marquesina. En El Goloso y Tres
      Cantos van por parejas, uno por vía, con un reloj de estación entre
      ambos.
  - id: sin-numero-de-via
    name: Sin número de vía
    description: >-
      El número de vía es un vinilo que se añadía en cada instalación. Algunos
      carteles nunca lo recibieron y dicen solo «Vía».
    replicaPreset:
      via: ''
  - id: proximo-tren
    name: Con «Próximo tren»
    description: >-
      Algunos carteles, como el de Cercedilla, llevan en la cabecera «Próximo
      tren» en lugar de «Próxima Llegada».
    replicaPreset:
      rotulo: tren
photos:
  - id: embajadores-1994
    src: ./embajadores-1994.jpg
    alt: >-
      Andén subterráneo de Embajadores, iluminado por tubos fluorescentes. Dos
      hombres posan bajo un cartel colgado del techo; al otro lado de las vías,
      el andén de enfrente.
    caption: Embajadores, vía 1, 1994. Es la fotografía más antigua que se conoce del cartel.
    date: '1994'
    place: Embajadores
    author: Luna
    sourceUrl: https://archivo.docutren.com/uploads/r/fototeca-2/b/4/d/b4d9092e28e7aad9d450c75629425407861f58b38ce70a3a875cbf7a292ef060/FD_05782_141.jpg
    source: Fototeca de la Fundación de los Ferrocarriles Españoles, FD_05782
    license: rights-reserved-credited
  - id: via-libre-1997
    src: ./via-libre-1997.jpg
    alt: >-
      Cartel de andén visto de cerca, con sus rótulos blancos, el logotipo de
      Cercanías y la línea flip-dot encendida.
    caption: El cartel en servicio, tal como lo publicó *Vía Libre* en 1997.
    date: '1997'
    author: Vía Libre
    source: Revista Vía Libre, 1997
    license: rights-reserved-credited
  - id: mostoles-1997
    src: ./mostoles-1997.jpg
    alt: >-
      Andén de Móstoles lleno de viajeros junto a un tren de Cercanías, con el
      cartel encima.
    caption: Móstoles, 1997. Se ve encendida la fila de LED, que no se conserva en la unidad estudiada.
    date: '1997'
    place: Móstoles
    author: Publicación en Facebook
    sourceUrl: https://www.facebook.com/groups/574304876033372/permalink/4106013116195846/
    license: rights-reserved-credited
  - id: villalba-1997
    src: ./villalba-1997.jpg
    alt: >-
      Andén de la estación de Villalba con bancos rojos y, a la derecha, un
      cartel montado sobre un poste.
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
      fotografía de un cartel de andén.
    caption: Anuncio de PAGE Ibérica en *Vía Libre*, marzo de 1997.
    date: '1997-03'
    author: PAGE Ibérica, S.A.
    source: Revista Vía Libre, marzo de 1997
    license: rights-reserved-credited
  - id: pitis-2026
    src: ./pitis-2026.jpg
    alt: >-
      Cartel colgado de la marquesina de Pitis. En la vía, un tren de coches
      azules y amarillos y viajeros en el andén.
    caption: Pitis, 2026, unos meses antes de su retirada, junto al *Tren de los 80*.
    date: '2026'
    place: Pitis
    author: Gonzalo Vázquez Hidalgo
    license: rights-reserved-credited
  - id: aravaca-2026
    src: ./aravaca-retired.jpg
    alt: >-
      Un cartel desmontado y apoyado en el suelo del andén de Aravaca, con el
      cristal suelto.
    caption: Aravaca, junio de 2026. Ya sin alimentación, sigue mostrando el último destino que recibió.
    date: '2026-06'
    place: Aravaca
    author: '@David_82C'
    sourceUrl: https://x.com/David_82C/status/2069312279259062477
    license: rights-reserved-credited
  - id: unidad-preservada
    src: ./unidad-preservada.jpg
    alt: >-
      La línea flip-dot, sin el resto del cartel, encendida sobre una
      estantería de madera.
    caption: La línea PI-T100-M recuperada para el proyecto de ingeniería inversa, de nuevo en marcha.
    author: Oier Lauzirika Zarrabeitia
    ownWork: true
    sourceUrl: https://github.com/oierlauzi/renfe-flipdot-re
    license: cc-by-sa-4.0
  - id: cantoblanco-noche-2017
    src: ./cantoblanco-anden-2.jpg
    alt: >-
      Cartel de andén de Cantoblanco Universidad de noche, colgado de la
      marquesina, con la fila de LED encendida.
    caption: Cantoblanco Universidad, diciembre de 2017.
    date: '2017-12'
    place: Cantoblanco Universidad
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/SHmHdnw9mZWJQ2ceA
    source: Google Maps
    license: rights-reserved-credited
  - id: cantoblanco-2023
    src: ./cantoblanco-anden-1.jpg
    alt: >-
      Andén de Cantoblanco Universidad un día soleado. Bajo la marquesina
      cuelga un cartel; las vías y el andén se pierden al fondo.
    caption: Cantoblanco Universidad, septiembre de 2023.
    date: '2023-09'
    place: Cantoblanco Universidad
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/dSHDW57rH9D2dCTV7
    source: Google Maps
    license: rights-reserved-credited
  - id: el-goloso
    src: ./el-goloso-anden.jpg
    alt: >-
      Andén de El Goloso a pleno sol: dos carteles sobre postes, con un reloj
      de estación entre ambos.
    caption: "El Goloso: un cartel por vía, sobre postes, con el reloj de la estación en medio."
    place: El Goloso
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/8u8ANUAXZNPJ1wGW9
    source: Google Maps
    license: rights-reserved-credited
  - id: tres-cantos-nieve-2021
    src: ./tres-cantos-anden.jpg
    alt: >-
      Andén de Tres Cantos cubierto de nieve bajo un cielo despejado: dos
      carteles sobre postes, con un reloj entre ambos, y edificios de viviendas
      a la izquierda.
    caption: Tres Cantos, enero de 2021, tras una gran nevada. También aquí, un cartel por vía con el reloj en medio.
    date: '2021-01'
    place: Tres Cantos
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/9JGHJGjsfDJ6J5rG6
    source: Google Maps
    license: rights-reserved-credited
  - id: delicias-2016
    src: ./delicias-2016.jpg
    alt: >-
      La estación de Delicias vista desde una pasarela, con un tren de
      Cercanías en la vía 2 y marquesinas rojas onduladas sobre los andenes.
      Dos carteles encendidos, uno por andén, con sus filas de LED.
    caption: "Delicias, marzo de 2016: los carteles de los dos andenes."
    date: '2016-03-05'
    place: Delicias
    author: Malopez 21
    sourceUrl: https://commons.wikimedia.org/wiki/File:Estaci%C3%B3n_de_Delicias_(Cercan%C3%ADas_Madrid),_andenes.JPG
    source: Wikimedia Commons
    license: cc-by-sa-4.0
  - id: cercedilla
    src: ./cercedilla-anden.jpg
    alt: >-
      Andén de Cercedilla junto a un tren de Cercanías, con un cartel sobre
      poste y el edificio de la estación al fondo.
    caption: Cercedilla, octubre de 2022.
    date: '2022-10'
    place: Cercedilla
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/4XuWXL4N5oVgrRrY9
    source: Google Maps
    license: rights-reserved-credited
  - id: los-molinos
    src: ./los-molinos-anden.jpg
    alt: >-
      El andén de Los Molinos junto al edificio de la estación, con un cartel
      al fondo.
    caption: Los Molinos, agosto de 2017.
    date: '2017-08'
    place: Los Molinos
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/6cyyfnfLU3qHJVqU7
    source: Google Maps
    license: rights-reserved-credited
  - id: collado-mediano
    src: ./collado-mediano-anden.jpg
    alt: >-
      Un cartel sobre poste en el andén de Collado Mediano, apagado, en un día
      nublado.
    caption: Collado Mediano, enero de 2020.
    date: '2020-01'
    place: Collado Mediano
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/sXeBukT8xyDEJcEH6
    source: Google Maps
    license: rights-reserved-credited
  - id: galapagar
    src: ./galapagar-anden.jpg
    alt: >-
      Un cartel sobre poste en el andén de Galapagar-La Navata, un día de cielo
      despejado.
    caption: Galapagar-La Navata.
    place: Galapagar-La Navata
    author: Usuario de Google Maps
    sourceUrl: https://maps.app.goo.gl/ZfKrVdkBpczTezoz9
    source: Google Maps
    license: rights-reserved-credited
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
    note: Apartado de un reportaje sobre la información al viajero en Cercanías, con la descripción del cartel por José María Navarro, de PAGE Ibérica.
replica:
  id: page-iberica-anden-electromagnetico
  poster:
    text: CHAMARTIN
    min: 6
    via: 1
    led: 'PARA EN: ATOCHA'
stage: article
---

Es el cartel de andén más extendido de los
[teleindicadores electromagnéticos de PAGE Ibérica para Renfe Cercanías Madrid](../../familias/page-iberica-electromagneticos-cercanias-madrid/):
una caja negra colgada sobre el andén, con el destino del próximo tren y los
minutos que faltan en una línea flip-dot de 16 caracteres y sus paradas en una
fila de LED debajo. La fotografía más antigua que se conoce es de 1994, en
Embajadores, el año de la instalación piloto de la línea C-5.

De él salieron otros carteles de la familia: una
[versión con matriz continua](../page-iberica-anden-continuo/) en la misma
caja, una [sin fila de LED](../page-iberica-anden-sin-led/) y otra
[de dos vías](../page-iberica-anden-dos-vias/), con dos carteles en una caja.

## Qué muestra

En marzo de 1997, José María Navarro, de PAGE Ibérica, lo describía así en
*Vía Libre*:

> En los andenes anuncia en un panel, con una línea de excitación
> electromagnética, qué tren va a llegar y cuántos minutos falta para su
> detención en la parada, y en otra línea de texto móvil, de diodos,
> información sobre las estaciones sucesivas donde el tren va a tener las
> siguientes paradas.

El cartel es un conjunto de varias piezas, cada una con su papel:

| Elemento | Contenido |
| --- | --- |
| Rótulos fijos | «Vía», «Próxima Llegada» y «min.»: vinilos sobre una chapa metálica montada detrás del cristal |
| Número de vía | Un vinilo, colocado junto a «Vía» en cada instalación |
| Línea flip-dot | Destino del próximo tren y minutos que faltan |
| Fila de LED | Texto móvil con las estaciones en las que para, y avisos |
| Tubo fluorescente | Ilumina de noche la línea flip-dot, y solo esa línea |

Como «min.» es un rótulo fijo y no está dibujado con puntos, la línea se
compone con el destino a la izquierda y la cifra empujada al extremo derecho.
Es una convención de quien enviaba el texto, no algo que el cartel sepa: la
línea completa de 16 caracteres le llega ya hecha.

## La línea flip-dot: PI-T100-M

La designación PI-T100-M no corresponde al cartel entero, sino a la línea de
texto flip-dot que lleva dentro. Así lo dice la etiqueta de su chasis:

| Campo | Valor |
| --- | --- |
| Fabricante | PAGE Ibérica, S.A., Tres Cantos (Madrid) |
| Modelo | PI-T100-M |
| Función | MAESTRA |
| Descripción | «1 línea de texto. Módulos de PLACA MÓVIL de 100 mm» |

La línea tiene 16 caracteres de 5 × 7 puntos, 560 en total, con los módulos
montados por parejas en ocho placas portadoras. Su electrónica y su panel son
de Telenorma, como se cuenta en la
[familia](../../familias/page-iberica-electromagneticos-cercanias-madrid/#quién-los-hizo).

La EPROM de la unidad estudiada lleva una pegatina que dice
`TELENORMA 18 JUN 96`: su firmware se grabó el 18 de junio de 1996. El resto
de marcas de la unidad coincide en una fabricación de mediados de los
noventa.

## Montaje

El montaje variaba según la estación: bajo la marquesina o sobre un poste, y
en El Goloso y Tres Cantos por parejas, una por vía, con un reloj entre
ambos. El número de vía era un vinilo que no todas las estaciones
recibieron, y algunos carteles pasaron toda su vida útil diciendo «Vía» y
nada más. Algunos, como el de Cercedilla, dicen «Próximo tren» en lugar de
«Próxima Llegada».

## Retirada

El de Pitis seguía en su sitio en 2026, pocos meses antes de su retirada; en
junio de ese año se fotografió otro ya desmontado en el andén de Aravaca, que
seguía mostrando el último destino que recibió. A noviembre de 2026, los
únicos que se sabe que siguen en servicio están en Méndez Álvaro, en la línea
C-5.

Una unidad de la línea PI-T100-M se ha recuperado y documentado en el proyecto
[renfe-flipdot-re](https://github.com/oierlauzi/renfe-flipdot-re), que describe
su electrónica, su firmware y el protocolo con el que se le envía texto por su
enlace RS-422. De su memoria salen los caracteres que usa la réplica de esta
página.
