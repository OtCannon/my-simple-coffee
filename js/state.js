// Simple state management with event emitting
class AppState {
  constructor() {
    this.state = {
      currentPage: 'dashboard', // dashboard | add | settings
      currentLog: null,
      logs: [],
      lexicon: {},
      isModalOpen: false,
      flavorSelections: [], // Array of strings (e.g. ['Floral', 'Jasmine'])
      logForm: {
        store: '',
        bean_name: '',
        date: new Date().toISOString().split('T')[0],
        region: '',
        estate_farm: '',
        process: '',
        roast: 3, // 1-5 level
        ratings: {
          acid: 3,
          bitter: 3,
          sweet: 3,
          body: 3,
          overall: 3
        },
        flavor_tags: [],
        notes: ''
      },
      editingLogId: null, // ID of the log being edited, if any
      vendorRecommendations: [],
      preferenceForm: {
        ratings: {
          acid: 3,
          bitter: 3,
          sweet: 3,
          body: 3
        }
      },
      preferenceFlavorSelections: []
    };
    this.listeners = [];
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update state and notify
  update(newStatePartial) {
    this.state = { ...this.state, ...newStatePartial };
    this.notify();
  }

  // Get current state
  get() {
    return this.state;
  }

  resetForm() {
    this.update({
      logForm: {
        store: '',
        bean_name: '',
        date: new Date().toISOString().split('T')[0],
        region: '',
        estate_farm: '',
        process: '',
        roast: 3,
        ratings: {
          acid: 3,
          bitter: 3,
          sweet: 3,
          body: 3,
          overall: 3
        },
        flavor_tags: [],
        notes: ''
      },
      flavorSelections: [],
      editingLogId: null
    });
  }
}

export const state = new AppState();
