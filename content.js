// Verifica se o tipo informado representa um chamado de defeito/bug
function isDefectType(issueType) {
  const t = issueType ? issueType.toUpperCase().trim() : "";
  return (
    t.includes("DEFEITO") ||
    t.includes("BUG") ||
    t.includes("CORREÇÃO") ||
    t.includes("CORRECAO")
  );
}

// Extrai a descrição real do defeito, removendo prefixos técnicos
// como "EV (Bug) - V2610 - ORACLE - " antes da descrição do problema
function extractDefectDescription(summary) {
  if (!summary) return "";
  const parts = summary
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : summary.trim();
}

// Matriz de decisão inteligente baseada nas regras informadas
function getAutoCommitType(parentType, subTaskType) {
  const pType = parentType ? parentType.toUpperCase().trim() : "";
  const sType = subTaskType ? subTaskType.toUpperCase().trim() : "";

  if (sType.includes("MERGE")) return "MERGE";
  if (isDefectType(sType)) return "FIX";

  if (sType.includes("CODIFICAÇÃO") || sType.includes("CODIFICACAO")) {
    if (pType.includes("MANUTENÇÃO") || pType.includes("MANUTENCAO"))
      return "FIX";
    if (
      pType.includes("HISTÓRIA") ||
      pType.includes("HISTORIA") ||
      pType.includes("STORY")
    )
      return "FEAT";
    if (
      pType.includes("DÉBITO TÉCNICO") ||
      pType.includes("DEBITO TECNICO") ||
      pType.includes("DEBITO")
    )
      return "FIX";
  }
  return "FIX";
}

// Controle de estado baseado na URL e Chave
let lastUrl = "";
let currentIssueKey = "";

