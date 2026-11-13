/**
 * Pure demo data for `scripts/seed.ts`. Contains NO database code so it can be read (and edited) easily.
 *
 * DISCLOSURE: the colleges are real institutions in/near Jaipur (names only, no affiliation implied) but every EVENT,
 * person, post and message below is fictional DEMO data. All seeded events are flagged `isDemo = true`.
 * Venue coordinates are approximate.
 */
import { IMG, CATEGORY_POSTER } from "../lib/images";

export const DEMO_PASSWORD = "Password123!";

export const CITY_ROWS = [
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan" },
  { slug: "delhi", name: "Delhi", state: "Delhi" },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka" },
  { slug: "pune", name: "Pune", state: "Maharashtra" },
  { slug: "udaipur", name: "Udaipur", state: "Rajasthan" },
  { slug: "kota", name: "Kota", state: "Rajasthan" },
  { slug: "jodhpur", name: "Jodhpur", state: "Rajasthan" },
];

export const COLLEGE_ROWS = [
  { key: "mnit", name: "MNIT Jaipur", website: "https://www.mnit.ac.in" },
  { key: "muj", name: "Manipal University Jaipur", website: "https://jaipur.manipal.edu" },
  { key: "jecrc", name: "JECRC University", website: null },
  { key: "poornima", name: "Poornima College of Engineering", website: "https://www.poornima.org" },
  { key: "lnmiit", name: "LNMIIT Jaipur", website: "https://www.lnmiit.ac.in" },
  { key: "arya", name: "Arya College of Engineering", website: null },
  { key: "jnu", name: "Jaipur National University", website: null },
  { key: "vgu", name: "Vivekananda Global University", website: "https://www.vgu.ac.in" },
  { key: "uor", name: "University of Rajasthan", website: "https://www.uniraj.ac.in" },
  { key: "skit", name: "SKIT Jaipur", website: "https://www.skit.ac.in" },
  { key: "amity", name: "Amity University Jaipur", website: "https://www.amity.edu/jaipur" },
  { key: "rsa", name: "Rajasthan School of Art", website: null },
] as const;
export type CollegeKey = (typeof COLLEGE_ROWS)[number]["key"];

export const ORGANIZATION_ROWS = [
  { key: "mnit-tech", name: "MNIT Tech Society", type: "CLUB", college: "mnit", owner: "organizer" },
  { key: "muj-cultural", name: "Manipal Cultural Council", type: "CLUB", college: "muj", owner: "organizer2" },
  { key: "indie", name: "Jaipur Indie Collective", type: "INDEPENDENT", college: null, owner: "organizer" },
  { key: "ecell-lnmiit", name: "E-Cell LNMIIT", type: "CLUB", college: "lnmiit", owner: "org4" },
] as const;

export type VenueRow = { key: string; name: string; address: string; locality: string; lat: number; lng: number; city?: string };
export const VENUE_ROWS: VenueRow[] = [
  { key: "jkk", name: "Jawahar Kala Kendra", address: "JLN Marg, Jawahar Circle", locality: "Malviya Nagar", lat: 26.8985, lng: 75.8115 },
  { key: "jecc", name: "Jaipur Exhibition & Convention Centre (JECC)", address: "Sitapura Industrial Area, Tonk Road", locality: "Sitapura", lat: 26.7734, lng: 75.8571 },
  { key: "mnit", name: "MNIT Open Air Theatre & Auditorium", address: "Malaviya National Institute of Technology, JLN Marg", locality: "Malviya Nagar", lat: 26.8631, lng: 75.811 },
  { key: "albert", name: "Albert Hall Museum Lawns", address: "Ram Niwas Garden, Near Kishanpole Bazar", locality: "Ram Niwas Bagh", lat: 26.9118, lng: 75.8195 },
  { key: "hawa", name: "Hawa Mahal Chowk (Old City)", address: "Badi Choupad, Pink City", locality: "Old City", lat: 26.9239, lng: 75.8267 },
  { key: "jecrc", name: "JECRC University Central Auditorium", address: "Ramchandrapura, Sitapura Extension, Vidhani", locality: "Sitapura", lat: 26.7683, lng: 75.8705 },
  { key: "muj", name: "Manipal University Jaipur Amphitheatre", address: "Dehmi Kalan, Off Jaipur-Ajmer Expressway", locality: "Dehmi Kalan", lat: 26.8438, lng: 75.5655 },
  { key: "poornima", name: "Poornima Campus Convention Hall", address: "ISI-2, RIICO Institutional Area, Sitapura", locality: "Sitapura", lat: 26.7721, lng: 75.8625 },
  { key: "lnmiit", name: "LNMIIT Main Auditorium", address: "Rupa Ki Nangal, Post Sumel, Jamdoli", locality: "Jamdoli", lat: 26.9368, lng: 75.9234 },
  { key: "amity", name: "Amity University Rajasthan Grounds", address: "Kant Kalwar, NH-11C, Jaipur-Delhi Highway", locality: "Kant Kalwar", lat: 27.0963, lng: 75.9923 },
  { key: "uor", name: "University of Rajasthan Convocation Hall", address: "JLN Marg, Gandhi Nagar", locality: "Gandhi Nagar", lat: 26.8872, lng: 75.8165 },
  { key: "skit", name: "SKIT Seminar Complex", address: "Ramnagaria, Jagatpura", locality: "Jagatpura", lat: 26.8396, lng: 75.873 },
  { key: "vgu", name: "VGU Sports Complex", address: "Jagatpura Road, Near Jaipur Golf Course", locality: "Jagatpura", lat: 26.8219, lng: 75.8644 },
  { key: "rsa", name: "Rajasthan School of Art Gallery", address: "Ramniwas Bagh, Near Ravindra Manch", locality: "Ram Niwas Bagh", lat: 26.911, lng: 75.821 },
  { key: "birla", name: "Birla Auditorium", address: "Statue Circle, Hawa Sarak", locality: "C-Scheme", lat: 26.9035, lng: 75.8 },
  { key: "arya", name: "Arya College Innovation Lab", address: "SP-42, RIICO Industrial Area, Kukas", locality: "Kukas", lat: 27.039, lng: 75.887 },
  { key: "shilpgram", name: "Shilpgram Open Arena", address: "Havala Village, Near Fatehsagar", locality: "Havala", lat: 24.5735, lng: 73.647, city: "udaipur" },
  { key: "bharat", name: "Bharat Mandapam Convention Centre", address: "Pragati Maidan, Mathura Road", locality: "Pragati Maidan", lat: 28.6179, lng: 77.243, city: "delhi" },
];

