# DataSybil ⚡

<p align="center">
  <strong>El IDE de Bases de Datos Abierto, Ultrarrápido y Ligero impulsado por Rust y Tauri v2</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Rust-1.75%2B-orange?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5%2B-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📖 Introducción

**DataSybil** es un entorno de desarrollo integrado (IDE) y cliente de bases de datos de escritorio, **open-source**, concebido como una alternativa moderna, nativa y de bajo consumo de recursos frente a herramientas tradicionales basadas en Java o Electron como **JetBrains DataGrip** y **DBeaver**.

Construido combinando la seguridad de memoria y rendimiento de **Rust** en el núcleo de datos con una interfaz reactiva en **Tauri v2**, DataSybil consume menos de **100 MB de RAM**, arranca de forma instantánea y ofrece la inteligencia de código que los desarrolladores exigen para trabajar con bases de datos en **Windows** y **Linux**.

---

## ✨ Características Principales

### 1. 🗄️ Conectividad Multi-Motor Nativa (Rust Engine)
* **PostgreSQL:** Conexión asíncrona mediante `sqlx` con introspección profunda de esquemas y tipos.
* **MySQL / MariaDB:** Conexión a servidores locales y remotos con soporte para todas las bases de datos del servidor y escape estricto de identificadores reservados con backticks.
* **SQLite:** Soporte para archivos locales `.db` / `.sqlite` y base de datos en memoria para pruebas instantáneas (*Demo Store* con un clic).

### 2. ⚡ Editor SQL Inteligente Multi-Consulta (Estilo DataGrip)
* **Detección de consulta bajo cursor:** Si tienes múltiples consultas separadas por punto y coma (`;`), DataSybil detecta exactamente la sentencia donde se encuentra el cursor y la resalta visualmente en el editor.
* **Ejecución selectiva con `Ctrl + Enter`:** Presiona `Ctrl + Enter` o pulsa **Ejecutar** para correr únicamente la consulta activa en el cursor, sin necesidad de seleccionarla manualmente.
* **Ejecución de selección:** Si seleccionas un fragmento de código, se ejecuta únicamente el bloque seleccionado.
* **Múltiples pestañas de consola:** Cada pestaña mantiene su propio script, resultados independientes y estado de ejecución.

### 3. 📊 Cuadrícula de Datos Interactiva (Data Grid)
* **Ordenamiento por columnas (Sorting):** Ordena cualquier columna de menor a mayor (`▲`) o mayor a menor (`▼`) con un clic. Distingue inteligentemente entre números (orden matemático) y textos (orden alfabético con `localeCompare`).
* **Filtro y búsqueda en memoria:** Localiza registros instantáneamente filtrando en tiempo real en todas las columnas devueltas.
* **Inspector de celdas:** Drawer lateral para ver y copiar campos JSON grandes, cadenas multilínea o valores binarios.
* **Métricas de rendimiento:** Tiempo exacto de respuesta del motor en milisegundos (`ms`) y contador de filas devueltas.

### 4. 💾 Exportación Nativa de Archivos ("Guardar como...")
* **Diálogo nativo de Windows / Linux:** Integración con `rfd` para abrir el explorador de archivos del sistema y elegir la carpeta y nombre del archivo de destino.
* **Descarga como Excel (`.xls`):** Genera una hoja de cálculo con encabezados estilizados y tipos de celda reconocidos directamente por Microsoft Excel y LibreOffice Calc.
* **Descarga como CSV (`.csv`):** Formateado con codificación **UTF-8 con BOM** (`\uFEFF`), evitando caracteres rotos en acentos y tildes.
* **Copiar al portapapeles:** Exportación instantánea a CSV, JSON, Markdown y sentencias `INSERT INTO` de SQL.

### 5. 🔍 Explorador de Esquemas y Fórmulas Rápidas
* **Árbol jerárquico:** Conexión → Base de datos / Esquema → Tablas / Vistas → Columnas con tipos y llave primaria (`PK`).
* **Insignias de recuento de filas:** Muestra la cantidad aproximada o real de líneas por tabla en el árbol (ej. `~1.5k filas`).
* **Menú de Fórmulas por Tabla (`...`):**
  * 🔢 **Contar líneas:** `SELECT COUNT(*) AS total_lineas FROM ...;`
  * 📋 **Primeras 100 líneas:** `SELECT * FROM ... LIMIT 100;`
  * ⏱️ **Últimas 100 líneas:** `SELECT * FROM ... ORDER BY 1 DESC LIMIT 100;`
  * ℹ️ **Ver estructura:** `DESCRIBE ...;`
  * ✏️ **Plantilla INSERT:** `INSERT INTO ... (...) VALUES (...);`

---

