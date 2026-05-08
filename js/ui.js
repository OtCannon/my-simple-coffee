import { state } from './state.js';

let DOM = {};

// --- Initialization ---

export function initUI() {
  DOM = {
    views: {
      dashboard: document.getElementById('view-dashboard'),
      stats: document.getElementById('view-stats'),
      settings: document.getElementById('view-settings'),
      recommend: document.getElementById('view-recommend')
    },
    tabs: {
      dashboard: document.getElementById('tab-dashboard'),
      stats: document.getElementById('tab-stats'),
      settings: document.getElementById('tab-settings'),
      recommend: document.getElementById('tab-recommend')
    },
    modals: {
      logger: document.getElementById('modal-logger'),
      flavor: document.getElementById('modal-flavor'),
      preference: document.getElementById('modal-preference')
    },
    buttons: {
      addLog: document.getElementById('btn-add-log'),
      closeModal: document.getElementById('btn-close-modal'),
      saveLog: document.getElementById('btn-save-log'),
      closeFlavor: document.getElementById('btn-close-flavor'),
      backFlavor: document.getElementById('btn-back-flavor'),
      addCurrentFlavor: document.getElementById('btn-add-current-flavor'),
      applyEdit: document.getElementById('btn-apply-edit'),
      cancelEdit: document.getElementById('btn-cancel-edit'),
      editActions: document.getElementById('edit-actions'),
      iLike: document.getElementById('btn-i-like'),
      closePreference: document.getElementById('btn-close-preference'),
      getRecommendations: document.getElementById('btn-get-recommendations')
    },
    modalTitle: document.querySelector('#modal-logger h2'),
    loggerForm: document.getElementById('logger-form-container'),
    flavorList: document.getElementById('flavor-list'),
    flavorTitle: document.getElementById('flavor-title'),
    logList: document.getElementById('log-list'),
    emptyState: document.getElementById('empty-state'),
    statsTotal: document.getElementById('stats-total'),
    statsContainer: document.getElementById('stats-container'),
    recommendList: document.getElementById('recommend-list'),
    preferenceForm: document.getElementById('preference-form-container')
  };

  setupNavigation();
  setupModals();
  setupPreferenceModal();
  setupFlavorListeners();
  renderLoggerForm();
  
  // State listener to update UI
  state.subscribe((appState) => {
    updateViews(appState.currentPage);
    updateTabs(appState.currentPage);
  });
}

// --- Navigation ---

function setupNavigation() {
  DOM.tabs.dashboard.addEventListener('click', () => state.update({ currentPage: 'dashboard' }));
  DOM.tabs.stats.addEventListener('click', () => state.update({ currentPage: 'stats' }));
  DOM.tabs.settings.addEventListener('click', () => state.update({ currentPage: 'settings' }));
  DOM.tabs.recommend.addEventListener('click', () => state.update({ currentPage: 'recommend' }));
}

function updateViews(currentPage) {
  Object.keys(DOM.views).forEach(key => {
    if (key === currentPage) {
      DOM.views[key].classList.remove('hidden');
      // small delay to trigger CSS transition
      setTimeout(() => {
        DOM.views[key].classList.remove('fade-exit');
        DOM.views[key].classList.add('fade-enter-active');
      }, 10);
    } else {
      DOM.views[key].classList.add('hidden');
      DOM.views[key].classList.remove('fade-enter-active');
    }
  });
}

function updateTabs(currentPage) {
  const activeClass = 'text-amber-600';
  const inactiveClass = 'text-gray-400';
  
  [DOM.tabs.dashboard, DOM.tabs.stats, DOM.tabs.settings, DOM.tabs.recommend].forEach(tab => {
    tab.classList.remove(activeClass);
    tab.classList.add(inactiveClass);
  });

  if (currentPage === 'dashboard') {
    DOM.tabs.dashboard.classList.replace(inactiveClass, activeClass);
  } else if (currentPage === 'stats') {
    DOM.tabs.stats.classList.replace(inactiveClass, activeClass);
  } else if (currentPage === 'settings') {
    DOM.tabs.settings.classList.replace(inactiveClass, activeClass);
  } else if (currentPage === 'recommend') {
    DOM.tabs.recommend.classList.replace(inactiveClass, activeClass);
  }
}

// --- Modals ---

function setupModals() {
  DOM.buttons.addLog.addEventListener('click', () => {
    state.resetForm();
    renderLoggerForm();
    openModal(DOM.modals.logger);
  });

  DOM.buttons.closeModal.addEventListener('click', () => {
    closeModal(DOM.modals.logger);
  });
  
  DOM.buttons.closeFlavor.addEventListener('click', () => {
    closeModal(DOM.modals.flavor);
  });

  // Drag handle for modal
  let startY = 0;
  let currentY = 0;
  const handle = document.getElementById('modal-drag-handle');
  const modalContent = DOM.modals.logger.querySelector('.absolute.inset-x-0');
  
  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    modalContent.style.transition = 'none';
  });
  
  handle.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const dy = Math.max(0, currentY - startY);
    modalContent.style.transform = `translateY(${dy}px)`;
  });
  
  handle.addEventListener('touchend', (e) => {
    modalContent.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    const dy = currentY - startY;
    if (dy > 150) {
      closeModal(DOM.modals.logger);
    }
    modalContent.style.transform = '';
  });
}