// ---------------- users ----------------
export type UserRow = {
  key: string; name: string; email: string; role: "STUDENT" | "GENERAL" | "ORGANIZER" | "COLLEGE_ADMIN" | "PLATFORM_ADMIN";
  college?: CollegeKey; city: string; year?: string; bio: string; skills: string[]; interests: string[]; discoverable: boolean; demo?: boolean;
};
export const DEMO_USERS: UserRow[] = [
  { key: "student", name: "Aarav Sharma", email: "student@eventsphere.dev", role: "STUDENT", college: "mnit", city: "jaipur", year: "3rd year", discoverable: true, demo: true,
    bio: "CSE student at MNIT. Full-stack tinkerer, hackathon regular and cricket fan. Looking for a design-minded teammate!", skills: ["Frontend", "Backend"], interests: ["Coding", "Startups", "Sports"] },
  { key: "student2", name: "Priya Meena", email: "student2@eventsphere.dev", role: "STUDENT", college: "muj", city: "jaipur", year: "2nd year", discoverable: true, demo: true,
    bio: "Design student at Manipal Jaipur who loves live music, UI/UX and photography walks around the Pink City.", skills: ["UI/UX", "Presentation"], interests: ["Design", "Music", "Photography"] },
  { key: "student3", name: "Rohan Verma", email: "student3@eventsphere.dev", role: "STUDENT", college: "jecrc", city: "jaipur", year: "4th year", discoverable: true, demo: true,
    bio: "ML enthusiast at JECRC. Building small AI tools, always up for quiz nights and volunteering at campus fests.", skills: ["AI/ML", "Research"], interests: ["AI & ML", "Gaming", "Volunteering"] },
  { key: "organizer", name: "Kavya Singh", email: "organizer@eventsphere.dev", role: "ORGANIZER", college: "mnit", city: "jaipur", year: "Final year", discoverable: false, demo: true,
    bio: "Head of events at the MNIT Tech Society. I run hackathons, cricket cups and open mics.", skills: ["Marketing", "Presentation"], interests: ["Startups", "Music", "Sports"] },
  { key: "organizer2", name: "Vikram Rathore", email: "organizer2@eventsphere.dev", role: "ORGANIZER", college: "muj", city: "jaipur", year: "Final year", discoverable: false, demo: true,
    bio: "Cultural secretary at Manipal Jaipur. Rangotsav lead and dance-battle regular.", skills: ["Marketing", "Public Speaking"], interests: ["Dance", "Music", "Volunteering"] },
  { key: "collegeadmin", name: "Dr. Neha Gupta", email: "collegeadmin@eventsphere.dev", role: "COLLEGE_ADMIN", college: "mnit", city: "jaipur", discoverable: false, demo: true,
    bio: "Dean, Student Affairs at MNIT. Reviews and approves official college events.", skills: [], interests: ["Entrepreneurship"] },
  { key: "admin", name: "EventSphere Admin", email: "admin@eventsphere.dev", role: "PLATFORM_ADMIN", city: "jaipur", discoverable: false, demo: true,
    bio: "Platform administrator for EventSphere (demo account).", skills: [], interests: [] },
];

const BRANCHES = ["CSE", "ECE", "Mechanical", "IT", "Design", "BBA", "Civil", "Electrical", "AI & Data Science", "Fine Arts"];
const YEARS = ["1st year", "2nd year", "3rd year", "4th year"];
const COLLEGE_KEYS = COLLEGE_ROWS.map((c) => c.key);
const COLLEGE_NAME = Object.fromEntries(COLLEGE_ROWS.map((c) => [c.key, c.name])) as Record<CollegeKey, string>;
const SKILL_POOL = ["Frontend", "Backend", "AI/ML", "UI/UX", "Research", "Hardware", "Marketing", "Presentation", "Video Editing", "Public Speaking"];
const INTEREST_POOL = ["AI & ML", "Coding", "Startups", "Music", "Dance", "Photography", "Sports", "Design", "Gaming", "Entrepreneurship", "Literature", "Volunteering"];

const EXTRA_STUDENTS = [
  "Ananya Rathore", "Ishaan Khandelwal", "Diya Agarwal", "Dev Choudhary", "Sneha Jain", "Aditya Pareek", "Riya Bansal", "Karan Shekhawat",
  "Meher Kaur", "Yash Gurjar", "Tanya Mathur", "Harsh Vardhan Singh", "Pooja Saini", "Nikhil Purohit", "Aisha Khan", "Manav Ojha",
  "Kritika Sharma", "Rishabh Tiwari", "Shreya Bhargava", "Aman Yadav", "Simran Chawla",
];
const EXTRA_ORGANIZERS: { name: string; college: CollegeKey }[] = [
  { name: "Siddharth Joshi", college: "jecrc" }, { name: "Meera Khandelwal", college: "lnmiit" },
  { name: "Arjun Bhati", college: "poornima" }, { name: "Nisha Choudhary", college: "uor" },
];
const emailOf = (name: string, domain: string) => name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).slice(0, 2).join(".") + "@" + domain;

