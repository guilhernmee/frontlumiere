// ===========================================================
// ======== PORTAL LUMIÈRE DENTAL - APP.JS COMPLETO =========
// ===========================================================

// ------------------ Funções de Sessão ------------------
function loadSession() {
  const user = JSON.parse(localStorage.getItem('ld_session') || 'null');
  if (!user) {
    window.location = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('ld_session');
  window.location = 'index.html';
}

document.getElementById('logout')?.addEventListener('click', logout);

// ------------------ LOGIN E REGISTRO ------------------
if (document.getElementById('form-login')) {
  let users = JSON.parse(localStorage.getItem('ld_users') || '[]');

  // alternar telas login/registro
  document.getElementById('open-register').onclick = () => {
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('form-register').style.display = 'block';
  };
  document.getElementById('back-login').onclick = () => {
    document.getElementById('form-register').style.display = 'none';
    document.getElementById('form-login').style.display = 'block';
  };

  // --- LOGIN ---
  document.getElementById('form-login').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;

    const user = users.find(u => u.email === email);
    if (!user) return alert('Usuário não encontrado!');
    if (user.pass !== btoa(pass)) return alert('Senha incorreta!');

    localStorage.setItem('ld_session', JSON.stringify(user));
    window.location = 'dashboard.html';
  };

  // --- REGISTRO ---
  document.getElementById('form-register').onsubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const pass = document.getElementById('r-pass').value;

    if (!name || !email || !pass)
      return alert('Por favor, preencha todos os campos.');
    if (users.some(u => u.email === email))
      return alert('E-mail já cadastrado!');

    const newUser = {
      id: 'u' + Date.now(),
      name,
      email,
      pass: btoa(pass)
    };

    users.push(newUser);
    localStorage.setItem('ld_users', JSON.stringify(users));
    alert('Conta criada com sucesso! Faça login.');
    window.location = 'index.html';
  };
}

// ------------------ AGENDAMENTO ------------------
function renderDentists() {
  const sel = document.getElementById('s-dentist');
  if (!sel) return;

  const dentists = [
    { id: 'd1', name: 'Dra. Ana' },
    { id: 'd2', name: 'Dr. Lucas' }
  ];

  sel.innerHTML = dentists
    .map(d => `<option value="${d.id}">${d.name}</option>`)
    .join('');
}

function agendarConsulta(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem('ld_session'));
  const dentist = document.getElementById('s-dentist').value;
  const date = document.getElementById('s-date').value;
  const time = document.getElementById('s-time').value;
  const conv = document.getElementById('s-conv').checked;

  if (!date || !time) return alert('Selecione uma data e horário.');

  // 🚫 Bloqueio de horário de almoço (12:00 às 14:00)
  const [hour] = time.split(':').map(Number);
  if (hour >= 12 && hour < 14) {
    alert('Não é possível agendar durante o horário de almoço (12h às 14h).');
    return;
  }

  const appts = JSON.parse(localStorage.getItem('ld_appts') || '[]');
  appts.push({
    id: 'a' + Date.now(),
    userId: user.id,
    userName: user.name,
    dentistId: dentist,
    dentistName: document.querySelector(`#s-dentist option[value='${dentist}']`).textContent,
    date,
    time,
    conv,
    status: 'agendado'
  });

  localStorage.setItem('ld_appts', JSON.stringify(appts));
  alert('Consulta agendada com sucesso!');
  window.location = 'consultas.html';
}

// ------------------ CONSULTAS ------------------
function renderConsultas() {
  const div = document.getElementById('consultas');
  if (!div) return;

  const user = JSON.parse(localStorage.getItem('ld_session'));
  const appts = JSON.parse(localStorage.getItem('ld_appts') || '[]').filter(a => a.userId === user.id);

  if (appts.length === 0) {
    div.innerHTML = '<p>Nenhuma consulta encontrada.</p>';
    return;
  }

  div.innerHTML = appts
    .map(a => `
      <div class="card">
        <strong>${a.dentistName}</strong><br>
        ${a.date} às ${a.time}<br>
        ${a.conv ? 'Convênio' : 'Particular'} — 
        <span class="pill ${a.status === 'cancelado' ? 'danger' : 'success'}">${a.status}</span>
        ${a.status !== 'cancelado' ? `
          <div class="actions">
            <button class="btn ghost small" onclick="cancelar('${a.id}')">Cancelar</button>
          </div>
        ` : ''}
      </div>
    `)
    .join('');
}

function cancelar(id) {
  if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;

  const appts = JSON.parse(localStorage.getItem('ld_appts') || '[]');
  const item = appts.find(a => a.id === id);
  if (item) {
    item.status = 'cancelado';
    localStorage.setItem('ld_appts', JSON.stringify(appts));
    renderConsultas();
  }
}

// ------------------ TABELA DE PREÇOS ------------------
function renderPrecos() {
  const tbody = document.getElementById('tbody');
  if (!tbody) return;

  const dados = [
    ['Limpeza', 120, 90],
    ['Restauração', 300, 240],
    ['Canal', 650, 520],
    ['Clareamento', 800, 650]
  ];

  tbody.innerHTML = dados
    .map(p => `
      <tr>
        <td>${p[0]}</td>
        <td>R$ ${p[1]}</td>
        <td>R$ ${p[2]}</td>
      </tr>
    `)
    .join('');
}

// ------------------ DASHBOARD ------------------
function renderDashboard() {
  const user = JSON.parse(localStorage.getItem('ld_session'));
  const nameField = document.getElementById('user-name');
  if (nameField) nameField.textContent = user?.name || '';
}
