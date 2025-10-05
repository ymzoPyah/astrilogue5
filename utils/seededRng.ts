// A simple seeded random number generator (Mulberry32).
// This allows for deterministic "random" choices, which is key for replaying sessions.
export class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // Returns a random float between 0 (inclusive) and 1 (exclusive)
    next(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Returns a random integer between min (inclusive) and max (exclusive)
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }

    // Shuffles an array in place
    shuffle<T>(array: T[]): T[] {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = this.nextInt(0, currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // Selects a random element from an array
    select<T>(array: T[]): T {
        return array[this.nextInt(0, array.length)];
    }
}