/** Deterministic (no randomness) so repeated seeds describe identical users. */
export const EXTRA_USERS: UserRow[] = [
  ...EXTRA_ORGANIZERS.map((o, i): UserRow => ({
    key: `org${i + 3}`, name: o.name, email: emailOf(o.name, "orgs.eventsphere.dev"), role: "ORGANIZER", college: o.college, city: "jaipur", year: "Final year", discoverable: false,
    bio: `Events & outreach lead at ${COLLEGE_NAME[o.college]}. Organising inter-college events across Jaipur.`, skills: ["Marketing", "Presentation"], interests: [INTEREST_POOL[(i * 3) % 12], INTEREST_POOL[(i * 5 + 1) % 12]],
  })),
  ...EXTRA_STUDENTS.map((name, i): UserRow => {
    const college = COLLEGE_KEYS[i % COLLEGE_KEYS.length];
    const skills = [...new Set([SKILL_POOL[i % 10], SKILL_POOL[(i * 3 + 2) % 10]])];
    const interests = [...new Set([INTEREST_POOL[i % 12], INTEREST_POOL[(i * 5 + 1) % 12], INTEREST_POOL[(i * 7 + 3) % 12]])];
    return {
      key: `u${i + 1}`, name, email: emailOf(name, "students.eventsphere.dev"), role: "STUDENT", college, city: i % 11 === 10 ? "udaipur" : "jaipur",
      year: YEARS[i % 4], discoverable: i % 5 !== 4, skills, interests,
      bio: `${YEARS[i % 4]} ${BRANCHES[i % BRANCHES.length]} student at ${COLLEGE_NAME[college]}. Into ${interests[0]} and ${interests[1]}; always up for the next event.`,
    };
  }),
];

// ---------------- events ----------------
const GALLERY: Record<string, string[]> = {
  "music-concerts": [IMG.crowd, IMG.djHands, IMG.djConsole, IMG.stageBW],
  "cultural-fests": [IMG.venue, IMG.crowd, IMG.stageBW],
  hackathons: [IMG.hackathon, IMG.typography, IMG.venue],
  technology: [IMG.hackathon, IMG.venue, IMG.typography],
  sports: [IMG.sportsCollage, IMG.sportsIllustration, IMG.venue],
  workshops: [IMG.typography, IMG.hackathon, IMG.megaphone],
  entrepreneurship: [IMG.venue, IMG.megaphone, IMG.typography],
  "dance-performing-arts": [IMG.stageBW, IMG.crowd, IMG.venue],
  "photography-art": [IMG.megaphone, IMG.stageBW, IMG.typography],
  gaming: [IMG.djConsole, IMG.sportsIllustration, IMG.hackathon],
  literature: [IMG.typography, IMG.megaphone, IMG.stageBW],
  "social-impact": [IMG.megaphone, IMG.venue, IMG.sportsCollage],
};

export type EventRow = {
  key: string; title: string; cat: string; college?: CollegeKey; org: string; orgz?: string; venue: string; city?: string;
  day: number; hour: number; hours: number; cap: number; fee?: number; mode?: "OFFLINE" | "ONLINE" | "HYBRID"; elig?: string;
  desc: string; tags: string[]; teams?: [number, number]; poster?: string; schedule: [string, string, string?][];
};

