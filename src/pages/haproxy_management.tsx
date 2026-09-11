import { HAProxyService } from "@/services/haproxy.service";
import { HAProxyForm } from "@/shared/config/input.cofig";
import { InputConfig } from "@/shared/types/inputconfig";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import Modal from "@/widgets/modal";
import { useEffect, useState, useMemo } from "react";
import { showConfirmDialog } from "@/widgets/confirmDialog";
import { useLoader } from "@/contexts/loader.context";
import { type GridColDef } from "@mui/x-data-grid";
import { Pencil, X, RefreshCw, Download, Play, Unplug, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

const HaproxyManagement = () => {
    const [data, setData] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rowToEdit, setRowToEdit] = useState<any | null>(null);
    const FormConfig: InputConfig = HAProxyForm;
    const { showLoader, hideLoader } = useLoader();

    const Initialize = () => {
        showLoader();
        const fetchData = async () => {
            try {
                const result = await HAProxyService.getAllConfigs();
                if (result) {
                    setData(result);
                }
            } catch (err: any) {
                console.error(err);
                alertAction("error", typeof err === "object" && err !== null && "message" in err ? err.message : String(err))();
            } finally {
                hideLoader();
            }
        };
        fetchData();
    };

    const conductAction = async (payload: any, action: string) => {
        showLoader();
        try {
            switch (action) {
                case "CREATE": {
                    const resCreate = await HAProxyService.addProxyConfig(payload);
                    if (resCreate) {
                        alertAction("success", "Proxy Config created successfully")();
                    }
                    Initialize();
                    break;
                }
                case "UPDATE": {
                    const resUpdate = await HAProxyService.updateProxyConfig(payload, payload.envConfigId);
                    if (resUpdate) {
                        alertAction("success", "Proxy Config updated successfully")();
                    }
                    Initialize();
                    break;
                }
                case "DELETE": {
                    showConfirmDialog({
                        title: "Delete Proxy Config",
                        message: "Do you really want to delete this Proxy Config record from database?",
                        confirmText: "Yes, Delete",
                        cancelText: "Cancel",
                        type: "warning",
                        onConfirm: async () => {
                            const resDelete = await HAProxyService.deleteProxyConfig(payload.envConfigId);
                            if (resDelete) {
                                alertAction("success", "Proxy Config deleted successfully")();
                            }
                            Initialize();
                        },
                        onCancel: () => {},
                    });
                    break;
                }
            }
        } catch (err: any) {
            alertAction("error", typeof err === "object" && err !== null && "message" in err ? err.message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const handleFormSubmit = (formData: any) => {
        const payload = {
            ...(rowToEdit || {}),
            ...formData,
            compServName: formData.compServName || rowToEdit?.compServName || rowToEdit?.compSrvName || "",
        };
        if (rowToEdit?.envConfigId) {
            conductAction(payload, "UPDATE");
        } else {
            conductAction(payload, "CREATE");
        }
        setIsModalOpen(false);
    };

    const handleEdit = (row: any) => {
        setIsModalOpen(true);
        setRowToEdit({
            ...row,
            compServName: row.compServName || row.compSrvName || "",
        });
    };

    const handleRegister = async (row: any) => {
        showLoader();
        try {
            await HAProxyService.registerConfig(row.envConfigId);
            alertAction("success", "HAProxy registration triggered for " + (row.compServName || row.compSrvName))();
            setTimeout(() => {
                Initialize();
            }, 1000);
        } catch (err: any) {
            alertAction("error", err?.message || "Failed to trigger registration")();
        } finally {
            hideLoader();
        }
    };

    const handleDeregister = (row: any) => {
        showConfirmDialog({
            title: "Deregister from HAProxy",
            message: "Do you want to remove " + (row.compServName || row.compSrvName) + " routing from HAProxy?",
            confirmText: "Deregister",
            cancelText: "Cancel",
            type: "warning",
            onConfirm: async () => {
                showLoader();
                try {
                    await HAProxyService.deregisterConfig(row.envConfigId);
                    alertAction("success", "Deregistration triggered for " + (row.compServName || row.compSrvName))();
                    setTimeout(() => {
                        Initialize();
                    }, 1000);
                } catch (err: any) {
                    alertAction("error", err?.message || "Failed to trigger deregistration")();
                } finally {
                    hideLoader();
                }
            },
            onCancel: () => {},
        });
    };

    const handleImport = () => {
        showConfirmDialog({
            title: "Import from HAProxy",
            message: "This will scan live HAProxy configuration and import all backends/routes not currently in the database. Continue?",
            confirmText: "Import Now",
            cancelText: "Cancel",
            type: "info",
            onConfirm: async () => {
                showLoader();
                try {
                    const result: any = await HAProxyService.importFromProxy("http_front");
                    alertAction("success", result?.message || "HAProxy import completed successfully")();
                    Initialize();
                } catch (err: any) {
                    alertAction("error", err?.message || "Import from HAProxy failed")();
                } finally {
                    hideLoader();
                }
            },
            onCancel: () => {},
        });
    };

    const handleDelete = (row: any) => {
        conductAction(row, "DELETE");
    };

    const createNew = () => {
        setRowToEdit(null);
        setIsModalOpen(true);
    };

    // ==========================================
    // DYNAMIC COLUMNS FROM SERVICE DATA
    // ==========================================
    const columns = useMemo<GridColDef[]>(() => {
        const defaultCols: GridColDef[] = [
            { 
                field: "envId", 
                headerName: "Environment", 
                flex: 0.8, 
                minWidth: 110, 
                valueGetter: (_value, row: any) => row?.envId || row?.namespace || "" 
            },
            { 
                field: "compServName", 
                headerName: "Component Service", 
                flex: 1.2, 
                minWidth: 160,
                valueGetter: (_value, row: any) => row?.compServName || row?.compSrvName || ""
            },
            { field: "domainName", headerName: "Domain Name", flex: 1.5, minWidth: 180 },
            { 
                field: "backendType", 
                headerName: "Backend Type", 
                flex: 1, 
                minWidth: 130,
                renderCell: (params) => (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {params.value || "K8S_DNS"}
                    </span>
                )
            },
            { field: "namespace", headerName: "Namespace", flex: 0.8, minWidth: 100 },
            { field: "internalPort", headerName: "Port", flex: 0.6, minWidth: 80 },
            { field: "parentFrontend", headerName: "Frontend", flex: 0.8, minWidth: 100 },
            { 
                field: "pathPrefix", 
                headerName: "Path Prefix", 
                flex: 0.8, 
                minWidth: 110,
                renderCell: (params) => params.value ? <span className="font-mono text-xs">{params.value}</span> : "-"
            },
            { 
                field: "serverAddress", 
                headerName: "Server Target", 
                flex: 1, 
                minWidth: 130,
                renderCell: (params) => {
                    if (!params.value) return "-";
                    const port = params.row?.serverPort ? (":" + params.row.serverPort) : "";
                    return <span className="font-mono text-xs">{params.value + port}</span>;
                }
            },
            { 
                field: "timeoutServer", 
                headerName: "Timeout", 
                flex: 0.7, 
                minWidth: 90,
                renderCell: (params) => params.value ? (params.value + "ms") : "-"
            },
            {
                field: "status",
                headerName: "HAProxy Status",
                flex: 1,
                minWidth: 140,
                renderCell: (params) => {
                    const status = params.value || "UNKNOWN";
                    if (status === "SYNCED") {
                        return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-800">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                Synced
                            </span>
                        );
                    } else if (status === "NOT_SYNCED") {
                        return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Not Synced
                            </span>
                        );
                    } else if (status === "FAILED") {
                        return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-800">
                                <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                Failed
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                            Unknown
                        </span>
                    );
                }
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 180,
                sortable: false,
                renderCell: (params) => (
                    <div className="flex items-center h-full space-x-1">
                        {/* Register / Sync action */}
                        <Tooltip title="Register / Sync in HAProxy">
                            <IconButton 
                                size="small" 
                                className="hover:text-green-600 dark:hover:text-green-400"
                                onClick={() => handleRegister(params.row)}
                            >
                                <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </IconButton>
                        </Tooltip>

                        {/* Deregister action */}
                        <Tooltip title="Deregister from HAProxy">
                            <IconButton 
                                size="small" 
                                className="hover:text-orange-600 dark:hover:text-orange-400"
                                onClick={() => handleDeregister(params.row)}
                            >
                                <Unplug className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                            </IconButton>
                        </Tooltip>

                        {/* Edit action */}
                        <Tooltip title="Edit Config">
                            <IconButton size="small" onClick={() => handleEdit(params.row)}>
                                <Pencil className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </IconButton>
                        </Tooltip>

                        {/* Delete action */}
                        <Tooltip title="Delete Config">
                            <IconButton size="small" onClick={() => handleDelete(params.row)}>
                                <X className="w-5 h-5 text-red-500 dark:text-red-400" />
                            </IconButton>
                        </Tooltip>
                    </div>
                )
            }
        ];

        return defaultCols;
    }, []);

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
            <div className="p-4 text-gray-700 dark:text-white font-medium text-lg border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span>HAProxy Configuration & Sync</span>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-normal">
                        {data.length} records
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        onClick={Initialize}
                        title="Refresh status from HAProxy"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh Status
                    </button>
                    <button
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors"
                        onClick={handleImport}
                        title="Import active backends from live HAProxy into DB"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Import from HAProxy
                    </button>
                    <button
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
                        onClick={createNew}
                    >
                        Add New
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-transparent">
                <NNPGrid
                    rows={data}
                    columns={columns}
                    isColumselectionDisabled={true}
                    getRowId={(row: any) => row.envConfigId || String(Math.random())}
                />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 bg-transparent">
                <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Actions:</span>
                    <span className="inline-flex items-center gap-1"><Play className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Register/Sync</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="inline-flex items-center gap-1"><Unplug className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" /> Deregister</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="inline-flex items-center gap-1"><Pencil className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Edit</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="inline-flex items-center gap-1"><X className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> Delete</span>
                </div>
                <span>Live status synced with HAProxy DataPlane API</span>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={rowToEdit ? "Edit Proxy Config" : "Create Proxy Config"}
            >
                <DynamicForm
                    key={rowToEdit?.envConfigId || "create-form"}
                    inputs={FormConfig ?? []}
                    layout="double"
                    onSubmit={handleFormSubmit}
                    defaultValues={rowToEdit ? {
                        envId: rowToEdit.envId || "",
                        compServName: rowToEdit.compServName || rowToEdit.compSrvName || "",
                        domainName: rowToEdit.domainName || "",
                        parentFrontend: rowToEdit.parentFrontend || "http_front",
                        backendType: rowToEdit.backendType || "K8S_DNS",
                        internalPort: rowToEdit.internalPort ?? "",
                        namespace: rowToEdit.namespace || "",
                        pathPrefix: rowToEdit.pathPrefix || "",
                        serverAddress: rowToEdit.serverAddress || "",
                        serverPort: rowToEdit.serverPort ?? "",
                        timeoutServer: rowToEdit.timeoutServer ?? "",
                        timeoutTunnel: rowToEdit.timeoutTunnel ?? "",
                        subpath: rowToEdit.subpath || "",
                        lineIndex: rowToEdit.lineIndex || "0",
                    } : {
                        parentFrontend: "http_front",
                        backendType: "K8S_DNS",
                        lineIndex: "0",
                    }}
                />
            </Modal>
        </div>
    );
};

export default HaproxyManagement;
