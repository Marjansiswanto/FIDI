// ======================================================
// KONFIGURASI PASSWORD
// Disimpan sebagai hash SHA-256, bukan teks biasa.
// CATATAN JUJUR: field "Username/Email" di sini bersifat
// kosmetik mengikuti desain referensi — situs statis ini
// hanya memvalidasi SATU password bersama untuk semua orang,
// bukan akun individual. Untuk login per-akun sungguhan,
// diperlukan backend/database asli.
//
// Cara ganti password:
// 1. Buka https://emn178.github.io/online-tools/sha256.html
// 2. Ketik password baru, salin hasil hash-nya
// 3. Tempel ke PASSWORD_HASH di bawah ini
// ======================================================

const PASSWORD_HASH = "c9daf4dd7326fbca56c8987ca62792df03b2e93951ab9bab6081cf8571258104";
// Hash di atas = "password" — GANTI SEBELUM DI-DEPLOY!

const SESSION_KEY = "fidi_scie_unlocked";

const gate = document.getElementById("gate");
const content = document.getElementById("content");
const passwordInput = document.getElementById("passwordInput");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");
const eyeToggle = document.getElementById("eyeToggle");
const rememberMe = document.getElementById("rememberMe");
const forgotBtn = document.getElementById("forgotBtn");

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function unlock() {
  gate.classList.add("hidden");
  content.classList.remove("hidden");
}

function lock() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  content.classList.add("hidden");
  gate.classList.remove("hidden");
  passwordInput.value = "";
}

// Cek sesi tersimpan (baik sessionStorage maupun localStorage kalau "Ingat saya" dicentang)
if (sessionStorage.getItem(SESSION_KEY) === "true" || localStorage.getItem(SESSION_KEY) === "true") {
  unlock();
}

async function attemptLogin() {
  const hash = await sha256(passwordInput.value);
  if (hash === PASSWORD_HASH) {
    errorMsg.textContent = "";
    if (rememberMe.checked) {
      localStorage.setItem(SESSION_KEY, "true");
    } else {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
    unlock();
  } else {
    errorMsg.textContent = "Username atau password salah.";
    passwordInput.value = "";
    passwordInput.focus();
  }
}

loginBtn.addEventListener("click", attemptLogin);

[usernameInput, passwordInput].forEach(el => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      attemptLogin();
    }
  });
});

eyeToggle.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
});

forgotBtn.addEventListener("click", () => {
  errorMsg.textContent = "Hubungi admin portal untuk reset password.";
});

logoutBtn.addEventListener("click", lock);

// ======================================================
// DEKORASI VISUAL (globe network, skyline, candlestick)
// Murni digambar lewat JS/SVG, tanpa file gambar eksternal.
// ======================================================

function buildGlobeDecoration() {
  const dotsGroup = document.querySelector(".globe-dots");
  const linesGroup = document.querySelector(".globe-lines");
  if (!dotsGroup || !linesGroup) return;

  const points = [];
  const count = 26;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 140;
    const x = 200 + Math.cos(angle) * radius;
    const y = 200 + Math.sin(angle) * radius * 0.6; // sedikit elips agar terlihat seperti globe
    points.push({ x, y });

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", Math.random() > 0.75 ? 3 : 1.8);
    dot.setAttribute("fill", Math.random() > 0.5 ? "#22d3ee" : "#3b82f6");
    dot.setAttribute("opacity", 0.55 + Math.random() * 0.45);
    dotsGroup.appendChild(dot);
  }

  // Hubungkan beberapa titik terdekat dengan garis tipis
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 3) % points.length];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", points[i].x);
    line.setAttribute("y1", points[i].y);
    line.setAttribute("x2", next.x);
    line.setAttribute("y2", next.y);
    line.setAttribute("stroke", "rgba(34,211,238,0.32)");
    line.setAttribute("stroke-width", "1");
    linesGroup.appendChild(line);
  }
}

function buildSkyline() {
  const skyline = document.getElementById("skyline");
  if (!skyline) return;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    const height = 60 + Math.random() * 200;
    const width = 26 + Math.random() * 18;
    b.className = "building";
    b.style.height = height + "px";
    b.style.width = width + "px";
    skyline.appendChild(b);
  }
}

