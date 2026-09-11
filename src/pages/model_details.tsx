import { useEffect, useState, useMemo } from "react";
import { type GridColDef } from "@mui/x-data-grid";
import { Pencil, X } from "lucide-react"; 
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Swal from "sweetalert2";
import Modal from "@/widgets/modal";
import DynamicForm from "@/widgets/dynamicForm";
import { ModelDetailsForm, modelDetailsFormUpdate } from "@/shared/config/input.cofig";
import { ModelDetailsService, ModelDetailsResponse } from "@/services/model-details.service";
import NNPGrid from "@/widgets/dataGrid";
import { useLoader } from "../contexts/loader.context";
import { alertAction } from "@/shared/utils";

export type FormModeType = 'new' | 'edit';

const ModelDetailsManagement = () => {
    const { showLoader, hideLoader } = useLoader();

    const [models, setModels] = useState<ModelDetailsResponse[]>([]);
    const [formInfo, setFormInfo] = useState<{ type: FormModeType, data?: ModelDetailsResponse }>({ type: 'new' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ==========================================
    // COLUMNS FOR MODEL DETAILS
    // ==========================================
    const columns = useMemo<GridColDef[]>(() => {
        return [
            { field: 'modelName', headerName: 'Model Name', flex: 1.2 },
            { field: 'apiKey', headerName: 'API Key', flex: 1.5 },
            { field: 'status', headerName: 'Status', flex: 0.8 },
            { field: 'modelType', headerName: 'Model Type', flex: 1 },
            { field: 'usage', headerName: 'Usage', flex: 1 },
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
                                onClick={() => openModal('edit', params.row)}
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
                                            ModelDetailsService.deleteModel(params.row.modelName).then(() => {
                                                setModels((prev) => prev.filter(item => item.modelName !== params.row.modelName));
                                                alertAction('success', 'Model details deleted successfully')();
                                            }).catch(err => {
                                                console.error(err);
                                                alertAction('error', 'Failed to delete model details')();
                                            });
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

    const fetchModelDetails = async () => {
        showLoader();
        try {
            const result = await ModelDetailsService.getAllModels();
            if (result) {
                // If it is returned as string JSON, parse it
                const data: ModelDetailsResponse[] = typeof result === 'string' ? JSON.parse(result) : result;
                setModels(data);
            }
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchModelDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openModal = (type: FormModeType, data?: ModelDetailsResponse) => {
        const defaultData = data || {
            modelName: '',
            apiKey: '',
            status: '',
            modelType: '',
            usage: ''
        };
        setFormInfo({ type, data: defaultData });
        setIsModalOpen(true);
    };

    const onFormSubmit = (data: ModelDetailsResponse) => {
        showLoader();
        if (formInfo.type === 'new') {
            ModelDetailsService.createModel(data).then(() => {
                setModels((prev) => [...prev, data]);
                setIsModalOpen(false);
                alertAction('success', 'Model details created successfully')();
            }).catch(err => {
                console.error(err);
                setIsModalOpen(false);
                alertAction('error', 'Failed to create model details')();
            }).finally(() => hideLoader());
        } else if (formInfo.type === 'edit') {
            ModelDetailsService.updateModel(data).then(() => {
                setModels((prev) => prev.map(item => item.modelName === data.modelName ? data : item));
                setIsModalOpen(false);
                alertAction('success', 'Model details updated successfully')();
            }).catch(err => {
                console.error(err);
                setIsModalOpen(false);
                alertAction('error', 'Failed to update model details')();
            }).finally(() => hideLoader());
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="p-4 text-gray-500 dark:text-white font-medium text-lg border-b border-gray-200 dark:border-gray-700">
                Model Details ("nnp-rag".model_details)
            </div>
            
            {/* Grid */}
            <div className="flex-1 overflow-auto bg-transparent">
                {models.length > 0 ? (
                    <NNPGrid 
                        rows={models} 
                        columns={columns} 
                        getRowId={(row: ModelDetailsResponse) => row.modelName} 
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No Model Details Found</div>
                )}
            </div>
            
            {/* Footer Buttons */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-transparent">
                <button 
                    className="px-8 py-2 bg-gray-500 text-white font-medium rounded-sm shadow-sm hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => openModal('new')}
                >
                    Add New
                </button>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${formInfo.type === 'new' ? 'Create' : 'Edit'} Model Details`}
            >
                <DynamicForm 
                    inputs={formInfo.type === 'edit' ? (modelDetailsFormUpdate ?? []) : (ModelDetailsForm ?? [])} 
                    layout="double" 
                    onSubmit={onFormSubmit} 
                    defaultValues={formInfo.data || {}} 
                />
            </Modal>
        </div>
    );
};

export default ModelDetailsManagement;
