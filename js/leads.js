/* Leads pipeline */

let editingLeadId = null;

function isFollowUpDue(lead) {
  if (!lead.followUpDate) return false;
  const today = toIsoDate(new Date());
  return lead.followUpDate <= today;
}

function renderLeadRow(lead) {
  const due = isFollowUpDue(lead) && lead.status !== "Converted" && lead.status !== "Lost";
  return `
    <tr class="${due ? "lead-followup-due" : ""}" style="${due ? "background:var(--alert-bg)" : ""}">
      <td><strong>${escapeHtml(lead.name)}</strong>${due ? ' <span class="badge" style="--badge:#b91c1c">Follow-up due</span>' : ""}</td>
      <td>${escapeHtml(lead.phone || "—")}</td>
      <td>${eventTypeBadge(lead.eventType)}</td>
      <td>${lead.eventDate ? escapeHtml(lead.eventDate) : "—"}</td>
      <td>${escapeHtml(lead.source)}</td>
      <td><span class="badge" style="--badge:${lead.status === "Converted" ? "#059669" : lead.status === "Lost" ? "#64748b" : "#0ea5e9"}">${escapeHtml(lead.status)}</span></td>
      <td>${lead.followUpDate ? escapeHtml(lead.followUpDate) : "—"}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn-edit" data-edit-lead="${lead.id}">Edit</button>
          <button type="button" class="btn-delete" data-delete-lead="${lead.id}">Delete</button>
        </div>
      </td>
    </tr>`;
}

function renderLeadCard(lead) {
  const due = isFollowUpDue(lead) && lead.status !== "Converted" && lead.status !== "Lost";
  return `
    <article class="card" style="${due ? "border-color:var(--alert-border);background:var(--alert-bg)" : ""}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
        <strong>${escapeHtml(lead.name)}</strong>
        ${due ? '<span class="badge" style="--badge:#b91c1c">Follow-up due</span>' : ""}
      </div>
      <p class="meta" style="font-size:0.85rem;margin:0 0 0.5rem">${escapeHtml(lead.phone || "—")} · ${escapeHtml(lead.source)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.5rem">${eventTypeBadge(lead.eventType)}</div>
      <p class="meta" style="font-size:0.8rem;margin:0 0 0.75rem">Event: ${lead.eventDate || "TBD"} · Follow-up: ${lead.followUpDate || "—"}</p>
      <div class="table-actions">
        <button type="button" class="btn-edit" data-edit-lead="${lead.id}">Edit</button>
        <button type="button" class="btn-delete" data-delete-lead="${lead.id}">Delete</button>
      </div>
    </article>`;
}

function renderLeads() {
  const dueCount = leads.filter((l) => isFollowUpDue(l) && l.status !== "Converted" && l.status !== "Lost").length;
  const rows = leads.map(renderLeadRow).join("");
  const cards = leads.map(renderLeadCard).join("");

  const empty = `<div class="empty-state card" style="border-style:dashed">No leads yet.<br><button type="button" class="text-link" id="btn-add-lead">Add your first lead</button></div>`;

  return `
    <style>
      .leads-mobile { display: grid; gap: 1rem; }
      .leads-desktop { display: none; }
      @media (min-width: 768px) {
        .leads-mobile { display: none !important; }
        .leads-desktop { display: block !important; }
      }
    </style>
    <div class="page-header">
      <div>
        <h1>Leads</h1>
        <p>Track enquiries, follow-ups &amp; conversions</p>
      </div>
      <button type="button" class="btn-primary" id="btn-new-lead">+ New lead</button>
    </div>
    ${dueCount > 0 ? `<p class="card" style="padding:0.75rem 1rem;margin-bottom:1rem;border-color:var(--alert-border);background:var(--alert-bg);color:var(--red);font-size:0.9rem"><strong>${dueCount}</strong> follow-up${dueCount !== 1 ? "s" : ""} due today or overdue</p>` : ""}
    ${
      leads.length === 0
        ? empty
        : `
      <div class="leads-mobile">${cards}</div>
      <div class="table-wrap leads-desktop"><table style="min-width:800px">
        <thead><tr>
          <th>Name</th><th>Phone</th><th>Type</th><th>Event date</th><th>Source</th><th>Status</th><th>Follow-up</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`
    }
    <div id="lead-overlay" class="overlay center" hidden>
      <div class="form-modal" role="dialog" aria-labelledby="lead-form-title">
        <div class="form-modal-header">
          <h2 id="lead-form-title">New lead</h2>
          <button type="button" class="btn-icon" id="lead-form-close">✕</button>
        </div>
        <form id="lead-form" class="order-form"></form>
      </div>
    </div>`;
}

