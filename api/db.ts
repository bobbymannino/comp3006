import { connect } from "mongoose";
import { config } from "dotenv";

// Loads env variables
config({ path: "../.env" });

const url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

/** The MongoDB connection */
export const db = await connect(url);
