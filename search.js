// API Configuration
const BASE_URL = 'http://www.omdbapi.com';
const API_KEY = 'ed6377a9';

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const wrapper = document.querySelector('.wrapper');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    let searchTimeout;

    // Insert search results container after search input
    searchInput.parentNode.insertBefore(searchResults, searchInput.nextSibling);

    if (searchInput && searchButton) {
        // Search on button click
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
                searchResults.style.display = 'none';
            }
        });

        // Search on Enter key press
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query);
                    searchResults.style.display = 'none';
                }
            }
        });

        // Live search suggestions with debouncing
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                fetchSearchSuggestions(query);
            }, 300); // Wait 300ms after user stops typing
        });

        // Close search suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
        });
    }

    async function fetchSearchSuggestions(query) {
        try {
            const url = `${BASE_URL}/?apikey=${API_KEY}&s=${query}&type=movie`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.Search && data.Search.length > 0) {
                const suggestions = data.Search.slice(0, 5).map(movie => `
                    <div class="search-suggestion" data-id="${movie.imdbID}">
                        <div class="suggestion-poster">
                            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}">
                        </div>
                        <div class="suggestion-info">
                            <div class="suggestion-title">${movie.Title}</div>
                            <div class="suggestion-year">${movie.Year}</div>
                        </div>
                    </div>
                `).join('');

                searchResults.innerHTML = suggestions;
                searchResults.style.display = 'block';

                // Add click handlers for suggestions
                document.querySelectorAll('.search-suggestion').forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                        const movieId = suggestion.dataset.id;
                        fetchMovieDetails(movieId);
                        searchResults.style.display = 'none';
                        searchInput.value = suggestion.querySelector('.suggestion-title').textContent;
                    });
                });
            } else {
                searchResults.style.display = 'none';
            }
        } catch (error) {
            console.error('Search suggestion error:', error);
        }
    }

    async function fetchMovieDetails(movieId) {
        try {
            const url = `${BASE_URL}/?apikey=${API_KEY}&i=${movieId}&plot=full`;
            const response = await fetch(url);
            const movie = await response.json();
            
            if (!movie.Error) {
                wrapper.innerHTML = createDetailedMovieCard(movie);
            }
        } catch (error) {
            console.error('Movie detail error:', error);
        }
    }

    async function performSearch(query) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }

        try {
            const url = `${BASE_URL}/?apikey=${API_KEY}&s=${query}&type=movie&page=1`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.Error) {
                wrapper.innerHTML = `
                    <div class="error-message">
                        <p>No movies found matching "${query}"</p>
                        <p>Try a different search term</p>
                    </div>
                `;
                return;
            }

            // Fetch detailed information for each movie
            const movieDetails = await Promise.all(
                data.Search.map(async movie => {
                    const detailUrl = `${BASE_URL}/?apikey=${API_KEY}&i=${movie.imdbID}`;
                    const detailResponse = await fetch(detailUrl);
                    return await detailResponse.json();
                })
            );

            // Clear existing movies
            wrapper.innerHTML = '';

            // Display search results
            movieDetails.forEach(movie => {
                const cardHTML = createMovieCard(movie);
                wrapper.insertAdjacentHTML('beforeend', cardHTML);
            });

        } catch (error) {
            console.error('Search error:', error);
            wrapper.innerHTML = `
                <div class="error-message">
                    <p>Error performing search. Please try again.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        } finally {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }

    function createMovieCard(movie) {
        return `
            <div class="movie-card">
                <div class="movie-poster">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}">
                </div>
                <div class="movie-info">
                    <h3>${movie.Title}</h3>
                    <p class="movie-year">${movie.Year}</p>
                    <p class="movie-rating">IMDb: ${movie.imdbRating}</p>
                    <p class="movie-genre">${movie.Genre}</p>
                </div>
            </div>
        `;
    }

    function createDetailedMovieCard(movie) {
        return `
            <div class="movie-detail">
                <div class="movie-detail-header">
                    <div class="movie-poster">
                        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}">
                    </div>
                    <div class="movie-info">
                        <h2>${movie.Title}</h2>
                        <p class="movie-meta">${movie.Year} • ${movie.Runtime} • ${movie.Rated}</p>
                        <p class="movie-genre">${movie.Genre}</p>
                        <div class="movie-ratings">
                            <span class="imdb-rating">IMDb: ${movie.imdbRating}</span>
                            ${movie.Ratings.map(rating => `
                                <span class="rating">${rating.Source}: ${rating.Value}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="movie-detail-body">
                    <p class="movie-plot">${movie.Plot}</p>
                    <div class="movie-credits">
                        <p><strong>Director:</strong> ${movie.Director}</p>
                        <p><strong>Writers:</strong> ${movie.Writer}</p>
                        <p><strong>Stars:</strong> ${movie.Actors}</p>
                    </div>
                </div>
            </div>
        `;
    }
});