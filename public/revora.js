const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Count-up numbers ----------
function countUp(el, duration = 1600) {
  const to = parseFloat(el.dataset.to);
  if (reduceMotion) { el.textContent = to.toLocaleString(); return; }
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(to * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- Scroll: progress bar, nav state, parallax ----------
const nav = $("#nav");
const progress = $("#progress");
const footerWord = $(".footer__word");
const coins = $$(".coin");
let lastY = 0;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("is-scrolled", y > 20);
  nav.classList.toggle("is-hidden", y > lastY && y > 500 && !$("#navLinks").classList.contains("is-open"));
  lastY = y;

  if (!reduceMotion) {
    coins.forEach((c) => {
      const r = c.parentElement.getBoundingClientRect();
      c.style.transform = `translateY(${r.top * parseFloat(c.dataset.speed)}px) rotate(${r.top * 0.1}deg)`;
    });
    const fr = footerWord.getBoundingClientRect();
    const fp = Math.min(Math.max(1 - (fr.top - innerHeight * 0.5) / (innerHeight * 0.5), 0), 1);
    footerWord.style.setProperty("--fy", `${30 - fp * 30}%`);
  }
  updateFillText();
}
addEventListener("scroll", onScroll, { passive: true });

// ---------- Mobile menu ----------
const burger = $("#burger");
const navLinks = $("#navLinks");
burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
$$("a", navLinks).forEach((a) => a.addEventListener("click", () => {
  navLinks.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
}));

// ---------- Cursor glow + hero portrait parallax ----------
if (finePointer && !reduceMotion) {
  const glow = $("#cursorGlow");
  const portrait = $("#heroPortrait");
  let gx = 0, gy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    document.body.classList.add("has-pointer");
    if (window.scrollY < innerHeight) {
      const dx = (e.clientX / innerWidth - 0.5) * 20;
      const dy = (e.clientY / innerHeight - 0.5) * 14;
      portrait.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  });
  (function loop() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`;
    requestAnimationFrame(loop);
  })();

  // Magnetic buttons
  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });

  // 3D tilt cards
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

// ---------- Hero rotating word ----------
const rotWords = $$("#rotator span");
let rotIdx = 0;
setInterval(() => {
  const cur = rotWords[rotIdx];
  cur.classList.remove("is-active");
  cur.classList.add("is-leaving");
  setTimeout(() => cur.classList.remove("is-leaving"), 700);
  rotIdx = (rotIdx + 1) % rotWords.length;
  rotWords[rotIdx].classList.add("is-active");
}, 2600);

// ---------- Reveal on scroll ----------
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-visible");
    $$(".count", e.target).forEach((c) => { if (!c.closest(".scene")) countUp(c); });
    revealIO.unobserve(e.target);
  });
}, { threshold: 0.2 });
$$(".reveal").forEach((el) => revealIO.observe(el));

// ---------- Sticky steps -> scenes ----------
const steps = $$(".step");
const scenes = $$(".scene");
const stageDots = $$(".stage__dots i");
function setScene(i) {
  steps.forEach((s, j) => s.classList.toggle("is-active", i === j));
  stageDots.forEach((d, j) => d.classList.toggle("is-active", i === j));
  scenes.forEach((s, j) => {
    const active = i === j;
    if (active && !s.classList.contains("is-active")) $$(".count", s).forEach((c) => countUp(c));
    s.classList.toggle("is-active", active);
  });
}
const stepIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) setScene(+e.target.dataset.step); });
}, { rootMargin: innerWidth <= 1000 ? "-55% 0px -40% 0px" : "-45% 0px -45% 0px" });
steps.forEach((s) => stepIO.observe(s));
setScene(0);

// ---------- Rules slider (buttons, dots, drag, autoplay) ----------
const slider = $("#slider");
const track = $("#sliderTrack");
const cards = $$(".rule-card", track);
const dotsWrap = $("#sliderDots");
let slide = 0;
cards.forEach((_, i) => {
  const b = document.createElement("button");
  b.setAttribute("aria-label", `Go to slide ${i + 1}`);
  b.addEventListener("click", () => goTo(i));
  dotsWrap.appendChild(b);
});
const dots = $$("button", dotsWrap);
function maxSlide() {
  const visible = Math.max(1, Math.floor(slider.clientWidth / (cards[0].offsetWidth + 20)));
  return Math.max(0, cards.length - visible);
}
function goTo(i) {
  const m = maxSlide();
  slide = i > m ? 0 : i < 0 ? m : i;
  track.style.transform = `translateX(${-slide * (cards[0].offsetWidth + 20)}px)`;
  dots.forEach((d, j) => d.classList.toggle("is-active", j === slide));
}
$("#rulesNext").addEventListener("click", () => goTo(slide + 1));
$("#rulesPrev").addEventListener("click", () => goTo(slide - 1));
let auto = setInterval(() => goTo(slide + 1), 4500);
slider.addEventListener("pointerenter", () => clearInterval(auto));
slider.addEventListener("pointerleave", () => { clearInterval(auto); auto = setInterval(() => goTo(slide + 1), 4500); });

let dragX = null, dragDelta = 0;
slider.addEventListener("pointerdown", (e) => { dragX = e.clientX; dragDelta = 0; slider.classList.add("is-dragging"); slider.setPointerCapture(e.pointerId); });
slider.addEventListener("pointermove", (e) => {
  if (dragX === null) return;
  dragDelta = e.clientX - dragX;
  track.style.transform = `translateX(${-slide * (cards[0].offsetWidth + 20) + dragDelta}px)`;
});
const endDrag = () => {
  if (dragX === null) return;
  slider.classList.remove("is-dragging");
  dragX = null;
  if (Math.abs(dragDelta) > 60) goTo(slide + (dragDelta < 0 ? 1 : -1)); else goTo(slide);
};
slider.addEventListener("pointerup", endDrag);
slider.addEventListener("pointercancel", endDrag);
addEventListener("resize", () => goTo(Math.min(slide, maxSlide())));
goTo(0);

// ---------- Fill-text on scroll ----------
const fillText = $("#fillText");
fillText.innerHTML = fillText.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
const fillWords = $$(".w", fillText);
function updateFillText() {
  const r = fillText.getBoundingClientRect();
  const p = Math.min(Math.max((innerHeight * 0.85 - r.top) / (innerHeight * 0.55), 0), 1);
  const n = Math.round(p * fillWords.length);
  fillWords.forEach((w, i) => w.classList.toggle("on", i < n));
}

// ---------- AI tabs ----------
const aiTabs = $$(".ai-tab");
const aiData = [
  { status: "In progress", payer: "BlueCross", action: "Follow-up call", amt: 28108, desc: "Revora's AI works every claim in parallel — no queue left to age, no follow-up forgotten. Your collections never stall." },
  { status: "Tracked", payer: "UnitedHealth", action: "Awaiting EOB", amt: 14652, desc: "Every touch, call and document is logged. See exactly where each dollar stands, in real time." },
  { status: "Escalated", payer: "Cigna", action: "Expert appeal", amt: 41390, desc: "When a claim gets tricky, certified RCM specialists step in with payer-specific know-how." },
];
const claimPanel = $("#claimPanel");
let aiIdx = 0, shownAmt = aiData[0].amt;
function animateAmt(to) {
  const from = shownAmt, start = performance.now();
  const el = $("#claimAmt");
  const tick = (now) => {
    const p = Math.min((now - start) / 900, 1);
    shownAmt = from + (to - from) * (1 - Math.pow(1 - p, 3));
    el.textContent = "$" + shownAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function setTab(i) {
  aiIdx = i;
  const d = aiData[i];
  aiTabs.forEach((t, j) => t.classList.toggle("is-active", i === j));
  claimPanel.classList.add("is-swap");
  $("#aiDesc").style.opacity = 0;
  setTimeout(() => {
    $("#claimStatus").textContent = d.status;
    $("#claimPayer").textContent = d.payer;
    $("#claimAction").textContent = d.action;
    $("#aiDesc").textContent = d.desc;
    $("#aiDesc").style.opacity = 1;
    claimPanel.classList.remove("is-swap");
    animateAmt(d.amt);
  }, 250);
}
aiTabs.forEach((t, i) => t.addEventListener("click", () => { setTab(i); resetAiTimer(); }));
let aiTimer;
function resetAiTimer() { clearInterval(aiTimer); aiTimer = setInterval(() => setTab((aiIdx + 1) % aiData.length), 4000); }
resetAiTimer();

// ---------- Accordion + card stack ----------
const accordion = $("#accordion");
const accs = $$(".acc", accordion);
const stackCards = $$(".stack__card");
let accIdx = 0;
function layoutStack(active) {
  stackCards.forEach((c, i) => {
    const pos = (i - active + stackCards.length) % stackCards.length;
    c.style.zIndex = 10 - pos;
    c.style.opacity = pos > 2 ? 0 : 1 - pos * 0.18;
    c.style.filter = pos ? `brightness(${1 - pos * 0.12})` : "none";
    c.style.transform = `translateY(${120 + pos * 70}px) scale(${1 - pos * 0.06}) rotateX(${pos * 6}deg)`;
  });
}
function openAcc(i) {
  accIdx = i;
  accs.forEach((a, j) => a.classList.toggle("is-open", i === j));
  layoutStack(i);
}
accs.forEach((a, i) => {
  $(".acc__head", a).addEventListener("click", () => openAcc(i));
  $(".acc__bar", a).addEventListener("animationend", () => openAcc((i + 1) % accs.length));
});
accordion.addEventListener("pointerenter", () => accordion.classList.add("is-paused"));
accordion.addEventListener("pointerleave", () => accordion.classList.remove("is-paused"));
openAcc(0);

// ---------- Dashboard chart ----------
const chart = $("#chart");
const dash = $("#dash");
function series(range) {
  const n = 24;
  const seed = range / 30;
  return Array.from({ length: n }, (_, i) => Math.round(35 + Math.sin(i * 0.6 * seed) * 18 + i * 1.6 + ((i * 37 * seed) % 13)));
}
function renderChart(range) {
  const data = series(range);
  const max = Math.max(...data);
  if (!chart.children.length) {
    chart.innerHTML = data.map((_, i) => `<div class="col" style="--i:${i * 0.03}s"><span></span></div>`).join("");
  }
  $$(".col", chart).forEach((col, i) => {
    col.style.setProperty("--h", `${(data[i] / max) * 100}%`);
    col.dataset.v = `$${(data[i] * (range / 30) * 1.2).toFixed(1)}K`;
  });
  const mult = { 30: 1, 90: 2.9, 365: 11.4 }[range];
  $$(".kpi").forEach((k) => {
    const base = parseFloat(k.dataset.base);
    let v = base;
    if (k.dataset.int !== undefined) {
      if (base > 100) v = Math.round(base * mult).toLocaleString();
      else v = Math.round(base - (mult - 1) * 0.4);
    } else v = (base * mult).toFixed(2);
    k.textContent = v;
  });
}
$$("#seg button").forEach((b) => b.addEventListener("click", () => {
  $$("#seg button").forEach((x) => x.classList.toggle("is-active", x === b));
  renderChart(+b.dataset.range);
}));
renderChart(30);

// ---------- Live workqueue ----------
const wqBody = $("#wqBody");
const payers = ["Aetna", "Cigna", "Humana", "BCBS", "UHC", "Medicare"];
function newRow(isNew) {
  const tr = document.createElement("tr");
  const id = "CLM-" + Math.floor(10000 + Math.random() * 89999);
  tr.innerHTML = `<td>${id}</td><td>${payers[Math.floor(Math.random() * payers.length)]}</td><td>${Math.floor(Math.random() * 90) + 5}d</td><td>$${(Math.random() * 9000 + 400).toFixed(0)}</td>`;
  if (isNew) tr.className = "new";
  wqBody.prepend(tr);
  while (wqBody.children.length > 5) wqBody.lastElementChild.remove();
}
for (let i = 0; i < 5; i++) newRow(false);
setInterval(() => newRow(true), 2400);

// ---------- Demo modal ----------
const modal = $("#modal");
const form = $("#demoForm");
const done = $("#modalDone");
let lastFocus = null;
function openModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  form.hidden = false;
  done.hidden = true;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("input", form).focus(), 50);
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocus && lastFocus.focus();
}
$$("[data-demo]").forEach((b) => b.addEventListener("click", openModal));
$$("[data-close]", modal).forEach((b) => b.addEventListener("click", closeModal));
addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
const volume = $("#volume");
function updateVolume() {
  const v = +volume.value;
  $("#volumeOut").textContent = v.toLocaleString();
  $("#recoverOut").textContent = "$" + Math.round(v * 48).toLocaleString();
}
volume.addEventListener("input", updateVolume);
updateVolume();
form.addEventListener("submit", (e) => {
  e.preventDefault();
  form.hidden = true;
  done.hidden = false;
  form.reset();
  updateVolume();
});

// ---------- Back to top ----------
$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

onScroll();