export function openModal(modalEl) {
  modalEl.classList.remove('hidden');
  modalEl.classList.remove('slide-up-exit');
  // Reset scroll if it's the logger modal
  if (modalEl === DOM.modals.logger) {
    DOM.loggerForm.scrollTop = 0;
  }
  // Trigger reflow
  void modalEl.offsetWidth;
  modalEl.classList.add('slide-up-enter-active');
}

export function closeModal(modalEl) {
  modalEl.classList.remove('slide-up-enter-active');
  modalEl.classList.add('slide-up-exit-active');
  setTimeout(() => {
    modalEl.classList.add('hidden');
    modalEl.classList.remove('slide-up-exit-active');
    modalEl.classList.add('slide-up-exit');
  }, 300);
}

// --- Preference Modal (I Like...) ---

function setupPreferenceModal() {
  DOM.buttons.iLike.addEventListener('click', () => {
    renderPreferenceForm();
    openModal(DOM.modals.preference);
  });

  DOM.buttons.closePreference.addEventListener('click', () => {
    closeModal(DOM.modals.preference);
  });

  DOM.buttons.getRecommendations.addEventListener('click', () => {
    const appState = state.get();
    const manualPrefs = {
      ratings: appState.preferenceForm.ratings,
      flavors: appState.preferenceFlavorSelections
    };
    // Re-render recommendations with manual preferences
    renderRecommendations(appState.logs, appState.vendorRecommendations, manualPrefs);
    closeModal(DOM.modals.preference);
  });
}

export function renderPreferenceForm() {
  const appState = state.get();
  const formState = appState.preferenceForm;
  const flavors = appState.preferenceFlavorSelections;

  DOM.preferenceForm.innerHTML = `
    <div class="flex flex-col space-y-8 pb-20">
      <section>
        <h3 class="form-section-header">Sensory Preference</h3>
        <div class="glass-panel rounded-3xl p-6 space-y-6">
          ${renderPreferenceStarRating('Acidity', 'acid', formState.ratings.acid)}
          ${renderPreferenceStarRating('Sweetness', 'sweet', formState.ratings.sweet)}
          ${renderPreferenceStarRating('Bitterness', 'bitter', formState.ratings.bitter)}
          ${renderPreferenceStarRating('Body', 'body', formState.ratings.body)}
        </div>
      </section>

      <section>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Preferred Flavors</h3>
          <button id="btn-open-preference-flavor" class="text-amber-600 text-sm font-bold bg-amber-50 px-4 py-2 rounded-full active:scale-95 transition-transform">+ Add Flavor</button>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-50 rounded-3xl border border-gray-100 items-center">
          ${flavors.length === 0 ? '<span class="text-gray-400 text-sm italic mx-auto">Tap "+ Add Flavor" to select notes</span>' : 
            flavors.map(f => `
              <span class="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-sm border border-gray-100 animate-fade-in">
                ${f}
                <button class="ml-2 text-gray-300 hover:text-red-500 preference-flavor-remove-btn" data-flavor="${f}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </span>
            `).join('')
          }
        </div>
      </section>
    </div>
  `;

  attachPreferenceListeners();
}

function renderPreferenceStarRating(label, key, value) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= value;
    stars += `
      <button class="preference-star-btn ${isFilled ? 'star-filled' : 'star-empty'}" data-key="${key}" data-val="${i}">
        <svg class="w-8 h-8 fill-current pointer-events-none" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
      </button>
    `;
  }
  return `
    <div class="flex justify-between items-center">
      <span class="text-sm font-bold text-gray-700">${label}</span>
      <div class="star-rating">${stars}</div>
    </div>
  `;
}

function attachPreferenceListeners() {
  document.querySelectorAll('.preference-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = parseInt(btn.dataset.val);
      const preferenceForm = state.get().preferenceForm;
      preferenceForm.ratings[key] = val;
      state.update({ preferenceForm });
      
      // Update UI surgically
      const starContainer = btn.closest('.star-rating');
      starContainer.querySelectorAll('.preference-star-btn').forEach(s => {
        const sVal = parseInt(s.dataset.val);
        if (sVal <= val) {
          s.classList.add('star-filled');
          s.classList.remove('star-empty');
        } else {
          s.classList.remove('star-filled');
          s.classList.add('star-empty');
        }
      });
    });
  });

  document.getElementById('btn-open-preference-flavor').addEventListener('click', () => {
    openFlavorMenu('preference');
  });

  document.querySelectorAll('.preference-flavor-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const flavor = e.target.closest('.preference-flavor-remove-btn').dataset.flavor;
      const newFlavors = state.get().preferenceFlavorSelections.filter(f => f !== flavor);
      state.update({ preferenceFlavorSelections: newFlavors });
      renderPreferenceForm();
    });
  });
}

// --- Logger Form ---

