import { useEffect, useState, useMemo } from "react";
import { type GridColDef } from "@mui/x-data-grid";
import { 
    Pencil, 
    X, 
    ShieldCheck, 
    Unlock, 
    Lock, 
    RefreshCw, 
    Eye, 
    Copy, 
    Check, 
    Play, 
    FileJson, 
    Plus,
    Info,
    Trash2,
    CheckSquare
} from "lucide-react"; 
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Swal from "sweetalert2";
import Modal from "@/widgets/modal";
import DynamicForm from "@/widgets/dynamicForm";
import { ConfigForm, configFormUpdate } from "@/shared/config/input.cofig";
import { ConfigurationResponse, AppMigrationResult, ResolvedConfigResponse } from "@/shared/types/configuration";
import { NNPConfigService } from "@/services/configuration.service";
import NNPGrid from "@/widgets/dataGrid";
import { useLoader } from "../contexts/loader.context";
import { alertAction } from "@/shared/utils";

export type FormModeType = 'new' | 'edit';

const ConfigServerManagement = () => {
    const { showLoader, hideLoader } = useLoader();

    // Data state
    const [configurations, setConfigurations] = useState<ConfigurationResponse[]>([]);
    const [formInfo, setFormInfo] = useState<{ type: FormModeType, data?: ConfigurationResponse }>({ type: 'new' });
    const [selectedRows, setSelectedRows] = useState<ConfigurationResponse[]>([]);
    
    // Modal controls
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    
    // View/Inspector state
    const [selectedConfigForView, setSelectedConfigForView] = useState<ConfigurationResponse | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Migration state
    const [migrationApp, setMigrationApp] = useState<string>('');
    const [migrationResult, setMigrationResult] = useState<AppMigrationResult | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);

    // Resolution tester state
    const [resApp, setResApp] = useState<string>('common');
    const [resProfiles, setResProfiles] = useState<string>('default');
    const [resTag, setResTag] = useState<string>('latest');
    const [resolvedResult, setResolvedResult] = useState<ResolvedConfigResponse | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    // Bulk config state
    const [bulkJsonText, setBulkJsonText] = useState<string>('');
    const [bulkError, setBulkError] = useState<string | null>(null);

    // ==========================================
    // DATA FETCHING
    // ==========================================
    const fetchAllConfig = async () => {
        showLoader();
        try {
            const result = await NNPConfigService.getAllConfig();
            if (result) {
                const allData: ConfigurationResponse[] = typeof result === 'string' ? JSON.parse(result) : result;
                // Filter out the nnp-rag MODEL-DETAILS configs
                const filtered = allData.filter(item => !(item.application === 'nnp-rag' && item.profile === 'MODEL-DETAILS'));
                setConfigurations(filtered);
            } else {
                setConfigurations([]);
            }
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchAllConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Unique applications list
    const uniqueApplications = useMemo(() => {
        const apps = new Set<string>();
        configurations.forEach(item => {
            if (item.application) apps.add(item.application);
        });
        return Array.from(apps).sort();
    }, [configurations]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = configurations.length;
        const encrypted = configurations.filter(item => item.is_encrypted || item.isEncrypted).length;
        const plaintext = total - encrypted;
        return { total, encrypted, plaintext };
    }, [configurations]);

    // Selected application stats for migration dialog
    const selectedAppStats = useMemo(() => {
        if (!migrationApp) return null;
        const matching = configurations.filter(item => item.application === migrationApp);
        const total = matching.length;
        const enc = matching.filter(item => item.is_encrypted || item.isEncrypted).length;
        const plain = total - enc;
        return { total, enc, plain };
    }, [configurations, migrationApp]);

    // Copy helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // ==========================================
    // SINGLE ROW CONVERT ENCRYPTION HANDLER
    // ==========================================
    const handleConvertRowEncryption = async (row: ConfigurationResponse, toEncrypt: boolean) => {
        if (toEncrypt) {
            const confirm = await Swal.fire({
                title: "Convert to Quantum-Safe?",
                text: `Encrypt property "${row.key}" using NIST FIPS 203 ML-KEM-768 hybrid encryption?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#059669",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Yes, Encrypt It"
            });

            if (!confirm.isConfirmed) return;

            showLoader();
            try {
                const payload: ConfigurationResponse = {
                    ...row,
                    is_encrypted: true
                };
                const updated = await NNPConfigService.updateConfig(payload);
                const resolved = updated || payload;
                setConfigurations(prev => prev.map(item => 
                    (item.application === row.application && item.profile === row.profile && item.tag === row.tag && item.key === row.key) ? resolved : item
                ));
                Swal.fire({
                    title: "Encrypted!",
                    text: `"${row.key}" has been converted to Quantum-Safe ciphertext.`,
                    icon: "success",
                    timer: 1800,
                    showConfirmButton: false
                });
                fetchAllConfig();
            } catch (err: any) {
                console.error(err);
                alertAction('error', err?.message || 'Failed to encrypt configuration')();
            } finally {
                hideLoader();
            }
        } else {
            const confirm = await Swal.fire({
                title: "Convert to Plaintext?",
                text: `Decrypt property "${row.key}" back to plaintext?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d97706",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Yes, Decrypt It"
            });

            if (!confirm.isConfirmed) return;

            showLoader();
            try {
                // Fetch decrypted value using resolved config API
                let decryptedVal = row.value || '';
                try {
                    const resolved = await NNPConfigService.getResolvedConfig(row.application, row.profile, row.tag);
                    const parsed = typeof resolved === 'string' ? JSON.parse(resolved) : resolved;
                    if (parsed?.propertySources) {
                        for (const ps of parsed.propertySources) {
                            if (ps.source && ps.source[row.key] !== undefined) {
                                decryptedVal = ps.source[row.key];
                                break;
                            }
                        }
                    }
                } catch {
                    // Fallback to row value if resolve fails
                }

                const payload: ConfigurationResponse = {
                    ...row,
                    value: decryptedVal,
                    is_encrypted: false
                };

                const updated = await NNPConfigService.updateConfig(payload);
                const resolved = updated || payload;
                setConfigurations(prev => prev.map(item => 
                    (item.application === row.application && item.profile === row.profile && item.tag === row.tag && item.key === row.key) ? resolved : item
                ));
                Swal.fire({
                    title: "Decrypted!",
                    text: `"${row.key}" has been converted to Plaintext.`,
                    icon: "success",
                    timer: 1800,
                    showConfirmButton: false
                });
                fetchAllConfig();
            } catch (err: any) {
                console.error(err);
                alertAction('error', err?.message || 'Failed to decrypt configuration')();
            } finally {
                hideLoader();
            }
        }
    };

    // ==========================================
    // BULK SELECTION ACTIONS
    // ==========================================
    const handleBulkEncryptSelected = async () => {
        const plaintextItems = selectedRows.filter(r => !(r.is_encrypted || r.isEncrypted));
        if (plaintextItems.length === 0) {
            Swal.fire({
                title: "Already Encrypted",
                text: "All selected configurations are already Quantum-Safe encrypted.",
                icon: "info"
            });
            return;
        }

        const confirm = await Swal.fire({
            title: `Convert ${plaintextItems.length} Configuration(s) to Encrypted?`,
            text: `This will encrypt ${plaintextItems.length} plaintext property value(s) with NIST FIPS 203 ML-KEM-768 hybrid encryption.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#059669",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Yes, Encrypt (${plaintextItems.length})`
        });

        if (!confirm.isConfirmed) return;

        showLoader();
        try {
            const payloads = plaintextItems.map(item => ({
                ...item,
                is_encrypted: true
            }));
            await NNPConfigService.bulkConfig(payloads);
            Swal.fire({
                title: "Bulk Encryption Complete",
                text: `Successfully converted ${plaintextItems.length} configuration(s) to Quantum-Safe ciphertext!`,
                icon: "success"
            });
            setSelectedRows([]);
            await fetchAllConfig();
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Bulk encryption failed')();
        } finally {
            hideLoader();
        }
    };

    const handleBulkDecryptSelected = async () => {
        const encryptedItems = selectedRows.filter(r => r.is_encrypted || r.isEncrypted);
        if (encryptedItems.length === 0) {
            Swal.fire({
                title: "Already Plaintext",
                text: "All selected configurations are already in Plaintext.",
                icon: "info"
            });
            return;
        }

        const confirm = await Swal.fire({
            title: `Convert ${encryptedItems.length} Configuration(s) to Plaintext?`,
            text: `This will decrypt ${encryptedItems.length} encrypted property value(s) back to plaintext.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d97706",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Yes, Decrypt (${encryptedItems.length})`
        });

        if (!confirm.isConfirmed) return;

        showLoader();
        try {
            // Group by application to retrieve decrypted values via client resolution
            const decryptedPayloads: ConfigurationResponse[] = [];
            const cacheByAppProfileTag = new Map<string, Record<string, string>>();

            for (const item of encryptedItems) {
                const cacheKey = `${item.application}_${item.profile}_${item.tag}`;
                if (!cacheByAppProfileTag.has(cacheKey)) {
                    try {
                        const resolved = await NNPConfigService.getResolvedConfig(item.application, item.profile, item.tag);
                        const parsed = typeof resolved === 'string' ? JSON.parse(resolved) : resolved;
                        const propMap: Record<string, string> = {};
                        if (parsed?.propertySources) {
                            for (const ps of parsed.propertySources) {
                                if (ps.source) {
                                    Object.assign(propMap, ps.source);
                                }
                            }
                        }
                        cacheByAppProfileTag.set(cacheKey, propMap);
                    } catch {
                        cacheByAppProfileTag.set(cacheKey, {});
                    }
                }

                const propMap = cacheByAppProfileTag.get(cacheKey) || {};
                const decryptedVal = propMap[item.key] !== undefined ? propMap[item.key] : item.value;
                decryptedPayloads.push({
                    ...item,
                    value: decryptedVal,
                    is_encrypted: false
                });
            }

            await NNPConfigService.bulkConfig(decryptedPayloads);
            Swal.fire({
                title: "Bulk Decryption Complete",
                text: `Successfully converted ${encryptedItems.length} configuration(s) back to Plaintext!`,
                icon: "success"
            });
            setSelectedRows([]);
            await fetchAllConfig();
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Bulk decryption failed')();
        } finally {
            hideLoader();
        }
    };

    const handleBulkDeleteSelected = async () => {
        if (selectedRows.length === 0) return;

        const confirm = await Swal.fire({
            title: `Delete ${selectedRows.length} Configuration(s)?`,
            text: "This action cannot be undone. Selected configurations will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Yes, Delete All (${selectedRows.length})`
        });

        if (!confirm.isConfirmed) return;

        showLoader();
        try {
            for (const row of selectedRows) {
                await NNPConfigService.deleteConfig(row);
            }
            Swal.fire({
                title: "Deleted",
                text: `Successfully deleted ${selectedRows.length} configuration(s).`,
                icon: "success",
                timer: 1800,
                showConfirmButton: false
            });
            setSelectedRows([]);
            await fetchAllConfig();
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Failed to delete selected configurations')();
        } finally {
            hideLoader();
        }
    };

    // ==========================================
    // GRID COLUMNS
    // ==========================================
    const configColumns = useMemo<GridColDef[]>(() => {
        return [
            {
                field: 'application',
                headerName: 'Application',
                flex: 1.2,
                renderCell: (params) => {
                    const isCommon = params.value === 'common';
                    return (
                        <div className="flex items-center h-full">
                            <span 
                                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                                    isCommon 
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 hover:bg-purple-200' 
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200'
                                }`}
                                onClick={() => {
                                    setMigrationApp(params.value || 'common');
                                    setIsMigrationModalOpen(true);
                                }}
                                title="Click to open Quantum Migration for this application"
                            >
                                {params.value || 'common'}
                            </span>
                        </div>
                    );
                }
            },
            {
                field: 'profile',
                headerName: 'Profile',
                flex: 0.9,
                renderCell: (params) => (
                    <div className="flex items-center h-full">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                            {params.value}
                        </span>
                    </div>
                )
            },
            {
                field: 'tag',
                headerName: 'Tag',
                flex: 0.8,
                renderCell: (params) => (
                    <div className="flex items-center h-full">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {params.value}
                        </span>
                    </div>
                )
            },
            {
                field: 'key',
                headerName: 'Key',
                flex: 1.4,
                renderCell: (params) => {
                    const rowKey = `${params.row.application}_${params.row.key}`;
                    const isCopied = copiedKey === rowKey;
                    return (
                        <div className="flex items-center justify-between w-full h-full group">
                            <span className="font-mono text-xs font-medium text-gray-800 dark:text-gray-200 truncate mr-1" title={params.value}>
                                {params.value}
                            </span>
                            <Tooltip title={isCopied ? "Copied!" : "Copy key"}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(params.value, rowKey);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity"
                                >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </Tooltip>
                        </div>
                    );
                }
            },
            {
                field: 'value',
                headerName: 'Value',
                flex: 1.7,
                renderCell: (params) => {
                    const isEnc = Boolean(params.row.is_encrypted ?? params.row.isEncrypted);
                    const val = params.value || '';
                    const isJsonPayload = isEnc || val.startsWith('{') || val.length > 40;

                    return (
                        <div className="flex items-center justify-between w-full h-full">
                            <span 
                                className="truncate font-mono text-xs text-gray-600 dark:text-gray-300 max-w-[80%]" 
                                title={val}
                            >
                                {isEnc ? '•••••••• [Ciphertext Envelope]' : val}
                            </span>
                            <div className="flex items-center space-x-1">
                                {isJsonPayload && (
                                    <Tooltip title="View full payload">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedConfigForView(params.row);
                                                setIsValueModalOpen(true);
                                            }}
                                            className="p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </Tooltip>
                                )}
                                <Tooltip title="Copy value">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(val, `val_${params.row.application}_${params.row.key}`);
                                        }}
                                        className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {copiedKey === `val_${params.row.application}_${params.row.key}` ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    );
                }
            },
            {
                field: 'is_encrypted',
                headerName: 'Encryption Status',
                width: 155,
                sortable: true,
                valueGetter: (_value, row) => Boolean(row.is_encrypted ?? row.isEncrypted),
                renderCell: (params) => {
                    const isEnc = Boolean(params.row.is_encrypted ?? params.row.isEncrypted);
                    return (
                        <div className="flex items-center h-full">
                            {isEnc ? (
                                <Tooltip title="Click convert button in Actions to decrypt back to plaintext">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm cursor-pointer">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Quantum-Safe
                                    </span>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Click convert button in Actions to encrypt with Quantum-Safe ML-KEM-768">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
                                        <Unlock className="w-3.5 h-3.5 text-gray-400" />
                                        Plaintext
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    );
                }
            },
            {
                field: 'actions',
                headerName: 'Actions', 
                width: 140,
                sortable: false,
                renderCell: (params) => {
                    const isEnc = Boolean(params.row.is_encrypted ?? params.row.isEncrypted);
                    return (
                        <div className="flex items-center h-full space-x-1">
                            {/* 1-Click Convert Option */}
                            {!isEnc ? (
                                <Tooltip title="Convert to Quantum-Safe Encryption (1-Click)">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleConvertRowEncryption(params.row, true)}
                                        className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    >
                                        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Convert to Plaintext (1-Click)">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleConvertRowEncryption(params.row, false)}
                                        className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                    >
                                        <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Edit */}
                            <Tooltip title="Edit configuration">
                                <IconButton
                                    size="small"
                                    onClick={() => openCreateConfigModal('edit', params.row)}
                                >
                                    <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
                                </IconButton>
                            </Tooltip>

                            {/* Delete */}
                            <Tooltip title="Delete configuration">
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(params.row)}
                                >
                                    <X className="w-4 h-4 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
                                </IconButton>
                            </Tooltip>
                        </div>
                    );
                }
            }
        ];
    }, [copiedKey]);

    // ==========================================
    // ACTIONS & HANDLERS
    // ==========================================
    const handleDelete = (row: ConfigurationResponse) => {
        Swal.fire({
            title: "Delete Configuration?",
            text: `Are you sure you want to delete ${row.application} / ${row.key}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#607d8b",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                showLoader();
                NNPConfigService.deleteConfig(row).then(() => {
                    setConfigurations((prev) => prev.filter(item => 
                        !(item.application === row.application && 
                          item.profile === row.profile && 
                          item.tag === row.tag && 
                          item.key === row.key)
                    ));
                    Swal.fire({
                        title: "Deleted!",
                        text: "Configuration property has been deleted.",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    });
                }).catch(err => {
                    console.error(err);
                    alertAction('error', 'Failed to delete configuration')();
                }).finally(() => hideLoader());
            }
        });
    };

    const openCreateConfigModal = (type: FormModeType, data?: ConfigurationResponse) => {
        const prefilledData = data ? {
            ...data,
            is_encrypted: Boolean(data.is_encrypted ?? data.isEncrypted)
        } : {
            application: '',
            profile: 'default',
            tag: 'latest',
            key: '',
            value: '',
            is_encrypted: false
        };
        setFormInfo({ type, data: prefilledData });
        setIsConfigModalOpen(true);
    };

    const onFormSubmit = async (data: ConfigurationResponse) => {
        showLoader();
        const payload: ConfigurationResponse = {
            ...data,
            is_encrypted: Boolean(data.is_encrypted ?? data.isEncrypted)
        };

        try {
            if (formInfo.type === 'new') {
                const created = await NNPConfigService.createConfig(payload);
                const resolvedCreated = created || payload;
                setConfigurations((prev) => [...prev, resolvedCreated]);
                setIsConfigModalOpen(false);
                Swal.fire({
                    title: "Created!",
                    text: payload.is_encrypted ? "Configuration saved and quantum-safe encrypted!" : "Configuration saved successfully.",
                    icon: "success",
                    timer: 1800,
                    showConfirmButton: false
                });
                fetchAllConfig();
            } else if (formInfo.type === 'edit') {
                const updated = await NNPConfigService.updateConfig(payload);
                const resolvedUpdated = updated || payload;
                setConfigurations((prev) => prev.map(item => 
                    (item.application === payload.application && 
                     item.profile === payload.profile && 
                     item.tag === payload.tag && 
                     item.key === payload.key) ? resolvedUpdated : item
                ));
                setIsConfigModalOpen(false);
                Swal.fire({
                    title: "Updated!",
                    text: payload.is_encrypted ? "Configuration updated and quantum-safe encrypted!" : "Configuration updated successfully.",
                    icon: "success",
                    timer: 1800,
                    showConfirmButton: false
                });
                fetchAllConfig();
            }
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Failed to save configuration')();
            setIsConfigModalOpen(false);
        } finally {
            hideLoader();
        }
    };

    // ==========================================
    // APPLICATION-LEVEL QUANTUM MIGRATION HANDLERS
    // ==========================================
    const handleApplicationEncrypt = async () => {
        if (!migrationApp) {
            alertAction('error', 'Please select an application to migrate')();
            return;
        }

        const confirm = await Swal.fire({
            title: `Encrypt All Configs?`,
            text: `This will scan all configurations for "${migrationApp}" and encrypt any plaintext secrets using NIST FIPS 203 ML-KEM-768 hybrid encryption. Already encrypted records will be skipped.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#059669",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Encrypt All"
        });

        if (!confirm.isConfirmed) return;

        setIsMigrating(true);
        try {
            const res = await NNPConfigService.encryptApplicationConfigs(migrationApp);
            const parsedRes: AppMigrationResult = typeof res === 'string' ? JSON.parse(res) : res;
            setMigrationResult(parsedRes);
            await fetchAllConfig();
            Swal.fire({
                title: "Migration Complete",
                text: parsedRes.message || `Processed ${parsedRes.processed} records.`,
                icon: "success"
            });
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Migration encryption failed')();
        } finally {
            setIsMigrating(false);
        }
    };

    const handleApplicationDecrypt = async () => {
        if (!migrationApp) {
            alertAction('error', 'Please select an application to decrypt')();
            return;
        }

        const confirm = await Swal.fire({
            title: `Decrypt All Configs?`,
            text: `This will scan all configurations for "${migrationApp}" and decrypt any encrypted secrets back to plaintext. Already plaintext records will be skipped.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d97706",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Decrypt All"
        });

        if (!confirm.isConfirmed) return;

        setIsMigrating(true);
        try {
            const res = await NNPConfigService.decryptApplicationConfigs(migrationApp);
            const parsedRes: AppMigrationResult = typeof res === 'string' ? JSON.parse(res) : res;
            setMigrationResult(parsedRes);
            await fetchAllConfig();
            Swal.fire({
                title: "Decryption Complete",
                text: parsedRes.message || `Processed ${parsedRes.processed} records.`,
                icon: "success"
            });
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Migration decryption failed')();
        } finally {
            setIsMigrating(false);
        }
    };

    // ==========================================
    // CLIENT RESOLUTION TESTER
    // ==========================================
    const handleResolveTest = async () => {
        if (!resApp || !resProfiles || !resTag) {
            alertAction('error', 'Application, Profiles, and Tag are required')();
            return;
        }

        setIsResolving(true);
        try {
            const result = await NNPConfigService.getResolvedConfig(resApp, resProfiles, resTag);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setResolvedResult(parsed);
        } catch (err: any) {
            console.error(err);
            alertAction('error', err?.message || 'Failed to resolve configuration')();
        } finally {
            setIsResolving(false);
        }
    };

    // ==========================================
    // BULK CONFIGURATION HANDLER (JSON)
    // ==========================================
    const handleBulkSubmit = async () => {
        setBulkError(null);
        if (!bulkJsonText.trim()) {
            setBulkError("Please provide a JSON array of configuration records.");
            return;
        }

        let parsed: ConfigurationResponse[];
        try {
            parsed = JSON.parse(bulkJsonText);
            if (!Array.isArray(parsed)) {
                setBulkError("Input must be a JSON array (e.g., [ { application, profile, tag, key, value, is_encrypted } ])");
                return;
            }
        } catch (err: any) {
            setBulkError("Invalid JSON syntax: " + err.message);
            return;
        }

        showLoader();
        try {
            await NNPConfigService.bulkConfig(parsed);
            setIsBulkModalOpen(false);
            setBulkJsonText('');
            Swal.fire({
                title: "Bulk Save Successful",
                text: `Successfully saved/updated ${parsed.length} configuration properties!`,
                icon: "success"
            });
            await fetchAllConfig();
        } catch (err: any) {
            console.error(err);
            setBulkError(err?.message || "Failed to process bulk configuration.");
        } finally {
            hideLoader();
        }
    };

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header with Stats & Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-gray-800 dark:text-white font-semibold text-lg">
                        Config Server Details
                    </span>
                    {/* Stats pills */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            Total: <strong className="ml-1">{stats.total}</strong>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Quantum-Safe: <strong className="ml-1">{stats.encrypted}</strong>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400 border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                            <Unlock className="w-3 h-3 text-gray-400" />
                            Plaintext: <strong className="ml-1">{stats.plaintext}</strong>
                        </span>
                    </div>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex items-center gap-2">
                    <Tooltip title="Refresh configurations">
                        <button
                            onClick={fetchAllConfig}
                            className="p-2 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <button
                        onClick={() => {
                            if (!migrationApp && uniqueApplications.length > 0) {
                                setMigrationApp(uniqueApplications[0]);
                            }
                            setIsMigrationModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                        title="Bulk encrypt or decrypt configurations per application"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Quantum Migration</span>
                    </button>

                    <button
                        onClick={() => setIsResolutionModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                        title="Simulate client configuration query and transparent in-memory decryption"
                    >
                        <Play className="w-3.5 h-3.5" />
                        <span>Test Resolution</span>
                    </button>

                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                        title="Bulk import or update configurations via JSON"
                    >
                        <FileJson className="w-3.5 h-3.5" />
                        <span>Bulk JSON</span>
                    </button>
                </div>
            </div>

            {/* Bulk Selection Floating Action Bar */}
            {selectedRows.length > 0 && (
                <div className="mx-4 my-2 p-2.5 rounded-lg bg-blue-50 dark:bg-gray-800/90 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs">
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                            {selectedRows.length} item(s) selected:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium">
                            {selectedRows.filter(r => r.is_encrypted || r.isEncrypted).length} Encrypted
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                            {selectedRows.filter(r => !(r.is_encrypted || r.isEncrypted)).length} Plaintext
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBulkEncryptSelected}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow transition-colors"
                            title="Convert all selected plaintext configurations to Quantum-Safe encryption"
                        >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Convert / Encrypt Selected ({selectedRows.filter(r => !(r.is_encrypted || r.isEncrypted)).length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleBulkDecryptSelected}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow transition-colors"
                            title="Convert all selected encrypted configurations to Plaintext"
                        >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Convert / Decrypt Selected ({selectedRows.filter(r => r.is_encrypted || r.isEncrypted).length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleBulkDeleteSelected}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow transition-colors"
                            title="Delete all selected configurations"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedRows([])}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline px-1"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
            )}
            
            {/* Grid */}
            <div className="flex-1 overflow-auto bg-transparent">
                {configColumns.length > 0 ? (
                    <NNPGrid 
                        rows={configurations} 
                        columns={configColumns} 
                        showCheckbox={true}
                        onSelectionChange={(rows) => setSelectedRows(rows)}
                        getRowId={(row: ConfigurationResponse) => `${row.application}_${row.profile}_${row.tag}_${row.key}`} 
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        No Configurations Found
                    </div>
                )}
            </div>
            
            {/* Footer Buttons */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-transparent">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Post-Quantum Hybrid: NIST FIPS 203 ML-KEM-768 + X25519 AES-256-GCM</span>
                </div>
                <button 
                    className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded shadow-sm hover:bg-blue-700 transition-colors"
                    onClick={() => openCreateConfigModal('new')}
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Configuration</span>
                </button>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title={`${formInfo.type === 'new' ? 'Create' : 'Edit'} Configuration`}
            >
                <div className="space-y-4">
                    <DynamicForm 
                        inputs={formInfo.type === 'edit' ? (configFormUpdate ?? []) : (ConfigForm ?? [])} 
                        layout="double" 
                        onSubmit={onFormSubmit} 
                        defaultValues={formInfo.data || {}} 
                    />
                </div>
            </Modal>

            {/* Quantum Application Migration Modal */}
            <Modal
                isOpen={isMigrationModalOpen}
                onClose={() => {
                    setIsMigrationModalOpen(false);
                    setMigrationResult(null);
                }}
                title="Application Quantum-Safe Migration"
            >
                <div className="space-y-5 p-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                        Perform application-wide migration between plaintext and NIST FIPS 203 ML-KEM-768 hybrid post-quantum ciphertext envelopes.
                    </p>

                    {/* App selector */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                            Target Application
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={migrationApp}
                                onChange={(e) => {
                                    setMigrationApp(e.target.value);
                                    setMigrationResult(null);
                                }}
                                className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">-- Select Application --</option>
                                {uniqueApplications.map(app => (
                                    <option key={app} value={app}>{app}</option>
                                ))}
                            </select>
                            <input 
                                type="text"
                                placeholder="Or enter custom application name"
                                value={migrationApp}
                                onChange={(e) => {
                                    setMigrationApp(e.target.value);
                                    setMigrationResult(null);
                                }}
                                className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 text-sm"
                            />
                        </div>
                    </div>

                    {/* Selected App Stats */}
                    {selectedAppStats && (
                        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center">
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">Total Properties</span>
                                <span className="text-lg font-bold text-gray-800 dark:text-white">{selectedAppStats.total}</span>
                            </div>
                            <div>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 block">Encrypted</span>
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedAppStats.enc}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-300 block">Plaintext</span>
                                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{selectedAppStats.plain}</span>
                            </div>
                        </div>
                    )}

                    {/* Migration Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            disabled={!migrationApp || isMigrating}
                            onClick={handleApplicationEncrypt}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium text-sm text-white shadow transition-all ${
                                !migrationApp || isMigrating 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            <span>Encrypt All Properties</span>
                        </button>

                        <button
                            type="button"
                            disabled={!migrationApp || isMigrating}
                            onClick={handleApplicationDecrypt}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium text-sm text-white shadow transition-all ${
                                !migrationApp || isMigrating 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-amber-600 hover:bg-amber-700 active:scale-98'
                            }`}
                        >
                            <Unlock className="w-4 h-4" />
                            <span>Decrypt All Properties</span>
                        </button>
                    </div>

                    {/* Migration Result Card */}
                    {migrationResult && (
                        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-emerald-300 dark:border-emerald-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Migration Result</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    migrationResult.status === 'SUCCESS' 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                }`}>
                                    {migrationResult.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                <div>Total: <strong>{migrationResult.totalRecords}</strong></div>
                                <div>Processed: <strong className="text-emerald-600">{migrationResult.processed}</strong></div>
                                <div>Skipped: <strong>{migrationResult.skipped}</strong></div>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                                {migrationResult.message}
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Client Resolution Tester Modal */}
            <Modal
                isOpen={isResolutionModalOpen}
                onClose={() => {
                    setIsResolutionModalOpen(false);
                    setResolvedResult(null);
                }}
                title="Client Configuration Resolution Tester"
            >
                <div className="space-y-4 p-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                        Simulate how client microservices query their resolved configuration properties via <code className="font-mono text-blue-600 dark:text-blue-400">GET /nnp-config/&#123;app&#125;/&#123;profiles&#125;/&#123;tag&#125;</code>.
                        All quantum-encrypted values are dynamically decrypted in-memory.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Application
                            </label>
                            <input
                                type="text"
                                value={resApp}
                                onChange={(e) => setResApp(e.target.value)}
                                placeholder="e.g. redmine-int"
                                className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Profile(s)
                            </label>
                            <input
                                type="text"
                                value={resProfiles}
                                onChange={(e) => setResProfiles(e.target.value)}
                                placeholder="e.g. prod,default"
                                className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tag / Label
                            </label>
                            <input
                                type="text"
                                value={resTag}
                                onChange={(e) => setResTag(e.target.value)}
                                placeholder="e.g. latest"
                                className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={isResolving}
                            onClick={handleResolveTest}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow transition-colors"
                        >
                            <Play className="w-3.5 h-3.5" />
                            <span>{isResolving ? 'Resolving...' : 'Resolve Configuration'}</span>
                        </button>
                    </div>

                    {resolvedResult && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Resolved Response ({resolvedResult.name || resApp}):
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(JSON.stringify(resolvedResult, null, 2), 'resolved_copy')}
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {copiedKey === 'resolved_copy' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>Copy JSON</span>
                                </button>
                            </div>
                            <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono max-h-64 overflow-auto border border-gray-700">
                                {JSON.stringify(resolvedResult, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Value / Ciphertext Inspector Modal */}
            <Modal
                isOpen={isValueModalOpen}
                onClose={() => {
                    setIsValueModalOpen(false);
                    setSelectedConfigForView(null);
                }}
                title="Configuration Value Inspector"
            >
                {selectedConfigForView && (
                    <div className="space-y-4 p-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="text-gray-400 block">Application</span>
                                <strong className="text-gray-800 dark:text-gray-100">{selectedConfigForView.application}</strong>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Profile</span>
                                <strong className="text-gray-800 dark:text-gray-100">{selectedConfigForView.profile}</strong>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Tag</span>
                                <strong className="text-gray-800 dark:text-gray-100">{selectedConfigForView.tag}</strong>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Encryption</span>
                                <span className="inline-flex items-center gap-1">
                                    {selectedConfigForView.is_encrypted || selectedConfigForView.isEncrypted ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Quantum-Safe
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Unlock className="w-3 h-3" /> Plaintext
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 block mb-1">Key:</span>
                            <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs text-gray-800 dark:text-gray-100">
                                {selectedConfigForView.key}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Stored Raw Value / Envelope:</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(selectedConfigForView.value || '', 'inspector_copy')}
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {copiedKey === 'inspector_copy' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>Copy Value</span>
                                </button>
                            </div>
                            <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono max-h-72 overflow-auto border border-gray-700 whitespace-pre-wrap break-all">
                                {(() => {
                                    const raw = selectedConfigForView.value || '';
                                    try {
                                        const parsed = JSON.parse(raw);
                                        return JSON.stringify(parsed, null, 2);
                                    } catch {
                                        return raw;
                                    }
                                })()}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Import Modal */}
            <Modal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    setBulkError(null);
                }}
                title="Bulk Configuration Import (JSON)"
            >
                <div className="space-y-4 p-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                        Paste a JSON array of configuration objects to create or update in bulk via <code className="font-mono text-blue-600 dark:text-blue-400">POST /nnp-config/bulk</code>.
                    </p>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Payload format:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setBulkJsonText(JSON.stringify([
                                    {
                                        application: "redmine-int",
                                        profile: "prod",
                                        tag: "latest",
                                        key: "security.api-token",
                                        value: "sample-secret-value",
                                        is_encrypted: true
                                    },
                                    {
                                        application: "common",
                                        profile: "default",
                                        tag: "latest",
                                        key: "server.port",
                                        value: "8080",
                                        is_encrypted: false
                                    }
                                ], null, 2));
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Insert Sample JSON
                        </button>
                    </div>

                    <textarea
                        rows={10}
                        value={bulkJsonText}
                        onChange={(e) => setBulkJsonText(e.target.value)}
                        placeholder='[&#10;  {&#10;    "application": "my-app",&#10;    "profile": "prod",&#10;    "tag": "latest",&#10;    "key": "db.password",&#10;    "value": "secret",&#10;    "is_encrypted": true&#10;  }&#10;]'
                        className="w-full p-3 font-mono text-xs rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />

                    {bulkError && (
                        <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                            {bulkError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsBulkModalOpen(false)}
                            className="px-4 py-2 rounded text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkSubmit}
                            className="px-5 py-2 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow"
                        >
                            Validate &amp; Save All
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ConfigServerManagement;