function buildCandles() {
  const group = document.getElementById("candles");
  if (!group) return;
  const count = 14;
  let x = 16;
  let prevClose = 340;

  for (let i = 0; i < count; i++) {
    const isUp = Math.random() > 0.35; // condong naik, meniru tren uptrend
    const bodyHeight = 16 + Math.random() * 30;
    const baseY = 372 - i * 23;
    const wickExtra = 8 + Math.random() * 12;
    const color = isUp ? "#10e0a0" : "#f87171";

    const wick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    wick.setAttribute("x1", x + 7);
    wick.setAttribute("y1", baseY - wickExtra);
    wick.setAttribute("x2", x + 7);
    wick.setAttribute("y2", baseY + bodyHeight + wickExtra);
    wick.setAttribute("stroke", color);
    wick.setAttribute("stroke-width", "1.4");
    wick.setAttribute("opacity", "0.85");
    group.appendChild(wick);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("x", x);
    body.setAttribute("y", baseY);
    body.setAttribute("width", 14);
    body.setAttribute("height", bodyHeight);
    body.setAttribute("rx", 2);
    body.setAttribute("fill", color);
    body.setAttribute("opacity", "0.9");
    group.appendChild(body);

    x += 27;
  }
}

function buildNetworkOverlay() {
  const svg = document.getElementById("networkOverlay");
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";
  const nodeCount = 46;
  const nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      r: Math.random() > 0.85 ? 4.5 : 2.2
    });
  }

  const allLines = [];

  // Hubungkan tiap node ke 2 tetangga terdekat
  nodes.forEach((n, i) => {
    const distances = nodes
      .map((m, j) => ({ j, d: (n.x - m.x) ** 2 + (n.y - m.y) ** 2 }))
      .filter(o => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    distances.forEach(({ j }) => {
      const m = nodes[j];
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", n.x);
      line.setAttribute("y1", n.y);
      line.setAttribute("x2", m.x);
      line.setAttribute("y2", m.y);
      line.setAttribute("stroke", "rgba(148,197,255,0.16)");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      allLines.push({ x1: n.x, y1: n.y, x2: m.x, y2: m.y });
    });
  });

  // Node dengan animasi kedip acak
  nodes.forEach(n => {
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", n.r);
    circle.setAttribute("fill", n.r > 3 ? "#eab308" : "#e2f4ff");
    circle.setAttribute("class", "net-node");
    circle.style.animationDuration = (2 + Math.random() * 3) + "s";
    circle.style.animationDelay = (Math.random() * 4) + "s";
    svg.appendChild(circle);
  });

  // Titik cahaya bergerak antar node (efek "data mengalir"), hanya sebagian garis
  const NS_ANIM = NS;
  allLines
    .filter(() => Math.random() < 0.35)
    .forEach(l => {
      const pulse = document.createElementNS(NS, "circle");
      pulse.setAttribute("r", 3);
      pulse.setAttribute("fill", Math.random() > 0.5 ? "#22d3ee" : "#eab308");
      pulse.setAttribute("class", "net-pulse");

      const animX = document.createElementNS(NS_ANIM, "animate");
      animX.setAttribute("attributeName", "cx");
      animX.setAttribute("values", `${l.x1};${l.x2};${l.x1}`);
      animX.setAttribute("dur", (3 + Math.random() * 3) + "s");
      animX.setAttribute("repeatCount", "indefinite");

      const animY = document.createElementNS(NS_ANIM, "animate");
      animY.setAttribute("attributeName", "cy");
      animY.setAttribute("values", `${l.y1};${l.y2};${l.y1}`);
      animY.setAttribute("dur", animX.getAttribute("dur"));
      animY.setAttribute("repeatCount", "indefinite");

      const animOpacity = document.createElementNS(NS_ANIM, "animate");
      animOpacity.setAttribute("attributeName", "opacity");
      animOpacity.setAttribute("values", "0;1;1;0");
      animOpacity.setAttribute("dur", animX.getAttribute("dur"));
      animOpacity.setAttribute("repeatCount", "indefinite");

      pulse.appendChild(animX);
      pulse.appendChild(animY);
      pulse.appendChild(animOpacity);
      svg.appendChild(pulse);
    });
}

buildNetworkOverlay();
