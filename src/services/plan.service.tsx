import ApiService from './api.service';

const BASE_URL = import.meta.env.VITE_API_ENVIRONMENT_MANAGEMENT_URL as string;

export const PlanService = {

  getAllPlans: () => ApiService.get(`${BASE_URL}/read/plan/all`),
  getAllActivePlans: () => ApiService.get(`${BASE_URL}/read/plan`),
  getPlanComponents: (planId: number) => ApiService.get(`${BASE_URL}/read/plan/${planId}/comp`),
  getAccountsByPlan: (planId: number) => ApiService.get(`${BASE_URL}/read/plan/${planId}/accounts`),
  getAllPlanCompGroups: () => ApiService.get(`${BASE_URL}/read/plan/comp/group/all`),

  createPlan: (data: any) => ApiService.post(`${BASE_URL}/create/plan`, data),
  updatePlan: (planId: number, data: any) => ApiService.put(`${BASE_URL}/update/plan/${planId}`, data),
  deletePlan: (planId: number) => ApiService.delete(`${BASE_URL}/delete/plan/${planId}`),

  createPlanComp: (planId: number, data: any) => ApiService.post(`${BASE_URL}/create/plan/${planId}/comp`, data),
  updatePlanComp: (planId: number, hostRegPlanId: number, data: any) =>
    ApiService.put(`${BASE_URL}/update/plan/${planId}/comp/${hostRegPlanId}`, data),
  deletePlanComp: (planId: number, hostRegPlanId: number) =>
    ApiService.delete(`${BASE_URL}/delete/plan/${planId}/comp/${hostRegPlanId}`),
}
