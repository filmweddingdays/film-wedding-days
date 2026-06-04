/* Order form modal & detail panel */

function renderExpenseDetailHtml(order) {
  const b = order.expenseBreakdown || defaultExpenseBreakdown();
  const crew = order.crewPayouts || [];
  const breakdownTotal = getExpenseBreakdownTotal(order);
  const crewTotal = getCrewPayoutTotal(order);
  const grand = getTotalExpenses(order);

  const rows = EXPENSE_FIELDS.map((f) => {
    const val = b[f.key] || 0;
    return `<tr>
      <td>${escapeHtml(f.label)}</td>
      <td style="text-align:right;font-weight:500">${formatCurrency(val)}</td>
    </tr>`;
  }).join("");

  const crewRows =
    crew.length === 0
      ? `<tr><td colspan="3" class="meta">No crew payouts recorded</td></tr>`
      : crew
          .map((l) => {
            const paidTag = l.paid
              ? `<span class="badge" style="--badge:#059669">Paid</span>`
              : `<span class="badge" style="--badge:#b91c1c">Unpaid</span>`;
            return `<tr>
        <td>${escapeHtml(l.name)} ${paidTag}</td>
        <td class="meta">${escapeHtml(l.role || "Crew")}${l.paymentDate ? ` · ${escapeHtml(l.paymentDate)}` : ""}</td>
        <td style="text-align:right;font-weight:500">${formatCurrency(l.payout)}</td>
      </tr>`;
          })
          .join("");

  return `
    <table class="expense-table">
      <thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}
        <tr class="total-row"><td>Operating subtotal</td><td style="text-align:right">${formatCurrency(breakdownTotal)}</td></tr>
      </tbody>
    </table>
    <h4 style="font-size:0.75rem;text-transform:uppercase;color:var(--warm);margin:1rem 0 0.5rem">Crew payouts</h4>
    <table class="expense-table">
      <thead><tr><th>Name</th><th>Role / date</th><th style="text-align:right">Payout</th></tr></thead>
      <tbody>${crewRows}
        <tr class="total-row"><td colspan="2">Crew subtotal</td><td style="text-align:right">${formatCurrency(crewTotal)}</td></tr>
      </tbody>
    </table>
    <div class="expense-total-bar" style="margin-top:0.75rem">
      <span>Total expenses</span>
      <strong>${formatCurrency(grand)}</strong>
    </div>`;
}

function renderDeliverablesDetail(order) {
  const d = order.deliverables || defaultDeliverables();
  const items = DELIVERABLE_KEYS.map((k) => {
    const done = d[k.key];
    return `<li style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:0.35rem">
      <span style="color:${done ? "var(--green)" : "var(--warm)"}">${done ? "✓" : "○"}</span>
      ${escapeHtml(k.label)}
    </li>`;
  }).join("");
  return `<ul style="list-style:none;margin:0;padding:0">${items}</ul>
    <p class="meta" style="margin-top:0.5rem">${getDeliverableProgress(order)}% complete</p>`;
}

function getOrderClashWarnings(order) {
  const dates = new Set();
  (order.scheduleTimes || []).forEach((s) => s.date && dates.add(s.date));
  if (order.startDate) dates.add(order.startDate);
  if (order.endDate) dates.add(order.endDate);

  const warnings = [];
  dates.forEach((date) => {
    getCrewClashes(date).forEach((clash) => {
      const involves = clash.orders.some((o) => o.id === order.id);
      if (involves) {
        warnings.push({
          date,
          name: clash.name,
          others: clash.orders.filter((o) => o.id !== order.id).map((o) => o.customerName),
        });
      }
    });
  });
  return warnings;
}

