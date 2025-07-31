// Global variables
let wishlist = [];
let cart = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let filteredProducts = [];
let allProducts = [];

// DOM elements
const productGrid = document.getElementById('product-grid');
const searchBar = document.getElementById('search-bar');
const searchBtn = document.getElementById('search-btn');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const wishlistBtn = document.getElementById('wishlist-btn');
const wishlistCount = document.getElementById('wishlist-count');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// Modals
const productModal = document.getElementById('product-modal');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const wishlistModal = document.getElementById('wishlist-modal');
const cartModal = document.getElementById('cart-modal');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadProducts();
        if (currentUser) {
            await loadUserData();
        }
        updateAuthButtons();
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage('Failed to load application data', 'error');
    }
});

// Load products from API
async function loadProducts() {
    try {
        allProducts = await apiService.getProducts();
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
    } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to local products if API fails
        allProducts = [...products];
        filteredProducts = [...products];
        displayProducts(filteredProducts);
    }
}

// Load user-specific data
async function loadUserData() {
    try {
        if (currentUser) {
            cart = await apiService.getCart();
            wishlist = await apiService.getWishlist();
            updateCartCount();
            updateWishlistCount();
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        showMessage('Failed to load user data', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchBar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Navigation buttons
    cartBtn.addEventListener('click', showCart);
    wishlistBtn.addEventListener('click', showWishlist);
    loginBtn.addEventListener('click', showLoginModal);
    signupBtn.addEventListener('click', showSignupModal);

    // Modal close buttons
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

// Display products
function displayProducts(productsToShow) {
    productGrid.innerHTML = '';
    productsToShow.forEach(product => {
        const card = createProductCard(product);
        productGrid.appendChild(card);
    });
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductDetail(product);

    const isInWishlist = wishlist.some(item => item.product_id === product.id || item.id === product.id);
    const cartItem = cart.find(item => item.product_id === product.id || item.id === product.id);
    const isInCart = !!cartItem;
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-actions">
                <button class="btn btn-cart ${isInCart ? 'added' : ''}" 
                        onclick="event.stopPropagation(); addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i>
                    ${isInCart ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                </button>
                <button class="btn btn-wishlist ${isInWishlist ? 'added' : ''}" 
                        onclick="event.stopPropagation(); toggleWishlist(${product.id})">
                    <i class="fas fa-heart"></i>
                    ${isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
            </div>
        </div>
    `;

    return card;
}

// Show product detail modal
function showProductDetail(product) {
    const modal = document.getElementById('product-modal');
    const isInWishlist = wishlist.some(item => item.product_id === product.id || item.id === product.id);
    const cartItem = cart.find(item => item.product_id === product.id || item.id === product.id);
    const isInCart = !!cartItem;
    
    document.getElementById('modal-product-image').src = product.image;
    document.getElementById('modal-product-image').alt = product.name;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-description').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;
    
    const cartBtn = document.getElementById('modal-cart-btn');
    cartBtn.className = `btn btn-cart ${isInCart ? 'added' : ''}`;
    cartBtn.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        ${isInCart ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
    `;
    cartBtn.onclick = () => addToCart(product.id);
    
    const wishlistBtn = document.getElementById('modal-wishlist-btn');
    wishlistBtn.className = `btn btn-wishlist ${isInWishlist ? 'added' : ''}`;
    wishlistBtn.innerHTML = `
        <i class="fas fa-heart"></i>
        ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    `;
    wishlistBtn.onclick = () => toggleWishlist(product.id);
    
    modal.style.display = 'block';
}

// Handle search functionality
async function handleSearch() {
    const query = searchBar.value.trim();
    
    if (query === '') {
        filteredProducts = [...allProducts];
    } else {
        try {
            if (currentUser) {
                filteredProducts = await apiService.searchProducts(query);
            } else {
                // Fallback to local search
                filteredProducts = allProducts.filter(product => 
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.description.toLowerCase().includes(query.toLowerCase())
                );
            }
        } catch (error) {
            console.error('Search failed:', error);
            // Fallback to local search
            filteredProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase())
            );
        }
    }
    
    displayProducts(filteredProducts);
}

// Cart functionality
async function addToCart(productId) {
    if (!currentUser) {
        showMessage('Please login to add items to cart', 'error');
        showLoginModal();
        return;
    }

    try {
        await apiService.addToCart(productId, 1);
        await loadUserData(); // Refresh cart data
        displayProducts(filteredProducts); // Refresh display
        showMessage('Added to cart!', 'success');
        
        // Update modal if it's open
        if (productModal.style.display === 'block') {
            const product = allProducts.find(p => p.id === productId);
            if (product) showProductDetail(product);
        }
    } catch (error) {
        console.error('Failed to add to cart:', error);
        showMessage('Failed to add to cart', 'error');
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

async function showCart() {
    if (!currentUser) {
        showMessage('Please login to view cart', 'error');
        showLoginModal();
        return;
    }

    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        document.getElementById('cart-total').textContent = '0.00';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">
                    $${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="remove-cart" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toFixed(2);
    }
    
    modal.style.display = 'block';
}

async function updateQuantity(cartId, newQuantity) {
    if (newQuantity <= 0) {
        await removeFromCart(cartId);
        return;
    }

    try {
        await apiService.updateCartItem(cartId, newQuantity);
        await loadUserData();
        showCart(); // Refresh cart display
        displayProducts(filteredProducts); // Refresh product display
    } catch (error) {
        console.error('Failed to update quantity:', error);
        showMessage('Failed to update quantity', 'error');
    }
}

async function removeFromCart(cartId) {
    try {
        await apiService.removeFromCart(cartId);
        await loadUserData();
        showCart(); // Refresh cart display
        displayProducts(filteredProducts); // Refresh product display
        showMessage('Removed from cart!', 'success');
    } catch (error) {
        console.error('Failed to remove from cart:', error);
        showMessage('Failed to remove from cart', 'error');
    }
}

// Wishlist functionality
async function toggleWishlist(productId) {
    if (!currentUser) {
        showMessage('Please login to manage wishlist', 'error');
        showLoginModal();
        return;
    }

    const isInWishlist = wishlist.some(item => item.product_id === productId || item.id === productId);
    
    try {
        if (isInWishlist) {
            await apiService.removeFromWishlist(productId);
            showMessage('Removed from wishlist!', 'success');
        } else {
            await apiService.addToWishlist(productId);
            showMessage('Added to wishlist!', 'success');
        }
        
        await loadUserData();
        displayProducts(filteredProducts);
        
        // Update modal if it's open
        if (productModal.style.display === 'block') {
            const product = allProducts.find(p => p.id === productId);
            if (product) showProductDetail(product);
        }
    } catch (error) {
        console.error('Failed to update wishlist:', error);
        showMessage('Failed to update wishlist', 'error');
    }
}

function updateWishlistCount() {
    wishlistCount.textContent = wishlist.length;
}

async function showWishlist() {
    if (!currentUser) {
        showMessage('Please login to view wishlist', 'error');
        showLoginModal();
        return;
    }

    const modal = document.getElementById('wishlist-modal');
    const wishlistItems = document.getElementById('wishlist-items');
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<div class="empty-wishlist">Your wishlist is empty</div>';
    } else {
        wishlistItems.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="remove-wishlist" onclick="removeFromWishlist(${item.product_id || item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

async function removeFromWishlist(productId) {
    try {
        await apiService.removeFromWishlist(productId);
        await loadUserData();
        showWishlist(); // Refresh wishlist display
        displayProducts(filteredProducts); // Refresh product display
        showMessage('Removed from wishlist!', 'success');
    } catch (error) {
        console.error('Failed to remove from wishlist:', error);
        showMessage('Failed to remove from wishlist', 'error');
    }
}

// Authentication
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function showSignupModal() {
    document.getElementById('signup-modal').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await apiService.login({ username, password });
        currentUser = response.user;
        await loadUserData();
        updateAuthButtons();
        document.getElementById('login-modal').style.display = 'none';
        showMessage(`Welcome back, ${currentUser.username}!`, 'success');
        displayProducts(filteredProducts); // Refresh display
    } catch (error) {
        console.error('Login failed:', error);
        showMessage(error.message || 'Login failed', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await apiService.register({ username, email, password });
        currentUser = response.user;
        await loadUserData();
        updateAuthButtons();
        document.getElementById('signup-modal').style.display = 'none';
        showMessage(`Welcome, ${currentUser.username}!`, 'success');
        displayProducts(filteredProducts); // Refresh display
    } catch (error) {
        console.error('Signup failed:', error);
        showMessage(error.message || 'Signup failed', 'error');
    }
}

function handleLogout() {
    apiService.logout();
    currentUser = null;
    cart = [];
    wishlist = [];
    updateAuthButtons();
    updateCartCount();
    updateWishlistCount();
    displayProducts(filteredProducts);
    showMessage('Logged out successfully', 'success');
}

function updateAuthButtons() {
    if (currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Logout (${currentUser.username})</span>`;
        loginBtn.onclick = handleLogout;
        signupBtn.style.display = 'none';
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i><span>Login</span>';
        loginBtn.onclick = showLoginModal;
        signupBtn.style.display = 'block';
        signupBtn.onclick = showSignupModal;
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentElement) {
            messageEl.remove();
        }
    }, 5000);
}

