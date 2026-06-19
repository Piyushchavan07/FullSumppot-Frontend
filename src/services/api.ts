import { API_BASE_URL } from "../config";
const API_BASE = API_BASE_URL;

import type {
  AdminCommunity,
  AdminLink,
  AdminStats,
  AdminUser,
  AccountContacts,
  ApiErrorShape,
  Community,
  DashboardData,
  FollowUser,
  LeaderboardRow,
  Link,
  Notification,
  OtpResponse,
  PublicProfile,
  RegisterPayload,
  SearchResults,
  SupportersData,
  User,
  WeeklySupportRow,
} from "../types";

const getToken = () => sessionStorage.getItem("token") || localStorage.getItem("token");

export const setAuthToken = (token: string | null) => {
  if (token) {
    sessionStorage.setItem("token", token);
    localStorage.setItem("token", token); // keep localStorage as fallback for page refresh
  } else {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
  }
};

// Helper function for error handling
const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');
  let data: T | ApiErrorShape | string;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });
    const body = typeof data === 'object' && data !== null ? (data as ApiErrorShape) : {};
    if (response.status === 429 && body.resendCooldownSeconds) {
      throw new Error(`Please wait ${body.resendCooldownSeconds}s before resending.`);
    }
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    if (body.message) {
      errorMessage = body.message;
    } else if (body.errors && typeof body.errors === 'object') {
      const errorList = Object.values(body.errors).flat();
      if (errorList.length > 0) {
        errorMessage = errorList.join(' ');
      }
    } else if (body.title) {
      errorMessage = body.title;
    }
    throw new Error(errorMessage);
  }

  return data as T;
};

