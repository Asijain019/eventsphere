/**
 * Central map of the user-supplied reference images in /public/assets/ref.
 * Keys that are `null` were NOT in the project files; <SmartImage> falls back to a branded gradient until you add the file.
 */
const R = "/assets/ref";
export const IMG = {
  typography: `${R}/typography-vision-board.jpg`,
  megaphone: `${R}/megaphone-collage.jpg`,
  sportsIllustration: `${R}/sports-geometric.jpg`,
  sportsCollage: `${R}/sports-photo-collage.jpg`,
  hackathon: `${R}/hackathon-poster.jpg`,
  djWebsite: `${R}/dj-website-ref.jpg`,
  djHands: `${R}/dj-photo.jpg`,
  djConsole: `${R}/dj-console-orange.jpg`,
  crowd: `${R}/concert-crowd.jpg`,
  venue: `${R}/event-venue.jpg`,
  stageBW: `${R}/concert-bw.jpg`,
  architecture: `${R}/architecture.png`,
  // Not supplied in the project files — drop these filenames into public/assets/ref/ to activate:
  studentBrainstorm: `${R}/student-brainstorm.jpg`,
  passes: `${R}/event-passes.jpg`,
  eventEase: `${R}/eventease-ref.jpg`,
} as const;

/** Default poster per category slug, used by seed data and as fallback when an event has no poster. */
export const CATEGORY_POSTER: Record<string, string> = {
  "music-concerts": IMG.crowd, "cultural-fests": IMG.venue, hackathons: IMG.hackathon, technology: IMG.hackathon,
  sports: IMG.sportsCollage, workshops: IMG.typography, entrepreneurship: IMG.venue, "dance-performing-arts": IMG.stageBW,
  "photography-art": IMG.megaphone, gaming: IMG.djConsole, literature: IMG.typography, "social-impact": IMG.megaphone,
};
