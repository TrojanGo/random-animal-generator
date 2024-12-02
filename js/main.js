// Import animal data
import { animals } from './animals.js';

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const animalImage = document.getElementById('animal-image');
const animalName = document.getElementById('animal-name');
const animalDescription = document.getElementById('animal-description');

// Pixabay API configuration
const PIXABAY_API_KEY = '47405924-f7198a6e5f8e11e814f6c4ff5';

// Get random animal image from Pixabay
async function getRandomAnimalImage(animalName) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // Clean and encode the search term
            const searchTerm = encodeURIComponent(animalName.toLowerCase().trim());
            const apiUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${searchTerm}&image_type=photo&per_page=3&safesearch=true&category=animals`;
            
            console.log('Fetching from URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response status:', response.status);

            if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);

            if (!data.hits || data.hits.length === 0) {
                // Try a more generic search term
                if (animalName.includes(' ')) {
                    const genericTerm = animalName.split(' ')[0];
                    console.log('No results found, trying generic term:', genericTerm);
                    return getRandomAnimalImage(genericTerm);
                }
                throw new Error(`No image found for ${animalName}`);
            }

            // Randomly select one of the returned images
            const image = data.hits[Math.floor(Math.random() * Math.min(data.hits.length, 3))];
            return {
                url: image.largeImageURL,
                photographer: image.user,
                photographerUrl: `https://pixabay.com/users/${image.user}-${image.user_id}/`
            };
        } catch (error) {
            retryCount++;
            console.error(`Attempt ${retryCount}/${maxRetries} failed:`, error);
            
            if (retryCount === maxRetries || error.message.includes('rate limit')) {
                throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Generate random animal
async function generateRandomAnimal() {
    try {
        // Disable button and show loading state
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        animalImage.innerHTML = '<div class="loading">Loading...</div>';

        // Get random animal
        const animal = animals[Math.floor(Math.random() * animals.length)];
        console.log('Selected animal:', animal);

        // Update text
        animalName.textContent = animal.name;
        animalDescription.textContent = animal.description;

        // Get image
        const image = await getRandomAnimalImage(animal.searchTerm || animal.name);

        // Create image elements
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';

        const img = document.createElement('img');
        img.alt = `${animal.name} photo`;
        img.className = 'animal-img';
        img.src = image.url;

        // Add loading handler
        img.onload = () => {
            // Clear loading state and show image
            animalImage.innerHTML = '';
            imgContainer.appendChild(img);
            animalImage.appendChild(imgContainer);
        };

        img.onerror = () => {
            animalImage.innerHTML = '<div class="error">Failed to load image</div>';
        };

    } catch (error) {
        console.error('Error:', error);
        animalName.textContent = 'Error';
        animalDescription.textContent = error.message || 'Please try again later';
        animalImage.innerHTML = '<div class="error">Failed to load image</div>';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Random Animal';
    }
}

// Add click handler
generateBtn.addEventListener('click', generateRandomAnimal);

// Initial generation
generateRandomAnimal();