export const api = {
  // ==================== AUTH ====================
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<{ token: string; username?: string; needsVerification?: boolean; email?: string; phoneNumber?: string | null; channel?: string; maskedContact?: string }>(res);
  },

  register: async (data: RegisterPayload) => {
    const payload: Record<string, string> = {
      username: data.username,
      email: data.email,
      password: data.password,
      contentNiche: data.niche,
    };
    if (data.phoneNumber) payload.phoneNumber = data.phoneNumber;
    const res = await fetch(`${API_BASE}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse<{ message?: string; maskedContact?: string; channel?: string; resendCooldownSeconds?: number; hasPendingPhone?: boolean }>(res);
  },

  // ==================== DASHBOARD ====================
  dashboard: async () => {
    const res = await fetch(`${API_BASE}/Dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<DashboardData>(res);
  },

  // ==================== NOTIFICATIONS ====================
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/User/notifications`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Notification[]>(res);
  },

  markNotificationsRead: async () => {
    const res = await fetch(`${API_BASE}/User/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  acceptFollow: async (senderId: string | number) => {
    const res = await fetch(`${API_BASE}/User/follow-accept/${senderId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  declineFollow: async (senderId: string | number) => {
    const res = await fetch(`${API_BASE}/User/follow-decline/${senderId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  deleteNotification: async (notificationId: string | number) => {
    const res = await fetch(`${API_BASE}/User/notifications/${notificationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  // ==================== COMMUNITIES ====================
  communities: async () => {
    const res = await fetch(`${API_BASE}/Communities`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Community[]>(res);
  },

  communityById: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Community>(res);
  },

  createCommunity: async (data: {
    name: string;
    description: string;
    niche: string;
  }) => {
    const res = await fetch(`${API_BASE}/Communities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Community>(res);
  },

  updateCommunity: async (
    id: string | number,
    data: {
      name?: string;
      description?: string;
      niche?: string;
    }
  ) => {
    const res = await fetch(`${API_BASE}/Communities/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Community>(res);
  },

  deleteCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  joinCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Community>(res);
  },

  leaveCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Community>(res);
  },

  // ==================== LINKS ====================
  addLink: async (title: string, url: string, communityId: string | number) => {
    const res = await fetch(`${API_BASE}/Links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        title,
        url,
        communityId
      })
    });
    return handleResponse<Link>(res);
  },

  updateLink: async (id: string | number, title: string, url: string) => {
    const res = await fetch(`${API_BASE}/Links/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        title,
        url
      })
    });
    return handleResponse<Link>(res);
  },

  deleteLink: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  clickLink: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/click`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  linksByCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Links/community/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Link[]>(res);
  },

  getLinkCount: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Links/community/${id}/count`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await handleResponse<{ count?: number }>(res);
    return data.count ?? 0;
  },

  myLinks: async () => {
    const res = await fetch(`${API_BASE}/Links/my`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<Link[]>(res);
  },

  // ==================== USER ====================
  getUserProfile: async () => {
    const res = await fetch(`${API_BASE}/User/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<User>(res);
  },

  getPublicProfile: async (userId: number | string) => {
    const res = await fetch(`${API_BASE}/User/${userId}/public-profile`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<PublicProfile>(res);
  },

  updateUserProfile: async (data: {
    username?: string;
    bio?: string;
    contentNiche?: string;
  }) => {
    const res = await fetch(`${API_BASE}/User/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse<User>(res);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/User/upload-avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData
    });
    return handleResponse<User>(res);
  },

  uploadCommunityBanner: async (communityId: string | number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/Communities/${communityId}/banner`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData
    });
    return handleResponse<{ bannerUrl: string }>(res);
  },

  removeCommunityBanner: async (communityId: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${communityId}/banner`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  followUser: async (userId: string | number) => {
    const res = await fetch(`${API_BASE}/User/follow/${userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  unfollowUser: async (userId: string | number) => {
    const res = await fetch(`${API_BASE}/User/${userId}/unfollow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  blockUser: async (userId: string | number) => {
    const res = await fetch(`${API_BASE}/User/${userId}/block`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  unblockUser: async (userId: string | number) => {
    const res = await fetch(`${API_BASE}/User/${userId}/unblock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  followers: async () => {
    const res = await fetch(`${API_BASE}/User/followers`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<FollowUser[]>(res);
  },

  following: async () => {
    const res = await fetch(`${API_BASE}/User/following`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<FollowUser[]>(res);
  },

  // ==================== SEARCH ====================
  userSearch: async (query: string) => {
    const params = new URLSearchParams({ query });
    const res = await fetch(`${API_BASE}/User/search?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<SearchResults>(res);
  },

  communitySearch: async (query: string) => {
    const params = new URLSearchParams({ query });
    const res = await fetch(`${API_BASE}/User/search?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<SearchResults>(res);
  },

  leaderboard: async () => {
    const res = await fetch(`${API_BASE}/Leaderboard`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<LeaderboardRow[]>(res);
  },

  // ==================== MESSAGES ====================
  getConversations: async () => {
    const res = await fetch(`${API_BASE}/Messages/conversations`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{
      conversationId: number; otherUserId: number; otherUsername: string;
      otherAvatar?: string; lastMessage?: string; lastMessageAt?: string; unreadCount: number;
    }[]>(res);
  },

  getMessages: async (conversationId: number) => {
    const res = await fetch(`${API_BASE}/Messages/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{
      messageId: number; senderId: number; username: string;
      content: string; isRead: boolean; sentAt: string; isMine: boolean;
    }[]>(res);
  },

  sendMessage: async (recipientId: number, content: string) => {
    const res = await fetch(`${API_BASE}/Messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ recipientId, content })
    });
    return handleResponse<{ conversationId?: number; type: string }>(res);
  },

  sendToConversation: async (conversationId: number, content: string) => {
    const res = await fetch(`${API_BASE}/Messages/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ content })
    });
    return handleResponse<{ message: string }>(res);
  },

  getMessageRequests: async () => {
    const res = await fetch(`${API_BASE}/Messages/requests`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{
      requestId: number; senderId: number; username: string;
      avatarUrl?: string; firstMessage: string; createdAt: string;
    }[]>(res);
  },

  acceptMessageRequest: async (requestId: number) => {
    const res = await fetch(`${API_BASE}/Messages/requests/${requestId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ conversationId: number }>(res);
  },

  declineMessageRequest: async (requestId: number) => {
    const res = await fetch(`${API_BASE}/Messages/requests/${requestId}/decline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  getSentMessageRequests: async () => {
    const res = await fetch(`${API_BASE}/Messages/requests/sent`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{
      requestId: number; recipientId: number; username: string;
      avatarUrl?: string; firstMessage: string; createdAt: string; status: string;
    }[]>(res);
  },

  getUnreadMessageCount: async () => {
    const res = await fetch(`${API_BASE}/Messages/unread`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ unreadMessages: number; pendingRequests: number; total: number }>(res);
  },

  // ==================== POSTS/CONTENT ====================
  createPost: async (data: {
    title: string;
    content: string;
    communityId?: string | number;
  }) => {
    const res = await fetch(`${API_BASE}/Posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  getPost: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Posts/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ id: string | number; title: string; content: string }>(res);
  },

  getCommunityPosts: async (communityId: string | number) => {
    const res = await fetch(`${API_BASE}/Posts/community/${communityId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ id: string | number; title: string; content: string }[]>(res);
  },

  deletePost: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  likePost: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Posts/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  unlikePost: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Posts/${id}/unlike`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  // ==================== COMMENTS ====================
  addComment: async (postId: string | number, content: string) => {
    const res = await fetch(`${API_BASE}/Comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ postId, content })
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  // ==================== LINK INTERACTIONS ====================
  getLinkComments: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/comments`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ commentId: number; username: string; content: string; createdAt: string; userId: number }[]>(res);
  },

  addLinkComment: async (linkId: string | number, content: string) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ content })
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  deleteLinkComment: async (linkId: string | number, commentId: number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  toggleLinkLike: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ liked: boolean; likeCount: number }>(res);
  },

  getLinkLikes: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/likes`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ likeCount: number; isLikedByMe: boolean }>(res);
  },

  getLinkClickers: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/supporters/${linkId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<SupportersData>(res);
  },

  shoutOut: async (linkId: string | number, targetUserId: number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/shoutout/${targetUserId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteComment: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Comments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  likeComment: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Comments/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  unlikeComment: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Comments/${id}/unlike`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ success?: boolean; message?: string }>(res);
  },

  // ==================== ADMIN ====================
  adminGetStats: async () => {
    const res = await fetch(`${API_BASE}/Admin/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<AdminStats>(res);
  },

  adminGetUsers: async () => {
    const res = await fetch(`${API_BASE}/Admin/users`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<AdminUser[]>(res);
  },

  adminMakeAdmin: async (userId: number) => {
    const res = await fetch(`${API_BASE}/Admin/users/${userId}/make-admin`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  adminDeleteUser: async (userId: number) => {
    const res = await fetch(`${API_BASE}/Admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  adminGetCommunities: async () => {
    const res = await fetch(`${API_BASE}/Admin/communities`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<AdminCommunity[]>(res);
  },

  adminDeleteCommunity: async (communityId: number) => {
    const res = await fetch(`${API_BASE}/Admin/communities/${communityId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  adminGetLinks: async () => {
    const res = await fetch(`${API_BASE}/Admin/links`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<AdminLink[]>(res);
  },

  adminDeleteLink: async (linkId: number) => {
    const res = await fetch(`${API_BASE}/Admin/links/${linkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  // ==================== PASSWORD ====================
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await fetch(`${API_BASE}/User/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  // ==================== SUPPORT SYSTEM ====================
  // Get the most recent link by a user (for Support Back)
  getLatestLink: async (userId: number) => {
    const res = await fetch(`${API_BASE}/Links/latest/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ linkId: number; title: string; url: string; userId: number; username: string }>(res);
  },

  // Get all links by a user (for Support Back picker)
  getLinksByUser: async (userId: number) => {
    const res = await fetch(`${API_BASE}/Links/user/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ linkId: number; title: string; url: string; thumbnailUrl?: string; clicks: number; createdAt: string; isClickedByMe: boolean }[]>(res);
  },

  // Notify a creator that someone clicked their link via Support Back
  notifySupportBack: async (creatorUserId: number, linkId: number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/support-back-notify/${creatorUserId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<{ message: string }>(res);
  },

  // Weekly support leaderboard
  getWeeklySupporters: async () => {
    const res = await fetch(`${API_BASE}/Links/weekly-supporters`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<WeeklySupportRow[]>(res);
  },

  // ==================== EMAIL OTP ====================
  verifyEmail: async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE}/Auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return handleResponse<{ token: string; username?: string }>(res);
  },

  resendVerificationOtp: async (email?: string, phoneNumber?: string) => {
    const res = await fetch(`${API_BASE}/Auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || undefined, phoneNumber: phoneNumber || undefined })
    });
    return handleResponse<OtpResponse>(res);
  },

  forgotPassword: async (contact: string) => {
    const res = await fetch(`${API_BASE}/Auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact })
    });
    return handleResponse<{ message: string; devOtp?: string }>(res);
  },

  resetPassword: async (contact: string, otp: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/Auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, otp, newPassword })
    });
    return handleResponse<{ message: string }>(res);
  },

  // ==================== PHONE OTP ====================
  sendPhoneOtp: async (phoneNumber: string, email?: string) => {
    const res = await fetch(`${API_BASE}/Auth/send-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, ...(email ? { email } : {}) })
    });
    return handleResponse<{ message: string; devOtp?: string }>(res);
  },

  verifyPhone: async (phoneNumber: string, otp: string) => {
    const res = await fetch(`${API_BASE}/Auth/verify-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp })
    });
    return handleResponse<{ token?: string; username?: string; message?: string }>(res);
  },

  verifyPhoneFirebase: async (idToken: string, email?: string) => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/Auth/verify-phone-firebase`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ idToken, email })
    });
    return handleResponse<{ token?: string; username?: string; message?: string }>(res);
  },

  // ==================== ACCOUNT CENTER ====================
  getAccountContacts: async () => {
    const res = await fetch(`${API_BASE}/Account/contacts`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return handleResponse<AccountContacts>(res);
  },

  addAccountEmail: async (email: string) => {
    const res = await fetch(`${API_BASE}/Account/add-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ email })
    });
    return handleResponse<OtpResponse>(res);
  },

  verifyAccountEmail: async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE}/Account/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ email, otp })
    });
    return handleResponse<{ message: string }>(res);
  },

  addAccountPhone: async (phoneNumber: string) => {
    const res = await fetch(`${API_BASE}/Account/add-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ phoneNumber })
    });
    return handleResponse<OtpResponse>(res);
  },

  verifyAccountPhone: async (phoneNumber: string, otp: string) => {
    const res = await fetch(`${API_BASE}/Account/verify-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ phoneNumber, otp })
    });
    return handleResponse<{ message: string }>(res);
  },
};

export default api;
