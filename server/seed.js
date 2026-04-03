import "dotenv/config";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

const resetAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Remove the insecure default admin
    const deleted = await Admin.deleteOne({ username: "admin" });
    if (deleted.deletedCount > 0) {
        console.log("✅ Removed insecure default admin (admin/admin123)");
    } else {
        console.log("⚠️  Default admin 'admin' not found — may already be removed");
    }

    // Create a new secure admin from environment variables
    const newUsername = process.env.ADMIN_USERNAME || "extractadmin";
    const newPassword = process.env.ADMIN_PASSWORD || "Extract@2026!Secure";

    const existing = await Admin.findOne({ username: newUsername });
    if (existing) {
        console.log(`ℹ️  Admin '${newUsername}' already exists — skipping creation`);
    } else {
        await Admin.create({ username: newUsername, password: newPassword, role: "admin" });
        console.log(`✅ New admin created — username: ${newUsername}`);
        console.log(`   Password: ${newPassword}`);
        console.log(`   ⚠️  CHANGE THIS PASSWORD after first login!`);
    }

    // List all admins for verification
    const admins = await Admin.find().select("-password");
    console.log(`\n📋 Current admins in DB: ${admins.length}`);
    admins.forEach((a) => console.log(`   - ${a.username} (role: ${a.role})`));

    process.exit(0);
};

resetAdmin().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
