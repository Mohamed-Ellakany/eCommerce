const roleHints = {
  admin: "Admins have full access to the dashboard.",
  seller: "Sellers can manage products and orders.",
  customer: "Customers can browse and purchase products.",
};

document.getElementById("userRole").addEventListener("change", function () {
  document.getElementById("roleHint").textContent = roleHints[this.value] || "";
});

document.getElementById("togglePassword").addEventListener("click", function () {
  const pw = document.getElementById("userPassword");
  const isHidden = pw.type === "password";
  pw.type = isHidden ? "text" : "password";
  document.getElementById("iconEye").style.display = isHidden ? "none" : "block";
  document.getElementById("iconEyeOff").style.display = isHidden ? "block" : "none";
});

function isValidPassword(pw) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%^&*])[A-Za-z\d@#$!%^&*]{8,}$/.test(pw);
}

async function isEmailTaken(email) {
  const user = await DB.findByEmail(email);
  return user !== null;
}

document.getElementById("createUserForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = this;
  const nameEl  = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const passEl  = document.getElementById("userPassword");
  const roleEl  = document.getElementById("userRole");
  const addrEl  = document.getElementById("userAddress");
  const submitBtn = form.querySelector("[type='submit']");

  let valid = true;

  emailEl.setCustomValidity("");
  passEl.setCustomValidity("");

  // Email duplicate check
  if (emailEl.value && await isEmailTaken(emailEl.value)) {
    emailEl.setCustomValidity("taken");
    document.getElementById("emailFeedback").textContent = "This email is already registered.";
    valid = false;
  } else {
    document.getElementById("emailFeedback").textContent = "Please enter a valid email address.";
  }

  // Password strength check
  if (passEl.value && !isValidPassword(passEl.value)) {
    passEl.setCustomValidity("weak");
    valid = false;
  }

  // Bootstrap's native validation
  if (!form.checkValidity()) valid = false;

  form.classList.add("was-validated");
  if (!valid) return;

  // Loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating…';

  try {
    const newUser = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      name: nameEl.value.trim(),
      email: emailEl.value.trim().toLowerCase(),
      password: passEl.value,
      role: roleEl.value,
      address: addrEl.value.trim(),
      createdAt: new Date().toISOString(),
    };

    await DB.addUser(newUser);

    const toast = new bootstrap.Toast(document.getElementById("successToast"));
    toast.show();

    setTimeout(() => {
      window.location.href = "admin-dashboard.html";
    }, 1500);

  } catch (err) {
    console.error("Create user failed:", err);
    alert("⚠ Could not create user. Make sure JSON Server is running.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Create User";
  }
});