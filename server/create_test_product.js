import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

// Safety: this script writes to whatever database MONGO_URI points at
if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("Refusing to run against production. Re-run with --force if you really mean it.");
    process.exit(1);
}


dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await Product.findById('000000000000000000000001');
  if (existing) {
    console.log('Test product already exists');
  } else {
    const product = new Product({
      _id: '000000000000000000000001',
      name: 'Test Product',
      category: 'shirt',
      fabric: 'cotton',
      style: 'plain',
      price: 100,
      originalPrice: 120,
      discount: 20,
      shippingCost: 10,
      imageUrl: 'http://example.com/image.jpg',
      images: [],
      sizes: ['S', 'M', 'L'],
      stock: 5,
    });
    await product.save();
    console.log('Test product created');
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error creating test product', err);
  process.exit(1);
});
