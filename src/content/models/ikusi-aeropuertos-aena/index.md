---
name: Panel de salidas y llegadas de cristal líquido de Ikusi, aeropuertos de Aena
summary: >-
  El panel de salidas y llegadas de muchos aeropuertos de Aena: filas de
  módulos de cristal líquido, uno por carácter, bajo una cabecera impresa con
  el pictograma de Aena y los rótulos en castellano, en inglés y, según el
  aeropuerto, en otra lengua.
kind: departure-board
technologies:
  - lcd
transportModes:
  - air
features:
  - printed-legends
  - integrated-clock
manufacturers:
  - ref: ikusi
    role: manufacturer
operators:
  - ref: aena
    role: owner
countries:
  - es
status: unknown
locations:
  - site: es/aeropuerto-de-valencia
    status: unknown
    note: Salidas, con los rótulos también en valenciano. Fotografiado hacia 2014.
  - site: es/aeropuerto-de-bilbao
    status: retired
    note: Con marco de aluminio y los rótulos también en euskera, de dos en dos. Fotografiados en 2010 y en 2015; ya retirados.
  - site: es/aeropuerto-de-tenerife-norte
    status: unknown
    note: Con marco de aluminio y los rótulos también en alemán. Fotografiado en 2012.
  - site: es/aeropuerto-de-barcelona-el-prat
    status: unknown
    note: Terminal B, con los rótulos también en catalán.
  - site: es/aeropuerto-de-madrid-barajas
    status: unknown
    note: Terminal T2, con reloj y filete amarillo.
  - site: es/aeropuerto-de-asturias
    status: unknown
    note: Con reloj y filete amarillo, y «Terminal T1» impreso en la cabecera. Fotografiado en 2018.
variants:
  - id: valencia
    name: Valencia
    description: >-
      Marco gris oscuro, doce filas y los rótulos también en valenciano. Cada
      fila empieza por el vuelo.
    replicaPreset: {}
  - id: bilbao
    name: Bilbao
    description: >-
      Marco de aluminio, con el símbolo del logotipo de Ikusi en verde, doce
      filas y los rótulos también en euskera.
    replicaPreset:
      lengua: eu
      columnas: bilbao
      marco: plata
      titulo: mediano
  - id: tenerife-norte
    name: Tenerife Norte
    description: >-
      Marco de aluminio, ocho filas y los rótulos también en alemán, como en
      otros aeropuertos de Canarias.
    replicaPreset:
      lengua: de
      columnas: canarias
      marco: plata
      cristal: ambar
      filas: 8
  - id: canarias
    name: Canarias, marco gris
    description: >-
      Marco gris oscuro, diez filas, los rótulos también en alemán y el
      título pequeño.
    replicaPreset:
      lengua: de
      columnas: canarias
      cristal: ambar
      titulo: pequeno
      filas: 10
  - id: canarias-llegadas
    name: Canarias, llegadas
    description: >-
      De llegadas, con la hora estimada tras el vuelo y las observaciones
      después.
    replicaPreset:
      modo: arrivals
      lengua: de
      columnas: canarias
      cristal: ambar
      filas: 10
  - id: barcelona
    name: Barcelona, terminal B
    description: >-
      Diez filas, los rótulos también en catalán y «Terminal B» en grande
      tras el título.
    replicaPreset:
      lengua: ca
      columnas: canarias
      terminal: B
      filas: 10
  - id: esquinas-redondeadas
    name: Esquinas redondeadas
    description: >-
      Marco negro de esquinas redondeadas, ocho filas y los rótulos solo en
      castellano e inglés. No se sabe en qué aeropuerto.
    replicaPreset:
      lengua: ''
      columnas: canarias
      marco: negro
      redondeado: true
      filas: 8
  - id: barajas-t2
    name: Madrid-Barajas, terminal T2
    description: >-
      Con reloj y filete amarillo, «Terminal T2» en la cabecera y al menos 52
      caracteres por fila. Se ven nueve filas, y puede que tenga más.
    replicaPreset:
      modelo: reloj
      lengua: ''
      columnas: barajas
      terminal: T2
      modulos: 52
      filas: 9
  - id: asturias
    name: Asturias
    description: >-
      Con reloj y filete amarillo, «Terminal T1» en la cabecera y diez filas.
      En las fotografías, el reloj está apagado.
    replicaPreset:
      modelo: reloj
      lengua: ''
      columnas: bilbao
      terminal: T1
      cristal: ambar
      encendido: false
      filas: 10
