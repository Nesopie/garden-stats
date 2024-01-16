import knex from "knex";
import { Client } from "pg";
import { Sequelize } from "sequelize";

require("dotenv").config();

// export const sequelize = new Sequelize(process.env.DB_CONNECTION_STRING, {
//     ssl: false,
// });

export const pg = knex({
    client: "pg",
    connection: {
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        // connectionString: process.env.DB_CONNECTION_STRING,
        ssl: {
            rejectUnauthorized: false,
        },
    },
});
