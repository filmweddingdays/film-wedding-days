/* Utilities */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function createId(prefix = "ord") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseDate(iso) {
  if (!iso) return new Date(NaN);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(d, opts = {}) {
  return d.toLocaleDateString("en-IN", opts);
}

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function parseNames(str) {
  return String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function statusBadge(status) {
  const meta = getStatusMeta(status);
  return `<span class="badge" style="--badge:${meta.color}">${escapeHtml(meta.label)}</span>`;
}

function eventTypeBadge(type) {
  const meta = getEventTypeMeta(type);
  return `<span class="badge badge-outline" style="--badge:${meta.color}">${escapeHtml(meta.label)}</span>`;
}

function whatsappLink(phone, text) {
  const p = String(phone || "").replace(/\D/g, "");
  if (!p) return "#";
  return `https://wa.me/91${p.slice(-10)}?text=${encodeURIComponent(text || "Hello from Film Wedding Days")}`;
}
