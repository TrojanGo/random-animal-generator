// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'NjLvBP_Pj9nvSmTUcvU-2AsDF2-Tqx_sBPK_F1ju_8s';

// Specific search strategies for different animal types
const searchStrategies = {
    bird: (name, tags) => [
        `${name} bird wildlife`,
        `wild ${name} bird nature`,
        `${name} ${tags.slice(0, 2).join(' ')} bird`,
        `${name} bird habitat`
    ],
    default: (name, tags) => [
        `${name} animal wildlife`,
        `wild ${name} nature`,
        `${name} ${tags.slice(0, 2).join(' ')} wildlife`,
        `${name} habitat natural`
    ]
};

// Function to fetch and validate images for an animal
async function validateAnimalImage(animal) {
    try {
        // Determine search strategy based on animal type
        const searchType = animal.tags.includes('bird') ? 'bird' : 'default';
        const searchQueries = searchStrategies[searchType](animal.name, animal.tags);

        const validatedImages = [];

        // Try each search query
        for (const query of searchQueries) {
            if (validatedImages.length >= 5) break;

            const params = new URLSearchParams({
                query: query,
                orientation: 'landscape',
                content_filter: 'high',
                per_page: 15,
                order_by: 'relevant'
            });

            console.log(`Trying search query: ${query} for ${animal.name}`);

            const response = await fetch(
                `https://api.unsplash.com/search/photos?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch images for ${animal.name}`);
            }

            const data = await response.json();

            // Validate each photo
            for (const photo of data.results) {
                if (validatedImages.length >= 5) break;

                const tags = photo.tags.map(tag => tag.title.toLowerCase());
                const description = (photo.description || '').toLowerCase();
                const altDescription = (photo.alt_description || '').toLowerCase();
                const allText = [...tags, description, altDescription].join(' ');

                // Validation criteria
                const isValidImage = validateImageCriteria(animal, {
                    tags,
                    description,
                    altDescription,
                    allText
                });

                if (isValidImage) {
                    validatedImages.push({
                        url: photo.urls.regular,
                        photographer: photo.user.name,
                        photographerUrl: photo.user.links.html,
                        tags: tags,
                        description: photo.description || photo.alt_description,
                        confidence: isValidImage.confidence
                    });
                }
            }

            // Add delay between queries to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            animal: animal.name,
            images: validatedImages,
            status: validatedImages.length > 0 ? 'success' : 'no_valid_images'
        };
    } catch (error) {
        console.error(`Error validating images for ${animal.name}:`, error);
        return {
            animal: animal.name,
            images: [],
            status: 'error',
            error: error.message
        };
    }
}

// Function to validate image criteria
function validateImageCriteria(animal, imageData) {
    const { tags, description, altDescription, allText } = imageData;
    const animalNameLower = animal.name.toLowerCase();
    let confidence = 0;

    // Check for exact animal name match
    if (tags.some(tag => tag === animalNameLower)) {
        confidence += 50;
    } else if (tags.some(tag => tag.includes(animalNameLower))) {
        confidence += 40;
    } else if (allText.includes(animalNameLower)) {
        confidence += 30;
    }

    // Check for animal type (e.g., "bird", "mammal")
    const primaryType = animal.tags[0];
    if (primaryType && allText.includes(primaryType)) {
        confidence += 20;
    }

    // Check for habitat/environment tags
    const habitatTags = animal.tags.filter(tag => 
        ['forest', 'jungle', 'savanna', 'desert', 'ocean', 'arctic', 'mountain', 'rainforest'].includes(tag)
    );
    if (habitatTags.some(tag => allText.includes(tag))) {
        confidence += 15;
    }

    // Check for specific characteristics
    const characteristicTags = animal.tags.filter(tag => 
        !['mammal', 'bird', 'reptile', 'amphibian'].includes(tag)
    );
    for (const tag of characteristicTags) {
        if (allText.includes(tag)) {
            confidence += 10;
        }
    }

    // Negative markers (reduce confidence)
    const negativeTerms = ['illustration', 'drawing', 'art', 'cartoon', 'logo', 'toy', 'statue', 'sculpture'];
    if (tags.some(tag => negativeTerms.includes(tag))) {
        confidence -= 50;
    }

    // Additional checks for wildlife/nature context
    const wildlifeTerms = ['wildlife', 'wild', 'nature', 'natural', 'animal'];
    if (wildlifeTerms.some(term => allText.includes(term))) {
        confidence += 15;
    }

    // Bird-specific validation
    if (animal.tags.includes('bird')) {
        const birdTerms = ['flying', 'feathers', 'beak', 'wings', 'avian'];
        if (birdTerms.some(term => allText.includes(term))) {
            confidence += 15;
        }
    }

    // Return result with confidence level
    return confidence >= 50 ? { valid: true, confidence } : false;
}

// Function to validate all animals
async function validateAllAnimals(animals) {
    const results = [];
    const validatedAnimals = [];

    for (const animal of animals) {
        console.log(`Processing ${animal.name}...`);
        const result = await validateAnimalImage(animal);
        
        if (result.status === 'success') {
            // Sort images by confidence
            result.images.sort((a, b) => b.confidence - a.confidence);
            validatedAnimals.push({
                ...animal,
                validatedImages: result.images
            });
        }
        
        results.push(result);

        // Add delay between animals to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Generate report
    const report = {
        totalAnimals: animals.length,
        validatedCount: validatedAnimals.length,
        failedCount: animals.length - validatedAnimals.length,
        validatedAnimals: validatedAnimals,
        failedAnimals: results.filter(r => r.status !== 'success').map(r => r.animal)
    };

    console.log('Validation Complete:', report);
    return report;
}

export { validateAllAnimals, validateAnimalImage };
