// ══════════════════════════════════════════════════════════════════
//  login.js — Uses DB (API-backed) with async/await
// ══════════════════════════════════════════════════════════════════

// Redirect if already logged in
const session = DB.getSession();
if (session) {
    window.location.href = session.role === 'admin'
        ? '../../pages/admin/admin-dashboard.html'
        : session.role === 'seller'
            ? '../../pages/seller/seller_dashboard.html'
            : '../../pages/landpage/Profile.html';
}

const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function setError(groupId, errorId, msg) {
    const grp = document.getElementById(groupId);
    grp.classList.add('has-error');
    const inp = grp.querySelector('input');
    if (inp) inp.classList.add('is-invalid');
    if (msg) document.getElementById(errorId).textContent = msg;
}

function clearError(groupId) {
    const grp = document.getElementById(groupId);
    grp.classList.remove('has-error');
    const inp = grp.querySelector('input');
    if (inp) inp.classList.remove('is-invalid');
}

// ── Live validation ───────────────────────────────────────────────
document.getElementById('loginEmail').addEventListener('input', function () {
    if (!this.value.trim()) return clearError('emailGroup');
    isValidEmail(this.value)
        ? clearError('emailGroup')
        : setError('emailGroup', 'emailError', 'Please enter a valid email.');
});

document.getElementById('loginPassword').addEventListener('input', function () {
    this.value
        ? clearError('passwordGroup')
        : setError('passwordGroup', 'passwordError', 'Password is required.');
});

// ── Login handler ─────────────────────────────────────────────────
document.getElementById('loginBtn').addEventListener('click', async function () {
    const email    = document.getElementById('loginEmail').value.trim();
    const pass     = document.getElementById('loginPassword').value;
    const alertEl  = document.getElementById('loginAlert');
    const loginBtn = this;
    let valid = true;

    clearError('emailGroup');
    clearError('passwordGroup');
    alertEl.className = 'alert alert-danger d-none py-2 mb-3';

    // Validate inputs
    if (!email) {
        setError('emailGroup', 'emailError', 'Email is required.');
        valid = false;
    } else if (!isValidEmail(email)) {
        setError('emailGroup', 'emailError', 'Please enter a valid email.');
        valid = false;
    }
    if (!pass) {
        setError('passwordGroup', 'passwordError', 'Password is required.');
        valid = false;
    }
    if (!valid) return;

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in…';

    try {
        const user = await DB.findByEmail(email);

        if (!user) {
            alertEl.textContent = '⚠ No account found with this email.';
            alertEl.classList.remove('d-none');
            return;
        }

        if (user.password !== pass) {
            alertEl.textContent = '⚠ Incorrect password. Please try again.';
            alertEl.classList.remove('d-none');
            return;
        }

        // Save session without password
        const { password, ...safeUser } = user;
        DB.saveSession(safeUser);

        alertEl.className = 'alert alert-success py-2 mb-3';
        alertEl.textContent = `✓ Welcome back, ${user.name}! Redirecting…`;
        alertEl.classList.remove('d-none');

        setTimeout(() => {
            window.location.href = safeUser.role === 'admin'
                ? '../../pages/admin/admin-dashboard.html'
                : safeUser.role === 'seller'
                    ? '../../pages/seller/seller_dashboard.html'
                    : '../../pages/landpage/Profile.html';
        }, 500);

    } catch (err) {
        console.error('Login error:', err);
        alertEl.textContent = '⚠ Server error. Make sure JSON Server is running.';
        alertEl.classList.remove('d-none');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Sign In';
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});