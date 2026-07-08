// ======================================================
// AUTENTIKASI — FIREBASE (Sign In, Sign Up, Verifikasi Email, 2FA SMS)
// Konfigurasi Firebase ada di file firebase-config.js
// ======================================================

const gate = document.getElementById("gate");
const content = document.getElementById("content");
const passwordInput = document.getElementById("passwordInput");
const usernameInput = document.getElementById("usernameInput");
const confirmPasswordField = document.getElementById("confirmPasswordField");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const loginBtn = document.getElementById("loginBtn");
const loginBtnLabel = document.getElementById("loginBtnLabel");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");
const eyeToggle = document.getElementById("eyeToggle");
const rememberMe = document.getElementById("rememberMe");
const rememberRow = document.getElementById("rememberRow");
const forgotBtn = document.getElementById("forgotBtn");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const modeToggleText = document.getElementById("modeToggleText");

const mfaChallengeModal = document.getElementById("mfaChallengeModal");
const mfaChallengeHint = document.getElementById("mfaChallengeHint");
const mfaCodeInput = document.getElementById("mfaCodeInput");
const mfaChallengeError = document.getElementById("mfaChallengeError");
const mfaCancelBtn = document.getElementById("mfaCancelBtn");
const mfaConfirmBtn = document.getElementById("mfaConfirmBtn");

const mfaEnrollModal = document.getElementById("mfaEnrollModal");
const mfaEnrollStep1 = document.getElementById("mfaEnrollStep1");
const mfaEnrollStep2 = document.getElementById("mfaEnrollStep2");
const mfaPhoneInput = document.getElementById("mfaPhoneInput");
const mfaEnrollCodeInput = document.getElementById("mfaEnrollCodeInput");
const mfaEnrollError = document.getElementById("mfaEnrollError");
const mfaSendCodeBtn = document.getElementById("mfaSendCodeBtn");
const mfaSkipBtn = document.getElementById("mfaSkipBtn");
const mfaEnrollCancelBtn = document.getElementById("mfaEnrollCancelBtn");
const mfaEnrollConfirmBtn = document.getElementById("mfaEnrollConfirmBtn");

let isSignUpMode = false;
let mfaResolver = null;      // dipakai saat login butuh kode SMS (user sudah aktifkan 2FA)
let mfaVerificationId = null;
let enrollVerificationId = null;
let recaptchaVerifier = null;

function unlock() {
  gate.classList.add("hidden");
  content.classList.remove("hidden");
}

function lock() {
  content.classList.add("hidden");
  gate.classList.remove("hidden");
  passwordInput.value = "";
}

function setLoginBusy(isBusy) {
  loginBtn.disabled = isBusy;
  loginBtn.style.opacity = isBusy ? "0.6" : "1";
}

function translateAuthError(code) {
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Email atau password salah.",
    "auth/wrong-password": "Email atau password salah.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/email-already-in-use": "Email ini sudah terdaftar. Coba masuk saja.",
    "auth/weak-password": "Password minimal 6 karakter.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
    "auth/missing-password": "Password tidak boleh kosong.",
    "auth/invalid-phone-number": "Format nomor HP tidak valid. Gunakan format +62...",
    "auth/network-request-failed": "Gagal terhubung ke server. Cek koneksi internet.",
    "auth/invalid-verification-code": "Kode OTP salah atau kedaluwarsa."
  };
  return map[code] || "Terjadi kesalahan. Coba lagi.";
}

function setMode(signUp) {
  isSignUpMode = signUp;
  errorMsg.textContent = "";
  confirmPasswordField.classList.toggle("hidden", !signUp);
  rememberRow.classList.toggle("hidden", signUp);
  loginBtnLabel.textContent = signUp ? "DAFTAR AKUN" : "LOGIN SECURELY";
  modeToggleText.textContent = signUp ? "Sudah punya akun?" : "Belum punya akun?";
  toggleModeBtn.textContent = signUp ? "Masuk di sini" : "Daftar di sini";
}

toggleModeBtn.addEventListener("click", () => setMode(!isSignUpMode));