export const EVENT_ROWS: EventRow[] = [
  { key: "hacksphere", title: "HackSphere 24h Hackathon", cat: "hackathons", college: "jecrc", org: "org3", venue: "jecrc", day: 12, hour: 9, hours: 24, cap: 200, teams: [2, 4],
    elig: "Open to all college students across Jaipur. Teams of 2-4.", tags: ["hackathon", "ai", "web", "24h"],
    desc: "A 24-hour build marathon where inter-college teams ship working prototypes around AI, climate-tech and campus life. Mentors from Jaipur's startup scene, snacks all night, and prizes worth Rs 1,00,000. No team yet? Use Find My Team on EventSphere.",
    schedule: [["09:00", "Check-in & breakfast"], ["10:30", "Opening keynote & problem statements"], ["11:30", "Hacking begins"], ["02:00", "Mentor round (midnight)"], ["09:00", "Code freeze"], ["10:00", "Demos & judging"], ["12:30", "Prize distribution"]] },
  { key: "codestorm", title: "CodeStorm Inter-College Hackathon", cat: "hackathons", college: "lnmiit", org: "org4", orgz: "ecell-lnmiit", venue: "lnmiit", day: 41, hour: 10, hours: 30, cap: 150, fee: 200, teams: [2, 4],
    elig: "UG/PG students from any recognised college. Teams of 2-4.", tags: ["hackathon", "open-source", "devtools"], poster: IMG.hackathon,
    desc: "LNMIIT's flagship 30-hour hackathon with tracks in developer tools, fintech and healthcare. Judged by engineers from product companies; best open-source project wins a special prize.",
    schedule: [["10:00", "Registration"], ["12:00", "Kick-off"], ["13:00", "Hacking starts"], ["20:00", "Mentor office hours"], ["16:00", "Final demos"], ["18:00", "Awards"]] },
  { key: "sunset", title: "Pink City Sunset Sessions", cat: "music-concerts", org: "organizer", orgz: "indie", venue: "albert", day: 6, hour: 17, hours: 5, cap: 27, fee: 499,
    elig: "Open to all (18+ recommended).", tags: ["live-music", "indie", "sunset"], poster: IMG.djHands,
    desc: "An intimate open-air music night on the lawns near Albert Hall: indie bands, a sunset acoustic set and a late DJ closer. Limited to a small crowd so you actually get to meet people.",
    schedule: [["17:00", "Gates open"], ["17:45", "Acoustic sunset set"], ["19:00", "Indie band showcase"], ["21:00", "DJ closer"]] },
  { key: "rangotsav", title: "Rangotsav Cultural Fest", cat: "cultural-fests", college: "muj", org: "organizer2", orgz: "muj-cultural", venue: "muj", day: 20, hour: 11, hours: 36, cap: 2000, fee: 150,
    elig: "Open to students of all colleges. Valid ID required at entry.", tags: ["fest", "culture", "food", "music"], poster: IMG.venue,
    desc: "Manipal Jaipur's three-day colour-splashed cultural fest: dance, drama, fashion, food stalls and a headline concert night. Hundreds of students from colleges across Rajasthan take part.",
    schedule: [["11:00", "Inauguration"], ["13:00", "Food court opens"], ["15:00", "Dance & drama prelims"], ["19:00", "Fashion show"], ["21:00", "Headline concert"]] },
  { key: "cricket", title: "Inter-College Cricket Cup", cat: "sports", college: "mnit", org: "organizer", orgz: "mnit-tech", venue: "vgu", day: 9, hour: 8, hours: 10, cap: 160, fee: 300, teams: [8, 15],
    elig: "College teams of 8-15 players with valid college ID.", tags: ["cricket", "t20", "tournament"], poster: IMG.sportsCollage,
    desc: "A T20 knockout tournament featuring 12 Jaipur college teams. Matches are on turf wickets with floodlights for the semis and final. Register your whole squad through EventSphere.",
    schedule: [["08:00", "Team check-in"], ["09:00", "Round of 16"], ["13:00", "Quarter-finals"], ["16:00", "Semi-finals"], ["18:30", "Final"]] },
  { key: "photowalk", title: "Old City Photography Walk", cat: "photography-art", college: "rsa", org: "org6", venue: "hawa", day: 4, hour: 6, hours: 4, cap: 40,
    elig: "Any camera or phone. Beginners welcome.", tags: ["photography", "heritage", "walk"], poster: IMG.megaphone,
    desc: "Golden-hour street photography through Jaipur's Pink City bazaars, led by faculty and alumni of Rajasthan School of Art. Learn framing, light and storytelling; best frames get exhibited.",
    schedule: [["06:00", "Meet at Hawa Mahal Chowk"], ["06:30", "Guided walk"], ["08:30", "Chai & critique"]] },
  { key: "pitch", title: "Pitch Perfect Jaipur - Startup Pitch Night", cat: "entrepreneurship", college: "lnmiit", org: "org4", orgz: "ecell-lnmiit", venue: "lnmiit", day: 15, hour: 16, hours: 4, cap: 150,
    elig: "Student founders and curious builders.", tags: ["startup", "pitch", "investors"],
    desc: "Ten student startups pitch to a panel of angel investors and founders. Network with the ecosystem over chai and take home feedback you can't get from a classroom.",
    schedule: [["16:00", "Welcome"], ["16:30", "Pitches"], ["18:30", "Panel feedback"], ["19:00", "Networking"]] },
  { key: "openmic", title: "Mic Drop Open Mic Night", cat: "dance-performing-arts", college: "amity", org: "org5", venue: "amity", day: 3, hour: 18, hours: 4, cap: 120,
    elig: "Open to all students.", tags: ["open-mic", "poetry", "stand-up", "music"], poster: IMG.stageBW,
    desc: "Poetry, stand-up, acoustic and beatbox - five minutes, one mic. Perform or just cheer on the best new voices from Jaipur campuses.",
    schedule: [["18:00", "Sign-ups close"], ["18:30", "Performances"], ["20:30", "Audience-choice awards"]] },
  { key: "wordwars", title: "Word Wars: Inter-College Quiz & Debate", cat: "literature", college: "uor", org: "org6", venue: "uor", day: 18, hour: 10, hours: 7, cap: 180, teams: [2, 3],
    elig: "Teams of 2-3 from any college.", tags: ["quiz", "debate", "general-knowledge"],
    desc: "A day of quizzing and parliamentary debate. Prelims, finals and a surprise audience round, hosted by the University of Rajasthan's literary society.",
    schedule: [["10:00", "Quiz prelims"], ["13:00", "Lunch"], ["14:00", "Debate rounds"], ["16:30", "Finals"]] },
  { key: "nextjs", title: "Build Full-Stack Apps with Next.js - Hands-on Workshop", cat: "workshops", college: "poornima", org: "org5", venue: "poornima", day: 7, hour: 10, hours: 6, cap: 60, fee: 199,
    elig: "Basic JavaScript knowledge. Bring a laptop.", tags: ["nextjs", "react", "typescript", "workshop"], poster: IMG.typography,
    desc: "Go from zero to a deployed full-stack app: routing, server components, API routes, a Postgres database and deployment. You leave with a working project and a GitHub repo.",
    schedule: [["10:00", "Setup & fundamentals"], ["11:30", "Routing & data fetching"], ["13:30", "Database & API routes"], ["15:00", "Deploy"]] },
  { key: "dancebattle", title: "Step Up: Inter-College Dance Battle", cat: "dance-performing-arts", college: "amity", org: "org5", venue: "amity", day: 25, hour: 15, hours: 6, cap: 500, fee: 100, teams: [1, 8],
    elig: "Solo and crew categories (up to 8 dancers).", tags: ["dance", "hip-hop", "battle", "crew"], poster: IMG.stageBW,
    desc: "Solo and crew dance battles across hip-hop, contemporary and Bollywood fusion, judged live by professional choreographers.",
    schedule: [["15:00", "Prelims"], ["17:30", "Crew battles"], ["19:30", "Solo finals"], ["21:00", "Results"]] },
  { key: "lit", title: "Kahaani: Campus Literature Fest", cat: "literature", college: "uor", org: "org6", venue: "uor", day: 33, hour: 10, hours: 8, cap: 300,
    elig: "Open to all.", tags: ["books", "poetry", "storytelling"], poster: IMG.typography,
    desc: "Author conversations, poetry slams, a storytelling circle and a second-hand book swap. Meet local authors and fellow readers.",
    schedule: [["10:00", "Opening conversation"], ["12:00", "Poetry slam"], ["14:30", "Storytelling circle"], ["16:30", "Book swap"]] },
  { key: "cleanjaipur", title: "Clean Jaipur Drive - Lake & Garden Clean-up", cat: "social-impact", college: "vgu", org: "org4", venue: "albert", day: 5, hour: 7, hours: 4, cap: 150,
    elig: "Anyone willing to help. Gloves and bags provided.", tags: ["volunteering", "environment", "community"],
    desc: "Join students from across the city to clean up Ram Niwas Bagh and plant saplings. We provide gloves, bags and refreshments; you provide the energy.",
    schedule: [["07:00", "Briefing & teams"], ["07:30", "Clean-up"], ["10:00", "Sapling plantation"], ["11:00", "Refreshments"]] },
  { key: "raktdaan", title: "Raktdaan Mahotsav - Blood Donation & Health Camp", cat: "social-impact", college: "skit", org: "organizer", venue: "skit", day: 28, hour: 9, hours: 7, cap: 250,
    elig: "Donors must be 18+ and medically fit.", tags: ["health", "blood-donation", "awareness"],
    desc: "A blood donation drive with health screening and awareness sessions, run with a registered blood bank. Volunteers needed for registration and hospitality.",
    schedule: [["09:00", "Camp opens"], ["11:00", "Awareness talk"], ["16:00", "Camp closes"]] },
  { key: "aisummit", title: "AI for Bharat Summit", cat: "technology", college: "mnit", org: "organizer", orgz: "mnit-tech", venue: "mnit", day: 30, hour: 9, hours: 8, cap: 400, fee: 299, mode: "HYBRID",
    elig: "Open to all. Online passes available.", tags: ["ai", "ml", "genai", "summit"], poster: IMG.hackathon,
    desc: "Talks and demos on practical AI in India: language models for Indic languages, agriculture, health and education. Attend in person or stream online.",
    schedule: [["09:00", "Keynote"], ["11:00", "Indic LLM panel"], ["14:00", "Live demos"], ["16:00", "Fireside chat"]] },
  { key: "devops", title: "Cloud & DevOps Bootcamp", cat: "technology", college: "poornima", org: "org5", venue: "poornima", day: 18, hour: 10, hours: 5, cap: 80,
    elig: "Intermediate programmers. Bring a laptop.", tags: ["docker", "ci-cd", "devops", "cloud"],
    desc: "Containerise an app with Docker, set up a CI pipeline with GitHub Actions and deploy to the cloud, all in one afternoon.",
    schedule: [["10:00", "Docker fundamentals"], ["12:00", "CI with GitHub Actions"], ["14:00", "Deploy to the cloud"]] },
  { key: "roborumble", title: "RoboRumble Robotics Expo", cat: "technology", college: "jnu", org: "org4", venue: "jecc", day: 50, hour: 10, hours: 8, cap: 500,
    elig: "Open to all. Teams can enter robots in battle categories.", tags: ["robotics", "iot", "hardware"],
    desc: "Line-followers, combat bots and drone demos from colleges across Rajasthan, plus a hands-on electronics corner for beginners.",
    schedule: [["10:00", "Expo opens"], ["12:00", "Line-follower rounds"], ["15:00", "Bot battles"], ["17:30", "Awards"]] },
  { key: "valorant", title: "Valorant Campus Clash", cat: "gaming", college: "arya", org: "org3", venue: "arya", day: 14, hour: 11, hours: 9, cap: 96, fee: 250, teams: [5, 6],
    elig: "Teams of 5 (+1 sub). Bring your own peripherals.", tags: ["esports", "valorant", "lan"], poster: IMG.djConsole,
    desc: "A LAN esports tournament with 16 college teams, casters and a live-streamed final on a big screen.",
    schedule: [["11:00", "Check-in"], ["12:00", "Group stage"], ["16:00", "Playoffs"], ["19:00", "Grand final"]] },
  { key: "chess", title: "Campus Chess Open - Online Blitz", cat: "gaming", college: "skit", org: "organizer", venue: "skit", day: 47, hour: 19, hours: 3, cap: 128, mode: "ONLINE",
    elig: "Any student. Lichess account required.", tags: ["chess", "online", "blitz"], poster: IMG.sportsIllustration,
    desc: "A fast-paced online blitz arena for college chess players. Join from anywhere; the link is shared after registration.",
    schedule: [["19:00", "Arena starts"], ["21:30", "Results"]] },
  { key: "bass", title: "Bass Republic: EDM Night", cat: "music-concerts", org: "organizer", orgz: "indie", venue: "jecc", day: 22, hour: 19, hours: 6, cap: 1500, fee: 999,
    elig: "18+ with valid ID.", tags: ["edm", "dj", "nightlife"], poster: IMG.djConsole,
    desc: "Jaipur's biggest student-friendly EDM night. Three DJs, a laser stage and a massive sound system at JECC Sitapura.",
    schedule: [["19:00", "Doors"], ["20:00", "Opening DJ"], ["21:30", "Headliner set"], ["00:30", "Close"]] },
  { key: "raag", title: "Raag Rajasthan: Folk & Classical Evening", cat: "music-concerts", org: "organizer2", venue: "jkk", day: 11, hour: 18, hours: 3, cap: 300, fee: 250,
    elig: "Open to all.", tags: ["folk", "classical", "heritage", "live-music"], poster: IMG.stageBW,
    desc: "An evening of Manganiyar folk, ghoomar and Hindustani classical, with artists from across Rajasthan at Jawahar Kala Kendra.",
    schedule: [["18:00", "Welcome"], ["18:30", "Folk ensemble"], ["19:45", "Classical recital"]] },
  { key: "djfaceoff", title: "Campus DJ Face-Off", cat: "music-concerts", college: "poornima", org: "org5", venue: "poornima", day: 38, hour: 17, hours: 5, cap: 600, fee: 150,
    elig: "Student DJs can apply to play; audience open to all.", tags: ["dj", "battle", "campus"], poster: IMG.djHands,
    desc: "Student DJs battle it out with 15-minute sets while the crowd votes. The winner opens for a professional act.",
    schedule: [["17:00", "Doors"], ["17:30", "Round 1"], ["20:00", "Final"]] },
  { key: "ecell", title: "E-Cell Summit Jaipur", cat: "entrepreneurship", college: "mnit", org: "organizer", orgz: "mnit-tech", venue: "mnit", day: 60, hour: 10, hours: 8, cap: 600, fee: 499,
    elig: "Open to all students and early-stage founders.", tags: ["entrepreneurship", "summit", "networking"],
    desc: "Founders, investors and students under one roof for keynotes, startup expo and mentoring sessions.",
    schedule: [["10:00", "Keynote"], ["12:00", "Startup expo"], ["15:00", "Mentoring circles"]] },
  { key: "designstudio", title: "Design Thinking Studio", cat: "workshops", college: "rsa", org: "org6", venue: "rsa", day: 8, hour: 11, hours: 4, cap: 20,
    elig: "Open to all. Limited to 20 seats.", tags: ["design", "ux", "workshop"], poster: IMG.typography,
    desc: "A small-group, hands-on studio on problem framing, rapid prototyping and user testing with paper and Figma. (This demo event is intentionally full to test the waitlist.)",
    schedule: [["11:00", "Framing the problem"], ["12:30", "Rapid prototyping"], ["14:00", "Testing & critique"]] },
  { key: "artexpo", title: "Rang Canvas Art Exhibition", cat: "photography-art", college: "rsa", org: "org6", venue: "jkk", day: 27, hour: 11, hours: 8, cap: 250,
    elig: "Open to all. Artists can apply to exhibit.", tags: ["art", "exhibition", "painting"], poster: IMG.megaphone,
    desc: "Paintings, sculpture and digital art from emerging artists at Rajasthan School of Art, plus live sketching and a collectors' corner.",
    schedule: [["11:00", "Gallery opens"], ["14:00", "Live sketching"], ["17:00", "Artist talk"]] },
  { key: "nukkad", title: "Nukkad Natak Festival", cat: "dance-performing-arts", college: "uor", org: "org6", venue: "birla", day: 35, hour: 16, hours: 5, cap: 350,
    elig: "Open to all. Teams of up to 10 can perform.", tags: ["theatre", "street-play", "social-issues"],
    desc: "Street theatre troupes from across the region perform powerful 15-minute plays on social issues.",
    schedule: [["16:00", "Opening"], ["16:30", "Performances"], ["20:00", "Awards"]] },
  { key: "udaipur-lit", title: "Lake City Literary Retreat", cat: "literature", org: "organizer2", venue: "shilpgram", city: "udaipur", day: 44, hour: 10, hours: 8, cap: 120, fee: 350,
    elig: "Open to all.", tags: ["writing", "retreat", "udaipur"], poster: IMG.typography,
    desc: "A day of writing workshops and readings by the lakeside in Udaipur.",
    schedule: [["10:00", "Writing workshop"], ["14:00", "Readings"], ["17:00", "Sunset conversations"]] },
  { key: "udaipur-dance", title: "Mewar Music & Dance Utsav", cat: "dance-performing-arts", org: "organizer2", venue: "shilpgram", city: "udaipur", day: 70, hour: 17, hours: 5, cap: 800, fee: 200,
    elig: "Open to all.", tags: ["folk", "dance", "udaipur"], poster: IMG.stageBW,
    desc: "Folk dance and music from Mewar performed in the open arena at Shilpgram.",
    schedule: [["17:00", "Doors"], ["18:00", "Performances"]] },
  { key: "delhi-demo", title: "Startup Delhi Demo Day", cat: "entrepreneurship", org: "organizer", venue: "bharat", city: "delhi", day: 55, hour: 10, hours: 8, cap: 500,
    elig: "Open to student founders and investors.", tags: ["startup", "demo-day", "delhi"], poster: IMG.venue,
    desc: "Student startups from northern India demo to investors and corporates in New Delhi.",
    schedule: [["10:00", "Demos"], ["14:00", "Investor meetings"]] },
  { key: "sportsday", title: "Pink City 5K Run & Fitness Carnival", cat: "sports", college: "skit", org: "organizer", venue: "albert", day: 16, hour: 6, hours: 4, cap: 400, elig: "All fitness levels.", tags: ["running", "fitness", "5k"], poster: IMG.sportsIllustration,
    desc: "A friendly 5K through Ram Niwas Bagh followed by fitness stalls, yoga and a healthy breakfast.",
    schedule: [["06:00", "Warm-up"], ["06:30", "5K run"], ["08:00", "Fitness carnival"]] },
  { key: "uxsprint", title: "Figma to Frontend: UI/UX Sprint", cat: "workshops", college: "muj", org: "organizer2", venue: "muj", day: 23, hour: 10, hours: 6, cap: 70, fee: 149, elig: "Designers and developers.", tags: ["ui", "ux", "figma", "frontend"],
    desc: "Designers and developers pair up to design and build a small product in a single day.",
    schedule: [["10:00", "Design sprint"], ["13:30", "Build"], ["16:00", "Showcase"]] },
];
for (const e of EVENT_ROWS) e.poster ??= CATEGORY_POSTER[e.cat];
export const galleryFor = (cat: string, poster: string) => [poster, ...(GALLERY[cat] ?? []).filter((u) => u !== poster)].slice(0, 3);

