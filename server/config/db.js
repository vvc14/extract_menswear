import mongoose from "mongoose";

const MAX_ATTEMPTS = 5;

// Connect with retries: after a cold start (free hosting tiers, Atlas M0) the first attempt
// can time out. Throws after the last attempt so the caller can exit and let the host restart.
const connectDB = async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                maxPoolSize: 20,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            });
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            console.error(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
            if (attempt === MAX_ATTEMPTS) throw error;
            await new Promise((r) => setTimeout(r, attempt * 2000));
        }
    }
};

mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"));

export default connectDB;
