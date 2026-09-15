const DATA_URL = 'https://goescat.github.io/Taiwan-Tech-Conferences/data/conferences.json';

const state = {
  events: [],
  month: new Date(2026, 8, 1),
  city: 'All',
};

const app = document.querySelector('#app');

const cityNames = {
  Taipei: '台北',
  Taichung: '台中',
  Tainan: '台南',
  Kaohsiung: '高雄',
  Hualien: '花蓮',
  Chiayi: '嘉義',
  Online: 'Online',
};

const pad = (n) => String(n).padStart(2, '0');
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value) => new Date(`${value}T00:00:00`);

function flattenData(data) {
  return data.flatMap((conference) =>
    conference.editions.map((edition) => ({
      ...edition,
      conferenceId: conference.id,
      name: conference.name,
      organizer: conference.organizer,
      website: conference.website,
    }))
  ).sort((a, b) => a.start_date.localeCompare(b.start_date));
}

function formatRange(event) {
  const start = parseDate(event.start_date);
  const end = parseDate(event.end_date);
  const sameDay = event.start_date === event.end_date;
  const options = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString('en-US', options);
  const e = end.toLocaleDateString('en-US', options);
  return sameDay ? s : `${s} – ${e}`;
}

function monthTitle(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function eventOccursOn(event, date) {
  const d = iso(date);
  return d >= event.start_date && d <= event.end_date;
}

function getVisibleEvents() {
  return state.events.filter((e) => state.city === 'All' || e.city === state.city);
}

function getFutureEvents() {
  const today = iso(new Date());
  return getVisibleEvents()
    .filter((event) => event.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

function formatTableDate(event) {
  const start = parseDate(event.start_date);
  const end = parseDate(event.end_date);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameDay = event.start_date === event.end_date;
  const startOptions = { month: 'short', day: 'numeric' };
  const endOptions = { month: 'short', day: 'numeric' };
  if (!sameYear) {
    startOptions.year = 'numeric';
    endOptions.year = 'numeric';
  }
  const s = start.toLocaleDateString('en-US', startOptions);
  const e = end.toLocaleDateString('en-US', endOptions);
  return sameDay ? s : `${s} – ${e}`;
}

function render() {
  const year = state.month.getFullYear();
  const month = state.month.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7; // Monday first
  const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;
  const cities = [...new Set(state.events.map((e) => e.city).filter(Boolean))].sort();

  const visibleEvents = getVisibleEvents();
  const futureEvents = getFutureEvents();

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(year, month, i - startOffset + 1);
    const inMonth = date.getMonth() === month;
    const events = visibleEvents.filter((event) => eventOccursOn(event, date));
    const today = iso(date) === iso(new Date());

    return `
      <div class="day ${inMonth ? '' : 'muted'} ${today ? 'today' : ''}">
        <div class="day-number">${date.getDate()}</div>
        <div class="events">
          ${events.map((event) => `
            <button class="event" data-event="${event.conferenceId}|${event.year}" title="${escapeHtml(event.name)}">
              <span class="event-dot"></span>
              <span class="event-name">${escapeHtml(event.name)}</span>
            </button>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <main class="page">
      <header class="header">
        <div>
          <h1>Taiwan Tech Conferences</h1>
          <p class="subtitle">台灣技術研討會行事曆</p>
        </div>
        <div class="controls">
          <button class="today-button" id="today">今天</button>
          <button class="next-event-button" id="next-event">最近的活動</button>
          <label class="select-wrap">
            <span class="sr-only">City</span>
            <select id="city">
              <option value="All">所有城市</option>
              ${cities.map((city) => `<option value="${escapeHtml(city)}" ${state.city === city ? 'selected' : ''}>${cityNames[city] ?? city}</option>`).join('')}
            </select>
          </label>
        </div>
      </header>

      <section class="calendar-shell">
        <div class="calendar-toolbar">
          <button class="nav-button" id="prev" aria-label="Previous month">‹</button>
          <h2>${monthTitle(state.month)}</h2>
          <button class="nav-button" id="next" aria-label="Next month">›</button>
        </div>
        <div class="weekdays">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div>${d}</div>`).join('')}
        </div>
        <div class="calendar">${cells}</div>
      </section>

      <section class="upcoming-shell" id="upcoming">
        <div class="section-heading">
          <div>
            <h2>即將舉行</h2>
          </div>
          <span class="upcoming-count">${futureEvents.length} upcoming</span>
        </div>
        ${futureEvents.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>日期</th><th>Conference</th><th>城市</th><th>地點</th><th>官網</th></tr>
              </thead>
              <tbody>
                ${futureEvents.map((event) => `
                  <tr>
                    <td class="table-date">${formatTableDate(event)}</td>
                    <td><button class="table-event" data-event="${event.conferenceId}|${event.year}">${escapeHtml(event.name)}<span>${event.year}</span></button></td>
                    <td>${cityNames[event.city] ?? escapeHtml(event.city)}</td>
                    <td class="venue-cell">${escapeHtml(event.venue || '—')}</td>
                    <td><a class="table-link" href="${escapeHtml(event.link)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(event.name)}">↗</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-state">沒有符合條件的未來活動。</p>'}
      </section>

      <footer>
        <span>${visibleEvents.length} event${visibleEvents.length === 1 ? '' : 's'} in dataset</span>
        <span>Data: <a href="https://goescat.github.io/Taiwan-Tech-Conferences/data/conferences.json" target="_blank" rel="noreferrer">Taiwan Tech Conferences</a></span>
      </footer>
    </main>

    <div class="modal-backdrop hidden" id="modal">
      <article class="modal" role="dialog" aria-modal="true">
        <button class="close" id="close" aria-label="Close">×</button>
        <div id="modal-content"></div>
      </article>
    </div>
  `;

  document.querySelector('#prev').addEventListener('click', () => {
    state.month = new Date(year, month - 1, 1);
    render();
  });
  document.querySelector('#next').addEventListener('click', () => {
    state.month = new Date(year, month + 1, 1);
    render();
  });
  document.querySelector('#today').addEventListener('click', () => {
    const now = new Date();
    state.month = new Date(now.getFullYear(), now.getMonth(), 1);
    render();
  });

  document.querySelector('#next-event').addEventListener('click', () => {
    const nextEvent = getFutureEvents()[0];
    if (!nextEvent) return;
    const date = parseDate(nextEvent.start_date);
    state.month = new Date(date.getFullYear(), date.getMonth(), 1);
    render();
    requestAnimationFrame(() => {
      const button = document.querySelector(`.event[data-event="${CSS.escape(nextEvent.conferenceId)}|${nextEvent.year}"]`);
      button?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      button?.classList.add('event-highlight');
      setTimeout(() => button?.classList.remove('event-highlight'), 1400);
    });
  });
  document.querySelector('#city').addEventListener('change', (e) => {
    state.city = e.target.value;
    render();
  });

  document.querySelectorAll('.event').forEach((button) => {
    button.addEventListener('click', () => {
      const [id, yearValue] = button.dataset.event.split('|');
      const event = state.events.find((e) => e.conferenceId === id && String(e.year) === yearValue);
      if (event) openModal(event);
    });
  });

  document.querySelectorAll('.table-event').forEach((button) => {
    button.addEventListener('click', () => {
      const [id, yearValue] = button.dataset.event.split('|');
      const event = state.events.find((e) => e.conferenceId === id && String(e.year) === yearValue);
      if (event) openModal(event);
    });
  });
}

function openModal(event) {
  const modal = document.querySelector('#modal');
  const content = document.querySelector('#modal-content');
  content.innerHTML = `
    <p class="modal-kicker">${event.year} · ${escapeHtml(event.organizer)}</p>
    <h3>${escapeHtml(event.name)}</h3>
    <p class="modal-date">${formatRange(event)}</p>
    <dl>
      <div><dt>Location</dt><dd>${cityNames[event.city] ?? escapeHtml(event.city)}${event.venue ? ` · ${escapeHtml(event.venue)}` : ''}</dd></div>
      <div><dt>Organizer</dt><dd>${escapeHtml(event.organizer)}</dd></div>
    </dl>
    <a class="visit" href="${escapeHtml(event.link)}" target="_blank" rel="noreferrer">View conference website ↗</a>
  `;
  modal.classList.remove('hidden');
  document.querySelector('#close').focus();
}

function closeModal() {
  document.querySelector('#modal')?.classList.add('hidden');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'close' || e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.events = flattenData(await response.json());
    render();
  } catch (error) {
    app.innerHTML = `<main class="error"><h1>Unable to load conferences</h1><p>${escapeHtml(error.message)}</p><a href="${DATA_URL}" target="_blank" rel="noreferrer">Open data source ↗</a></main>`;
  }
}

init();
