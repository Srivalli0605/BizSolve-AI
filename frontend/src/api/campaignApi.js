// src/api/campaignApi.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const listCampaigns = () =>
  axios.get(`${BASE}/campaigns/`, { headers: authHeader() }).then(r => r.data);

export const getCampaign = (id) =>
  axios.get(`${BASE}/campaigns/${id}`, { headers: authHeader() }).then(r => r.data);

export const createCampaign = (data) =>
  axios.post(`${BASE}/campaigns/`, data, { headers: authHeader() }).then(r => r.data);

export const updateCampaign = (id, data) =>
  axios.patch(`${BASE}/campaigns/${id}`, data, { headers: authHeader() }).then(r => r.data);

export const deleteCampaign = (id) =>
  axios.delete(`${BASE}/campaigns/${id}`, { headers: authHeader() });

export const generateEmail = (formData) =>
  axios.post(`${BASE}/campaigns/generate`, formData, { headers: authHeader() }).then(r => r.data);

export const sendCampaign = (campaignId, payload) =>
  axios.post(`${BASE}/campaigns/send/${campaignId}`, payload, { headers: authHeader() }).then(r => r.data);

export const getCampaignStats = () =>
  axios.get(`${BASE}/campaigns/stats/summary`, { headers: authHeader() }).then(r => r.data);