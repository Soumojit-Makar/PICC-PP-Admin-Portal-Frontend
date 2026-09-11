
import { ConfigurationResponse, AppMigrationResult, ResolvedConfigResponse } from "@/shared/types/configuration";
import ApiService from "./api.service";

const BASE_URL = `/nnp-config`;
const DOMAIN = import.meta.env.VITE_DOMAIN;
// const NNP_CONFIG_BASE_URL = `${BASE_URL}/nnp-config`;

export const NNPConfigService = {
  getAllConfig: () => ApiService.get(`${BASE_URL}`),
  createConfig: (config: ConfigurationResponse) => ApiService.post<ConfigurationResponse>(`${BASE_URL}`, config),
  updateConfig: (config: ConfigurationResponse) => ApiService.put<ConfigurationResponse>(`${BASE_URL}`, config),
  deleteConfig: (config: ConfigurationResponse) => ApiService.delete<ConfigurationResponse>(`${BASE_URL}`, config),
  
  // Quantum-Safe Encryption & Bulk Application Migration
  encryptApplicationConfigs: (application: string) => ApiService.post<AppMigrationResult>(`${BASE_URL}/${encodeURIComponent(application)}/encrypt`, {}),
  decryptApplicationConfigs: (application: string) => ApiService.post<AppMigrationResult>(`${BASE_URL}/${encodeURIComponent(application)}/decrypt`, {}),
  bulkConfig: (configs: ConfigurationResponse[]) => ApiService.post<ConfigurationResponse[]>(`${BASE_URL}/bulk`, configs),
  getResolvedConfig: (application: string, profiles: string, tag: string) => ApiService.get<ResolvedConfigResponse>(`${BASE_URL}/${encodeURIComponent(application)}/${encodeURIComponent(profiles)}/${encodeURIComponent(tag)}`),

  getDomain: () => ApiService.get(`${DOMAIN}/domain/all`),
  createDomain: (domain: any) => ApiService.post(`${DOMAIN}/domain`, domain),
  updateDomain: (domain: any) => ApiService.put(`${DOMAIN}/domain`, domain),
  deleteDomain: (domain: any) => ApiService.delete(`${DOMAIN}/domain/${domain.id}`,),
};