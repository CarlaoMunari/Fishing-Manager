/**
 * Calculate the average score for a team based on fish measurements
 * CRITICAL RULE: Always divide by 6 (maximum quota), regardless of how many fish were caught
 * 
 * @param measurements - Array of fish measurements in cm (up to 6)
 * @returns Average score rounded to 2 decimal places
 * 
 * @example
 * calculateAverageScore([30, 40]) // Returns 11.67 (70 / 6)
 * calculateAverageScore([30, 35, 40, 32, 38, 36]) // Returns 35.17 (211 / 6)
 * calculateAverageScore([50]) // Returns 8.33 (50 / 6)
 */
export function calculateAverageScore(measurements: number[]): number {
    // Filter out zero or negative values and take only first 6 measurements
    const validMeasurements = measurements
        .filter(m => m > 0)
        .slice(0, 6);

    // Sum all measurements
    const sum = validMeasurements.reduce((acc, curr) => acc + curr, 0);

    // CRITICAL: Always divide by 6, not by the number of fish caught
    const average = sum / 6;

    // Round to 2 decimal places
    return Math.round(average * 100) / 100;
}

/**
 * Format a score for display
 */
export function formatScore(score: number): string {
    return score.toFixed(2);
}
