/* Film Wedding Days — app router & init */

function getRoute() {
  const hash = location.hash.slice(1) || "/";
  if (hash.startsWith("/calendar")) return "calendar";
  if (hash.startsWith("/orders")) return "orders";
  if (hash.startsWith("/leads")) return "leads";
  if (hash.startsWith("/team")) return "team";
  if (hash.startsWith("/reports")) return "reports";
  if (hash.startsWith("/customer")) return "customer";
  return "dashboard";
}

function setActiveNav(route) {
  const navRoute = route === "customer" ? "orders" : route;
  $$(".main-nav a, .bottom-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === navRoute);
  });
}

function render() {
  const route = getRoute();
  setActiveNav(route);
  const main = $("#app-main");
  if (route === "dashboard") main.innerHTML = renderDashboard();
  else if (route === "calendar") main.innerHTML = renderCalendar();
  else if (route === "orders") main.innerHTML = renderOrders();
  else if (route === "leads") main.innerHTML = renderLeads();
  else if (route === "team") main.innerHTML = renderTeam();
  else if (route === "reports") main.innerHTML = renderReports();
  else if (route === "customer") main.innerHTML = renderCustomerProfile();
  bindPageEvents(route);
  updateFabVisibility(route);
}

function updateFabVisibility(route) {
  const fab = $("#fab-new-order");
  if (fab) fab.hidden = route === "customer";
}

function bindPageEvents(route) {
  if (route === "dashboard" && typeof bindDashboardEvents === "function") {
    bindDashboardEvents();
  }
  if (route === "calendar" && typeof bindCalendarEvents === "function") {
    bindCalendarEvents();
  }
  if (route === "orders" && typeof bindOrdersEvents === "function") {
    bindOrdersEvents();
  }
  if (route === "leads" && typeof bindLeadsEvents === "function") {
    bindLeadsEvents();
  }
  if (route === "team" && typeof bindTeamEvents === "function") {
    bindTeamEvents();
  }
  if (route === "reports" && typeof bindReportsEvents === "function") {
    bindReportsEvents();
  }
  if (route === "customer" && typeof bindCustomerEvents === "function") {
    bindCustomerEvents();
  }

  const cancelBtn = $("#form-cancel");
  if (cancelBtn) cancelBtn.addEventListener("click", closeForm);

  const startInput = $("#form-start");
  if (startInput) {
    startInput.addEventListener("change", () => {
      const end = $("#form-end");
      if (end && (!end.value || end.value < startInput.value)) end.value = startInput.value;
    });
  }
}

function showFooterMessage(msg) {
  const el = $("#footer-message");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 3000);
}

function openHistoryPanel() {
  const list = loadHistory();
  const body = $("#history-body");
  if (!list.length) {
    body.innerHTML =
      '<p class="empty-state">No saved changes yet. Edits will appear here.</p>';
  } else {
    body.innerHTML = `<ul class="history-list">${list
      .map((h) => {
        const actionLabel =
          {
            add: "Added",
            edit: "Updated",
            delete: "Deleted",
            import: "Imported",
            restore: "Restored",
          }[h.action] || "Changed";
        return `<li class="history-item">
          <div class="history-item-main">
            <span class="history-action">${escapeHtml(actionLabel)}</span>
            <span class="history-label">${escapeHtml(h.label)}</span>
            <span class="history-time">${escapeHtml(formatHistoryTime(h.timestamp))}</span>
          </div>
          <button type="button" class="btn-secondary btn-sm" data-restore-id="${escapeAttr(h.id)}">Restore</button>
        </li>`;
      })
      .join("")}</ul>`;
    $$("[data-restore-id]", body).forEach((btn) => {
      btn.onclick = () => restoreFromHistory(btn.dataset.restoreId);
    });
  }
  $("#history-overlay").hidden = false;
}

function setupFooter() {
  $("#btn-export")?.addEventListener("click", () => {
    const blob = new Blob(
      [JSON.stringify({ orders, leads, team, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    downloadBlob(blob, `fwds-backup-${new Date().toISOString().slice(0, 10)}.json`);
    showFooterMessage("Backup exported");
  });

  $("#btn-import")?.addEventListener("click", () => $("#import-file")?.click());

  $("#import-file")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          orders = data.map(normalizeOrder);
          leads = [];
          team = SEED_TEAM.map((m) => normalizeTeamMember({ ...m }));
        } else {
          orders = (data.orders || []).map(normalizeOrder);
          leads = (data.leads || []).map(normalizeLead);
          team = (data.team || SEED_TEAM).map(normalizeTeamMember);
        }
        saveAppData({
          history: { action: "import", label: `Imported backup (${orders.length} orders)` },
        });
        showFooterMessage("Import successful");
        render();
      } catch {
        showFooterMessage("Import failed — check JSON format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("#btn-history")?.addEventListener("click", openHistoryPanel);
  $("#history-close")?.addEventListener("click", () => {
    $("#history-overlay").hidden = true;
  });
  $("#history-overlay")?.addEventListener("click", (e) => {
    if (e.target === $("#history-overlay")) $("#history-overlay").hidden = true;
  });

  $("#fab-new-order")?.addEventListener("click", () => openOrderForm());
}

function setupNav() {
  $$(".main-nav a, .bottom-nav a").forEach((a) => {
    a.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function setupThemeToggle() {
  const opts = $$(".theme-opt");
  if (!opts.length) return;
  const THEMES = ["light", "dark", "black"];
  const setActive = (theme) => {
    opts.forEach((o) => o.classList.toggle("active", o.dataset.themeValue === theme));
  };
  const apply = (theme) => {
    if (!THEMES.includes(theme)) theme = "light";
    document.documentElement.setAttribute("data-theme", theme);
    setActive(theme);
    try {
      localStorage.setItem("fwds-theme", theme);
    } catch (e) {}
  };
  const current = document.documentElement.getAttribute("data-theme") || "light";
  setActive(THEMES.includes(current) ? current : "light");
  opts.forEach((o) => o.addEventListener("click", () => apply(o.dataset.themeValue)));
}

initData();
setupFooter();
setupNav();
setupThemeToggle();
window.addEventListener("hashchange", render);
render();

// Initialize Firebase and sync data on startup
if (typeof initFirebase === "function") {
  initFirebase().then(() => {
    if (typeof syncWithFirebase === "function") syncWithFirebase();
  });
}
