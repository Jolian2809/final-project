const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import lowdb
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../panda_jersey_shop")));

// Database setup with lowdb
const adapter = new JSONFile('./database.json');
const db = new Low(adapter, {});

// Initialize database
async function initializeDatabase() {
    await db.read();
    
    // Set default data if database is empty
    if (!db.data) {
        db.data = {
            users: [],
            products: [],
            cart: [],
            wishlist: []
        };
    }

    // Ensure all arrays exist
    if (!db.data.users) db.data.users = [];
    if (!db.data.products) db.data.products = [];
    if (!db.data.cart) db.data.cart = [];
    if (!db.data.wishlist) db.data.wishlist = [];

    // Insert sample products if products array is empty
    if (db.data.products.length === 0) {
        const products = [
            { id: 1, name: "Arsenal Home Jersey", description: "Official Arsenal home jersey 2024/25 season. Premium quality with Emirates sponsor.", price: 89.99, image: "images/arsenal_jersey.jpg", stock: 100 },
            { id: 2, name: "Manchester City Home Jersey", description: "Official Manchester City home jersey. Sky blue with Etihad Airways sponsor.", price: 94.99, image: "images/manchester_city_jersey.jpg", stock: 100 },
            { id: 3, name: "Liverpool Home Jersey", description: "Official Liverpool home jersey. Classic red with Standard Chartered sponsor.", price: 92.99, image: "images/liverpool_jersey.jpg", stock: 100 },
            { id: 4, name: "Manchester United Home Jersey", description: "Official Manchester United home jersey. Classic red with TeamViewer sponsor.", price: 96.99, image: "images/manchester_united_jersey.jpg", stock: 100 },
            { id: 5, name: "Barcelona Away Jersey", description: "Official FC Barcelona away jersey. Unique design with Spotify sponsor.", price: 98.99, image: "images/barcelona_jersey.webp", stock: 100 },
            { id: 6, name: "Football Ball", description: "Official size and weight football ball, perfect for training and matches.", price: 29.99, image: "images/soccer_ball.jpg", stock: 100 },
            { id: 7, name: "Football Boots", description: "High-performance football boots for optimal grip and agility on the field.", price: 79.99, image: "images/soccer_cleats.jpg", stock: 100 },
            { id: 8, name: "Goalkeeper Gloves", description: "Durable goalkeeper gloves with excellent grip and padding for protection.", price: 39.50, image: "images/goalkeeper_gloves.jpg", stock: 100 },
            { id: 9, name: "Shin Guards", description: "Lightweight and protective shin guards for ultimate safety during play.", price: 19.99, image: "images/shin_guards.jpg", stock: 100 },
            { id: 10, name: "Football Bag", description: "Spacious football bag with separate compartments for ball, shoes, and gear.", price: 35.00, image: "images/soccer_bag.jpg", stock: 100 }
        ];
        
        db.data.products = products;
        await db.write();
    }
}

