/* ============================
   script.js — versão final (corrigida)
   ============================ */

/* ===== UTIL ===== */
function formatValor(num){
  return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"'`]/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[m];
  });
}

/* ===== PROCEDIMENTOS E VALORES ===== */
function obterDetalhesProcedimento(servico){
  const dados = {
    "Limpeza Dental": {valor:"R$ 120,00", duracao:"30 minutos", preco:120},
    "Restauração": {valor:"R$ 250,00", duracao:"45 minutos", preco:250},
    "Canal": {valor:"R$ 600,00", duracao:"1h 30min", preco:600},
    "Clareamento": {valor:"R$ 400,00", duracao:"1 hora", preco:400},
    "Aparelho Ortodôntico": {valor:"R$ 200,00 (mensal)", duracao:"40 minutos", preco:200},
    "Implante": {valor:"R$ 1500,00", duracao:"2 horas", preco:1500},
    "Consulta de Avaliação": {valor:"R$ 80,00", duracao:"20 minutos", preco:80}
  };
  return dados[servico] || null;
}
function obterValorProcedimento(servico){
  const d = obterDetalhesProcedimento(servico);
  return d ? d.preco : 0;
}

/* =========================
   LOGIN / CADASTRO / LOGOUT
   ========================= */

const loginForm = document.getElementById("loginForm");
const cadastroForm = document.getElementById("cadastroForm");
const showCadastro = document.getElementById("showCadastro");
const showLogin = document.getElementById("showLogin");

if(showCadastro) showCadastro.onclick = ()=>{
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("cadastroCard").classList.remove("hidden");
};
if(showLogin) showLogin.onclick = ()=>{
  document.getElementById("cadastroCard").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
};

if(cadastroForm){
  cadastroForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const novo = {
      nome: document.getElementById("nomeCadastro").value.trim(),
      cpf: document.getElementById("cpfCadastro").value.trim(),
      email: document.getElementById("emailCadastro").value.trim(),
      tel: document.getElementById("telCadastro").value.trim(),
      senha: document.getElementById("senhaCadastro").value
    };
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    if(usuarios.some(u=>u.cpf === novo.cpf)){
      alert("CPF já cadastrado!");
      return;
    }
    usuarios.push(novo);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert("Conta criada com sucesso!");
    window.location.href = "index.html";
  });
}

if(loginForm){
  loginForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const cpf = document.getElementById("cpfLogin").value.trim();
    const senha = document.getElementById("senhaLogin").value;
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const user = usuarios.find(u=>u.cpf===cpf && u.senha===senha);
    if(user){
      localStorage.setItem("usuarioLogado", JSON.stringify(user));
      window.location.href = "dashboard.html";
    } else {
      alert("CPF ou senha incorretos!");
    }
  });
}

// Attach logout to ALL buttons/links that have id="logoutBtn" (some pages use button, some anchor)
function attachLogoutHandlers(){
  const logoutEls = Array.from(document.querySelectorAll('[id="logoutBtn"]'));
  logoutEls.forEach(el=>{
    el.removeEventListener('click', handleLogout);
    el.addEventListener('click', handleLogout);
  });
}
function handleLogout(e){
  e.preventDefault();
  localStorage.removeItem("usuarioLogado");
  window.location.href = "index.html";
}
attachLogoutHandlers();

/* =========================
   Helpers: read/write consultas
   ========================= */
function getConsultas(){
  return JSON.parse(localStorage.getItem("consultas")) || [];
}
function setConsultas(arr){
  localStorage.setItem("consultas", JSON.stringify(arr));
}

/* =========================
   AGENDAMENTO (FORMULÁRIO)
   ========================= */
const agendarForm = document.getElementById("agendarForm");
const servicoSelect = document.getElementById("servico");
const detalhesDiv = document.getElementById("detalhesProcedimento");
const valorEl = document.getElementById("valorProcedimento");
const duracaoEl = document.getElementById("duracaoProcedimento");
const convenioCheckbox = document.getElementById("convenio");

if(servicoSelect){
  servicoSelect.addEventListener("change", ()=>{
    const servico = servicoSelect.value;
    const detalhes = obterDetalhesProcedimento(servico);
    if(detalhes){
      detalhesDiv.style.display = "block";
      const preco = detalhes.preco;
      const temConvenio = convenioCheckbox ? convenioCheckbox.checked : false;
      const precoFinal = temConvenio ? +(preco * 0.8).toFixed(2) : preco;
      valorEl.textContent = formatValor(precoFinal);
      duracaoEl.textContent = detalhes.duracao;
    } else {
      detalhesDiv.style.display = "none";
    }
  });
}
if(convenioCheckbox){
  convenioCheckbox.addEventListener("change", ()=>{
    const servico = servicoSelect.value;
    const detalhes = obterDetalhesProcedimento(servico);
    if(detalhes){
      const preco = detalhes.preco;
      const precoFinal = convenioCheckbox.checked ? +(preco * 0.8).toFixed(2) : preco;
      valorEl.textContent = formatValor(precoFinal);
    }
  });
}

