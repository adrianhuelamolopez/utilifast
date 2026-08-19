/**
 * Metadatos de todas las rutas, separados de su implementación.
 *
 * Esto es lo que permite trocear el bundle: la navegación, el sitemap y el <head>
 * necesitan estos datos en TODAS las páginas, mientras que el render y la lógica de
 * cada herramienta solo hacen falta en la suya. Al vivir aquí, importar los metadatos
 * ya no arrastra el código de la vista.
 *
 * Generado por scripts/gen-meta.mjs. Al añadir una herramienta, escribe su meta en la
 * vista y vuelve a ejecutar `npm run meta`.
 */

export const cable = {
  "path": "/cable",
  "navLabel": "Sección de cable",
  "isTool": true,
  "cluster": "motor",
  "icon": "bolt",
  "title": "Calculadora de sección de cable para 12V",
  "description": "Calcula la sección en mm² y su equivalencia AWG según amperios y longitud. Con caída de tensión, intensidad máxima admisible y el fusible que corresponde.",
  "card": {
    "title": "Sección de cable 12V",
    "blurb": "Qué grosor de cable necesitas según amperios y longitud, sin quemar nada.",
    "tags": [
      "coche",
      "electricidad",
      "bricolaje"
    ],
    "keywords": "mm2 awg caida de tension amperios longitud fusible faros nevera coche caravana furgoneta camper 24v"
  }
};

export const calorias = {
  "path": "/calorias",
  "navLabel": "Calorías diarias",
  "isTool": true,
  "cluster": "salud",
  "icon": "flame",
  "title": "Calculadora de calorías diarias",
  "description": "Calcula tu metabolismo basal con la fórmula Mifflin-St Jeor, tu gasto diario según actividad y las calorías para perder, mantener o ganar peso.",
  "card": {
    "title": "Calorías diarias",
    "blurb": "Tu metabolismo basal, tu gasto real y cuántas calorías necesitas según tu objetivo.",
    "tags": [
      "nutrición",
      "salud",
      "fitness"
    ],
    "keywords": "tmb metabolismo basal gasto energetico mifflin harris benedict deficit superavit adelgazar"
  }
};

export const contrasena = {
  "path": "/contrasena",
  "navLabel": "Contraseñas seguras",
  "isTool": true,
  "cluster": "utilidades",
  "icon": "key",
  "title": "Generador de contraseñas seguras",
  "description": "Genera contraseñas aleatorias con el motor criptográfico de tu navegador. Elige longitud y tipos de carácter y comprueba su entropía real en bits.",
  "card": {
    "title": "Generador de contraseñas",
    "blurb": "Contraseñas aleatorias de verdad, con su entropía en bits y sin salir de tu navegador.",
    "tags": [
      "seguridad",
      "privacidad",
      "utilidades"
    ],
    "keywords": "crear clave segura aleatoria fuerte caracteres simbolos entropia bits gestor contrasenas"
  }
};

export const cuenta = {
  "path": "/cuenta",
  "navLabel": "Dividir la cuenta",
  "isTool": true,
  "cluster": "utilidades",
  "icon": "split",
  "title": "Dividir la cuenta del restaurante",
  "description": "Reparte la cuenta entre los comensales, añade propina y calcula cuánto pone cada uno. Con reparto desigual si no todos habéis consumido lo mismo.",
  "card": {
    "title": "Dividir la cuenta",
    "blurb": "Cuánto pone cada uno, con propina y con reparto desigual si hace falta.",
    "tags": [
      "viajes",
      "ahorro",
      "restaurantes"
    ],
    "keywords": "repartir gastos comida cena grupo propina pagar a escote partes desiguales"
  }
};

export const fechas = {
  "path": "/fechas",
  "navLabel": "Días entre fechas",
  "isTool": true,
  "cluster": "utilidades",
  "icon": "calendar",
  "title": "Días entre fechas, edad y días laborables",
  "description": "Calcula cuántos días hay entre dos fechas, incluidos los laborables, suma o resta plazos a partir de un día y averigua tu edad exacta en años, meses y días.",
  "card": {
    "title": "Días entre fechas y edad",
    "blurb": "Diferencia entre fechas con días laborables, sumar o restar plazos y edad exacta.",
    "tags": [
      "fechas",
      "productividad",
      "plazos"
    ],
    "keywords": "cuantos dias faltan calcular edad exacta dias habiles laborables sumar restar semanas meses vencimiento"
  }
};

