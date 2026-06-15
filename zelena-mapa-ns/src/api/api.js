const BASE_URL = "https://zelena-mapa-ns.onrender.com";

export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/api`);
  return res.json();
};

export const addLocation = async (location) => {
  return fetch(`${BASE_URL}/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });
};

export const addRating = async (id, ratingData) => {
  const { token, value } = ratingData;
  const res = await fetch(`${BASE_URL}/api/${id}/rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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