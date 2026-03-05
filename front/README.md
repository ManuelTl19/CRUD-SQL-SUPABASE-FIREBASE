# Frontend React (CRUD API Northwind)

Frontend en React + Vite para consumir todas las APIs del backend.

## Requisitos

- Backend ejecutándose (por defecto en `http://localhost:3000`)
- Node.js 18+

## Instalar y ejecutar

```bash
npm install
npm run dev
```

## Variables de entorno (opcional)

Puedes crear `front/.env` para cambiar la URL del backend:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Si no defines esta variable, el frontend usa `http://localhost:3000` por defecto.

## Qué incluye

- Navegación por páginas de recurso (`/resource/:resourceKey`).
- Cada página consume primero la API de listado (`GET /api/<recurso>`) y muestra tarjetas.
- Cada tarjeta incluye acciones con íconos:
	- Editar (`Pencil`)
	- Eliminar (`Trash`)
- Barra superior con `@` para búsqueda rápida (`@ buscar...`).
- Botón `@ Nuevo` para crear registros con formulario dinámico.
- Formulario modal para crear/editar con guardado al backend.
- Soporte de llaves compuestas en edición/eliminación según recurso.

## Arquitectura empresarial (modular)

```text
src/
	components/
		common/          # componentes base reutilizables
		forms/           # formularios de entrada y acciones CRUD
		layout/          # sidebar y cabecera
		panels/          # paneles de acciones, resultados y tabla
	config/            # variables de entorno y catálogo de recursos
	hooks/             # lógica de estado y orquestación (useCrudWorkspace)
	services/          # cliente HTTP y capa de acceso API
	styles/            # estilos globales del sistema
	utils/             # helpers de JSON y mapeo de IDs
	App.jsx            # composición principal
	main.jsx           # bootstrap
```

### Capas

- `config`: define recursos/metadata y entorno.
- `services`: centraliza llamadas REST y manejo de errores.
- `hooks`: concentra estado y casos de uso CRUD.
- `components`: UI desacoplada y reutilizable.
- `utils`: funciones puras para parseo/formateo/mapeo.

## Build

```bash
npm run build
```
