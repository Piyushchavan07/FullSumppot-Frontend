export interface User {
  id?: string | number;
  username: string;
  email?: string;
  niche?: string;
  contentNiche?: string;
  availablePoints?: number;
  avatarUrl?: string;
  createdAt?: string;
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
}

export interface ApiErrorShape {
  message?: string;
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