// ---------------- teams ----------------
export type TeamRow = { key: string; event: string; name: string; description: string; captain: string; members: [string, string][]; open: string[]; max: number; status: "FORMING" | "REGISTERED"; pending?: [string, string][] };
export const TEAM_ROWS: TeamRow[] = [
  { key: "byte", event: "hacksphere", name: "Byte Brigade", description: "Two devs looking for a designer and an ML person for an AI-for-campus idea.", captain: "student", members: [["student2", "UI/UX"]], open: ["AI/ML", "Backend"], max: 4, status: "FORMING", pending: [["u1", "Hi! I do ML and love hackathons - can I join?"]] },
  { key: "neural", event: "hacksphere", name: "Neural Ninjas", description: "Full squad building an Indic-language study assistant.", captain: "u3", members: [["u4", "AI/ML"], ["u5", "Backend"], ["u6", "Frontend"]], open: [], max: 4, status: "REGISTERED" },
  { key: "pixel", event: "hacksphere", name: "Pixel Pirates", description: "Frontend-heavy team, need someone strong in backend.", captain: "u7", members: [["u8", "UI/UX"]], open: ["Backend", "AI/ML"], max: 4, status: "FORMING" },
  { key: "nullp", event: "hacksphere", name: "Null Pointers", description: "Hardware + software hybrid team.", captain: "u9", members: [["u10", "Hardware"]], open: ["Frontend"], max: 4, status: "FORMING" },
  { key: "mavericks", event: "cricket", name: "MNIT Mavericks", description: "MNIT's official squad. Open for all-rounders.", captain: "u8", members: [["u9", "Batter"], ["u10", "Bowler"], ["u11", "Wicketkeeper"], ["u12", "All-rounder"], ["u13", "Bowler"], ["u14", "Batter"], ["u15", "Fielder"], ["u16", "Batter"]], open: ["Spinner"], max: 15, status: "REGISTERED" },
  { key: "spike", event: "valorant", name: "Spike Rushers", description: "Arya College's main squad, looking for a sentinel.", captain: "u17", members: [["u18", "Duelist"], ["u19", "Controller"], ["u20", "Initiator"], ["u21", "Sentinel"]], open: [], max: 6, status: "REGISTERED" },
];

