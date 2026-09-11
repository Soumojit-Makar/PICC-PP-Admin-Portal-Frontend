export interface ComponentStatusResponse {
  label?: string;
  container?: string;
  status?: string;
  detail?: string;
  checkedAt?: string;
}

export interface DeploymentItem {
  id: string;
  status: string;
  message?: string;
  exitCode?: number;
  host: string;
  port: number;
  username: string;
  filePath?: string;
  component?: string;
  envId?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  heartbeatAt?: string;
  components?: ComponentStatusResponse[];
}

export interface DeploymentContainer {
  id?: number;
  deploymentId: string;
  containerName: string;
  appName?: string;
  status?: string;
  checkedAt?: string;
}

export interface DeploymentAction {
  id?: number;
  deploymentId: string;
  actionType: string;
  containerName?: string;
  command?: string;
  output?: string;
  exitCode?: number;
  performedAt?: string;
}

export interface VmStatusCheckRequest {
  host: string;
  port: number;
  username: string;
  privateKey: string;
  passphrase?: string;
}

export interface VmStatusResponse {
  host: string;
  overall: string;
  checkedAt?: string;
  components: ComponentStatusResponse[];
}

export interface DeployRequest {
  envId: string;
  host: string;
  port: number;
  username: string;
  privateKey: string;
  passphrase?: string;
  filePath: string;
  password?: string;
}

export interface ScriptExecutionResponse {
  success: boolean;
  message: string;
  remoteOutput?: string;
  exitCode: number;
}

export interface CreateDeploymentResponse {
  id: string;
  status: string;
  location?: string;
}

export interface DeploymentPageResponse {
  content: DeploymentItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
