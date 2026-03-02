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

function isValidPassword(pw) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%^&*])[A-Za-z\d@#$!%^&*]{8,}$/.test(pw);
}

function isEmailTaken(email) {
  const users = JSON.parse(localStorage.getItem("shop_users")) || [];
  return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
}

document
  .getElementById("createUserForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const form = this;
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const passEl = document.getElementById("userPassword");
    const roleEl = document.getElementById("userRole");
    const addrEl = document.getElementById("userAddress");

    let valid = true;

    emailEl.setCustomValidity("");
    passEl.setCustomValidity("");

    // Email duplicate check
    if (emailEl.value && isEmailTaken(emailEl.value)) {
      emailEl.setCustomValidity("taken");
      document.getElementById("emailFeedback").textContent =
        "This email is already registered.";
      valid = false;
    } else {
      document.getElementById("emailFeedback").textContent =
        "Please enter a valid email address.";
    }

    // Password strength check
    if (passEl.value && !isValidPassword(passEl.value)) {
      passEl.setCustomValidity("weak");
      valid = false;
    }

    // Bootstrap's native validation
    if (!form.checkValidity()) {
      valid = false;
    }

    form.classList.add("was-validated");

    if (!valid) return;

    const users = JSON.parse(localStorage.getItem("shop_users")) || [];
    const newUser = {
      id: Date.now(),
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      password: passEl.value,
      role: roleEl.value,
      address: addrEl.value.trim(),
    };
    users.push(newUser);
    localStorage.setItem("shop_users", JSON.stringify(users));

    const toast = new bootstrap.Toast(document.getElementById("successToast"));
    toast.show();

    setTimeout(() => {
      window.location.href = "admin-dashboard.html";
    }, 1500);
  });
