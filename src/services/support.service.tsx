
import ApiService from './api.service';
import { getdomainNameList } from "../shared/utils";

const BASE_URL = import.meta.env.VITE_SUPPORT_URL as string;
// const NNP_CONFIG_BASE_URL = `${BASE_URL}/domain`;
export const SupportService = {

  getSupportDetails: () => ApiService.get(`${BASE_URL}/issues?pageNumber=0&pageSize=500`),
  updateSupportDetails: (data: any, issueId: string) => ApiService.put<any>(`${BASE_URL}/update/${issueId}`, data),
  getApiDomain: () => ApiService.get(`/domain/all/domval?domainName=${getdomainNameList()}`),

}