function showOrderDetail(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  const days = getEventDays(order);
  const profit = getProfit(order);
  const p = order.payments || defaultPayments();
  const clashes = getOrderClashWarnings(order);

  const slots =
    order.scheduleTimes.length === 0
      ? "<p class='meta'>No detailed times added</p>"
      : order.scheduleTimes
          .map((s) => {
            const d = parseDate(s.date);
            const label = s.label ? ` — ${escapeHtml(s.label)}` : "";
            return `<div class="slot-item">
            <strong>${formatDate(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}${label}</strong><br>
            ${s.startTime} – ${s.endTime}
          </div>`;
          })
          .join("");

  const crewSections = CREW_SLOTS.map(({ field, label }) => {
    const names = order[field] || [];
    const chipCls = field.includes("videographer") || field.includes("Videographer") ? "chip video" : "chip";
    return `
      <p class="meta" style="margin-bottom:0.25rem">${escapeHtml(label)}</p>
      <div class="chips" style="margin-bottom:0.75rem">${renderChips(names, chipCls)}</div>`;
  }).join("");

  const clashHtml =
    clashes.length === 0
      ? ""
      : `<div class="detail-section" style="background:var(--alert-bg);border:1px solid var(--alert-border);border-radius:8px;padding:0.75rem">
        <h3 style="color:var(--red)">⚠ Crew clash warnings</h3>
        <ul style="margin:0;padding-left:1.25rem;font-size:0.85rem">
          ${clashes
            .map(
              (c) =>
                `<li><strong>${escapeHtml(c.name)}</strong> on ${escapeHtml(c.date)} — also on ${c.others.map((n) => escapeHtml(n)).join(", ")}</li>`
            )
            .join("")}
        </ul>
      </div>`;

  const services = order.services || defaultServices();

  $("#detail-panel").innerHTML = `
    <div class="detail-header" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="eyebrow">Booking</div>
        <h2 id="detail-title">${escapeHtml(order.customerName)}</h2>
        <p class="meta">${formatDateRange(order)} · ${days} day${days !== 1 ? "s" : ""}</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.5rem">
          ${eventTypeBadge(order.eventType)}
          ${statusBadge(order.status)}
        </div>
      </div>
      <button type="button" class="btn-icon" id="detail-close">✕</button>
    </div>
    <div class="detail-body">
      ${clashHtml}
      <div class="detail-section">
        <h3>Customer</h3>
        <dl class="booking-services">
          <div><dt>Bride / Groom</dt><dd>${escapeHtml(order.brideName || "—")} / ${escapeHtml(order.groomName || "—")}</dd></div>
          <div><dt>Phone</dt><dd>${escapeHtml(order.phone || "—")}</dd></div>
          <div><dt>City / Venue</dt><dd>${escapeHtml(order.city || "—")} · ${escapeHtml(order.venue || "—")}</dd></div>
        </dl>
        <a href="${whatsappLink(order.whatsapp || order.phone, `Hi ${order.customerName}, regarding your booking with Film Wedding Days`)}" target="_blank" rel="noopener" class="btn-secondary btn-sm" style="display:inline-block;margin-top:0.5rem">WhatsApp customer</a>
        <a href="#/customer?id=${escapeAttr(order.id)}" class="link-gold" style="display:inline-block;margin-left:0.75rem;font-size:0.85rem">Full profile →</a>
      </div>
      <div class="detail-section"><h3>Schedule times</h3>${slots}</div>
      <div class="detail-section">
        <h3>Services &amp; production</h3>
        <dl class="booking-services">
          <div><dt>Albums</dt><dd>${order.albumCount || 0}${order.albumSize ? ` (${escapeHtml(order.albumSize)})` : ""}</dd></div>
          <div><dt>LED wall</dt><dd>${escapeHtml(order.ledWallSize || "—")}</dd></div>
          <div><dt>Drone</dt><dd>${escapeHtml(order.drone || "—")}</dd></div>
          <div><dt>Teaser</dt><dd>${services.teaserIncluded ? "Included" : "—"}</dd></div>
          <div><dt>Cinematic film</dt><dd>${services.cinematicFilmIncluded ? "Included" : "—"}</dd></div>
          <div><dt>Hard disk</dt><dd>${services.hardDiskIncluded ? "Included" : "—"}</dd></div>
        </dl>
      </div>
      <div class="detail-section"><h3>Crew</h3>${crewSections}</div>
      <div class="detail-section">
        <h3>Payments</h3>
        <dl class="finance-grid">
          <div class="finance-box"><dt>Package</dt><dd>${formatCurrency(p.totalPackage)}</dd></div>
          <div class="finance-box"><dt>Paid</dt><dd>${formatCurrency(getTotalPaid(order))}</dd></div>
          <div class="finance-box wide"><dt>Balance</dt><dd class="${getBalance(order) > 0 ? "profit-neg" : "profit-pos"}">${formatCurrency(getBalance(order))}</dd></div>
        </dl>
        ${p.dueDate ? `<p class="meta">Due: ${escapeHtml(p.dueDate)}${p.paymentMode ? ` · ${escapeHtml(p.paymentMode)}` : ""}</p>` : ""}
      </div>
      <div class="detail-section"><h3>Expense breakdown</h3>${renderExpenseDetailHtml(order)}</div>
      <div class="detail-section"><h3>Deliverables</h3>${renderDeliverablesDetail(order)}</div>
      <div class="detail-section">
        <h3>Summary</h3>
        <dl class="finance-grid">
          <div class="finance-box"><dt>Revenue</dt><dd>${formatCurrency(p.totalPackage || order.budget)}</dd></div>
          <div class="finance-box"><dt>Total expenses</dt><dd>${formatCurrency(getTotalExpenses(order))}</dd></div>
          <div class="finance-box wide"><dt>Profit (${getProfitPct(order)}%)</dt><dd class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</dd></div>
        </dl>
      </div>
      ${order.notes ? `<div class="detail-section"><h3>Notes</h3><p>${escapeHtml(order.notes)}</p></div>` : ""}
      <button type="button" class="btn-primary" style="width:100%" id="detail-edit" data-id="${order.id}">Edit order</button>
    </div>`;

  const overlay = $("#detail-overlay");
  overlay.hidden = false;
  $("#detail-close").onclick = closeDetail;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDetail();
  };
  $("#detail-edit").onclick = () => {
    closeDetail();
    openOrderForm(order.id);
  };
}

