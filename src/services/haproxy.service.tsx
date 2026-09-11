import ApiService from "./api.service";

const BASE_URL = import.meta.env.VITE_API_ENVIRONMENT_MANAGEMENT_URL as string;

export const HAProxyService = {
  getAllConfigs: () => ApiService.get(`${BASE_URL}/haproxy/configs`),
  syncConfig: (configId: string) => ApiService.post(`${BASE_URL}/haproxy/sync/${configId}`, {}),
  registerConfig: (configId: string) => ApiService.post(`${BASE_URL}/haproxy/register/${configId}`, {}),
  deregisterConfig: (configId: string) => ApiService.post(`${BASE_URL}/haproxy/deregister/${configId}`, {}),
  importFromProxy: (parentFE = 'http_front') => ApiService.post(`${BASE_URL}/haproxy/import?parentFE=${parentFE}`, {}),
  addProxyConfig: (data: any) => ApiService.post(`${BASE_URL}/haproxy/configs`, data),
  updateProxyConfig: (data: any, envConfigId: string) => ApiService.put(`${BASE_URL}/haproxy/configs/${envConfigId}`, data),
  deleteProxyConfig: (envConfigId: string) => ApiService.delete(`${BASE_URL}/haproxy/configs/${envConfigId}`),
};