if(agendarForm){
  agendarForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("usuarioLogado"));
    if(!user){ alert("Faça login primeiro!"); window.location.href="index.html"; return; }
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;
    const dentista = document.getElementById("dentista").value;
    const servico = document.getElementById("servico").value;
    const temConvenio = convenioCheckbox.checked;

    if(!data || !hora || !dentista || !servico){
      alert("Preencha todos os campos.");
      return;
    }
    const [h] = hora.split(":").map(Number);
    if(h >= 12 && h < 13){
      alert("Não é permitido agendar no horário de almoço (12h-13h)");
      return;
    }

    let consultas = getConsultas();
    const conflito = consultas.find(c => c.data===data && c.hora===hora && c.dentista===dentista);
    if(conflito){
      alert("Esse horário já está ocupado para o dentista selecionado. Escolha outro horário.");
      return;
    }
    const precoBase = obterValorProcedimento(servico);
    const valorFinal = temConvenio ? +(precoBase * 0.8).toFixed(2) : precoBase;

    if(!confirm(`Confirma agendamento?\n\nData: ${data}\nHora: ${hora}\nDentista: ${dentista}\nProcedimento: ${servico}\nValor: ${formatValor(valorFinal)}`)) return;

    const nova = {
      id: Date.now().toString(),
      cpf: user.cpf,
      nome: user.nome,
      data,
      hora,
      dentista,
      servico,
      valor: valorFinal,
      pago: false,
      convenio: temConvenio
    };
    consultas.push(nova);
    setConsultas(consultas);
    alert("Consulta agendada com sucesso!");
    agendarForm.reset();
    if(detalhesDiv) detalhesDiv.style.display = "none";
    window.location.href = "meus-agendamentos.html";
  });
}

/* =========================
   PAGAMENTOS (listar e pagar)
   ========================= */
function renderTabelaPagamentos(){
  const tabela = document.getElementById("tabelaPagamentos");
  if(!tabela) return;
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if(!user){ window.location.href="index.html"; return; }
  const consultas = getConsultas().filter(c => c.cpf === user.cpf);
  tabela.innerHTML = "";
  if(consultas.length === 0){
    tabela.innerHTML = `<tr><td colspan="6">Nenhuma consulta encontrada.</td></tr>`;
    return;
  }
  consultas.forEach(c => {
    tabela.innerHTML += `
      <tr>
        <td>${c.data}</td>
        <td>${c.hora}</td>
        <td>${c.servico}</td>
        <td>${formatValor(c.valor)}</td>
        <td>${c.pago ? '<span class="pill success">Pago</span>' : '<span class="pill warn">Pendente</span>'}</td>
        <td>
          ${c.pago ? '' : `<button class="btn small" onclick="pagarConsulta('${c.id}')">Pagar</button>`}
          <button class="btn small" onclick="cancelarConsulta('${c.id}')">Cancelar</button>
        </td>
      </tr>
    `;
  });
}
window.pagarConsulta = function(id){
  let consultas = getConsultas();
  const idx = consultas.findIndex(c => c.id === id);
  if(idx === -1){ alert("Consulta não encontrada."); return; }
  consultas[idx].pago = true;
  setConsultas(consultas);
  // try to re-render tables if present, otherwise reload
  renderTabelaPagamentos();
  renderMinhasConsultas();
  alert("Pagamento realizado com sucesso!");
};
window.cancelarConsulta = function(id){
  if(!confirm("Tem certeza que deseja cancelar essa consulta?")) return;
  let consultas = getConsultas();
  const exists = consultas.some(c => c.id === id);
  if(!exists){ alert("Consulta não encontrada."); return; }
  consultas = consultas.filter(c => c.id !== id);
  setConsultas(consultas);
  renderTabelaPagamentos();
  renderMinhasConsultas();
  alert("Consulta cancelada.");
};

/* =========================
   MEUS AGENDAMENTOS (listar)
   ========================= */
