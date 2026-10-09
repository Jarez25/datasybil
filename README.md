# DataSybil ⚡

**DataSybil** es un gestor y entorno de desarrollo (IDE) de bases de datos de escritorio, **open-source**, ultrarrápido y ligero, construido con el rendimiento y la seguridad de **Rust** y la agilidad de **Tauri v2**.

Inspirado en la inteligencia de **JetBrains DataGrip**, DataSybil está diseñado para ofrecer una experiencia de usuario moderna sin el consumo excesivo de memoria RAM de las alternativas basadas en Java (DBeaver/DataGrip) o Electron.

---

## 🚀 Características Principales

*   **Motor Multi-Driver en Rust:**
    *   Conectividad nativa asíncrona a **PostgreSQL**, **MySQL / MariaDB** y **SQLite** mediante `sqlx` y `tokio`.
    *   Base de datos de demostración en memoria (*Demo Store*) integrada con un solo clic para pruebas inmediatas.
*   **Explorador de Esquemas (Database Tree):**
    *   Introspección asíncrona en segundo plano de catálogos (`information_schema`, `sqlite_master`, `PRAGMA`).
    *   Navegación jerárquica: *Conexión → Esquema → Tablas / Vistas → Columnas con tipos de datos y llaves primarias (PK)*.
    *   Acceso rápido a consultas con doble clic en cualquier tabla (`SELECT * FROM table LIMIT 100`).
*   **Editor SQL Inteligente (Monaco Engine):**
    *   Resaltado de sintaxis SQL completo con atajo de ejecución rápida (`Ctrl + Enter`).
    *   Consolas de consulta multi-pestaña con aislamiento de sesión y estado de ejecución en tiempo real.
*   **Cuadrícula de Resultados (Data Grid):**
    *   Visualizador tabular virtualizado con contador de filas y cronómetro de latencia del motor (en milisegundos).
    *   Filtro y búsqueda instantánea en memoria en todas las columnas.
    *   Inspector de celda dedicado para visualizar payloads JSON grandes o textos formateados.
    *   Exportación con un solo clic al portapapeles: **CSV**, **JSON**, **Markdown** y **SQL INSERTs**.
*   **Análisis y Validación de Consultas (AST):**
    *   Parser y linter sintáctico integrado mediante `sqlparser-rs`.

---

## 🏗️ Arquitectura Técnica

```
datasybil/
├── src-tauri/                 # Backend nativo en Rust
│   ├── Cargo.toml            # Dependencias: tauri v2, sqlx, tokio, sqlparser, serde
│   ├── src/
│   │   ├── lib.rs            # Comandos IPC de Tauri y punto de entrada
│   │   ├── db.rs             # DatabaseManager: pools, introspección y ejecución
│   │   ├── models.rs         # Modelos de metadatos, conexiones y resultados
│   │   └── main.rs           # Binario de la app
├── src/                      # Frontend Desktop (Vite + React + TypeScript + Tailwind)
│   ├── components/
│   │   ├── Sidebar.tsx       # Árbol de esquemas y navegación de conexiones
│   │   ├── SqlEditor.tsx     # Editor SQL Monaco con keybindings
│   │   ├── ResultsGrid.tsx   # Cuadrícula virtualizada, filtros e inspector
│   │   └── NewConnectionModal.tsx # Modal de configuración multi-motor
│   ├── types.ts              # Tipos compartidos
│   ├── App.tsx               # Orquestador del workspace y consolas
│   └── main.tsx
```

---

## 🛠️ Requisitos e Instalación

### Requisitos Previos:
1. **Node.js** (v18+) y `npm`.
2. **Rust & Cargo** (v1.75+ con toolchain estable).
3. **Microsoft C++ Build Tools** (en Windows).

### Ejecutar en Desarrollo:
```bash
# 1. Instalar dependencias de frontend
npm install

# 2. Iniciar la aplicación de escritorio en modo desarrollo
npm run tauri dev
```

### Compilar para Producción (Binario Nativo):
```bash
npm run tauri build
```
El instalador y ejecutable nativo optimizado se generará en `src-tauri/target/release/`.

---

## 🗺️ Roadmap Abierto

- [ ] Soporte para túneles SSH nativos (`russh`).
- [ ] Visualizador de planes de consulta interactivos (`EXPLAIN / EXPLAIN ANALYZE`).
- [ ] Diagramas Entidad-Relación (ERD) generados automáticamente en SVG/Mermaid.
- [ ] Edición interactiva directa en la cuadrícula (*CRUD in-place*) con vista previa de mutación.
- [ ] Comparador de esquemas (*Schema Diff*) y generador de migraciones DDL.
