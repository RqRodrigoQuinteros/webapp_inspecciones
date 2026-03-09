import { login, getInspections, saveInspection, generateActa } from './api.js';
import { initDB, saveInspectionLocal, getInspectionsLocal, syncPending } from './db.js';
import { getSchema } from './schema.js';

let currentUser = null;
let currentInspection = null;

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  registerSW();
  setupEventListeners();
  checkOnlineStatus();
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}

function setupEventListeners() {
  // Login
  document.getElementById('login-btn').addEventListener('click', handleLogin);

  // Dashboard
  document.getElementById('new-inspection-btn').addEventListener('click', () => showScreen('form-screen'));
  document.getElementById('search').addEventListener('input', filterInspections);
  document.getElementById('filter-status').addEventListener('change', filterInspections);

  // Form
  document.getElementById('back-btn').addEventListener('click', () => showScreen('dashboard-screen'));
  document.getElementById('save-btn').addEventListener('click', handleSave);

  // Detail
  document.getElementById('back-detail-btn').addEventListener('click', () => showScreen('dashboard-screen'));
}

function checkOnlineStatus() {
  const dot = document.getElementById('status-dot');
  if (navigator.onLine) {
    dot.classList.remove('offline');
    syncPending();
  } else {
    dot.classList.add('offline');
  }
  window.addEventListener('online', () => {
    dot.classList.remove('offline');
    syncPending();
  });
  window.addEventListener('offline', () => {
    dot.classList.add('offline');
  });
}

async function handleLogin() {
  const dni = document.getElementById('dni-input').value;
  try {
    const result = await login(dni);
    if (result.success) {
      currentUser = result.name;
      showScreen('dashboard-screen');
      loadInspections();
    } else {
      document.getElementById('login-error').textContent = 'DNI no encontrado';
    }
  } catch (e) {
    document.getElementById('login-error').textContent = 'Error de conexión';
  }
}

async function loadInspections() {
  const inspections = await getInspectionsLocal(currentUser);
  renderInspections(inspections);
}

function renderInspections(inspections) {
  const list = document.getElementById('inspections-list');
  list.innerHTML = '';
  inspections.forEach(inspection => {
    const li = document.createElement('li');
    li.textContent = `${inspection.establecimiento} - ${inspection.estado}`;
    li.addEventListener('click', () => showDetail(inspection));
    list.appendChild(li);
  });
}

function filterInspections() {
  const search = document.getElementById('search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const inspections = Array.from(document.querySelectorAll('#inspections-list li'));
  inspections.forEach(li => {
    const text = li.textContent.toLowerCase();
    const matchesSearch = text.includes(search);
    const matchesStatus = !status || text.includes(status);
    li.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
  });
}

function showDetail(inspection) {
  currentInspection = inspection;
  document.getElementById('inspection-detail').textContent = JSON.stringify(inspection, null, 2);
  showScreen('detail-screen');
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'form-screen') {
    renderForm();
  }
}

function renderForm() {
  const form = document.getElementById('inspection-form');
  form.innerHTML = '';
  const schema = getSchema('clinica'); // Ejemplo, cambiar por tipología
  schema.forEach(field => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `<label>${field.label}</label>`;
    if (field.type === 'boolean') {
      div.innerHTML += `
        <div class="btn-group">
          <button class="btn-si" data-field="${field.key}">SI</button>
          <button class="btn-no" data-field="${field.key}">NO</button>
        </div>
      `;
    } else {
      div.innerHTML += `<input type="text" data-field="${field.key}">`;
    }
    form.appendChild(div);
  });
}

async function handleSave() {
  const formData = {};
  document.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    if (el.tagName === 'BUTTON') {
      if (el.classList.contains('active')) {
        formData[key] = el.classList.contains('btn-si') ? 'SI' : 'NO';
      }
    } else {
      formData[key] = el.value;
    }
  });
  const inspection = {
    inspector: currentUser,
    establecimiento: 'Ejemplo',
    localidad: 'Ejemplo',
    tipologia: 'clinica',
    nro_expediente: '123',
    formData
  };
  await saveInspectionLocal(inspection);
  showScreen('dashboard-screen');
  loadInspections();
}