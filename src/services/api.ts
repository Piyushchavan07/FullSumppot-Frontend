const API_BASE = "http://localhost:5230/api";

const getToken = () => localStorage.getItem("token");

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Login failed");

    return res.json();
  },

  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Register failed");

    return res.text();
  },

  dashboard: async () => {
    const res = await fetch(`${API_BASE}/Dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return res.json();
  },

  communities: async () => {
    const res = await fetch(`${API_BASE}/Communities`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch communities");
    return res.json();
  },

  createCommunity: async (data: any) => {
    const res = await fetch(`${API_BASE}/Communities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create community");
    return res.json();
  },

  communityById: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Community not found");
    return res.json();
  },

  joinCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}/join`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}` 
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Join error:", err);
      throw new Error(err || "Failed to join community");
    }
  },

  leaveCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Communities/${id}/leave`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}` 
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Leave error:", err);
      throw new Error(err || "Failed to leave community");
    }
  },

  addLink: async (title: string, url: string, communityId: string | number) => {
    const res = await fetch(`${API_BASE}/Links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, url, communityId })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("AddLink error:", err);
      throw new Error(err || "Failed to submit link");
    }
    return res.json();
  },

  clickLink: async (linkId: string | number) => {
    const res = await fetch(`${API_BASE}/Links/${linkId}/click`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}` 
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("ClickLink error:", err);
      throw new Error(err || "Failed to record click");
    }
  },

  linksByCommunity: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/Links/community/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch links");
    return res.json();
  },

  leaderboard: async () => {
    const res = await fetch(`${API_BASE}/Leaderboard`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
  },

  myLinks: async () => {
    const res = await fetch(`${API_BASE}/Links/my`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch your links");
    return res.json();
  },

  notifications: async () => {
    const res = await fetch(`${API_BASE}/Notifications`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  markNotificationsRead: async () => {
    const res = await fetch(`${API_BASE}/Notifications/mark-read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to mark notifications as read");
  }
};