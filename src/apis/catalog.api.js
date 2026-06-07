// File: src/apis/catalog.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.catalog);

export const CatalogApi = {
  /* ── Medicines ── */
  getMedicines: async () => {
    const res = await http.get('/catalog/medicines');
    return res.data;
  },
  /** Same as getMedicines but won't trigger auto-logout on 401 */
  getMedicinesSilent: async () => {
    const res = await http.get('/catalog/medicines', { skipAuthLogout: true });
    return res.data;
  },
  getMedicine: async (id) => {
    const res = await http.get(`/catalog/medicines/${id}`);
    return res.data;
  },
  searchMedicines: async (q) => {
    const res = await http.get('/catalog/medicines/search', { params: { q } });
    return res.data;
  },
  createMedicine: async (data) => {
    const res = await http.post('/catalog/medicines', data);
    return res.data;
  },
  updateMedicine: async (id, data) => {
    const res = await http.put(`/catalog/medicines/${id}`, data);
    return res.data;
  },
  getMedicineUnits: async (medicineId, includeInactive = false) => {
    const res = await http.get(`/catalog/medicines/${medicineId}/units`, { params: { includeInactive } });
    return res.data;
  },
  createMedicineUnit: async (medicineId, data) => {
    const res = await http.post(`/catalog/medicines/${medicineId}/units`, data);
    return res.data;
  },
  updateMedicineUnit: async (medicineId, unitId, data) => {
    const res = await http.put(`/catalog/medicines/${medicineId}/units/${unitId}`, data);
    return res.data;
  },
  deleteMedicineUnit: async (medicineId, unitId) => {
    const res = await http.delete(`/catalog/medicines/${medicineId}/units/${unitId}`);
    return res.data;
  },
  uploadMedicineImage: async (medicineId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await http.post(`/catalog/medicines/${medicineId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /* ── Gallery (multi-image) ── */
  uploadMedicineImages: async (medicineId, files) => {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    const res = await http.post(`/catalog/medicines/${medicineId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getMedicineImages: async (medicineId) => {
    const res = await http.get(`/catalog/medicines/${medicineId}/images`);
    return res.data;
  },
  setPrimaryMedicineImage: async (medicineId, imageId) => {
    const res = await http.put(`/catalog/medicines/${medicineId}/images/${imageId}/primary`);
    return res.data;
  },
  reorderMedicineImages: async (medicineId, imageIds) => {
    const res = await http.put(`/catalog/medicines/${medicineId}/images/reorder`, { imageIds });
    return res.data;
  },
  deleteMedicineImage: async (medicineId, imageId) => {
    const res = await http.delete(`/catalog/medicines/${medicineId}/images/${imageId}`);
    return res.data;
  },

  /* ── Categories ── */
  getCategories: async () => {
    const res = await http.get('/catalog/categories');
    return res.data;
  },

  /* ── Disease Groups ── */
  getDiseaseGroups: async () => {
    const res = await http.get('/catalog/disease-groups');
    return res.data;
  },
  getDiseaseGroupsByMedicine: async (id) => {
    const res = await http.get(`/catalog/disease-groups/medicine/${id}`);
    return res.data;
  },

  /* ── Pricing ── */
  getPricingTiers: async (medicineId) => {
    const res = await http.get(`/catalog/pricing/medicine/${medicineId}`);
    return res.data;
  },
  getActivePricingTiers: async (medicineId) => {
    const res = await http.get(`/catalog/pricing/medicine/${medicineId}/active`);
    return res.data;
  },
  createPricingTier: async (data) => {
    const res = await http.post('/catalog/pricing', data);
    return res.data;
  },
  deletePricingTier: async (tierId) => {
    const res = await http.delete(`/catalog/pricing/${tierId}`);
    return res.data;
  },
  calculatePrice: async (medicineId, tierCodeOrSaleMode, qty, unitCode = null) => {
    const params = { medicineId, qty };
    if (tierCodeOrSaleMode) {
      params.tierCode = tierCodeOrSaleMode;
      params.saleMode = tierCodeOrSaleMode;
    }
    if (unitCode) params.unitCode = unitCode;
    const res = await http.get('/catalog/pricing/calculate', { params });
    return res.data;
  },
};
