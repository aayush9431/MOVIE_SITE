// Function to handle navbar blur effect on scroll
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    
    // Function to update navbar on scroll
    function updateNavbar() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', updateNavbar);
    
    // Initial check
    updateNavbar();

    // Update profile dropdown based on user state
    function updateProfileDropdown() {
        const profileDropdown = document.querySelector('.profile-dropdown');
        const dropdownContent = profileDropdown.querySelector('.dropdown-content');
        const currentUser = JSON.parse(localStorage.getItem('pichkumovies_current_user'));

        if (currentUser) {
            // User is logged in
            dropdownContent.innerHTML = `
                <a href="profile.html">
                    <i class="fas fa-user"></i> ${currentUser.username}
                </a>
                <a href="profile.html#favorites">
                    <i class="fas fa-heart"></i> My Favorites
                </a>
                <a href="profile.html#watchlist">
                    <i class="fas fa-clock"></i> My Watchlist
                </a>
                <a href="profile.html#settings">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <a href="#" id="logoutLink">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            `;

            // Update profile button
            const profileBtn = profileDropdown.querySelector('.profile-btn');
            profileBtn.innerHTML = `
                <i class="fas fa-user-circle"></i> 
                ${currentUser.username} 
                <div class="dropdown-arrow"></div>
            `;

            // Add logout handler
            document.getElementById('logoutLink').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('pichkumovies_current_user');
                window.location.reload();
            });
        } else {
            // User is not logged in
            dropdownContent.innerHTML = `
                <a href="login.html">
                    <i class="fas fa-sign-in-alt"></i> Login
                </a>
                <a href="signup.html">
                    <i class="fas fa-user-plus"></i> Sign Up
                </a>
            `;

            // Reset profile button
            const profileBtn = profileDropdown.querySelector('.profile-btn');
            profileBtn.innerHTML = `
                <i class="fas fa-user-circle"></i> 
                Profile 
                <div class="dropdown-arrow"></div>
            `;
        }
    }

    // Handle all dropdowns
    const dropdowns = document.querySelectorAll('.genre-dropdown, .profile-dropdown');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                const content = dropdown.querySelector('.dropdown-content');
                if (content) {
                    content.style.display = 'none';
                }
            }
        });
    });

    // Toggle dropdowns on click
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.genre-btn, .profile-btn');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (button && content) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close all other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        const otherContent = otherDropdown.querySelector('.dropdown-content');
                        if (otherContent) {
                            otherContent.style.display = 'none';
                        }
                    }
                });

                // Toggle current dropdown
                const isVisible = content.style.display === 'block';
                content.style.display = isVisible ? 'none' : 'block';
            });
        }
    });

    // Handle hover on desktop
    if (window.innerWidth > 768) {
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => {
                const content = dropdown.querySelector('.dropdown-content');
                if (content) {
                    content.style.display = 'block';
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                const content = dropdown.querySelector('.dropdown-content');
                if (content) {
                    content.style.display = 'none';
                }
            });
        });
    }

    // Initialize profile dropdown
    updateProfileDropdown();

    // Listen for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'pichkumovies_current_user') {
            updateProfileDropdown();
        }
    });
}); 