photos:
  - id: valencia
    src: ./valencia.jpg
    alt: >-
      Un panel de salidas de doce filas de caracteres amarillos, con la
      cabecera impresa en valenciano, inglés y castellano.
    caption: Salidas del aeropuerto de Valencia. Publicada en 2014.
    place: Aeropuerto de Valencia
    author: Valencia Low Cost
    sourceUrl: http://aeropuerto-valencia.es/wp-content/uploads/2014/01/rotterdam01.jpg
    source: aeropuerto-valencia.es
    license: rights-reserved-credited
  - id: bilbao-retrasos
    src: ./bilbao-retrasos.jpg
    alt: >-
      Una viajera de espaldas mira un panel de salidas de marco de aluminio,
      de doce filas y con los rótulos también en euskera.
    caption: Salidas del aeropuerto de Bilbao.
    place: Aeropuerto de Bilbao
    author: RTVE
    sourceUrl: https://img.rtve.es/n/1997323/?w=1600
    source: RTVE
    license: rights-reserved-credited
  - id: bilbao-2015
    src: ./bilbao-2015.jpg
    alt: >-
      De frente, dos paneles de salidas de doce filas, uno junto al otro, con
      los rótulos en euskera, inglés y castellano.
    caption: Dos paneles de salidas de Bilbao, julio de 2015.
    date: '2015-07'
    place: Aeropuerto de Bilbao
    author: El Mundo
    sourceUrl: https://e01-elmundo.uecdn.es/assets/multimedia/imagenes/2015/07/22/14375656063137.jpg
    source: El Mundo
    license: rights-reserved-credited
  - id: bilbao-2010
    src: ./bilbao-2010.jpg
    alt: >-
      Dos paneles de salidas de marco de aluminio, uno junto al otro, bajo un
      reloj, sobre el vestíbulo de una terminal.
    caption: Bilbao, abril de 2010, con muchos vuelos cancelados.
    date: '2010-04'
    place: Aeropuerto de Bilbao
    author: El Mundo
    sourceUrl: https://e01-elmundo.uecdn.es/elmundo/imagenes/2010/04/16/1271411911_0.jpg
    source: El Mundo
    license: rights-reserved-credited
  - id: tenerife-norte-2012
    src: ./tenerife-norte-2012.jpg
    alt: >-
      Un panel de salidas de ocho filas con marco de aluminio y los rótulos
      también en alemán.
    caption: Tenerife Norte, enero de 2012, tras el cierre de Spanair.
    date: '2012-01'
    place: Aeropuerto de Tenerife Norte
    author: Diario de Avisos
    sourceUrl: https://www.diariodeavisos.com/wp-content/uploads/2012/01/panel-tenerife-norte-spanair.jpg
    source: Diario de Avisos
    license: rights-reserved-credited
  - id: canarias-aluminio-2022
    src: ./canarias-aluminio-2022.jpg
    alt: >-
      Paneles de salidas de marco de aluminio, uno junto a otro, colgados del
      techo de una terminal.
    caption: Un aeropuerto de Canarias, septiembre de 2022.
    date: '2022-09'
    author: Diario de Avisos
    sourceUrl: https://cdn.diariodeavisos.com/wp-content/uploads/2022/09/WhatsApp-Image-2022-09-25-at-12.03.28-PM.jpeg
    source: Diario de Avisos
    license: rights-reserved-credited
  - id: canarias-llegadas-2023
    src: ./canarias-llegadas-2023.jpg
    alt: >-
      De cerca y en ángulo, las filas de un panel de llegadas de marco de
      aluminio, con el logotipo de Ikusi abajo a la derecha.
    caption: Llegadas en un aeropuerto de Canarias, julio de 2023. Al final de cada fila, los dos módulos sin cristal.
    date: '2023-07'
    author: Diario de Avisos
    sourceUrl: https://cdn.diariodeavisos.com/wp-content/uploads/2023/07/AENA-1-1024x619.jpg
    source: Diario de Avisos
    license: rights-reserved-credited
  - id: canarias-llegadas
    src: ./canarias-llegadas.jpg
    alt: >-
      Un panel de llegadas de diez filas, de marco gris oscuro, con los
      rótulos en alemán, inglés y castellano.
    caption: Llegadas en un aeropuerto de Canarias.
    author: Cadena SER
    sourceUrl: https://cloudfront-eu-central-1.images.arcpublishing.com/prisaradio/NVJM7NNJ6RLRFFHEMFUDTLVY4Q.jpg
    source: Cadena SER
    license: rights-reserved-credited
  - id: canarias-salidas
    src: ./canarias-salidas.jpg
    alt: >-
      Un panel de salidas de diez filas, de marco gris oscuro y con el título
      pequeño, junto al borde de otro.
    caption: Salidas en un aeropuerto de Canarias.
    author: elDiario.es
    sourceUrl: https://static.eldiario.es/clip/a8e16716-3b24-46d3-acec-cd2c0bd1369c_twitter-aspect-ratio_default_0.jpg
    source: elDiario.es
    license: rights-reserved-credited
  - id: barcelona-terminal-b
    src: ./barcelona-terminal-b.jpg
    alt: >-
      Un panel de salidas de diez filas con «Terminal B» impreso en grande en
      la cabecera y los rótulos también en catalán.
    caption: Terminal B del aeropuerto de Barcelona-El Prat.
    place: Aeropuerto de Barcelona-El Prat
    author: Depositphotos
    sourceUrl: https://st.depositphotos.com/1003345/3071/i/600/depositphotos_30716961-stock-photo-departures-board-isolated.jpg
    source: Depositphotos
    license: rights-reserved-credited
  - id: esquinas-redondeadas
    src: ./esquinas-redondeadas.jpg
    alt: >-
      Un panel de salidas de ocho filas, de marco negro con las esquinas
      redondeadas, sobre el rótulo de las puertas de embarque.
    caption: El panel de esquinas redondeadas, en un aeropuerto que no se conoce.
    author: Grupo Joly
    sourceUrl: https://static.grupojoly.com/clip/44b5c85c-6cd7-4a30-b8ce-703b12a768e2_16-9-aspect-ratio_1600w_0.webp
    source: Grupo Joly
    license: rights-reserved-credited
  - id: barajas-t2
    src: ./barajas-t2.jpg
    alt: >-
      La parte de arriba de un panel de salidas, con el reloj de cristal
      líquido a la izquierda del pictograma y «Terminal T2» en grande.
    caption: Terminal T2 de Madrid-Barajas. A la izquierda de la cabecera, el reloj.
    place: Aeropuerto de Madrid-Barajas
    author: EFE
    sourceUrl: https://s03.s3c.es/imag/_v0/770x420/b/3/6/panel-salidas-llegadas-aeropuerto-huelga-retraso-770-EFE.jpg
    source: elEconomista
    license: rights-reserved-credited
  - id: asturias-apagado-2018
    src: ./asturias-apagado-2018.jpg
    alt: >-
      Un panel de salidas con filete amarillo, encendido pero sin vuelos, en
      el que se ven todos los cristales de cada fila.
    caption: Asturias, septiembre de 2018. Sin vuelos, se ven todos los módulos; el reloj, arriba a la izquierda, está apagado.
    date: '2018-09'
    place: Aeropuerto de Asturias
    author: La Voz de Asturias
    sourceUrl: https://www.lavozdeasturias.es/default/2018/09/14/00121536921153660612689/Foto/panelaeropuerto.jpg
    source: La Voz de Asturias
    license: rights-reserved-credited
  - id: asturias-2018
    src: ./asturias-2018.jpg
    alt: >-
      Un panel de salidas con filete amarillo y «Terminal T1» en la cabecera,
      visto desde abajo y de lado.
    caption: Asturias, febrero de 2018.
    date: '2018-02'
    place: Aeropuerto de Asturias
    author: RTPA
    sourceUrl: https://www.rtpa.es/fotos//18/02/20180217142224_aeropuerto180217total.jpg
    source: RTPA
    license: rights-reserved-credited
