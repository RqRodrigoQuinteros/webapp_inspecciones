const API_URL = 'https://script.google.com/macros/s/AKfycbwEi5IMR2l3_MBwhH3KmlD-_fSOyUJSmhhi1fzMNYuCcZjk0mi5xr_FurwQ9Gp6mnRd/exec'; // Reemplaza con la URL del Web App de Apps Script

async function login(dni) {
  const response = await fetch(`${API_URL}?action=login&dni=${dni}`);
  return response.json();
}

async function getInspections(inspector) {
  const response = await fetch(`${API_URL}?action=getInspections&inspector=${encodeURIComponent(inspector)}`);
  return response.json();
}

async function getInspection(id) {
  const response = await fetch(`${API_URL}?action=getInspection&id=${id}`);
  return response.json();
}

async function saveInspection(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'saveInspection', ...data })
  });
  return response.json();
}

async function generateActa(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'generateActa', ...data })
  });
  return response.json();
}

export { login, getInspections, getInspection, saveInspection, generateActa };