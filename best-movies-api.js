// OMDB API configuration
const API_KEY = '2c0bfe4';
const BASE_URL = 'https://www.omdbapi.com';

// Keep track of current page and search term
let currentPage = 1;
let currentSearchTerm = '';

// Function to fetch best movies
async function fetchBestMovies(page = 1) {
    try {
        console.log('Fetching best movies for page:', page);
        
        // List of best movie search terms to get critically acclaimed movies
        const searchTerms = [
            'masterpiece',
            'critically acclaimed',
            'award winning',
            'cinematic excellence',
            'film classic',
            'best director',
            'best screenplay',
            'best cinematography',
            'best performance',
            'iconic film'
        ];
        
        // Only select a new search term if we're starting fresh
        if (page === 1) {
            currentSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        }
        
        const url = `${BASE_URL}/?apikey=${API_KEY}&s=${currentSearchTerm}&type=movie&page=${page}`;
        console.log('Making API request:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.Error) {
            throw new Error(data.Error);
        }
        
        // Fetch detailed information for each movie
        const movieDetails = await Promise.all(
            data.Search.map(async movie => {
                const detailUrl = `${BASE_URL}/?apikey=${API_KEY}&i=${movie.imdbID}`;
                const detailResponse = await fetch(detailUrl);
                const detail = await detailResponse.json();
                return detail;
            })
        );
        
        // Sort movies by IMDb rating (descending)
        const sortedMovies = movieDetails.sort((a, b) => {
            const ratingA = parseFloat(a.imdbRating) || 0;
            const ratingB = parseFloat(b.imdbRating) || 0;
            return ratingB - ratingA;
        });
        
        return {
            movies: sortedMovies,
            totalResults: parseInt(data.totalResults)
        };
    } catch (error) {
        console.error('Error fetching best movies:', error);
        throw error;
    }
}

// Function to create movie card HTML
function createMovieCard(movie) {
    console.log('Creating card for movie:', movie);
    
    const rating = parseFloat(movie.imdbRating) / 2; // Convert IMDB 10-star to 5-star
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }

    const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/500x750?text=No+Poster';
    const releaseYear = movie.Year || 'N/A';
    const runtime = movie.Runtime !== 'N/A' ? movie.Runtime : 'N/A';
    const rating10 = movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A';
    const title = movie.Title || 'Unknown Title';
    const plot = movie.Plot || 'No description available.';
    const genres = movie.Genre ? movie.Genre.split(', ') : [];

    return `
        <div class="card">
            <div class="poster">
                <img src="${posterUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
            </div>
            <div class="details">
                <h1>${title}</h1>
                <h2>${releaseYear} ${runtime !== 'N/A' ? `• ${runtime}` : ''}</h2>
                <div class="rating">
                    ${starsHTML}
                    <span>${rating10}/10</span>
                </div>
                <div class="tags">
                    ${genres.map(genre => `<span class="tag">${genre}</span>`).join('')}
                </div>
                <p class="desc">
                    ${plot}
                </p>
                <button>
                    Watch Now-->
                </button>
            </div>
        </div>
    `;
}

// Function to create and append the load more button
function createLoadMoreButton(totalResults) {
    const existingButton = document.getElementById('load-more-btn');
    if (existingButton) {
        existingButton.remove();
    }

    if (currentPage * 10 >= totalResults) {
        return; // Don't create button if we've loaded all movies
    }

    const button = document.createElement('button');
    button.id = 'load-more-btn';
    button.className = 'load-more-button';
    button.innerHTML = 'Load More';
    
    // Add loading state handler
    button.onclick = async () => {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        // Add 3-second delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await loadMoreMovies();
        
        button.disabled = false;
        button.innerHTML = 'Load More';
    };
    
    const wrapper = document.querySelector('.wrapper');
    if (wrapper) {
        wrapper.insertAdjacentElement('afterend', button);
    }
}

// Function to load more movies
async function loadMoreMovies() {
    console.log('Loading more movies...');
    const wrapper = document.querySelector('.wrapper');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (!wrapper) {
        console.error('Could not find wrapper element');
        return;
    }

    try {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }

        // Only clear the wrapper if we're starting fresh
        if (currentPage === 1) {
            wrapper.innerHTML = '';
        }
        
        const { movies, totalResults } = await fetchBestMovies(currentPage);
        console.log('Fetched movies:', movies);
        
        if (movies.length === 0) {
            if (currentPage === 1) {
                wrapper.innerHTML = '<div class="error-message">No best movies found. Please try again later.</div>';
            }
            return;
        }
        
        movies.forEach(movie => {
            const cardHTML = createMovieCard(movie);
            wrapper.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Increment page counter for next load
        currentPage++;
        
        // Add load more button if there are more movies
        createLoadMoreButton(totalResults);

    } catch (error) {
        console.error('Error in loadMoreMovies:', error);
        if (currentPage === 1) {
            wrapper.innerHTML = `
                <div class="error-message">
                    <p>Error loading movies. Please try again later.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    } finally {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Only run on best movies page
    if (window.location.pathname.includes('Best_Movies.html')) {
        console.log('On best movies page, loading movies...');
        // Reset page counter when starting fresh
        currentPage = 1;
        loadMoreMovies();
    } else {
        console.log('Not on best movies page:', window.location.pathname);
    }
}); 