cover: valencia
references:
  - title: Iconos de Aena
    publication: Arquitectura accesible
    url: https://arquitecturaaccesible.wordpress.com/wp-content/uploads/2011/09/aena-iconos.gif
    note: La tabla de pictogramas de Aena, con los de salidas y llegadas que llevan los paneles.
replica:
  id: ikusi-aeropuerto
stage: stub
---

Es el panel de salidas y llegadas que [Ikusi](../../fabricantes/ikusi/)
hizo para los aeropuertos de Aena. Se ha fotografiado en Valencia, Bilbao,
Barcelona, Madrid-Barajas, Asturias y varios aeropuertos de Canarias, en
fotografías que van de 2010 a 2023. En noviembre de 1991, según *Vía
Libre*, Ikusi fue elegida para los sistemas de información al público de
los aeropuertos de Barcelona y Sevilla, con teleindicadores de cristal
líquido; no se sabe si eran estos.

## Cómo es

Arriba va una cabecera impresa: el pictograma de Aena, un avión negro sobre
un cuadrado amarillo (despegando en las salidas, aterrizando con las ruedas
fuera en las llegadas), y a su lado el título en dos o tres lenguas. Debajo,
sobre cada columna, su rótulo en las mismas lenguas y en el mismo orden: la
del lugar arriba, si la hay, luego el inglés y por último el castellano, en
amarillo y en negrita.

