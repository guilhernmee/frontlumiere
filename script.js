/* =========================
   LOGIN E CADASTRO
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const cadastroForm = document.getElementById("cadastroForm");
  const toggleTheme = document.getElementById("toggleTheme");

  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("light");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = loginForm.nome.value.trim();
      if (nome) {
        const usuario = { nome };
        localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
        window.location.href = "app.html";
      }
    });
  }

  if (cadastroForm) {
    cadastroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Cadastro realizado com sucesso!");
      window.location.href = "index.html";
    });
  }
});

/* =========================
   APP PRINCIPAL
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (user) {
    const nomeUser = document.getElementById("nomeUser");
    if (nomeUser) nomeUser.textContent = user.nome;
  }

  const logout = document.getElementById("logout");
  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      window.location.href = "index.html";
    });
  }
});

/* =========================
   CHATBOT — integração com agendamento
   ========================= */
(function initChatbot() {
  const chatBox = document.getElementById("chatBox");
  const enviarChat = document.getElementById("enviarChat");
  const input = document.getElementById("mensagemChat");
  const quickActions = document.getElementById("quickActions");
  if (!chatBox || !enviarChat || !input) return;

  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const nome = user.nome.split(" ")[0] || user.nome;
  let flow = null;
  let flowData = {};

  /* ===== UTIL ===== */
  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
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
    return `<button class="btn-chat ${cls || ""}" data-action='${JSON.stringify(data)}'>${escapeHtml(text)}</button>`;
  }

  /* ===== BOTÕES FIXOS ===== */
  function renderQuickActions() {
    if (!quickActions) return;
    quickActions.innerHTML = `
      ${createActionButton("Agendar", "primary", { cmd: "agendar" })}
      ${createActionButton("Consultas", "", { cmd: "consultas" })}
      ${createActionButton("Pagamentos", "", { cmd: "pagamentos" })}
    `;
  }
  renderQuickActions();

  /* ===== FLUXO ===== */
  function startAgendarFlow() {
    flow = "agendar";
    flowData = {};
    botRespond(`
      Vamos lá! 😁 Qual procedimento você deseja?<br>
      <div class="actions-grid" style="margin-top:8px;">
        ${createActionButton("🦷 Limpeza Dental", "primary", { cmd: "resposta", value: "Limpeza Dental" })}
        ${createActionButton("🧩 Restauração", "", { cmd: "resposta", value: "Restauração" })}
        ${createActionButton("💎 Clareamento", "", { cmd: "resposta", value: "Clareamento" })}
        ${createActionButton("🦷 Canal", "", { cmd: "resposta", value: "Canal" })}
        ${createActionButton("🧠 Implante", "", { cmd: "resposta", value: "Implante" })}
        ${createActionButton("😷 Avaliação", "", { cmd: "resposta", value: "Consulta de Avaliação" })}
        ${createActionButton("Aparelho Ortodôntico", "", { cmd: "resposta", value: "Aparelho Ortodôntico" })}
      </div>
    `);
  }

  function startDentistaFlow() {
    botRespond(`
      Perfeito 😄 Agora, com qual dentista você prefere agendar?<br>
      <div class="actions-grid" style="margin-top:8px;">
        ${createActionButton("Dr. Lucas", "primary", { cmd: "dentista", value: "Dr. Lucas" })}
        ${createActionButton("Dra. Ana", "", { cmd: "dentista", value: "Dra. Ana" })}
      </div>
    `);
  }

  function startDataFlow() {
    botRespond(`
      Ótimo! 📅 Selecione o dia do atendimento:<br>
      <div class="actions-grid" style="margin-top:8px;">
        ${createActionButton("12/11", "", { cmd: "data", value: "12/11" })}
        ${createActionButton("13/11", "", { cmd: "data", value: "13/11" })}
        ${createActionButton("14/11", "", { cmd: "data", value: "14/11" })}
      </div>
    `);
  }

  function startConfirmFlow() {
    botRespond(`
      Confirma o agendamento?<br>
      <b>${flowData.procedimento}</b> com <b>${flowData.dentista}</b> no dia <b>${flowData.data}</b> 🗓️<br><br>
      ${createActionButton("✅ Confirmar", "primary", { cmd: "confirmar" })}
      ${createActionButton("❌ Cancelar", "", { cmd: "cancelar" })}
    `);
  }

  /* ===== HANDLER ===== */
  chatBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-chat");
    if (!btn) return;
    const data = JSON.parse(btn.dataset.action);

    switch (data.cmd) {
      case "agendar":
        startAgendarFlow();
        break;
      case "consultas":
        botRespond("Você ainda não possui consultas marcadas 😅");
        break;
      case "pagamentos":
        botRespond("Nenhum pagamento pendente no momento 💳");
        break;
      case "resposta":
        flowData.procedimento = data.value;
        addUserMessage(data.value);
        startDentistaFlow();
        break;
      case "dentista":
        flowData.dentista = data.value;
        addUserMessage(data.value);
        startDataFlow();
        break;
      case "data":
        flowData.data = data.value;
        addUserMessage(data.value);
        startConfirmFlow();
        break;
      case "confirmar":
        addUserMessage("Confirmar ✅");
        botRespond(`Perfeito, ${nome}! Seu agendamento foi realizado com sucesso 🎉<br><b>${flowData.procedimento}</b> com <b>${flowData.dentista}</b> no dia <b>${flowData.data}</b>.<br><br>
        ${createActionButton("📅 Novo Agendamento", "primary", { cmd: "agendar" })}
        `);
        flow = null;
        break;
      case "cancelar":
        addUserMessage("Cancelar ❌");
        botRespond("Tudo bem! Agendamento cancelado. Se quiser, posso marcar outro. 😉<br><br>" +
          createActionButton("📅 Novo Agendamento", "primary", { cmd: "agendar" })
        );
        flow = null;
        break;
    }
  });

  enviarChat.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = "";
    if (!flow) botRespond("Escolha uma das opções abaixo 👇");
  });

  // Mensagem inicial
  botRespond(`Olá ${nome}! 👋<br>Sou o assistente virtual da clínica. Como posso te ajudar hoje?`);
})();