// ---------------- participation & volunteering ----------------
export type OppRow = { key: string; event: string; type: string; title: string; description: string; eligibility?: string; capacity: number; deadlineDays: number };
export const OPPORTUNITY_ROWS: OppRow[] = [
  { key: "hack-main", event: "hacksphere", type: "HACKATHON", title: "Compete in HackSphere (team track)", description: "Apply to compete in the main hackathon track. Tell us about your idea or your strongest project.", eligibility: "College students, teams of 2-4", capacity: 50, deadlineDays: 10 },
  { key: "sunset-acts", event: "sunset", type: "SINGING", title: "Perform at Pink City Sunset Sessions", description: "We are looking for two acoustic or indie acts for 25-minute sets. Share a link to your music.", eligibility: "Original or cover acts, solo or band", capacity: 2, deadlineDays: 4 },
  { key: "openmic-slots", event: "openmic", type: "OPEN_MIC", title: "Open mic performer slots", description: "Poetry, stand-up, music or beatbox. 5 minutes per act.", capacity: 20, deadlineDays: 2 },
  { key: "dance-crew", event: "dancebattle", type: "DANCE", title: "Enter the dance battle (solo or crew)", description: "Submit a 60-second audition clip of your style.", eligibility: "Solo or crew up to 8", capacity: 40, deadlineDays: 20 },
  { key: "quiz-teams", event: "wordwars", type: "QUIZ", title: "Quiz league team entry", description: "Register your trio for the inter-college quiz prelims.", eligibility: "Teams of 2-3", capacity: 30, deadlineDays: 14 },
  { key: "cricket-squad", event: "cricket", type: "SPORTS", title: "Enter a cricket squad", description: "Captains: submit your squad strength and past tournament experience.", eligibility: "College teams, 8-15 players", capacity: 12, deadlineDays: 6 },
  { key: "photo-contest", event: "photowalk", type: "PHOTOGRAPHY", title: "Photography contest entry", description: "Submit up to three frames from the walk for the exhibition shortlist.", capacity: 25, deadlineDays: 3 },
  { key: "pitch-slot", event: "pitch", type: "SPEAKER", title: "Pitch your startup (5-minute slot)", description: "Tell us about your startup, traction and what you need.", eligibility: "Student-led startups", capacity: 10, deadlineDays: 10 },
  { key: "art-exhibit", event: "artexpo", type: "EXHIBITION", title: "Exhibit your artwork", description: "Apply with a portfolio link; selected artists get a free display space.", capacity: 30, deadlineDays: 20 },
  { key: "dj-slots", event: "djfaceoff", type: "OTHER", title: "Student DJ slots", description: "Share a 5-minute mix to play in the face-off.", capacity: 8, deadlineDays: 30 },
];

