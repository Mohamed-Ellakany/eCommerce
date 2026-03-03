  const user = DB.getSession();
    if (!user) window.location.href = 'login.html';

    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }

    const parts = (user.name || '').trim().split(' ');
    const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length-1][0] : (user.name||'?')[0];
    document.getElementById('avatarEl').textContent = initials.toUpperCase();
    document.getElementById('profileName').textContent = user.name || '—';

    const roleBadge = document.getElementById('profileRoleBadge');
    roleBadge.textContent = cap(user.role);
    roleBadge.className = 'role-badge role-' + user.role;

    document.getElementById('infoName').textContent    = user.name    || '—';
    document.getElementById('infoEmail').textContent   = user.email   || '—';
    document.getElementById('infoRole').textContent    = cap(user.role) || '—';
    document.getElementById('infoAddress').textContent = user.address || '—';

    if (user.role === 'admin') {
        document.getElementById('adminBtn').classList.remove('d-none');
        document.getElementById('adminNavItem').style.display = '';
    }

    document.getElementById('logoutBtn').addEventListener('click', function () {
        DB.clearSession();
        window.location.href = 'login.html';
    });