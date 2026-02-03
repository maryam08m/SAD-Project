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
// Change this line:
async function loadProducts(containerId, category = null, limit = null, searchTerm = null)  {
    const container = document.querySelector(containerId);
    if (!container) return; // Exit if container doesn't exist on this page

    try {
        let url = `${API_URL}/products`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (searchTerm) params.append('search', searchTerm); // <--- Added this
    
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
/**
 * 5. SEARCH LOGIC
 */
function performSearch() {
    const query = document.getElementById('searchInput').value;
    
    // Redirect to products page with search query if we are not already there
    // Or just reload the current container if we are on a page with a product list
    
    const container = document.querySelector('.product-container');
    
    if (container) {
        // If we are on a page that shows products, just filter them
        loadProducts('#' + container.id, null, null, query);
        
        // Scroll to results
        container.scrollIntoView({ behavior: 'smooth' });
    } else {
        // If on a page without a product list (like contact us), go to main page
        window.location.href = `main.html?search=${encodeURIComponent(query)}`;
    }
}
/**
 * 6. USER DASHBOARD LOGIC
 */

// A. Handle Login Redirect (Update your loginUser function!)
// Find your existing loginUser function and replace the success part with this:
/* ... inside fetch('/api/login') ...
   .then(data => {
       if (data.user) {
           localStorage.setItem('user', JSON.stringify(data.user));
           // REDIRECT TO DASHBOARD
           window.location.href = 'user_dashboard.html'; 
       }
   })
*/

// B. Load Orders (FIXED)
async function loadUserOrders(userId) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    try {
        const res = await fetch(`/api/user/orders/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        
        const orders = await res.json();

        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">هنوز سفارشی ثبت نکرده‌اید.</p>';
            return;
        }

        container.innerHTML = orders.map(order => {
            // Parse items safely
            let items = [];
            try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e) {}
            
            const itemCount = items ? items.length : 0;
            
            // Safe Date Handling
            let dateStr = "تاریخ نامشخص";
            if (order.created_at) {
                dateStr = new Date(order.created_at).toLocaleDateString('fa-IR');
            }

            return `
                <div class="order-card">
                    <div class="order-info">
                        <h4>سفارش #${order.id}</h4>
                        <p>${dateStr} | ${itemCount} محصول</p>
                    </div>
                    <div class="order-total">
                        ${parseInt(order.total_price).toLocaleString()} تومان
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:red; text-align:center;">خطا در بارگذاری سفارشات.</p>';
    }
}
// C. Update Profile
async function updateProfile(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const fullName = document.getElementById('edit-name').value;
    const password = document.getElementById('edit-password').value;
    const msg = document.getElementById('update-message');

    const body = { full_name: fullName };
    if (password) body.password = password;

    try {
        const res = await fetch(`/api/user/update/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            msg.style.color = 'green';
            msg.innerText = 'اطلاعات با موفقیت ذخیره شد.';
            
            // Update Local Storage
            user.full_name = fullName;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update Welcome Message
            document.getElementById('welcome-name').innerText = fullName;
        } else {
            msg.style.color = 'red';
            msg.innerText = 'خطا در بروزرسانی.';
        }
    } catch (error) {
        console.error(error);
    }
}

// D. Logout
function logoutUser() {
    localStorage.removeItem('user');
    window.location.href = 'main.html';
}

// E. Global User Icon Click Handler (Add this if you want generic handling)
// Note: In the HTML above, I simply pointed the href to user_dashboard.html
// which automatically checks auth and redirects if needed. This is cleaner.

// Allow pressing "Enter" key
function handleEnter(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
}

// Check for URL params on load (for when redirecting from other pages)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
        // Auto-fill input
        const input = document.getElementById('searchInput');
        if(input) input.value = searchParam;
        
        // If we are on main page, load filtered results
        // Pass 'null' for limit so search shows ALL matches, not just top 8
        loadProducts('#new-collection-container', null, null, searchParam);
    }
});

/* --- DARK MODE LOGIC --- */
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

// 1. Check Local Storage on Load
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if(themeIcon) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// 2. Toggle Function
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Update Icon
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun'); // Change to Sun icon
            localStorage.setItem('theme', 'dark'); // Save preference
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon'); // Change to Moon icon
            localStorage.setItem('theme', 'light'); // Save preference
        }
    });
}
// Initialize Badge on Page Load
document.addEventListener('DOMContentLoaded', updateCartBadge);