/* ===== Palitaw Express: all functionality in plain JavaScript ===== */
"use strict";

// ---------- 1. Data ----------
const PRODUCTS = [
  { id: "classic", cat: "classic", name: "Classic Palitaw", img: "imgaes/classic-palitaw.jpg", price: 20, unit: "3 pieces", stock: 40,
    desc: "Soft and chewy traditional Palitaw topped with grated coconut, sugar, and sesame." },
  { id: "ube", cat: "ube", name: "Ube Palitaw", img: "imgaes/ube-palitaw.jpg", price: 25, unit: "3 pieces", stock: 30,
    desc: "A Filipino favorite with a delicious ube flavor combined with soft Palitaw." },
  { id: "cheese", cat: "cheese", name: "Cheese Palitaw", img: "imgaes/cheese-palitaw.jpg", price: 25, unit: "3 pieces", stock: 30,
    desc: "Soft Palitaw with a sweet and creamy cheese topping." },
  { id: "special", cat: "special", name: "Special Palitaw Box", img: "imgaes/special-box.jpg", price: 100, unit: "box", stock: 15,
    desc: "A box containing assorted Palitaw flavors perfect for sharing." }
];
const TOPPINGS = ["Extra Coconut", "Extra Sugar", "Extra Sesame", "Cheese"];
const TOPPING_PRICE = 5;   // pesos per extra topping
const DELIVERY_FEE = 30;   // pesos, flat

// ---------- 2. Helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const peso = n => "₱" + n;
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const find = id => PRODUCTS.find(p => p.id === id);

function toast(msg, isError) {
  const t = document.createElement("div");
  t.className = "toast" + (isError ? " err" : "");
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ---------- 3. Cart state (saved in localStorage) ----------
let cart = [];
try { cart = JSON.parse(localStorage.getItem("palitawCart")) || []; } catch (e) { cart = []; }
if (!Array.isArray(cart)) cart = [];

function saveCart() {
  try { localStorage.setItem("palitawCart", JSON.stringify(cart)); } catch (e) { /* storage blocked: cart still works this session */ }
  renderCart();
}
const unitPrice = it => find(it.id).price + it.toppings.length * TOPPING_PRICE;
const subtotal = () => cart.reduce((s, it) => s + unitPrice(it) * it.qty, 0);
const itemCount = () => cart.reduce((s, it) => s + it.qty, 0);

function addToCart(id, qty, toppings = [], note = "") {
  const key = [id, [...toppings].sort().join(","), note.trim()].join("|");
  const found = cart.find(it => it.key === key);
  if (found) found.qty += qty;
  else cart.push({ key, id, qty, toppings, note: note.trim() });
  saveCart();
  toast(qty + " × " + find(id).name + " added to cart");
  const b = $("#cartBtn");
  b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}

function totalsHTML() {
  const sub = subtotal(), fee = sub ? DELIVERY_FEE : 0;
  return `<p><span>Subtotal</span><span>${peso(sub)}</span></p>
          <p><span>Delivery Fee</span><span>${peso(fee)}</span></p>
          <p class="grand"><span>Total</span><span>${peso(sub + fee)}</span></p>`;
}

function renderCart() {
  $("#cartCount").textContent = itemCount();
  $("#cartItems").innerHTML = cart.length ? cart.map((it, i) => {
    const p = find(it.id);
    return `<div class="item">
      <img src="${p.img}" alt="${esc(p.name)}">
      <div>
        <strong>${esc(p.name)}</strong>
        ${it.toppings.length ? `<small>+ ${esc(it.toppings.join(", "))}</small>` : ""}
        ${it.note ? `<small>Note: ${esc(it.note)}</small>` : ""}
        <div class="price">${peso(unitPrice(it) * it.qty)}</div>
        <div class="row">
          <div class="qty">
            <button data-act="dec-item" data-i="${i}" aria-label="Decrease quantity">−</button>
            <span>${it.qty}</span>
            <button data-act="inc-item" data-i="${i}" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove" data-act="remove" data-i="${i}">Remove</button>
        </div>
      </div></div>`;
  }).join("") : '<p class="center">Your cart is empty. Add some Palitaw!</p>';
  $("#totals").innerHTML = totalsHTML();
}

// ---------- 4. Product cards, filter, search ----------
function cardHTML(p) {
  return `<article class="card" data-id="${p.id}">
    <img src="${p.img}" alt="${esc(p.name)}" data-act="open" loading="lazy">
    <div class="body">
      <h3 data-act="open">${esc(p.name)}</h3>
      <p>${esc(p.desc)}</p>
      <div aria-label="Rated 5 out of 5">⭐⭐⭐⭐⭐</div>
      <div class="row">
        <span class="price">${peso(p.price)} / ${p.unit}</span>
        <div class="qty"><button data-act="dec" aria-label="Decrease">−</button><span>1</span><button data-act="inc" aria-label="Increase">+</button></div>
      </div>
      <button class="btn" data-act="add">Add to Cart</button>
    </div></article>`;
}

let category = "all";
function renderMenu() {
  const term = $("#search").value.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (category === "all" || p.cat === category) &&
    (p.name + " " + p.desc + " " + p.cat).toLowerCase().includes(term));
  $("#menuGrid").innerHTML = list.map(cardHTML).join("");
  $("#empty").hidden = list.length > 0;
}

