// Access Control Service
class AccessControl {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        console.log('Initializing Access Control...');
        this.initialized = true;
    }

    isAdmin(user) {
        return user && user.role === 'admin' && user.status === 'active';
    }

    verifyAdminSession() {
        try {
            const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
            const userRole = sessionStorage.getItem('adminRole');
            const userId = sessionStorage.getItem('adminId');

            if (!isLoggedIn || !userId || userRole !== 'admin') {
                console.log('Session verification failed:', { isLoggedIn, userRole, userId });
                return false;
            }

            // Verify against stored users
            const users = dataService.getAllUsers();
            const user = users.find(u => u.id === parseInt(userId));

            if (!this.isAdmin(user)) {
                console.log('User verification failed:', user);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying admin session:', error);
            return false;
        }
    }

    enforceAdminAccess() {
        if (!this.verifyAdminSession()) {
            console.log('Access denied - redirecting to login');
            sessionStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    authenticateAdmin(username, password) {
        try {
            const users = dataService.getAllUsers();
            const user = users.find(u => 
                u.username === username && 
                u.password === password
            );

            if (!user) {
                console.log('Authentication failed: User not found');
                return null;
            }

            if (!this.isAdmin(user)) {
                console.log('Authentication failed: Not an admin user');
                return null;
            }

            return user;
        } catch (error) {
            console.error('Error during admin authentication:', error);
            return null;
        }
    }
}

// Create and export a single instance
console.log('Creating AccessControl instance...');
const accessControl = new AccessControl();
console.log('AccessControl initialized successfully.'); 