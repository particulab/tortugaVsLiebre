const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const FPS = 60;
const DT = 1 / FPS;

const MALLA_MENOR = "rgba(36, 40, 56, 0.55)";
const MALLA_MAYOR = "rgba(62, 70, 96, 0.85)";

const COLOR_TEXTO = "rgb(235, 240, 250)";
const COLOR_TEXTO_SUAVE = "rgb(170, 180, 200)";

let ancho = 0;
let alto = 0;

function ajustarCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ancho = rect.width;
  alto = rect.height;
}

window.addEventListener("resize", ajustarCanvas);
ajustarCanvas();

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

function cargarImagen(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const imgFondo = cargarImagen("assets/pasto.png");
const imgTortuga = cargarImagen("assets/tortuga.png");
const imgLiebre = cargarImagen("assets/liebre.png");

let tiempo = 0;
let tiempoA = 0;
let pausado = false;
let liebreCorriendo = true;
let mostrarReinicio = false;
let tiempoTextoReinicio = 0;
let mostrarGanador = false;
let ganador = "";

const posicionInicialTortuga = [3.5, 0];
const posicionInicialLiebre = [6.5, 0];

const velocidadTortuga = 0.3;
const velocidadLiebre = 0.9;
const direccion = [0, 1];

let tortuga = new Particula(posicionInicialTortuga, velocidadTortuga, direccion, DT);
let liebre = new Particula(posicionInicialLiebre, velocidadLiebre, direccion, DT);

let tiempos = [tiempo];
let posicionesTortuga = [posicionInicialTortuga[1]];
let posicionesLiebre = [posicionInicialLiebre[1]];

function reiniciar() {
  tiempo = 0;
  tiempoA = 0;
  pausado = false;
  liebreCorriendo = true;
  mostrarReinicio = true;
  tiempoTextoReinicio = 0.8;
  mostrarGanador = false;
  ganador = "";

  tortuga = new Particula(posicionInicialTortuga, velocidadTortuga, direccion, DT);
  liebre = new Particula(posicionInicialLiebre, velocidadLiebre, direccion, DT);

  tiempos = [tiempo];
  posicionesTortuga = [posicionInicialTortuga[1]];
  posicionesLiebre = [posicionInicialLiebre[1]];
}

window.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    pausado = true;
  }

  if (evento.code === "Space") {
    pausado = !pausado;
  }

  if (evento.key.toLowerCase() === "a") {
    liebreCorriendo = !liebreCorriendo;
    tiempoA = tiempo;
  }

  if (evento.key.toLowerCase() === "r") {
    reiniciar();
  }
});

function dibujarTexto(texto, xPct, yPct, tamPct = 0.028, color = COLOR_TEXTO, bold = false) {
  const tam = Math.max(12, alto * tamPct);
  ctx.font = `${bold ? "bold " : ""}${tam}px Consolas, monospace`;
  ctx.fillStyle = color;
  ctx.fillText(texto, ancho * xPct, alto * yPct);
}

function dibujarPanel(xPct, yPct, wPct, hPct) {
  const x = ancho * xPct;
  const y = alto * yPct;
  const w = ancho * wPct;
  const h = alto * hPct;
  const r = Math.min(w, h) * 0.08;

  ctx.save();
  ctx.fillStyle = "rgba(20, 24, 38, 0.73)";
  ctx.strokeStyle = "rgb(85, 95, 125)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function dibujarBadge(texto, xPct, yPct, colorFondo = "rgba(28,34,52,0.75)") {
  const x = ancho * xPct;
  const y = alto * yPct;
  const fontSize = Math.max(11, alto * 0.025);

  ctx.font = `${fontSize}px Consolas, monospace`;
  const metricas = ctx.measureText(texto);

  const padX = ancho * 0.012;
  const padY = alto * 0.012;
  const w = metricas.width + 2 * padX;
  const h = fontSize + 2 * padY;

  ctx.save();
  ctx.fillStyle = colorFondo;
  ctx.strokeStyle = "rgb(90, 105, 140)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h * 0.35);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLOR_TEXTO_SUAVE;
  ctx.fillText(texto, x + padX, y + h - padY * 1.2);
  ctx.restore();
}