function closeDetail() {
  $("#detail-overlay").hidden = true;
}

function openOrderForm(orderId = null) {
  editingOrderId = orderId;
  const order = orderId ? orders.find((o) => o.id === orderId) : null;
  $("#form-title").textContent = order ? "Edit order" : "New order";
  $("#order-form").innerHTML = buildFormHtml(order);
  $("#form-overlay").hidden = false;

  $("#form-close").onclick = closeForm;
  $("#form-overlay").onclick = (e) => {
    if (e.target === $("#form-overlay")) closeForm();
  };

  $("#order-form").onsubmit = (e) => {
    e.preventDefault();
    submitOrderForm();
  };

  $("#btn-add-slot")?.addEventListener("click", addSlotRow);
  $("#btn-add-crew")?.addEventListener("click", addCrewRow);
  $("#btn-sync-crew-payouts")?.addEventListener("click", autoAddMissingCrewPayouts);
  bindCrewFieldListeners();
  bindAllCrewPayoutRows();
  syncCrewPayoutSelects();

  $("#order-form").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-slot")) {
      const rows = $$(".slot-block", $("#order-form"));
      if (rows.length > 1) e.target.closest(".slot-block").remove();
      updateFormExpenseTotals();
    }
    if (e.target.classList.contains("btn-remove-crew")) {
      const rows = $$(".crew-row", $("#order-form"));
      if (rows.length > 1) e.target.closest(".crew-row").remove();
      updateFormExpenseTotals();
    }
  });

  $("#order-form").addEventListener("input", (e) => {
    if (e.target.matches('[name^="exp_"]') || e.target.matches('[name="crewPayout"]')) {
      updateFormExpenseTotals();
    }
    if (e.target.matches('[name^="pay"]') || e.target.name === "totalPackage") {
      updatePaymentBalance();
    }
  });

  $("#form-start")?.addEventListener("change", syncEndDateFromStart);
  $("#form-cancel")?.addEventListener("click", closeForm);
  updateFormExpenseTotals();
  updatePaymentBalance();
}

function closeForm() {
  $("#form-overlay").hidden = true;
  editingOrderId = null;
}

function syncEndDateFromStart() {
  const start = $("#form-start");
  const end = $("#form-end");
  if (start && end && (!end.value || end.value < start.value)) end.value = start.value;
}

