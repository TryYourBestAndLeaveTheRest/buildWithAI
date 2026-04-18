const { query, run } = require('../config/database');

const Listing = {
    async getAll() {
        const sql = 'SELECT * FROM listings ORDER BY created_at DESC';
        return await query(sql);
    },

    async getByType(type) {
        const sql = 'SELECT * FROM listings WHERE type = ? ORDER BY created_at DESC';
        return await query(sql, [type]);
    },

    async create(listingData) {
        const { type, title, description, user, dorm, price } = listingData;
        const sql = `INSERT INTO listings (type, title, description, user, dorm, price) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [type, title, description, user, dorm, price];
        return await run(sql, params);
    }
};

module.exports = Listing;
