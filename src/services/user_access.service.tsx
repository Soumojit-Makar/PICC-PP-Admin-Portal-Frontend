
import { getEnvCode, getXUser } from '@/shared/utils';
import ApiService from './api.service';

const BASE_URL = import.meta.env.VITE_API_USER_ACCESS_URL as string;

export const UserAccessService = {

  createUser: (data: any) => ApiService.post(`${BASE_URL}/register/user/v2`, data),

  // V3: Full atomic registration — hard rollback on any failure
  createUserV3: (data: any) => ApiService.post(`${BASE_URL}/register/user/v3`, data),

  getUsersByAccountName: (accName: string) => ApiService.get(`${BASE_URL}/read/user/v2/env/${accName}/status/active`, { 'X-User-Name': getXUser() } as HeadersInit),
  getActiveUsers: () => ApiService.get(`${BASE_URL}/read/user/v2/env/${getEnvCode().envId}/status/active`),
  getUserRoles: () => ApiService.get(`${BASE_URL}/read/roles/v2`),
  updateUserRoles: (userId: string, data: any) => ApiService.put(`${BASE_URL}/update/user/role/v2/${userId}`, data),
  getEnvFeaturesByUserId: (userId: string, envId?: string) => ApiService.get(`${BASE_URL}/read/access/v3/env/${envId || getEnvCode().envId}/user/${userId}`),
  updateUserAccess: (userId: string, data: any) => ApiService.put(`${BASE_URL}/update/access/v3/env/${getEnvCode().envId}/user/${userId}`, data),

  getAllUserRequests: () => ApiService.get(`${BASE_URL}/read/user/status/v2/applied/${getXUser().toLocaleLowerCase()}`),
  updateUserRequests: (userId: string, data: any) => ApiService.put(`${BASE_URL}/activate/user/v2/${userId}`, data),
  deleteUser: (userId: string) => ApiService.delete(`${BASE_URL}/delete/${userId}`),
  checkExists: (userIdentifier: string) => ApiService.get(`${BASE_URL}/exists?userIdentifier=${userIdentifier}`),

  // V3: Cross-system existence check — DB + Keycloak + Redmine + GitLab
  // Returns: { existsInDb, existsInKeycloak, existsInRedmine, existsInGitLab, existsInAny }
  checkExistsAllSystems: (userIdentifier: string, envId: string) =>
    ApiService.get(`${BASE_URL}/exists/v3?userIdentifier=${userIdentifier}&envId=${envId}`),
}

