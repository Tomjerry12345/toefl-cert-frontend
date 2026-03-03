import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

// Auto-attach token dari localStorage jika ada
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

// CERTIFICATES
export const issueCertificate = (formData) =>
  API.post('/certificates/issue', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const issueBatch = (data) =>
  API.post('/certificates/issue-batch', data);

export const getAllCertificates = (params) =>
  API.get('/certificates', { params });

export const getCertificateById = (certId) =>
  API.get(`/certificates/${certId}`);

export const revokeCertificate = (certId, reason) =>
  API.delete(`/certificates/${certId}/revoke`, { data: { reason } });

// VERIFY (public)
export const verifyCertificate = (certId) =>
  API.get(`/verify/${certId}`);

export default API;
