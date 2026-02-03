const API_URL = '/api';

/**
 * Helper: Format Price
 * Adds commas to numbers (e.g., 10000 -> 10,000)
 */
function formatPrice(price) {
    return price.toLocaleString('fa-IR'); // Uses Persian digits if browser supports
}

/**
 * 1. LOAD PRODUCTS FUNCTION
 * Fetches products from the backend and renders them.
 */
async function loadProducts(containerId, category = null, limit = null) {
    const container = document.querySelector(containerId);
    if (!container) return; // Exit if container doesn't exist on this page

    try {
        // Build URL
        let url = `${API_URL}/products`;
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        
        if (params.toString()) url += `?${params.toString()}`;

        // Fetch Data
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        let products = await response.json();

        // Handle Limit (for Main Home Page)
        if (limit && products.length > limit) {
            products = products.slice(0, limit);
        }

        container.innerHTML = ''; // Clear loading text

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%">محصولی یافت نشد.</p>';
            return;
        }

        // Build HTML String (Faster than innerHTML += inside loop)
        let htmlContent = '';

        products.forEach(product => {
            // Escape single quotes to prevent bugs in the onclick attribute
            const safeName = product.name.replace(/'/g, "\\'");
            const safeImage = product.image.replace(/'/g, "\\'");
            
            htmlContent += `
                <div class="pro1">
                    <a href="#">
                        <img src="${product.image}" class="product-img" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
                    </a>
                    <div class="des">
                        <h5>${product.name}</h5>
                        ${product.weight ? `<div class="product-weight"><i class="fas fa-weight-hanging"></i> <span>وزن: ${product.weight} گرم</span></div>` : ''}
                        <p>${formatPrice(product.price)} تومان</p>
                        
                        <button class="shopping-pro" onclick="addToCart('${safeName}', ${product.price}, '${safeImage}', ${product.weight || 0}, ${product.id})">
                            <img src="images/Logo-and-SVGs/plus.svg" alt="Add">
                        </button>
                    </div>
                </div>
            `;
        });

        // Update DOM once
        container.innerHTML = htmlContent;

    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p style="text-align:center; color:red; width:100%">خطا در بارگذاری اطلاعات.</p>';
    }
}

/**
 * 2. ADD TO CART FUNCTION
 * Saves the item to LocalStorage.
 */
function addToCart(name, price, image, weight, id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Safety check: Ensure cart is an array
    if (!Array.isArray(cart)) cart = [];

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, weight, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update the UI immediately
    alert('محصول به سبد خرید اضافه شد');
    updateCartBadge();
}

/**
 * 3. UPDATE CART BADGE
 * Updates the red number on the shopping cart icon.
 */
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (!Array.isArray(cart)) return;

    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const cartBtn = document.querySelector('.nav-shop .nav-button');
    
    if (cartBtn) {
        let badge = cartBtn.querySelector('.cart-badge');
        // Create badge if it doesn't exist
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #ff4444;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                display: none;
            `;
            cartBtn.style.position = 'relative';
            cartBtn.appendChild(badge);
        }
        
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * 4. CHECKOUT FUNCTION
 * Can be used by pages to place an order.
 */
async function placeOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (cart.length === 0) return alert('سبد خرید خالی است');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user ? user.id : null, // Null if guest
                totalPrice: totalPrice,
                items: cart
            })
        });

        const result = await response.json();
        if (result.orderId) {
            alert('سفارش شما با موفقیت ثبت شد! شماره سفارش: ' + result.orderId);
            localStorage.removeItem('cart');
            window.location.href = 'main.html';
        } else {
            alert('خطا در ثبت سفارش');
        }
    } catch (error) {
        console.error('Order error:', error);
        alert('خطا در ارتباط با سرور');
    }
}

// Initialize Badge on Page Load
document.addEventListener('DOMContentLoaded', updateCartBadge);