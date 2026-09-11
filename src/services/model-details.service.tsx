import ApiService from "./api.service";

const BASE_URL = `/nnp-config/api/v1/model-details`;

export interface ModelDetailsResponse {
  modelName: string;
  apiKey: string;
  status: string;
  modelType: string;
  usage: string;
}

export const ModelDetailsService = {
  getAllModels: () => ApiService.get(`${BASE_URL}`),
  createModel: (model: ModelDetailsResponse) => ApiService.post<ModelDetailsResponse>(`${BASE_URL}`, model),
  updateModel: (model: ModelDetailsResponse) => ApiService.put<ModelDetailsResponse>(`${BASE_URL}`, model),
  deleteModel: (modelName: string) => ApiService.delete(`${BASE_URL}/${modelName}`),
};
