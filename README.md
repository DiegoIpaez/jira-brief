# JiraBrief

Genera un reporte de horas por persona asignada a partir de una exportación CSV de Jira, con vista previa en el navegador y descarga en PDF.

**100 % en el navegador.** No hay backend, ni base de datos, ni servicios externos: el CSV se procesa con `FileReader` y nunca sale de tu máquina.

## Qué hace

- Parsea la exportación CSV de Jira y valida que tenga las columnas obligatorias.
- Filtra por rango de fechas, usando la columna **Creada** o **Actualizada** (a elección).
- Muestra una vista previa con el detalle de cada incidencia y un resumen de horas por persona asignada.
- Convierte cada clave de ticket en un enlace directo a la incidencia en Jira.
- Exporta a un PDF A4 apaisado con el detalle, el resumen por persona y los enlaces clicables.

## Requisitos

- **Node.js** `^20.19.0` o `>=22.12.0` (lo exige Vite 8).
- **npm** 9 o superior.

## Instalación

```bash
npm install
npm run dev
```

Vite imprime la URL local (por defecto `http://localhost:5173`).

## Cómo se usa

### 1. Exportá el CSV desde Jira

En tu instancia de Jira: **Issues → Export (CSV)**, y elegí las columnas **Clave de incidencia**, **Resumen**, **Tiempo empleado (Σ)**, **Persona asignada**, **Estado**, **Creada** y **Actualizada**.