export function renderLoggerForm() {
  const appState = state.get();
  const formState = appState.logForm;
  const flavors = appState.flavorSelections;
  const isEditing = appState.editingLogId !== null;
  
  // Update Modal Title and Buttons
  DOM.modalTitle.textContent = isEditing ? 'Edit Log' : 'New Log';
  
  if (isEditing) {
    DOM.buttons.saveLog.classList.add('hidden');
    DOM.buttons.editActions.classList.remove('hidden');
  } else {
    DOM.buttons.saveLog.classList.remove('hidden');
    DOM.buttons.editActions.classList.add('hidden');
  }

  DOM.loggerForm.innerHTML = `
    <div class="flex flex-col space-y-8 pb-20">
      
      <!-- 1. Basic Information -->
      <section class="flex flex-col items-center">
        <h3 class="form-section-header w-full">Basic Information</h3>
        <div class="w-full space-y-4 max-w-sm mx-auto">
          ${renderSuggestionInput('Store', 'store', formState.store)}
          ${renderSuggestionInput('Bean Name', 'bean_name', formState.bean_name)}
          
          <div class="w-full">
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
            <input type="date" id="input-date" value="${formState.date}" class="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all">
          </div>

          ${renderSuggestionInput('Region', 'region', formState.region)}
          ${renderSuggestionInput('Estate / Farm', 'estate_farm', formState.estate_farm)}
          ${renderSuggestionInput('Processing', 'process', formState.process)}

          <div class="w-full">
            <label class="block text-xs font-bold text-gray-400 uppercase mb-3">Roast Level</label>
            ${renderRoastSelector(formState.roast)}
          </div>
        </div>
      </section>

      <!-- 2. Sensory Profile -->
      <section>
        <h3 class="form-section-header">Sensory Profile</h3>
        <div class="glass-panel rounded-3xl p-6 space-y-6">
          ${renderStarRating('Acidity', 'acid', formState.ratings.acid)}
          ${renderStarRating('Sweetness', 'sweet', formState.ratings.sweet)}
          ${renderStarRating('Bitterness', 'bitter', formState.ratings.bitter)}
          ${renderStarRating('Body', 'body', formState.ratings.body)}
          <div class="pt-4 border-t border-gray-100">
            ${renderStarRating('Overall Score', 'overall', formState.ratings.overall)}
          </div>
        </div>
      </section>

      <!-- 3. Flavor -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Flavor</h3>
          <button id="btn-open-flavor" class="text-amber-600 text-sm font-bold bg-amber-50 px-4 py-2 rounded-full active:scale-95 transition-transform">+ Add Flavor</button>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-50 rounded-3xl border border-gray-100 items-center">
          ${flavors.length === 0 ? '<span class="text-gray-400 text-sm italic mx-auto">Tap "+ Add Flavor" to select notes</span>' : 
            flavors.map(f => `
              <span class="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-sm border border-gray-100 animate-fade-in">
                ${f}
                <button class="ml-2 text-gray-300 hover:text-red-500 flavor-remove-btn" data-flavor="${f}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </span>
            `).join('')
          }
        </div>
      </section>

      <!-- 4. Notes -->
      <section>
        <h3 class="form-section-header">Notes</h3>
        <textarea id="input-notes" rows="4" placeholder="Describe your experience..." class="w-full bg-gray-50 border border-gray-100 rounded-3xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none">${formState.notes}</textarea>
      </section>
      
    </div>
  `;

  attachFormListeners();
}

function renderSuggestionInput(label, id, value) {
  return `
    <div class="w-full relative">
      <label class="block text-xs font-bold text-gray-400 uppercase mb-1">${label}</label>
      <input type="text" id="input-${id}" value="${value}" autocomplete="off" class="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all suggestion-input" data-field="${id}">
      <div id="suggestions-${id}" class="suggestion-dropdown hidden"></div>
    </div>
  `;
}

function renderStarRating(label, key, value) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= value;
    stars += `
      <button class="star-btn ${isFilled ? 'star-filled' : 'star-empty'}" data-key="${key}" data-val="${i}">
        <svg class="w-8 h-8 fill-current pointer-events-none" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
      </button>
    `;
  }
  return `
    <div class="flex justify-between items-center">
      <span class="text-sm font-bold text-gray-700">${label}</span>
      <div class="star-rating">${stars}</div>
    </div>
  `;
}

function renderRoastSelector(currentLevel) {
  let beans = '';
  for (let i = 1; i <= 5; i++) {
    const isCumulative = i <= currentLevel;
    const isExact = i === currentLevel;
    beans += `
      <button class="roast-btn ${isCumulative ? 'active' : ''} ${isExact ? 'selected-main' : ''} roast-${i}" data-level="${i}">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 pointer-events-none"><path d="M12,2C10.3,2,8.6,2.7,7.3,4C4.8,6.5,4.8,10.6,7.3,13.1c0.7,0.7,1.6,1.2,2.5,1.5C10.7,21.3,16,22,16,22s-0.7-5.3-7.4-6.2 c-0.8-0.1-1.5-0.5-2.1-1.1C4.1,12.3,4.1,8.4,6.5,6c0.1-0.1,0.2-0.2,0.3-0.3C13.5,12.4,22,12,22,12S21.6,3.5,12,2z"/></svg>
      </button>
    `;
  }
  return `<div class="roast-selector">${beans}</div>`;
}