export const gasolina = {
  "path": "/gasolina",
  "navLabel": "Coste de gasolina",
  "isTool": true,
  "cluster": "motor",
  "icon": "fuel",
  "title": "Calculadora de gasolina y gastos compartidos",
  "description": "Calcula el coste real de gasolina de un viaje y divídelo entre los ocupantes. Kilómetros, consumo, precio y peajes, con resumen listo para WhatsApp.",
  "card": {
    "title": "Coste de gasolina y viaje compartido",
    "blurb": "Kilómetros, consumo, peajes y ocupantes: sabe al instante cuánto pone cada uno.",
    "tags": [
      "viajes",
      "ahorro",
      "coche"
    ],
    "keywords": "combustible diésel repartir gastos carretera peaje"
  }
};

export const hipoteca = {
  "path": "/hipoteca",
  "navLabel": "Hipoteca",
  "isTool": true,
  "cluster": "dinero",
  "icon": "bank",
  "title": "Calculadora de hipoteca y amortización",
  "description": "Calcula la cuota de tu hipoteca, los intereses totales y el cuadro año a año. Simula amortización anticipada y descubre cuánto ahorras y cuánto plazo quitas.",
  "card": {
    "title": "Hipoteca y amortización",
    "blurb": "Cuota mensual, intereses totales y cuánto ahorras amortizando antes de tiempo.",
    "tags": [
      "vivienda",
      "préstamos",
      "ahorro"
    ],
    "keywords": "cuota mensual prestamo hipotecario euribor interes tae cuadro amortizacion anticipada capital"
  }
};

export const home = {
  "path": "/",
  "navLabel": "Inicio",
  "isTool": false,
  "icon": "bolt",
  "title": "Calculadoras online gratis y sin registro",
  "description": "Calculadoras que funcionan al instante en tu navegador: hipoteca, IVA, calorías, IMC, gasolina compartida y más. Sin registro y sin enviar datos."
};

export const imc = {
  "path": "/imc",
  "navLabel": "IMC y peso ideal",
  "isTool": true,
  "cluster": "salud",
  "icon": "body",
  "title": "Calculadora de IMC y peso saludable",
  "description": "Calcula tu índice de masa corporal con los rangos de la OMS, tu peso saludable según la altura y complétalo con el perímetro de cintura.",
  "card": {
    "title": "IMC y peso saludable",
    "blurb": "Tu índice de masa corporal, el rango de peso sano y qué añade el perímetro de cintura.",
    "tags": [
      "salud",
      "fitness",
      "nutrición"
    ],
    "keywords": "indice masa corporal oms peso ideal altura cintura obesidad sobrepeso normopeso"
  }
};

export const interes = {
  "path": "/interes-compuesto",
  "navLabel": "Interés compuesto",
  "isTool": true,
  "cluster": "dinero",
  "icon": "trend",
  "title": "Calculadora de interés compuesto",
  "description": "Proyecta cuánto crece tu ahorro: capital inicial, aportación periódica, rentabilidad y plazo. Con el desglose anual y qué parte del total ponen los intereses.",
  "card": {
    "title": "Interés compuesto",
    "blurb": "Cuánto crece tu ahorro con el tiempo y qué parte del total la ponen los intereses.",
    "tags": [
      "ahorro",
      "inversión",
      "finanzas"
    ],
    "keywords": "capitalizacion aportaciones mensuales rentabilidad anual fondo indexado plan ahorro largo plazo regla del 72"
  }
};

export const iva = {
  "path": "/iva",
  "navLabel": "IVA e IRPF",
  "isTool": true,
  "cluster": "dinero",
  "icon": "percent",
  "title": "Calculadora de IVA e IRPF para facturas",
  "description": "Añade el IVA a una base o quítalo de un precio final con el 21 %, 10 % o 4 %. Incluye recargo de equivalencia y retención de IRPF para autónomos.",
  "card": {
    "title": "Calculadora de IVA e IRPF",
    "blurb": "Suma o quita el IVA de cualquier importe y desglosa tu factura al céntimo.",
    "tags": [
      "facturas",
      "autónomos",
      "impuestos"
    ],
    "keywords": "iva 21 10 4 base imponible desglosar precio final recargo equivalencia irpf retencion"
  }
};