Cada fila es un carril con módulos encajados, uno por carácter, como en los
[carteles de andén de Ikusi en Atocha Cercanías](../ikusi-anden-atocha/):
un bloque de plástico oscuro con su cristal y, encima y debajo del cristal,
una ranura a lo largo. Cada extremo de la fila acaba en dos módulos iguales
pero sin cristal. Los caracteres son amarillos, de 7 puntos de ancho por 11
de alto, con trazos de dos puntos. Los cristales sin carácter brillan
débilmente, cada uno con su tono: en verde oliva en Bilbao, Valencia,
Barcelona y Madrid, y entre el ámbar y el gris en Canarias y en Asturias.

El panel no tiene columnas propias: cada fila es una sola tira de módulos, y
entre lo que se escribe en ella queda un módulo en blanco. En casi todos los
paneles que dejan contarlos, cada fila tiene 51 caracteres. Por eso lo que
va en cada parte de la fila cambia de un aeropuerto a otro:

| Aeropuerto | Columnas |
| --- | --- |
| Valencia | Vuelo, destino, hora, embarque, mostrador, puerta, observaciones |
| Bilbao y Asturias | Hora, destino, vuelo, mostrador, embarque, puerta, observaciones |
| Canarias y Barcelona | Las mismas, con una puerta más corta y más sitio para las observaciones |
| Madrid-Barajas T2 | Las mismas, con el vuelo más corto y los mostradores de tres cifras |

Las filas de Barajas no caben en 51 caracteres: tienen al menos 52. En el
panel de esquinas redondeadas, los mostradores se escriben con una *a*
minúscula entre los dos números, el único carácter en minúscula que se ha
visto. Las observaciones van rotando entre el castellano, el inglés y la
otra lengua del panel, si la tiene: en las fotografías se ven unas veces en
castellano, otras en inglés y, en Canarias, en alemán.

## Variantes

El número de filas cambia de un panel a otro: se han fotografiado de ocho,
de diez y de doce. El marco es gris oscuro o de
aluminio, como en Bilbao y Tenerife Norte; en los de aluminio, el símbolo del
logotipo de Ikusi, abajo a la derecha, es verde. Uno, de un aeropuerto que no
se conoce, tiene el marco negro y las esquinas redondeadas.

La cabecera lleva, además del castellano y el inglés, el valenciano en
Valencia, el catalán en Barcelona, el euskera en Bilbao y el alemán en
Canarias; en Madrid y Asturias, solo castellano e inglés. El pictograma y el
título se imprimieron en tres tamaños. En Barcelona, tras el título, va
«Terminal B» en grande.

Los de la terminal T2 de Barajas y los de Asturias son de otro modelo: un
filete amarillo recorre el marco, la cabecera lleva el nombre de la
terminal entre el pictograma y el título, y arriba a la izquierda tiene un
reloj de cinco módulos, como los de las filas pero más grandes, en una
ventana oscura. En las fotografías de Asturias el reloj está apagado. En
Bilbao los paneles cuelgan de dos en dos, uno junto al otro, y el de la
derecha sigue con los vuelos del de la izquierda.

## Lo que no se sabe

- **Cuándo se instalaron**, en qué otros aeropuertos hubo y cuántos quedan:
  los de Bilbao ya se han retirado, y de los demás no se sabe. Las
  fotografías van de 2010 a 2023.
- **Las medidas.** Se estiman a partir de las fotografías, suponiendo que
  los módulos son del tamaño de los de Atocha; así, un panel de 51
  caracteres por fila tendría unos 4 m de ancho.
- **Cuántos caracteres tienen las filas de Barajas T2**, y cuántas filas los
  paneles: la fotografía no deja ver los bordes.
- **Los paneles de llegadas fuera de Canarias**: cómo se reparten sus
  columnas y qué dicen sus rótulos en valenciano, catalán y euskera. La
  réplica los deduce de los de salidas y usa las palabras habituales.
- **Cuánto dura cada lengua en las observaciones**, y qué dicen en
  valenciano, catalán y euskera, que no se han fotografiado. La réplica
  cambia cada cinco segundos y usa las palabras habituales.
- **Qué significa la letra sola** que, en las llegadas fotografiadas en
  Canarias, va delante de las observaciones.

Si tienes más fotografías o datos, [puedes aportarlos](../../contribuir/).
