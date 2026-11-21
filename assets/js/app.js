const DATA_URL = 'https://api.tvmaze.com';

const showsGrid = document.querySelector('#showsGrid');
const statusBox = document.querySelector('#status');
const searchForm = document.querySelector('#searchForm');
const searchInput = document.querySelector('#searchInput');
const resetButton = document.querySelector('#resetButton');
const modal = document.querySelector('#showModal');
const modalContent = document.querySelector('#modalContent');
const themeToggle = document.querySelector('#themeToggle');
const genreFilter = document.querySelector('#genreFilter');
const catalogTitle = document.querySelector('#catalogTitle');
const catalogSubtitle = document.querySelector('#catalogSubtitle');

let currentShows = [];
let activeGenre = 'Todos';

// Convierte el resumen recibido en texto plano antes de mostrarlo en la interfaz.
function stripHtml(html = '') {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

function getImage(show) {
  return show.image?.medium || 'https://placehold.co/420x590/1a1d24/f5f6f8?text=Sin+imagen';
}

function getOriginalImage(show) {
  return show.image?.original || show.image?.medium || getImage(show);
}

function getYear(show) {
  return show.premiered ? show.premiered.slice(0, 4) : 'Sin fecha';
}

function getRating(show) {
  return show.rating?.average ?? 'N/A';
}

function updateThemeButton() {
  const isLight = document.documentElement.dataset.theme === 'light';
  themeToggle.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  themeToggle.title = isLight ? 'Modo oscuro' : 'Modo claro';
}

// Cambia entre modo claro y oscuro y conserva la preferencia en el navegador.
function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('retropelis-theme', nextTheme);
  updateThemeButton();
}

function createShowCard(show) {
  const article = document.createElement('article');
  article.className = 'show-card';
  article.dataset.showId = show.id;

  article.innerHTML = `
    <button class="show-card__button" type="button" aria-label="Ver información de ${show.name}">
      <div class="show-card__media">
        <img class="show-card__image" src="${getImage(show)}" alt="Póster de ${show.name}" loading="lazy" />
        <span class="show-card__rating">★ ${getRating(show)}</span>
      </div>
      <div class="show-card__body">
        <p class="show-card__meta">${show.type || 'Serie'} · ${getYear(show)}</p>
        <h3 class="show-card__title">${show.name}</h3>
        <p class="show-card__genres">${show.genres?.length ? show.genres.slice(0, 3).join(' · ') : 'Más información disponible'}</p>
      </div>
    </button>
  `;

  article.querySelector('.show-card__button').addEventListener('click', () => openShowDetail(show));
  return article;
}

function renderShows(shows) {
  showsGrid.innerHTML = '';

  if (!shows.length) {
    statusBox.textContent = 'No encontramos títulos con ese filtro. Prueba con otra opción.';
    return;
  }

  statusBox.textContent = `${shows.length} título${shows.length === 1 ? '' : 's'} disponible${shows.length === 1 ? '' : 's'}.`;
  shows.forEach((show) => showsGrid.appendChild(createShowCard(show)));
}

function getAvailableGenres(shows) {
  const preferred = ['Drama', 'Comedy', 'Crime', 'Thriller', 'Action', 'Romance'];
  const found = new Set(shows.flatMap((show) => show.genres || []));
  return preferred.filter((genre) => found.has(genre)).slice(0, 5);
}

function renderGenreFilters(shows) {
  const genres = ['Todos', ...getAvailableGenres(shows)];
  genreFilter.innerHTML = '';

  genres.forEach((genre) => {
    const button = document.createElement('button');
    button.className = `genre-filter__button${genre === activeGenre ? ' is-active' : ''}`;
    button.type = 'button';
    button.textContent = genre;
    button.dataset.genre = genre;
    genreFilter.appendChild(button);
  });
}

function applyGenreFilter(genre) {
  activeGenre = genre;
  const filtered = genre === 'Todos'
    ? currentShows
    : currentShows.filter((show) => show.genres?.includes(genre));

  renderGenreFilters(currentShows);
  renderShows(filtered);
}

