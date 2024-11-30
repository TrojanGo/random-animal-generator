import { validateAllAnimals } from './imageValidator.js';
import { animals } from './animals.js';

// Run validation
async function runValidation() {
    console.log('Starting image validation...');
    const report = await validateAllAnimals(animals);

    // Save validated animals to a new file
    const validatedData = JSON.stringify({
        lastUpdated: new Date().toISOString(),
        animals: report.validatedAnimals
    }, null, 2);

    // You'll need to implement a way to save this data
    // For now, we'll log it to console
    console.log('Validation complete!');
    console.log('Validated Animals:', report.validatedCount);
    console.log('Failed Animals:', report.failedCount);
    console.log('Failed Animal List:', report.failedAnimals);

    return report;
}

// Run the validation
runValidation().catch(console.error);
