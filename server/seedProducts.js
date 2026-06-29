import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/Product.js";

const products = [
    // SHIRTS
    {
        name: "Classic Linen Azure Shirt",
        category: "shirt",
        fabric: "Linen",
        style: "Casual",
        price: 1899,
        originalPrice: 2499,
        discount: 24,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80"
        ],
        sizes: ["S", "M", "L", "XL"],
        stock: 45
    },
    {
        name: "Premium Oxford White Shirt",
        category: "shirt",
        fabric: "Oxford",
        style: "Formal",
        price: 2199,
        originalPrice: 2999,
        discount: 26,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
            "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&q=80"
        ],
        sizes: ["M", "L", "XL"],
        stock: 30
    },
    {
        name: "Textured Twill Midnight Shirt",
        category: "shirt",
        fabric: "Twill",
        style: "Semi-Formal",
        price: 1999,
        originalPrice: 2699,
        discount: 25,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 25
    },
    {
        name: "Luxe Satin Evening Shirt",
        category: "shirt",
        fabric: "Satin",
        style: "Evening",
        price: 2499,
        originalPrice: 3499,
        discount: 28,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80"
        ],
        sizes: ["S", "M", "L", "XL"],
        stock: 15
    },
    {
        name: "Denim Utility Casual Shirt",
        category: "shirt",
        fabric: "Oxford",
        style: "Casual",
        price: 1799,
        originalPrice: 2299,
        discount: 21,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80"
        ],
        sizes: ["M", "L", "XL"],
        stock: 50
    },

    // TROUSERS
    {
        name: "Slim Fit Sand Chinos",
        category: "trouser",
        fabric: "Twill",
        style: "Casual",
        price: 2299,
        originalPrice: 3299,
        discount: 30,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80"
        ],
        sizes: ["30", "32", "34", "36"],
        stock: 35
    },
    {
        name: "Tailored Navy Woolen Trouser",
        category: "trouser",
        fabric: "Twill",
        style: "Formal",
        price: 2799,
        originalPrice: 3999,
        discount: 30,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80"
        ],
        sizes: ["30", "32", "34", "36", "38"],
        stock: 20
    },
    {
        name: "Relaxed Linen Drawstring Trouser",
        category: "trouser",
        fabric: "Linen",
        style: "Casual",
        price: 1999,
        originalPrice: 2799,
        discount: 28,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80"
        ],
        sizes: ["S", "M", "L", "XL"],
        stock: 40
    },
    {
        name: "Classic Charcoal Pleated Trouser",
        category: "trouser",
        fabric: "Twill",
        style: "Formal",
        price: 2599,
        originalPrice: 3599,
        discount: 27,
        shippingCost: 0,
        imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"
        ],
        sizes: ["32", "34", "36"],
        stock: 18
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding products...");
        
        // Count existing products
        const count = await Product.countDocuments();
        if (count > 0) {
            console.log(`Database already has ${count} products. Skipping seeding.`);
        } else {
            await Product.insertMany(products);
            console.log("✅ Seeded database with premium Menswear products!");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding database:", err.message);
        process.exit(1);
    }
};

seedDB();