// ---------- 5. Modals and drawer ----------
function openEl(id) { $("#" + id).hidden = false; document.body.style.overflow = "hidden"; }
function closeEl(id) {
  $("#" + id).hidden = true;
  if (id === "cart") $("#cartOverlay").hidden = true;
  if ($$(".modal:not([hidden]), .drawer:not([hidden])").length === 0) document.body.style.overflow = "";
}
function closeAll() { ["cart", "productModal", "checkoutModal"].forEach(closeEl); }
function openCart() { renderCart(); $("#cartOverlay").hidden = false; openEl("cart"); }

function openProduct(id) {
  const p = find(id);
  $("#modalBody").innerHTML = `
    <img src="${p.img}" alt="${esc(p.name)}">
    <h2>${esc(p.name)}</h2>
    <p>${esc(p.desc)}</p>
    <p class="price">${peso(p.price)} / ${p.unit}</p>
    <p><small>Available today: ${p.stock}</small></p>
    <h3>Topping Options (+${peso(TOPPING_PRICE)} each)</h3>
    <div class="tops">${TOPPINGS.map(t => `<label><input type="checkbox" value="${t}"> ${t}</label>`).join("")}</div>
    <h3>Special Instructions</h3>
    <textarea id="mNote" rows="2" placeholder="e.g. less sugar, please"></textarea>
    <div class="row" style="margin-top:1rem">
      <div class="qty"><button data-act="mdec" aria-label="Decrease">−</button><span id="mQty">1</span><button data-act="minc" aria-label="Increase">+</button></div>
      <button class="btn" data-act="madd" data-id="${p.id}">Add to Cart</button>
    </div>`;
  openEl("productModal");
}

function openCheckout() {
  if (!cart.length) return toast("Your cart is empty.", true);
  $("#summary").innerHTML = cart.map(it =>
    `<p><span>${it.qty} × ${esc(find(it.id).name)}</span><span>${peso(unitPrice(it) * it.qty)}</span></p>`).join("") + totalsHTML();
  $$("#checkoutForm .bad").forEach(e => e.classList.remove("bad"));
  closeEl("cart");
  openEl("checkoutModal");
}

// ---------- 6. Order tracking simulation ----------
let trackTimer = null;
function startTracking(orderNo) {
  $("#tracking").hidden = false;
  $("#trackId").textContent = "Order #" + orderNo;
  const steps = $$("#steps li");
  let n = 0;
  const paint = () => steps.forEach((li, i) => {
    li.classList.toggle("done", i < n);
    li.classList.toggle("current", i === n);
  });
  paint();
  clearInterval(trackTimer);
  trackTimer = setInterval(() => {
    n++;
    if (n >= steps.length - 1) { clearInterval(trackTimer); n = steps.length - 1; }
    paint();
    if (n === steps.length - 1) { steps[n].classList.replace("current", "done"); toast("Your Palitaw has been delivered! 🏠"); }
  }, 6000);
  $("#tracking").scrollIntoView({ behavior: "smooth" });
}

