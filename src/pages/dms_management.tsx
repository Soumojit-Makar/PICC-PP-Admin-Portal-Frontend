// src/pages/dms_management.tsx
import React, { useEffect, useState } from "react";
import { useLoader } from "../contexts/loader.context";
import { DmsService } from "@/services/dms.service";
import { EnvironmentService } from "@/services/environment.service";
import {
  DeploymentItem,
  DeploymentContainer,
  DeploymentAction,
  VmStatusResponse,
  ComponentStatusResponse,
} from "@/shared/types/dms";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import Modal from "@/widgets/modal";
import {
  Server,
  Terminal,
  RotateCw,
  Layers,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  // Eye,
  // Cpu,
  // Key,
  // TerminalSquare,
  SquareTerminal,
  Info,
  RefreshCw,
  KeyRound,
} from "lucide-react";

const DmsManagement: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"deployments" | "components" | "vmStatus" | "actions">("deployments");

  // Data States
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filterComponent, setFilterComponent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEnvId, setFilterEnvId] = useState("");
  const [envOptions, setEnvOptions] = useState<{label: string, value: string}[]>([]);

  // Stats
  const [stats, setStats] = useState({ total: 0, running: 0, completed: 0, failed: 0 });

  // Selected Deployment & Details
  const [selectedDep, setSelectedDep] = useState<DeploymentItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [depContainers, setDepContainers] = useState<DeploymentContainer[]>([]);
  const [depActions, setDepActions] = useState<DeploymentAction[]>([]);
  const [detailsTab, setDetailsTab] = useState<"summary" | "containers" | "actions">("summary");

  // Create DMS Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    envId: "",
    host: "",
    port: 22,
    username: "",
    privateKey: "",
    passphrase: "",
    filePath: "",
    password: "",
  });
  const [keyInputType, setKeyInputType] = useState<"text" | "file">("text");

  // VM Status Check State
  const [vmCheckForm, setVmCheckForm] = useState({
    host: "",
    port: 22,
    username: "",
    privateKey: "",
    passphrase: "",
  });
  const [vmCheckResult, setVmCheckResult] = useState<VmStatusResponse | null>(null);
  const [vmCheckKeyInputType, setVmCheckKeyInputType] = useState<"text" | "file">("text");

  // SSH Key Modal State
  const [isSshKeyModalOpen, setIsSshKeyModalOpen] = useState(false);
  const [sshKeyForm, setSshKeyForm] = useState({
    deploymentId: "",
    privateKey: "",
    passphrase: "",
  });

  // Exec Command Modal State
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [execForm, setExecForm] = useState({
    deploymentId: "",
    containerName: "",
    command: "",
    privateKey: "",
    passphrase: "",
  });
  const [execOutput, setExecOutput] = useState<{ success: boolean; message: string; remoteOutput?: string; exitCode: number } | null>(null);

  // Restart Container Modal State
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [restartForm, setRestartForm] = useState({
    deploymentId: "",
    containerName: "",
    privateKey: "",
    passphrase: "",
  });

  // Frontend Container Pagination & Search States
  const [containerSearch, setContainerSearch] = useState("");
  const [containerPage, setContainerPage] = useState(0);
  const [containerPageSize, setContainerPageSize] = useState(10);

  const [modalContainerSearch, setModalContainerSearch] = useState("");
  const [modalContainerPage, setModalContainerPage] = useState(0);
  const [modalContainerPageSize, setModalContainerPageSize] = useState(10);

  const [actionSearch, setActionSearch] = useState("");
  const [actionPage, setActionPage] = useState(0);
  const [actionPageSize, setActionPageSize] = useState(5);

  // ---------------------------------------------------------------------------
  // SSH Key Expiry Helper
  // ---------------------------------------------------------------------------
  const isKeyExpiredError = (msg: string): boolean =>
    (msg || "").toLowerCase().includes("ssh key expired") ||
    (msg || "").toLowerCase().includes("re-enter the key");

  const openSshKeyModalForDep = (depId: string) => {
    setSshKeyForm({ deploymentId: depId, privateKey: "", passphrase: "" });
    setIsSshKeyModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Web Terminal (Redirects to backend terminal.html)
  // ---------------------------------------------------------------------------
  const openWebTerminal = (dep: DeploymentItem) => {
    const baseApiUrl = (import.meta.env.VITE_API_DMS_MANAGEMENT_URL as string) || "/dms-management-service/api/dms";
    const cleanBase = baseApiUrl.replace(/\/$/, "");
    const terminalUrl = `${cleanBase}/terminal.html?deploymentId=${dep.id}`;
    window.open(terminalUrl, "_blank");
  };

  // ---------------------------------------------------------------------------
  // Load Deployments List
  // ---------------------------------------------------------------------------
  const fetchDeployments = async () => {
    showLoader();
    try {
      const res = await DmsService.listDeployments(page, pageSize, filterComponent, filterStatus, filterEnvId);
      if (res) {
        let list = res.content || [];
        
        // Frontend filtering for Env ID (since backend does not support this param yet)
        if (filterEnvId) {
          list = list.filter((d: any) => d.envId === filterEnvId);
        }

        setDeployments(list);
        setTotalPages(res.totalPages || 1);

        // Compute summary statistics
        const total = list.length;
        const running = list.filter((d) => d.status === "RUNNING" || d.status === "IN_PROGRESS").length;
        const completed = list.filter((d) => d.status === "COMPLETED" || d.status === "SUCCESS").length;
        const failed = list.filter((d) => d.status === "FAILED" || d.status === "ERROR").length;
        setStats({ total, running, completed, failed });
      }
    } catch (error) {
      console.error("Error fetching deployments:", error);
      alertAction("error", "Failed to fetch deployment records.")();
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    const fetchEnvs = async () => {
      try {
        const res = await EnvironmentService.getEnvironmentFeatures();
        if (res && Array.isArray(res)) {
          const options = res.map((e: any) => ({ label: e.envId, value: e.envId }));
          setEnvOptions(options);
        }
      } catch (error) {
        console.error("Failed to fetch environments for filter:", error);
      }
    };
    fetchEnvs();
  }, []);

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterEnvId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchDeployments();
  };

  // ---------------------------------------------------------------------------
  // Create DMS Submit
  // ---------------------------------------------------------------------------
  const handleCreateDmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.envId || !createForm.host || !createForm.username || !createForm.privateKey || !createForm.filePath) {
      alertAction("error", "Please fill in all mandatory fields.")();
      return;
    }

    showLoader();
    try {
      const res = await DmsService.createDms(createForm);
      if (res && res.id) {
        alertAction("success", `VM deployment initiated! ID: ${res.id}`)();
        setIsCreateModalOpen(false);
        setCreateForm({
          envId: "",
          host: "",
          port: 22,
          username: "",
          privateKey: "",
          passphrase: "",
          filePath: "",
          password: "",
        });
        fetchDeployments();
      }
    } catch (error: any) {
      console.error("Error submitting deployment:", error);
      alertAction("error", error?.message || "Failed to create deployment.")();
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // VM Status Check Submit
  // ---------------------------------------------------------------------------
  const handleVmCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmCheckForm.host || !vmCheckForm.username || !vmCheckForm.privateKey) {
      alertAction("error", "Host, Username, and SSH Key are required.")();
      return;
    }

    showLoader();
    try {
      const res = await DmsService.checkStatus(vmCheckForm);
      setVmCheckResult(res);
      alertAction("success", `VM Status check completed: Overall ${res.overall || "UNKNOWN"}`)();
    } catch (error: any) {
      console.error("Error checking VM status:", error);
      alertAction("error", error?.message || "Failed to check VM status.")();
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // View Deployment Details
  // ---------------------------------------------------------------------------
  const openDeploymentDetails = async (dep: DeploymentItem) => {
    setSelectedDep(dep);
    setIsDetailsModalOpen(true);
    setDetailsTab("summary");
    setActionPage(0);
    setActionSearch("");
    showLoader();
    try {
      const [fullDep, containers, actions] = await Promise.allSettled([
        DmsService.getDeployment(dep.id),
        DmsService.listContainers(dep.id),
        DmsService.listActions(dep.id),
      ]);

      if (fullDep.status === "fulfilled" && fullDep.value) {
        setSelectedDep(fullDep.value);
      }
      if (containers.status === "fulfilled" && containers.value) {
        setDepContainers(containers.value);
      } else {
        setDepContainers([]);
      }
      if (actions.status === "fulfilled" && actions.value) {
        setDepActions(actions.value);
      } else {
        setDepActions([]);
      }
    } catch (error) {
      console.error("Error loading deployment details:", error);
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh Containers for Deployment
  // ---------------------------------------------------------------------------
  const handleRefreshContainers = async (depId: string) => {
    showLoader();
    try {
      const res = await DmsService.refreshContainers(depId);
      setDepContainers(res || []);
      alertAction("success", `Refreshed ${res?.length || 0} container(s).`)();
    } catch (error: any) {
      console.error("Error refreshing containers:", error);
      const msg: string = error?.message || "Failed to refresh containers.";
      if (isKeyExpiredError(msg)) {
        alertAction("error", "SSH key expired. Please re-enter the SSH key for this deployment.")();
        openSshKeyModalForDep(depId);
      } else {
        alertAction("error", msg)();
      }
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // Restart Container Submit
  // ---------------------------------------------------------------------------
  const handleRestartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restartForm.deploymentId || !restartForm.containerName) return;

    showLoader();
    try {
      const res = await DmsService.restartContainer(restartForm.deploymentId, {
        containerName: restartForm.containerName,
        privateKey: restartForm.privateKey || undefined,
        passphrase: restartForm.passphrase || undefined,
      });

      if (res.success) {
        alertAction("success", res.message || `Container ${restartForm.containerName} restarted successfully.`)();
        setIsRestartModalOpen(false);
        if (selectedDep) openDeploymentDetails(selectedDep);
      } else {
        const msg = res.message || "Failed to restart container.";
        if (isKeyExpiredError(msg)) {
          setIsRestartModalOpen(false);
          alertAction("error", "SSH key expired. Please re-enter the SSH key, then retry.")();
          openSshKeyModalForDep(restartForm.deploymentId);
        } else {
          alertAction("error", msg)();
        }
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to restart container.";
      if (isKeyExpiredError(msg)) {
        setIsRestartModalOpen(false);
        alertAction("error", "SSH key expired. Please re-enter the SSH key, then retry.")();
        openSshKeyModalForDep(restartForm.deploymentId);
      } else {
        alertAction("error", msg)();
      }
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // Exec Command Submit
  // ---------------------------------------------------------------------------
  const handleExecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!execForm.deploymentId || !execForm.command) return;

    showLoader();
    setExecOutput(null);
    try {
      const res = await DmsService.execCommand(execForm.deploymentId, {
        command: execForm.command,
        privateKey: execForm.privateKey || undefined,
        passphrase: execForm.passphrase || undefined,
      });
      setExecOutput(res);
      if (res.success) {
        alertAction("success", "Command executed successfully.")();
      } else {
        const msg = res.message || "Command execution returned error.";
        if (isKeyExpiredError(msg)) {
          setIsExecModalOpen(false);
          alertAction("error", "SSH key expired. Please re-enter the SSH key, then retry.")();
          openSshKeyModalForDep(execForm.deploymentId);
        } else {
          alertAction("error", msg)();
        }
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to execute command.";
      if (isKeyExpiredError(msg)) {
        setIsExecModalOpen(false);
        alertAction("error", "SSH key expired. Please re-enter the SSH key, then retry.")();
        openSshKeyModalForDep(execForm.deploymentId);
      } else {
        alertAction("error", msg)();
      }
    } finally {
      hideLoader();
    }
  };

  // ---------------------------------------------------------------------------
  // Store SSH Key Submit
  // ---------------------------------------------------------------------------
  const handleSshKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sshKeyForm.deploymentId || !sshKeyForm.privateKey) return;

    showLoader();
    try {
      const res = await DmsService.storeSshKey(sshKeyForm.deploymentId, {
        privateKey: sshKeyForm.privateKey,
        passphrase: sshKeyForm.passphrase || undefined,
      });
      if (res.success) {
        alertAction("success", "SSH key stored successfully.")();
        setIsSshKeyModalOpen(false);
      } else {
        alertAction("error", res.message || "Failed to store SSH key.")();
      }
    } catch (error: any) {
      alertAction("error", error?.message || "Failed to store SSH key.")();
    } finally {
      hideLoader();
    }
  };

  // Helper for SSH key file upload
  const handleFileRead = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (content: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setter(content);
    };
    reader.readAsText(file);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    let colorClass = " text-gray-800  dark:text-gray-300 ";
    if (s.includes("RUNNING") || s.includes("HEALTHY") || s.includes("UP")) {
      colorClass = " text-emerald-800   dark:text-emerald-300 ";
    } else if (s.includes("COMPLETED") || s.includes("SUCCESS")) {
      colorClass = " text-blue-800   dark:text-blue-300 ";
    } else if (s.includes("FAILED") || s.includes("ERROR") || s.includes("DOWN")) {
      colorClass = " text-red-800   dark:text-red-300 ";
    } else if (s.includes("PENDING") || s.includes("IN_PROGRESS")) {
      colorClass = " text-amber-800   dark:text-amber-300 ";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium  ${colorClass}`}>
        {/* <span className="w-1.5 h-1.5 rounded-full bg-current" /> */}
        {status || "UNKNOWN"}
      </span>
    );
  };

  // Deployments Grid Columns Definition
  const deploymentColumns = [
    {
      field: "id",
      headerName: "Deployment ID",
      flex: 1.2,
      renderCell: (params: any) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          {params.row?.id}
        </span>
      ),
    },
    { field: "envId", headerName: "Env ID", flex: 0.8 },
    {
      field: "component",
      headerName: "Component",
      flex: 1,
      renderCell: (params: any) => {
        const val = params.row?.component || params.row?.appName || params.row?.envCompName || "VM Management";
        return (
          <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase">
            {val}
          </span>
        );
      },
    },
    { field: "host", headerName: "Host IP / Domain", flex: 1.1 },
    { field: "username", headerName: "Username", flex: 0.8 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params: any) => renderStatusBadge(params.row?.status),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1.2,
      renderCell: (params: any) => {
        const val = params.row?.createdAt || params.row?.created_at || params.row?.startedAt;
        if (!val) return <span className="text-gray-400">N/A</span>;
        if (Array.isArray(val)) {
          const [y, m, d, hh = 0, mm = 0] = val;
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        }
        try {
          const dt = new Date(val);
          if (isNaN(dt.getTime())) return String(val);
          return dt.toLocaleString();
        } catch {
          return String(val);
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 2,
      minWidth: 260,
      sortable: false,
      renderCell: (params: any) => {
        const row = params.row;
        return (
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => openDeploymentDetails(row)}
              className="px-2.5 py-1 rounded  flex items-center gap-1 "
              title="View Details & Containers"
            >
              <Info size={24} color="blue" />
            </button>
            <button
              onClick={() => openWebTerminal(row)}
              className="px-2.5 py-1  rounded flex items-center gap-1 "
              title="Open Interactive Web Terminal"
            >
              <SquareTerminal color="green" size={24} />
            </button>
            <button
              onClick={() => {
                setRestartForm({ deploymentId: row.id, containerName: "", privateKey: "", passphrase: "" });
                setIsRestartModalOpen(true);
              }}
              className="px-2.5 py-1  rounded text-xs flex items-center gap-1 "
              title="Restart Container"
            >
              <RefreshCw color="yellow" size={24} />
            </button>
            <button
              onClick={() => {
                setSshKeyForm({ deploymentId: row.id, privateKey: "", passphrase: "" });
                setIsSshKeyModalOpen(true);
              }}
              className="px-2.5 py-1   rounded text-xs flex items-center gap-1  "
              title="Store SSH Key"
            >
              <KeyRound size={24} color="purple" />
            </button>
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Computed Containers Filtering & Pagination
  // ---------------------------------------------------------------------------
  const filteredTabContainers = depContainers.filter((c) => {
    if (!containerSearch.trim()) return true;
    const q = containerSearch.toLowerCase();
    return (
      (c.containerName || "").toLowerCase().includes(q) ||
      (c.appName || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });
  const totalTabContainerPages = Math.ceil(filteredTabContainers.length / containerPageSize) || 1;
  const paginatedTabContainers = filteredTabContainers.slice(
    containerPage * containerPageSize,
    (containerPage + 1) * containerPageSize
  );

  const filteredModalContainers = depContainers.filter((c) => {
    if (!modalContainerSearch.trim()) return true;
    const q = modalContainerSearch.toLowerCase();
    return (
      (c.containerName || "").toLowerCase().includes(q) ||
      (c.appName || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });
  const totalModalContainerPages = Math.ceil(filteredModalContainers.length / modalContainerPageSize) || 1;
  const paginatedModalContainers = filteredModalContainers.slice(
    modalContainerPage * modalContainerPageSize,
    (modalContainerPage + 1) * modalContainerPageSize
  );

  const filteredActions = depActions.filter((act) => {
    if (!actionSearch.trim()) return true;
    const q = actionSearch.toLowerCase();
    return (
      (act.actionType || "").toLowerCase().includes(q) ||
      (act.command || "").toLowerCase().includes(q)
    );
  });
  const totalActionPages = Math.ceil(filteredActions.length / actionPageSize) || 1;
  const paginatedActions = filteredActions.slice(
    actionPage * actionPageSize,
    (actionPage + 1) * actionPageSize
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-200 p-6 gap-6">

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="text-blue-600 dark:text-blue-400" />
            VM Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deployment Management System — Remote VM deployment, container monitoring, and SSH operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("vmStatus")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded shadow transition-colors flex items-center gap-2"
          >
            <Activity size={16} /> Check VM Status
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Create VM Deployment
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Deployments</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-full text-blue-600 dark:text-blue-400">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Running / In-Progress</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.running}</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-full text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Completed</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-full text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Failed</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.failed}</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-full text-red-600 dark:text-red-400">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] px-4 rounded-t-lg">
        <button
          onClick={() => setActiveTab("deployments")}
          className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "deployments"
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
        >
          <Layers size={16} /> Deployments Overview
        </button>

        {/* <button
          onClick={() => setActiveTab("components")}
          className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "components"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
        >
          <Cpu size={16} /> Components
        </button> */}

        <button
          onClick={() => setActiveTab("vmStatus")}
          className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "vmStatus"
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
        >
          <Activity size={16} /> VM Status Check
        </button>
      </div>

      {/* TAB 1: DEPLOYMENTS OVERVIEW */}
      {activeTab === "deployments" && (
        <div className="flex flex-col gap-4 bg-white dark:bg-[#1e1e1e] p-5 rounded-b-lg border dark:border-gray-800 shadow-sm">
          {/* Filters & Search */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterEnvId}
                onChange={(e) => setFilterEnvId(e.target.value)}
                className="py-2 px-3 text-sm border rounded-md dark:border-gray-700 bg-white dark:bg-[#181818] focus:ring-2 focus:ring-blue-500 w-[140px]"
              >
                <option value="">All Env IDs</option>
                {envOptions.map((env) => (
                  <option key={env.value} value={env.value}>{env.label}</option>
                ))}
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by Component..."
                  value={filterComponent}
                  onChange={(e) => setFilterComponent(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border rounded-md dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 w-[170px]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-2 px-3 text-sm border rounded-md dark:border-gray-700 bg-white dark:bg-[#181818] focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="RUNNING">RUNNING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </select>

              <button
                type="submit"
                className="px-3 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-semibold rounded transition-colors"
              >
                Filter
              </button>
            </div>

            <button
              type="button"
              onClick={fetchDeployments}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <RotateCw size={14} /> Refresh List
            </button>
          </form>

          {/* Grid */}
          <div className="h-[520px] w-full border dark:border-gray-800 rounded">
            <NNPGrid
              rows={deployments}
              columns={deploymentColumns}
              isColumselectionDisabled={true}
              getRowId={(row: DeploymentItem) => row.id}
              rowHeight={48}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
            <div>
              Showing Page <span className="font-semibold text-gray-900 dark:text-white">{page + 1}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPONENTS TAB */}
      {activeTab === "components" && (
        <div className="flex flex-col gap-4 bg-white dark:bg-[#1e1e1e] p-5 rounded-b-lg border dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Deployment Components & Containers</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                View active container statuses and component health across environments. Note: Pod deletion feature is disabled.
              </p>
            </div>
            {selectedDep && (
              <button
                onClick={() => handleRefreshContainers(selectedDep.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCw size={14} /> Refresh Containers ({selectedDep.id})
              </button>
            )}
          </div>

          {!selectedDep ? (
            <div className="p-8 text-center border dark:border-gray-800 rounded bg-gray-50 dark:bg-[#171717] text-gray-500 dark:text-gray-400">
              Please select a deployment from the <strong>Deployments Overview</strong> tab to inspect its component list and containers.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Active Deployment Context Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Selected Deployment</span>
                  <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">{selectedDep.id} (Env: {selectedDep.envId})</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Host: {selectedDep.host}:{selectedDep.port} | User: {selectedDep.username}</div>
                </div>
                <div>{renderStatusBadge(selectedDep.status)}</div>
              </div>

              {/* Components List Table */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Component Health Statuses</h3>
                {selectedDep.components && selectedDep.components.length > 0 ? (
                  <div className="overflow-x-auto border dark:border-gray-800 rounded">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Label</th>
                          <th className="p-3">Container Name</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Detail</th>
                          <th className="p-3">Checked At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-800">
                        {selectedDep.components.map((comp: ComponentStatusResponse, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                            <td className="p-3 font-semibold">{comp.label || "N/A"}</td>
                            <td className="p-3 font-mono">{comp.container || "N/A"}</td>
                            <td className="p-3">{renderStatusBadge(comp.status || "UNKNOWN")}</td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">{comp.detail || "N/A"}</td>
                            <td className="p-3">{comp.checkedAt ? new Date(comp.checkedAt).toLocaleString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-gray-500 italic bg-gray-50 dark:bg-[#1a1a1a] border dark:border-gray-800 rounded">
                    No component status breakdown available for this deployment.
                  </div>
                )}
              </div>

              {/* Containers List Table */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Docker Containers ({filteredTabContainers.length})
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search containers..."
                        value={containerSearch}
                        onChange={(e) => {
                          setContainerSearch(e.target.value);
                          setContainerPage(0);
                        }}
                        className="pl-8 pr-3 py-1 text-xs border rounded-md dark:border-gray-700 bg-transparent focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>Per page:</span>
                      <select
                        value={containerPageSize}
                        onChange={(e) => {
                          setContainerPageSize(Number(e.target.value));
                          setContainerPage(0);
                        }}
                        className="py-1 px-2 text-xs border rounded dark:border-gray-700 bg-white dark:bg-[#181818]"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </div>

                {depContainers.length > 0 ? (
                  <>
                    <div className="overflow-x-auto border dark:border-gray-800 rounded">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 uppercase font-semibold">
                          <tr>
                            <th className="p-3">Container Name</th>
                            <th className="p-3">Image / App</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Checked At</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-800">
                          {paginatedTabContainers.length > 0 ? (
                            paginatedTabContainers.map((container: DeploymentContainer) => (
                              <tr key={container.id || container.containerName} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                                <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{container.containerName}</td>
                                <td className="p-3">{container.appName || "N/A"}</td>
                                <td className="p-3">{renderStatusBadge(container.status || "UNKNOWN")}</td>
                                <td className="p-3">{container.checkedAt ? new Date(container.checkedAt).toLocaleString() : "N/A"}</td>
                                <td className="p-3 flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setRestartForm({
                                        deploymentId: selectedDep.id,
                                        containerName: container.containerName,
                                        privateKey: "",
                                        passphrase: "",
                                      });
                                      setIsRestartModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs flex items-center gap-1"
                                  >
                                    <RotateCw size={12} /> Restart
                                  </button>
                                  <button
                                    onClick={() => {
                                      setExecForm({
                                        deploymentId: selectedDep.id,
                                        containerName: container.containerName,
                                        command: `sudo docker exec ${container.containerName} ps aux`,
                                        privateKey: "",
                                        passphrase: "",
                                      });
                                      setExecOutput(null);
                                      setIsExecModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1"
                                  >
                                    <Terminal size={12} /> Exec
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                                No containers match search query "{containerSearch}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center px-2 py-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <div>
                        Showing {filteredTabContainers.length === 0 ? 0 : containerPage * containerPageSize + 1} to {Math.min((containerPage + 1) * containerPageSize, filteredTabContainers.length)} of {filteredTabContainers.length} containers
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={containerPage === 0}
                          onClick={() => setContainerPage((prev) => Math.max(0, prev - 1))}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Previous
                        </button>
                        <span className="font-semibold text-gray-900 dark:text-white px-1">
                          {containerPage + 1} / {totalTabContainerPages}
                        </span>
                        <button
                          type="button"
                          disabled={containerPage >= totalTabContainerPages - 1}
                          onClick={() => setContainerPage((prev) => prev + 1)}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-xs text-gray-500 italic bg-gray-50 dark:bg-[#1a1a1a] border dark:border-gray-800 rounded">
                    No container records cached. Click "Refresh Containers" above to query remote VM.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VM STATUS CHECK */}
      {activeTab === "vmStatus" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-[#1e1e1e] p-6 rounded-b-lg border dark:border-gray-800 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Check VM SSH Health Status</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Provide host, credentials, and SSH key to perform an instant diagnostic on remote VM components.
            </p>
          </div>

          <form onSubmit={handleVmCheckSubmit} className="flex flex-col gap-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Host IP / Domain *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.100"
                  value={vmCheckForm.host}
                  onChange={(e) => setVmCheckForm({ ...vmCheckForm, host: e.target.value })}
                  className="w-full p-2 text-sm border rounded bg-transparent dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">SSH Port *</label>
                <input
                  type="number"
                  required
                  value={vmCheckForm.port}
                  onChange={(e) => setVmCheckForm({ ...vmCheckForm, port: parseInt(e.target.value) || 22 })}
                  className="w-full p-2 text-sm border rounded bg-transparent dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. root or ubuntu"
                  value={vmCheckForm.username}
                  onChange={(e) => setVmCheckForm({ ...vmCheckForm, username: e.target.value })}
                  className="w-full p-2 text-sm border rounded bg-transparent dark:border-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">SSH Private Key *</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="vmKeyType"
                    checked={vmCheckKeyInputType === "text"}
                    onChange={() => setVmCheckKeyInputType("text")}
                    className="accent-blue-600"
                  />
                  Paste Text
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="vmKeyType"
                    checked={vmCheckKeyInputType === "file"}
                    onChange={() => setVmCheckKeyInputType("file")}
                    className="accent-blue-600"
                  />
                  Upload Key File
                </label>
              </div>

              {vmCheckKeyInputType === "file" && (
                <input
                  type="file"
                  accept=".pem,.key,.ppk,.txt"
                  onChange={(e) => handleFileRead(e, (val) => setVmCheckForm({ ...vmCheckForm, privateKey: val }))}
                  className="mb-2 block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 dark:file:bg-gray-800 dark:file:text-gray-300"
                />
              )}

              <textarea
                required
                rows={4}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                value={vmCheckForm.privateKey}
                onChange={(e) => setVmCheckForm({ ...vmCheckForm, privateKey: e.target.value })}
                className={`w-full p-2 text-xs font-mono border rounded bg-transparent dark:border-gray-700 ${vmCheckKeyInputType === "file" ? "hidden" : "block"
                  }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Passphrase (Optional)</label>
              <input
                type="password"
                placeholder="Enter passphrase if key is encrypted"
                value={vmCheckForm.passphrase}
                onChange={(e) => setVmCheckForm({ ...vmCheckForm, passphrase: e.target.value })}
                className="w-full p-2 text-sm border rounded bg-transparent dark:border-gray-700"
              />
            </div>

            <div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded shadow transition-colors flex items-center gap-2"
              >
                <Activity size={16} /> Run Diagnostic Check
              </button>
            </div>
          </form>

          {/* Diagnostic Result */}
          {vmCheckResult && (
            <div className="mt-4 p-4 border dark:border-gray-800 rounded bg-gray-50 dark:bg-[#181818] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  VM Health Result for {vmCheckResult.host}
                </h3>
                {renderStatusBadge(vmCheckResult.overall)}
              </div>

              {vmCheckResult.components && vmCheckResult.components.length > 0 && (
                <div className="overflow-x-auto border dark:border-gray-800 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-[#222] uppercase font-semibold">
                      <tr>
                        <th className="p-3">Label</th>
                        <th className="p-3">Container</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                      {vmCheckResult.components.map((c, i) => (
                        <tr key={i}>
                          <td className="p-3 font-semibold">{c.label}</td>
                          <td className="p-3 font-mono">{c.container}</td>
                          <td className="p-3">{renderStatusBadge(c.status)}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{c.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE VM MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New VM Deployment">
        <form onSubmit={handleCreateDmsSubmit} className="flex flex-col gap-4 p-2 text-sm text-gray-700 dark:text-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Environment ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. ENV_DEV_01"
                value={createForm.envId}
                onChange={(e) => setCreateForm({ ...createForm, envId: e.target.value })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Host IP / Domain *</label>
              <input
                type="text"
                required
                placeholder="e.g. 10.0.0.15"
                value={createForm.host}
                onChange={(e) => setCreateForm({ ...createForm, host: e.target.value })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Port *</label>
              <input
                type="number"
                required
                value={createForm.port}
                onChange={(e) => setCreateForm({ ...createForm, port: parseInt(e.target.value) || 22 })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. root"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">SSH Private Key *</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="createKeyType"
                  checked={keyInputType === "text"}
                  onChange={() => setKeyInputType("text")}
                  className="accent-blue-600"
                />
                Paste Text
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="createKeyType"
                  checked={keyInputType === "file"}
                  onChange={() => setKeyInputType("file")}
                  className="accent-blue-600"
                />
                Upload Key File
              </label>
            </div>

            {keyInputType === "file" && (
              <input
                type="file"
                accept=".pem,.key,.ppk,.txt"
                onChange={(e) => handleFileRead(e, (val) => setCreateForm({ ...createForm, privateKey: val }))}
                className="mb-2 block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 dark:file:bg-gray-800 dark:file:text-gray-300"
              />
            )}

            <textarea
              required
              rows={4}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
              value={createForm.privateKey}
              onChange={(e) => setCreateForm({ ...createForm, privateKey: e.target.value })}
              className={`w-full p-2 text-xs font-mono border rounded bg-transparent dark:border-gray-700 ${keyInputType === "file" ? "hidden" : "block"
                }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Passphrase (Optional)</label>
              <input
                type="password"
                placeholder="Key Passphrase"
                value={createForm.passphrase}
                onChange={(e) => setCreateForm({ ...createForm, passphrase: e.target.value })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Sudo / System Password *</label>
              <input
                type="password"
                required
                placeholder="Remote Password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Deployment File Path *</label>
            <input
              type="text"
              required
              placeholder="e.g. /opt/dms/deploy.sh"
              value={createForm.filePath}
              onChange={(e) => setCreateForm({ ...createForm, filePath: e.target.value })}
              className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border rounded text-xs font-medium dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors"
            >
              Submit Deployment Task
            </button>
          </div>
        </form>
      </Modal>

      {/* DEPLOYMENT DETAILS MODAL */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Deployment Details: ${selectedDep?.id || ""}`}>
        {selectedDep && (
          <div className="flex flex-col gap-4 p-2 text-xs text-gray-700 dark:text-gray-200">
            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
              <button
                onClick={() => setDetailsTab("summary")}
                className={`py-2 px-3 font-semibold border-b-2 ${detailsTab === "summary" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                  }`}
              >
                Summary
              </button>
              <button
                onClick={() => setDetailsTab("containers")}
                className={`py-2 px-3 font-semibold border-b-2 ${detailsTab === "containers" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                  }`}
              >
                Containers ({depContainers.length})
              </button>

              <button
                onClick={() => setDetailsTab("actions")}
                className={`py-2 px-3 font-semibold border-b-2 ${detailsTab === "actions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                  }`}
              >
                Action Timeline ({depActions.length})
              </button>
            </div>

            {/* TAB: SUMMARY */}
            {detailsTab === "summary" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-[#181818] rounded border dark:border-gray-800">
                  <div className="text-gray-500 font-semibold uppercase text-[10px]">Status</div>
                  <div className="mt-1">{renderStatusBadge(selectedDep.status)}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#181818] rounded border dark:border-gray-800">
                  <div className="text-gray-500 font-semibold uppercase text-[10px]">Env ID</div>
                  <div className="font-semibold text-sm mt-0.5">{selectedDep.envId || "N/A"}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#181818] rounded border dark:border-gray-800">
                  <div className="text-gray-500 font-semibold uppercase text-[10px]">Host & Port</div>
                  <div className="font-mono text-sm mt-0.5">{selectedDep.host}:{selectedDep.port}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#181818] rounded border dark:border-gray-800">
                  <div className="text-gray-500 font-semibold uppercase text-[10px]">Username</div>
                  <div className="font-mono text-sm mt-0.5">{selectedDep.username}</div>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 dark:bg-[#181818] rounded border dark:border-gray-800">
                  <div className="text-gray-500 font-semibold uppercase text-[10px]">File Path</div>
                  <div className="font-mono text-xs mt-0.5 text-blue-600 dark:text-blue-400">{selectedDep.filePath || "N/A"}</div>
                </div>
              </div>
            )}

            {/* TAB: CONTAINERS */}
            {detailsTab === "containers" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter containers..."
                        value={modalContainerSearch}
                        onChange={(e) => {
                          setModalContainerSearch(e.target.value);
                          setModalContainerPage(0);
                        }}
                        className="pl-8 pr-2 py-1 text-xs border rounded dark:border-gray-700 bg-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Per page:</span>
                      <select
                        value={modalContainerPageSize}
                        onChange={(e) => {
                          setModalContainerPageSize(Number(e.target.value));
                          setModalContainerPage(0);
                        }}
                        className="py-0.5 px-1.5 text-xs border rounded dark:border-gray-700 bg-white dark:bg-[#181818]"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRefreshContainers(selectedDep.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <RotateCw size={12} /> Refresh Containers
                  </button>
                </div>

                {depContainers.length > 0 ? (
                  <>
                    <div className="overflow-x-auto border dark:border-gray-800 rounded max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 dark:bg-[#222] uppercase sticky top-0">
                          <tr>
                            <th className="p-2">Container</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-800">
                          {paginatedModalContainers.length > 0 ? (
                            paginatedModalContainers.map((c) => (
                              <tr key={c.id || c.containerName} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                                <td className="p-2 font-mono font-semibold">{c.containerName}</td>
                                <td className="p-2">{renderStatusBadge(c.status || "UNKNOWN")}</td>
                                <td className="p-2">
                                  <button
                                    onClick={() => {
                                      setRestartForm({ deploymentId: selectedDep.id, containerName: c.containerName, privateKey: "", passphrase: "" });
                                      setIsRestartModalOpen(true);
                                    }}
                                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs"
                                  >
                                    Restart
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-3 text-center text-gray-500 italic">
                                No containers match search query "{modalContainerSearch}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center px-1 py-1 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        Showing {filteredModalContainers.length === 0 ? 0 : modalContainerPage * modalContainerPageSize + 1} to {Math.min((modalContainerPage + 1) * modalContainerPageSize, filteredModalContainers.length)} of {filteredModalContainers.length}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={modalContainerPage === 0}
                          onClick={() => setModalContainerPage((prev) => Math.max(0, prev - 1))}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Prev
                        </button>
                        <span className="font-semibold px-1">
                          {modalContainerPage + 1} / {totalModalContainerPages}
                        </span>
                        <button
                          type="button"
                          disabled={modalContainerPage >= totalModalContainerPages - 1}
                          onClick={() => setModalContainerPage((prev) => prev + 1)}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500 italic">No container records found.</div>
                )}
              </div>
            )}



            {/* TAB: ACTIONS */}
            {detailsTab === "actions" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter action timeline..."
                      value={actionSearch}
                      onChange={(e) => {
                        setActionSearch(e.target.value);
                        setActionPage(0);
                      }}
                      className="w-full pl-8 pr-2 py-1 text-xs border rounded dark:border-gray-700 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Per page:</span>
                    <select
                      value={actionPageSize}
                      onChange={(e) => {
                        setActionPageSize(Number(e.target.value));
                        setActionPage(0);
                      }}
                      className="py-0.5 px-1.5 text-xs border rounded dark:border-gray-700 bg-white dark:bg-[#181818]"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                {depActions.length > 0 ? (
                  <>
                    <div className="flex flex-col divide-y dark:divide-gray-800 max-h-[350px] overflow-y-auto pr-1">
                      {paginatedActions.length > 0 ? (
                        paginatedActions.map((act) => (
                          <div key={act.id || Math.random()} className="py-2.5 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{act.actionType}</span>
                              <span className="text-[10px] text-gray-400">{act.performedAt ? new Date(act.performedAt).toLocaleString() : ""}</span>
                            </div>
                            {act.command && <div className="font-mono text-[11px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] p-1.5 rounded">{act.command}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 italic text-xs">
                          No actions match search query "{actionSearch}".
                        </div>
                      )}
                    </div>

                    {/* Action Timeline Pagination Controls */}
                    <div className="flex justify-between items-center px-1 py-1 text-xs text-gray-600 dark:text-gray-400 border-t dark:border-gray-800 pt-2">
                      <div>
                        Showing {filteredActions.length === 0 ? 0 : actionPage * actionPageSize + 1} to {Math.min((actionPage + 1) * actionPageSize, filteredActions.length)} of {filteredActions.length} actions
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actionPage === 0}
                          onClick={() => setActionPage((prev) => Math.max(0, prev - 1))}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Prev
                        </button>
                        <span className="font-semibold px-1">
                          {actionPage + 1} / {totalActionPages}
                        </span>
                        <button
                          type="button"
                          disabled={actionPage >= totalActionPages - 1}
                          onClick={() => setActionPage((prev) => prev + 1)}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500 italic">No action history recorded yet.</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* RESTART CONTAINER MODAL */}
      <Modal isOpen={isRestartModalOpen} onClose={() => setIsRestartModalOpen(false)} title="Restart Container">
        <form onSubmit={handleRestartSubmit} className="flex flex-col gap-4 p-2 text-sm">
          <div>
            <label className="block text-xs font-semibold mb-1">Container Name *</label>
            <input
              type="text"
              required
              value={restartForm.containerName}
              onChange={(e) => setRestartForm({ ...restartForm, containerName: e.target.value })}
              className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
              placeholder="e.g. redis-app"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">SSH Key (Optional if cached)</label>
            <textarea
              rows={3}
              value={restartForm.privateKey}
              onChange={(e) => setRestartForm({ ...restartForm, privateKey: e.target.value })}
              className="w-full p-2 text-xs font-mono border rounded bg-transparent dark:border-gray-700"
              placeholder="Leave empty if SSH key was previously stored"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsRestartModalOpen(false)}
              className="px-4 py-2 border rounded text-xs dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow"
            >
              Restart Container
            </button>
          </div>
        </form>
      </Modal>

      {/* EXEC COMMAND MODAL */}
      <Modal isOpen={isExecModalOpen} onClose={() => setIsExecModalOpen(false)} title="Execute Remote Command">
        <form onSubmit={handleExecSubmit} className="flex flex-col gap-4 p-2 text-sm">
          <div>
            <label className="block text-xs font-semibold mb-1">Command *</label>
            <input
              type="text"
              required
              value={execForm.command}
              onChange={(e) => setExecForm({ ...execForm, command: e.target.value })}
              className="w-full p-2 font-mono text-xs border rounded bg-transparent dark:border-gray-700"
              placeholder="e.g. sudo docker ps or sudo docker logs container_name"
            />
          </div>

          {execOutput && (
            <div>
              <label className="block text-xs font-semibold mb-1">Execution Output:</label>
              <pre className="p-3 bg-black text-green-400 font-mono text-xs rounded h-48 overflow-y-auto whitespace-pre-wrap border border-gray-800">
                {execOutput.remoteOutput || execOutput.message}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsExecModalOpen(false)}
              className="px-4 py-2 border rounded text-xs dark:border-gray-700"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow"
            >
              Execute Command
            </button>
          </div>
        </form>
      </Modal>

      {/* STORE SSH KEY MODAL */}
      <Modal isOpen={isSshKeyModalOpen} onClose={() => setIsSshKeyModalOpen(false)} title={`Store SSH Key for Deployment: ${sshKeyForm.deploymentId}`}>
        <form onSubmit={handleSshKeySubmit} className="flex flex-col gap-4 p-2 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <label className="block text-xs font-semibold mb-1">Private Key *</label>
            <textarea
              required
              rows={5}
              value={sshKeyForm.privateKey}
              onChange={(e) => setSshKeyForm({ ...sshKeyForm, privateKey: e.target.value })}
              className="w-full p-2 text-xs font-mono border rounded bg-transparent dark:border-gray-700"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Passphrase (Optional)</label>
            <input
              type="password"
              value={sshKeyForm.passphrase}
              onChange={(e) => setSshKeyForm({ ...sshKeyForm, passphrase: e.target.value })}
              className="w-full p-2 text-sm border rounded bg-transparent dark:border-gray-700"
              placeholder="Enter passphrase if key is encrypted"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsSshKeyModalOpen(false)}
              className="px-4 py-2 border rounded text-xs dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow"
            >
              Store SSH Key
            </button>
          </div>
        </form>
      </Modal>


    </div>
  );
};

export default DmsManagement;
