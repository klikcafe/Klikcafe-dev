/**
 * kc-menu.js
 *
 * Handles the KlikCafe menu:
 * - Loads menu JSON from local file
 * - Builds hierarchical structure
 * - Renders up to 3 menu levels dynamically
 * - Displays menu items in #items div
 * - Highlights the currently clicked button (black background)
 */

// ---------- Global Variables ----------
let menuData = []; // Raw JSON data
let hierarchy = {}; // Nested object for menu levels
const active = { g: null, h: null, s: null }; // Currently active menu buttons

// ---------- Helpers ----------
function formatSizePrice(sizePriceArr = []) {
  const valid = Array.isArray(sizePriceArr)
    ? sizePriceArr.filter(
        (sp) => sp && sp.size && sp.size !== "EMPTY" && sp.price !== "EMPTY"
      )
    : [];
  if (!valid.length) return "";
  if (valid.length === 1 && valid[0].size === "Regular") {
    const p = Number(valid[0].price);
    return ` (£${p.toFixed(p % 1 === 0 ? 0 : 2)})`;
  }
  return (
    "(" +
    valid
      .map(
        (sp) =>
          `${sp.size} £${Number(sp.price).toFixed(sp.price % 1 === 0 ? 0 : 2)}`
      )
      .join(", ") +
    ")"
  );
}

function renderItem(item) {
  if (!item || typeof item !== "object") return String(item ?? "");
  const name = item.name ?? "";
  const desc =
    item.description && item.description !== "EMPTY"
      ? ` – ${item.description}`
      : "";
  const priceStr = item.sizePrice ? formatSizePrice(item.sizePrice) : "";
  return `${name}${desc}${priceStr}`;
}

// Render array of items into #items div
function renderArrayOfItems(arr) {
  const itemsDiv = document.getElementById("items");
  itemsDiv.innerHTML = "";
  arr.forEach((item) => {
    const d = document.createElement("div");
    d.textContent = renderItem(item);
    itemsDiv.appendChild(d);
  });
}

// ---------- Show Items ----------
function showItemsDirect(obj) {
  const itemsDiv = document.getElementById("items");
  itemsDiv.innerHTML = "";

  if (!obj) return;

  // Direct array
  if (Array.isArray(obj)) {
    renderArrayOfItems(obj);
    return;
  }

  // Object with _items array
  if (Array.isArray(obj._items)) {
    renderArrayOfItems(obj._items);
    return;
  }

  // One level down arrays
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) renderArrayOfItems(val);
    else if (val && typeof val === "object" && Array.isArray(val._items))
      renderArrayOfItems(val._items);
  }
}

// ---------- Highlight ----------
function highlight(button) {
  // Remove active class from all buttons
  document
    .querySelectorAll(".level button.active")
    .forEach((b) => b.classList.remove("active"));
  // Add active class to clicked button
  if (button) button.classList.add("active");
}

// ---------- Render Levels ----------
function renderLevel0() {
  const l0 = document.getElementById("level0");
  l0.innerHTML = "";

  const groups = Object.keys(hierarchy);
  groups.forEach((g, i) => {
    const b = document.createElement("button");
    b.textContent = g;
    b.onclick = () => {
      active.g = g;
      active.h = null;
      active.s = null;
      highlight(b);
      renderLevel1();
    };
    l0.appendChild(b);
    if (i === 0) {
      active.g = g;
      highlight(b);
      renderLevel1();
    }
  });
}

function renderLevel1() {
  const l1 = document.getElementById("level1");
  const l2 = document.getElementById("level2");
  l1.innerHTML = "";
  l2.style.display = "none";
  document.getElementById("items").innerHTML = "";

  const groupObj = hierarchy[active.g];
  if (!groupObj) return;

  const keys = Object.keys(groupObj).filter(
    (k) => k !== "_items" && k !== "EMPTY"
  );
  if (!keys.length) {
    l1.style.display = "none";
    showItemsDirect(groupObj._items ?? groupObj);
    return;
  }

  l1.style.display = "flex";
  keys.forEach((h, i) => {
    const b = document.createElement("button");
    b.textContent = h;
    b.onclick = () => {
      active.h = h;
      active.s = null;
      highlight(b);
      renderLevel2();
    };
    l1.appendChild(b);
    if (i === 0) {
      active.h = h;
      highlight(b);
      renderLevel2();
    }
  });

  if (Array.isArray(groupObj._items)) showItemsDirect(groupObj._items);
}

function renderLevel2() {
  const l2 = document.getElementById("level2");
  const itemsDiv = document.getElementById("items");
  l2.innerHTML = "";
  itemsDiv.innerHTML = "";

  const headingObj = hierarchy[active.g]?.[active.h];
  if (!headingObj) return;

  const keys = Object.keys(headingObj).filter(
    (k) => k !== "_items" && k !== "EMPTY"
  );
  if (!keys.length) {
    l2.style.display = "none";
    showItemsDirect(headingObj._items ?? headingObj);
    return;
  }

  l2.style.display = "flex";
  keys.forEach((s, i) => {
    const b = document.createElement("button");
    b.textContent = s;
    b.onclick = () => {
      active.s = s;
      highlight(b);
      showItemsDirect(headingObj[s]);
    };
    l2.appendChild(b);
    if (i === 0) {
      active.s = s;
      highlight(b);
      showItemsDirect(headingObj[s]);
    }
  });

  if (Array.isArray(headingObj._items)) showItemsDirect(headingObj._items);
}

// ---------- Load JSON and Build Hierarchy ----------
alert("I am an alert box!");
fetch("../../../json/menuWentworth.json")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then((data) => {
    menuData = data;
    data.forEach((item) => {
      const g = item.menuLevel1,
        h = item.menuLevel2,
        s = item.menuLevel3;
      if (!g || g === "EMPTY") return;
      hierarchy[g] ??= {};
      if (h && h !== "EMPTY") {
        hierarchy[g][h] ??= {};
        if (s && s !== "EMPTY") (hierarchy[g][h][s] ??= []).push(item);
        else (hierarchy[g][h]._items ??= []).push(item);
      } else {
        (hierarchy[g]._items ??= []).push(item);
      }
    });
    renderLevel0();
  })
  .catch((err) => console.error("Error loading local menu JSON:", err));