export type VolRow = { key: string; event: string; title: string; description: string; responsibilities: string; skills: string[]; openings: number; shift: string; startH: number; endH: number; eligibility?: string; deadlineDays: number };
export const VOLUNTEER_ROWS: VolRow[] = [
  { key: "hack-reg", event: "hacksphere", title: "Registration & Check-in Desk", description: "Welcome participants and manage badge distribution.", responsibilities: "Scan tickets, hand out badges, direct teams to their tables.", skills: ["Presentation"], openings: 6, shift: "Day 1, 08:00-12:00", startH: 8, endH: 12, deadlineDays: 9 },
  { key: "hack-mentor", event: "hacksphere", title: "Technical Mentor Assistant", description: "Help mentors move between teams and log queries.", responsibilities: "Coordinate mentor rounds and log support requests.", skills: ["Frontend", "Backend"], openings: 4, shift: "Night shift 20:00-02:00", startH: 20, endH: 26, deadlineDays: 9 },
  { key: "sunset-stage", event: "sunset", title: "Stage & Artist Hospitality", description: "Look after artists backstage.", responsibilities: "Greet artists, manage green room, coordinate with sound crew.", skills: ["Marketing"], openings: 3, shift: "16:00-21:00", startH: 16, endH: 21, deadlineDays: 4 },
  { key: "rang-crowd", event: "rangotsav", title: "Crowd Management Volunteer", description: "Help keep the fest safe and orderly.", responsibilities: "Guide queues, assist security, support first aid.", skills: [], openings: 25, shift: "Day 1-3 (two shifts)", startH: 10, endH: 20, deadlineDays: 17 },
  { key: "clean-lead", event: "cleanjaipur", title: "Team Leader (Clean-up)", description: "Lead a team of 8 volunteers during the drive.", responsibilities: "Brief the team, hand out gloves, keep the area log.", skills: ["Public Speaking"], openings: 8, shift: "07:00-11:00", startH: 7, endH: 11, deadlineDays: 4 },
  { key: "clean-photo", event: "cleanjaipur", title: "Event Photographer", description: "Document the drive for social media.", responsibilities: "Capture photos and short clips; share within 24 hours.", skills: ["Video Editing"], openings: 2, shift: "07:00-11:00", startH: 7, endH: 11, deadlineDays: 4 },
  { key: "blood-desk", event: "raktdaan", title: "Donor Registration Desk", description: "Register donors and manage the waiting area.", responsibilities: "Fill donor forms, manage tokens, guide donors.", skills: [], openings: 10, shift: "09:00-16:00", startH: 9, endH: 16, deadlineDays: 25 },
  { key: "cricket-score", event: "cricket", title: "Scorer & Match Coordinator", description: "Keep official scores and coordinate teams.", responsibilities: "Maintain scoresheets, announce schedules.", skills: ["Research"], openings: 4, shift: "08:00-18:00", startH: 8, endH: 18, deadlineDays: 7 },
];

