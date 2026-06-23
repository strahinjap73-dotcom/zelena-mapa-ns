const REMOTE_BASE_URL = "https://zelena-mapa-ns.onrender.com";
const getToken = () => localStorage.getItem("token");

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : window.location.hostname === "localhost"
  ? "http://localhost:8080"
  : REMOTE_BASE_URL;

export const getLocations = async () => {
  const headers = getToken() ? authHeader() : {};
  const res = await fetch(`${BASE_URL}/api`, {
    headers,
  });
  return res.json();
};

export const addLocation = async (location) => {
  return fetch(`${BASE_URL}/api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(location),
  });
  
};

export const addRating = async (id, ratingData) => {
  const res = await fetch(`${BASE_URL}/api/${id}/rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(ratingData),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Rating failed");
  }
  return res.json();
};

export const getAverageRating = async (id) => {
  const res = await fetch(`${BASE_URL}/api/${id}/rating/average`);
  if (!res.ok) return { average: 0 };
  const value = await res.json(); 
  return { average: value };
};

export const getRatings = async (id) => {
  const res = await fetch(`${BASE_URL}/api/${id}/ratings`);
  if (!res.ok) throw new Error("Failed to load ratings");
  return res.json();
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
};

export const register = (username, email, password) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  }).then((res) => {
    if (!res.ok) throw new Error("Registration failed");
    return res.text();
  });

  export const approveLocation = async (id) => {
  return fetch(`${BASE_URL}/api/admin/locations/${id}/approve`, {
    method: "PUT",
    headers: authHeader()
  });
  
};

export const getPendingLocations = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/locations/pending`, {
    headers: authHeader()
  });
  return res.json();
};

export const rejectLocation = async (id) => {
  return fetch(`${BASE_URL}/api/admin/locations/${id}/reject`, {
    method: "PUT",
    headers: authHeader()
  });
};

export const uploadLocationImage = async (
  locationId,
  file
) => {

  const formData = new FormData();

  formData.append("locationId", locationId);
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/api/images`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer " +
          localStorage.getItem("token")
      },
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Upload failed");
  }
};

export const getImages = async (locationId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/api/images/${locationId}`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    }
  });

  if (!res.ok) {
    throw new Error("Failed to load images");
  }

  return res.json();
};

export const searchUsers = async (q) => {
  const res = await fetch(`${BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,
    { headers: authHeader() }
  );
  if (!res.ok) return [];
  return res.json();
};

export const addFriend = async (id) => {
  return fetch(`${BASE_URL}/api/users/${id}/add`, { method: 'POST', headers: authHeader() });
};

export const getFriends = async () => {
  const res = await fetch(`${BASE_URL}/api/users/friends`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json();
};

export const recommendLocation = async (locationId, friendId) => {
  const res = await fetch(`${BASE_URL}/api/${locationId}/recommend/${friendId}`, { method: 'POST', headers: authHeader() });
  if (!res.ok) throw new Error('Recommend failed');
  return res.json();
};

export const getNotifications = async () => {
  const res = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json();
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, { method: 'PUT', headers: authHeader() });
  if (!res.ok) throw new Error('Failed to mark read');
  return res.json();
};

export const deleteImage = async (imageId) => {
  const res = await fetch(`${BASE_URL}/api/images/${imageId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok) throw new Error("Delete image failed");
};