
import { DomainModel } from '@/shared/types/domain';
import ApiService from './api.service';
import { getXUser } from '@/shared/utils';

const BASE_URL = import.meta.env.VITE_DOMAIN as string;
// const NNP_CONFIG_BASE_URL = `${BASE_URL}/domain`;
export const DomainService = {
  
  createDomain: (data:DomainModel) => ApiService.post(`${BASE_URL}/domain`,data,{ 'X-User-Name': getXUser() } as HeadersInit),
  updateDomain: (data:DomainModel,id:string) => ApiService.put(`${BASE_URL}/domain/${id}`,data, { 'X-User-Name': getXUser()} as HeadersInit),

}