## 💻 Stack Tecnológico

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Backend / Core** | **Rust (2024 Edition)** | Motor de ejecución, concurrencia y seguridad de memoria. |
| **Framework Desktop** | **Tauri v2** | Orquestación IPC nativa multiplataforma con bajo consumo de RAM. |
| **Drivers de BD** | **`sqlx` (async con Tokio)** | Conexiones pooled a PostgreSQL, MySQL y SQLite. |
| **Diálogos de Archivo** | **`rfd` (Rusty File Dialog)** | Ventana nativa "Guardar como..." del sistema operativo. |
| **Parser / AST** | **`sqlparser-rs`** | Análisis sintáctico y extracción de sentencias SQL. |
| **Frontend UI** | **React 19 + TypeScript + Vite** | Interfaz de usuario reactiva y modular. |
| **Editor de Código** | **Monaco Editor (`@monaco-editor/react`)** | El editor de VS Code embebido con sintaxis SQL y keybindings. |
| **Estilos & Iconos** | **Tailwind CSS v4 + Lucide React** | Diseño de tema oscuro profesional inspirado en IDEs modernos. |

---

## 📦 Requisitos Previos por Plataforma

### 🪟 En Windows
1. **Node.js** (v18 o superior) y `npm`.
2. **Rust & Cargo** (Toolchain estable):
   * Descargar desde [rustup.rs](https://rustup.rs/) o ejecutar `winget install Rustlang.Rustup`.
3. **Microsoft C++ Build Tools:**
   * Instalado mediante Visual Studio Installer (Carga de trabajo *"Desarrollo para el escritorio con C++"*).
4. **WebView2 Runtime** (preinstalado en Windows 10 y 11).

---

### 🐧 En Linux (Ubuntu / Debian / Fedora / Arch)

Instala las dependencias del sistema requeridas por WebKitGTK y Tauri:

#### 🔹 Ubuntu / Debian / Pop!_OS / Linux Mint:
```bash
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### 🔹 Fedora / RHEL:
```bash
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install -y \
  openssl-devel \
  gtk3-devel \
  webkit2gtk4.1-devel \
  libayatana-appindicator-gtk3-devel \
  librsvg2-devel
```

#### 🔹 Arch Linux / Manjaro:
```bash
sudo pacman -Syu --needed \
  base-devel \
  curl \
  wget \
  openssl \
  gtk3 \
  webkit2gtk-4.1 \
  libayatana-appindicator \
  librsvg
```

#### Instalar Node.js y Rust en Linux:
```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Instalar Node.js (usando nvm o gestor del sistema)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/datasybil.git
cd datasybil
```

### 2. Instalar Dependencias del Frontend
```bash
npm install
```

### 3. Iniciar en Modo Desarrollo (Hot-Reload)
```bash
# En Windows (PowerShell)
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
npm run tauri dev

# En Linux / macOS
npm run tauri dev
```
La aplicación compilará el backend en Rust y lanzará la ventana de escritorio con recarga en caliente para cambios de código en tiempo real.

---

## 🔨 Compilar para Producción (Release Binaries)

Para generar el instalador nativo y el ejecutable optimizado para tu sistema operativo:

```bash
npm run tauri build
```

Los artefactos se generarán en:
* **Windows:** `src-tauri/target/release/bundle/msi/` y `nsis/` (instaladores `.msi` y `.exe`).
* **Linux:** `src-tauri/target/release/bundle/deb/` y `appimage/` (paquetes `.deb` y `.AppImage`).

---

## ⌨️ Atajos de Teclado Útiles

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + Enter` (o `Cmd + Enter`) | Ejecutar la consulta SQL activa en la posición del cursor o el texto seleccionado. |
| `Ctrl + F` | Buscar texto en el editor SQL. |
| `Ctrl + /` | Comentar o descomentar líneas SQL seleccionadas (`--`). |
| `Doble Clic` en celda | Abrir el inspector de detalles de la celda. |
| `Doble Clic` en tabla | Cargar y ejecutar automáticamente `SELECT * FROM tabla LIMIT 100`. |

---

## 🗺️ Roadmap de Próximas Características

- [ ] Soporte para túneles SSH nativos con autenticación por clave (`russh`).
- [ ] Planes de consulta visuales interactivos (`EXPLAIN / EXPLAIN ANALYZE`).
- [ ] Diagramas Entidad-Relación (ERD) generados en SVG y exportables a Mermaid.
- [ ] Edición interactiva directa en la cuadrícula (*CRUD in-place*) con vista previa del script de mutación antes de confirmar (`COMMIT`).
- [ ] Comparador de esquemas (*Schema Diff*) con generación de migraciones DDL.
- [ ] Formateador de código SQL con reglas personalizables.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si deseas reportar un error o proponer una mejora:
1. Haz un fork del repositorio.
2. Crea tu rama de características (`git checkout -b feature/nueva-caracteristica`).
3. Confirma tus cambios (`git commit -m 'feat: añadir nueva funcionalidad'`).
4. Sube tu rama (`git push origin feature/nueva-caracteristica`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
