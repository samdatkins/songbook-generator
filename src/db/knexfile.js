import * as dotenv from "dotenv";
import * as pg from "pg";
require("@babel/register");
require("@babel/polyfill");
require("@babel/plugin-transform-async-to-generator");

dotenv.config();
if (!process.env["DATABASE_URL_DEVELOPMENT"] && !process.env["DATABASE_URL"]) {
  dotenv.config({ path: "../../.env" });
}
export const development = {
  client: "pg",
  connection: process.env["DATABASE_URL_DEVELOPMENT"],
  migrations: {
    directory: __dirname + "/migrations",
  },
  ssl: { rejectUnauthorized: false },
};

export const production = {
  client: "pg",
  connection: process.env["DATABASE_URL"],
  migrations: {
    directory: __dirname + "/migrations",
  },
  ssl: { rejectUnauthorized: false },
};

const env = process.env["NODE_ENV"] || "development";

const pgDecimalOid = 1700;
pg.types.setTypeParser(pgDecimalOid, parseFloat);

const knex = require("knex")(env === "development" ? development : production);
knex.migrate.latest();

export default knex;
