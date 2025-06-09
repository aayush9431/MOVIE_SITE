// Storage keys
const STORAGE_KEYS = {
    USERS: 'pichkumovies_users',
    CURRENT_USER: 'pichkumovies_current_user',
    FAVORITES: 'pichkumovies_favorites',
    WATCHLIST: 'pichkumovies_watchlist',
    SETTINGS: 'pichkumovies_settings'
};

// User management class
class UserManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
        }
    }

    getAllUsers() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    }

    saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    }

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        this.updateUI();
    }

    updateUI() {
        const user = this.getCurrentUser();
        const profileUsername = document.getElementById('profileUsername');
        const sidebarUsername = document.getElementById('sidebarUsername');
        
        if (profileUsername) {
            profileUsername.textContent = user ? user.username : 'User';
        }
        if (sidebarUsername) {
            sidebarUsername.textContent = user ? user.username : 'Username';
        }
    }

    async login(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email && u.password === password && u.status === 'active');
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            this.saveUsers(users);

            const { password: _, ...userWithoutPassword } = user;
            this.setCurrentUser(userWithoutPassword);

            // Redirect based on role
            if (user.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
            return userWithoutPassword;
        }
        throw new Error('Invalid email or password');
    }

    async signup(userData) {
        const users = this.getAllUsers();
        
        // Check if email already exists
        if (users.some(u => u.email === userData.email)) {
            throw new Error('Email already exists');
        }

        // Check if username already exists
        if (users.some(u => u.username === userData.username)) {
            throw new Error('Username already exists');
        }

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...userData,
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            settings: {
                emailNotifications: true,
                publicProfile: false
            }
        };

        users.push(newUser);
        this.saveUsers(users);

        const { password: _, ...userWithoutPassword } = newUser;
        this.setCurrentUser(userWithoutPassword);
        window.location.href = 'index.html';
        return userWithoutPassword;
    }

    async updateProfile(userId, updates) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // If updating email, check if new email already exists
        if (updates.email && updates.email !== users[userIndex].email) {
            if (users.some(u => u.email === updates.email)) {
                throw new Error('Email already exists');
            }
        }

        // If updating username, check if new username already exists
        if (updates.username && updates.username !== users[userIndex].username) {
            if (users.some(u => u.username === updates.username)) {
                throw new Error('Username already exists');
            }
        }

        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveUsers(users);

        // Update current user if it's the same user
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const { password: _, ...userWithoutPassword } = users[userIndex];
            this.setCurrentUser(userWithoutPassword);
        }

        return users[userIndex];
    }

    async updatePassword(userId, currentPassword, newPassword) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        user.password = newPassword;
        user.updatedAt = new Date().toISOString();

        this.saveUsers(users);
        return true;
    }

    async updateSettings(userId, settings) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].settings = {
            ...users[userIndex].settings,
            ...settings
        };
        users[userIndex].updatedAt = new Date().toISOString();

        this.saveUsers(users);

        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const { password: _, ...userWithoutPassword } = users[userIndex];
            this.setCurrentUser(userWithoutPassword);
        }

        return users[userIndex].settings;
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    }
}

// Initialize user manager
const userManager = new UserManager();

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            await userManager.login(email, password);
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
}

// Handle signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            return;
        }

        try {
            await userManager.signup({ username, email, password });
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
}

// Handle profile form
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        // Fill form with current user data
        document.getElementById('editUsername').value = currentUser.username;
        document.getElementById('editEmail').value = currentUser.email;

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('editUsername').value;
            const email = document.getElementById('editEmail').value;
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            try {
                // Update profile information
                await userManager.updateProfile(currentUser.id, { username, email });

                // Update password if provided
                if (currentPassword && newPassword) {
                    if (newPassword !== confirmNewPassword) {
                        throw new Error('New passwords do not match');
                    }
                    await userManager.updatePassword(currentUser.id, currentPassword, newPassword);
                }

                alert('Profile updated successfully');
                window.location.reload();
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

// Handle settings form
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        // Fill form with current settings
        document.getElementById('newMovies').checked = currentUser.settings?.emailNotifications ?? true;
        document.getElementById('publicProfile').checked = currentUser.settings?.publicProfile ?? false;

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                emailNotifications: document.getElementById('newMovies').checked,
                publicProfile: document.getElementById('publicProfile').checked
            };

            try {
                await userManager.updateSettings(currentUser.id, settings);
                alert('Settings updated successfully');
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userManager.logout();
    });
}

// Handle profile navigation
const profileNav = document.querySelectorAll('.profile-nav a[data-section]');
if (profileNav.length > 0) {
    profileNav.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(s => {
                s.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(`${section}Section`).classList.add('active');
            
            // Update active nav link
            document.querySelectorAll('.profile-nav a').forEach(a => {
                a.classList.remove('active');
            });
            e.currentTarget.classList.add('active');
        });
    });
}

// Initialize UI
userManager.updateUI();