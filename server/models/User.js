import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        addresses: [
            {
                name: { type: String, required: true, trim: true },
                phone: {
                    type: String,
                    required: true,
                    trim: true,
                    validate: {
                        validator: function(v) {
                            return /^\d{10}$/.test(v);
                        },
                        message: props => `${props.value} is not a valid 10-digit phone number!`
                    }
                },
                street: { type: String, required: true, trim: true },
                city: { type: String, required: true, trim: true },
                state: { type: String, required: true, trim: true },
                pincode: {
                    type: String,
                    required: true,
                    trim: true,
                    validate: {
                        validator: function(v) {
                            return /^\d{6}$/.test(v);
                        },
                        message: props => `${props.value} is not a valid 6-digit numeric pincode!`
                    }
                },
                country: { type: String, required: true, default: "India", trim: true },
                isDefault: { type: Boolean, default: false },
            }
        ],
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for fast queries at scale
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);
