import ApiService from './api.service';

const BASE_URL = import.meta.env.VITE_API_ENVIRONMENT_MANAGEMENT_URL as string;
const PUB_CONF_URL = (import.meta.env.VITE_NNP_CONFT_PUB as string) || '/nnpconf-pub';
const DOMAIN_URL = (import.meta.env.VITE_DOMAIN as string) || '';

export const EnvironmentService = {

  getEnvironmentFeatures: () => ApiService.get(`${BASE_URL}/read/v3`),
  getActivityLogs: (envId: string) => ApiService.get(`${BASE_URL}/read/activity/v2/${envId}`),
  updateEnvironment: (envId: string, data: any) => ApiService.put(`${BASE_URL}/update/env/v3/${envId}`, data),

  updateEnvFeatures: (featureId: string, data: any) => ApiService.put(`${BASE_URL}/update/feature/v3/${featureId}`, data),
  addEnvFeatures: (data: any) => ApiService.post(`${BASE_URL}/create/feature/v3`, data),
  deleteEnvFeatures: (featureId: string) => ApiService.delete(`${BASE_URL}/delete/feature/v3/${featureId}`),

  updateFeatureElement: (elementId: string, data: any) => ApiService.put(`${BASE_URL}/update/feature/element/v3/${elementId}`, data),
  addFeatureElement: (data: any) => ApiService.post(`${BASE_URL}/create/feature/element/v3`, data),
  deleteFeatureElement: (elementId: string) => ApiService.delete(`${BASE_URL}/delete/feature/element/v3/${elementId}`),

  updateElement: (ementId: string, data: any) => ApiService.put(`${BASE_URL}/update/feature/element/details/v3/${ementId}`, data),
  addElement: (data: any) => ApiService.post(`${BASE_URL}/create/feature/element/details/v3`, data),
  deleteElement: (ementId: string) => ApiService.delete(`${BASE_URL}/delete/feature/element/details/v3/${ementId}`),

  updateChildElement: (chelementId: string, data: any) => ApiService.put(`${BASE_URL}/update/feature/element/details/chdetails/v3/${chelementId}`, data),
  addChildElement: (data: any) => ApiService.post(`${BASE_URL}/create/feature/element/details/chdetails/v3`, data),
  deleteChildElement: (chelementId: string) => ApiService.delete(`${BASE_URL}/delete/feature/element/details/chdetails/v3/${chelementId}`),

  // ==========================================
  // REGISTRATION ENDPOINTS
  // ==========================================
  getCountries: () => ApiService.get(`${PUB_CONF_URL}/acc/read/country/all`),
  getOrgCategories: () => ApiService.get(`${DOMAIN_URL ? `${DOMAIN_URL}/domain` : '/domain'}/all/domval?domainName=org-category`),

  // createAccountRegistration: (data: any) => ApiService.post(`${PUB_CONF_URL}/acc/create`, data)

}