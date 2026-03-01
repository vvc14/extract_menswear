import "dotenv/config";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Admin.findOne({ username: "admin" });
    if (existing) {
        console.log("Admin user already exists");
    } else {
        await Admin.create({ username: "admin", password: "admin123", role: "admin" });
        console.log("Admin user created — username: admin, password: admin123");
    }

    process.exit(0);
};

seed();
