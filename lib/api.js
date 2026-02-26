import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

// Tambahkan token ke setiap request
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect ke login jika token expired
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// CERTIFICATES
export const issueCertificate = (formData) =>
  API.post("/certificates/issue", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const issueBatch = (data) => API.post("/certificates/issue-batch", data);

export const getAllCertificates = (params) =>
  API.get("/certificates", { params });

export const getCertificateById = (certId) =>
  API.get(`/certificates/${certId}`);

export const revokeCertificate = (certId, reason) =>
  API.delete(`/certificates/${certId}/revoke`, { data: { reason } });

// VERIFY (public)
export const verifyCertificate = (certId) => API.get(`/verify/${certId}`);

export default API;
