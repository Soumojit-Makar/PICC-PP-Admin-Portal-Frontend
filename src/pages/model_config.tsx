import { useEffect, useState, useMemo } from "react";
import { type GridColDef } from "@mui/x-data-grid";
import { Pencil, X, ShieldCheck, Unlock } from "lucide-react"; 
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Swal from "sweetalert2";
import Modal from "@/widgets/modal";
import DynamicForm from "@/widgets/dynamicForm";
import { ConfigForm, configFormUpdate } from "@/shared/config/input.cofig";
import { ConfigurationResponse } from "@/shared/types/configuration";
import { NNPConfigService } from "@/services/configuration.service";
import NNPGrid from "@/widgets/dataGrid";
import { useLoader } from "../contexts/loader.context";
import { alertAction } from "@/shared/utils";

export type FormModeType = 'new' | 'edit';

const ModelConfigManagement = () => {
    const { showLoader, hideLoader } = useLoader();

    const [configurations, setConfigurations] = useState<ConfigurationResponse[]>([]);
    const [formInfo, setFormInfo] = useState<{ type: FormModeType, data?: ConfigurationResponse }>({ type: 'new' });
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // ==========================================
    // COLUMNS FOR MODEL CONFIGURATION
    // ==========================================
    const configColumns = useMemo<GridColDef[]>(() => {
        return [
            { field: 'tag', headerName: 'Tag', flex: 0.8 },
            { field: 'key', headerName: 'Key', flex: 1.2 },
            { field: 'value', headerName: 'Value', flex: 1.8 },
            {
                field: 'is_encrypted',
                headerName: 'Encryption',
                width: 155,
                sortable: true,
                valueGetter: (_value, row) => Boolean(row.is_encrypted ?? row.isEncrypted),
                renderCell: (params) => {
                    const isEnc = Boolean(params.row.is_encrypted ?? params.row.isEncrypted);
                    return (
                        <div className="flex items-center h-full">
                            {isEnc ? (
                                <Tooltip title="Encrypted with NIST FIPS 203 ML-KEM-768 + X25519 hybrid quantum-safe cryptography">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Quantum-Safe
                                    </span>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Plaintext configuration value">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
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
                headerName: 'E | D', 
                width: 100,
                sortable: false,
                renderCell: (params) => (
                    <div className="flex items-center h-full space-x-1">
                        <Tooltip title="Edit">
                            <IconButton
                                size="small"
                                onClick={() => openCreateConfigModal('edit', params.row)}
                            >
                                <Pencil fontSize="small" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    Swal.fire({
                                        title: "Are you sure?",
                                        text: "You won't be able to revert this!",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonColor: "#d33",
                                        cancelButtonColor: "#607d8b",
                                        confirmButtonText: "Yes, delete it!"
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            NNPConfigService.deleteConfig(params.row).then(() => {
                                                setConfigurations((prev) => prev.filter(item => 
                                                    item.application !== params.row.application || 
                                                    item.profile !== params.row.profile || 
                                                    item.tag !== params.row.tag || 
                                                    item.key !== params.row.key
                                                ));
                                            }).catch(err => console.error(err));
                                        }
                                    });
                                }}
                            >
                                <X fontSize="small" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </IconButton>
                        </Tooltip>
                    </div>
                )
            }
        ];
    }, []); 

    const fetchModelConfig = async () => {
        showLoader();
        try {
            const result = await NNPConfigService.getAllConfig();
            if (result && result.length > 0) {
                const allData: ConfigurationResponse[] = JSON.parse(result);
                // Filter for nnp-rag and MODEL-DETAILS
                const filtered = allData.filter(item => item.application === 'nnp-rag' && item.profile === 'MODEL-DETAILS');
                setConfigurations(filtered);
            }
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchModelConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreateConfigModal = (type: FormModeType, data?: ConfigurationResponse) => {
        const defaultData = data ? {
            ...data,
            is_encrypted: Boolean(data.is_encrypted ?? data.isEncrypted)
        } : {
            application: 'nnp-rag',
            profile: 'MODEL-DETAILS',
            tag: '',
            key: '',
            value: '',
            is_encrypted: false
        };
        setFormInfo({ type, data: defaultData });
        setIsConfigModalOpen(true);
    };

    const onFormSubmit = (data: ConfigurationResponse) => {
        showLoader();
        const payload: ConfigurationResponse = {
            ...data,
            is_encrypted: Boolean(data.is_encrypted ?? data.isEncrypted)
        };
        if (formInfo.type === 'new') {
            NNPConfigService.createConfig(payload).then(() => {
                setConfigurations((prev) => [...prev, payload]);
                setIsConfigModalOpen(false);
                fetchModelConfig();
            }).catch(err => {
                console.error(err);
                setIsConfigModalOpen(false);
            }).finally(() => hideLoader());
        } else if (formInfo.type === 'edit') {
            NNPConfigService.updateConfig(payload).then(() => {
                setConfigurations((prev) => prev.map(item => 
                    item.application === payload.application && item.profile == payload.profile && payload.tag == item.tag && item.key == payload.key ? payload : item
                ));
                setIsConfigModalOpen(false);
                fetchModelConfig();
            }).catch(err => {
                console.error(err);
                setIsConfigModalOpen(false);
            }).finally(() => hideLoader());
        }
    };

    const modelFormConfig = useMemo(() => {
        return ConfigForm.map((field: any) => {
            if (field.name === 'application' || field.name === 'profile') {
                return { ...field, isDisabled: true };
            }
            return field;
        });
    }, []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="p-4 text-gray-500 dark:text-white font-medium text-lg border-b border-gray-200 dark:border-gray-700">
                Model Configuration (nnp-rag MODEL-DETAILS)
            </div>
            
            {/* Grid */}
            <div className="flex-1 overflow-auto bg-transparent">
                {configurations.length > 0 ? (
                    <NNPGrid 
                        rows={configurations} 
                        columns={configColumns} 
                        getRowId={(row: ConfigurationResponse) => `${row.application}_${row.profile}_${row.tag}_${row.key}`} 
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No Model Configurations Found</div>
                )}
            </div>
            
            {/* Footer Buttons */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-transparent">
                <button 
                    className="px-8 py-2 bg-gray-500 text-white font-medium rounded-sm shadow-sm hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => openCreateConfigModal('new')}
                >
                    Add New
                </button>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title={`${formInfo.type === 'new' ? 'Create' : 'Edit'} Model Configuration`}
            >
                <DynamicForm 
                    inputs={formInfo.type === 'edit' ? (configFormUpdate ?? []) : (modelFormConfig ?? [])} 
                    layout="double" 
                    onSubmit={onFormSubmit} 
                    defaultValues={formInfo.data || {}} 
                />
            </Modal>
        </div>
    );
};

export default ModelConfigManagement;
