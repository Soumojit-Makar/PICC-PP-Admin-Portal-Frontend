import ApiService from './api.service';
import {
  VmStatusCheckRequest,
  VmStatusResponse,
  DeployRequest,
  CreateDeploymentResponse,
  DeploymentItem,
  DeploymentPageResponse,
  ScriptExecutionResponse,
  DeploymentContainer,
  DeploymentAction
} from '../shared/types/dms';

const RAW_BASE_URL = (import.meta.env.VITE_API_DMS_MANAGEMENT_URL as string) || '/dms-management-service/api/dms';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

export const DmsService = {
  checkStatus: (data: VmStatusCheckRequest) => 
    ApiService.post<VmStatusResponse>(`${BASE_URL}/check-status`, data),

  createDms: (data: DeployRequest) => 
    ApiService.post<CreateDeploymentResponse>(`${BASE_URL}/create-dms`, data),

  getDeployment: (id: string) => 
    ApiService.get<DeploymentItem>(`${BASE_URL}/deployments/${id}`),

  listDeployments: (page = 0, size = 20, component?: string, status?: string, envId?: string) => {
    let url = `${BASE_URL}/deployments?page=${page}&size=${size}`;
    if (component && component.trim() !== '') {
      url += `&component=${encodeURIComponent(component.trim())}`;
    }
    if (status && status.trim() !== '') {
      url += `&status=${encodeURIComponent(status.trim())}`;
    }
    if (envId && envId.trim() !== '') {
      url += `&envId=${encodeURIComponent(envId.trim())}`;
    }
    return ApiService.get<DeploymentPageResponse>(url);
  },

  storeSshKey: (id: string, data: { privateKey: string; passphrase?: string }) => 
    ApiService.post<ScriptExecutionResponse>(`${BASE_URL}/deployments/${id}/ssh-key`, data),

  refreshContainers: (id: string, data?: { privateKey?: string; passphrase?: string }) => 
    ApiService.post<DeploymentContainer[]>(`${BASE_URL}/deployments/${id}/refresh-containers`, data || {}),

  listContainers: (id: string) => 
    ApiService.get<DeploymentContainer[]>(`${BASE_URL}/deployments/${id}/containers`),

  restartContainer: (id: string, data: { containerName: string; privateKey?: string; passphrase?: string }) => 
    ApiService.post<ScriptExecutionResponse>(`${BASE_URL}/deployments/${id}/restart`, data),

  execCommand: (id: string, data: { command: string; privateKey?: string; passphrase?: string }) => 
    ApiService.post<ScriptExecutionResponse>(`${BASE_URL}/deployments/${id}/exec`, data),

  listActions: (id: string) => 
    ApiService.get<DeploymentAction[]>(`${BASE_URL}/deployments/${id}/actions`),
};
