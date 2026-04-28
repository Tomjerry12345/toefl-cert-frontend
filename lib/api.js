import axios from 'axios';

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  // `${process.env.NEXT_PUBLIC_API_URL}/api` ||
});

// Auto-attach token dari localStorage jika ada
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    console.log("Token di interceptor:", token)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }

  console.log("request ke : ",config.url)
  return config
})

// CERTIFICATES
export const issueCertificate = (formData) =>
  API.post('/certificates/issue', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const issueBatch = (data) =>
  API.post('/certificates/issue-batch', data);

// TEMPLATES
export const getAllTemplates = () =>
  API.get('/templates');

export const getTemplateById = (id) =>
  API.get(`/templates/${id}`);

export const getDefaultHtml = () =>
  API.get('/templates/default-html');

export const createTemplate = (formData) =>
  API.post('/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateTemplate = (id, formData) =>
  API.put(`/templates/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteTemplate = (id) =>
  API.delete(`/templates/${id}`);

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
