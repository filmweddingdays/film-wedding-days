/* ============================================================
   FILM WEDDING DAYS — FIREBASE SYNC (Realtime Database)
   Stores app state ({orders, leads, team}) in Firebase
   Falls back to localStorage when offline / not configured
   ============================================================ */

let firebaseSaveTimer = null;
let firebaseLastError = null;
let fbDb = null; // Firebase Realtime Database reference

function firebaseReady() {
  return (
    typeof FIREBASE_ENABLED !== "undefined" &&
    FIREBASE_ENABLED === true &&
    typeof FIREBASE_CONFIG === "object" &&
    FIREBASE_CONFIG.projectId &&
    typeof fbDb !== "undefined" &&
    fbDb !== null
  );
}

/* Initialize Firebase Realtime Database */
async function initFirebase() {
  try {
    // Wait for Firebase SDK to load (max 5 seconds)
    let attempts = 0;
    while (typeof firebase === "undefined" && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof firebase === "undefined") {
      console.error("Firebase SDK not loaded");
      return false;
    }

    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    fbDb = firebase.database();
    console.log("✓ Firebase initialized successfully");
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

/* Read data from Firebase */
async function firebaseLoad() {
  try {
    const snapshot = await fbDb.ref("app_data").once("value");
    return snapshot.val();
  } catch (e) {
    throw new Error(`firebase load failed: ${e.message}`);
  }
}

/* Write data to Firebase */
async function firebaseSaveNow(payload) {
  try {
    await fbDb.ref("app_data").set({
      orders: payload.orders,
      leads: payload.leads,
      team: payload.team,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    throw new Error(`firebase save failed: ${e.message}`);
  }
}

/* Debounced Firebase push — called from saveAppData on every change */
function firebasePush(payload) {
  if (!firebaseReady()) return;
  clearTimeout(firebaseSaveTimer);
  firebaseSaveTimer = setTimeout(() => {
    firebaseSaveNow(payload)
      .then(() => {
        firebaseLastError = null;
        setFirebaseStatus("saved");
      })
      .catch((e) => {
        firebaseLastError = e;
        console.error("Firebase save error:", e);
        setFirebaseStatus("error");
      });
  }, 600);
}

/* Footer status text */
function setFirebaseStatus(state) {
  const el = document.querySelector(".site-footer span");
  if (!el) return;
  if (!firebaseReady()) {
    el.textContent = "Data saved in this browser only";
    return;
  }
  if (state === "saving") el.textContent = "Syncing to Firebase…";
  else if (state === "error") el.textContent = "⚠ Firebase sync failed — saved locally";
  else el.textContent = "✓ Synced to Firebase";
}

/* On startup: pull from Firebase (source of truth) */
async function syncWithFirebase() {
  if (!firebaseReady()) {
    console.log("Firebase not ready, using local storage");
    setFirebaseStatus();
    return;
  }
  setFirebaseStatus("saving");
  try {
    const remote = await firebaseLoad();
    const hasRemote =
      remote &&
      ((Array.isArray(remote.orders) && remote.orders.length) ||
        (Array.isArray(remote.leads) && remote.leads.length) ||
        (Array.isArray(remote.team) && remote.team.length));

    if (hasRemote) {
      // Firebase data exists — adopt it
      orders = (remote.orders || []).map(normalizeOrder);
      leads = (remote.leads || []).map(normalizeLead);
      team = (remote.team || []).map(normalizeTeamMember);
      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ orders, leads, team }));
      } catch (e) {}
      if (typeof render === "function") render();
    } else {
      // First time — seed Firebase with local data
      await firebaseSaveNow({ orders, leads, team });
    }
    setFirebaseStatus("saved");
  } catch (e) {
    firebaseLastError = e;
    console.error("Firebase sync error:", e);
    setFirebaseStatus("error");
  }
}
