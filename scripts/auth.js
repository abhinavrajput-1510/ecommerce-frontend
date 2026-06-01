import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = window.FIREBASE_CONFIG || {};

const AUTH_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
};

const loginToggle = document.getElementById("login-toggle");
const signupToggle = document.getElementById("signup-toggle");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const switchToSignup = document.getElementById("switch-to-signup");
const switchToLogin = document.getElementById("switch-to-login");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginTogglePassword = document.getElementById("login-toggle-password");
const loginEmailError = document.getElementById("login-email-error");
const loginPasswordError = document.getElementById("login-password-error");

const signupFullname = document.getElementById("signup-fullname");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById(
  "signup-confirm-password",
);
const signupTogglePassword = document.getElementById("signup-toggle-password");
const signupToggleConfirmPassword = document.getElementById(
  "signup-toggle-confirm-password",
);
const signupFullnameError = document.getElementById("signup-fullname-error");
const signupEmailError = document.getElementById("signup-email-error");
const signupPasswordError = document.getElementById("signup-password-error");
const signupConfirmPasswordError = document.getElementById(
  "signup-confirm-password-error",
);

const authStatusPanel = document.getElementById("auth-status-panel");
const authStatusMessage = document.getElementById("auth-status-message");
const logoutButton = document.getElementById("logout-button");
const passwordStrength = document.getElementById("password-strength");
const strengthBar = passwordStrength.querySelector(".strength-bar");
const strengthText = passwordStrength.querySelector(".strength-text");
const reqLength = document.getElementById("req-length");
const reqUppercase = document.getElementById("req-uppercase");
const reqLowercase = document.getElementById("req-lowercase");
const reqNumber = document.getElementById("req-number");
const submitButtons = document.querySelectorAll(
  ".auth-form button[type='submit']",
);

let auth = null;

function isFirebaseConfigured(config) {
  return Object.values(config).every(
    (value) => value && !String(value).startsWith("YOUR_"),
  );
}

function setSubmitState(isLoading, activeButton = null) {
  submitButtons.forEach((button) => {
    button.disabled = isLoading;
  });

  if (!activeButton) {
    return;
  }

  if (isLoading) {
    activeButton.dataset.originalText = activeButton.textContent;
    activeButton.textContent = "Please wait...";
    return;
  }

  activeButton.textContent =
    activeButton.dataset.originalText || activeButton.textContent;
  delete activeButton.dataset.originalText;
}

function setAuthFormsDisabled(disabled) {
  [loginForm, signupForm].forEach((form) => {
    form.querySelectorAll("input, button").forEach((element) => {
      if (element.classList.contains("link-button")) {
        return;
      }
      element.disabled = disabled;
    });
  });
}

