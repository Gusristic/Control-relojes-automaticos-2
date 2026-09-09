# Horology Sheets - Control de Desviación y Precisión de Relojes

Aplicación web para medir, registrar y analizar la precisión y desviación temporal (segundos/día) de relojes mecánicos y automáticos en diferentes posiciones y condiciones de uso.

---

## ⚡ Ejecución Instantánea (Sin instalación, sin Node ni Vite)

Toda la aplicación está integrada en un **único archivo autónomo `index.html`**:

1. **Doble clic**: Abre directamente el archivo `index.html` en cualquier navegador web (Chrome, Firefox, Safari, Edge).
2. **Netlify Drop / Vercel / GitHub Pages**: Arrastra la carpeta o el archivo `index.html` a [app.netlify.com/drop](https://app.netlify.com/drop) para publicarlo en internet en 5 segundos sin necesidad de compilar.
3. **100% Autónomo**: Los paquetes necesarios (React, ReactDOM, Babel, Tailwind CSS y Lucide Icons) se cargan vía CDN y todo el código se interpreta de forma directa en el navegador.

---

## 💻 Ejecución opcional con Node.js / Vite (Servidor Local)

Si prefieres ejecutar un servidor local con Vite:

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Arranca el servidor local:
   ```bash
   npm run dev
   ```
3. Abre **http://localhost:3000** en tu navegador.

---

## 🛠️ Comandos disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga rápida en `http://localhost:3000`. |
| `npm run build` | Compila la aplicación para producción generando los archivos optimizados en la carpeta `dist/`. |
| `npm run preview` | Previsualiza localmente la versión de producción compilada. |
| `npm run lint` | Comprueba tipos de TypeScript y valida que no haya errores de compilación. |

---

## ⏱️ Características principales

- **Comparador en Vivo**: Lee la hora exacta de referencia del sistema al segundo y permite contrastarla directamente con la hora mostrada por el reloj para registrar la desviación de forma instantánea.
- **Hoja de cálculo tipo Excel/Sheets**: Tabla detallada con fechas, horas, desviación puntual, desviación acumulada, tasa diaria estimada (**s/d**) y observaciones.
- **Análisis por Posiciones**: Cálculo de medias y variación según la posición del reloj (Esfera arriba, Esfera abajo, Corona a las 9/3/12/6, o en cargador automático rotativo).
- **Gráficas de Evolución**: Visualización interactiva de la deriva temporal y la tasa diaria s/d a lo largo del tiempo.
- **Exportación e Importación**:
  - Descarga instantánea de la hoja de cálculo en formato **CSV**.
  - Copias de seguridad completas en formato **JSON** (exportar e importar toda la colección y mediciones).
  - Integración opcional con Google Sheets.
- **Privacidad y Funcionamiento Offline**: Todos los datos se guardan de manera segura en el almacenamiento local del navegador (`localStorage`), funcionando 100% desconectado de internet sin enviar datos a servidores externos.
