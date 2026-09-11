import { NNPConfigService } from "@/services/configuration.service";
import { DomainForm } from "@/shared/config/input.cofig";
import { DomainModel } from "@/shared/types/domain";
import { InputConfig } from "@/shared/types/inputconfig";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import Modal from "@/widgets/modal";
import { useEffect, useState, useMemo } from "react";
import { showConfirmDialog } from "@/widgets/confirmDialog";
import { useLoader } from "@/contexts/loader.context";
import { type GridColDef } from "@mui/x-data-grid";
import { Pencil, X } from "lucide-react"; 
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

const DomainManagement = () => {
    const [data, setData] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rowToEdit, setRowToEdit] = useState<DomainModel | null>();
    const APICreationFormCongif: InputConfig = DomainForm;
    const { showLoader, hideLoader } = useLoader();

    // ==========================================
    // DYNAMIC COLUMNS FROM SERVICE DATA
    // ==========================================
    const domainColumns = useMemo<GridColDef[]>(() => {
        if (!data || data.length === 0) return [];

        const firstRow = data[0];
        
        // Dynamically map keys, skipping raw database 'id' fields if present
        const dynamicCols: GridColDef[] = Object.keys(firstRow)
            .filter(key => key !== 'id') 
            .map((key) => {
                const headerName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                return {
                    field: key,
                    headerName: headerName,
                    flex: 1,
                    ...(key === 'domain' && {
                        renderCell: (params) => (
                            <span className="text-[#5c8edb] underline cursor-pointer hover:text-blue-700">
                                {params.value || 'Common'}
                            </span>
                        )
                    })
                };
            });

        // Append the E | D actions column
        dynamicCols.push({
            field: 'actions',
            headerName: 'E | D',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <div className="flex items-center h-full space-x-1">
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(params.row)}>
                            {/* FIX: Dark mode icon color */}
                            <Pencil fontSize="small" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(params.row)}>
                            {/* FIX: Dark mode icon color */}
                            <X fontSize="small" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </IconButton>
                    </Tooltip>
                </div>
            )
        });

        return dynamicCols;
    }, [data]);

    const handleEdit = (row: any) => {
        setIsModalOpen(true);
        setRowToEdit(row);
    };

    const handleDelete = (row: any) => {
        conductAction(row, 'DELETE');
    };

    const createNewAPI = () => {
        setIsModalOpen(true);
    };

    const conductAction = async (payload: any, action: string) => {
        showLoader();
        try {
            switch (action) {
                case 'CREATE': {
                    const resCreate = await NNPConfigService.createDomain(payload);
                    if (resCreate)
                        alertAction('success', 'Domain created successfully')();
                    Initialize();
                    break;
                }

                case 'UPDATE': {
                    const resUpdate = await NNPConfigService.updateDomain(payload);
                    if (resUpdate)
                        alertAction('success', 'Domain updated successfully')();
                    Initialize();
                    break;
                }
                case 'DELETE': {
                    showConfirmDialog({
                        title: 'Delete Domain',
                        message: 'Do you really want to delete the domain?',
                        confirmText: 'Yes',
                        cancelText: 'Cancel',
                        type: 'warning',
                        onConfirm: async () => {
                            const resDelete = await NNPConfigService.deleteDomain(payload);
                            if (resDelete)
                                alertAction('success', 'Domain deleted successfully')();
                            Initialize();
                        },
                        onCancel: () => {
                        },
                    });
                    break;
                }
            }
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
            hideLoader();
        }
    };

    const handleFormSubmit = (formData: any) => {
        if (formData.id) {
            conductAction(formData, 'UPDATE');
        } else {
            conductAction(formData, 'CREATE');
        }
        setIsModalOpen(false);
    };

    const Initialize = () => {
        showLoader();
        const fetchData = async () => {
            try {
                const result = await NNPConfigService.getDomain();
                if (result) {
                    setData(result);
                }
            } catch (err) {
                console.error(err);
                alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
            } finally {
                hideLoader();
            }
        };
        fetchData();
    };

    useEffect(() => {
        if (!isModalOpen) {
            setRowToEdit(null);
        }
    }, [isModalOpen]);

    useEffect(() => {
        Initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            {/* FIX: Ensure the text turns white in dark mode, and updated the border */}
            <div className="p-4 text-gray-500 dark:text-white font-medium text-lg border-b border-gray-200 dark:border-gray-700">
                Domains
            </div>
            
            {/* Grid */}
            {/* FIX: Made the grid wrapper transparent in dark mode so it matches the container */}
            <div className="flex-1 overflow-auto bg-transparent">
                {domainColumns.length > 0 ? (
                    <NNPGrid 
                        rows={data} 
                        columns={domainColumns} 
                        isColumselectionDisabled={true}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No Domains Found</div>
                )}
            </div>
            
            {/* Footer Buttons */}
            {/* FIX: Changed bg-gray-50 to dark mode equivalent, and updated border */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-transparent">
                {/* FIX: Updated the Add New button hover/bg colors for dark mode */}
                <button 
                    className="px-8 py-2 bg-gray-500 text-white font-medium rounded-sm shadow-sm hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={createNewAPI}
                >
                    Add New
                </button>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={rowToEdit ? "Edit Domain" : "Create API Registry"}
            >
                <DynamicForm 
                    inputs={APICreationFormCongif ?? []} 
                    layout="double" 
                    onSubmit={handleFormSubmit} 
                    defaultValues={rowToEdit || {}} 
                />
            </Modal>
        </div>
    );
};

export default DomainManagement;