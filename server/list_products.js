import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    shippingCost: Number,
    stock: Number,
});

const Product = mongoose.model('Product', productSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({});
        console.log("PRODUCTS:");
        console.log(JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
