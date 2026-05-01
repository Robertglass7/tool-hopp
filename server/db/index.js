import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing! Please set it in your Railway service variables.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

export const db = drizzle(connection, { schema, mode: "default" });
