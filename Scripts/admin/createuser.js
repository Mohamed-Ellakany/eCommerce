
const roleHints = {
  admin: "Admins have full access to the dashboard.",
  seller: "Sellers can manage products and orders.",
  customer: "Customers can browse and purchase products.",
};

document.getElementById("userRole").addEventListener("change", function () {
  document.getElementById("roleHint").textContent = roleHints[this.value] || "";
});


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

  if (passed === PW_RULES.length) {
    this.setCustomValidity("");
  } else {
    this.setCustomValidity("weak");
  }

  
  if (this.closest("form").classList.contains("was-validated")) {
    this.classList.toggle("is-invalid", passed < PW_RULES.length);
    this.classList.toggle("is-valid", passed === PW_RULES.length);
  }
});


async function isEmailTaken(email) {
  const user = await DB.findByEmail(email);
  return user !== null;
}


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

    
    emailEl.setCustomValidity("");

    
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

    
    
    const passed = evaluatePasswordRules(passEl.value);
    updateStrengthBar(passed, passEl.value.length > 0);
    pwRulesList.classList.add("visible"); 
    passEl.setCustomValidity(passed === PW_RULES.length ? "" : "weak");

    
    form.classList.add("was-validated");

    if (!form.checkValidity()) return;

    
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
