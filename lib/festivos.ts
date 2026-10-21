/**
 * Cálculo de festivos en Colombia según Ley 51 de 1983 (Ley Emiliani).
 * Aplica para cualquier año.
 */

// Algoritmo Butcher / Gauss para calcular la fecha del Domingo de Pascua
export function calcularPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  // Creamos la fecha a mediodía UTC para evitar desplazamientos por huso horario
  return new Date(Date.UTC(year, mes - 1, dia, 12, 0, 0));
}

// Sumar días a una fecha UTC
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Mover al siguiente lunes si no cae en lunes (Ley Emiliani)
function siguienteLunes(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0 = Domingo, 1 = Lunes, ...
  if (dayOfWeek === 1) return date;
  const diff = (8 - dayOfWeek) % 7;
  return addDays(date, diff === 0 ? 7 : diff);
}

function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const festivosCache = new Map<number, Set<string>>();

/**
 * Retorna un Set con todos los festivos colombianos de un año en formato 'YYYY-MM-DD'.
 */
export function obtenerFestivosColombia(year: number): Set<string> {
  const cached = festivosCache.get(year);
  if (cached) return cached;

  const festivos = new Set<string>();

  // 1. Fijos inamovibles
  festivos.add(`${year}-01-01`); // Año Nuevo
  festivos.add(`${year}-05-01`); // Día del Trabajo
  festivos.add(`${year}-07-20`); // Independencia de Colombia
  festivos.add(`${year}-08-07`); // Batalla de Boyacá
  festivos.add(`${year}-12-08`); // Inmaculada Concepción
  festivos.add(`${year}-12-25`); // Navidad

  // 2. Fijos que se trasladan al siguiente lunes (Ley Emiliani)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 0, 6, 12)))));   // Reyes Magos (6 Ene)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 2, 19, 12)))));  // San José (19 Mar)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 5, 29, 12)))));  // San Pedro y San Pablo (29 Jun)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 7, 15, 12)))));  // Asunción de la Virgen (15 Ago)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 9, 12, 12)))));  // Día de la Raza (12 Oct)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 10, 1, 12)))));  // Todos los Santos (1 Nov)
  festivos.add(formatDateKey(siguienteLunes(new Date(Date.UTC(year, 10, 11, 12))))); // Independencia de Cartagena (11 Nov)

  // 3. Basados en Pascua (Semana Santa y relativos)
  const pascua = calcularPascua(year);

  festivos.add(formatDateKey(addDays(pascua, -3))); // Jueves Santo
  festivos.add(formatDateKey(addDays(pascua, -2))); // Viernes Santo

  // Los siguientes caen un domingo o jueves específico y se trasladan al siguiente lunes:
  // Ascensión de Jesús: 39 días después de Pascua (o 40 contando Pascua), trasladado al siguiente lunes (+43 días desde Pascua)
  festivos.add(formatDateKey(siguienteLunes(addDays(pascua, 39))));

  // Corpus Christi: 60 días después de Pascua, trasladado al siguiente lunes (+64 días)
  festivos.add(formatDateKey(siguienteLunes(addDays(pascua, 60))));

  // Sagrado Corazón de Jesús: 68 días después de Pascua, trasladado al siguiente lunes (+71 días)
  festivos.add(formatDateKey(siguienteLunes(addDays(pascua, 68))));

  festivosCache.set(year, festivos);
  return festivos;
}

/**
 * Valida si una fecha específica (o string YYYY-MM-DD o Date) es festivo en Colombia.
 */
export function esFestivoColombia(fecha: Date | string): boolean {
  let key: string;
  let year: number;

  if (typeof fecha === 'string') {
    key = fecha.slice(0, 10);
    year = parseInt(key.slice(0, 4), 10);
  } else {
    // Si es Date, usamos los métodos locales si no hay hora UTC fija
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    key = `${y}-${m}-${d}`;
    year = y;
  }

  if (isNaN(year)) return false;
  const festivos = obtenerFestivosColombia(year);
  return festivos.has(key);
}

/**
 * Verifica si es día hábil en Colombia (no domingo, no festivo).
 * Los sábados son hábiles (media jornada).
 */
export function esDiaHabilColombia(fecha: Date): boolean {
  const diaSemana = fecha.getDay(); // 0 = Domingo
  if (diaSemana === 0) return false;
  return !esFestivoColombia(fecha);
}
