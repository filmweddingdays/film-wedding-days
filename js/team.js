/* Team roster & crew payment stats */

let editingTeamId = null;

function renderTeamCard(member) {
  const stats = getTeamStats(member);
  return `
    <article class="card team-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
        <div>
          <h3 style="font-family:var(--font-display);margin:0;font-size:1.1rem">${escapeHtml(member.name)}</h3>
          <p class="meta" style="margin:0.25rem 0 0;font-size:0.85rem">${escapeHtml(member.role)}</p>
        </div>
        <span class="badge" style="--badge:${member.availability === "Available" ? "#059669" : "#d97706"}">${escapeHtml(member.availability)}</span>
      </div>
      <dl style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem;margin:0 0 0.75rem">
        <div><dt class="meta" style="font-size:0.65rem">Day rate</dt><dd style="margin:0.15rem 0 0;font-weight:600">${formatCurrency(member.dayRate)}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Assigned events</dt><dd style="margin:0.15rem 0 0;font-weight:600">${stats.assigned}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Paid</dt><dd style="margin:0.15rem 0 0;font-weight:600;color:var(--green)">${formatCurrency(stats.paid)}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Pending</dt><dd style="margin:0.15rem 0 0;font-weight:600;color:var(--red)">${formatCurrency(stats.pending)}</dd></div>
      </dl>
      ${member.phone ? `<p class="meta" style="font-size:0.8rem;margin:0 0 0.75rem">${escapeHtml(member.phone)}</p>` : ""}
      ${member.notes ? `<p class="meta" style="font-size:0.75rem;margin:0 0 0.75rem">${escapeHtml(member.notes)}</p>` : ""}
      <div class="table-actions">
        <button type="button" class="btn-edit" data-edit-team="${member.id}">Edit</button>
        <button type="button" class="btn-delete" data-delete-team="${member.id}">Remove</button>
      </div>
    </article>`;
}

function renderTeam() {
  const cards = team.map(renderTeamCard).join("");
  const totalAssigned = team.reduce((s, m) => s + getTeamStats(m).assigned, 0);
  const totalPending = team.reduce((s, m) => s + getTeamStats(m).pending, 0);

  return `
    <style>
      .team-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem; }
    </style>
    <div class="page-header">
      <div>
        <h1>Team</h1>
        <p>Crew roster, assignments &amp; payout tracking</p>
      </div>
      <button type="button" class="btn-primary" id="btn-new-team">+ Add member</button>
    </div>
    <div class="kpi-grid" style="margin-bottom:1.5rem">
      <div class="card kpi-card">
        <div class="kpi-label">Team members</div>
        <div class="kpi-value">${team.length}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Total assignments</div>
        <div class="kpi-value">${totalAssigned}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Pending payouts</div>
        <div class="kpi-value profit-neg">${formatCurrency(totalPending)}</div>
      </div>
    </div>
    ${
      team.length === 0
        ? `<div class="empty-state card" style="border-style:dashed">No team members yet.<br><button type="button" class="text-link" id="btn-add-team">Add your first crew member</button></div>`
        : `<div class="team-grid">${cards}</div>`
    }
    <div id="team-overlay" class="overlay center" hidden>
      <div class="form-modal" role="dialog" aria-labelledby="team-form-title">
        <div class="form-modal-header">
          <h2 id="team-form-title">Add team member</h2>
          <button type="button" class="btn-icon" id="team-form-close">✕</button>
        </div>
        <form id="team-form" class="order-form"></form>
      </div>
    </div>`;
}

function buildTeamFormHtml(member) {
  const m = member ? normalizeTeamMember(member) : null;
  const roles = [
    "Photographer",
    "Videographer",
    "Candid Photographer",
    "Candid Videographer",
    "Drone Operator",
    "Editor",
    "Album Designer",
    "Assistant",
    "Helper",
  ];
  const roleOpts = roles.map(
    (r) => `<option value="${escapeAttr(r)}" ${m?.role === r ? "selected" : ""}>${escapeHtml(r)}</option>`
  ).join("");

  return `
    <div class="form-group">
      <label>Name</label>
      <input name="name" required value="${m ? escapeAttr(m.name) : ""}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Role</label>
        <select name="role">${roleOpts}</select>
      </div>
      <div class="form-group">
        <label>Day rate (₹)</label>
        <input type="number" name="dayRate" min="0" value="${m?.dayRate ?? 0}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Phone</label>
        <input name="phone" type="tel" value="${m ? escapeAttr(m.phone) : ""}" />
      </div>
      <div class="form-group">
        <label>Availability</label>
        <select name="availability">
          <option value="Available" ${m?.availability === "Available" ? "selected" : ""}>Available</option>
          <option value="Busy" ${m?.availability === "Busy" ? "selected" : ""}>Busy</option>
          <option value="On leave" ${m?.availability === "On leave" ? "selected" : ""}>On leave</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea name="notes" rows="2">${m ? escapeHtml(m.notes) : ""}</textarea>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-primary">${m ? "Save member" : "Add member"}</button>
      <button type="button" class="btn-secondary" id="team-form-cancel">Cancel</button>
    </div>`;
}

function openTeamForm(memberId = null) {
  editingTeamId = memberId;
  const member = memberId ? team.find((m) => m.id === memberId) : null;
  $("#team-form-title").textContent = member ? "Edit team member" : "Add team member";
  $("#team-form").innerHTML = buildTeamFormHtml(member);
  $("#team-overlay").hidden = false;

  $("#team-form-close").onclick = closeTeamForm;
  $("#team-form-cancel").onclick = closeTeamForm;
  $("#team-overlay").onclick = (e) => {
    if (e.target === $("#team-overlay")) closeTeamForm();
  };
  $("#team-form").onsubmit = (e) => {
    e.preventDefault();
    submitTeamForm();
  };
}

function closeTeamForm() {
  $("#team-overlay").hidden = true;
  editingTeamId = null;
}

function submitTeamForm() {
  const form = $("#team-form");
  const payload = normalizeTeamMember({
    name: form.name.value.trim(),
    role: form.role.value,
    phone: form.phone.value.trim(),
    dayRate: Number(form.dayRate.value) || 0,
    availability: form.availability.value,
    notes: form.notes.value.trim(),
  });

  if (editingTeamId) {
    const idx = team.findIndex((m) => m.id === editingTeamId);
    if (idx >= 0) team[idx] = { ...payload, id: editingTeamId };
  } else {
    team.push({ ...payload, id: createId("team") });
  }

  saveAppData({
    history: {
      action: editingTeamId ? "edit" : "add",
      label: editingTeamId ? `Updated team: ${payload.name}` : `Added team: ${payload.name}`,
    },
  });
  closeTeamForm();
  render();
}

function bindTeamEvents() {
  $("#btn-new-team")?.addEventListener("click", () => openTeamForm());
  $("#btn-add-team")?.addEventListener("click", () => openTeamForm());

  $$("[data-edit-team]").forEach((btn) => {
    btn.onclick = () => openTeamForm(btn.dataset.editTeam);
  });

  $$("[data-delete-team]").forEach((btn) => {
    btn.onclick = () => {
      const member = team.find((m) => m.id === btn.dataset.deleteTeam);
      if (member && confirm(`Remove ${member.name} from team?`)) {
        team = team.filter((m) => m.id !== btn.dataset.deleteTeam);
        saveAppData({ history: { action: "delete", label: `Removed team member: ${member.name}` } });
        render();
      }
    };
  });
}
