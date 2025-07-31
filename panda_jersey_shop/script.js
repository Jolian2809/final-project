// Global variables
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let filteredProducts = [...products];

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
document.addEventListener('DOMContentLoaded', function() {
    displayProducts(products);
    updateWishlistCount();
    updateCartCount();
    updateAuthButtons();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchBar.addEventListener('input', handleSearch);
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
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

// Display products in the grid
function displayProducts(productsToShow) {
    productGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productGrid.innerHTML = '<div class="no-products">No products found matching your search.</div>';
        return;
    }

    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Create a product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductDetail(product);

    const isInWishlist = wishlist.some(item => item.id === product.id);
    const cartItem = cart.find(item => item.id === product.id);
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
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const cartItem = cart.find(item => item.id === product.id);
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
function handleSearch() {
    const searchTerm = searchBar.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProducts(filteredProducts);
}

// Toggle wishlist item
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showMessage('Removed from wishlist!', 'success');
    } else {
        wishlist.push(product);
        showMessage('Added to wishlist!', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    updateCartCount(); // Also update cart count in case of changes
    displayProducts(filteredProducts); // Refresh the display
    
    // Update modal if it's open
    if (productModal.style.display === 'block') {
        showProductDetail(product);
    }
}

// Update wishlist count display
function updateWishlistCount() {
    wishlistCount.textContent = wishlist.length;
}

// Show wishlist modal
function showWishlist() {
    const modal = document.getElementById('wishlist-modal');
    const wishlistItems = document.getElementById('wishlist-items');
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<div class="empty-wishlist">Your wishlist is empty</div>';
    } else {
        wishlistItems.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-name">${item.name}</div>
                    <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="remove-wishlist" onclick="removeFromWishlist(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

// Remove item from wishlist
function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    updateCartCount(); // Also update cart count in case of changes
    showWishlist(); // Refresh wishlist display
    displayProducts(filteredProducts); // Refresh product display
    showMessage('Removed from wishlist!', 'success');
}

// Show login modal
function showLoginModal() {
    if (currentUser) {
        logout();
    } else {
        document.getElementById('login-modal').style.display = 'block';
    }
}

// Show signup modal
function showSignupModal() {
    document.getElementById('signup-modal').style.display = 'block';
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthButtons();
        document.getElementById('login-modal').style.display = 'none';
        showMessage(`Welcome back, ${user.username}!`, 'success');
        document.getElementById('login-form').reset();
    } else {
        showMessage('Invalid username or password!', 'error');
    }
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // Check if username already exists
    if (users.some(u => u.username === username)) {
        showMessage('Username already exists!', 'error');
        return;
    }
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showMessage('Email already registered!', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username,
        email,
        password
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateAuthButtons();
    document.getElementById('signup-modal').style.display = 'none';
    showMessage(`Account created successfully! Welcome, ${username}!`, 'success');
    document.getElementById('signup-form').reset();
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthButtons();
    showMessage('Logged out successfully!', 'success');
}

// Update authentication buttons
function updateAuthButtons() {
    if (currentUser) {
        loginBtn.innerHTML = `
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout (${currentUser.username})</span>
        `;
        signupBtn.style.display = 'none';
    } else {
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span>Login</span>
        `;
        signupBtn.style.display = 'flex';
    }
}

// Show message
function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(message, mainContent.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Add some demo users for testing
if (users.length === 0) {
    users = [
        {
            id: 1,
            username: 'demo',
            email: 'demo@example.com',
            password: 'demo123'
        },
        {
            id: 2,
            username: 'admin',
            email: 'admin@soccershop.com',
            password: 'admin123'
        }
    ];
    localStorage.setItem('users', JSON.stringify(users));
}

// Add keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modal
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add loading states for better UX
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<span class="loading"></span>';
    element.disabled = true;
    
    return function hideLoading() {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Performance optimization: Debounce search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search
const debouncedSearch = debounce(handleSearch, 300);
searchBar.addEventListener('input', debouncedSearch);



// Cart functionality
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showMessage('Quantity updated in cart!', 'success');
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
        showMessage('Added to cart!', 'success');
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayProducts(filteredProducts); // Refresh the display
    
    // Update modal if it's open
    if (productModal.style.display === 'block') {
        showProductDetail(product);
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function showCart() {
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
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
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

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showCart(); // Refresh cart display
        displayProducts(filteredProducts); // Refresh product display
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart(); // Refresh cart display
    displayProducts(filteredProducts); // Refresh product display
    showMessage('Removed from cart!', 'success');
}

