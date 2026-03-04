// ══════════════════════════════════════════════════════════════════
//  db.js  —  Shared LocalStorage "Database"
//
//  shop_users   → Array<{ id, name, email, password, role, address, createdAt }>
//  shop_session → { id, name, email, role, address, createdAt }  (no password)
//
//  Roles: "admin" | "seller" | "customer"
// ══════════════════════════════════════════════════════════════════

const DB = {

    // ── Core storage ─────────────────────────────────────────────
    getUsers() { return JSON.parse(localStorage.getItem('shop_users') || '[]'); },
    saveUsers(arr) { localStorage.setItem('shop_users', JSON.stringify(arr)); },
    getSession() { return JSON.parse(localStorage.getItem('shop_session') || 'null'); },
    saveSession(user) { localStorage.setItem('shop_session', JSON.stringify(user)); },
    clearSession() { localStorage.removeItem('shop_session'); },

    // ── User queries ──────────────────────────────────────────────
    findByEmail(email) {
        return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    },
    findById(id) {
        return this.getUsers().find(u => u.id === id);
    },

    // ── User mutations ────────────────────────────────────────────
    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    },
    updateUser(id, changes) {
        const users = this.getUsers().map(u => u.id === id ? { ...u, ...changes } : u);
        this.saveUsers(users);
        // Refresh session if it's the same user
        const session = this.getSession();
        if (session && session.id === id) {
            const { password, ...safe } = { ...session, ...changes };
            this.saveSession(safe);
        }
    },
    deleteUser(id) {
        this.saveUsers(this.getUsers().filter(u => u.id !== id));
    },

    // ── Seed dummy data on first run ──────────────────────────────
    seed() {
        if (this.getUsers().length > 0) return; // already seeded

        const users = [
            {
                id: 'user_admin_001',
                name: 'Super Admin',
                email: 'admin@shop.com',
                password: 'Admin@1234',
                role: 'admin',
                address: '1 Admin Street, Cairo, Egypt',
            },
            {
                id: 'user_seller_001',
                name: 'Ahmed Hassan',
                email: 'ahmed@seller.com',
                password: 'Seller@123',
                role: 'seller',
                address: '22 Market Road, Alexandria, Egypt',

            },
            {
                id: 'user_seller_002',
                name: 'Sara Mohamed',
                email: 'sara@seller.com',
                password: 'Seller@456',
                role: 'seller',
                address: '5 Commerce Ave, Giza, Egypt',

            },
            {
                id: 'user_customer_001',
                name: 'Mohamed Ali',
                email: 'mo@customer.com',
                password: 'Pass@1234',
                role: 'customer',
                address: '88 Nile Street, Luxor, Egypt',
            },
            {
                id: 'user_customer_002',
                name: 'Nour Ibrahim',
                email: 'nour@customer.com',
                password: 'Pass@5678',
                role: 'customer',
                address: '14 Garden City, Cairo, Egypt',
            },
            {
                id: 'user_customer_003',
                name: 'Youssef Kamal',
                email: 'youssef@customer.com',
                password: 'Pass@9999',
                role: 'customer',
                address: '3 Palm Road, Hurghada, Egypt',
            },
            {
                id: 'user_customer_004',
                name: 'Layla Adel',
                email: 'layla@customer.com',
                password: 'Pass@2024',
                role: 'customer',
                address: '9 Desert Lane, Aswan, Egypt',
            }
        ];

        this.saveUsers(users);
        console.log('%c[DB] Seeded ' + users.length + ' dummy users', 'color:#DB4444; font-weight:bold');
    }
};

// Auto-seed when this script loads
DB.seed();