function buildFormHtml(order) {
  const o = order ? normalizeOrder(order) : null;
  const slots = o?.scheduleTimes?.length
    ? o.scheduleTimes
    : [{ date: "", startTime: "09:00", endTime: "18:00", label: "" }];
  const roster = o ? getCrewRoster(o) : [];
  const crewPayouts = o?.crewPayouts?.length
    ? o.crewPayouts
    : [{ crewKey: "", name: "", role: "", payout: 0, paid: false, paymentDate: "" }];
  const exp = o?.expenseBreakdown || defaultExpenseBreakdown();
  const p = o?.payments || defaultPayments();
  const d = o?.deliverables || defaultDeliverables();
  const svc = o?.services || defaultServices();

  const statusOpts = ORDER_STATUSES.map(
    (s) => `<option value="${s.id}" ${o?.status === s.id ? "selected" : ""}>${escapeHtml(s.label)}</option>`
  ).join("");
  const typeOpts = EVENT_TYPES.map(
    (t) => `<option value="${t.id}" ${o?.eventType === t.id ? "selected" : ""}>${escapeHtml(t.label)}</option>`
  ).join("");

  const crewFields = CREW_SLOTS.map(({ field, label }) => `
    <div class="form-group">
      <label>${escapeHtml(label)}</label>
      <input class="crew-roster-input" name="${field}" value="${o ? escapeAttr((o[field] || []).join(", ")) : ""}" placeholder="Names, comma-separated" />
    </div>`).join("");

  const expenseFields = EXPENSE_FIELDS.map(
    (f) => `
    <div class="form-group">
      <label>${escapeHtml(f.label)}</label>
      <input type="number" name="exp_${f.key}" min="0" step="1" value="${exp[f.key] || 0}" />
    </div>`
  ).join("");

  const deliverableChecks = DELIVERABLE_KEYS.map(
    (k) => `
    <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:0.35rem;cursor:pointer">
      <input type="checkbox" name="del_${k.key}" ${d[k.key] ? "checked" : ""} />
      ${escapeHtml(k.label)}
    </label>`
  ).join("");

  return `
    <div class="form-section">
      <h3 class="form-section-title">Customer Details</h3>
      <div class="form-group">
        <label>Customer / couple name</label>
        <input name="customerName" required value="${o ? escapeAttr(o.customerName) : ""}" placeholder="Priya & Arun" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bride name</label>
          <input name="brideName" value="${o ? escapeAttr(o.brideName) : ""}" />
        </div>
        <div class="form-group">
          <label>Groom name</label>
          <input name="groomName" value="${o ? escapeAttr(o.groomName) : ""}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input name="phone" type="tel" value="${o ? escapeAttr(o.phone) : ""}" />
        </div>
        <div class="form-group">
          <label>WhatsApp</label>
          <input name="whatsapp" type="tel" value="${o ? escapeAttr(o.whatsapp) : ""}" />
        </div>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input name="email" type="email" value="${o ? escapeAttr(o.email) : ""}" />
      </div>
      <div class="form-group">
        <label>Address</label>
        <textarea name="address" rows="2">${o ? escapeHtml(o.address) : ""}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Event type</label>
          <select name="eventType">${typeOpts}</select>
        </div>
        <div class="form-group">
          <label>Workflow status</label>
          <select name="status">${statusOpts}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>City</label>
          <input name="city" value="${o ? escapeAttr(o.city) : ""}" placeholder="Erode" />
        </div>
        <div class="form-group">
          <label>Venue</label>
          <input name="venue" value="${o ? escapeAttr(o.venue) : ""}" />
        </div>
      </div>
      <div class="form-group">
        <label>Map link</label>
        <input name="mapLink" type="url" value="${o ? escapeAttr(o.mapLink) : ""}" placeholder="https://maps.google.com/…" />
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Event Schedule</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Start date</label>
          <input type="date" name="startDate" required value="${o?.startDate || ""}" id="form-start" />
        </div>
        <div class="form-group">
          <label>End date</label>
          <input type="date" name="endDate" required value="${o?.endDate || ""}" id="form-end" />
        </div>
      </div>
      <div class="form-group">
        <label>Number of days</label>
        <input type="number" name="numberOfDays" min="1" value="${o?.numberOfDays ?? 1}" />
      </div>
      <div class="form-group">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label>Schedule times (per day)</label>
          <button type="button" class="text-link" id="btn-add-slot">+ Add slot</button>
        </div>
        <div id="slots-container">${slots.map((s) => slotRowHtml(s)).join("")}</div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Crew Assignment</h3>
      <div class="expense-grid">${crewFields}</div>
      <div class="form-group">
        <label>Drone operator / notes</label>
        <input name="drone" value="${o ? escapeAttr(o.drone) : ""}" placeholder="Operator & model, or Not included" />
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Crew Payout</h3>
      <p class="form-section-desc">Link payouts to crew above; mark paid/unpaid and payment date</p>
      <div id="crew-container">${crewPayouts.map((p) => crewRowHtml(p, roster)).join("")}</div>
      <button type="button" class="text-link" id="btn-add-crew">+ Add crew payout</button>
      <button type="button" class="text-link" id="btn-sync-crew-payouts" style="margin-left:0.75rem">Auto-add missing crew</button>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Services &amp; Production</h3>
      <div class="form-row">
        <div class="form-group">
          <label>LED wall size</label>
          <input name="ledWallSize" value="${o ? escapeAttr(o.ledWallSize) : ""}" placeholder="20×10 ft" />
        </div>
        <div class="form-group">
          <label>Album count</label>
          <input type="number" name="albumCount" min="0" value="${o?.albumCount ?? 0}" />
        </div>
      </div>
      <div class="form-group">
        <label>Album size</label>
        <input name="albumSize" value="${o ? escapeAttr(o.albumSize) : ""}" placeholder="12×36, 10×30…" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.35rem 1rem;margin-bottom:0.75rem">
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem"><input type="checkbox" name="svc_drone" ${svc.droneIncluded ? "checked" : ""} /> Drone included</label>
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem"><input type="checkbox" name="svc_teaser" ${svc.teaserIncluded ? "checked" : ""} /> Teaser included</label>
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem"><input type="checkbox" name="svc_cinematic" ${svc.cinematicFilmIncluded ? "checked" : ""} /> Cinematic film</label>
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem"><input type="checkbox" name="svc_traditional" ${svc.traditionalVideoIncluded ? "checked" : ""} /> Traditional video</label>
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem"><input type="checkbox" name="svc_harddisk" ${svc.hardDiskIncluded ? "checked" : ""} /> Hard disk included</label>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Expense Breakdown</h3>
      <div class="expense-grid">${expenseFields}</div>
      <div class="expense-total-bar" id="form-expense-summary">
        <span>Operating: <strong id="sum-operating">₹0</strong></span>
        <span>Crew payouts: <strong id="sum-crew">₹0</strong></span>
        <span>Total: <strong id="sum-grand">₹0</strong></span>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Payment Tracking</h3>
      <div class="form-group">
        <label>Total package (₹)</label>
        <input type="number" name="totalPackage" min="0" value="${p.totalPackage || o?.budget || 0}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Advance paid</label>
          <input type="number" name="payAdvance" min="0" value="${p.advancePaid || 0}" />
        </div>
        <div class="form-group">
          <label>Second payment</label>
          <input type="number" name="paySecond" min="0" value="${p.secondPayment || 0}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Final payment</label>
          <input type="number" name="payFinal" min="0" value="${p.finalPayment || 0}" />
        </div>
        <div class="form-group">
          <label>Balance (auto)</label>
          <input type="number" name="payBalance" readonly id="pay-balance" value="${getBalance(o || { payments: p, budget: p.totalPackage })}" style="background:var(--cream)" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Due date</label>
          <input type="date" name="payDueDate" value="${p.dueDate || ""}" />
        </div>
        <div class="form-group">
          <label>Payment mode</label>
          <input name="payMode" value="${o ? escapeAttr(p.paymentMode) : ""}" placeholder="UPI, Cash, Bank…" />
        </div>
      </div>
      <div class="form-group">
        <label>Payment notes</label>
        <textarea name="payNotes" rows="2">${o ? escapeHtml(p.notes) : ""}</textarea>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Deliverables</h3>
      <div>${deliverableChecks}</div>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label>Booking notes</label>
        <textarea name="notes" rows="3" placeholder="Venue, special requests…">${o?.notes ? escapeHtml(o.notes) : ""}</textarea>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-primary">${o ? "Save changes" : "Add order"}</button>
      <button type="button" class="btn-secondary" id="form-cancel">Cancel</button>
    </div>`;
}