function showErrorMessage(message, { persistent = false } = {}) {
  const existingError = document.querySelector(".global-error-message");
  if (existingError) {
    existingError.textContent = message;
    return;
  }

  const errorElement = document.createElement("div");
  errorElement.className = "global-error-message";
  errorElement.textContent = message;
  document
    .querySelector(".auth-container")
    .insertAdjacentElement("beforebegin", errorElement);

  if (!persistent) {
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
}

function showSuccessMessage(message) {
  const successMsg = document.createElement("div");
  successMsg.className = "success-message";
  successMsg.textContent = message;
  document.body.appendChild(successMsg);

  setTimeout(() => {
    successMsg.remove();
  }, 2000);
}

function switchForm(formType) {
  if (formType === "signup") {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    loginToggle.classList.remove("active");
    signupToggle.classList.add("active");
    clearForm(loginForm);
    return;
  }

  signupForm.classList.remove("active");
  loginForm.classList.add("active");
  signupToggle.classList.remove("active");
  loginToggle.classList.add("active");
  clearForm(signupForm);
}

function togglePasswordVisibility(inputElement, button) {
  const isPassword = inputElement.type === "password";
  inputElement.type = isPassword ? "text" : "password";
  button.textContent = isPassword ? "Hide" : "Show";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return {
    length: password.length >= AUTH_CONFIG.PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

function isStrongPassword(password) {
  const validation = validatePassword(password);
  return (
    validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number
  );
}

function updateRequirement(element, isMet) {
  element.classList.toggle("met", isMet);
}

function updatePasswordStrength(password) {
  const validation = validatePassword(password);
  const strength = Object.values(validation).filter(Boolean).length;

  updateRequirement(reqLength, validation.length);
  updateRequirement(reqUppercase, validation.uppercase);
  updateRequirement(reqLowercase, validation.lowercase);
  updateRequirement(reqNumber, validation.number);

  strengthBar.style.width = `${strength * 25}%`;

  const states = [
    { color: "#e74c3c", label: "" },
    { color: "#e67e22", label: "Weak" },
    { color: "#f39c12", label: "Fair" },
    { color: "#27ae60", label: "Good" },
    { color: "#16a085", label: "Strong" },
  ];
  strengthBar.style.backgroundColor = states[strength].color;
  strengthText.textContent = states[strength].label;
}

function clearForm(form) {
  form.reset();
  form.querySelectorAll(".error-message").forEach((error) => {
    error.textContent = "";
  });

  if (form === signupForm) {
    strengthBar.style.width = "0%";
    strengthText.textContent = "";
    [reqLength, reqUppercase, reqLowercase, reqNumber].forEach((req) => {
      req.classList.remove("met");
    });
  }
}

function validateLoginForm() {
  let isValid = true;
  loginEmailError.textContent = "";
  loginPasswordError.textContent = "";

  if (!loginEmail.value.trim()) {
    loginEmailError.textContent = "Email is required.";
    isValid = false;
  } else if (!isValidEmail(loginEmail.value.trim())) {
    loginEmailError.textContent = "Enter a valid email address.";
    isValid = false;
  }

  if (!loginPassword.value) {
    loginPasswordError.textContent = "Password is required.";
    isValid = false;
  }

  return isValid;
}

function validateSignupForm() {
  let isValid = true;
  signupFullnameError.textContent = "";
  signupEmailError.textContent = "";
  signupPasswordError.textContent = "";
  signupConfirmPasswordError.textContent = "";

  if (!signupFullname.value.trim()) {
    signupFullnameError.textContent = "Full name is required.";
    isValid = false;
  } else if (signupFullname.value.trim().length < 2) {
    signupFullnameError.textContent = "Name must be at least 2 characters.";
    isValid = false;
  }

  if (!signupEmail.value.trim()) {
    signupEmailError.textContent = "Email is required.";
    isValid = false;
  } else if (!isValidEmail(signupEmail.value.trim())) {
    signupEmailError.textContent = "Enter a valid email address.";
    isValid = false;
  }

  if (!signupPassword.value) {
    signupPasswordError.textContent = "Password is required.";
    isValid = false;
  } else if (!isStrongPassword(signupPassword.value)) {
    signupPasswordError.textContent =
      "Use 8+ characters with uppercase, lowercase, and a number.";
    isValid = false;
  }

  if (!signupConfirmPassword.value) {
    signupConfirmPasswordError.textContent = "Confirm your password.";
    isValid = false;
  } else if (signupPassword.value !== signupConfirmPassword.value) {
    signupConfirmPasswordError.textContent = "Passwords do not match.";
    isValid = false;
  }

  return isValid;
}

function setLocalCurrentUser(user) {
  if (!user) {
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("currentUserChanged"));
    return;
  }

  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      uid: user.uid,
      displayName: user.displayName || user.email.split("@")[0],
      email: user.email,
    }),
  );
  window.dispatchEvent(new Event("currentUserChanged"));
}

