export interface InitialSettings {
    readonly inputLimitBytes: number;
}
export function validateInputSettings(value: unknown): value is InitialSettings {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== 'inputLimitBytes') return false;
    const limit = (value as {inputLimitBytes:unknown}).inputLimitBytes;
    return typeof limit === 'number' && Number.isSafeInteger(limit) && limit >= 1 && limit <= 1048576;
}
