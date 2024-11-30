// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'NjLvBP_Pj9nvSmTUcvU-2AsDF2-Tqx_sBPK_F1ju_8s';

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const animalImage = document.getElementById('animal-image');
const animalName = document.getElementById('animal-name');
const animalDescription = document.getElementById('animal-description');
const totalAnimals = document.getElementById('total-animals');

// Import animal data
import { animals } from './animals.js';

// Log animals data for debugging
console.log('Total animals loaded:', animals.length);

// Fetch random image from Unsplash
async function getRandomAnimalImage(searchTerm) {
    console.log('Fetching image for search term:', searchTerm);
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // First search for images
            const searchParams = new URLSearchParams({
                query: searchTerm,
                orientation: 'landscape',
                content_filter: 'high',
                per_page: 20,
                order_by: 'relevant'
            });

            const searchResponse = await fetch(
                `https://api.unsplash.com/search/photos?${searchParams.toString()}`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );
            
            if (!searchResponse.ok) {
                throw new Error('Failed to search images');
            }
            
            const searchData = await searchResponse.json();
            
            // If no results found, try with a simpler search term
            if (searchData.results.length === 0) {
                if (searchTerm.includes('animal')) {
                    searchTerm = searchTerm.replace('animal', '').trim();
                    continue;
                }
                throw new Error('No images found');
            }

            // Get a random image from the results
            const randomIndex = Math.floor(Math.random() * Math.min(searchData.results.length, 5));
            const image = searchData.results[randomIndex];
            
            return {
                url: image.urls.regular,
                photographer: image.user.name,
                photographerUrl: image.user.links.html
            };
        } catch (error) {
            console.error('Error fetching image:', error);
            retryCount++;
            if (retryCount === maxRetries) {
                throw new Error('Failed to fetch image after multiple attempts');
            }
        }
    }
}

// Generate random animal
async function generateRandomAnimal() {
    try {
        // Disable button while generating
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        // Get random animal
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        console.log('Selected animal:', randomAnimal.name);

        // Update text content
        animalName.textContent = randomAnimal.name;
        animalDescription.textContent = randomAnimal.description;

        // Build a more specific search term
        const searchTerm = randomAnimal.name;
        console.log('Search term:', searchTerm);

        // Get and display image
        const imageData = await getRandomAnimalImage(searchTerm);

        // Create image container
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';

        // Create and set up image
        const img = document.createElement('img');
        img.src = imageData.url;
        img.alt = `${randomAnimal.name} - Wildlife Photo`;
        img.className = 'animal-img';

        // Create photo credit
        const photoCredit = document.createElement('div');
        photoCredit.className = 'photo-credit';
        photoCredit.innerHTML = `Photo by <a href="${imageData.photographerUrl}" target="_blank" rel="noopener">${imageData.photographer}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>`;

        // Clear previous content and add new elements
        animalImage.innerHTML = '';
        imgContainer.appendChild(img);
        imgContainer.appendChild(photoCredit);
        animalImage.appendChild(imgContainer);

    } catch (error) {
        console.error('Error generating animal:', error);
        animalName.textContent = 'Error generating animal';
        animalDescription.textContent = 'Please try again';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Random Animal';
    }
}

// Event Listeners
generateBtn.addEventListener('click', generateRandomAnimal);

// Initial generation
generateRandomAnimal();
