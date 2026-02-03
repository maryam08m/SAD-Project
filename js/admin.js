// API Client for Pick & Bite
const API_BASE_URL = 'http://localhost:8000';

// API Client class
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authentication token
  getToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null;
  }

  // Store authentication token
  setToken(token, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem('accessToken', token);
    } else {
      sessionStorage.setItem('accessToken', token);
    }
  }

  // Remove authentication token
  removeToken() {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }

  // Get authorization headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.requireAuth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });
  }

  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async forgotPassword(phone) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      requireAuth: false,
    });
  }

  // Cart methods
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(itemData) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async removeFromCart(itemId) {
    return this.request(`/cart/remove/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  // Order methods
  async checkout(notes = null) {
    const body = notes ? { notes } : {};
    return this.request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  // Custom items methods
  async createCustomPizza(pizzaData) {
    return this.request('/custom/pizza', {
      method: 'POST',
      body: JSON.stringify(pizzaData),
    });
  }

  async createCustomBurger(burgerData) {
    return this.request('/custom/burger', {
      method: 'POST',
      body: JSON.stringify(burgerData),
    });
  }

  // Menu methods (if needed)
  async getMenuItems(category = null) {
    const endpoint = category ? `/menu/items?category=${category}` : '/menu/items';
    return this.request(endpoint, { requireAuth: false });
  }

  async getMenuItem(itemId) {
    return this.request(`/menu/items/${itemId}`, { requireAuth: false });
  }

  // Admin methods
  async createMenuItem(itemData) {
    return this.request('/admin/menu-items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async getAllOrders() {
    return this.request('/admin/orders');
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/admin/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Helper function to check if user is authenticated
function isAuthenticated() {
  return !!apiClient.getToken();
}

// Helper function to get current user info (with caching)
let currentUserCache = null;
async function getCurrentUserInfo() {
  if (!isAuthenticated()) {
    return null;
  }

  if (currentUserCache) {
    return currentUserCache;
  }

  try {
    currentUserCache = await apiClient.getCurrentUser();
    return currentUserCache;
  } catch (error) {
    console.error('Failed to get current user:', error);
    // If token is invalid, remove it
    apiClient.removeToken();
    return null;
  }
}

// Clear user cache (call this on logout)
function clearUserCache() {
  currentUserCache = null;
}

