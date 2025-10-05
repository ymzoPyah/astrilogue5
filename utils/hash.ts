export async function createHash(str: string): Promise<string> {
    const textAsBuffer = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashAsHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashAsHex;
}
