## Canvas

El elemento `<canvas>` es una superficie de dibujo dentro de la página web. A diferencia de otros elementos HTML, no contiene contenido propio, sino que funciona como un lienzo en blanco sobre el cual se pueden renderizar gráficos, animaciones y simulaciones mediante JavaScript.

Para poder utilizarlo desde JavaScript, primero es necesario obtener una referencia a este elemento. Esto se hace de la siguiente manera:

```javascript
const canvas = document.getElementById("canvas");
```

Esta instrucción busca dentro del documento `HTML` un elemento cuyo atributo id sea "canvas" y lo almacena en la variable canvas.

Este elemento se encuentra definido en el archivo `index.html`, dentro de la sección principal:

```HTML
<section class="simulador">
    <canvas id="canvas"></canvas>
</section>
```

En este punto, el `<canvas>` ya existe en la página, pero aún no se puede dibujar sobre él. Para ello, es necesario obtener su contexto de dibujo, que es el objeto que proporciona las herramientas para renderizar gráficos.

Esto se realiza con la siguiente instrucción:

```javascript
const ctx = canvas.getContext("2d");
```

Con esta línea se le indica al canvas que se utilizará un contexto de dibujo en dos dimensiones (2D), y se obtiene un objeto (`ctx`) que actúa como la interfaz de dibujo.

A partir de este momento, todas las operaciones gráficas (líneas, figuras, imágenes, texto, etc.) se realizan a través de este contexto. En otras palabras, `ctx` es la herramienta mediante la cual se dibuja sobre el lienzo.

## Ajuste del Canvas

Para que la simulación se adapte correctamente a distintos tamaños de pantalla y resoluciones, se utiliza la función `ajustarCanvas()`:

```javascript
function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ancho = rect.width;
    alto = rect.height;
}
```

Esta función ajusta dinámicamente el tamaño interno del canvas para que coincida con su tamaño visual en pantalla, teniendo en cuenta la densidad de píxeles del dispositivo. Esto permite que los gráficos se vean nítidos y correctamente escalados en cualquier resolución.

```javascript
const rect = canvas.getBoundingClientRect();
```

Esta instrucción obtiene las dimensiones reales del canvas en pantalla (en píxeles CSS). El objeto rect contiene información como:

+ `rect.width`: ancho visible del canvas
+ `rect.height`: alto visible del canvas

```javascript
const dpr = window.devicePixelRatio || 1;
```

El valor `devicePixelRatio` (DPR) indica la relación entre píxeles físicos y píxeles CSS del dispositivo. Por ejemplo:

+ Pantallas estándar → dpr = 1
+ Pantallas Retina / alta densidad → dpr = 2 o más

Este valor se utiliza para escalar el canvas y evitar que los gráficos se vean borrosos.

```javascript
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
```

Aquí se define el tamaño real del canvas en píxeles físicos. Aunque el canvas se muestre con un tamaño en pantalla (`rect.width`, `rect.height`), internamente se aumenta su resolución multiplicándolo por el DPR.

Esto es fundamental para mantener la nitidez de los gráficos.

```javascript
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

Esta instrucción ajusta el sistema de coordenadas del contexto (`ctx`) para compensar el escalado anterior. De esta manera:

+ Se puede seguir dibujando usando coordenadas normales (en píxeles CSS)
+ El navegador se encarga de escalar correctamente el resultado

```javascript
ancho = rect.width;
alto = rect.height;
```

Se almacenan las dimensiones visibles del canvas en variables globales, lo cual facilita:

+ trabajar con proporciones
+ hacer el diseño responsivo
+ posicionar elementos en función del tamaño de pantalla

## Clase Particula

La clase `Particula` representa un objeto que se mueve en el espacio bidimensional bajo un modelo cinemático simple. En este caso, la partícula se desplaza con velocidad constante en una dirección determinada.

```javascript
class Particula {
  constructor(pos, v, dir, dt) {
    this.pos = [...pos];
    this.v = v;

    const norma = Math.hypot(dir[0], dir[1]);
    this.dir = [dir[0] / norma, dir[1] / norma];

    this.dt = dt;
  }

