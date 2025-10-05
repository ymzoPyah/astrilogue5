
// A simple base64url implementation
const toBase64Url = (str: string) => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (str: string) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
};

export const encodePreset = (preset: object): string => {
    try {
        const jsonString = JSON.stringify(preset);
        return toBase64Url(jsonString);
    } catch (e) {
        console.error("Failed to encode preset:", e);
        return '';
    }
};

export const decodePreset = <T>(q: string): T | null => {
    try {
        const jsonString = fromBase64Url(q);
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to decode preset:", e);
        return null;
    }
};