function updateAuthUI(user) {
  if (user) {
    setLocalCurrentUser(user);
    loginForm.classList.remove("active");
    signupForm.classList.remove("active");
    loginToggle.classList.remove("active");
    signupToggle.classList.remove("active");
    authStatusPanel.classList.remove("hidden");
    authStatusMessage.textContent = `Signed in as ${user.displayName || user.email}`;
    return;
  }

  setLocalCurrentUser(null);
  authStatusPanel.classList.add("hidden");
  switchForm("login");
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try logging in instead.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "Firebase API key is invalid. Add the real Firebase web app config.";
    default:
      return "Authentication failed. Please try again.";
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!auth || !validateLoginForm()) {
    return;
  }

  const submitButton = event.submitter;
  setSubmitState(true, submitButton);

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value,
    );
    updateAuthUI(userCredential.user);
    showSuccessMessage("Login successful. Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (error) {
    loginPasswordError.textContent = getFirebaseErrorMessage(error.code);
  } finally {
    setSubmitState(false, submitButton);
  }
}

async function handleSignup(event) {
  event.preventDefault();

  if (!auth || !validateSignupForm()) {
    return;
  }

  const submitButton = event.submitter;
  setSubmitState(true, submitButton);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      signupEmail.value.trim(),
      signupPassword.value,
    );

    await updateProfile(userCredential.user, {
      displayName: signupFullname.value.trim(),
    });

    updateAuthUI(userCredential.user);
    showSuccessMessage("Account created. Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (error) {
    signupPasswordError.textContent = getFirebaseErrorMessage(error.code);
  } finally {
    setSubmitState(false, submitButton);
  }
}

async function handleLogout() {
  if (!auth) {
    setLocalCurrentUser(null);
    window.location.href = "auth.html";
    return;
  }

  try {
    await signOut(auth);
    setLocalCurrentUser(null);
    showSuccessMessage("Logged out successfully.");
    setTimeout(() => {
      window.location.href = "auth.html";
    }, 700);
  } catch (error) {
    showErrorMessage(getFirebaseErrorMessage(error.code));
  }
}

function updateCartBadge() {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const badge = document.querySelector(".cart-badge");
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";
  }
}

function bindHeaderNavigation() {
  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const mainNav = document.querySelector(".main-nav");

  if (!hamburgerMenu || !mainNav) {
    return;
  }

  hamburgerMenu.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    hamburgerMenu.setAttribute(
      "aria-expanded",
      String(mainNav.classList.contains("open")),
    );
  });
}

function bindEvents() {
  loginToggle.addEventListener("click", () => switchForm("login"));
  signupToggle.addEventListener("click", () => switchForm("signup"));
  switchToSignup.addEventListener("click", (event) => {
    event.preventDefault();
    switchForm("signup");
  });
  switchToLogin.addEventListener("click", (event) => {
    event.preventDefault();
    switchForm("login");
  });

  loginTogglePassword.addEventListener("click", (event) => {
    event.preventDefault();
    togglePasswordVisibility(loginPassword, loginTogglePassword);
  });
  signupTogglePassword.addEventListener("click", (event) => {
    event.preventDefault();
    togglePasswordVisibility(signupPassword, signupTogglePassword);
  });
  signupToggleConfirmPassword.addEventListener("click", (event) => {
    event.preventDefault();
    togglePasswordVisibility(
      signupConfirmPassword,
      signupToggleConfirmPassword,
    );
  });

  signupPassword.addEventListener("input", (event) => {
    updatePasswordStrength(event.target.value);
  });

  loginForm.addEventListener("submit", handleLogin);
  signupForm.addEventListener("submit", handleSignup);
  logoutButton.addEventListener("click", handleLogout);
}

function initializeFirebaseAuth() {
  if (!isFirebaseConfigured(firebaseConfig)) {
    setAuthFormsDisabled(true);
    showErrorMessage(
      "Firebase is not configured. Run npm run generate-config after adding Firebase values to .env.",
      { persistent: true },
    );
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);

    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      showErrorMessage(getFirebaseErrorMessage(error.code));
    });

    onAuthStateChanged(auth, (user) => {
      updateAuthUI(user);
    });
  } catch (error) {
    setAuthFormsDisabled(true);
    showErrorMessage(getFirebaseErrorMessage(error.code));
  }
}

bindEvents();
bindHeaderNavigation();
updateCartBadge();
initializeFirebaseAuth();
