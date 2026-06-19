export interface User {
  id?: string | number;
  username: string;
  email?: string;
  niche?: string;
  contentNiche?: string;
  availablePoints?: number;
  avatarUrl?: string;
  createdAt?: string;
  role?: 'USER' | 'ADMIN';
}

export interface FollowUser {
  userId: string | number;
  username: string;
  avatarUrl?: string;
  followStatus?: 'NONE' | 'PENDING' | 'ACCEPTED';
  communityCount?: number;
}

export interface Community {
  communityId: string | number;
  name: string;
  description: string;
  niche: string;
  memberCount: number;
  bannerUrl?: string;
  latestLinkUrl?: string;  // fallback banner: YouTube thumbnail of latest link
  createdAt: string;
  isMember?: boolean;
  isCreator?: boolean;
  creatorId?: number;
  creatorName?: string;
  creatorAvatar?: string;
}

export interface Link {
  linkId: number;
  title: string;
  url: string;
  clicks: number;
  createdAt: string;
  userId?: number;
  username: string;
  creatorAvatar?: string;
  thumbnailUrl?: string;
  isClickedByMe?: boolean;
  communityName?: string;
  communityId?: number | string;
}

export interface DashboardData extends User {
  userId?: string | number;
  pointsEarnedToday?: number;
  viewsGivenToday?: number;
  communitiesJoined?: number;
  followersCount?: number;
  followingCount?: number;
  followingCommunities?: Community[];
  role?: 'USER' | 'ADMIN';
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  niche: string;
  points: number;
  linksSubmitted: number;
  clicksReceived: number;
  userId?: number;
  avatarUrl?: string;
}

export interface Points {
  availablePoints: number;
  pointsEarnedToday: number;
  viewsGivenToday: number;
}

export interface Notification {
  id: string | number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  senderId?: number;
  senderName?: string;
}

export interface SearchResults {
  users: FollowUser[];
  communities: Community[];
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  niche: string;
  phoneNumber?: string;
}

export interface ApiErrorShape {
  message?: string;
  resendCooldownSeconds?: number;
  title?: string;
  errors?: Record<string, string[]>;
}

export interface AccountContacts {
  emails: { email: string; masked: string; isPrimary: boolean; isVerified: boolean }[];
  phone: { number: string; masked: string; isVerified: boolean } | null;
  canResetViaEmail: boolean;
  canResetViaPhone: boolean;
  recoveryHint: string;
}

export interface OtpResponse {
  message: string;
  maskedContact?: string;
  resendCooldownSeconds?: number;
  devOtp?: string;
}

export interface PublicProfile {
  userId: number;
  username: string;
  contentNiche?: string;
  availablePoints: number;
  avatarUrl?: string;
  createdAt?: string;
  followersCount: number;
  followingCount: number;
  communitiesCreated: number;
  linksSubmitted: number;
  totalClicks: number;
  followStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | null;
  isOwnProfile: boolean;
}

// ==================== ADMIN ====================
export interface AdminStats {
  totalUsers: number;
  totalCommunities: number;
  totalLinks: number;
  totalClicks: number;
}

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  role: string;
  availablePoints: number;
  communitiesCreated: number;
  linksSubmitted: number;
  totalClicks: number;
  createdAt: string;
}

export interface AdminCommunity {
  communityId: number;
  name: string;
  niche: string;
  creatorName: string;
  memberCount: number;
  linkCount: number;
  createdAt: string;
}

export interface AdminLink {
  linkId: number;
  title: string;
  url: string;
  username: string;
  communityName: string;
  clicks: number;
  createdAt: string;
}

// ==================== SUPPORT SYSTEM ====================

export type SupportTier = 'supporter' | 'active' | 'top' | 'champion';

export interface SupporterEntry {
  userId: number;
  username: string;
  avatarUrl?: string;
  clickedAt: string;
  referrerPage?: string;
  isCreator: boolean;
  followStatus: string;
  clickCount: number;       // total clicks this user gave on this link
  isMutual: boolean;        // did this user's link get clicked back by the owner?
}

export interface SupportersData {
  totalClicks: number;
  uniqueUsers: number;
  creatorClicks: number;
  supporters: SupporterEntry[];
}

export interface SupportBackResult {
  linkId: number;
  title: string;
  url: string;
  userId: number;
  username: string;
}

export interface WeeklySupportRow {
  rank: number;
  userId: number;
  username: string;
  avatarUrl?: string;
  linksSupported: number;   // unique links clicked this week
  totalClicks: number;
}
