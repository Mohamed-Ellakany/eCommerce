if (DB.getSession()) window.location.href = 'profile.html';

const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const isValidName = v => v.trim().length >= 2;

const isValidPass = v => v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v);
const isValidAddr = v => v.trim().length >= 10;

function setError(gId, eId, msg) {
    const g = document.getElementById(gId);
    g.classList.add('has-error');
    const i = g.querySelector('input, textarea');
    if (i) i.classList.add('is-invalid');
    if (msg) document.getElementById(eId).textContent = msg;
}
function clearError(gId) {
    const g = document.getElementById(gId);
    g.classList.remove('has-error');
    const i = g.querySelector('input, textarea');
    if (i) i.classList.remove('is-invalid');
}

// Strength bar
function getStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++; if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}
document.getElementById('regPassword').addEventListener('input', function () {
    const v = this.value, score = getStrength(v);
    const bar = document.getElementById('strengthBar');
    const lbl = document.getElementById('strengthLabel');
    const widths = ['0%', '25%', '45%', '65%', '85%', '100%'];
    const colors = ['transparent', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
    const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    bar.style.width = widths[score]; bar.style.background = colors[score];
    lbl.textContent = v.length > 0 ? labels[score] : ''; lbl.style.color = colors[score];
    if (v.length > 0) { isValidPass(v) ? clearError('passwordGroup') : setError('passwordGroup', 'passwordError', 'Min 8 chars, include a letter and a number.'); }
    else clearError('passwordGroup');
    const c = document.getElementById('regConfirm').value;
    if (c.length > 0) { c === v ? clearError('confirmGroup') : setError('confirmGroup', 'confirmError', 'Passwords do not match.'); }
});

document.getElementById('regName').addEventListener('input', function () { if (!this.value.trim()) return clearError('nameGroup'); isValidName(this.value) ? clearError('nameGroup') : setError('nameGroup', 'nameError', 'Full name must be at least 2 characters.'); });
document.getElementById('regEmail').addEventListener('input', function () { if (!this.value.trim()) return clearError('emailGroup'); isValidEmail(this.value) ? clearError('emailGroup') : setError('emailGroup', 'emailError', 'Please enter a valid email address.'); });
document.getElementById('regConfirm').addEventListener('input', function () { const p = document.getElementById('regPassword').value; if (!this.value) return clearError('confirmGroup'); this.value === p ? clearError('confirmGroup') : setError('confirmGroup', 'confirmError', 'Passwords do not match.'); });
document.getElementById('regAddress').addEventListener('input', function () { if (!this.value.trim()) return clearError('addressGroup'); isValidAddr(this.value) ? clearError('addressGroup') : setError('addressGroup', 'addressError', 'Address must be at least 10 characters.'); });

function makeToggle(btnId, inputId) {
    document.getElementById(btnId).addEventListener('click', function () {
        const inp = document.getElementById(inputId), icon = this.querySelector('i');
        inp.type === 'password' ? (inp.type = 'text', icon.classList.replace('fa-eye', 'fa-eye-slash')) : (inp.type = 'password', icon.classList.replace('fa-eye-slash', 'fa-eye'));
    });
}
makeToggle('togglePass', 'regPassword'); makeToggle('toggleConfirm', 'regConfirm');

document.getElementById('registerBtn').addEventListener('click', function () {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const conf = document.getElementById('regConfirm').value;
    const addr = document.getElementById('regAddress').value;
    const terms = document.getElementById('agreeTerms').checked;
    const alertEl = document.getElementById('regAlert');
    const termsErr = document.getElementById('termsError');
    let valid = true;

    ['nameGroup', 'emailGroup', 'passwordGroup', 'confirmGroup', 'addressGroup'].forEach(id => clearError(id));
    alertEl.className = 'alert d-none py-2 mb-3'; termsErr.classList.add('d-none');

    if (!isValidName(name)) { setError('nameGroup', 'nameError', 'Full name is required (at least 2 characters).'); valid = false; }
    if (!email) { setError('emailGroup', 'emailError', 'Email address is required.'); valid = false; }
    else if (!isValidEmail(email)) { setError('emailGroup', 'emailError', 'Please enter a valid email address.'); valid = false; }
    if (!pass) { setError('passwordGroup', 'passwordError', 'Password is required.'); valid = false; }
    else if (!isValidPass(pass)) { setError('passwordGroup', 'passwordError', 'Min 8 chars, include a letter and a number.'); valid = false; }
    if (!conf) { setError('confirmGroup', 'confirmError', 'Please confirm your password.'); valid = false; }
    else if (conf !== pass) { setError('confirmGroup', 'confirmError', 'Passwords do not match.'); valid = false; }
    if (!isValidAddr(addr)) { setError('addressGroup', 'addressError', 'Address must be at least 10 characters.'); valid = false; }
    if (!terms) { termsErr.classList.remove('d-none'); valid = false; }
    if (!valid) return;

    if (DB.findByEmail(email)) {
        alertEl.className = 'alert alert-danger py-2 mb-3';
        alertEl.textContent = '⚠ This email is already registered. Please log in.';
        alertEl.classList.remove('d-none'); return;
    }

    const newUser = {
        id: 'user_' + Date.now(),
        name: name.trim(),
        email: email.toLowerCase(),
        password: pass,
        role: 'customer',   // ← always customer on register
        address: addr.trim(),
        createdAt: new Date().toISOString()
    };
    DB.addUser(newUser);

    // Auto-login
    const { password, ...safeUser } = newUser;
    DB.saveSession(safeUser);

    alertEl.className = 'alert alert-success py-2 mb-3';
    alertEl.textContent = '✓ Account created! Redirecting to your profile…';
    alertEl.classList.remove('d-none');
    setTimeout(() => window.location.href = 'profile.html', 1400);
});

document.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('registerBtn').click(); });