function slotRowHtml(s) {
  return `
    <div class="slot-block">
      <div class="form-row">
        <input type="date" name="slotDate" value="${s.date || ""}" />
        <input type="text" name="slotLabel" placeholder="Label (e.g. Wedding)" value="${escapeAttr(s.label || "")}" />
      </div>
      <div class="form-row">
        <input type="time" name="slotStart" value="${s.startTime || "09:00"}" />
        <div style="display:flex;gap:0.5rem">
          <input type="time" name="slotEnd" value="${s.endTime || "18:00"}" style="flex:1" />
          <button type="button" class="btn-icon btn-remove-slot">✕</button>
        </div>
      </div>
    </div>`;
}

function crewLinkSelectHtml(roster, selectedKey) {
  const opts = roster
    .map(
      (r) =>
        `<option value="${escapeAttr(r.crewKey)}" ${selectedKey === r.crewKey ? "selected" : ""}>${escapeHtml(r.roleLabel)} — ${escapeHtml(r.name)}</option>`
    )
    .join("");
  return `
    <option value="">Select crew member…</option>
    ${opts}
    <option value="other" ${selectedKey === "other" ? "selected" : ""}>Other (helper, driver…)</option>`;
}

function crewRowHtml(l, roster = []) {
  const key = l.crewKey || "";
  const isOther = key === "other" || (!key && (l.name || l.role));
  const selectedKey = key || (isOther ? "other" : "");
  const showOther = selectedKey === "other";

  return `
    <div class="crew-row" data-crew-row>
      <div class="form-group crew-link-wrap" style="margin:0;grid-column:1/-2">
        <label>Crew member</label>
        <select name="crewLink" class="crew-link-select">${crewLinkSelectHtml(roster, selectedKey)}</select>
      </div>
      <div class="form-group crew-payout-wrap" style="margin:0">
        <label>Payout (₹)</label>
        <input type="number" name="crewPayout" min="0" value="${l.payout ?? 0}" />
      </div>
      <button type="button" class="btn-icon btn-remove-crew" title="Remove">✕</button>
      <div class="form-row" style="grid-column:1/-1">
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin:0">
          <input type="checkbox" name="crewPaid" ${l.paid ? "checked" : ""} /> Paid
        </label>
        <div class="form-group" style="margin:0">
          <label>Payment date</label>
          <input type="date" name="crewPaymentDate" value="${escapeAttr(l.paymentDate || "")}" />
        </div>
      </div>
      <div class="crew-other-fields form-row" style="grid-column:1/-1;${showOther ? "" : "display:none"}" data-other-fields>
        <div class="form-group" style="margin:0">
          <label>Name</label>
          <input type="text" name="crewName" value="${escapeAttr(showOther ? l.name || "" : "")}" placeholder="Murugan" />
        </div>
        <div class="form-group" style="margin:0">
          <label>Role</label>
          <input type="text" name="crewRole" value="${escapeAttr(showOther ? l.role || "" : "")}" placeholder="Helper" />
        </div>
      </div>
    </div>`;
}

