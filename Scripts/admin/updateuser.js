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
   (only active when the field has a value)
═══════════════════════════════════════════════════ */
const PW_RULES = [
  { id: "rule-length", test: (v) => v.length >= 8 },
  { id: "rule-upper", test: (v) => /[A-Z]/.test(v) },
  { id: "rule-number", test: (v) => /\d/.test(v) },
  { id: "rule-symbol", test: (v) => /[@#$!%^&*]/.test(v) },
];

const STRENGTH_CONFIG = [
  { label: "", color: "" },
  { label: "Weak", color: "#dc3545" },
  { label: "Fair", color: "#fd7e14" },
  { label: "Good", color: "#ffc107" },
  { label: "Strong", color: "#198754" },
];

const pwInput = document.getElementById("userPassword");
const pwRulesList = document.getElementById("pwRules");
const pwStrengthBar = document.getElementById("pwStrengthBar");
const pwStrengthLbl = document.getElementById("pwStrengthLabel");

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

function updateStrengthBar(passed, hasValue) {
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

pwInput.addEventListener("focus", () => pwRulesList.classList.add("visible"));
pwInput.addEventListener("blur", () => {
  if (!pwInput.value) pwRulesList.classList.remove("visible");
});

pwInput.addEventListener("input", function () {
  const val = this.value;
  const passed = evaluatePasswordRules(val);
  updateStrengthBar(passed, val.length > 0);

  // Password is optional on update: only invalid if something was typed but rules fail
  if (val.length === 0 || passed === PW_RULES.length) {
    this.setCustomValidity("");
  } else {
    this.setCustomValidity("weak");
  }

  if (this.closest("form").classList.contains("was-validated")) {
    this.classList.toggle(
      "is-invalid",
      val.length > 0 && passed < PW_RULES.length,
    );
    this.classList.toggle(
      "is-valid",
      val.length === 0 || passed === PW_RULES.length,
    );
  }
});

/* ═══════════════════════════════════════════════════
   Pre-fill form from DB using ?id= URL param
═══════════════════════════════════════════════════ */
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");
let origEmail = ""; // store original email to allow "no change" on email field

async function prefillForm() {
  if (!userId) {
    alert("No user ID provided. Redirecting to dashboard.");
    window.location.href = "admin-dashboard.html";
    return;
  }

  try {
    const user = await DB.findById(userId);
    if (!user) {
      alert("User not found. Redirecting to dashboard.");
      window.location.href = "../../pages/admin/admin-dashboard.html";
      return;
    }

    origEmail = user.email.toLowerCase();

    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userAddress").value = user.address;

    // Set role dropdown
    const roleEl = document.getElementById("userRole");
    roleEl.value = user.role;
    document.getElementById("roleHint").textContent =
      roleHints[user.role] || "";
  } catch (err) {
    console.error("Failed to load user:", err);
    alert("⚠ Could not load user data. Make sure JSON Server is running.");
  }
}

prefillForm();

/* ═══════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════ */
async function isEmailTakenByOther(email) {
  // Allow the user to keep their own email without a "taken" error
  if (email.toLowerCase() === origEmail) return false;
  const user = await DB.findByEmail(email);
  return user !== null;
}

/* ═══════════════════════════════════════════════════
   Form submit
═══════════════════════════════════════════════════ */
document
  .getElementById("updateUserForm")
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
    passEl.setCustomValidity("");

    // Email duplicate check (skip if unchanged)
    if (emailEl.value) {
      const taken = await isEmailTakenByOther(emailEl.value);
      if (taken) {
        emailEl.setCustomValidity("taken");
        document.getElementById("emailFeedback").textContent =
          "This email is already registered.";
      } else {
        document.getElementById("emailFeedback").textContent =
          "Please enter a valid email address.";
      }
    }

    // Password: only validate if the field has a value (it's optional on update)
    if (passEl.value.length > 0) {
      const passed = evaluatePasswordRules(passEl.value);
      updateStrengthBar(passed, true);
      pwRulesList.classList.add("visible");
      passEl.setCustomValidity(passed === PW_RULES.length ? "" : "weak");
    } else {
      // Empty = keep existing password → always valid
      passEl.setCustomValidity("");
    }

    // Trigger Bootstrap visual validation state
    form.classList.add("was-validated");

    if (!form.checkValidity()) return;

    // ── All valid – submit ──
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Updating…';

    try {
      // Build the updated user object; keep old password if field is blank
      const existingUser = await DB.findById(userId);

      const updatedUser = {
        ...existingUser, // preserve id, createdAt, etc.
        name: nameEl.value.trim(),
        email: emailEl.value.trim().toLowerCase(),
        password:
          passEl.value.trim() !== "" ? passEl.value : existingUser.password, // keep old password if blank
        role: roleEl.value,
        address: addrEl.value.trim(),
        updatedAt: new Date().toISOString(),
      };

      await DB.updateUser(userId, updatedUser);

      const toast = new bootstrap.Toast(
        document.getElementById("successToast"),
      );
      toast.show();

      setTimeout(() => {
        window.location.href = "../../pages/admin/admin-dashboard.html";
      }, 1500);
    } catch (err) {
      console.error("Update user failed:", err);
      alert("⚠ Could not update user. Make sure JSON Server is running.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Update User";
    }
  });