function attachFormListeners() {
  const updateFormState = () => {
    const logForm = state.get().logForm;
    const storeInp = document.getElementById('input-store');
    const beanInp = document.getElementById('input-bean_name');
    const regionInp = document.getElementById('input-region');
    const estateInp = document.getElementById('input-estate_farm');
    const processInp = document.getElementById('input-process');
    const notesInp = document.getElementById('input-notes');
    const dateInp = document.getElementById('input-date');

    if (storeInp) logForm.store = storeInp.value;
    if (beanInp) logForm.bean_name = beanInp.value;
    if (dateInp) logForm.date = dateInp.value;
    if (regionInp) logForm.region = regionInp.value;
    if (estateInp) logForm.estate_farm = estateInp.value;
    if (processInp) logForm.process = processInp.value;
    if (notesInp) logForm.notes = notesInp.value;
    
    state.update({ logForm });
  };

  ['store', 'bean_name', 'date', 'region', 'estate_farm', 'process', 'notes'].forEach(id => {
    const el = document.getElementById(`input-${id}`);
    if (el) el.addEventListener('input', updateFormState);
  });

  // Star listeners - Surgical update
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = parseInt(btn.dataset.val);
      const logForm = state.get().logForm;
      logForm.ratings[key] = val;
      state.update({ logForm });
      
      // Update UI surgically
      const starContainer = btn.closest('.star-rating');
      starContainer.querySelectorAll('.star-btn').forEach(s => {
        const sVal = parseInt(s.dataset.val);
        if (sVal <= val) {
          s.classList.add('star-filled');
          s.classList.remove('star-empty');
        } else {
          s.classList.remove('star-filled');
          s.classList.add('star-empty');
        }
      });
    });
  });

  // Roast listeners - Surgical update
  document.querySelectorAll('.roast-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level);
      const logForm = state.get().logForm;
      logForm.roast = level;
      state.update({ logForm });
      
      // Update UI surgically
      const roastContainer = btn.closest('.roast-selector');
      roastContainer.querySelectorAll('.roast-btn').forEach(r => {
        const rLevel = parseInt(r.dataset.level);
        if (rLevel <= level) {
          r.classList.add('active');
        } else {
          r.classList.remove('active');
        }
        if (rLevel === level) {
          r.classList.add('selected-main');
        } else {
          r.classList.remove('selected-main');
        }
      });
    });
  });

  // Suggestion listeners
  document.querySelectorAll('.suggestion-input').forEach(input => {
    const field = input.dataset.field;
    const dropdown = document.getElementById(`suggestions-${field}`);

    input.addEventListener('focus', () => {
      // Hide all other dropdowns first
      document.querySelectorAll('.suggestion-dropdown').forEach(d => d.classList.add('hidden'));
      const val = input.value;
      showSuggestions(field, val);
    });

    input.addEventListener('input', () => {
      const val = input.value;
      showSuggestions(field, val);
    });

    input.addEventListener('blur', () => {
      // Small delay to allow mousedown on suggestions to fire
      setTimeout(() => {
        dropdown.classList.add('hidden');
      }, 200);
    });
  });

  async function showSuggestions(field, query) {
    let filtered = [];
    
    if (field === 'process') {
      const options = [
        "Natural / Dry Process",
        "Washed / Wet Process",
        "Honey Process",
        "Semi-Washed / Giling Basah",
        "Anaerobic Fermentation",
        "Carbonic Maceration (CM)"
      ];
      filtered = options.filter(v => v.toLowerCase().includes(query.toLowerCase()));
    } else {
      const logs = state.get().logs;
      const allValues = logs.map(l => l[field]).filter(v => v && v.trim() !== '');
      const uniqueValues = [...new Set(allValues)];
      filtered = uniqueValues.filter(v => 
        v.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    }

    const dropdown = document.getElementById(`suggestions-${field}`);
    if (filtered.length > 0) {
      dropdown.innerHTML = filtered.map(v => `
        <div class="suggestion-item" data-val="${v}">${v}</div>
      `).join('');
      dropdown.classList.remove('hidden');
      
      dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          // Use mousedown to trigger before blur
          e.preventDefault(); // Prevent blur from firing too early if possible
          const val = item.dataset.val;
          const input = document.getElementById(`input-${field}`);
          input.value = val;
          dropdown.classList.add('hidden');
          updateFormState();
        });
      });
    } else {
      dropdown.classList.add('hidden');
    }
  }

  // Hide suggestions when clicking outside (fallback)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      document.querySelectorAll('.suggestion-dropdown').forEach(d => d.classList.add('hidden'));
    }
  });

  document.getElementById('btn-open-flavor').addEventListener('click', () => {
    openFlavorMenu('log');
  });

  document.querySelectorAll('.flavor-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const flavor = e.target.closest('.flavor-remove-btn').dataset.flavor;
      const newFlavors = state.get().flavorSelections.filter(f => f !== flavor);
      state.update({ flavorSelections: newFlavors });
      renderLoggerForm();
    });
  });
}

// --- Flavor Drill-down ---

let flavorContext = 'log'; // 'log' or 'preference'

export function openFlavorMenu(context = 'log') {
  flavorContext = context;
  const lexicon = state.get().lexicon;
  if (!lexicon.children) return;
  flavorPath = [];
  renderFlavorNode(lexicon);
  openModal(DOM.modals.flavor);
}

function renderFlavorNode(node) {
  currentFlavorNode = node;
  DOM.flavorTitle.textContent = node.name === 'Flavor Lexicon' ? 'Select Category' : node.name;
  
  if (flavorPath.length > 0) {
    DOM.buttons.backFlavor.classList.remove('hidden');
    // Hide the global "Add Current" button as we now have per-button "+" signs
    DOM.buttons.addCurrentFlavor.classList.add('hidden');
  } else {
    DOM.buttons.backFlavor.classList.add('hidden');
    DOM.buttons.addCurrentFlavor.classList.add('hidden');
  }

  // Animation: Fade out then fade in
  DOM.flavorList.style.opacity = '0';
  
  setTimeout(() => {
    DOM.flavorList.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-3 p-2 animate-fade-in';
    
    if (node.children) {
      node.children.forEach(child => {
        const tile = document.createElement('div');
        tile.className = 'relative h-32 bg-gray-100 rounded-3xl p-4 flex flex-col justify-end active:scale-95 transition-all cursor-pointer shadow-sm overflow-hidden group flavor-tile';
        tile.dataset.name = child.name;
        tile.dataset.hasChildren = !!child.children;
        
        tile.style.background = 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)';
        
        tile.innerHTML = `
          <div class="absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-amber-600 font-bold active:bg-amber-100 z-10 flavor-add-plus" data-flavor="${child.name}">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <span class="text-base font-bold text-gray-800 leading-tight pointer-events-none">${child.name}</span>
          ${child.children ? '<div class="mt-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider pointer-events-none">Tap to drill down</div>' : '<div class="mt-1 text-[10px] text-gray-300 font-medium uppercase tracking-wider pointer-events-none">Flavor</div>'}
        `;
        
        grid.appendChild(tile);
      });
    }
    
    DOM.flavorList.appendChild(grid);
    DOM.flavorList.style.opacity = '1';
    DOM.flavorList.classList.add('transition-opacity', 'duration-200');
  }, 100);
}

