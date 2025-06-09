// Add these constants at the top of the file
const BASE_URL = 'http://www.omdbapi.com';
const API_KEY = 'ed6377a9'; // API key updated

// Advanced search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add filter controls to the DOM
    const filterControls = `
        <div class="filter-controls">
            <div class="filter-group">
                <label for="yearFilter">Year:</label>
                <select id="yearFilter">
                    <option value="">All Years</option>
                    ${generateYearOptions()}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="ratingFilter">Minimum Rating:</label>
                <select id="ratingFilter">
                    <option value="">Any Rating</option>
                    <option value="9">9+</option>
                    <option value="8">8+</option>
                    <option value="7">7+</option>
                    <option value="6">6+</option>
                    <option value="5">5+</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="genreFilter">Genre:</label>
                <select id="genreFilter">
                    <option value="">All Genres</option>
                    <option value="Action">Action</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Horror">Horror</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="sortBy">Sort By:</label>
                <select id="sortBy">
                    <option value="rating">Rating</option>
                    <option value="year">Release Date</option>
                    <option value="title">Title</option>
                </select>
            </div>
        </div>
    `;

    // Insert filter controls before the search input
    const searchContainer = document.querySelector('.search-container');
    searchContainer.insertAdjacentHTML('beforeend', filterControls);

    // Initialize autocomplete
    const searchInput = document.getElementById('searchInput');
    let autocompleteTimeout;
    const autocompleteResults = document.createElement('div');
    autocompleteResults.className = 'autocomplete-results';
    searchInput.parentNode.appendChild(autocompleteResults);

    // Event listeners for filters
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    document.getElementById('genreFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);

    // Autocomplete functionality
    searchInput.addEventListener('input', () => {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(async () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                autocompleteResults.innerHTML = '';
                return;
            }
            
            try {
                const url = `${BASE_URL}/?apikey=${API_KEY}&s=${query}&type=movie`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.Search) {
                    const suggestions = data.Search.slice(0, 5).map(movie => `
                        <div class="autocomplete-item" data-title="${movie.Title}">
                            ${movie.Title} (${movie.Year})
                        </div>
                    `).join('');
                    
                    autocompleteResults.innerHTML = suggestions;
                    autocompleteResults.style.display = 'block';

                    // Add click handlers for suggestions
                    document.querySelectorAll('.autocomplete-item').forEach(item => {
                        item.addEventListener('click', () => {
                            searchInput.value = item.dataset.title;
                            autocompleteResults.style.display = 'none';
                            performSearch(item.dataset.title);
                        });
                    });
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        }, 300);
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            autocompleteResults.style.display = 'none';
        }
    });

    // Helper function to generate year options
    function generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = [];
        for (let year = currentYear; year >= 1900; year--) {
            options.push(`<option value="${year}">${year}</option>`);
        }
        return options.join('');
    }

    // Enhanced search function with filters
    async function applyFilters() {
        const year = document.getElementById('yearFilter').value;
        const rating = document.getElementById('ratingFilter').value;
        const genre = document.getElementById('genreFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        const query = document.getElementById('searchInput').value;

        try {
            let url = `${BASE_URL}/?apikey=${API_KEY}&s=${query || '*'}&type=movie`;
            if (year) url += `&y=${year}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.Error) {
                wrapper.innerHTML = `
                    <div class="error-message">
                        <p>No movies found matching the selected criteria</p>
                    </div>
                `;
                return;
            }

            // Fetch detailed information for filtering by rating and genre
            const movieDetails = await Promise.all(
                data.Search.map(async movie => {
                    const detailUrl = `${BASE_URL}/?apikey=${API_KEY}&i=${movie.imdbID}`;
                    const detailResponse = await fetch(detailUrl);
                    return await detailResponse.json();
                })
            );

            // Apply filters
            let filteredMovies = movieDetails.filter(movie => {
                const meetsRating = !rating || parseFloat(movie.imdbRating) >= parseFloat(rating);
                const meetsGenre = !genre || movie.Genre.includes(genre);
                return meetsRating && meetsGenre;
            });

            // Apply sorting
            filteredMovies.sort((a, b) => {
                switch (sortBy) {
                    case 'rating':
                        return parseFloat(b.imdbRating) - parseFloat(a.imdbRating);
                    case 'year':
                        return parseInt(b.Year) - parseInt(a.Year);
                    case 'title':
                        return a.Title.localeCompare(b.Title);
                    default:
                        return 0;
                }
            });

            // Update display
            wrapper.innerHTML = '';
            filteredMovies.forEach(movie => {
                const cardHTML = createMovieCard(movie);
                wrapper.insertAdjacentHTML('beforeend', cardHTML);
            });

        } catch (error) {
            console.error('Filter error:', error);
            wrapper.innerHTML = `
                <div class="error-message">
                    <p>Error applying filters. Please try again.</p>
                </div>
            `;
        }
    }
});

function createMovieCard(movie) {
    return `
        <div class="movie-card">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder-image.jpg'}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <p>Year: ${movie.Year}</p>
                <p>Rating: ${movie.imdbRating}</p>
                <p>Genre: ${movie.Genre}</p>
            </div>
        </div>
    `;
} 