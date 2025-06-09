document.addEventListener('DOMContentLoaded', async () => {
    // Strict admin role verification
    function verifyAdminAccess() {
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        const userRole = sessionStorage.getItem('adminRole');
        const userId = sessionStorage.getItem('adminId');

        console.log('Verifying admin access:', {
            isLoggedIn,
            userRole,
            userId
        });

        if (!isLoggedIn || !userId || userRole !== 'admin') {
            console.log('Access denied: Not logged in as admin');
            return false;
        }

        // Verify against stored users
        try {
            const users = dataService.getAllUsers();
            const user = users.find(u => u.id === parseInt(userId));
            
            if (!user || user.role !== 'admin' || user.status !== 'active') {
                console.log('Access denied: User not found or not an active admin');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verifying admin access:', error);
            return false;
        }
    }

    // Immediate access check
    if (!verifyAdminAccess()) {
        console.log('Unauthorized access attempt - redirecting to login');
        sessionStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    // Set admin username
    const adminUsername = sessionStorage.getItem('adminUsername');
    document.getElementById('adminUsername').textContent = adminUsername || 'Admin';

    // Initialize dashboard
    initializeDashboard();
    loadUsers();

    // Event Listeners
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
    
    // Handle modal close buttons
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // Handle cancel buttons
    document.getElementById('cancelAddUser').addEventListener('click', () => hideModal('addUserModal'));
    
    // Handle form submissions
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.currentTarget.id !== 'logoutButton') {
                e.preventDefault();
                handleNavigation(e.currentTarget.dataset.page);
            }
        });
    });

    // Periodic access verification (every 30 seconds)
    setInterval(() => {
        if (!verifyAdminAccess()) {
            console.log('Admin access verification failed - logging out');
            handleLogout();
        }
    }, 30000);
});

function initializeDashboard() {
    try {
        const users = dataService.getAllUsers();
        const movies = dataService.getAllMovies();
        
        // Update stats
        document.getElementById('totalMovies').textContent = movies.length;
        document.getElementById('totalCategories').textContent = '4';
        document.getElementById('totalUsers').textContent = users.length;
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

function loadUsers() {
    try {
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';

        const users = dataService.getAllUsers();
        const currentUserId = parseInt(sessionStorage.getItem('adminId'));

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${user.lastLogin || 'Never'}</td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        ${user.id !== currentUserId ? `
                            <button class="action-button" onclick="editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button" onclick="deleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="action-button" onclick="toggleUserStatus(${user.id})">
                                <i class="fas fa-power-off"></i>
                            </button>
                        ` : '<span class="text-muted">Current User</span>'}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function handleLogout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function showAddUserModal() {
    document.getElementById('addUserModal').classList.add('active');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

function handleAddUser(e) {
    e.preventDefault();
    
    try {
        // Verify admin access before adding user
        if (!verifyAdminAccess()) {
            alert('Admin access required');
            handleLogout();
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        if (!userData.username || !userData.email || !userData.password || !userData.role) {
            throw new Error('Please fill in all required fields');
        }

        const newUser = dataService.addUser(userData);
        loadUsers();
        hideModal('addUserModal');
        alert('User added successfully!');
    } catch (error) {
        console.error('Error adding user:', error);
        alert(error.message || 'Error adding user. Please try again.');
    }
}

function editUser(userId) {
    try {
        const users = dataService.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Create edit modal dynamically
        const modalHtml = `
            <div id="editUserModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit User</h2>
                        <button class="close-button" onclick="hideModal('editUserModal')">&times;</button>
                    </div>
                    <form id="editUserForm">
                        <input type="hidden" name="userId" value="${user.id}">
                        <div class="form-group">
                            <label for="editUsername">Username</label>
                            <input type="text" id="editUsername" name="username" value="${user.username}" required>
                        </div>
                        <div class="form-group">
                            <label for="editEmail">Email</label>
                            <input type="email" id="editEmail" name="email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="editRole">Role</label>
                            <select id="editRole" name="role" required>
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editStatus">Status</label>
                            <select id="editStatus" name="status" required>
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editPassword">New Password (leave blank to keep current)</label>
                            <input type="password" id="editPassword" name="password">
                        </div>
                        <div class="modal-footer">
                            <button type="button" onclick="hideModal('editUserModal')" class="button secondary">Cancel</button>
                            <button type="submit" class="button primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editUserModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = document.getElementById('editUserModal');
        modal.classList.add('active');

        // Handle form submission
        document.getElementById('editUserForm').addEventListener('submit', handleEditUser);
    } catch (error) {
        console.error('Error showing edit user modal:', error);
        alert(error.message);
    }
}

function handleEditUser(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const userId = parseInt(formData.get('userId'));
        const userData = {
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            role: formData.get('role'),
            status: formData.get('status')
        };

        // Only include password if it's not empty
        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }

        dataService.updateUser(userId, userData);
        loadUsers();
        hideModal('editUserModal');
        alert('User updated successfully!');
    } catch (error) {
        console.error('Error updating user:', error);
        alert(error.message || 'Error updating user. Please try again.');
    }
}

function deleteUser(userId) {
    try {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            dataService.deleteUser(userId);
            loadUsers();
            alert('User deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Error deleting user. Please try again.');
    }
}

function toggleUserStatus(userId) {
    try {
        const users = dataService.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        dataService.updateUser(userId, { status: newStatus });
        loadUsers();
        alert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert(error.message || 'Error updating user status. Please try again.');
    }
}

function handleNavigation(page) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to clicked link
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Update dashboard title
    document.querySelector('.dashboard-title').textContent = 
        page.charAt(0).toUpperCase() + page.slice(1);
}