function addSlotRow() {
  $("#slots-container").insertAdjacentHTML("beforeend", slotRowHtml({}));
}

function addCrewRow() {
  const form = $("#order-form");
  const roster = getCrewRosterFromForm(form);
  $("#crew-container").insertAdjacentHTML("beforeend", crewRowHtml({}, roster));
  const rows = $$(".crew-row", $("#crew-container"));
  bindCrewPayoutRow(rows[rows.length - 1]);
  updateFormExpenseTotals();
}

function getCrewRosterFromForm(form) {
  if (!form) return [];
  const crewData = {};
  CREW_SLOTS.forEach(({ field }) => {
    crewData[field] = parseNames(form[field]?.value || "");
  });
  return getCrewRoster(crewData);
}

function bindCrewPayoutRow(row) {
  if (!row) return;
  const sel = row.querySelector(".crew-link-select");
  if (!sel) return;
  sel.addEventListener("change", () => onCrewLinkChange(sel));
}

function onCrewLinkChange(sel) {
  const row = sel.closest(".crew-row");
  const other = row.querySelector("[data-other-fields]");
  if (sel.value === "other") {
    other.style.display = "";
    return;
  }
  other.style.display = "none";
  const roster = getCrewRosterFromForm($("#order-form"));
  const match = roster.find((r) => r.crewKey === sel.value);
  if (match) {
    row.querySelector('[name="crewName"]').value = match.name;
    row.querySelector('[name="crewRole"]').value = match.roleLabel;
  }
}

