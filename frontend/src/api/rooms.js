import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

function withToken(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function createRoom(token, details) {
  const { data } = await api.post("/rooms", details, withToken(token));
  return data;
}

export async function getRoom(token, roomId) {
  const { data } = await api.get(`/rooms/${encodeURIComponent(roomId)}`, withToken(token));
  return data;
}