// Helper functions for database operations
function getNextId(collection) {
    if (!collection || collection.length === 0) return 1;
    return Math.max(...collection.map(item => item.id)) + 1;
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

// Routes

// Get all products
app.get("/api/products", async (req, res) => {
    try {
        await db.read();
        res.json(db.data.products || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search products
app.get("/api/products/search", async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: "Search query required" });
    }
    
    try {
        await db.read();
        const products = db.data.products || [];
        const results = products.filter(product => 
            product.name.toLowerCase().includes(q.toLowerCase()) ||
            product.description.toLowerCase().includes(q.toLowerCase())
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User registration
app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
    }

    try {
        await db.read();
        
        // Check if user already exists
        const users = db.data.users || [];
        const existingUser = users.find(user => 
            user.username === username || user.email === email
        );
        
        if (existingUser) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = getNextId(users);
        
        const newUser = {
            id: newUserId,
            username,
            email,
            password: hashedPassword,
            created_at: new Date().toISOString()
        };
        
        db.data.users.push(newUser);
        await db.write();
                
        const token = jwt.sign({ id: newUserId, username }, JWT_SECRET, { expiresIn: "24h" });
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: newUserId, username, email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User login
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        await db.read();
        const users = db.data.users || [];
        const user = users.find(u => u.username === username);
            
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user cart
app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
        await db.read();
        const cartItems = (db.data.cart || []).filter(item => item.user_id === req.user.id);
        
        // Join with products to get product details
        const cartWithProducts = cartItems.map(cartItem => {
            const product = (db.data.products || []).find(p => p.id === cartItem.product_id);
            return {
                ...cartItem,
                name: product?.name,
                description: product?.description,
                price: product?.price,
                image: product?.image
            };
        });
        
        res.json(cartWithProducts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to cart
app.post("/api/cart", authenticateToken, async (req, res) => {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: "Product ID is required" });
    }

    try {
        await db.read();
        const cart = db.data.cart || [];
        const existingItemIndex = cart.findIndex(item => 
            item.user_id === req.user.id && item.product_id === product_id
        );

        if (existingItemIndex !== -1) {
            // Update quantity
            db.data.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            const newCartItem = {
                id: getNextId(cart),
                user_id: req.user.id,
                product_id,
                quantity,
                created_at: new Date().toISOString()
            };
            db.data.cart.push(newCartItem);
        }
        
        await db.write();
        res.json({ message: "Item added to cart successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update cart item quantity
app.put("/api/cart/:id", authenticateToken, async (req, res) => {
    const { quantity } = req.body;
    const cartId = parseInt(req.params.id);

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid quantity is required" });
    }

    try {
        await db.read();
        const cart = db.data.cart || [];
        const cartItemIndex = cart.findIndex(item => 
            item.id === cartId && item.user_id === req.user.id
        );
        
        if (cartItemIndex === -1) {
            return res.status(404).json({ error: "Cart item not found" });
        }
        
        db.data.cart[cartItemIndex].quantity = quantity;
        await db.write();
        res.json({ message: "Cart item updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from cart
app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    const cartId = parseInt(req.params.id);

    try {
        await db.read();
        const cart = db.data.cart || [];
        const cartItemIndex = cart.findIndex(item => 
            item.id === cartId && item.user_id === req.user.id
        );
        
        if (cartItemIndex === -1) {
            return res.status(404).json({ error: "Cart item not found" });
        }
        
        db.data.cart.splice(cartItemIndex, 1);
        await db.write();
        res.json({ message: "Item removed from cart successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user wishlist
app.get("/api/wishlist", authenticateToken, async (req, res) => {
    try {
        await db.read();
        const wishlistItems = (db.data.wishlist || []).filter(item => item.user_id === req.user.id);
        
        // Join with products to get product details
        const wishlistWithProducts = wishlistItems.map(wishlistItem => {
            const product = (db.data.products || []).find(p => p.id === wishlistItem.product_id);
            return {
                ...wishlistItem,
                name: product?.name,
                description: product?.description,
                price: product?.price,
                image: product?.image
            };
        });
        
        res.json(wishlistWithProducts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to wishlist
app.post("/api/wishlist", authenticateToken, async (req, res) => {
    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: "Product ID is required" });
    }

    try {
        await db.read();
        const wishlist = db.data.wishlist || [];
        
        // Check if item already exists in wishlist
        const existingItem = wishlist.find(item => 
            item.user_id === req.user.id && item.product_id === product_id
        );
        
        if (!existingItem) {
            const newWishlistItem = {
                id: getNextId(wishlist),
                user_id: req.user.id,
                product_id,
                created_at: new Date().toISOString()
            };
            db.data.wishlist.push(newWishlistItem);
            await db.write();
        }
        
        res.json({ message: "Item added to wishlist successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from wishlist
app.delete("/api/wishlist/:product_id", authenticateToken, async (req, res) => {
    const productId = parseInt(req.params.product_id);

    try {
        await db.read();
        const wishlist = db.data.wishlist || [];
        const wishlistItemIndex = wishlist.findIndex(item => 
            item.user_id === req.user.id && item.product_id === productId
        );
        
        if (wishlistItemIndex === -1) {
            return res.status(404).json({ error: "Wishlist item not found" });
        }
        
        db.data.wishlist.splice(wishlistItemIndex, 1);
        await db.write();
        res.json({ message: "Item removed from wishlist successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../panda_jersey_shop/index.html"));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Panda Jersey Backend running on http://localhost:${PORT}` );
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
});
