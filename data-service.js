// Data keys
const STORAGE_KEYS = {
    USERS: 'pichkumovies_users',
    MOVIES: 'pichkumovies_movies'
};

// Initial data
const initialUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@pichkumovies.com',
        password: 'admin123', // In production, this should be hashed
        role: 'admin',
        lastLogin: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        settings: {
            emailNotifications: true,
            publicProfile: false
        }
    }
];

class DataService {
    constructor() {
        console.log('Initializing DataService...');
        this.initializeData();
    }

    // Initialize data if not exists
    initializeData() {
        try {
            console.log('Checking for existing data...');
            let existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
            
            if (!existingUsers) {
                console.log('No existing users found. Initializing with default data...');
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
                console.log('Default users initialized:', initialUsers);
            } else {
                try {
                    // Validate stored data
                    existingUsers = JSON.parse(existingUsers);
                    if (!Array.isArray(existingUsers)) {
                        throw new Error('Invalid data format');
                    }
                    // Ensure at least one admin exists
                    const hasAdmin = existingUsers.some(u => u.role === 'admin' && u.status === 'active');
                    if (!hasAdmin) {
                        console.log('No active admin found. Adding default admin...');
                        existingUsers.push(initialUsers[0]);
                        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers));
                    }
                    console.log('Existing users found:', existingUsers);
                } catch (e) {
                    console.error('Invalid data in localStorage. Resetting...', e);
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
                }
            }
        } catch (error) {
            console.error('Error initializing data:', error);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
        }
    }

    // User operations
    getAllUsers() {
        try {
            const users = localStorage.getItem(STORAGE_KEYS.USERS);
            const parsedUsers = users ? JSON.parse(users) : [];
            console.log('Retrieved users from storage:', parsedUsers);
            return parsedUsers;
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    // Verify admin role
    verifyAdminAccess(userId) {
        try {
            if (!userId) {
                console.log('Admin verification failed: No user ID provided');
                return false;
            }

            const users = this.getAllUsers();
            const user = users.find(u => u.id === parseInt(userId));
            
            if (!user) {
                console.log('Admin verification failed: User not found');
                return false;
            }

            if (user.role !== 'admin') {
                console.log('Admin verification failed: User is not an admin');
                return false;
            }

            if (user.status !== 'active') {
                console.log('Admin verification failed: Admin account is not active');
                return false;
            }

            console.log('Admin verification successful for user:', user.username);
            return true;
        } catch (error) {
            console.error('Error verifying admin access:', error);
            return false;
        }
    }

    // New method to authenticate user with role check
    authenticateAdmin(username, password) {
        try {
            const users = this.getAllUsers();
            const user = users.find(u => 
                u.username === username && 
                u.password === password && 
                u.role === 'admin' && 
                u.status === 'active'
            );

            if (user) {
                // Update last login
                user.lastLogin = new Date().toISOString();
                this.updateUser(user.id, { lastLogin: user.lastLogin });
                
                // Return user data without password
                const { password: _, ...userData } = user;
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Error authenticating admin:', error);
            return null;
        }
    }

    addUser(user) {
        try {
            // Verify admin access before adding user
            const adminId = parseInt(sessionStorage.getItem('adminId'));
            if (!this.verifyAdminAccess(adminId)) {
                throw new Error('Admin access required to add users');
            }

            console.log('Adding new user:', user);
            const users = this.getAllUsers();
            
            // Validate required fields
            if (!user.username || !user.email || !user.password || !user.role) {
                throw new Error('Missing required fields');
            }

            // Check if username or email already exists
            const exists = users.some(u => 
                u.username.toLowerCase() === user.username.toLowerCase() || 
                u.email.toLowerCase() === user.email.toLowerCase()
            );
            
            if (exists) {
                throw new Error('Username or email already exists');
            }

            // Add new user
            const newUser = {
                ...user,
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                lastLogin: 'Never',
                createdAt: new Date().toISOString(),
                status: user.status || 'active',
                settings: {
                    emailNotifications: true,
                    publicProfile: false
                }
            };
            
            users.push(newUser);
            
            // Save to localStorage
            try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
                console.log('Updated users in storage:', users);
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                throw new Error('Failed to save user data');
            }

            console.log('User added successfully:', newUser);
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    updateUser(userId, userData) {
        try {
            // Verify admin access before updating user
            const adminId = parseInt(sessionStorage.getItem('adminId'));
            if (!this.verifyAdminAccess(adminId)) {
                throw new Error('Admin access required to update users');
            }

            console.log('Updating user:', userId, userData);
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === parseInt(userId));

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Check if updating username/email and if they already exist
            if (userData.username && userData.username !== users[userIndex].username) {
                const usernameExists = users.some(u => 
                    u.id !== parseInt(userId) && 
                    u.username.toLowerCase() === userData.username.toLowerCase()
                );
                if (usernameExists) {
                    throw new Error('Username already exists');
                }
            }

            if (userData.email && userData.email !== users[userIndex].email) {
                const emailExists = users.some(u => 
                    u.id !== parseInt(userId) && 
                    u.email.toLowerCase() === userData.email.toLowerCase()
                );
                if (emailExists) {
                    throw new Error('Email already exists');
                }
            }

            // Update user data
            users[userIndex] = {
                ...users[userIndex],
                ...userData,
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            console.log('User updated successfully:', users[userIndex]);

            return users[userIndex];
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    deleteUser(userId) {
        try {
            // Verify admin access before deleting user
            const adminId = parseInt(sessionStorage.getItem('adminId'));
            if (!this.verifyAdminAccess(adminId)) {
                throw new Error('Admin access required to delete users');
            }

            // Prevent admin from deleting themselves
            if (parseInt(userId) === adminId) {
                throw new Error('Cannot delete your own admin account');
            }

            console.log('Deleting user:', userId);
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === parseInt(userId));

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Remove user
            users.splice(userIndex, 1);
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            console.log('User deleted successfully');

            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Movie operations
    getAllMovies() {
        try {
            const movies = localStorage.getItem(STORAGE_KEYS.MOVIES);
            return movies ? JSON.parse(movies) : [];
        } catch (error) {
            console.error('Error getting movies:', error);
            return [];
        }
    }

    addMovie(movie) {
        try {
            const movies = this.getAllMovies();
            const newMovie = {
                ...movie,
                id: movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1,
                createdAt: new Date().toISOString()
            };
            
            movies.push(newMovie);
            localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
            
            return newMovie;
        } catch (error) {
            console.error('Error adding movie:', error);
            throw error;
        }
    }
}

// Create and export a single instance
console.log('Creating DataService instance...');
const dataService = new DataService();
console.log('DataService initialized successfully.'); 