function setupFlavorListeners() {
  // Use event delegation for tiles
  DOM.flavorList.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.flavor-add-plus');
    const tile = e.target.closest('.flavor-tile');
    
    if (plusBtn) {
      e.stopPropagation();
      addFlavor(plusBtn.dataset.flavor);
      return;
    }
    
    if (tile) {
      const name = tile.dataset.name;
      const hasChildren = tile.dataset.hasChildren === 'true';
      const lexicon = state.get().lexicon;
      
      // Find the node in currentFlavorNode's children
      const childNode = currentFlavorNode.children.find(c => c.name === name);
      
      if (hasChildren && childNode) {
        flavorPath.push(currentFlavorNode);
        renderFlavorNode(childNode);
      } else {
        addFlavor(name);
      }
    }
  });

  DOM.buttons.backFlavor.addEventListener('click', () => {
    if (flavorPath.length > 0) {
      const parent = flavorPath.pop();
      renderFlavorNode(parent);
    }
  });

  DOM.buttons.addCurrentFlavor.addEventListener('click', () => {
    if (currentFlavorNode && currentFlavorNode.name !== 'Flavor Lexicon') {
      addFlavor(currentFlavorNode.name);
    }
  });
}

function addFlavor(flavorName) {
  if (flavorContext === 'log') {
    const flavors = state.get().flavorSelections;
    if (!flavors.includes(flavorName)) {
      state.update({ flavorSelections: [...flavors, flavorName] });
    }
    renderLoggerForm();
  } else {
    const flavors = state.get().preferenceFlavorSelections;
    if (!flavors.includes(flavorName)) {
      state.update({ preferenceFlavorSelections: [...flavors, flavorName] });
    }
    renderPreferenceForm();
  }
  closeModal(DOM.modals.flavor);
}

// --- Dashboard ---

export function renderDashboard(logs) {
  DOM.statsTotal.textContent = logs.length;
  
  if (logs.length === 0) {
    DOM.logList.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
    return;
  }
  
  const roastMap = {
    1: 'Light',
    2: 'Medium-Light',
    3: 'Medium',
    4: 'Medium-Dark',
    5: 'Dark'
  };
  
  DOM.emptyState.classList.add('hidden');
  DOM.logList.innerHTML = logs.map(log => `
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-gray-900 text-lg">${log.bean_name || 'Unnamed Bean'}</h3>
          <p class="text-sm text-gray-500">${log.store ? `at ${log.store} &middot; ` : ''}${log.region || 'Unknown Region'} &middot; ${roastMap[log.roast] || 'Medium'}</p>
        </div>
        <div class="flex flex-col items-end">
          <div class="flex items-center text-amber-500 font-bold">
            <svg class="w-4 h-4 mr-1 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            ${log.ratings.overall}
          </div>
          <span class="text-xs text-gray-400 mt-1">${log.date}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between pt-2 border-t border-gray-50">
        <div class="flex gap-1">
          ${(log.flavor_tags || []).slice(0, 3).map(f => `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">${f}</span>`).join('')}
          ${(log.flavor_tags && log.flavor_tags.length > 3) ? `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">+${log.flavor_tags.length - 3}</span>` : ''}
        </div>
        <div class="flex gap-2">
          <button class="btn-edit-log p-2 text-gray-400 hover:text-amber-600 active:scale-95 transition-all" data-id="${log.id}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button class="btn-delete-log p-2 text-gray-400 hover:text-red-500 active:scale-95 transition-all" data-id="${log.id}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach card listeners
  document.querySelectorAll('.btn-edit-log').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const event = new CustomEvent('edit-log', { detail: { id } });
      window.dispatchEvent(event);
    });
  });

  document.querySelectorAll('.btn-delete-log').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const event = new CustomEvent('delete-log', { detail: { id } });
      window.dispatchEvent(event);
    });
  });
}

// --- Statistics ---

