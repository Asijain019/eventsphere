/**
 * Central map of the supplied reference images in /public/assets/ref.
 * Missing reference images are null so <SmartImage> can render its branded fallback without a failed request.
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
  studentBrainstorm: null,
  passes: null,
  eventEase: null,
} as const;

/** Default poster per category slug, used by seed data and as fallback when an event has no poster. */
export const CATEGORY_POSTER: Record<string, string> = {
  "music-concerts": IMG.crowd, "cultural-fests": IMG.venue, hackathons: IMG.hackathon, technology: IMG.hackathon,
  sports: IMG.sportsCollage, workshops: IMG.typography, entrepreneurship: IMG.venue, "dance-performing-arts": IMG.stageBW,
  "photography-art": IMG.megaphone, gaming: IMG.djConsole, literature: IMG.typography, "social-impact": IMG.megaphone,
};
