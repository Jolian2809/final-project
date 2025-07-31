// API Service for Football Shop
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set authorization header
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Handle API responses
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }
        return response.json();
    }

    // Authentication
    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userData)
        });
        const data = await this.handleResponse(response);
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        return data;
    }

    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(credentials)
        });
        const data = await this.handleResponse(response);
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Products
    async getProducts() {
        const response = await fetch(`${this.baseURL}/products`);
        return this.handleResponse(response);
    }

    async searchProducts(query) {
        const response = await fetch(`${this.baseURL}/products/search?q=${encodeURIComponent(query)}`);
        return this.handleResponse(response);
    }

    // Cart
    async getCart() {
        const response = await fetch(`${this.baseURL}/cart`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addToCart(productId, quantity = 1) {
        const response = await fetch(`${this.baseURL}/cart`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ product_id: productId, quantity })
        });
        return this.handleResponse(response);
    }

    async updateCartItem(cartId, quantity) {
        const response = await fetch(`${this.baseURL}/cart/${cartId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ quantity })
        });
        return this.handleResponse(response);
    }

    async removeFromCart(cartId) {
        const response = await fetch(`${this.baseURL}/cart/${cartId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Wishlist
    async getWishlist() {
        const response = await fetch(`${this.baseURL}/wishlist`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addToWishlist(productId) {
        const response = await fetch(`${this.baseURL}/wishlist`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ product_id: productId })
        });
        return this.handleResponse(response);
    }

    async removeFromWishlist(productId) {
        const response = await fetch(`${this.baseURL}/wishlist/${productId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

// Create global API service instance
const apiService = new ApiService();

