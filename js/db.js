let db;

function initDB() {
  const request = indexedDB.open('InspeccionesDB', 1);
  request.onupgradeneeded = event => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('inspections')) {
      db.createObjectStore('inspections', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('pending')) {
      db.createObjectStore('pending', { keyPath: 'id' });
    }
  };
  request.onsuccess = event => {
    db = event.target.result;
  };
}

async function saveInspectionLocal(inspection) {
  const transaction = db.transaction(['inspections'], 'readwrite');
  const store = transaction.objectStore('inspections');
  inspection.id = Date.now().toString();
  store.add(inspection);
}

async function getInspectionsLocal(inspector) {
  return new Promise((resolve) => {
    const transaction = db.transaction(['inspections'], 'readonly');
    const store = transaction.objectStore('inspections');
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(i => i.inspector === inspector));
    };
  });
}

async function syncPending() {
  const transaction = db.transaction(['pending'], 'readonly');
  const store = transaction.objectStore('pending');
  const request = store.getAll();
  request.onsuccess = () => {
    request.result.forEach(async item => {
      try {
        await fetch(item.url, item.options);
        // Remover de pending
        const delTransaction = db.transaction(['pending'], 'readwrite');
        delTransaction.objectStore('pending').delete(item.id);
      } catch (e) {
        // Mantener en pending
      }
    });
  };
}

export { initDB, saveInspectionLocal, getInspectionsLocal, syncPending };