// ---------------- communities ----------------
export type CommunityRow = { slug: string; name: string; topic: string; description: string; owner: string; posts: [string, string][]; cover: string };
export const INTEREST_COMMUNITIES: CommunityRow[] = [
  { slug: "ai-ml", name: "AI & Machine Learning", topic: "AI & ML", owner: "org3", cover: IMG.hackathon,
    description: "Share papers, projects and hackathon ideas. From first neural nets to LLM apps.",
    posts: [["Best resources to start with LLM fine-tuning?", "I know basic PyTorch. What are the best free resources to get started with fine-tuning small language models for Indic languages?"], ["Study group: Andrew Ng's course", "Starting a weekly online study group for the ML specialisation. Reply if you want in."]] },
  { slug: "coding", name: "Coding & Open Source", topic: "Coding", owner: "organizer", cover: IMG.typography,
    description: "Algorithms, web dev, open source and developer career chat for Jaipur's builders.",
    posts: [["Which stack for a first full-stack project?", "Between Next.js + Postgres and MERN, what would you recommend for a final-year project that also looks good on a CV?"], ["Weekly LeetCode accountability thread", "Post what you solved this week. No judgement, just consistency."]] },
  { slug: "startups", name: "Startups & Founders", topic: "Startups", owner: "org4", cover: IMG.venue,
    description: "For student founders: ideas, co-founders, funding and lessons learned.",
    posts: [["Looking for a technical co-founder", "I have a validated idea for campus food logistics and need a backend developer. DM if interested."], ["Where to get first 10 customers?", "What worked for you when you had zero traction?"]] },
  { slug: "music", name: "Music Lovers Jaipur", topic: "Music", owner: "organizer", cover: IMG.crowd,
    description: "Gigs, jam sessions, open mics and finding bandmates around Jaipur.",
    posts: [["Looking for a drummer for a campus band", "We are a three-piece indie band, rehearsing in Malviya Nagar on weekends."], ["Best venues for live gigs in Jaipur?", "Share your favourite spots for live music, small or big."]] },
  { slug: "dance", name: "Dance Crew Connect", topic: "Dance", owner: "organizer2", cover: IMG.stageBW,
    description: "Find crew members, rehearsal spaces and battles. All styles welcome.",
    posts: [["Hip-hop crew has two open spots", "Practising in Sitapura on Sundays. Intermediate level preferred."], ["Choreography ideas for the Step Up battle?", "Looking for fresh ideas for a 3-minute crew routine."]] },
  { slug: "photography", name: "Photography & Visual Stories", topic: "Photography", owner: "org6", cover: IMG.megaphone,
    description: "Photo walks, critiques and gear talk. Phone photographers welcome.",
    posts: [["Golden hour spots in the Pink City", "Where do you shoot in Jaipur for good light? I'm planning a walk this weekend."], ["Monthly photo challenge: Reflections", "Post your best frame and we will discuss composition."]] },
  { slug: "sports", name: "Sports & Fitness", topic: "Sports", owner: "organizer", cover: IMG.sportsCollage,
    description: "Cricket, football, running and everything in between. Find teammates and tournaments.",
    posts: [["Need 2 players for weekend football", "Playing at VGU ground on Saturday evenings. All levels fine."], ["Training plan for the 5K run", "Anyone want to train together for the upcoming 5K?"]] },
  { slug: "design", name: "Design & UI/UX", topic: "Design", owner: "organizer2", cover: IMG.typography,
    description: "Portfolio reviews, Figma tips and design challenges.",
    posts: [["Portfolio review thread", "Drop your portfolio link and give feedback to two others."], ["Figma auto-layout tips", "Sharing a few tricks that saved me hours this semester."]] },
  { slug: "gaming", name: "Gaming & Esports", topic: "Gaming", owner: "org3", cover: IMG.djConsole,
    description: "Find squads, LAN events and tournaments. Valorant, BGMI, FIFA and chess.",
    posts: [["Valorant squad needs a sentinel", "Radiant to Ascendant level. Joining the Campus Clash. Reply if interested."], ["Chess blitz night this Friday", "Informal online blitz for beginners and improvers."]] },
  { slug: "entrepreneurship", name: "Entrepreneurship Circle", topic: "Entrepreneurship", owner: "organizer", cover: IMG.venue,
    description: "Small business, side-hustles and social enterprises. Share what you learn.",
    posts: [["Side hustle ideas that worked in college", "I started selling handmade prints at fests. What worked for you?"], ["Pitch deck feedback", "Happy to review pitch decks if you review mine."]] },
];
export const COMMENT_SNIPPETS = [
  "Great question! I'd start with the official docs and build something small.", "Count me in, this sounds really useful.", "Thanks for sharing, bookmarking this.",
  "Happy to help, drop me a message.", "Same here! Anyone else interested?", "We tried this last semester and it worked well.", "This is exactly what I was looking for.", "Let's catch up at the next event!",
];
export const MESSAGE_THREAD: [string, string][] = [
  ["student", "Hey Priya! Saw you're registered for Pink City Sunset Sessions too."],
  ["student2", "Hi Aarav! Yes, can't wait. Are you going for the HackSphere hackathon as well?"],
  ["student", "Definitely. I'm putting together Byte Brigade and we need a designer. Interested?"],
  ["student2", "Sounds fun! Count me in. Send me the team link."],
  ["student", "Done, just added you. We still need an ML person."],
  ["student2", "I'll ask around in the AI & ML community."],
];
