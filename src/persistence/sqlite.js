const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';

let db;

function init() {
    const dirName = path.dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    db = new Database(location);

    if (process.env.NODE_ENV !== 'test') {
        console.log(`Using sqlite database at ${location}`);
    }

    db.prepare(`
        CREATE TABLE IF NOT EXISTS todo_items (
            id TEXT PRIMARY KEY,
            name TEXT,
            completed INTEGER
        )
    `).run();

    return Promise.resolve();
}

function teardown() {
    if (db) {
        db.close();
    }
    return Promise.resolve();
}

function getItems() {
    const rows = db.prepare('SELECT * FROM todo_items').all();
    return Promise.resolve(
        rows.map(item => ({
            ...item,
            completed: item.completed === 1,
        }))
    );
}

function getItem(id) {
    const row = db
        .prepare('SELECT * FROM todo_items WHERE id = ?')
        .get(id);

    if (!row) return Promise.resolve(undefined);

    return Promise.resolve({
        ...row,
        completed: row.completed === 1,
    });
}

function storeItem(item) {
    db.prepare(
        'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)'
    ).run(item.id, item.name, item.completed ? 1 : 0);

    return Promise.resolve();
}

function updateItem(id, item) {
    db.prepare(
        'UPDATE todo_items SET name = ?, completed = ? WHERE id = ?'
    ).run(item.name, item.completed ? 1 : 0, id);

    return Promise.resolve();
}

function removeItem(id) {
    db.prepare(
        'DELETE FROM todo_items WHERE id = ?'
    ).run(id);

    return Promise.resolve();
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
