import ApiService from './api.service';
import { getXUser, createUrl } from '@/shared/utils';

const BASE_URL = import.meta.env.VITE_DASH as string;
const DOMAIN = import.meta.env.VITE_DOMAIN as string
const K8S_BASE = `${DOMAIN}/k8s-intg`;
const ADMIN_POTAL = import.meta.env.VITE_ADMIN_POTAL as string
export const RegistrationService = {
  getAllAccounts: (pageNumber: number = 0, pageSize: number = 100) =>
    ApiService.get(`${BASE_URL}/accounts?pageNumber=${pageNumber}&pageSize=${pageSize}`, { 'X-User-Name': getXUser() } as HeadersInit),

  getAccDetailsByAccName: (accName: string) =>
    ApiService.get(`${ADMIN_POTAL}/accounts/details?accountName=${accName}`, { 'X-User-Name': getXUser() } as HeadersInit),

  getPlanDetails: (accName: string) =>
    ApiService.get(`${BASE_URL}/accounts/billingDetails?accountName=${accName}`, { 'X-User-Name': getXUser() } as HeadersInit),

  getAccountCommunications: (accName: string) =>
    ApiService.get(`${BASE_URL}/accounts/communications?accountName=${accName}`, { 'X-User-Name': getXUser() } as HeadersInit),

  getComponentsDeployed: (accName: string) =>
    ApiService.get(`${DOMAIN}/k8s-intg/pods/details?envName=${accName}`, { 'X-User-Name': 'playadmin' } as HeadersInit),

  updateAccountDetails: (accName: string, data: any) =>
    ApiService.put(`${BASE_URL}/accounts/details/${accName}`, data, { 'X-User-Name': getXUser() } as HeadersInit),
  updateAccountDetailsByAdmin: (accName: string, data: any, status: string) =>
    ApiService.put(`${ADMIN_POTAL}/accounts/details/${accName}/${status}`, data, { 'X-User-Name': 'playadmin' } as HeadersInit),

  getPlanComponents: () =>
    ApiService.get(`${DOMAIN}/nnpconf/env/read/plan/1/comp`, { 'X-User-Name': 'playadmin' } as HeadersInit),

  getSubscribedComponents: (accName: string) =>
    ApiService.get(`${BASE_URL}/accounts/subscribedComponents?accountName=${accName}`, { 'X-User-Name': getXUser() } as HeadersInit),
  // New 
  // Restart a deployed pod
  restartPod: (accName: string, podName: string) => {
    const url = createUrl(K8S_BASE, "/pod?envName=:envId&podName=:podName", accName, podName);
    return ApiService.delete(url, {}, { 'X-User-Name': 'playadmin' } as HeadersInit);
  },

  // Fetch deployment-associated resources (ConfigMaps, Secrets, PVCs, ReplicaSets, Services, Pods)
  getK8sIntgResources: (accName: string, deploymentName: string) => {
    const url = createUrl(
      K8S_BASE,
      "/associated/deployment/resources?deploymentName=:deploymentName&envName=:envId",
      deploymentName,
      accName
    );
    return ApiService.get(url, { 'X-User-Name': 'playadmin' } as HeadersInit);
  },

  // Bulk delete selected resources
  deletePodResources: (data: any) => {
    const url = createUrl(K8S_BASE, "/delete/resources");
    return ApiService.post(url, data, { 'X-User-Name': 'playadmin' } as HeadersInit);
  },

  // Open the interactive command-line terminal
  openKubernetesTerminal: (data: { envName: string; pod: string }) => {
    const url = createUrl(K8S_BASE, "/terminal");
    return ApiService.post(url, data, { 'X-User-Name': 'playadmin' } as HeadersInit);
  },

  checkAllPodsStatus: (envName: string, data: any) =>
    ApiService.post(`${ADMIN_POTAL}/acc/environment/${envName}/check-pods`, data, { 'X-User-Name': getXUser() } as HeadersInit),

  createDmsWidget: (envName: string, data: any) =>
    ApiService.post(`${ADMIN_POTAL}/acc/environment/${envName}/dms`, data, { 'X-User-Name': getXUser() } as HeadersInit),
}
