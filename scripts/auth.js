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

// ===== AUTH CONFIGURATION =====
const AUTH_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
};

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Firebase persistence setup failed:", error);
});

// ===== DOM ELEMENTS =====
const loginToggle = document.getElementById("login-toggle");
const signupToggle = document.getElementById("signup-toggle");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const switchToSignup = document.getElementById("switch-to-signup");
const switchToLogin = document.getElementById("switch-to-login");

// Login form elements
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginTogglePassword = document.getElementById("login-toggle-password");
const loginEmailError = document.getElementById("login-email-error");
const loginPasswordError = document.getElementById("login-password-error");

// Signup form elements
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

// Password strength indicator
const passwordStrength = document.getElementById("password-strength");
const strengthBar = passwordStrength.querySelector(".strength-bar");
const strengthText = passwordStrength.querySelector(".strength-text");

// Password requirements
const reqLength = document.getElementById("req-length");
const reqUppercase = document.getElementById("req-uppercase");
const reqLowercase = document.getElementById("req-lowercase");
const reqNumber = document.getElementById("req-number");

// ===== FORM SWITCHING =====
function switchForm(formType) {
  if (formType === "signup") {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    loginToggle.classList.remove("active");
    signupToggle.classList.add("active");
    clearForm(loginForm);
  } else {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
    signupToggle.classList.remove("active");
    loginToggle.classList.add("active");
    clearForm(signupForm);
  }
}

loginToggle.addEventListener("click", () => switchForm("login"));
signupToggle.addEventListener("click", () => switchForm("signup"));
switchToSignup.addEventListener("click", (e) => {
  e.preventDefault();
  switchForm("signup");
});
switchToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  switchForm("login");
});

// ===== PASSWORD VISIBILITY TOGGLE =====
function togglePasswordVisibility(inputElement, button) {
  const isPassword = inputElement.type === "password";
  inputElement.type = isPassword ? "text" : "password";
  button.textContent = isPassword ? "🙈" : "👁️";
}

loginTogglePassword.addEventListener("click", (e) => {
  e.preventDefault();
  togglePasswordVisibility(loginPassword, loginTogglePassword);
});

signupTogglePassword.addEventListener("click", (e) => {
  e.preventDefault();
  togglePasswordVisibility(signupPassword, signupTogglePassword);
});