function syncCrewPayoutSelects() {
  const form = $("#order-form");
  if (!form) return;
  const roster = getCrewRosterFromForm(form);
  $$(".crew-row", form).forEach((row) => {
    const sel = row.querySelector(".crew-link-select");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = crewLinkSelectHtml(roster, current);
    onCrewLinkChange(sel);
  });
}

function autoAddMissingCrewPayouts() {
  const form = $("#order-form");
  const roster = getCrewRosterFromForm(form);
  const existing = new Set(
    $$(".crew-link-select", form)
      .map((s) => s.value)
      .filter((v) => v && v !== "other")
  );
  roster.forEach((r) => {
    if (existing.has(r.crewKey)) return;
    $("#crew-container").insertAdjacentHTML(
      "beforeend",
      crewRowHtml({ crewKey: r.crewKey, name: r.name, role: r.roleLabel, payout: 0 }, roster)
    );
    const rows = $$(".crew-row", $("#crew-container"));
    bindCrewPayoutRow(rows[rows.length - 1]);
  });
  syncCrewPayoutSelects();
  updateFormExpenseTotals();
}

function bindCrewFieldListeners() {
  const form = $("#order-form");
  if (!form) return;
  $$(".crew-roster-input", form).forEach((input) => {
    input.addEventListener("input", syncCrewPayoutSelects);
  });
  CREW_SLOTS.forEach(({ field }) => {
    const el = form[field];
    if (el) el.addEventListener("input", syncCrewPayoutSelects);
  });
}

function bindAllCrewPayoutRows() {
  $$(".crew-row", $("#order-form")).forEach(bindCrewPayoutRow);
}

function updateFormExpenseTotals() {
  const form = $("#order-form");
  if (!form) return;
  let operating = 0;
  EXPENSE_FIELDS.forEach((f) => {
    const el = form[`exp_${f.key}`];
    if (el) operating += Number(el.value) || 0;
  });
  let crew = 0;
  $$(".crew-row", form).forEach((row) => {
    const p = row.querySelector('[name="crewPayout"]');
    if (p) crew += Number(p.value) || 0;
  });
  const set = (id, val) => {
    const el = $(id);
    if (el) el.textContent = formatCurrency(val);
  };
  set("#sum-operating", operating);
  set("#sum-crew", crew);
  set("#sum-grand", operating + crew);
}

function updatePaymentBalance() {
  const form = $("#order-form");
  if (!form) return;
  const total = Number(form.totalPackage?.value) || 0;
  const advance = Number(form.payAdvance?.value) || 0;
  const second = Number(form.paySecond?.value) || 0;
  const final = Number(form.payFinal?.value) || 0;
  const balance = total - advance - second - final;
  const el = $("#pay-balance");
  if (el) el.value = balance;
}

