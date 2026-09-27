import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

export async function register(credentials) {
  const { data } = await api.post("/auth/register", credentials);
  return data;
}

export async function login(credentials) {
  const { data } = await api.post("/auth/login", credentials);
  return data;
}