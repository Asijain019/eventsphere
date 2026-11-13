export const CATEGORIES = [
  { slug: "music-concerts", name: "Music & Concerts", color: "#E83EAB", icon: "Music" },
  { slug: "cultural-fests", name: "Cultural Fests", color: "#FF7A1A", icon: "PartyPopper" },
  { slug: "hackathons", name: "Hackathons", color: "#2F8CFF", icon: "Code2" },
  { slug: "technology", name: "Technology", color: "#8B35FF", icon: "Cpu" },
  { slug: "sports", name: "Sports", color: "#22C55E", icon: "Trophy" },
  { slug: "workshops", name: "Workshops", color: "#D6FF55", icon: "Wrench" },
  { slug: "entrepreneurship", name: "Entrepreneurship", color: "#F5B301", icon: "Rocket" },
  { slug: "dance-performing-arts", name: "Dance & Performing Arts", color: "#FF4D6D", icon: "Drama" },
  { slug: "photography-art", name: "Photography & Art", color: "#14B8A6", icon: "Camera" },
  { slug: "gaming", name: "Gaming", color: "#6366F1", icon: "Gamepad2" },
  { slug: "literature", name: "Literature", color: "#A16207", icon: "BookOpen" },
  { slug: "social-impact", name: "Social Impact", color: "#10B981", icon: "HeartHandshake" },
] as const;

export const SKILLS = ["Frontend", "Backend", "AI/ML", "UI/UX", "Research", "Hardware", "Marketing", "Presentation", "Video Editing", "Public Speaking"] as const;
export const INTERESTS = ["AI & ML", "Coding", "Startups", "Music", "Dance", "Photography", "Sports", "Design", "Gaming", "Entrepreneurship", "Literature", "Volunteering"] as const;
export const DEFAULT_CITY = process.env.NEXT_PUBLIC_DEFAULT_CITY || "jaipur";
export const ROLE_LABEL: Record<string, string> = { STUDENT: "Student", GENERAL: "General user", ORGANIZER: "Organizer", COLLEGE_ADMIN: "College admin", PLATFORM_ADMIN: "Platform admin" };
