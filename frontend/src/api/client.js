import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL: API_URL });

export default client;

// ---- Day 1 ----
export const getHealth = () => client.get("/health");

// ---- Day 2 ----
export const getFieldTypes = () => client.get("/field-types");

// ---- Day 1/3/5: Forms ----
export const listForms = () => client.get("/forms");
export const createForm = (data) => client.post("/forms", data);
export const getForm = (formId) => client.get(`/forms/${formId}`);
export const updateForm = (formId, data) => client.patch(`/forms/${formId}`, data);
export const publishForm = (formId) => client.post(`/forms/${formId}/publish`);
export const archiveForm = (formId) => client.post(`/forms/${formId}/archive`);
export const listVersions = (formId) => client.get(`/forms/${formId}/versions`);

// ---- Day 3/4: Fields ----
export const addField = (formId, data) => client.post(`/forms/${formId}/fields`, data);
export const updateField = (formId, fieldId, data) =>
  client.patch(`/forms/${formId}/fields/${fieldId}`, data);
export const deleteField = (formId, fieldId) =>
  client.delete(`/forms/${formId}/fields/${fieldId}`);
export const reorderFields = (formId, fieldIds) =>
  client.patch(`/forms/${formId}/fields/reorder`, { field_ids: fieldIds });

// ---- Day 6: Share links + public view ----
export const generateLink = (formId) => client.post(`/forms/${formId}/generate-link`);
export const getPublicForm = (token) => client.get(`/public/forms/${token}`);