// ---------- 7. Event handling (one delegated click listener) ----------
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act],[data-close],[data-cat]");
  // Backdrop clicks close things
  if (e.target.classList.contains("modal")) return closeAll();
  if (e.target.id === "cartOverlay") return closeAll();
  if (!el) return;

  if (el.dataset.close) return closeEl(el.dataset.close);
  if (el.dataset.cat) {                       // category filter
    category = el.dataset.cat;
    $$(".chipbtn").forEach(b => b.classList.toggle("active", b === el));
    return renderMenu();
  }

  const act = el.dataset.act, card = el.closest(".card"), i = Number(el.dataset.i);
  const q = card ? $(".qty span", card) : null;
  const mq = $("#mQty");

  if (act === "inc") q.textContent = Math.min(20, +q.textContent + 1);
  else if (act === "dec") q.textContent = Math.max(1, +q.textContent - 1);
  else if (act === "add") { addToCart(card.dataset.id, +q.textContent); q.textContent = 1; }
  else if (act === "open") openProduct(card.dataset.id);
  else if (act === "minc") mq.textContent = Math.min(20, +mq.textContent + 1);
  else if (act === "mdec") mq.textContent = Math.max(1, +mq.textContent - 1);
  else if (act === "madd") {
    const tops = $$(".tops input:checked").map(c => c.value);
    addToCart(el.dataset.id, +mq.textContent, tops, $("#mNote").value);
    closeEl("productModal");
  }
  else if (act === "inc-item") { cart[i].qty = Math.min(50, cart[i].qty + 1); saveCart(); }
  else if (act === "dec-item") { cart[i].qty = Math.max(1, cart[i].qty - 1); saveCart(); }
  else if (act === "remove") { cart.splice(i, 1); saveCart(); toast("Item removed"); }
});

$("#cartBtn").addEventListener("click", () => { $("#links").classList.remove("open"); openCart(); });
$("#footCart").addEventListener("click", e => { e.preventDefault(); openCart(); });
$("#checkoutBtn").addEventListener("click", openCheckout);
$("#search").addEventListener("input", renderMenu);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });

// Mobile navigation
$("#burger").addEventListener("click", () => {
  const open = $("#links").classList.toggle("open");
  $("#burger").setAttribute("aria-expanded", open);
});
$$("#links a").forEach(a => a.addEventListener("click", () => $("#links").classList.remove("open")));

// ---------- 8. Forms ----------
const checkoutHTML = $("#checkoutBody").innerHTML; // remember the form so it can be restored later

document.addEventListener("submit", e => {
  e.preventDefault();

  if (e.target.id === "checkoutForm") {
    const f = e.target;
    const phoneOk = /^(09|\+639)\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(f.phone.value.trim());
    const checks = [[f.name, f.name.value.trim().length >= 2], [f.phone, phoneOk], [f.address, f.address.value.trim().length >= 5]];
    checks.forEach(([field, ok]) => field.classList.toggle("bad", !ok));
    if (checks.some(c => !c[1])) return toast("Please complete your name, a valid mobile number, and address.", true);

    const orderNo = "PE" + (1000 + Math.floor(Math.random() * 9000));
    const total = subtotal() + DELIVERY_FEE;
    $("#checkoutBody").innerHTML = `<div class="done-box">
      <h2>Order Confirmed! 🎉</h2>
      <p>Thank you for ordering from Palitaw Express. Your delicious Palitaw is now being prepared.</p>
      <p class="no">Order #${orderNo}</p>
      <p>Total: <strong>${peso(total)}</strong> • ${esc(f.pay.value)}</p>
      <button class="btn block" data-close="checkoutModal">Track My Order</button></div>`;
    cart = []; saveCart();
    startTracking(orderNo);
    return;
  }

  if (e.target.id === "contactForm") {
    const f = e.target;
    const ok = f.name.value.trim() && /^\S+@\S+\.\S+$/.test(f.email.value) && f.message.value.trim();
    if (!ok) return toast("Please fill in your name, a valid email, and a message.", true);
    f.reset();
    toast("Message sent. Salamat!");
  }
});

// Restore a fresh checkout form whenever the confirmation is closed
new MutationObserver(() => {
  if ($("#checkoutModal").hidden && !$("#checkoutForm")) $("#checkoutBody").innerHTML = checkoutHTML;
}).observe($("#checkoutModal"), { attributes: true, attributeFilter: ["hidden"] });

// ---------- 9. Start ----------
$("#featuredGrid").innerHTML = PRODUCTS.map(cardHTML).join("");
renderMenu();
renderCart();
