import {
  pgTable, pgEnum, text, integer, boolean, timestamp, jsonb, doublePrecision,
  uniqueIndex, index, primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- enums ----------
export const roleEnum = pgEnum("role", ["STUDENT", "GENERAL", "ORGANIZER", "COLLEGE_ADMIN", "PLATFORM_ADMIN"]);
export const verificationEnum = pgEnum("verification_status", ["PENDING", "VERIFIED", "REJECTED"]);
export const eventStatusEnum = pgEnum("event_status", ["DRAFT", "PUBLISHED", "CANCELLED", "POSTPONED", "COMPLETED"]);
export const eventModeEnum = pgEnum("event_mode", ["OFFLINE", "ONLINE", "HYBRID"]);
export const registrationStatusEnum = pgEnum("registration_status", ["CONFIRMED", "WAITLISTED", "CANCELLED"]);
export const registrationTypeEnum = pgEnum("registration_type", ["ATTENDEE", "TEAM"]);
export const teamStatusEnum = pgEnum("team_status", ["FORMING", "COMPLETE", "REGISTERED", "DISBANDED"]);
export const requestStatusEnum = pgEnum("request_status", ["PENDING", "ACCEPTED", "DECLINED"]);
export const communityTypeEnum = pgEnum("community_type", ["EVENT", "INTEREST", "COLLEGE"]);
export const joinPolicyEnum = pgEnum("join_policy", ["OPEN", "APPROVAL", "REGISTERED_ONLY"]);
export const membershipStatusEnum = pgEnum("membership_status", ["ACTIVE", "PENDING", "REMOVED"]);
export const communityRoleEnum = pgEnum("community_role", ["OWNER", "MODERATOR", "MEMBER"]);
export const applicationStatusEnum = pgEnum("application_status", ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", ["HACKATHON", "DANCE", "SINGING", "SPORTS", "QUIZ", "OPEN_MIC", "PHOTOGRAPHY", "SPEAKER", "EXHIBITION", "OTHER"]);
export const openClosedEnum = pgEnum("open_closed", ["OPEN", "CLOSED"]);
export const completionEnum = pgEnum("completion_status", ["PENDING", "COMPLETED", "NO_SHOW"]);
export const reportStatusEnum = pgEnum("report_status", ["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "REGISTRATION_CONFIRMED", "EVENT_UPDATED", "EVENT_CANCELLED", "CONNECTION_REQUEST", "CONNECTION_ACCEPTED",
  "APPLICATION_STATUS", "VOLUNTEER_ASSIGNED", "TEAM_INVITE", "TEAM_JOIN_REQUEST", "TEAM_JOIN_ACCEPTED",
  "ANNOUNCEMENT", "GENERIC",
]);

// ---------- geography & institutions ----------
export const cities = pgTable("cities", {
  id: id(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  state: text("state").notNull(), country: text("country").notNull().default("India"),
});

export const colleges = pgTable("colleges", {
  id: id(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  cityId: text("city_id").notNull().references(() => cities.id),
  website: text("website"), logoUrl: text("logo_url"),
  verificationStatus: verificationEnum("verification_status").notNull().default("PENDING"),
  createdAt: createdAt(),
}, (t) => [index("colleges_city_idx").on(t.cityId)]);

// ---------- identity ----------
export const users = pgTable("users", {
  id: id(), name: text("name").notNull(), email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("STUDENT"),
  status: text("status").notNull().default("ACTIVE"),
  homeCityId: text("home_city_id").references(() => cities.id),
  profileVisibility: text("profile_visibility").notNull().default("PUBLIC"), // PUBLIC | CONNECTIONS | PRIVATE
  discoverable: boolean("discoverable").notNull().default(false), // opt-in attendee discovery
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("users_city_idx").on(t.homeCityId)]);

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"), avatarUrl: text("avatar_url"),
  skills: text("skills").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  collegeId: text("college_id").references(() => colleges.id),
  year: text("year"), linkedinUrl: text("linkedin_url"),
});

export const userRoles = pgTable("user_roles", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(), scopeId: text("scope_id"),
}, (t) => [uniqueIndex("user_roles_uq").on(t.userId, t.role, t.scopeId)]);

export const collegeMembers = pgTable("college_members", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collegeId: text("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("MEMBER"), status: text("status").notNull().default("ACTIVE"),
}, (t) => [uniqueIndex("college_members_uq").on(t.userId, t.collegeId)]);

export const organizations = pgTable("organizations", {
  id: id(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("CLUB"),
  collegeId: text("college_id").references(() => colleges.id),
  createdById: text("created_by_id").notNull().references(() => users.id),
  verificationStatus: verificationEnum("verification_status").notNull().default("PENDING"),
  createdAt: createdAt(),
});

// ---------- events ----------
export const eventCategories = pgTable("event_categories", {
  id: id(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  color: text("color").notNull().default("#8B35FF"), icon: text("icon").notNull().default("Sparkles"),
});

export const venues = pgTable("venues", {
  id: id(), name: text("name").notNull(), address: text("address").notNull(), locality: text("locality"),
  cityId: text("city_id").notNull().references(() => cities.id),
  latitude: doublePrecision("latitude"), longitude: doublePrecision("longitude"),
}, (t) => [index("venues_city_idx").on(t.cityId)]);

export const events = pgTable("events", {
  id: id(), slug: text("slug").notNull().unique(), title: text("title").notNull(), description: text("description").notNull(),
  organizerId: text("organizer_id").notNull().references(() => users.id),
  collegeId: text("college_id").references(() => colleges.id),
  organizationId: text("organization_id").references(() => organizations.id),
  categoryId: text("category_id").notNull().references(() => eventCategories.id),
  venueId: text("venue_id").references(() => venues.id),
  cityId: text("city_id").notNull().references(() => cities.id),
  mode: eventModeEnum("mode").notNull().default("OFFLINE"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  capacity: integer("capacity").notNull().default(100),
  confirmedCount: integer("confirmed_count").notNull().default(0),
  feePaise: integer("fee_paise").notNull().default(0),
  eligibility: text("eligibility"),
  posterUrl: text("poster_url"),
  schedule: jsonb("schedule").$type<{ time: string; title: string; description?: string }[]>(),
  tags: text("tags").array().notNull().default([]),
  teamsEnabled: boolean("teams_enabled").notNull().default(false),
  minTeamSize: integer("min_team_size").notNull().default(1),
  maxTeamSize: integer("max_team_size").notNull().default(4),
  status: eventStatusEnum("status").notNull().default("DRAFT"),
  isDemo: boolean("is_demo").notNull().default(false),
  popularity: integer("popularity").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("events_city_start_status_idx").on(t.cityId, t.startAt, t.status),
  index("events_category_start_idx").on(t.categoryId, t.startAt),
  index("events_organizer_idx").on(t.organizerId),
]);

export const eventMedia = pgTable("event_media", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  url: text("url").notNull(), type: text("type").notNull().default("IMAGE"), order: integer("order").notNull().default(0),
});

export const favourites = pgTable("favourites", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.eventId] })]);

