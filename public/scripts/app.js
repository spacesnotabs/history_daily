const dom = {
  factCard: document.getElementById('fact-card'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  eventDate: document.getElementById('event-date'),
  eventTitle: document.getElementById('event-title'),
  eventSummary: document.getElementById('event-summary'),
  eventImportance: document.getElementById('event-importance'),
  mediaSection: document.getElementById('media-section'),
  mediaGallery: document.getElementById('media-gallery'),
  booksSection: document.getElementById('books-section'),
  booksList: document.getElementById('books-list'),
  sourcesSection: document.getElementById('sources-section'),
  sourcesList: document.getElementById('sources-list'),
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userInfo: document.getElementById('user-info'),
};

document.getElementById('year').textContent = new Date().getFullYear();

function toggleState(state) {
  dom.loading.hidden = state !== 'loading';
  dom.error.hidden = state !== 'error';
  dom.factCard.hidden = state !== 'ready';
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    return date;
  }
}

function renderMedia(media = []) {
  dom.mediaGallery.innerHTML = '';
  if (!Array.isArray(media) || media.length === 0) {
    dom.mediaSection.hidden = true;
    return;
  }

  media.forEach((item) => {
    if (!item?.url) return;
    const container = document.createElement('figure');
    container.className = 'media-item';

    if (item.type === 'video') {
      const iframe = document.createElement('iframe');
      iframe.src = item.url;
      iframe.title = item.caption || 'Historical video';
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.caption || 'Historical image';
      img.loading = 'lazy';
      container.appendChild(img);
    }

    if (item.caption) {
      const caption = document.createElement('figcaption');
      caption.className = 'media-item__caption';
      caption.textContent = item.caption;
      container.appendChild(caption);
    }

    dom.mediaGallery.appendChild(container);
  });

  dom.mediaSection.hidden = dom.mediaGallery.children.length === 0;
}

function renderList(container, items = [], mapFn) {
  container.innerHTML = '';
  if (!Array.isArray(items) || items.length === 0) {
    container.parentElement.hidden = true;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = mapFn(item);
    container.appendChild(li);
  });

  container.parentElement.hidden = false;
}

function renderFact(fact) {
  dom.eventDate.textContent = fact.eventDate ? formatDate(fact.eventDate) : '';
  dom.eventTitle.textContent = fact.title || 'Historic Highlight';
  dom.eventSummary.textContent = fact.summary || '';
  dom.eventImportance.textContent = fact.whyItMatters || '';
  dom.eventImportance.hidden = !fact.whyItMatters;

  renderMedia(fact.media);
  renderList(dom.sourcesList, fact.sources, (source) => {
    const description = source.description ? `<p>${source.description}</p>` : '';
    return `
      <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title || source.url}</a>
      ${description}
    `;
  });

  renderList(dom.booksList, fact.books, (book) => {
    const parts = [];
    parts.push(`<a href="${book.amazonUrl}" target="_blank" rel="noopener noreferrer">${book.title || 'View on Amazon'}</a>`);
    if (book.author) {
      parts.push(`<p><strong>Author:</strong> ${book.author}</p>`);
    }
    if (book.description) {
      parts.push(`<p>${book.description}</p>`);
    }
    return parts.join('');
  });
}

async function loadFact() {
  toggleState('loading');
  try {
    const response = await fetch('/api/daily-fact');
    if (!response.ok) throw new Error('Request failed');
    const payload = await response.json();
    if (!payload?.data) throw new Error('Invalid payload');
    renderFact(payload.data);
    toggleState('ready');
  } catch (error) {
    console.error('Failed to load fact', error);
    toggleState('error');
  }
}

function setupAuth() {
  if (!window.firebase) {
    console.warn('Firebase SDK not loaded. Authentication disabled.');
    dom.loginBtn.disabled = true;
    return;
  }

  const app = firebase.initializeApp(window.__FIREBASE_CONFIG__);
  const auth = firebase.auth(app);
  const provider = new firebase.auth.GoogleAuthProvider();

  dom.loginBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider).catch((error) => {
      console.error('Login failed', error);
    });
  });

  dom.logoutBtn.addEventListener('click', () => {
    auth.signOut().catch((error) => {
      console.error('Logout failed', error);
    });
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      dom.userInfo.textContent = `Signed in as ${user.displayName || user.email}`;
      dom.loginBtn.hidden = true;
      dom.logoutBtn.hidden = false;
    } else {
      dom.userInfo.textContent = 'Access extra features by signing in.';
      dom.loginBtn.hidden = false;
      dom.logoutBtn.hidden = true;
    }
  });
}

setupAuth();
loadFact();
