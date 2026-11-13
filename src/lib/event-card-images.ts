import { CATEGORY_POSTER, IMG } from "@/lib/images";
import type { EventListItem } from "@/modules/events/types";

const CATEGORY_CARD_IMAGES: Record<string, readonly string[]> = {
  "music-concerts": [IMG.musicHeadphones, IMG.djHands, IMG.crowd, IMG.stageBW, IMG.djConsole],
  "cultural-fests": [IMG.cultureWordCloud, IMG.venue, IMG.travelCollage, IMG.classicMicrophone],
  hackathons: [IMG.hackathon, IMG.collaborativePuzzle, IMG.creativeNetworking, IMG.architecture],
  technology: [IMG.creativeNetworking, IMG.architecture, IMG.hackathon],
  sports: [IMG.sportsCollage, IMG.sportsIllustration, IMG.tableTennis, IMG.championshipCelebration],
  workshops: [IMG.calligraphyWorkshop, IMG.typography, IMG.creativeArtClub, IMG.bookStack, IMG.architecture],
  entrepreneurship: [IMG.collaborativePuzzle, IMG.creativeNetworking, IMG.studentBrainstorm],
  "dance-performing-arts": [IMG.openMicPoster, IMG.classicMicrophone, IMG.djHands, IMG.crowd],
  "photography-art": [IMG.urbanPhotography, IMG.cameraMemories, IMG.vintagePhotography, IMG.creativeArtClub, IMG.travelCollage],
  gaming: [IMG.gameOn, IMG.musicToggle, IMG.djConsole],
  literature: [IMG.readingRainbows, IMG.bookStack, IMG.vintagePhotography],
  "social-impact": [IMG.peopleNetwork, IMG.communityBoard, IMG.studentBrainstorm],
};

const ALL_CARD_IMAGES = Object.values(IMG).flatMap((source) => source === null ? [] : [source]);

function imageKey(source: string) {
  try {
    const url = new URL(source, "https://eventsphere.local");
    return `${url.origin}${url.pathname}`;
  } catch {
    return source.trim().split(/[?#]/, 1)[0];
  }
}

export function withDistinctEventPosters<T extends Pick<EventListItem, "posterUrl" | "categorySlug">>(events: readonly T[]): T[] {
  const used = new Set<string>();

  return events.map((event) => {
    const poster = event.posterUrl || CATEGORY_POSTER[event.categorySlug] || "";
    const isDuplicate = poster !== "" && used.has(imageKey(poster));
    const replacement = isDuplicate
      ? CATEGORY_CARD_IMAGES[event.categorySlug]?.find((image) => !used.has(imageKey(image)))
        ?? ALL_CARD_IMAGES.find((image) => !used.has(imageKey(image)))
      : undefined;
    const posterUrl = replacement ?? poster;

    if (posterUrl) used.add(imageKey(posterUrl));
    return posterUrl === event.posterUrl ? event : { ...event, posterUrl };
  });
}
