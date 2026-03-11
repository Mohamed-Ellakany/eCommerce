/* ═══════════════════════════════════════════════════
   Role hint
═══════════════════════════════════════════════════ */
const roleHints = {
  admin: "Admins have full access to the dashboard.",
  seller: "Sellers can manage products and orders.",
  customer: "Customers can browse and purchase products.",
};

document.getElementById("userRole").addEventListener("change", function () {
  document.getElementById("roleHint").textContent = roleHints[this.value] || "";
});

/* ═══════════════════════════════════════════════════
   Password – show / hide toggle
═══════════════════════════════════════════════════ */
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const pw = document.getElementById("userPassword");
    const isHidden = pw.type === "password";
    pw.type = isHidden ? "text" : "password";
    document.getElementById("iconEye").style.display = isHidden
      ? "none"
      : "block";
    document.getElementById("iconEyeOff").style.display = isHidden
      ? "block"
      : "none";
  });

/* ═══════════════════════════════════════════════════
   Password – live custom validation
═══════════════════════════════════════════════════ */
const PW_RULES = [
  { id: "rule-length", test: (v) => v.length >= 8 },
  { id: "rule-upper", test: (v) => /[A-Z]/.test(v) },
  { id: "rule-number", test: (v) => /\d/.test(v) },
  { id: "rule-symbol", test: (v) => /[@#$!%^&*]/.test(v) },
];

const STRENGTH_CONFIG = [
  { label: "", color: "" }, // 0 rules – nothing typed
  { label: "Weak", color: "#dc3545" }, // 1 rule
  { label: "Fair", color: "#fd7e14" }, // 2 rules
  { label: "Good", color: "#ffc107" }, // 3 rules
  { label: "Strong", color: "#198754" }, // 4 rules (all pass)
];

const pwInput = document.getElementById("userPassword");
const pwRulesList = document.getElementById("pwRules");
const pwStrengthBar = document.getElementById("pwStrengthBar");
const pwStrengthLbl = document.getElementById("pwStrengthLabel");

/**
 * Evaluate each rule and return how many pass.
 * Also updates the DOM for every rule <li>.
 */
function evaluatePasswordRules(value) {
  let passed = 0;

  PW_RULES.forEach(({ id, test }) => {
    const li = document.getElementById(id);
    const icon = li.querySelector(".ri");
    const ok = test(value);

    li.classList.toggle("pass", ok);
    li.classList.toggle("fail", !ok && value.length > 0);
    icon.textContent = ok ? "✓" : value.length > 0 ? "✗" : "○";
    if (ok) passed++;
  });

  return passed;
}

/** Update the 4-segment strength bar and label. */
function updateStrengthBar(passed, hasValue) {
  // Remove all strength classes
  pwStrengthBar.className = "pw-strength-bar";

  if (!hasValue) {
    pwStrengthLbl.textContent = "";
    pwStrengthLbl.style.color = "";
    return;
  }

  pwStrengthBar.classList.add("s" + passed);
  const cfg = STRENGTH_CONFIG[passed];
  pwStrengthLbl.textContent = cfg.label;
  pwStrengthLbl.style.color = cfg.color;
}

/* Show rules panel on focus, hide on blur (only if empty) */
pwInput.addEventListener("focus", () => pwRulesList.classList.add("visible"));
pwInput.addEventListener("blur", () => {
  if (!pwInput.value) pwRulesList.classList.remove("visible");
});

/* React to every keystroke */
pwInput.addEventListener("input", function () {
  const val = this.value;
  const passed = evaluatePasswordRules(val);
  updateStrengthBar(passed, val.length > 0);

  if (passed === PW_RULES.length) {
    this.setCustomValidity("");
  } else {
    this.setCustomValidity("weak");
  }

  // If the field already had an error shown, update it live
  if (this.closest("form").classList.contains("was-validated")) {
    this.classList.toggle("is-invalid", passed < PW_RULES.length);
    this.classList.toggle("is-valid", passed === PW_RULES.length);
  }
});

/* ═══════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════ */
async function isEmailTaken(email) {
  const user = await DB.findByEmail(email);
  return user !== null;
}

/* ═══════════════════════════════════════════════════
   Form submit
═══════════════════════════════════════════════════ */
document
  .getElementById("createUserForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = this;
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const passEl = document.getElementById("userPassword");
    const roleEl = document.getElementById("userRole");
    const addrEl = document.getElementById("userAddress");
    const submitBtn = form.querySelector("[type='submit']");

    // Reset custom validity before re-checking
    emailEl.setCustomValidity("");

    // Email duplicate check
    if (emailEl.value) {
      const taken = await isEmailTaken(emailEl.value);
      if (taken) {
        emailEl.setCustomValidity("taken");
        document.getElementById("emailFeedback").textContent =
          "This email is already registered.";
      } else {
        document.getElementById("emailFeedback").textContent =
          "Please enter a valid email address.";
      }
    }

    // Make sure password rules are freshly evaluated (handles the case where
    // the user never typed in the field after page load)
    const passed = evaluatePasswordRules(passEl.value);
    updateStrengthBar(passed, passEl.value.length > 0);
    pwRulesList.classList.add("visible"); // ensure rules are visible on error
    passEl.setCustomValidity(passed === PW_RULES.length ? "" : "weak");

    // Trigger Bootstrap's visual validation state
    form.classList.add("was-validated");

    if (!form.checkValidity()) return;

    // ── All valid – submit ──
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Creating…';

    try {
      const newUser = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : "user_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9),
        name: nameEl.value.trim(),
        email: emailEl.value.trim().toLowerCase(),
        password: passEl.value,
        role: roleEl.value,
        address: addrEl.value.trim(),
        createdAt: new Date().toISOString(),
      };

      await DB.addUser(newUser);

      const toast = new bootstrap.Toast(
        document.getElementById("successToast"),
      );
      toast.show();

      setTimeout(() => {
        window.location.href = "../../pages/admin/admin-dashboard.html";
      }, 1500);
    } catch (err) {
      console.error("Create user failed:", err);
      alert("⚠ Could not create user. Make sure JSON Server is running.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Create User";
    }
  });
