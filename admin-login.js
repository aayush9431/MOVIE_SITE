document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Check if services are available
    if (typeof dataService === 'undefined' || typeof accessControl === 'undefined') {
        console.error('Required services not found!');
        errorMessage.textContent = 'System error. Please try again later.';
        return;
    }

    // Clear any existing session
    sessionStorage.clear();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        console.log('Attempting admin login for:', username);

        try {
            // Authenticate admin user
            const adminUser = accessControl.authenticateAdmin(username, password);

            if (!adminUser) {
                console.log('Login failed - Not an admin or invalid credentials');
                errorMessage.textContent = 'Access denied. Admin credentials required.';
                loginForm.reset();
                return;
            }

            console.log('Admin login successful:', {
                username: adminUser.username,
                role: adminUser.role
            });

            // Update last login
            try {
                dataService.updateUser(adminUser.id, { 
                    lastLogin: new Date().toISOString() 
                });
            } catch (updateError) {
                console.error('Failed to update last login:', updateError);
            }

            // Set admin session
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', adminUser.username);
            sessionStorage.setItem('adminRole', 'admin'); // Explicitly set admin role
            sessionStorage.setItem('adminId', adminUser.id.toString());

            // Verify session was set correctly
            if (!accessControl.verifyAdminSession()) {
                throw new Error('Failed to establish admin session');
            }

            console.log('Admin session established');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'An error occurred during login. Please try again.';
            sessionStorage.clear(); // Clear any partial session data
        }
    });

    // Add event listener for Enter key
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
            e.preventDefault();
            document.querySelector('button[type="submit"]').click();
        }
    });
}); 