function buildLeadFormHtml(lead) {
  const l = lead ? normalizeLead(lead) : null;
  const sourceOpts = LEAD_SOURCES.map(
    (s) => `<option value="${escapeAttr(s)}" ${l?.source === s ? "selected" : ""}>${escapeHtml(s)}</option>`
  ).join("");
  const statusOpts = LEAD_STATUSES.map(
    (s) => `<option value="${escapeAttr(s)}" ${l?.status === s ? "selected" : ""}>${escapeHtml(s)}</option>`
  ).join("");
  const typeOpts = EVENT_TYPES.map(
    (t) => `<option value="${t.id}" ${l?.eventType === t.id ? "selected" : ""}>${escapeHtml(t.label)}</option>`
  ).join("");

  return `
    <div class="form-group">
      <label>Name</label>
      <input name="name" required value="${l ? escapeAttr(l.name) : ""}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Phone</label>
        <input name="phone" type="tel" value="${l ? escapeAttr(l.phone) : ""}" />
      </div>
      <div class="form-group">
        <label>Event date</label>
        <input name="eventDate" type="date" value="${l?.eventDate || ""}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Event type</label>
        <select name="eventType">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label>Location</label>
        <input name="location" value="${l ? escapeAttr(l.location) : ""}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Budget range</label>
        <input name="budgetRange" value="${l ? escapeAttr(l.budgetRange) : ""}" placeholder="₹2–3L" />
      </div>
      <div class="form-group">
        <label>Source</label>
        <select name="source">${sourceOpts}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Status</label>
        <select name="status">${statusOpts}</select>
      </div>
      <div class="form-group">
        <label>Follow-up date</label>
        <input name="followUpDate" type="date" value="${l?.followUpDate || ""}" />
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea name="notes" rows="3">${l ? escapeHtml(l.notes) : ""}</textarea>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-primary">${l ? "Save lead" : "Add lead"}</button>
      <button type="button" class="btn-secondary" id="lead-form-cancel">Cancel</button>
    </div>`;
}

function openLeadForm(leadId = null) {
  editingLeadId = leadId;
  const lead = leadId ? leads.find((l) => l.id === leadId) : null;
  $("#lead-form-title").textContent = lead ? "Edit lead" : "New lead";
  $("#lead-form").innerHTML = buildLeadFormHtml(lead);
  $("#lead-overlay").hidden = false;

  $("#lead-form-close").onclick = closeLeadForm;
  $("#lead-form-cancel").onclick = closeLeadForm;
  $("#lead-overlay").onclick = (e) => {
    if (e.target === $("#lead-overlay")) closeLeadForm();
  };
  $("#lead-form").onsubmit = (e) => {
    e.preventDefault();
    submitLeadForm();
  };
}

function closeLeadForm() {
  $("#lead-overlay").hidden = true;
  editingLeadId = null;
}

function submitLeadForm() {
  const form = $("#lead-form");
  const payload = normalizeLead({
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    eventDate: form.eventDate.value,
    eventType: form.eventType.value,
    location: form.location.value.trim(),
    budgetRange: form.budgetRange.value.trim(),
    source: form.source.value,
    status: form.status.value,
    followUpDate: form.followUpDate.value,
    notes: form.notes.value.trim(),
  });

  if (editingLeadId) {
    const idx = leads.findIndex((l) => l.id === editingLeadId);
    if (idx >= 0) leads[idx] = { ...payload, id: editingLeadId };
  } else {
    leads.push({ ...payload, id: createId("lead") });
  }

  saveAppData({
    history: {
      action: editingLeadId ? "edit" : "add",
      label: editingLeadId ? `Updated lead: ${payload.name}` : `Added lead: ${payload.name}`,
    },
  });
  closeLeadForm();
  render();
}

function bindLeadsEvents() {
  $("#btn-new-lead")?.addEventListener("click", () => openLeadForm());
  $("#btn-add-lead")?.addEventListener("click", () => openLeadForm());

  $$("[data-edit-lead]").forEach((btn) => {
    btn.onclick = () => openLeadForm(btn.dataset.editLead);
  });

  $$("[data-delete-lead]").forEach((btn) => {
    btn.onclick = () => {
      const lead = leads.find((l) => l.id === btn.dataset.deleteLead);
      if (lead && confirm(`Delete lead for ${lead.name}?`)) {
        leads = leads.filter((l) => l.id !== btn.dataset.deleteLead);
        saveAppData({ history: { action: "delete", label: `Deleted lead: ${lead.name}` } });
        render();
      }
    };
  });
}