// Função principal que busca os dados da API e monta o painel
async function loadJiraDataAndBuild() {
  const container = document.getElementById("devstatus-container");
  if (!container) return;

  // 1. Identifica a chave da issue atual diretamente olhando para a URL da página
  // Padrão esperado: https://jiraproducao.totvs.com.br/browse/DSAUPEPCONV-24150
  const urlParts = window.location.pathname.split("/");
  const subTaskId = urlParts[urlParts.length - 1];

  // Validação básica se a string extraída da URL realmente parece uma chave do Jira (Ex: ABC-123)
  if (!subTaskId || !subTaskId.includes("-")) return;

  // Se a issue mudou (detectado via URL), limpa agressivamente o componente anterior antes do novo Fetch
  if (currentIssueKey !== subTaskId) {
    const oldHelper = document.getElementById("totvs-helper-group");
    if (oldHelper) oldHelper.remove();
    container.removeAttribute("data-totvs-loading");
  }

  // Se o componente já existe para ESSA issue ou está no meio de um carregamento, aborta
  if (
    document.getElementById("totvs-helper-group") ||
    container.getAttribute("data-totvs-loading") === "true"
  ) {
    return;
  }

  // Ativa a trava de carregamento e atualiza a chave de controle
  container.setAttribute("data-totvs-loading", "true");
  currentIssueKey = subTaskId;

  try {
    const response = await fetch(
      `/rest/api/2/issue/${subTaskId}?fields=summary,issuetype,parent`,
    );
    if (!response.ok) throw new Error("Erro ao consultar API do Jira");

    const issueData = await response.json();
    console.log(issueData);

    // FILTRO DE ESCOPO: Se não tiver pai, remove o helper (ignora as tasks principais/pai)
    if (!issueData.fields.parent) {
      const oldHelper = document.getElementById("totvs-helper-group");
      if (oldHelper) oldHelper.remove();
      container.removeAttribute("data-totvs-loading");
      return;
    }

    // Dupla checagem pós-fetch contra concorrência assíncrona
    if (
      document.getElementById("totvs-helper-group") &&
      currentIssueKey === subTaskId
    ) {
      container.removeAttribute("data-totvs-loading");
      return;
    }

    // Extração de Dados via JSON da API
    const subTaskType = issueData.fields.issuetype.name;
    let taskName = issueData.fields.parent.fields.summary || "";
    const taskId = issueData.fields.parent.key;
    const parentType = issueData.fields.parent.fields.issuetype.name;

    // Limpeza de prefixos repetitivos do título do chamado
    taskName = taskName.replace(
      new RegExp(`^Codificação\\s*-\\s*#*\\w+:\\s*`, "i"),
      "",
    );
    taskName = taskName.replace(new RegExp(`^${subTaskId}\\s*`, "i"), "");

    const defaultCommitType = getAutoCommitType(parentType, subTaskType);

    // Em chamados de defeito/bug, o check-in deve contemplar a descrição
    // do defeito (sub-task) além da descrição do chamado pai
    const isDefectSubTask = isDefectType(subTaskType);
    const defectDescription = isDefectSubTask
      ? extractDefectDescription(issueData.fields.summary)
      : "";
    const checkinTaskName = defectDescription
      ? `${taskName} - ${defectDescription}`
      : taskName;

    // Construção da Interface do Helper
    const helperGroup = document.createElement("div");
    helperGroup.id = "totvs-helper-group";
    helperGroup.style.marginTop = "10px";
    helperGroup.style.paddingTop = "10px";

    const selectWrapper = document.createElement("div");
    selectWrapper.style.marginBottom = "10px";
    selectWrapper.style.display = "flex";
    selectWrapper.style.alignItems = "center";
    selectWrapper.style.gap = "8px";
    selectWrapper.innerHTML = `
      <span style="font-size: 11px; font-weight: bold; color: #5e6c84; user-select: none;">COMMIT INTENT:</span>
      <select id="totvs-global-type" style="padding: 2px 4px; border-radius: 3px; border: 1px solid #ccc; font-size: 11px; background: #fff; cursor: pointer;">
        <option value="FIX" ${defaultCommitType === "FIX" ? "selected" : ""}>FIX</option>
        <option value="FEAT" ${defaultCommitType === "FEAT" ? "selected" : ""}>FEAT</option>
        <option value="MERGE" ${defaultCommitType === "MERGE" ? "selected" : ""}>MERGE</option>
        <option value="REFACT" ${defaultCommitType === "REFACT" ? "selected" : ""}>REFACT</option>
      </select>
    `;
    helperGroup.appendChild(selectWrapper);

    const templates = [
      { label: "Branch", id: "totvs-text-branch", generate: () => subTaskId },
      {
        label: `Sub-Task\\Requisito`,
        id: "totvs-text-issue",
        generate: () => `${subTaskId}\\${taskId}`,
      },
      {
        label: "Check-in",
        id: "totvs-text-checkin",
        generate: (type) => `[${type}] ${taskId} ${checkinTaskName}`,
        isMultiline: true,
      },
      {
        label: "Comentário Cliente",
        id: "totvs-text-comment",
        generate: () => `${taskId} ${taskName}`,
        isMultiline: true,
      },
      {
        label: "PR Template",
        id: "totvs-text-pr",
        isMultiline: true,
        generate: (type) =>
          `- CodigoIssue:[${subTaskId}\\${taskId}]\n- DescricaoCliente:[${taskName}]\n\n[${type}] ${taskId} - ${checkinTaskName}`,
      },
    ];

    templates.forEach((tpl) => {
      const li = document.createElement("li");
      li.className = "call-to-actions devstatus-entry totvs-li-helper";
      li.style.marginBottom = "8px";
      li.style.display = "flex";
      li.style.flexDirection = "column";
      li.style.alignItems = "flex-start";
      li.style.cursor = "pointer";
      li.title = `Clique para copiar ${tpl.label}`;

      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; gap: 6px;">
          <span style="font-size: 11px; font-weight: bold; color: #7a869a; text-transform: uppercase; user-select: none; padding: 4px 0;">${tpl.label}</span>
        </div>
        <div class="totvs-preview-box" id="${tpl.id}" style="width: 100%; font-size: 12px; color: #344563; background: #f4f5f7; padding: 4px 6px; border-radius: 3px; border: 1px solid #dfe1e6; margin-top: 2px; text-align: left; box-sizing: border-box; overflow-x: auto; white-space: ${tpl.isMultiline ? "pre-wrap" : "nowrap"}; font-family: monospace; pointer-events: none;">
        </div>
      `;

      li.dataset.templateIndex = templates.indexOf(tpl);
      helperGroup.appendChild(li);
    });

    container.appendChild(helperGroup);

    const globalTypeSelect = helperGroup.querySelector("#totvs-global-type");

    function updateAllPreviews() {
      const currentType = globalTypeSelect.value;
      templates.forEach((tpl) => {
        const box = helperGroup.querySelector(`#${tpl.id}`);
        if (box) box.innerText = tpl.generate(currentType);
      });
    }

    helperGroup.querySelectorAll(".totvs-li-helper").forEach((li) => {
      li.addEventListener("click", () => {
        const tplIndex = li.dataset.templateIndex;
        const tpl = templates[tplIndex];
        const box = li.querySelector(".totvs-preview-box");
        const currentType = globalTypeSelect.value;
        const textToCopy = tpl.generate(currentType);

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            const originalBg = box.style.background;
            const originalColor = box.style.color;
            box.style.background = "#e6f4ea";
            box.style.color = "#137333";
            setTimeout(() => {
              box.style.background = originalBg;
              box.style.color = originalColor;
            }, 800);
          })
          .catch((err) => console.error("Erro ao copiar: ", err));
      });
    });

    globalTypeSelect.addEventListener("change", updateAllPreviews);
    updateAllPreviews();
  } catch (error) {
    console.error("Erro no TOTVS Jira Helper (API):", error);
  } finally {
    if (container) {
      container.removeAttribute("data-totvs-loading");
    }
  }
}

// 1. MONITOR DE URL ATIVO (Pooling de alta performance)
// Como o Jira usa o histórico pushState do HTML5 para mudar a URL silenciosamente,
// checar a string da URL a cada 400ms é o método mais leve e infalível para SPA.
setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    loadJiraDataAndBuild();
  }
}, 400);

// 2. MONITOR DE DOM (Garante injeção se o container sumir e reaparecer na mesma URL)
const observer = new MutationObserver(() => {
  if (document.getElementById("devstatus-container")) {
    loadJiraDataAndBuild();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
