import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import Product from "./models/Product.js";

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding products...");
        
        await Product.deleteMany({});
        console.log("Cleared existing products");
        
        const products = JSON.parse(fs.readFileSync("products_data.json", "utf-8"));
        
        await Product.insertMany(products);
        console.log(`Inserted ${products.length} products`);
        
        process.exit(0);
    } catch (err) {
        console.error("Error seeding database:", err.message);
        process.exit(1);
    }
};

seedDB();
