import ApiService from './api.service';

const BASE_URL = import.meta.env.VITE_API_ENVIRONMENT_MANAGEMENT_URL as string;

export const ComponentService = {

  getAllComponents: () => ApiService.get(`${BASE_URL}/read/comp/all`),
  getCompSpecs: (compId: string) => ApiService.get(`${BASE_URL}/read/comp/${compId}/spec`),
  getCompTemplates: (compId: string) => ApiService.get(`${BASE_URL}/read/comp/${compId}/template`),

  createComponent: (data: any) => ApiService.post(`${BASE_URL}/create/comp`, data),
  updateComponent: (compId: string, data: any) => ApiService.put(`${BASE_URL}/update/comp/${compId}`, data),
  deleteComponent: (compId: string) => ApiService.delete(`${BASE_URL}/delete/comp/${compId}`),

  createCompSpec: (compId: string, data: any) => ApiService.post(`${BASE_URL}/create/comp/${compId}/spec`, data),
  updateCompSpec: (compId: string, specId: string, data: any) =>
    ApiService.put(`${BASE_URL}/update/comp/${compId}/spec/${specId}`, data),
  deleteCompSpec: (compId: string, specId: string) =>
    ApiService.delete(`${BASE_URL}/delete/comp/${compId}/spec/${specId}`),

  createCompTemplate: (compId: string, data: any) => ApiService.post(`${BASE_URL}/create/comp/${compId}/template`, data),
  updateCompTemplate: (compId: string, tmplId: string, data: any) =>
    ApiService.put(`${BASE_URL}/update/comp/${compId}/template/${tmplId}`, data),
  deleteCompTemplate: (compId: string, tmplId: string) =>
    ApiService.delete(`${BASE_URL}/delete/comp/${compId}/template/${tmplId}`),
}