function submitOrderForm() {
  const form = $("#order-form");
  const customerName = form.customerName.value.trim();
  const startDate = form.startDate.value;
  let endDate = form.endDate.value || startDate;
  if (endDate < startDate) endDate = startDate;

  const slotBlocks = $$(".slot-block", form);
  const scheduleTimes = [];
  slotBlocks.forEach((block) => {
    const date = block.querySelector('[name="slotDate"]').value;
    if (!date) return;
    scheduleTimes.push({
      date,
      startTime: block.querySelector('[name="slotStart"]').value,
      endTime: block.querySelector('[name="slotEnd"]').value,
      label: block.querySelector('[name="slotLabel"]').value.trim() || undefined,
    });
  });

  const expenseBreakdown = {};
  EXPENSE_FIELDS.forEach((f) => {
    const el = form[`exp_${f.key}`];
    expenseBreakdown[f.key] = el ? Number(el.value) || 0 : 0;
  });

  const crewData = {};
  CREW_SLOTS.forEach(({ field }) => {
    crewData[field] = parseNames(form[field]?.value || "");
  });
  const roster = getCrewRoster(crewData);

  const crewPayouts = [];
  $$(".crew-row", form).forEach((row) => {
    const crewKey = row.querySelector('[name="crewLink"]')?.value || "";
    const payout = Number(row.querySelector('[name="crewPayout"]')?.value) || 0;
    const name = row.querySelector('[name="crewName"]')?.value.trim() || "";
    const role = row.querySelector('[name="crewRole"]')?.value.trim() || "";
    const paid = row.querySelector('[name="crewPaid"]')?.checked || false;
    const paymentDate = row.querySelector('[name="crewPaymentDate"]')?.value || "";
    if (!crewKey && !name && !payout) return;
    crewPayouts.push(
      normalizeCrewPayout({ crewKey: crewKey || "other", name, role, payout, paid, paymentDate }, roster)
    );
  });

  const deliverables = {};
  DELIVERABLE_KEYS.forEach((k) => {
    deliverables[k.key] = !!form[`del_${k.key}`]?.checked;
  });

  const totalPackage = Number(form.totalPackage?.value) || 0;
  const advancePaid = Number(form.payAdvance?.value) || 0;
  const secondPayment = Number(form.paySecond?.value) || 0;
  const finalPayment = Number(form.payFinal?.value) || 0;
  const payments = {
    totalPackage,
    advancePaid,
    secondPayment,
    finalPayment,
    balanceAmount: totalPackage - advancePaid - secondPayment - finalPayment,
    dueDate: form.payDueDate?.value || "",
    paymentMode: form.payMode?.value.trim() || "",
    notes: form.payNotes?.value.trim() || "",
  };

  const payload = normalizeOrder({
    customerName,
    customer: {
      customerName,
      brideName: form.brideName.value.trim(),
      groomName: form.groomName.value.trim(),
      phone: form.phone.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      email: form.email.value.trim(),
      address: form.address.value.trim(),
    },
    eventType: form.eventType.value,
    status: form.status.value,
    city: form.city.value.trim(),
    venue: form.venue.value.trim(),
    mapLink: form.mapLink.value.trim(),
    startDate,
    endDate,
    numberOfDays: Number(form.numberOfDays?.value) || getEventDaysFromDates(startDate, endDate),
    scheduleTimes,
    ...crewData,
    drone: form.drone.value.trim(),
    albumCount: Number(form.albumCount.value) || 0,
    albumSize: form.albumSize.value.trim(),
    ledWallSize: form.ledWallSize.value.trim(),
    services: {
      droneIncluded: !!form.svc_drone?.checked,
      teaserIncluded: !!form.svc_teaser?.checked,
      cinematicFilmIncluded: !!form.svc_cinematic?.checked,
      traditionalVideoIncluded: !!form.svc_traditional?.checked,
      hardDiskIncluded: !!form.svc_harddisk?.checked,
    },
    crewPayouts,
    expenseBreakdown,
    payments,
    deliverables,
    budget: totalPackage,
    notes: form.notes.value.trim() || undefined,
  });

  if (editingOrderId) {
    const idx = orders.findIndex((o) => o.id === editingOrderId);
    if (idx >= 0) orders[idx] = { ...payload, id: editingOrderId };
  } else {
    orders.push({ ...payload, id: createId("ord") });
  }

  saveAppData({
    history: {
      action: editingOrderId ? "edit" : "add",
      label: editingOrderId
        ? `Updated booking: ${customerName}`
        : `Added booking: ${customerName}`,
    },
  });
  closeForm();
  render();
}
