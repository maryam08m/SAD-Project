// Select DOM Elements
const signInBtn = document.getElementById("signIn");
const signUpBtn = document.getElementById("signUp");
const container = document.getElementById("container");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// --- 1. Animation Logic (Sliding Panels) ---

// Show Sign In Panel
signInBtn.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

// Show Sign Up Panel
signUpBtn.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

// --- 2. Backend Integration ---

// Handle Login Submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Save user data
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('خوش آمدید!');
            
            // Redirect based on role
            if(data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'main.html';
            }
        } else {
            alert(data.error || 'نام کاربری یا رمز عبور اشتباه است');
        }
    } catch (err) {
        console.error(err);
        alert('خطا در ارتباط با سرور');
    }
});

// Handle Register Submission
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const name = document.getElementById('regName').value; // Optional, if you add it to DB later

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password, full_name: name })
        });

        if (res.ok) {
            alert('ثبت نام با موفقیت انجام شد. لطفا وارد شوید.');
            // Slide back to login panel automatically
            container.classList.remove("right-panel-active");
        } else {
            const data = await res.json();
            alert(data.error || 'خطا در ثبت نام');
        }
    } catch (err) {
        console.error(err);
        alert('خطا در ارتباط با سرور');
    }
});