/* 
  kc-menu.js
  ----------------------
  Dynamic multi-level menu renderer
  - Only the current clicked button is highlighted
  - Highlight style: black background, white text
  - Supports up to 3 menu levels
  - Works with arrays of items or nested objects
*/

let menuData = [];
let hierarchy = {};
const active = { g: null, h: null, s: null };

// ---------- Helper: Format sizes & prices ----------
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
    " (" +
    valid
      .map(
        (sp) =>
          `${sp.size} £${Number(sp.price).toFixed(sp.price % 1 === 0 ? 0 : 2)}`
      )
      .join(", ") +
    ")"
  );
}

// ---------- Helper: Render individual menu item ----------
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

// ---------- Render items into #items div ----------
function renderArrayOfItems(arr) {
  const itemsDiv = document.getElementById("items");
  arr.forEach((item) => {
    const d = document.createElement("div");
    d.textContent = renderItem(item);
    itemsDiv.appendChild(d);
  });
}

// ---------- Show items robustly ----------
function showItemsDirect(obj) {
  const itemsDiv = document.getElementById("items");
  itemsDiv.innerHTML = "";

  if (!obj) return;

  if (Array.isArray(obj)) return renderArrayOfItems(obj);
  if (Array.isArray(obj._items)) return renderArrayOfItems(obj._items);

  // Look one level down for arrays
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) renderArrayOfItems(val);
    else if (val && typeof val === "object" && Array.isArray(val._items))
      renderArrayOfItems(val._items);
  }
}

// ---------- Highlight only the current clicked button ----------
function highlight(clickedButton) {
  // Remove previous current highlights from all levels
  document
    .querySelectorAll(".level button.current")
    .forEach((b) => b.classList.remove("current"));

  // Add .current to the clicked button
  if (clickedButton) clickedButton.classList.add("current");
}

// ---------- Render Level 0 ----------
function renderLevel0() {
  const l0 = document.getElementById("level0");
  l0.innerHTML = "";

  Object.keys(hierarchy).forEach((g, i) => {
    const b = document.createElement("button");
    b.textContent = g;
    b.onclick = () => {
      active.g = g;
      active.h = null;
      active.s = null;
      renderLevel1();
      highlight(b);
    };
    l0.appendChild(b);

    // Default first button
    if (i === 0) {
      active.g = g;
      renderLevel1();
      highlight(b);
    }
  });
}

// ---------- Render Level 1 ----------
function renderLevel1() {
  const l1 = document.getElementById("level1");
  const l2 = document.getElementById("level2");
  const itemsDiv = document.getElementById("items");

  l1.innerHTML = "";
  l2.style.display = "none";
  itemsDiv.innerHTML = "";

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
      renderLevel2();
      highlight(b);
    };
    l1.appendChild(b);

    if (i === 0) {
      active.h = h;
      renderLevel2();
      highlight(b);
    }
  });

  if (Array.isArray(groupObj._items)) showItemsDirect(groupObj._items);
}

// ---------- Render Level 2 ----------
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
      showItemsDirect(headingObj[s]);
      highlight(b);
    };
    l2.appendChild(b);

    if (i === 0) {
      active.s = s;
      showItemsDirect(headingObj[s]);
      highlight(b);
    }
  });

  if (Array.isArray(headingObj._items)) showItemsDirect(headingObj._items);
}
fetch("https://klikcafe.net/_functions/menu")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then((data) => {
    console.log("Menu data from Wix:", data);
    // Rebuild hierarchy and render menu
    menuData = data;
    buildHierarchy(menuData); // your existing function
    renderLevel0();
  })
  .catch((err) => console.error("Error loading menu from Wix:", err));
