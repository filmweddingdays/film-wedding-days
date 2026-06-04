/* Customer profile page — hash #/customer?id= */

function getCustomerIdFromHash() {
  const hash = location.hash.slice(1) || "/";
  if (!hash.startsWith("/customer")) return null;
  const q = hash.indexOf("?");
  if (q < 0) return viewingCustomerId || null;
  const params = new URLSearchParams(hash.slice(q + 1));
  return params.get("id") || viewingCustomerId || null;
}

function renderCustomerProfile() {
  const id = getCustomerIdFromHash();
  viewingCustomerId = id;

  if (!id) {
    return `
      <div class="page-header">
        <h1>Customer profile</h1>
        <p class="meta">No customer selected</p>
      </div>
      <div class="empty-state card"><a href="#/orders" class="link-gold">Browse orders →</a></div>`;
  }

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return `
      <div class="page-header">
        <h1>Customer profile</h1>
        <p class="meta">Booking not found</p>
      </div>
      <div class="empty-state card"><a href="#/orders" class="link-gold">Back to orders →</a></div>`;
  }

  const p = order.payments || defaultPayments();
  const profit = getProfit(order);
  const svc = order.services || defaultServices();
  const d = order.deliverables || defaultDeliverables();

  const scheduleHtml =
    order.scheduleTimes.length === 0
      ? "<p class='meta'>No schedule slots</p>"
      : order.scheduleTimes
          .map((s) => {
            const dt = parseDate(s.date);
            return `<div class="slot-item">
            <strong>${formatDate(dt, { weekday: "short", day: "numeric", month: "short" })}${s.label ? ` — ${escapeHtml(s.label)}` : ""}</strong><br>
            ${s.startTime} – ${s.endTime}
          </div>`;
          })
          .join("");

  const crewHtml = CREW_SLOTS.map(({ field, label }) => {
    const names = order[field] || [];
    if (!names.length) return "";
    return `<div style="margin-bottom:0.75rem"><p class="meta" style="margin-bottom:0.25rem;font-size:0.75rem">${escapeHtml(label)}</p>${renderChips(names)}</div>`;
  }).join("");

  const deliverableHtml = DELIVERABLE_KEYS.map((k) => {
    const done = d[k.key];
    return `<li style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;margin-bottom:0.35rem">
      <span style="color:${done ? "var(--green)" : "var(--warm)"}">${done ? "✓" : "○"}</span>
      ${escapeHtml(k.label)}
    </li>`;
  }).join("");

  const waPhone = order.whatsapp || order.phone;
  const waText = `Hi ${order.customerName}, this is Film Wedding Days regarding your ${order.eventType} on ${formatDateRange(order)}.`;

  return `
    <style>
      .profile-grid { display:grid;grid-template-columns:1fr;gap:1rem; }
      @media (min-width: 768px) { .profile-grid { grid-template-columns:1fr 1fr; } }
    </style>
    <div class="page-header">
      <div>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.5rem">
          ${eventTypeBadge(order.eventType)}
          ${statusBadge(order.status)}
        </div>
        <h1>${escapeHtml(order.customerName)}</h1>
        <p class="meta">${formatDateRange(order)} · ${escapeHtml(order.city || "")}${order.venue ? ` · ${escapeHtml(order.venue)}` : ""}</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        <a href="${whatsappLink(waPhone, waText)}" target="_blank" rel="noopener" class="btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem">WhatsApp</a>
        <button type="button" class="btn-secondary" id="profile-edit-order" data-id="${order.id}">Edit booking</button>
        <a href="#/orders" class="btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">← Orders</a>
      </div>
    </div>

    <div class="profile-grid">
      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Contact details</h2></div>
        <div style="padding:1rem 1.25rem">
          <dl class="booking-services">
            <div><dt>Bride</dt><dd>${escapeHtml(order.brideName || "—")}</dd></div>
            <div><dt>Groom</dt><dd>${escapeHtml(order.groomName || "—")}</dd></div>
            <div><dt>Phone</dt><dd>${escapeHtml(order.phone || "—")}</dd></div>
            <div><dt>WhatsApp</dt><dd>${escapeHtml(order.whatsapp || "—")}</dd></div>
            <div><dt>Email</dt><dd>${escapeHtml(order.email || "—")}</dd></div>
            <div><dt>Address</dt><dd>${escapeHtml(order.address || "—")}</dd></div>
          </dl>
          ${order.mapLink ? `<a href="${escapeAttr(order.mapLink)}" target="_blank" rel="noopener" class="link-gold" style="font-size:0.85rem">Open venue map →</a>` : ""}
        </div>
      </div>

      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Event schedule</h2></div>
        <div style="padding:1rem 1.25rem">${scheduleHtml}</div>
      </div>

      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Crew assigned</h2></div>
        <div style="padding:1rem 1.25rem">${crewHtml || "<p class='meta'>No crew assigned</p>"}</div>
      </div>

      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Services</h2></div>
        <div style="padding:1rem 1.25rem">
          <dl class="booking-services">
            <div><dt>Albums</dt><dd>${order.albumCount || 0}${order.albumSize ? ` (${escapeHtml(order.albumSize)})` : ""}</dd></div>
            <div><dt>LED wall</dt><dd>${escapeHtml(order.ledWallSize || "—")}</dd></div>
            <div><dt>Drone</dt><dd>${escapeHtml(order.drone || "—")}</dd></div>
            <div><dt>Teaser</dt><dd>${svc.teaserIncluded ? "Yes" : "No"}</dd></div>
            <div><dt>Cinematic film</dt><dd>${svc.cinematicFilmIncluded ? "Yes" : "No"}</dd></div>
            <div><dt>Hard disk</dt><dd>${svc.hardDiskIncluded ? "Yes" : "No"}</dd></div>
          </dl>
        </div>
      </div>

      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Payments</h2></div>
        <div style="padding:1rem 1.25rem">
          <dl class="finance-grid">
            <div class="finance-box"><dt>Package</dt><dd>${formatCurrency(p.totalPackage)}</dd></div>
            <div class="finance-box"><dt>Advance</dt><dd>${formatCurrency(p.advancePaid)}</dd></div>
            <div class="finance-box"><dt>Second</dt><dd>${formatCurrency(p.secondPayment)}</dd></div>
            <div class="finance-box"><dt>Final</dt><dd>${formatCurrency(p.finalPayment)}</dd></div>
            <div class="finance-box wide"><dt>Balance</dt><dd class="${getBalance(order) > 0 ? "profit-neg" : "profit-pos"}">${formatCurrency(getBalance(order))}</dd></div>
          </dl>
          ${p.dueDate ? `<p class="meta" style="margin-top:0.5rem">Due: ${escapeHtml(p.dueDate)} · ${escapeHtml(p.paymentMode || "")}</p>` : ""}
        </div>
      </div>

      <div class="card section-card" style="margin:0">
        <div class="section-card-header"><h2>Finances</h2></div>
        <div style="padding:1rem 1.25rem">
          <dl class="finance-grid">
            <div class="finance-box"><dt>Revenue</dt><dd>${formatCurrency(p.totalPackage || order.budget)}</dd></div>
            <div class="finance-box"><dt>Expenses</dt><dd>${formatCurrency(getTotalExpenses(order))}</dd></div>
            <div class="finance-box wide"><dt>Profit (${getProfitPct(order)}%)</dt><dd class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</dd></div>
          </dl>
        </div>
      </div>

      <div class="card section-card" style="margin:0;grid-column:1/-1">
        <div class="section-card-header"><h2>Deliverables (${getDeliverableProgress(order)}%)</h2></div>
        <div style="padding:1rem 1.25rem">
          <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0.25rem">${deliverableHtml}</ul>
        </div>
      </div>

      ${order.notes ? `
      <div class="card section-card" style="margin:0;grid-column:1/-1">
        <div class="section-card-header"><h2>Notes</h2></div>
        <div style="padding:1rem 1.25rem"><p style="margin:0">${escapeHtml(order.notes)}</p></div>
      </div>` : ""}
    </div>`;
}

function bindCustomerEvents() {
  $("#profile-edit-order")?.addEventListener("click", (e) => {
    openOrderForm(e.target.dataset.id);
  });
}
