// Opt-in at build time; absent or any value other than true keeps music off.
export const BACKGROUND_MUSIC_ENABLED = import.meta.env.VITE_BACKGROUND_MUSIC === 'true';