function initAuth() {
  const {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    multiFactor,
    getMultiFactorResolver
  } = window.fidiAuth;

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });

  let hasOfferedMfaThisSession = false;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      lock();
      return;
    }
    if (!user.emailVerified) {
      errorMsg.textContent = "Email belum diverifikasi. Cek inbox Anda, lalu klik tautan verifikasi.";
      return; // tetap di gate, jangan unlock dulu
    }
    unlock();

    // Tawarkan aktivasi 2FA sekali per sesi kalau user belum punya faktor kedua
    const enrolledFactors = multiFactor(user).enrolledFactors;
    if (!hasOfferedMfaThisSession && enrolledFactors.length === 0) {
      hasOfferedMfaThisSession = true;
      mfaEnrollModal.classList.remove("hidden");
    }
  });

  async function attemptLogin() {
    const email = usernameInput.value.trim();
    const password = passwordInput.value;
    errorMsg.textContent = "";

    if (!email || !password) {
      errorMsg.textContent = "Isi email dan password terlebih dahulu.";
      return;
    }

    if (isSignUpMode) {
      const confirmPassword = confirmPasswordInput.value;
      if (password !== confirmPassword) {
        errorMsg.textContent = "Konfirmasi password tidak sama.";
        return;
      }
      setLoginBusy(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        errorMsg.textContent = "Akun dibuat! Cek email Anda untuk verifikasi sebelum masuk.";
        setMode(false);
        passwordInput.value = "";
        confirmPasswordInput.value = "";
      } catch (err) {
        errorMsg.textContent = translateAuthError(err.code);
      } finally {
        setLoginBusy(false);
      }
      return;
    }

    setLoginBusy(true);
    try {
      await setPersistence(
        auth,
        rememberMe.checked ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
      // unlock() otomatis terpanggil lewat onAuthStateChanged di atas
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        // User ini sudah aktifkan 2FA -> minta kode SMS dulu
        mfaResolver = getMultiFactorResolver(auth, err);
        const hint = mfaResolver.hints[0];
        mfaChallengeHint.textContent = `Kode OTP dikirim ke nomor berakhiran ...${hint.phoneNumber.slice(-4)}`;
        try {
          const phoneProvider = new PhoneAuthProvider(auth);
          mfaVerificationId = await phoneProvider.verifyPhoneNumber(
            { multiFactorHint: hint, session: mfaResolver.session },
            recaptchaVerifier
          );
          mfaChallengeModal.classList.remove("hidden");
          mfaCodeInput.focus();
        } catch (smsErr) {
          console.error("MFA challenge send error:", smsErr);
          errorMsg.textContent = translateAuthError(smsErr.code) + ` (kode: ${smsErr.code || "tidak diketahui"})`;
        }
      } else {
        errorMsg.textContent = translateAuthError(err.code);
        passwordInput.value = "";
        passwordInput.focus();
      }
    } finally {
      setLoginBusy(false);
    }
  }

  loginBtn.addEventListener("click", attemptLogin);

  [usernameInput, passwordInput, confirmPasswordInput].forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        attemptLogin();
      }
    });
  });

  forgotBtn.addEventListener("click", async () => {
    const email = usernameInput.value.trim();
    if (!email) {
      errorMsg.textContent = "Isi kolom email dulu, lalu klik \"Lupa password?\" lagi.";
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      errorMsg.textContent = "Link reset password sudah dikirim ke email Anda.";
    } catch (err) {
      errorMsg.textContent = translateAuthError(err.code);
    }
  });

  logoutBtn.addEventListener("click", () => signOut(auth));

  // --- Verifikasi kode SMS saat LOGIN (user yang sudah punya 2FA aktif) ---
  mfaConfirmBtn.addEventListener("click", async () => {
    mfaChallengeError.textContent = "";
    try {
      const cred = PhoneAuthProvider.credential(mfaVerificationId, mfaCodeInput.value.trim());
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(multiFactorAssertion);
      mfaChallengeModal.classList.add("hidden");
      mfaCodeInput.value = "";
      // unlock() otomatis terpanggil lewat onAuthStateChanged
    } catch (err) {
      mfaChallengeError.textContent = translateAuthError(err.code);
    }
  });

  mfaCancelBtn.addEventListener("click", () => {
    mfaChallengeModal.classList.add("hidden");
    mfaCodeInput.value = "";
    mfaChallengeError.textContent = "";
  });

  // --- Pendaftaran nomor HP untuk 2FA (dipanggil setelah user login & email terverifikasi) ---
  mfaSendCodeBtn.addEventListener("click", async () => {
    mfaEnrollError.textContent = "";
    const phone = mfaPhoneInput.value.trim();
    if (!phone.startsWith("+")) {
      mfaEnrollError.textContent = "Gunakan format internasional, contoh: +62812xxxxxxx";
      return;
    }
    try {
      const user = auth.currentUser;
      const mfaSession = await multiFactor(user).getSession();
      const phoneProvider = new PhoneAuthProvider(auth);
      enrollVerificationId = await phoneProvider.verifyPhoneNumber(
        { phoneNumber: phone, session: mfaSession },
        recaptchaVerifier
      );
      mfaEnrollStep1.classList.add("hidden");
      mfaEnrollStep2.classList.remove("hidden");
    } catch (err) {
      console.error("MFA enroll sendCode error:", err);
      mfaEnrollError.textContent = translateAuthError(err.code) + ` (kode: ${err.code || "tidak diketahui"})`;
    }
  });

  mfaEnrollConfirmBtn.addEventListener("click", async () => {
    mfaEnrollError.textContent = "";
    try {
      const cred = PhoneAuthProvider.credential(enrollVerificationId, mfaEnrollCodeInput.value.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactor(auth.currentUser).enroll(assertion, "Nomor HP utama");
      mfaEnrollModal.classList.add("hidden");
      mfaEnrollStep1.classList.remove("hidden");
      mfaEnrollStep2.classList.add("hidden");
      mfaPhoneInput.value = "";
      mfaEnrollCodeInput.value = "";
    } catch (err) {
      console.error("MFA enroll confirm error:", err);
      mfaEnrollError.textContent = translateAuthError(err.code) + ` (kode: ${err.code || "tidak diketahui"})`;
    }
  });

  mfaSkipBtn.addEventListener("click", () => {
    mfaEnrollModal.classList.add("hidden");
  });

  mfaEnrollCancelBtn.addEventListener("click", () => {
    mfaEnrollModal.classList.add("hidden");
    mfaEnrollStep1.classList.remove("hidden");
    mfaEnrollStep2.classList.add("hidden");
    mfaEnrollError.textContent = "";
  });
}

// Tunggu firebase-config.js selesai load (dimuat sebagai module, bisa lebih lambat dari script.js ini)
if (window.fidiAuth) {
  initAuth();
} else {
  window.addEventListener("fidiAuthReady", initAuth);
}

eyeToggle.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
});


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
