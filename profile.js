// Movie management class
class MovieManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;

        const userKey = `user_${currentUser.id}`;
        if (!localStorage.getItem(`${STORAGE_KEYS.FAVORITES}_${userKey}`)) {
            localStorage.setItem(`${STORAGE_KEYS.FAVORITES}_${userKey}`, JSON.stringify([]));
        }
        if (!localStorage.getItem(`${STORAGE_KEYS.WATCHLIST}_${userKey}`)) {
            localStorage.setItem(`${STORAGE_KEYS.WATCHLIST}_${userKey}`, JSON.stringify([]));
        }
    }

    getUserFavorites() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return [];
        return JSON.parse(localStorage.getItem(`${STORAGE_KEYS.FAVORITES}_user_${currentUser.id}`)) || [];
    }

    getUserWatchlist() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return [];
        return JSON.parse(localStorage.getItem(`${STORAGE_KEYS.WATCHLIST}_user_${currentUser.id}`)) || [];
    }

    saveFavorites(movies) {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;
        localStorage.setItem(`${STORAGE_KEYS.FAVORITES}_user_${currentUser.id}`, JSON.stringify(movies));
    }

    saveWatchlist(movies) {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;
        localStorage.setItem(`${STORAGE_KEYS.WATCHLIST}_user_${currentUser.id}`, JSON.stringify(movies));
    }

    addToFavorites(movie) {
        const favorites = this.getUserFavorites();
        if (!favorites.some(m => m.id === movie.id)) {
            favorites.push(movie);
            this.saveFavorites(favorites);
        }
        this.updateMovieGrids();
    }

    removeFromFavorites(movieId) {
        const favorites = this.getUserFavorites();
        const updatedFavorites = favorites.filter(m => m.id !== movieId);
        this.saveFavorites(updatedFavorites);
        this.updateMovieGrids();
    }

    addToWatchlist(movie) {
        const watchlist = this.getUserWatchlist();
        if (!watchlist.some(m => m.id === movie.id)) {
            watchlist.push(movie);
            this.saveWatchlist(watchlist);
        }
        this.updateMovieGrids();
    }

    removeFromWatchlist(movieId) {
        const watchlist = this.getUserWatchlist();
        const updatedWatchlist = watchlist.filter(m => m.id !== movieId);
        this.saveWatchlist(updatedWatchlist);
        this.updateMovieGrids();
    }

    createMovieCard(movie, listType) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.year}</p>
                <button class="remove-btn" data-movie-id="${movie.id}" data-list-type="${listType}">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        `;

        const removeBtn = card.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            if (listType === 'favorites') {
                this.removeFromFavorites(movie.id);
            } else {
                this.removeFromWatchlist(movie.id);
            }
        });

        return card;
    }

    updateMovieGrids() {
        // Update Favorites Grid
        const favoritesGrid = document.getElementById('favoriteMovies');
        if (favoritesGrid) {
            favoritesGrid.innerHTML = '';
            const favorites = this.getUserFavorites();
            favorites.forEach(movie => {
                favoritesGrid.appendChild(this.createMovieCard(movie, 'favorites'));
            });
            if (favorites.length === 0) {
                favoritesGrid.innerHTML = '<p class="empty-message">No favorite movies yet</p>';
            }
        }

        // Update Watchlist Grid
        const watchlistGrid = document.getElementById('watchlistMovies');
        if (watchlistGrid) {
            watchlistGrid.innerHTML = '';
            const watchlist = this.getUserWatchlist();
            watchlist.forEach(movie => {
                watchlistGrid.appendChild(this.createMovieCard(movie, 'watchlist'));
            });
            if (watchlist.length === 0) {
                watchlistGrid.innerHTML = '<p class="empty-message">Your watchlist is empty</p>';
            }
        }
    }
}

// Initialize movie manager
const movieManager = new MovieManager();

// Update movie grids on page load
document.addEventListener('DOMContentLoaded', () => {
    movieManager.updateMovieGrids();
}); 