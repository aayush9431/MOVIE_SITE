// OMDB API configuration
const API_KEY = '2c0bfe4';
const BASE_URL = 'https://www.omdbapi.com';

// Keep track of current page and search term
let currentPage = 1;
let currentSearchTerm = '';

// Function to fetch horror movies
async function fetchHorrorMovies(page = 1) {
    try {
        console.log('Fetching horror movies for page:', page);
        
        // List of horror movie search terms to get a variety of movies
        const searchTerms = [
            'horror',
            'nightmare',
            'halloween',
            'friday 13th',
            'conjuring',
            'exorcist',
            'dracula',
            'zombie',
            'ghost',
            'demon'
        ];
        
        // Only select a new search term if we're starting fresh
        if (page === 1) {
            currentSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        }
        
        const url = `${BASE_URL}/?apikey=${API_KEY}&s=${currentSearchTerm}&type=movie&page=${page}`;
        console.log('Making API request to:', url);
        
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
        
        return {
            movies: movieDetails,
            totalResults: parseInt(data.totalResults)
        };
    } catch (error) {
        console.error('Error fetching horror movies:', error);
        throw error;
    }
}

// Add streaming services information to movie details
function getStreamingInfo(movie) {
    // This is a mock function that would normally call a real streaming availability API
    const streamingServices = [
        {
            name: 'Netflix',
            url: 'https://www.netflix.com/search?q=' + encodeURIComponent(movie.title),
            icon: 'fab fa-netflix'
        },
        {
            name: 'Amazon Prime',
            url: 'https://www.amazon.com/s?k=' + encodeURIComponent(movie.title) + '&i=instant-video',
            icon: 'fab fa-amazon'
        },
        {
            name: 'Disney+',
            url: 'https://www.disneyplus.com/search?q=' + encodeURIComponent(movie.title),
            icon: 'fab fa-disney'
        },
        {
            name: 'Hulu',
            url: 'https://www.hulu.com/search?q=' + encodeURIComponent(movie.title),
            icon: 'fas fa-tv'
        }
    ];

    return `
        <div class="streaming-services">
            <h4>Watch Now On:</h4>
            <div class="streaming-links">
                ${streamingServices.map(service => `
                    <a href="${service.url}" target="_blank" class="streaming-link">
                        <i class="${service.icon}"></i>
                        ${service.name}
                    </a>
                `).join('')}
            </div>
            <p class="streaming-disclaimer">
                * Streaming availability may vary by region. Click links to check availability.
            </p>
        </div>
    `;
}

// Update the createMovieCard function to include streaming information
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
                ${getStreamingInfo(movie)}
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
        
        const { movies, totalResults } = await fetchHorrorMovies(currentPage);
        console.log('Fetched movies:', movies);
        
        if (movies.length === 0) {
            if (currentPage === 1) {
                wrapper.innerHTML = '<div class="error-message">No horror movies found. Please try again later.</div>';
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
    // Only run on horror page
    if (window.location.pathname.includes('Horror_movie.html')) {
        console.log('On horror page, loading movies...');
        // Reset page counter when starting fresh
        currentPage = 1;
        loadMoreMovies();
    } else {
        console.log('Not on horror page:', window.location.pathname);
    }
});

// Add CSS for streaming services section
const style = document.createElement('style');
style.textContent = `
    .streaming-services {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .streaming-services h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #fff;
    }

    .streaming-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .streaming-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #fff;
        text-decoration: none;
        font-size: 12px;
        transition: all 0.3s ease;
    }

    .streaming-link:hover {
        background: rgba(255, 0, 0, 0.2);
        color: #ff4444;
    }

    .streaming-link i {
        font-size: 14px;
    }

    .streaming-disclaimer {
        margin-top: 8px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        font-style: italic;
    }
`;
document.head.appendChild(style); 