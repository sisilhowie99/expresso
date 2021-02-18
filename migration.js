const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS Employee (
            id INTEGER NOT NULL PRIMARY KEY,
            name TEXT REQUIRED,
            position TEXT REQUIRED,
            wage INTEGER REQUIRED,
            is_current_employee INTEGER DEFAULT 1
        )`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS Timesheet (
            id INTEGER NOT NULL PRIMARY KEY,
            hours INTEGER REQUIRED,
            rate INTEGER REQUIRED,
            date INTEGER REQUIRED,
            employee_id INTEGER REQUIRED,
            FOREIGN KEY (employee_id) REFERENCES Employee (id)
        )`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS Menu (
            id INTEGER NOT NULL PRIMARY KEY,
            title TEXT REQUIRED
        )`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS MenuItem (
            id INTEGER NOT NULL PRIMARY KEY,
            name TEXT REQUIRED,
            description TEXT,
            inventory INTEGER REQUIRED,
            price INTEGER REQUIRED,
            menu_id INTEGER REQUIRED,
            FOREIGN KEY (menu_id) REFERENCES Menu (id)
        )`
    )
})