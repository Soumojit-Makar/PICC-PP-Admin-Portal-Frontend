import { EnvFeature } from "./envfeatures";
export interface LoginCred {
  username: string,
  password: string,
  envId: string | undefined,
  env?: Env,
}

export interface Env {

  envId: string;
  envCode: string;
  envName?: string;
  envTenantId: string;
  envTypeId: string;
  envCustId: string;
  envCustName: string;
  envDesc: string;
  envFapId: string,
  envFatNo: string;
  envEmail: string;
  envStatus: string;
  envNamespace: string;
  envDomain: string;
  envRepo: string;
  envIp: string;
  envFeatures: EnvFeature[];
}