signupToggleConfirmPassword.addEventListener("click", (e) => {
  e.preventDefault();
  togglePasswordVisibility(signupConfirmPassword, signupToggleConfirmPassword);
});

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  return {
    length: password.length >= AUTH_CONFIG.PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

/**
 * Check if password is strong
 */
function isStrongPassword(password) {
  const validation = validatePassword(password);
  return (
    validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number
  );
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(password) {
  const validation = validatePassword(password);
  let strength = 0;

  if (validation.length) strength++;
  if (validation.uppercase) strength++;
  if (validation.lowercase) strength++;
  if (validation.number) strength++;

  // Update requirement checklist
  updateRequirement(reqLength, validation.length);
  updateRequirement(reqUppercase, validation.uppercase);
  updateRequirement(reqLowercase, validation.lowercase);
  updateRequirement(reqNumber, validation.number);

  // Update strength bar
  strengthBar.style.width = strength * 25 + "%";

  // Update strength color and text
  if (strength === 0) {
    strengthBar.style.backgroundColor = "#e74c3c";
    strengthText.textContent = "";
  } else if (strength === 1) {
    strengthBar.style.backgroundColor = "#e67e22";
    strengthText.textContent = "Weak";
  } else if (strength === 2) {
    strengthBar.style.backgroundColor = "#f39c12";
    strengthText.textContent = "Fair";
  } else if (strength === 3) {
    strengthBar.style.backgroundColor = "#27ae60";
    strengthText.textContent = "Good";
  } else if (strength === 4) {
    strengthBar.style.backgroundColor = "#16a085";
    strengthText.textContent = "Strong";
  }
}

/**
 * Update requirement item appearance
 */
function updateRequirement(element, isMet) {
  if (isMet) {
    element.classList.add("met");
  } else {
    element.classList.remove("met");
  }
}

/**
 * Validate login form
 */
function validateLoginForm() {
  let isValid = true;

  // Clear previous errors
  loginEmailError.textContent = "";
  loginPasswordError.textContent = "";

  // Validate email
  if (!loginEmail.value.trim()) {
    loginEmailError.textContent = "Email is required";
    isValid = false;
  } else if (!isValidEmail(loginEmail.value.trim())) {
    loginEmailError.textContent = "Please enter a valid email";
    isValid = false;
  }

  // Validate password
  if (!loginPassword.value) {
    loginPasswordError.textContent = "Password is required";
    isValid = false;
  } else if (loginPassword.value.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    loginPasswordError.textContent = `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`;
    isValid = false;
  }

  return isValid;
}

/**
 * Validate signup form
 */
function validateSignupForm() {
  let isValid = true;

  // Clear previous errors
  signupFullnameError.textContent = "";
  signupEmailError.textContent = "";
  signupPasswordError.textContent = "";
  signupConfirmPasswordError.textContent = "";

  // Validate fullname
  if (!signupFullname.value.trim()) {
    signupFullnameError.textContent = "Full name is required";
    isValid = false;
  } else if (signupFullname.value.trim().length < 2) {
    signupFullnameError.textContent = "Name must be at least 2 characters";
    isValid = false;
  }

  // Validate email
  if (!signupEmail.value.trim()) {
    signupEmailError.textContent = "Email is required";
    isValid = false;
  } else if (!isValidEmail(signupEmail.value.trim())) {
    signupEmailError.textContent = "Please enter a valid email";
    isValid = false;
  }

  // Validate password
  if (!signupPassword.value) {
    signupPasswordError.textContent = "Password is required";
    isValid = false;
  } else if (!isStrongPassword(signupPassword.value)) {
    signupPasswordError.textContent = "Password does not meet requirements";
    isValid = false;
  }

  // Validate confirm password
  if (!signupConfirmPassword.value) {
    signupConfirmPasswordError.textContent = "Please confirm your password";
    isValid = false;
  } else if (signupPassword.value !== signupConfirmPassword.value) {
    signupConfirmPasswordError.textContent = "Passwords do not match";
    isValid = false;
  }

  return isValid;
}

// ===== CLEAR FORM HELPERS =====

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

function setLocalCurrentUser(user) {
  if (!user) {
    localStorage.removeItem("currentUser");
    return;
  }
  const currentUser = {
    displayName: user.displayName || user.email.split("@")[0],
    email: user.email,
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function clearLocalCurrentUser() {
  localStorage.removeItem("currentUser");
}

// ===== AUTH UI HELPERS =====

function updateAuthUI(user) {
  if (user) {
    setLocalCurrentUser(user);
    loginForm.classList.remove("active");
    signupForm.classList.remove("active");
    loginToggle.classList.remove("active");
    signupToggle.classList.add("active");
    authStatusPanel.classList.remove("hidden");
    authStatusMessage.textContent = `Signed in as ${user.displayName || user.email}`;
  } else {
    clearLocalCurrentUser();
    authStatusPanel.classList.add("hidden");
    switchForm("login");
  }
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    clearLocalCurrentUser();
    showSuccessMessage("Logged out successfully.");
  } catch (error) {
    showErrorMessage(getFirebaseErrorMessage(error.code));
  }
});

function showErrorMessage(message) {
  const existingError = document.querySelector(".global-error-message");
  if (existingError) {
    existingError.textContent = message;
    return;
  }

  const errorElement = document.createElement("div");
  errorElement.className = "global-error-message";
  errorElement.textContent = message;
  errorElement.style.cssText =
    "background:#ffe8e8;color:#b00020;padding:12px 18px;border-radius:12px;margin:10px auto;max-width:420px;text-align:center;";
  document
    .querySelector(".auth-container")
    .insertAdjacentElement("beforebegin", errorElement);
  setTimeout(() => {
    errorElement.remove();
  }, 4000);
}

// ===== REAL-TIME VALIDATION =====

signupPassword.addEventListener("input", (e) => {
  updatePasswordStrength(e.target.value);
});

// ===== FORM SUBMISSION =====

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateLoginForm()) {
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value,
    );

    updateAuthUI(userCredential.user);
    showSuccessMessage("Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    loginPasswordError.textContent = getFirebaseErrorMessage(error.code);
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateSignupForm()) {
    return;
  }

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
    showSuccessMessage("Account created successfully! Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    signupPasswordError.textContent = getFirebaseErrorMessage(error.code);
  }
});

// ===== HELPER FUNCTIONS =====

/**
 * Show success message
 */
function showSuccessMessage(message) {
  // Create a temporary success message element
  const successMsg = document.createElement("div");
  successMsg.className = "success-message";
  successMsg.textContent = message;
  document.body.appendChild(successMsg);

  setTimeout(() => {
    successMsg.remove();
  }, 2000);
}

// ===== INITIALIZE =====
// Track Firebase auth state, preserve session across refreshes
onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

// Update cart badge on page load
function updateCartBadge() {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const badge = document.querySelector(".cart-badge");
  if (badge) {
    badge.textContent = cartItems.length;
  }
}

updateCartBadge();