export const announcements = pgTable("announcements", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(), body: text("body").notNull(), createdAt: createdAt(),
}, (t) => [index("announcements_event_idx").on(t.eventId)]);

// ---------- registration & teams ----------
export const teams = pgTable("teams", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  captainId: text("captain_id").notNull().references(() => users.id),
  name: text("name").notNull(), description: text("description"),
  openRoles: text("open_roles").array().notNull().default([]),
  maxSize: integer("max_size").notNull().default(4),
  status: teamStatusEnum("status").notNull().default("FORMING"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("teams_event_name_uq").on(t.eventId, t.name), index("teams_event_idx").on(t.eventId)]);

export const teamMembers = pgTable("team_members", {
  id: id(), teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberRole: text("member_role"),
  status: requestStatusEnum("status").notNull().default("ACCEPTED"), // PENDING = join request
  message: text("message"), joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("team_members_uq").on(t.teamId, t.userId)]);

export const registrations = pgTable("registrations", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: registrationTypeEnum("type").notNull().default("ATTENDEE"),
  status: registrationStatusEnum("status").notNull().default("CONFIRMED"),
  ticketReference: text("ticket_reference").notNull().unique(),
  teamId: text("team_id").references(() => teams.id),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("registrations_event_user_uq").on(t.eventId, t.userId), index("registrations_user_idx").on(t.userId)]);

