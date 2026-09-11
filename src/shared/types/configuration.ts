
export class ConfigurationResponse {
    application: string;
    profile: string;
    tag: string;
    key: string;
    value?: string;
    is_encrypted?: boolean;
    isEncrypted?: boolean;
}

export interface AppMigrationResult {
    application: string;
    totalRecords: number;
    processed: number;
    skipped: number;
    status: string;
    message: string;
}

export interface ConfigPropertySource {
    name: string;
    source: Record<string, string>;
}

export interface ResolvedConfigResponse {
    name: string;
    profiles: string[];
    label: string;
    propertySources?: ConfigPropertySource[];
    state?: string;
    version?: string;
}