  cambiarPosicion() {
    this.pos[0] += this.v * this.dir[0] * this.dt;
    this.pos[1] += this.v * this.dir[1] * this.dt;
  }
}
```
A continuación desglosaremos cada elemento:

```javascript
constructor(pos, v, dir, dt)
```

El constructor inicializa las propiedades fundamentales de la partícula:

+ `pos`: vector de posición inicial `[x, y]`
+ `v`: magnitud de la velocidad
+ `dir`: vector de dirección del movimiento
+ `dt`: paso de tiempo de la simulación

Con esto:

```javascript
this.pos = [...pos];
this.v = v;
```

Se realiza una copia del arreglo `pos` para evitar modificar la referencia original. Esto asegura que la posición de la partícula sea independiente de otras variables externas. La velocidad se considera como una magnitud escalar constante.

```javascript
const norma = Math.hypot(dir[0], dir[1]);
this.dir = [dir[0] / norma, dir[1] / norma];
```

El vector `dir` se normaliza para convertirlo en un vector unitario. De esta manera, la velocidad efectiva del movimiento queda determinada únicamente por `v`, mientras que `dir` indica la dirección.

```javascript
this.dt = dt;
```

El parámetro `dt` representa el incremento de tiempo en cada iteración de la simulación. Es una constante que define la resolución temporal del modelo.

### Método cambiar_posicion

```javascript
cambiarPosicion() {
  this.pos[0] += this.v * this.dir[0] * this.dt;
  this.pos[1] += this.v * this.dir[1] * this.dt;
}
```

Este método actualiza la posición de la partícula utilizando una forma discreta de la ecuación de movimiento uniforme.

En términos matemáticos:

$$ x_n = x_{n-1}+v \bullet d_x \bullet dt $$
$$ y_n = y_{n-1}+v \bullet d_y \bullet dt $$

donde:

+ $v$: es la magnitud de la velocidad,
+ $(dx,dy)$ es el vector dirección normalizado,
+ $dt$ es el paso de tiempo.

## Clase Camara2D

La clase `Camara2D` se encarga de transformar coordenadas del sistema físico (mundo) a coordenadas en pantalla (píxeles). Su propósito es permitir que la simulación sea independiente del tamaño del canvas, manteniendo proporciones correctas y una visualización centrada.

```javascript
class Camara2D {
  constructor(limitesMundo, anchoPantalla, altoPantalla, margenPorcentaje = 0.08) {
    this.xmin = limitesMundo[0];
    this.xmax = limitesMundo[1];
    this.ymin = limitesMundo[2];
    this.ymax = limitesMundo[3];

    this.anchoPantalla = anchoPantalla;
    this.altoPantalla = altoPantalla;

    this.margen = Math.min(anchoPantalla, altoPantalla) * margenPorcentaje;

    const anchoMundo = this.xmax - this.xmin;
    const altoMundo = this.ymax - this.ymin;

    const anchoUsable = anchoPantalla - 2 * this.margen;
    const altoUsable = altoPantalla - 2 * this.margen;

    this.escala = Math.min(anchoUsable / anchoMundo, altoUsable / altoMundo);

    this.desX =
      (anchoPantalla - anchoMundo * this.escala) / 2 -
      this.xmin * this.escala;

    this.desY =
      (altoPantalla - altoMundo * this.escala) / 2 +
      this.ymax * this.escala;
  }

  convertirAPixeles(p) {
    const x = p[0] * this.escala + this.desX;
    const y = -p[1] * this.escala + this.desY;
    return [x, y];
  }
}
```

Esta clase implementa una transformación afín que permite:

+ escalar el sistema de coordenadas,
+ centrar el contenido en pantalla,
+ mantener proporciones sin distorsión,
+ y convertir coordenadas matemáticas en coordenadas de píxeles.

### Parámetros del constructor

```javascript
constructor(limitesMundo, anchoPantalla, altoPantalla, margenPorcentaje = 0.08)
```

+ `limitesMundo`: arreglo `[xmin, xmax, ymin, ymax]` que define los límites del sistema físico.
+ `anchoPantalla`: ancho del canvas en píxeles.
+ `altoPantalla`: alto del canvas en píxeles.
+ `margenPorcentaje`: porcentaje del tamaño de pantalla reservado como margen.

### Límites del mundo

```javascript
this.xmin = limitesMundo[0];
this.xmax = limitesMundo[1];
this.ymin = limitesMundo[2];
this.ymax = limitesMundo[3];
```

Definen el rectángulo del espacio donde ocurre la simulación.

### Margen

```javascript
this.margen = Math.min(anchoPantalla, altoPantalla) * margenPorcentaje;
```

Se define un margen proporcional al tamaño de la pantalla para evitar que el contenido toque los bordes.

### Dimensiones del mundo

```javascript
const anchoMundo = this.xmax - this.xmin;
const altoMundo = this.ymax - this.ymin;
```

Representan el tamaño del sistema físico.

### Área usable en pantalla

```javascript
const anchoUsable = anchoPantalla - 2 * this.margen;
const altoUsable = altoPantalla - 2 * this.margen;
```

Es el espacio disponible para dibujar el mundo, descontando márgenes.

### Escala

```javascript
this.escala = Math.min(anchoUsable / anchoMundo, altoUsable / altoMundo);
```
Se calcula un factor de escala que permite ajustar el mundo al área disponible sin distorsión.

Se utiliza el mínimo para garantizar que:

+ el contenido completo sea visible,
+ no haya recortes,
+ se mantenga la relación de aspecto.

### Desplazamientos

Desplazamiento horizontal: 

```javascript
this.desX =
  (anchoPantalla - anchoMundo * this.escala) / 2 -
  this.xmin * this.escala;
```

Este término centra el contenido horizontalmente y ajusta el origen del sistema.

Desplazamiento vertical:

```javascript
this.desY =
  (altoPantalla - altoMundo * this.escala) / 2 +
  this.ymax * this.escala;
```

Similar al caso horizontal, pero incluye una inversión del eje vertical (ver siguiente sección).

### Método `convertirAPixeles`

```javascript
convertirAPixeles(p) {
  const x = p[0] * this.escala + this.desX;
  const y = -p[1] * this.escala + this.desY;
  return [x, y];
}
```
Este método convierte un punto del mundo `[x, y]` en coordenadas de pantalla.

La clase `Camara2D` permite desacoplar completamente el modelo físico de su representación gráfica, proporcionando:

+ independencia del tamaño de pantalla,
+ correcta visualización en distintos dispositivos,
+ y una transformación coherente entre coordenadas matemáticas y píxeles.

Es un componente fundamental para cualquier simulación que requiera renderizado adaptable y consistente.