function setLoading(message) {
  statusBox.textContent = message;
  showsGrid.innerHTML = `
    <div class="loader-wrap" aria-live="polite">
      <div class="loader" aria-hidden="true"></div>
      <span>${message}</span>
    </div>
  `;
}

function setError(message) {
  statusBox.textContent = message;
  showsGrid.innerHTML = '<div class="empty-state">Intenta nuevamente en unos momentos.</div>';
}

// Carga una selección inicial de títulos para llenar el catálogo al entrar al sitio.
async function loadInitialShows() {
  setLoading('Preparando recomendaciones...');
  activeGenre = 'Todos';

  try {
    const response = await axios.get(`${DATA_URL}/shows?page=1`);
    currentShows = response.data.slice(0, 24);
    catalogTitle.textContent = 'Series para empezar a explorar';
    catalogSubtitle.textContent = 'Encuentra una historia nueva o busca ese título que tienes pendiente.';
    renderGenreFilters(currentShows);
    renderShows(currentShows);
  } catch (error) {
    console.error(error);
    setError('No fue posible cargar las recomendaciones.');
  }
}

// Busca títulos por nombre y actualiza el catálogo sin recargar la página.
async function searchShows(query) {
  setLoading(`Buscando “${query}”...`);
  activeGenre = 'Todos';

  try {
    const response = await axios.get(`${DATA_URL}/search/shows`, {
      params: { q: query }
    });

    currentShows = response.data.map((item) => item.show).slice(0, 24);
    catalogTitle.textContent = `Resultados para “${query}”`;
    catalogSubtitle.textContent = 'Selecciona un título para consultar su información y episodios.';
    renderGenreFilters(currentShows);
    renderShows(currentShows);
    document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    setError('Ocurrió un problema durante la búsqueda.');
  }
}

// Consulta los episodios del título elegido y construye una vista de detalle dentro del modal.
async function openShowDetail(show) {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  modalContent.innerHTML = '<div class="modal__loading">Preparando información...</div>';

  try {
    const response = await axios.get(`${DATA_URL}/shows/${show.id}/episodes`);
    const episodes = response.data.slice(0, 8);

    modalContent.innerHTML = `
      <div class="detail">
        <div class="detail__media">
          <img class="detail__poster" src="${getOriginalImage(show)}" alt="Póster de ${show.name}" />
        </div>
        <div class="detail__body">
          <p class="eyebrow">${show.type || 'Serie'} · ${getYear(show)}</p>
          <h2 class="detail__title" id="modalTitle">${show.name}</h2>
          <p class="detail__summary">${stripHtml(show.summary) || 'Todavía no hay una sinopsis disponible para este título.'}</p>
          <div class="detail__facts">
            <span>★ ${getRating(show)}</span>
            <span>${show.language || 'Idioma no disponible'}</span>
            <span>${show.status || 'Estado no disponible'}</span>
          </div>
          <h3 class="detail__subtitle">Primeros episodios</h3>
          <ol class="episode-list">
            ${episodes.length
              ? episodes.map((episode) => `
                <li class="episode-list__item">
                  <span>T${episode.season} · E${episode.number ?? '—'}</span>
                  <strong>${episode.name}</strong>
                </li>
              `).join('')
              : '<li class="episode-list__empty">No hay episodios disponibles.</li>'}
          </ol>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    modalContent.innerHTML = '<p class="modal__error">No fue posible cargar la información del título.</p>';
  }
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    searchInput.focus();
    statusBox.textContent = 'Escribe el nombre de una serie para comenzar la búsqueda.';
    return;
  }

  searchShows(query);
});

resetButton.addEventListener('click', () => {
  searchInput.value = '';
  loadInitialShows();
});

genreFilter.addEventListener('click', (event) => {
  const button = event.target.closest('[data-genre]');
  if (!button) return;
  applyGenreFilter(button.dataset.genre);
});

modal.addEventListener('click', (event) => {
  if (event.target.matches('[data-close-modal]')) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
});

themeToggle.addEventListener('click', toggleTheme);
updateThemeButton();
loadInitialShows();
