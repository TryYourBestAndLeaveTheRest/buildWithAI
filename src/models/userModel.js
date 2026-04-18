const { get, run } = require('../config/database');

const User = {
    async create(userData) {
        const { name, email, dorm } = userData;
        const sql = `INSERT INTO users (name, email, dorm) VALUES (?, ?, ?)`;
        const params = [name, email, dorm];
        return await run(sql, params);
    },

    async getByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return await get(sql, [email]);
    },

    async getFirst() {
        // For current mock dashboard logic
        const sql = 'SELECT * FROM users LIMIT 1';
        return await get(sql);
    }
};

module.exports = User;