export const legal = {
  "path": "/legal",
  "navLabel": "Aviso legal",
  "isTool": false,
  "icon": "scale",
  "title": "Aviso legal, privacidad y cookies",
  "description": "Aviso legal, política de privacidad y política de cookies de UtiliFast, conforme al RGPD y a la LSSI-CE. Los cálculos se ejecutan en local, sin servidores.",
  "robots": "index, follow"
};

export const macros = {
  "path": "/macros",
  "navLabel": "Macros por comida",
  "isTool": true,
  "cluster": "salud",
  "icon": "nutrition",
  "title": "Calculadora de macros por comida",
  "description": "Calcula tus calorías diarias y reparte proteínas, carbohidratos y grasas entre 3, 4 o 5 comidas, con los gramos exactos de cada toma en una tabla editable.",
  "card": {
    "title": "Macros por comida",
    "blurb": "Reparte proteína, carbohidratos y grasas entre tus tomas diarias.",
    "tags": [
      "nutrición",
      "fitness",
      "dieta"
    ],
    "keywords": "calorias proteina definicion volumen mantenimiento gramos kcal"
  }
};

export const neumaticos = {
  "path": "/neumaticos",
  "navLabel": "Equivalencia de neumáticos",
  "isTool": true,
  "cluster": "motor",
  "icon": "tyre",
  "title": "Equivalencia de neumáticos para la ITV",
  "description": "Comprueba si una medida es equivalente según los cuatro criterios del Manual ITV: diámetro con tolerancia del 3 %, índice de carga y categoría de velocidad.",
  "card": {
    "title": "Equivalencia de neumáticos",
    "blurb": "Diámetro, índice de carga y categoría de velocidad: los criterios que mira la ITV, no solo uno.",
    "tags": [
      "coche",
      "itv",
      "mantenimiento"
    ],
    "keywords": "medidas rueda equivalentes diametro llanta perfil ancho velocimetro itv homologacion cambiar indice carga codigo velocidad 91v 94w kg"
  }
};

export const notfound = {
  "path": "/404",
  "navLabel": "No encontrada",
  "isTool": false,
  "icon": "search",
  "title": "Página no encontrada",
  "description": "La página que buscas no existe o ha cambiado de dirección.",
  "robots": "noindex, follow"
};

export const quienesSomos = {
  "path": "/quienes-somos",
  "navLabel": "Quiénes somos",
  "isTool": false,
  "icon": "info",
  "title": "Quiénes somos y cómo trabajamos",
  "description": "Quién está detrás de UtiliFast, de dónde salen las fórmulas de cada calculadora y por qué todo el cálculo ocurre dentro de tu propio navegador."
};

export const rm = {
  "path": "/1rm",
  "navLabel": "Repetición máxima",
  "isTool": true,
  "cluster": "salud",
  "icon": "dumbbell",
  "title": "Calculadora de 1RM con cinco fórmulas",
  "description": "Estima tu repetición máxima a partir del peso y las repeticiones que has hecho, comparando Epley, Brzycki, Lombardi, O’Conner y Lander, con tabla de series.",
  "card": {
    "title": "Repetición máxima (1RM)",
    "blurb": "Tu máximo estimado con cinco fórmulas y la tabla de porcentajes para entrenar.",
    "tags": [
      "fitness",
      "fuerza",
      "entrenamiento"
    ],
    "keywords": "rm press banca sentadilla peso muerto epley brzycki porcentajes series repeticiones fuerza hipertrofia"
  }
};

export const whatsapp = {
  "path": "/whatsapp",
  "navLabel": "QR de WhatsApp",
  "isTool": true,
  "cluster": "utilidades",
  "icon": "qr",
  "title": "Generador de enlaces y QR de WhatsApp",
  "description": "Crea un enlace wa.me con mensaje predefinido y su código QR descargable en PNG. Sin guardar tu número y sin que nadie tenga que añadirte a contactos.",
  "card": {
    "title": "Enlace y QR de WhatsApp",
    "blurb": "Genera tu enlace wa.me con mensaje listo y descarga el QR en PNG.",
    "tags": [
      "negocios",
      "qr",
      "mensajería"
    ],
    "keywords": "wa.me chat directo sin guardar contacto codigo escanear"
  }
};
