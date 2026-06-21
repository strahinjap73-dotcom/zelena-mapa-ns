const BASE_URL = "https://zelena-mapa-ns.onrender.com";
const getToken = () => localStorage.getItem("token");

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`
});

export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/api`);
  return res.json();
};

export const addLocation = async (location) => {
  return fetch(`${BASE_URL}/api/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(location),
  });
  
};

export const addRating = async (id, ratingData) => {
  const { token, value } = ratingData;
  const res = await fetch(`${BASE_URL}/api/${id}/rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error("Rating failed");
  return res.json();
};


export const getAverageRating = async (id) => {
  const res = await fetch(`${BASE_URL}/api/${id}/rating/average`);
  if (!res.ok) return { average: 0 };
  const value = await res.json(); 
  return { average: value };
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

export const getLocationImages = async (locationId) => {
  const res = await fetch(
    `${BASE_URL}/api/images/${locationId}`
  );

  if (!res.ok) {
    throw new Error("Failed to load images");
  }

  return res.json();
};