function renderMinhasConsultas(){
  const tabela = document.getElementById("tabelaTodasConsultas");
  if(!tabela) return;
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if(!user){ window.location.href="index.html"; return; }
  const consultas = getConsultas().filter(c => c.cpf === user.cpf).sort((a,b)=> a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
  tabela.innerHTML = "";
  if(consultas.length === 0){
    tabela.innerHTML = `<tr><td colspan="7">Nenhuma consulta encontrada.</td></tr>`;
    return;
  }
  consultas.forEach(c => {
    tabela.innerHTML += `
      <tr>
        <td>${c.data}</td>
        <td>${c.hora}</td>
        <td>${c.dentista}</td>
        <td>${c.servico}</td>
        <td>${formatValor(c.valor)}</td>
        <td>${c.pago ? '<span class="pill success">Pago</span>' : '<span class="pill warn">Pendente</span>'}</td>
        <td>
          ${c.pago ? '' : `<button class="btn small" onclick="pagarConsulta('${c.id}')">Pagar</button>`}
          <button class="btn small" onclick="cancelarConsulta('${c.id}')">Cancelar</button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   DASHBOARD — mostrar nome e resumo
   ========================= */
function renderDashboard(){
  const nomeUsuarioEl = document.getElementById("nomeUsuario");
  if(!nomeUsuarioEl) return;
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if(!user){ window.location.href="index.html"; return; }
  nomeUsuarioEl.textContent = user.nome.split(" ")[0] || user.nome;

  const tabelaConsultas = document.getElementById("tabelaConsultas");
  if(tabelaConsultas){
    const minhas = getConsultas().filter(c => c.cpf === user.cpf);
    tabelaConsultas.innerHTML = "";
    if(minhas.length === 0){
      tabelaConsultas.innerHTML = `<tr><td colspan="3">Nenhuma consulta encontrada.</td></tr>`;
    } else {
      minhas.slice(0,5).forEach(c => {
        tabelaConsultas.innerHTML += `<tr><td>${c.data}</td><td>${c.servico}</td><td>${c.pago ? '<span class="pill success">Pago</span>' : '<span class="pill warn">Pendente</span>'}</td></tr>`;
      });
    }
  }
}

/* run renderers on load */
document.addEventListener("DOMContentLoaded", ()=>{
  attachLogoutHandlers(); // attach to any buttons that exist after DOM loaded
  renderTabelaPagamentos();
  renderMinhasConsultas();
  renderDashboard();
});

/* =========================
   CHATBOT — integração com agendamento (corrigido e animado)
   ========================= */
(function initChatbot() {
  const chatBox = document.getElementById("chatBox");
  const enviarChat = document.getElementById("enviarChat");
  if (!chatBox || !enviarChat) return;

  const input = document.getElementById("mensagemChat");
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  const nome = user.nome.split(" ")[0] || user.nome;

  let flow = null;
  let flowData = {};

  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "msg user";
    div.innerHTML = `<strong>${escapeHtml(nome)}:</strong> ${escapeHtml(text)}`;
    chatBox.appendChild(div);
    scrollToBottom();
  }

  function addBotTyping() {
    const div = document.createElement("div");
    div.className = "msg bot typing-msg";
    div.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    chatBox.appendChild(div);
    scrollToBottom();
    return div;
  }

  function replaceTypingWithBot(divTyping, htmlContent) {
    const div = document.createElement("div");
    div.className = "msg bot";
    div.innerHTML = htmlContent;
    if (divTyping && divTyping.parentNode) {
      divTyping.parentNode.replaceChild(div, divTyping);
    } else {
      chatBox.appendChild(div);
    }
    scrollToBottom();
  }

  function botRespond(html, delay = 700) {
    const typing = addBotTyping();
    setTimeout(() => replaceTypingWithBot(typing, html), delay);
  }

  function createActionButton(text, cls, data) {
    return `<button class="btn-chat ${cls || ""}" data-action='${JSON.stringify(
      data
    )}'>${escapeHtml(text)}</button>`;
  }

  // ======== Mensagem inicial =========
  botRespond(
    `Olá, <strong>${escapeHtml(
      nome
    )}</strong>! 😄<br>Posso te ajudar com:<br>• <strong>agendar</strong> — marcar consulta<br>• <strong>consultas</strong> — ver seus agendamentos<br>• <strong>pagamento</strong> — ver pendências<br>• <strong>cancelar</strong> — cancelar uma consulta<br>
     <div class="actions-inline" style="margin-top:8px;">
      ${createActionButton("Agendar", "primary", { cmd: "agendar" })}
      ${createActionButton("Minhas consultas", "", { cmd: "consultas" })}
      ${createActionButton("Pagamentos", "", { cmd: "pagamento" })}
     </div>`,
    800
  );

  // ======== Eventos principais ========
  enviarChat.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) return;
    addUserMessage(val);
    input.value = "";
    setTimeout(() => handleTextCommand(val), 250);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarChat.click();
    }
  });

  chatBox.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const data = JSON.parse(btn.getAttribute("data-action"));
    handleCommand(data);
  });

  // ======== Lógica de comandos ========
  function handleTextCommand(text) {
    const lower = text.toLowerCase().trim();
    if (/^oi$|^olá$|^ola$/.test(lower)) {
      botRespond(
        `Oi! 👋<br>Digite um comando:<br>• <strong>agendar</strong><br>• <strong>consultas</strong><br>• <strong>pagamento</strong><br>• <strong>cancelar</strong>`
      );
      return;
    }
    if (lower.includes("agendar")) return startAgendarFlow();
    if (lower.includes("consultas")) return listConsultas();
    if (lower.includes("pagamento")) return listPagamentos();
    if (lower.includes("cancelar")) return startCancelarFlow();
    if (flow) return processFlowAnswer(text);
    botRespond("Não entendi 😅. Digite <strong>oi</strong> para ver os comandos.");
  }

  function handleCommand(data) {
    if (data.cmd === "agendar") startAgendarFlow();
    else if (data.cmd === "consultas") listConsultas();
    else if (data.cmd === "pagamento") listPagamentos();
    else if (data.cmd === "cancelar") startCancelarFlow();
    else if (data.cmd === "resposta") processFlowAnswer(data.value);
  }

  // ======== Fluxo de Agendamento ========
  function startAgendarFlow() {
    flow = "agendar";
    flowData = {};
    botRespond(
      "Vamos lá! 😁 Qual procedimento você deseja?<br>(Ex: Limpeza Dental, Restauração, Canal, Clareamento, Aparelho Ortodôntico, Implante, Consulta de Avaliação)"
    );
  }

  function processFlowAnswer(answer) {
    if (flow === "agendar") {
      // 1️⃣ Procedimento
      if (!flowData.servico) {
        const det = obterDetalhesProcedimento(answer);
        if (!det) {
          botRespond(
            "Procedimento não reconhecido. Digite um dos procedimentos válidos, como Limpeza Dental, Restauração, Canal, etc."
          );
          return;
        }
        flowData.servico = answer;
        flowData.precoBase = det.preco;
        botRespond("Qual a data? (DD/MM/AAAA)");
        return;
      }

      // 2️⃣ Data
      if (!flowData.data) {
        const match = answer.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (!match) {
          botRespond("Formato inválido. Use DD/MM/AAAA (ex: 12/11/2025)");
          return;
        }
        const [_, dia, mes, ano] = match;
        flowData.data = `${dia}/${mes}/${ano}`;
        botRespond("Qual horário? (HH:MM)");
        return;
      }

      // 3️⃣ Hora
      if (!flowData.hora) {
        if (!/^\d{2}:\d{2}$/.test(answer)) {
          botRespond("Formato inválido. Use HH:MM (ex: 14:30)");
          return;
        }
        flowData.hora = answer;
        botRespond(
          `Escolha o dentista:<div class="actions-inline">
            ${createActionButton("Dr. Lucas", "primary", { cmd: "resposta", value: "Dr. Lucas" })}
            ${createActionButton("Dra. Ana", "", { cmd: "resposta", value: "Dra. Ana" })}
          </div>`
        );
        return;
      }

      // 4️⃣ Dentista
      if (!flowData.dentista) {
        if (!/lucas/i.test(answer) && !/ana/i.test(answer)) {
          botRespond("Escolha válido: Dr. Lucas ou Dra. Ana");
          return;
        }
        flowData.dentista = /lucas/i.test(answer) ? "Dr. Lucas" : "Dra. Ana";
        botRespond(
          `Você possui convênio?<div class="actions-inline">
            ${createActionButton("Sim", "primary", { cmd: "resposta", value: "sim" })}
            ${createActionButton("Não", "", { cmd: "resposta", value: "nao" })}
          </div>`
        );
        return;
      }

      // 5️⃣ Convênio
      if (flowData.convenio === undefined) {
        const sim = /^s/i.test(answer);
        flowData.convenio = sim;
        flowData.valor = sim
          ? +(flowData.precoBase * 0.8).toFixed(2)
          : flowData.precoBase;
        const resumo = `<strong>Resumo:</strong><br>
          ${flowData.servico} com ${flowData.dentista}<br>
          ${flowData.data} às ${flowData.hora}<br>
          Convênio: ${sim ? "Sim (20% off)" : "Não"}<br>
          Valor: ${formatValor(flowData.valor)}<br>
          <div class="actions-inline">${createActionButton(
            "Confirmar",
            "primary",
            { cmd: "resposta", value: "confirmar" }
          )} ${createActionButton("Cancelar", "", {
          cmd: "resposta",
          value: "cancelarFluxo",
        })}</div>`;
        botRespond(resumo);
        return;
      }
    }

    // 6️⃣ Confirmação
    if (answer === "confirmar" && flow === "agendar") {
      const consultas = getConsultas();
      const conflito = consultas.find(
        (c) =>
          c.data === flowData.data &&
          c.hora === flowData.hora &&
          c.dentista === flowData.dentista
      );
      if (conflito) {
        botRespond("❌ Horário indisponível. Tente outro.");
        flow = null;
        flowData = {};
        return;
      }
      const nova = {
        id: Date.now().toString(),
        cpf: user.cpf,
        nome: user.nome,
        data: flowData.data,
        hora: flowData.hora,
        dentista: flowData.dentista,
        servico: flowData.servico,
        valor: flowData.valor,
        convenio: flowData.convenio,
        pago: false,
      };
      consultas.push(nova);
      setConsultas(consultas);
      botRespond(
        `✅ Consulta agendada com ${nova.dentista} em ${nova.data} às ${nova.hora}. Valor: ${formatValor(
          nova.valor
        )}`
      );
      renderMinhasConsultas();
      renderTabelaPagamentos();
      flow = null;
      flowData = {};
      return;
    }

    if (answer === "cancelarFluxo") {
      botRespond("Agendamento cancelado.");
      flow = null;
      flowData = {};
      return;
    }
  }

  // ======== Consultas e Pagamentos ========
  function listConsultas() {
    const consultas = getConsultas().filter((c) => c.cpf === user.cpf);
    if (!consultas.length) return botRespond("Você não tem consultas.");
    botRespond("Suas consultas:");
    consultas.forEach((c) => {
      botRespond(
        `📅 ${c.data} ${c.hora} — ${c.servico} (${c.dentista}) — ${
          c.pago ? "✅ Pago" : "💰 Pendente"
        }`
      );
    });
  }

  function listPagamentos() {
    const pendentes = getConsultas().filter(
      (c) => c.cpf === user.cpf && !c.pago
    );
    if (!pendentes.length)
      return botRespond("Você não possui pagamentos pendentes.");
    botRespond("Pagamentos pendentes:");
    pendentes.forEach((c) => {
      botRespond(
        `💰 ${c.servico} em ${c.data} (${c.dentista}) — ${formatValor(
          c.valor
        )}<br>${createActionButton("Pagar", "primary", {
          cmd: "resposta",
          value: "pagar-" + c.id,
        })}`
      );
    });
  }

  function startCancelarFlow() {
    const consultas = getConsultas().filter((c) => c.cpf === user.cpf);
    if (!consultas.length)
      return botRespond("Você não possui consultas para cancelar.");
    botRespond("Qual consulta deseja cancelar?");
    consultas.forEach((c) => {
      botRespond(
        `${c.data} ${c.hora} — ${c.servico} (${c.dentista})<br>${createActionButton(
          "Cancelar",
          "",
          { cmd: "resposta", value: "cancel-" + c.id }
        )}`
      );
    });
  }

  // ======== Pagamento e Cancelamento ========
  function handleAction(value) {
    if (value.startsWith("pagar-")) {
      const id = value.split("-")[1];
      const consultas = getConsultas();
      const consulta = consultas.find((c) => c.id === id && c.cpf === user.cpf);
      if (!consulta) return botRespond("Consulta não encontrada.");
      consulta.pago = true;
      setConsultas(consultas);
      botRespond("💳 Pagamento realizado com sucesso!");
      renderTabelaPagamentos();
      renderMinhasConsultas();
      return;
    }
    if (value.startsWith("cancel-")) {
      const id = value.split("-")[1];
      let consultas = getConsultas();
      consultas = consultas.filter(
        (c) => !(c.id === id && c.cpf === user.cpf)
      );
      setConsultas(consultas);
      botRespond("❌ Consulta cancelada com sucesso.");
      renderTabelaPagamentos();
      renderMinhasConsultas();
      return;
    }
  }

  chatBox.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const data = JSON.parse(btn.getAttribute("data-action"));
    if (data.cmd === "resposta" && /^pagar-|^cancel-/.test(data.value))
      handleAction(data.value);
  });
})();