function dibujarFondo() {
  if (imgFondo.complete) {
    ctx.drawImage(imgFondo, 0, 0, ancho, alto);
  } else {
    ctx.fillStyle = "#3e7f5c";
    ctx.fillRect(0, 0, ancho, alto);
  }
}

function dibujarLineaMundo(camara, p0, p1, color, grosorPct) {
  const a = camara.convertirAPixeles(p0);
  const b = camara.convertirAPixeles(p1);

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, Math.min(ancho, alto) * grosorPct);

  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function dibujarImagenCentrada(img, centro, tamPct) {
  const tam = Math.min(ancho, alto) * tamPct;
  ctx.drawImage(img, centro[0] - tam / 2, centro[1] - tam / 2, tam, tam);
}

function dibujarGraficoCarrera(xPct, yPct, wPct, hPct) {
  if (tiempos.length < 2) return;

  const x0 = ancho * xPct;
  const y0 = alto * yPct;
  const w = ancho * wPct;
  const h = alto * hPct;

  ctx.save();

  ctx.fillStyle = "rgba(20, 24, 38, 0.78)";
  ctx.strokeStyle = "rgb(85, 95, 125)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 10);
  ctx.fill();
  ctx.stroke();

  const margenIzq = w * 0.16;
  const margenDer = w * 0.06;
  const margenSup = h * 0.18;
  const margenInf = h * 0.18;

  const px = x0 + margenIzq;
  const py = y0 + margenSup;
  const pw = w - margenIzq - margenDer;
  const ph = h - margenSup - margenInf;

  const tMin = 0;
  const tMax = Math.max(...tiempos, 1);
  const yMin = 0;
  const yMax = Math.max(...posicionesTortuga, ...posicionesLiebre, 1);

  const mapX = (t) => px + ((t - tMin) / (tMax - tMin)) * pw;
  const mapY = (y) => py + ph - ((y - yMin) / (yMax - yMin)) * ph;

  ctx.strokeStyle = "rgba(190,210,220,0.25)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const fx = i / 5;
    const gx = px + fx * pw;
    const gy = py + ph - fx * ph;

    ctx.beginPath();
    ctx.moveTo(gx, py);
    ctx.lineTo(gx, py + ph);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px, gy);
    ctx.lineTo(px + pw, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + ph);
  ctx.lineTo(px + pw, py + ph);
  ctx.stroke();

  function curva(datos, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    datos.forEach((y, i) => {
      const x = mapX(tiempos[i]);
      const yy = mapY(y);
      if (i === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });

    ctx.stroke();
  }

  curva(posicionesTortuga, "rgb(120,230,160)");
  curva(posicionesLiebre, "rgb(245,220,90)");

  ctx.fillStyle = "white";
  ctx.font = `${Math.max(11, h * 0.07)}px Consolas, monospace`;
  ctx.fillText("Posición vs tiempo", x0 + w * 0.04, y0 + h * 0.10);
  ctx.fillText("Tiempo", x0 + w * 0.43, y0 + h * 0.95);
  ctx.fillText("Posición", x0 + w * 0.03, y0 + h * 0.52);

  ctx.fillStyle = "rgb(120,230,160)";
  ctx.fillText("Tortuga", x0 + w * 0.68, y0 + h * 0.13);

  ctx.fillStyle = "rgb(245,220,90)";
  ctx.fillText("Liebre", x0 + w * 0.68, y0 + h * 0.22);

  ctx.restore();
}

function actualizar() {
  if (pausado) return;

  tiempo += DT;

  tortuga.cambiarPosicion();

  if (liebreCorriendo) {
    liebre.cambiarPosicion();
  }

  tiempos.push(tiempo);
  posicionesTortuga.push(tortuga.pos[1]);
  posicionesLiebre.push(liebre.pos[1]);
}

