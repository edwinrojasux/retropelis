# RetroPelis

RetroPelis es una experiencia web para descubrir series, buscar títulos y consultar información de episodios desde una interfaz responsiva.

## Características

- Catálogo dinámico de series.
- Búsqueda por título sin recargar la página.
- Filtros por género generados a partir de los resultados disponibles.
- Vista de detalle con sinopsis, calificación, idioma, estado y primeros episodios.
- Modo claro y oscuro con preferencia guardada en `localStorage`.
- Diseño responsivo desde móviles pequeños hasta pantallas de escritorio amplias.
- Estados de carga, resultados vacíos y manejo de errores.

## Tecnologías

- HTML semántico
- SASS / CSS
- JavaScript Vanilla
- Axios
- TVmaze como fuente de información de series

## Estructura

```text
retropelis-ebac/
├── index.html
├── README.md
├── assets/
│   ├── css/main.css
│   ├── js/app.js
│   ├── img/
│   │   ├── logo.svg
│   │   └── banner.jpg
│   └── icons/
│       ├── moon.svg
│       └── sun.svg
└── scss/
    ├── main.scss
    ├── abstracts/
    ├── base/
    └── components/
```

## Ejecución local

Abrir la carpeta en VS Code y ejecutar `index.html` con Live Server.

## Enlaces

- Repositorio: pendiente
- Sitio publicado: pendiente

## Créditos de datos

La información de series es proporcionada por [TVmaze](https://www.tvmaze.com/).


### Integración de datos

RetroPelis integra distintas consultas de TVmaze para construir el catálogo, la búsqueda dinámica y la información detallada de episodios.
