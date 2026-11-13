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
  studentBrainstorm: `${R}/student-club-meetup.jpg`,
  passes: null,
  eventEase: null,
  movieReel: `${R}/movie-reel.jpg`,
  vintagePhotography: `${R}/vintage-photography.jpg`,
  calligraphyWorkshop: `${R}/calligraphy-workshop.jpg`,
  cultureWordCloud: `${R}/culture-word-cloud.jpg`,
  creativeNetworking: `${R}/creative-networking.jpg`,
  collaborativePuzzle: `${R}/collaborative-puzzle.jpg`,
  communityBoard: `${R}/community-board.jpg`,
  peopleNetwork: `${R}/people-network.jpg`,
  creativeArtClub: `${R}/creative-art-club.jpg`,
  urbanPhotography: `${R}/urban-photography.jpg`,
  travelCollage: `${R}/travel-collage.jpg`,
  rockMusicPoster: `${R}/rock-music-poster.jpg`,
  openMicPoster: `${R}/open-mic-poster.jpg`,
  readingRainbows: `${R}/reading-rainbows.jpg`,
  classicMicrophone: `${R}/classic-microphone.jpg`,
  bookStack: `${R}/book-stack.jpg`,
  tableTennis: `${R}/table-tennis.jpg`,
  championshipCelebration: `${R}/championship-celebration.jpg`,
  musicHeadphones: `${R}/music-headphones.jpg`,
  musicToggle: `${R}/music-toggle.jpg`,
  gameOn: `${R}/game-on.jpg`,
  cameraMemories: `${R}/camera-memories.jpg`,
} as const;

/** Default poster per category slug, used by seed data and as fallback when an event has no poster. */
export const CATEGORY_POSTER: Record<string, string> = {
  "music-concerts": IMG.musicHeadphones, "cultural-fests": IMG.cultureWordCloud, hackathons: IMG.hackathon, technology: IMG.creativeNetworking,
  sports: IMG.tableTennis, workshops: IMG.calligraphyWorkshop, entrepreneurship: IMG.collaborativePuzzle, "dance-performing-arts": IMG.openMicPoster,
  "photography-art": IMG.cameraMemories, gaming: IMG.gameOn, literature: IMG.readingRainbows, "social-impact": IMG.peopleNetwork,
};
