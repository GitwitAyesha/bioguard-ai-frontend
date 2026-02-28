const BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const signup = async (name, email, password, face_embedding) => {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ name, email, password, face_embedding }),
  });
  return res.json();
};

export const login = async (email, password, face_embedding = null) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ email, password, face_embedding }),
  });
  const data = await res.json();
  return { ...data, _status: res.status };
};

export const sendOtp = async (user_id, email) => {
  const res = await fetch(`${BASE}/auth/send-otp`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ user_id, email }),
  });
  return res.json();
};

export const verifyOtp = async (user_id, otp) => {
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ user_id, otp }),
  });
  return res.json();
};

// ─── ADMIN ────────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
  const res = await fetch(`${BASE}/admin/stats`, { headers: getHeaders() });
  return res.json();
};

export const getAdminLogs = async () => {
  const res = await fetch(`${BASE}/admin/logs`, { headers: getHeaders() });
  return res.json();
};

// ─── FACE ─────────────────────────────────────────────────────────────────
export const verifyFace = async (email, image) => {
  const res = await fetch(`${BASE}/face/verify-face`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ email, image }),
  });
  return res.json();
};