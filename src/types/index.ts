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
}

export interface Link {
  linkId: string | number;
  communityId: string | number;
  userId: string | number;
  username: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  clicks: number;
  createdAt: string;
  isClickedByMe?: boolean;
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
}