> **Importante:** los encabezados del CSV tienen que coincidir exactamente con los que produce una Jira en español (ver [Formato del CSV](#formato-del-csv)). Si tu Jira está en inglés, el archivo va a ser rechazado con el detalle de las columnas que faltan.

### 2. Indicá la URL de Jira

La app pide la URL del tablero, del proyecto o de una incidencia (por ejemplo `https://tu-organizacion.atlassian.net`); se puede pegar cualquiera de las tres y se normaliza al origen, así que no hace falta recortar nada a mano. Se usa **únicamente** para armar los enlaces `{URL}/browse/{CLAVE}` del PDF y de la vista previa — no se usa para consultar la API de Jira ni para autenticar nada. Es un paso obligatorio: sin URL cargada el paso 2 permanece deshabilitado.

### 3. Subí el CSV

Arrastrá el archivo a la zona de drop o hacé clic en **Seleccionar archivo CSV**. La app valida los encabezados, parsea las fechas y precarga el rango de fechas con el mínimo y el máximo encontrados en el archivo.

Las filas con fechas ininterpretables se omiten y se informa cuántas fueron (no es un error: el resto del reporte se genera igual).

### 4. Elegí el rango y descargá el PDF

Ajustá **Desde** / **Hasta** y el campo por el que se filtra. El rango es inclusivo en ambos extremos. El botón **Descargar PDF** se habilita solo cuando el rango es válido y hay al menos una incidencia; el archivo se llama `reporte-tiempo-<desde>_<hasta>.pdf`.

> No hay persistencia: si recargás la página, se pierde el archivo cargado y hay que empezar de nuevo.

## Formato del CSV

### Columnas obligatorias

| Columna | Uso | Valor por defecto |
| --- | --- | --- |
| `Clave de incidencia` | Clave del ticket y destino del enlace | — |
| `Resumen` | Descripción de la incidencia | — |
| `Σ Tiempo empleado` | Tiempo en **segundos** (ej. `5400` = 1 h 30 min) | `0` |
| `Persona asignada` | Agrupación del resumen por persona | `Sin asignar` |
| `Estado` | Estado de la incidencia | `—` |
| `Creada` | Fecha de creación, usada al filtrar por *Creada* | — |
| `Actualizada` | Fecha de actualización, usada al filtrar por *Actualizada* | — |

Si falta alguna columna obligatoria, la app se detiene y muestra cuáles encontró y cuáles le faltan.

### Fechas

El formato esperado es el que exporta Jira en español:

```
01/09/2026 10:15 am
1/sep/26 10:15 pm
```

- `dd/mm/aaaa` (o `d/mes/aa`), dos años se expanden a `20xx` / `19xx`.
- Mes en abreviatura en español: `ene`, `feb`, `mar`, `abr`, `may`, `jun`, `jul`, `ago`, `sep`, `oct`, `nov`, `dic`.
- Hora en formato de 12 horas con `am` / `pm`. Cualquier otra cosa se considera fecha inválida y la fila se omite.

> Ojo con septiembre: el parser acepta `sep` pero no `sept`. Si tu Jira exporta `sept`, esas filas se van a omitir y la app te avisa cuántas fueron.

### Tiempo empleado

El valor debe ser un **número en segundos**. Valores vacíos, no numéricos o `<= 0` cuentan como `0` y la celda se muestra como `—`. En la práctica, menos de 30 segundos se redondea a `—` también.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Type-check (`tsc -b`) + build de producción en `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | Lint con [oxlint](https://oxc.rs) (`.oxlintrc.json`). |

El lint corre con las reglas `react/rules-of-hooks` y `react/only-export-components`. Si querés habilitar las reglas con información de tipos, instalá `oxlint-tsgolint` y agregá `options.typeAware: true` a `.oxlintrc.json` (el build ya falla igual si hay errores de tipos, porque `npm run build` corre `tsc -b` primero).

## Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **@tanstack/react-form** + **zod** — formulario y validación de la URL de Jira
- **papaparse** — parsing del CSV
- **jspdf** + **jspdf-autotable** — generación del PDF
- **oxlint** — linter

No hay librería de estilos: el CSS es propio y vive en `src/index.css`. La interfaz está en español y declara `lang="es"`.

## Estructura del proyecto

```
src/
├── App.tsx                    # Wizard de 2 pasos + estado del reporte
├── main.tsx                   # Entry point
├── index.css                  # Estilos (549 líneas, sin framework)
├── components/
│   ├── JiraUrlForm.tsx        # Paso 1: URL de Jira
│   ├── FileSelector.tsx       # Dropzone + input de archivo
│   ├── Filters.tsx            # Rango de fechas y campo de filtrado
│   ├── PreviewTable.tsx       # Detalle de incidencias con enlaces
│   └── Summary.tsx            # Tarjetas + tabla por persona asignada
├── lib/
│   ├── csv.ts                 # Validación de encabezados y parseo a `Issue`
│   ├── aggregate.ts           # Totales, conteos y agrupación por assignee
│   └── pdf.ts                 # Layout del PDF (header, tablas, pie)
└── utils/
    ├── date.util.ts           # Parseo y formato de fechas de Jira
    ├── time.util.ts           # Segundos → "1 h 30 min"
    ├── jira.util.ts           # Normalización de URL y armado de enlaces
    └── validation.util.ts     # Aplanado de errores del form
```

## Cómo funciona por dentro

1. `parseCsv` (`lib/csv.ts`) normaliza los encabezados (quita BOM y espacios), exige las 7 columnas, parsea `Creada` y `Actualizada` con `parseJiraDate` y descarta las filas con fecha inválida. Devuelve un resultado discriminado: `{ ok: true, ... }` o `{ ok: false, error }`.
2. `App.tsx` filtra en memoria con `dayKey` (un entero `aaaammdd`, que ordena y compara sin `Date`), y de ahí salen `totalSeconds` y los datos agregados.
3. La descarga usa `import('./lib/pdf')` — el código de PDF se carga recién al hacer clic, así que jsPDF no entra en el bundle inicial.
4. `buildPdf` genera un A4 apaisado: encabezado con el rango, tabla de incidencias con `showHead: 'everyPage'` y `pageBreak: 'auto'`, tabla resumen por persona, contadores de incidencias sin tiempo y numeración de páginas. Los enlaces se agregan en `didDrawCell` con `jspdf.link` sobre la columna de la clave.

## Build y deploy

```bash
npm run build   # genera dist/
npm run preview # sirve dist/ localmente
```

`dist/` es estático: sirve en GitHub Pages, Netlify, Vercel, S3, o cualquier hosting de archivos estáticos. No necesita configuración de servidor porque no hay servidor.

## Licencia

El repositorio todavía no incluye un archivo `LICENSE`. Agregalo antes de publicar el código fuera de tu entorno.

## Autor

[DiegoIpaez](https://github.com/DiegoIpaez)