export function renderStats(logs) {
  if (logs.length === 0) {
    DOM.statsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        <p>Log some coffee to see statistics!</p>
      </div>
    `;
    return;
  }

  // --- Statistical Method: Weighted Analysis ---
  // Weight formula: overall - 3 (Score 5 -> +2, 4 -> +1, 3 -> 0, 2 -> -1, 1 -> -2)
  
  const flavorAffinity = {};
  const roastStats = { 
    1: { sum: 0, count: 0 }, 
    2: { sum: 0, count: 0 }, 
    3: { sum: 0, count: 0 }, 
    4: { sum: 0, count: 0 }, 
    5: { sum: 0, count: 0 } 
  };
  const sensoryAffinity = { acid: 0, sweet: 0, bitter: 0, body: 0 };
  const dists = {
    score: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    roast: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    acid: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    sweet: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    bitter: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    body: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  let totalLogs = logs.length;
  let avgOverall = 0;

  logs.forEach(log => {
    const ratings = log.ratings || {};
    const score = ratings.overall || 3;
    const weight = score - 3; // -2 to +2
    avgOverall += score;
    
    if (dists.score[score] !== undefined) dists.score[score]++;
    if (log.roast !== undefined && dists.roast[log.roast] !== undefined) dists.roast[log.roast]++;

    // Weighted Flavor
    (log.flavor_tags || []).forEach(f => {
      flavorAffinity[f] = (flavorAffinity[f] || 0) + weight;
    });

    // Roast Stats (for averaging)
    if (log.roast !== undefined && roastStats[log.roast]) {
      roastStats[log.roast].sum += weight;
      roastStats[log.roast].count++;
    }

    // Sensory
    Object.keys(sensoryAffinity).forEach(key => {
      const val = ratings[key] || 3;
      sensoryAffinity[key] += (val - 3) * weight;
      if (dists[key] && dists[key][val] !== undefined) dists[key][val]++;
    });
  });

  avgOverall = (avgOverall / totalLogs).toFixed(1);

  // Calculate Average Averages
  const roastAffinity = {};
  Object.keys(roastStats).forEach(lvl => {
    roastAffinity[lvl] = roastStats[lvl].count > 0 ? (roastStats[lvl].sum / roastStats[lvl].count).toFixed(2) : 0;
  });

  Object.keys(sensoryAffinity).forEach(key => {
    sensoryAffinity[key] = (sensoryAffinity[key] / totalLogs).toFixed(2);
  });

  // Sort flavors by affinity
  const sortedFlavors = Object.entries(flavorAffinity)
    .sort((a, b) => b[1] - a[1]);
  
  const topFlavors = sortedFlavors.filter(f => f[1] > 0).slice(0, 5);
  const bottomFlavors = sortedFlavors.filter(f => f[1] < 0).sort((a, b) => a[1] - b[1]).slice(0, 3);
  const mostFavoriteFlavor = topFlavors.length > 0 ? topFlavors[0][0] : 'None';

  // Sensory Data for rendering
  const sensoryData = Object.entries(sensoryAffinity).map(([key, val]) => ({
    key,
    val: parseFloat(val)
  }));
  const sensoryMax = Math.max(...sensoryData.map(d => Math.abs(d.val)), 0.1);

  // Roast Labels
  const roastLabels = { 1: 'Light', 2: 'Med-Light', 3: 'Medium', 4: 'Med-Dark', 5: 'Dark' };
  const roastMax = Math.max(...Object.values(roastAffinity).map(v => Math.abs(v)), 0.1);

  // --- Recommendation Algorithms ---
  
  // 1. Profile Matching (Finding the "Soulmate" Coffee)
  const recommendationScores = logs.map(log => {
    let matchScore = 0;
    
    // Bonus for matching top flavors
    const topFlavorNames = topFlavors.map(tf => tf[0]);
    const flavorMatchCount = (log.flavor_tags || []).filter(f => topFlavorNames.includes(f)).length;
    matchScore += flavorMatchCount * 5;

    // Bonus for matching top roast
    const topRoastLevel = parseInt(Object.entries(roastAffinity).sort((a, b) => b[1] - a[1])[0][0]);
    if (log.roast === topRoastLevel) matchScore += 10;
    
    // Satisfaction bonus
    matchScore += (log.ratings.overall || 3) * 10;

    return { log, score: matchScore };
  }).sort((a, b) => b.score - a.score);

  const soulmateLog = recommendationScores[0].log;

  // 2. Target Specification (Synthetic Recommendation)
  const targetRoast = Object.entries(roastAffinity).sort((a, b) => b[1] - a[1])[0][0];
  
  // Find attributes with strongest preference
  const sortedByImportance = [...sensoryData].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  const targetSensory = sortedByImportance.slice(0, 2).map(s => {
    const prefix = s.val > 0 ? 'High' : 'Low';
    return `${prefix} ${s.key.charAt(0).toUpperCase() + s.key.slice(1)}`;
  });
  
  const targetFlavors = topFlavors.slice(0, 3).map(f => f[0]);

  // Render HTML
  DOM.statsContainer.innerHTML = `
    <!-- Top Highlight Card -->
    <div class="glass-panel rounded-3xl p-6 bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div class="relative z-10">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">Top Preference</p>
            <h2 class="text-3xl font-black">${mostFavoriteFlavor}</h2>
          </div>
          <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>
        <div class="mt-6 flex gap-4">
          <div class="flex-1">
            <p class="text-amber-100 text-[10px] font-bold uppercase">Avg. Satisfaction</p>
            <p class="text-xl font-bold">${avgOverall}/5.0</p>
          </div>
          <div class="flex-1 border-l border-white/20 pl-4">
            <p class="text-amber-100 text-[10px] font-bold uppercase">Experience Samples</p>
            <p class="text-xl font-bold">${totalLogs}</p>
          </div>
        </div>
      </div>
    </div>


    <!-- Personal Recommendation Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-2">
        <svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-tight">Personal Recommendations</h3>
      </div>
      
      <div class="grid grid-cols-1 gap-4">
        <!-- 1. Soulmate Coffee -->
        <div class="glass-panel rounded-3xl p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-100/50">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">Best Match Found</span>
            <div class="flex -space-x-2">
              <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[8px] font-black border-2 border-white">AI</div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mb-2">Your "Soulmate" cup from history:</p>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50">
            <h4 class="font-bold text-gray-900">${soulmateLog.bean_name}</h4>
            <p class="text-[10px] text-gray-500 uppercase font-bold">${soulmateLog.region} &middot; ${roastLabels[soulmateLog.roast]}</p>
          </div>
        </div>

        <!-- 2. Next Buy Specification -->
        <div class="glass-panel rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-100/50">
          <h4 class="text-xs font-bold text-amber-700 uppercase mb-4 tracking-widest">Next Purchase Guide</h4>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Target Roast</p>
                <p class="text-sm font-bold text-gray-800">${roastLabels[targetRoast]}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Sensory Focus</p>
                <p class="text-sm font-bold text-gray-800 capitalize">${targetSensory.join(' & ')}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Top Notes</p>
                <div class="flex gap-1 mt-1">
                  ${targetFlavors.map(f => `<span class="text-[8px] bg-white text-amber-700 px-2 py-0.5 rounded-full font-bold shadow-sm">${f}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sensory Affinity (Diverging Bars) -->
    <div class="glass-panel rounded-3xl p-6 bg-white border border-gray-100">
      <h3 class="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Sensory Preference (Avg.)</h3>
      <div class="space-y-3">
        ${sensoryData.map(s => {
          const perc = (s.val / sensoryMax) * 100;
          return `
            <div class="flex items-center gap-3">
              <span class="w-16 text-[10px] font-bold text-gray-500 uppercase">${s.key}</span>
              <div class="flex-1 h-8 bg-gray-50 rounded-xl relative overflow-hidden flex items-center">
                <div class="absolute left-1/2 h-full w-[1px] bg-gray-200 z-10"></div>
                <div class="h-4 ${s.val >= 0 ? 'bg-amber-500' : 'bg-red-400'} rounded-full transition-all duration-1000 animate-fade-in" 
                     style="width: ${Math.abs(perc)/2}%; ${s.val >= 0 ? 'margin-left: 50%' : 'margin-left: ' + (50 - Math.abs(perc)/2) + '%'}"></div>
              </div>
              <span class="w-8 text-[10px] font-black text-gray-400 text-right">${s.val > 0 ? '+' : ''}${s.val}</span>
            </div>
          `;
        }).join('')}
      </div>
      <p class="text-[9px] text-gray-400 mt-4 text-center italic">Values show average satisfaction shift per intensity unit (-2.0 to +2.0 scale).</p>
    </div>

    <!-- Roast Preference Diverging Chart -->
    <div class="glass-panel rounded-3xl p-6 bg-white border border-gray-100">
      <h3 class="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Roast Affinity</h3>
      <div class="space-y-3">
        ${[1, 2, 3, 4, 5].map(lvl => {
          const val = roastAffinity[lvl];
          const perc = (val / roastMax) * 100;
          return `
            <div class="flex items-center gap-3">
              <span class="w-16 text-[10px] font-bold text-gray-500">${roastLabels[lvl]}</span>
              <div class="flex-1 h-8 bg-gray-50 rounded-xl relative overflow-hidden flex items-center">
                <div class="absolute left-1/2 h-full w-[1px] bg-gray-200 z-10"></div>
                <div class="h-4 ${val >= 0 ? 'bg-amber-500' : 'bg-gray-300'} rounded-full transition-all duration-1000 animate-fade-in" 
                     style="width: ${Math.abs(perc)/2}%; ${val >= 0 ? 'margin-left: 50%' : 'margin-left: ' + (50 - Math.abs(perc)/2) + '%'}"></div>
              </div>
              <span class="w-8 text-[10px] font-black text-gray-400 text-right">${val > 0 ? '+' : ''}${val}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Flavor Affinity Leaderboard -->
    <div class="glass-panel rounded-3xl p-6 bg-white border border-gray-100 pb-10">
      <h3 class="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Flavor Affinity Leaderboard</h3>
      <div class="space-y-4">
        ${topFlavors.length > 0 ? topFlavors.map(([flavor, affinity], idx) => `
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-black text-xs mr-3">#${idx + 1}</div>
            <div class="flex-1 flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
              <span class="text-sm font-bold text-gray-800">${flavor}</span>
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500" style="width: ${(affinity / topFlavors[0][1]) * 100}%"></div>
                </div>
                <span class="text-xs font-black text-amber-600">+${affinity}</span>
              </div>
            </div>
          </div>
        `).join('') : '<p class="text-center text-gray-400 text-sm">No flavor preference data yet.</p>'}
        
        ${bottomFlavors.length > 0 ? `
          <div class="pt-4 border-t border-gray-50 mt-4">
            <h4 class="text-[10px] font-bold text-red-300 uppercase mb-3 tracking-widest">Low Affinity (Disliked)</h4>
            <div class="flex flex-wrap gap-2">
              ${bottomFlavors.map(([flavor, affinity]) => `
                <span class="bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-red-100">
                  ${flavor} (${affinity})
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Combined Distribution Line Plot -->
    <div class="glass-panel rounded-3xl p-6 bg-white border border-gray-100 mb-10">
      <h3 class="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Global Attribute Distribution</h3>
      
      <div class="relative h-64 w-full px-4">
        <svg viewBox="0 0 400 120" class="w-full h-full overflow-visible">
          <!-- Grid Lines -->
          ${[0, 30, 60, 90, 120].map(y => `<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="#f3f4f6" stroke-width="1" />`).join('')}
          
          ${Object.entries({
            score: '#f59e0b',
            roast: '#78350f',
            acid: '#0ea5e9',
            sweet: '#f43f5e',
            bitter: '#10b981',
            body: '#64748b'
          }).map(([key, color]) => {
            const data = dists[key];
            const max = Math.max(...Object.values(data), 1);
            const points = [1,2,3,4,5].map((lvl, i) => {
              const x = (i * 100); // 0, 100, 200, 300, 400
              const y = 120 - (data[lvl] / max) * 110; // 110% height to keep circles in view
              return `${x},${y}`;
            }).join(' ');
            return `
              <polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="animate-fade-in" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
              ${[1,2,3,4,5].map((lvl, i) => {
                const x = (i * 100);
                const y = 120 - (data[lvl] / max) * 110;
                return `<circle cx="${x}" cy="${y}" r="6" fill="white" stroke="${color}" stroke-width="3" />`;
              }).join('')}
            `;
          }).join('')}
        </svg>

        <!-- X-Axis Labels -->
        <div class="flex justify-between mt-6 px-0">
          ${[1, 2, 3, 4, 5].map(lvl => `<span class="text-xs font-bold text-gray-400">${lvl}</span>`).join('')}
        </div>
      </div>

      <!-- Legend -->
      <div class="grid grid-cols-3 gap-2 mt-8 border-t border-gray-50 pt-4">
        ${Object.entries({
          Score: '#f59e0b',
          Roast: '#78350f',
          Acid: '#0ea5e9',
          Sweet: '#f43f5e',
          Bitter: '#10b981',
          Body: '#64748b'
        }).map(([label, color]) => `
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full" style="background-color: ${color}"></div>
            <span class="text-[9px] font-bold text-gray-500 uppercase">${label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- Recommendations ---

export function renderRecommendations(userLogs, vendorComments, manualPrefs = null) {
  if (vendorComments.length === 0) {
    DOM.recommendList.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <p>No vendor data found. Seed data in Settings.</p>
      </div>
    `;
    return;
  }

  // 1. Determine User Profile
  let profileFlavors = {};
  let preferredRoast = null;
  let isManual = manualPrefs !== null;

  if (isManual) {
    manualPrefs.flavors.forEach(f => {
      profileFlavors[f] = 5; // Strong weight for manual selection
    });
    // We don't have roast in manual prefs yet based on user request, 
    // but we could match other sensory attributes if needed.
  } else {
    const userRoastCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    userLogs.forEach(log => {
      const score = log.ratings?.overall || 3;
      if (score >= 4) {
        (log.flavor_tags || []).forEach(f => {
          profileFlavors[f] = (profileFlavors[f] || 0) + (score - 3);
        });
        if (log.roast) userRoastCounts[log.roast]++;
      }
    });
    preferredRoast = Object.entries(userRoastCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  // 2. Score Vendor Comments
  const scoredRecommendations = vendorComments.map(vendor => {
    let score = 0;
    
    // Flavor match bonus
    (vendor.flavor_tags || []).forEach(f => {
      if (profileFlavors[f]) {
        score += profileFlavors[f] * 2;
      }
    });

    // Roast match bonus
    if (!isManual && preferredRoast && String(vendor.roast) === preferredRoast) {
      score += 5;
    }

    // Manual Sensory match bonus
    if (isManual && manualPrefs.ratings) {
      // For now, let's say vendor ratings are "target" values. 
      // This is a simple implementation where we just add score for being high/low
      // In a real app, you'd compare vendor sensory stats if you had them.
      // Since vendor comments are text, we'll just use the overall rating as a proxy for quality.
    }

    // Vendor rating bonus
    score += parseFloat(vendor.rating) * 2;

    return { ...vendor, score };
  });

  // 3. Sort and take top 10
  const top10 = scoredRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const roastMap = {
    1: 'Light',
    2: 'Medium-Light',
    3: 'Medium',
    4: 'Medium-Dark',
    5: 'Dark'
  };

  const headerText = isManual 
    ? `Based on your specific "I Like" preferences (${manualPrefs.flavors.length} flavors selected).`
    : `Based on your history of high-rated coffees, we've found these 10 matches.`;

  DOM.recommendList.innerHTML = `
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4 px-2">
        <p class="text-sm text-gray-500">${headerText}</p>
        ${isManual ? `
          <button id="btn-clear-manual-prefs" class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Reset</button>
        ` : ''}
      </div>
      
      <div class="space-y-6">
        ${top10.map((rec, idx) => `
          <div class="glass-panel rounded-3xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full flex items-center justify-center">
               <span class="text-amber-600 font-black text-xl mb-2 mr-2">#${idx + 1}</span>
            </div>
            
            <div class="flex flex-col space-y-4">
              <div>
                <h3 class="text-xl font-bold text-gray-900">${rec.bean_name}</h3>
                <p class="text-sm font-semibold text-amber-600 uppercase tracking-wider">${rec.store}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase">${roastMap[rec.roast]} Roast</span>
                <span class="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase">${rec.process}</span>
              </div>

              <div class="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                <p class="text-sm text-gray-700 italic leading-relaxed">"${rec.vendor_comment}"</p>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="flex gap-1">
                  ${rec.flavor_tags.map(f => `<span class="text-[10px] font-bold text-gray-400">#${f}</span>`).join(' ')}
                </div>
                <div class="flex items-center text-amber-500 font-black">
                  <svg class="w-4 h-4 mr-1 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  ${rec.rating}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (isManual) {
    document.getElementById('btn-clear-manual-prefs').addEventListener('click', () => {
      renderRecommendations(userLogs, vendorComments, null);
    });
  }
}

