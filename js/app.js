import { initDB, addLog, updateLog, deleteLog, getAllLogs, getLogById, clearAllLogs, seedMockData, resetDatabase, getVendorRecommendations } from './db.js';
import { state } from './state.js';
import { initUI, renderDashboard, renderStats, closeModal, openModal, renderLoggerForm, renderRecommendations } from './ui.js';

async function fetchLexicon() {
  try {
    const response = await fetch('./flavorLexicon.json');
    if (!response.ok) throw new Error('Failed to load lexicon');
    const data = await response.json();
    state.update({ lexicon: data });
  } catch (error) {
    console.error('Error fetching flavorLexicon:', error);
    // Fallback minimal lexicon
    state.update({
      lexicon: {
        name: "Flavor Lexicon",
        children: [
          { name: "Fruity" },
          { name: "Floral" },
          { name: "Nutty" },
          { name: "Chocolate" }
        ]
      }
    });
  }
}

async function refreshLogs() {
  const logs = await getAllLogs();
  const vendorData = await getVendorRecommendations();
  state.update({ logs, vendorRecommendations: vendorData });
  renderDashboard(logs);
  renderStats(logs);
  renderRecommendations(logs, vendorData);
}

function setupActions() {
  // Save Log (Create)
  document.getElementById('btn-save-log').addEventListener('click', async () => {
    await handleSave();
  });

  // Apply Edit
  document.getElementById('btn-apply-edit').addEventListener('click', async () => {
    await handleSave();
  });

  // Cancel Edit
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    closeModal(document.getElementById('modal-logger'));
    state.resetForm();
  });

  async function handleSave() {
    const { logForm, flavorSelections, editingLogId } = state.get();
    
    // Basic validation
    if (!logForm.bean_name.trim()) {
      alert("Please enter a bean name.");
      return;
    }

    const logData = {
      ...logForm,
      flavor_tags: [...flavorSelections],
      overall: logForm.ratings.overall
    };

    try {
      if (editingLogId) {
        await updateLog(editingLogId, logData);
      } else {
        await addLog(logData);
      }
      closeModal(document.getElementById('modal-logger'));
      await refreshLogs();
      state.resetForm();
    } catch (err) {
      console.error("Failed to save log", err);
      alert("Error saving log.");
    }
  }

  // Edit Log Event
  window.addEventListener('edit-log', async (e) => {
    const id = e.detail.id;
    const log = await getLogById(id);
    if (log) {
      state.update({
        logForm: { ...log },
        flavorSelections: [...(log.flavor_tags || [])],
        editingLogId: id
      });
      renderLoggerForm();
      openModal(document.getElementById('modal-logger'));
    }
  });

  // Delete Log Event
  window.addEventListener('delete-log', async (e) => {
    const id = e.detail.id;
    if (confirm("Move this log to trash?")) {
      await deleteLog(id);
      await refreshLogs();
    }
  });

  // Export JSON
  document.getElementById('btn-export').addEventListener('click', async () => {
    try {
      const logs = await getAllLogs();
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'coffee_history.json');
      linkElement.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  });

  // Clear All
  document.getElementById('btn-clear-all').addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear all records? This action cannot be undone.")) {
      try {
        await clearAllLogs();
        await refreshLogs();
        alert("All records cleared.");
      } catch (err) {
        console.error("Clear failed", err);
      }
    }
  });

  // Reset DB
  document.getElementById('btn-reset-db').addEventListener('click', async () => {
    if (confirm("CRITICAL: This will PERMANENTLY DELETE the entire database and reload. Use this only if the app is broken. Continue?")) {
      try {
        await resetDatabase();
        window.location.reload();
      } catch (err) {
        console.error("Reset failed", err);
      }
    }
  });

  // Seed Mock Data
  document.getElementById('btn-seed-data').addEventListener('click', async () => {
    if (confirm("Add 100 mock coffee logs for algorithm validation?")) {
      const btn = document.getElementById('btn-seed-data');
      const originalText = btn.textContent;
      try {
        btn.disabled = true;
        btn.textContent = "Seeding...";
        await seedMockData();
        await refreshLogs();
        alert("100 mock logs and 100 vendor recommendations added successfully.");
      } catch (error) {
        console.error("Seeding failed", error);
        alert("Failed to seed data: " + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  });
}

// Register Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}

async function initApp() {
  await initDB();
  await fetchLexicon();
  
  initUI();
  setupActions();
  
  // Initial load
  await refreshLogs();
  
  // Setup PWA
  registerServiceWorker();
}

// Bootstrap
document.addEventListener('DOMContentLoaded', initApp);
