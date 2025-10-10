// Authentication Module
(function() {
    'use strict';

    const AUTH_KEY = 'portal_auth_token';
    const USER_KEY = 'portal_user_data';

    // Check if user is authenticated
    function isAuthenticated() {
        const token = localStorage.getItem(AUTH_KEY);
        const user = localStorage.getItem(USER_KEY);
        return token && user;
    }

    // Get current user
    function getCurrentUser() {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // Login function
    function login(username, password, remember) {
        // Simulate authentication - In production, this would be an API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Demo credentials check
                if (username && password) {
                    const token = 'demo_token_' + Date.now();
                    const user = {
                        id: 1,
                        username: username,
                        email: username.includes('@') ? username : username + '@example.com',
                        name: 'Demo User',
                        company: 'Demo Company'
                    };

                    if (remember) {
                        localStorage.setItem(AUTH_KEY, token);
                        localStorage.setItem(USER_KEY, JSON.stringify(user));
                    } else {
                        sessionStorage.setItem(AUTH_KEY, token);
                        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
                    }

                    resolve({ success: true, user: user });
                } else {
                    reject({ success: false, message: 'Invalid credentials' });
                }
            }, 800);
        });
    }

    // Logout function
    function logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(USER_KEY);
        window.location.href = './login.html';
    }

    // Protect page - redirect to login if not authenticated
    function protectPage() {
        if (!isAuthenticated() && !window.location.pathname.includes('login.html')) {
            window.location.href = './login.html';
        }
    }

    // Handle login form
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            const errorMsg = document.getElementById('errorMessage');

            errorMsg.style.display = 'none';

            try {
                const result = await login(username, password, remember);
                if (result.success) {
                    window.location.href = './dashboard.html';
                }
            } catch (error) {
                errorMsg.textContent = error.message || 'Login failed. Please try again.';
                errorMsg.style.display = 'block';
            }
        });
    }

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Update user info display
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        const user = getCurrentUser();
        if (user) {
            userInfoElement.textContent = user.name + ' (' + user.company + ')';
        }
    }

    // Protect pages that require authentication
    if (!window.location.pathname.includes('login.html')) {
        protectPage();
    }

    // Export functions for use in other scripts
    window.PortalAuth = {
        isAuthenticated: isAuthenticated,
        getCurrentUser: getCurrentUser,
        login: login,
        logout: logout
    };
})();