function revisarMeta(camara) {
  if (mostrarGanador) return;

  if (tortuga.pos[1] >= 10 && liebre.pos[1] >= 10) {
    ganador = "Empate";
    mostrarGanador = true;
    pausado = true;
  } else if (tortuga.pos[1] >= 10) {
    ganador = "Ganó la tortuga";
    mostrarGanador = true;
    pausado = true;
  } else if (liebre.pos[1] >= 10) {
    ganador = "Ganó la liebre";
    mostrarGanador = true;
    pausado = true;
  }
}

function dibujar() {
  const camara = new Camara2D([-1, 11, -1, 11], ancho, alto, 0.08);

  dibujarFondo();

  const posTortuga = camara.convertirAPixeles(tortuga.pos);
  const posLiebre = camara.convertirAPixeles(liebre.pos);

  revisarMeta(camara);

  dibujarPanel(0.016, 0.03, 0.22, 0.32);

  dibujarLineaMundo(camara, [3, 0], [7, 0], "white", 0.018);
  dibujarLineaMundo(camara, [3, 10], [7, 10], "white", 0.018);

  if (imgTortuga.complete) dibujarImagenCentrada(imgTortuga, posTortuga, 0.13);
  if (imgLiebre.complete) dibujarImagenCentrada(imgLiebre, posLiebre, 0.13);

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(posTortuga[0], posTortuga[1], Math.min(ancho, alto) * 0.01, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(posLiebre[0], posLiebre[1], Math.min(ancho, alto) * 0.01, 0, Math.PI * 2);
  ctx.fill();

  if (!liebreCorriendo) {
    const zX = posLiebre[0] + ((20 * tiempo) % 70);
    const zY = posLiebre[1] - alto * 0.04 + Math.sin(5 * tiempo) * alto * 0.01;
    dibujarTexto("Z", zX / ancho, zY / alto, 0.05, "red", true);
  }

  dibujarTexto("Simulación", 0.031, 0.08, 0.044, COLOR_TEXTO, true);
  dibujarTexto(`t = ${tiempo.toFixed(3)} s`, 0.031, 0.15, 0.032);
  dibujarTexto(`Tortuga: ${tortuga.pos[1].toFixed(2)} m`, 0.031, 0.235, 0.026, COLOR_TEXTO_SUAVE);
  dibujarTexto(`Liebre: ${liebre.pos[1].toFixed(2)} m`, 0.031, 0.285, 0.026, COLOR_TEXTO_SUAVE);
  dibujarTexto(`tiempo guardado: ${tiempoA.toFixed(2)}`, 0.031, 0.335, 0.026, COLOR_TEXTO_SUAVE);

  dibujarBadge("Espacio = pausar", 0.018, 0.91);
  dibujarBadge("r = reiniciar", 0.17, 0.91);
  dibujarBadge("a = dormir/despertar a la liebre", 0.66, 0.91);

  if (pausado) {
    dibujarBadge("PAUSA", 0.86, 0.04, "rgba(55,42,18,0.85)");
  }

  if (mostrarReinicio) {
    dibujarBadge("REINICIANDO", 0.78, 0.12, "rgba(24,52,68,0.85)");
  }

  if (mostrarGanador) {
    dibujarBadge(ganador, 0.38, 0.04, "rgba(24,52,68,0.85)");
    dibujarGraficoCarrera(0.62, 0.29, 0.35, 0.47);
  }
}

let acumulador = 0;
let ultimoTimestamp = null;

function loop(timestamp) {
  if (ultimoTimestamp === null) ultimoTimestamp = timestamp;

  const dtReal = (timestamp - ultimoTimestamp) / 1000;
  ultimoTimestamp = timestamp;

  acumulador += dtReal;

  while (acumulador >= DT) {
    actualizar();
    acumulador -= DT;
  }

  if (mostrarReinicio) {
    tiempoTextoReinicio -= dtReal;
    if (tiempoTextoReinicio <= 0) {
      mostrarReinicio = false;
    }
  }

  dibujar();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);