export const eventCheckIns = pgTable("event_check_ins", {
  id: id(), registrationId: text("registration_id").notNull().unique().references(() => registrations.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  checkedInById: text("checked_in_by_id").notNull().references(() => users.id),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- communities ----------
export const communities = pgTable("communities", {
  id: id(), slug: text("slug").notNull().unique(), name: text("name").notNull(), description: text("description").notNull(),
  type: communityTypeEnum("type").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  eventId: text("event_id").references(() => events.id),
  joinPolicy: joinPolicyEnum("join_policy").notNull().default("OPEN"),
  coverUrl: text("cover_url"), topic: text("topic"), createdAt: createdAt(),
}, (t) => [index("communities_type_idx").on(t.type), index("communities_event_idx").on(t.eventId)]);

export const communityMembers = pgTable("community_members", {
  id: id(), communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: communityRoleEnum("role").notNull().default("MEMBER"),
  status: membershipStatusEnum("status").notNull().default("ACTIVE"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("community_members_uq").on(t.communityId, t.userId), index("community_members_user_idx").on(t.userId, t.status)]);

export const communityPosts = pgTable("community_posts", {
  id: id(), communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title"), body: text("body").notNull(),
  isAnnouncement: boolean("is_announcement").notNull().default(false), createdAt: createdAt(),
}, (t) => [index("community_posts_idx").on(t.communityId, t.createdAt)]);

export const comments = pgTable("comments", {
  id: id(), postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  body: text("body").notNull(), createdAt: createdAt(),
}, (t) => [index("comments_post_idx").on(t.postId)]);

// ---------- social graph & messaging ----------
export const connectionRequests = pgTable("connection_requests", {
  id: id(), requesterId: text("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"), status: requestStatusEnum("status").notNull().default("PENDING"),
  createdAt: createdAt(), respondedAt: timestamp("responded_at", { withTimezone: true }),
}, (t) => [uniqueIndex("connection_requests_uq").on(t.requesterId, t.recipientId), index("connection_requests_recipient_idx").on(t.recipientId, t.status)]);

export const userBlocks = pgTable("user_blocks", {
  blockerId: text("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);

export const conversations = pgTable("conversations", { id: id(), createdAt: createdAt() });

export const conversationMembers = pgTable("conversation_members", {
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]);

export const messages = pgTable("messages", {
  id: id(), conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id),
  body: text("body").notNull(), createdAt: createdAt(),
}, (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)]);

// ---------- participation & volunteering ----------
export const participationOpportunities = pgTable("participation_opportunities", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  type: opportunityTypeEnum("type").notNull(), title: text("title").notNull(), description: text("description").notNull(),
  eligibility: text("eligibility"), capacity: integer("capacity").notNull().default(50),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: openClosedEnum("status").notNull().default("OPEN"), createdAt: createdAt(),
}, (t) => [index("opportunities_event_idx").on(t.eventId)]);

export const participationApplications = pgTable("participation_applications", {
  id: id(), opportunityId: text("opportunity_id").notNull().references(() => participationOpportunities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pitch: text("pitch").notNull(), portfolioUrl: text("portfolio_url"),
  status: applicationStatusEnum("status").notNull().default("SUBMITTED"), reviewNote: text("review_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("participation_apps_uq").on(t.opportunityId, t.userId), index("participation_apps_status_idx").on(t.opportunityId, t.status)]);

export const volunteerRoles = pgTable("volunteer_roles", {
  id: id(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(), description: text("description").notNull(), responsibilities: text("responsibilities"),
  skillsRequired: text("skills_required").array().notNull().default([]),
  openings: integer("openings").notNull().default(5),
  shiftStart: timestamp("shift_start", { withTimezone: true }), shiftEnd: timestamp("shift_end", { withTimezone: true }),
  shiftLabel: text("shift_label"), eligibility: text("eligibility"),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: openClosedEnum("status").notNull().default("OPEN"),
}, (t) => [index("volunteer_roles_event_idx").on(t.eventId)]);

export const volunteerApplications = pgTable("volunteer_applications", {
  id: id(), roleId: text("role_id").notNull().references(() => volunteerRoles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  motivation: text("motivation").notNull(),
  status: applicationStatusEnum("status").notNull().default("SUBMITTED"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("volunteer_apps_uq").on(t.roleId, t.userId)]);

export const volunteerAssignments = pgTable("volunteer_assignments", {
  id: id(), applicationId: text("application_id").notNull().unique().references(() => volunteerApplications.id, { onDelete: "cascade" }),
  shiftLabel: text("shift_label"), shiftStart: timestamp("shift_start", { withTimezone: true }), shiftEnd: timestamp("shift_end", { withTimezone: true }),
  completion: completionEnum("completion").notNull().default("PENDING"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- operations & trust ----------
export const notifications = pgTable("notifications", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(), title: text("title").notNull(), body: text("body"), link: text("link"),
  readAt: timestamp("read_at", { withTimezone: true }), createdAt: createdAt(),
}, (t) => [index("notifications_user_idx").on(t.userId, t.readAt, t.createdAt)]);

export const reports = pgTable("reports", {
  id: id(), reporterId: text("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), targetId: text("target_id").notNull(), reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("OPEN"), createdAt: createdAt(),
});

// ---------- relations (for db.query.* helpers) ----------
export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(eventCategories, { fields: [events.categoryId], references: [eventCategories.id] }),
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  city: one(cities, { fields: [events.cityId], references: [cities.id] }),
  college: one(colleges, { fields: [events.collegeId], references: [colleges.id] }),
  organization: one(organizations, { fields: [events.organizationId], references: [organizations.id] }),
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  media: many(eventMedia),
}));
export const eventMediaRelations = relations(eventMedia, ({ one }) => ({ event: one(events, { fields: [eventMedia.eventId], references: [events.id] }) }));
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  homeCity: one(cities, { fields: [users.homeCityId], references: [cities.id] }),
}));
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
  college: one(colleges, { fields: [userProfiles.collegeId], references: [colleges.id] }),
}));
