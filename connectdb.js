const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();
    try {
        const pool = new Pool({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
        });
        const query = (text, params) => {
            console.log('Executing query:', text);
            return pool.query(text, params);
        }

        module.exports = { query };
    } catch (error) {
        console.log(error)
    }

 

