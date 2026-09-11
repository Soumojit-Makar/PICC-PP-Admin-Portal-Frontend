import { useLoader } from "@/contexts/loader.context";
import { useForm } from "react-hook-form";
import { RegistrationService } from "@/services/registration.service";
import {
    RegistrationRequestColumnGrid,
    getAccountCommunicationsColumns,
    // ComponentsDeployedColumnGrid,
    getComponentsDeployedColumns,
    SubscribedComponentsColumnGrid
} from "@/shared/config/grid.config";
import { AccountDetailsForm, PlanDetailsForm } from "@/shared/config/input.cofig";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import NoDataWatermark from "@/widgets/noData";
import { useEffect, useState, useCallback } from "react";
import { showConfirmDialog } from "@/widgets/confirmDialog";
import Modal from "@/widgets/modal";
// import { getFlattenedPlanComponents } from "@/shared/utils";

const getNamespaceQuotaLabel = (subscribedComps: any[]) => {
    const quotaComps = (subscribedComps || []).filter((item: any) => item.category === 'Resource Quota');
    if (quotaComps.length === 0) return 'N/A';

    const nonNamespaceComps = quotaComps.filter((item: any) => item.id !== 'bbcomp_namespace');
    if (nonNamespaceComps.length > 0) {
        return nonNamespaceComps.map((item: any) => item.componentName).join(', ');
    }

    const namespaceComp = quotaComps.find((item: any) => item.id === 'bbcomp_namespace');
    return namespaceComp ? namespaceComp.componentName : 'N/A';
};

const formatPodMetricRows = (podMetric: any[]) => {
    return (podMetric || []).map((item, index) => {
        const servicesFormatted = (item.services || [])
            .map((svc: any) => svc.endPoints ? svc.endPoints.join(", ") : svc.serviceName || svc)
            .join(", ")
            .replace(/\s+/g, " ")
            .trim();

        return {
            id: `row-${index + 1}${item.id ? `-${item.id}` : ""}`,
            memory: item.memoryConsumed ? `${item.memoryConsumed.value} ${item.memoryConsumed.unit}` : (item.memory || '-'),
            cpu: item.cpuConsumed ? `${item.cpuConsumed.value} ${item.cpuConsumed.unit}` : (item.cpu || '-'),
            servicesFormatted,
            ...item,
        };
    });
};

const RegistrationRequest = () => {
    // Data States
    const [columDef] = useState<any>(RegistrationRequestColumnGrid);
    const [data, setData] = useState<any>(null);
    const [rowAccDtls, setrowAccDtls] = useState<any>();
    const [currentBillingData, setCurrentBillingData] = useState<any>();
    const [billingDtl, setBillingDtl] = useState<any>();
    const [selectedPodDetails, setSelectedPodDetails] = useState<any>(null);
    const handleViewPodDetails = (pod: any) => {
        setSelectedPodDetails(pod);
    };
    const [selectedCommsDetails, setSelectedCommsDetails] = useState<any>(null);

    const handleViewCommunicationDetails = (row: any) => {
        setSelectedCommsDetails(row);
    };

    // States for Resource Deletion Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<string>("");
    const [associatedResources, setAssociatedResources] = useState<Record<string, any[]>>({});
    const [checkedResources, setCheckedResources] = useState<Record<string, string[]>>({});

    // Dependent Component States
    const [communicationsData, setCommunicationsData] = useState<any[]>([]);
    const [componentsData, setComponentsData] = useState<any>(null);

    // Subscribed Plan States
    const [subscribedPlanName, setSubscribedPlanName] = useState<string>('');
    const [subscribedCompsList, setSubscribedCompsList] = useState<any[]>([]);

    // UI States
    const { showLoader, hideLoader } = useLoader();
    const [activeSection, setActiveSection] = useState<string>('accountDetails');
    const [isDmsModalOpen, setIsDmsModalOpen] = useState(false);

    const hasDmsComponent = subscribedCompsList.some((comp: any) => comp.componentName.toLowerCase().includes('dms'));

    const handleCheckAllPodsStatus = async () => {
        if (!rowAccDtls?.accName) return;
        showLoader();
        try {
            // Fetch K8s data first
            const k8sData = await RegistrationService.getComponentsDeployed(rowAccDtls.accName);

            // Normalize: k8sData might be an object {podMetric:[...], count: 70} or an array
            let podsArray: any[] = [];
            if (Array.isArray(k8sData)) {
                podsArray = k8sData;
            } else if (k8sData && typeof k8sData === 'object') {
                podsArray = k8sData.podMetric || k8sData.pods || k8sData.deployments || k8sData.items || Object.values(k8sData).find(Array.isArray) || [];
            }

            // Send normalized array to backend
            await RegistrationService.checkAllPodsStatus(rowAccDtls.accName, { pods: podsArray });

            alertAction('success', 'Pod statuses checked and updated successfully!')();
            // Refresh components
            setComponentsData(k8sData || null);
            // Refresh communications
            const commsRes = await RegistrationService.getAccountCommunications(rowAccDtls.accName);
            setCommunicationsData(commsRes || []);
        } catch (err: any) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? err.message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const handleDmsFormSubmit = async (formData: any) => {
        if (!rowAccDtls?.accName) return;
        showLoader();
        try {
            await RegistrationService.createDmsWidget(rowAccDtls.accName, formData);
            alertAction('success', 'VM Widget created successfully!')();
            setIsDmsModalOpen(false);
        } catch (err: any) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? err.message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const handleUpdateAccountDetails = async (formData: any) => {
        showLoader();
        try {
            await RegistrationService.updateAccountDetailsByAdmin(rowAccDtls.accName, formData, formData.accStatus);
            alertAction('success', 'Account details updated successfully!')();
            Initialize();
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const handleFetchComponentsDeployed = async () => {
        if (!rowAccDtls?.accName) {
            alertAction('warning', 'Please select an account first!')();
            return;
        }
        showLoader();
        try {
            const comps = await RegistrationService.getComponentsDeployed(rowAccDtls.accName);
            setComponentsData(comps || null);
            alertAction('success', 'Deployed components fetched successfully!')();
        } catch (err: any) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const handleRestartPod = (pod: any) => {
        showConfirmDialog({
            type: 'warning',
            message: `Are you sure you want to restart pod "${pod.podName}"?`,
            confirmText: 'Yes, Restart',
            onConfirm: async () => {
                showLoader();
                try {
                    await RegistrationService.restartPod(rowAccDtls.accName, pod.podName);
                    alertAction('success', `Pod "${pod.podName}" restart triggered successfully!`)();

                    // Reload data after 500ms
                    setTimeout(async () => {
                        const updatedComps = await RegistrationService.getComponentsDeployed(rowAccDtls.accName);
                        setComponentsData(updatedComps || null);
                    }, 500);
                } catch (err: any) {
                    alertAction('error', err.message || 'Failed to restart pod')();
                } finally {
                    hideLoader();
                }
            }
        });
    };

    const handleDeletePodModal = async (pod: any) => {
        showLoader();
        try {
            const resources: Record<string, any[]> = await RegistrationService.getK8sIntgResources(
                rowAccDtls.accName,
                pod.deploymentName
            );

            setAssociatedResources(resources || {});
            setSelectedDeployment(pod.deploymentName);

            // Automatically check force-deleted resources
            const initialChecked: Record<string, string[]> = {};
            Object.entries(resources || {}).forEach(([key, list]) => {
                if (key !== 'deploymentName' && Array.isArray(list)) {
                    initialChecked[key] = list.filter(item => item.willBeForceDeleted).map(item => item.resourceName);
                }
            });
            setCheckedResources(initialChecked);
            setIsDeleteModalOpen(true);
        } catch (err: any) {
            alertAction('error', err.message || 'Failed to load associated resources')();
        } finally {
            hideLoader();
        }
    };

    const handleDeletePodConfirm = async () => {
        showLoader();
        try {
            const payload = {
                envName: rowAccDtls.accName,
                deploymentNames: [selectedDeployment],
                serviceNames: checkedResources.services || [],
                configMapNames: checkedResources.configMaps || [],
                secretsNames: checkedResources.secrets || [],
                PVCNames: checkedResources.pvcs || [],
                podNames: checkedResources.pods || [],
                replicaSetNames: checkedResources.replicaSets || [],
            };

            await RegistrationService.deletePodResources(payload);
            alertAction('success', `Resources deleted successfully!`)();
            setIsDeleteModalOpen(false);

            // Reload data
            const updatedComps = await RegistrationService.getComponentsDeployed(rowAccDtls.accName);
            setComponentsData(updatedComps || null);
        } catch (err: any) {
            alertAction('error', err.message || 'Failed to delete resources')();
        } finally {
            hideLoader();
        }
    };

    const handleTerminalPod = async (pod: any) => {
        showLoader();
        try {
            const res: any = await RegistrationService.openKubernetesTerminal({
                envName: rowAccDtls.accName,
                pod: pod.podName,
            });
            if (res) {
                const html = res.replace(/\$\{window\.location\.host\}/g, window.location.host);
                const blob = new Blob([html], { type: "text/html" });
                window.open(URL.createObjectURL(blob), "_blank");
            }
        } catch (err: any) {
            alertAction('error', err.message || 'Failed to open terminal')();
        } finally {
            hideLoader();
        }
    };

    const handleFormSubmit = (formData: any) => {
        console.log("Generic form submitted with data:", formData);
    };

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [rowCount, setRowCount] = useState(0);

    const Initialize = useCallback(async () => {
        showLoader();
        try {
            const res = await RegistrationService.getAllAccounts(paginationModel.page, paginationModel.pageSize);
            setData(res?.content || []);
            setRowCount(res?.totalElements || res?.content?.length || 0);
        }
        catch (err) {
            setData([]);
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    }, [showLoader, hideLoader, paginationModel.page, paginationModel.pageSize]);

    const emptyDependantGrids = () => {
        setCurrentBillingData(null);
        setBillingDtl(null);
        setrowAccDtls(null);
        setCommunicationsData([]);
        setComponentsData(null);
        setSubscribedPlanName('');
        setSubscribedCompsList([]);
    };

    const handleSelectionChange = async (row: any) => {
        if (!row || row.length === 0 || !row[0]) {
            emptyDependantGrids();
            return;
        }

        try {
            showLoader();
            const selectedAccount = row[0];

            // Fetching details concurrently (components deployed is fetched on demand via button)
            const [accDetailsRes, planDetailsRes, commsRes, subCompsRes] = await Promise.all([
                RegistrationService.getAccDetailsByAccName(selectedAccount.accName),
                RegistrationService.getPlanDetails(selectedAccount.accName),
                RegistrationService.getAccountCommunications(selectedAccount.accName),
                RegistrationService.getSubscribedComponents(selectedAccount.accName)
            ]);

            setCurrentBillingData(planDetailsRes?.currentBillingDetails);
            setBillingDtl(planDetailsRes);
            setrowAccDtls({ ...selectedAccount, ...accDetailsRes });
            setCommunicationsData(commsRes || []);
            setComponentsData(null);

            // Console log the Plan Details
            // console.log({
            //     planName: subCompsRes?.subscribedPlan || '-',
            //     billingDate: planDetailsRes?.currentBillingDetails?.billingDate || planDetailsRes?.currentBillingDetails?.billDate || '-',
            //     paymentMode: planDetailsRes?.currentBillingDetails?.paymentMode || '-',
            //     openingBalance: planDetailsRes?.currentBillingDetails?.openingBalance || planDetailsRes?.currentBillingDetails?.billOpenBalance || '-'
            // }, 'Formatted Plan Details (Form Values)');

            // console.log(subCompsRes.planComponents, 'subCompsRes');
            console.log(commsRes, 'commsRes');
            // console.log(componentsRes, 'componentsRes');
            // console.log(planDetailsRes, 'planDetailsRes');
            // console.log(accDetailsRes, 'accDetailsRes');
            // console.log(selectedAccount, 'selectedAccount');
            if (subCompsRes) {
                // Save just the Plan Name
                setSubscribedPlanName(subCompsRes.subscribedPlan || '');

                // Flatten the nested categories into one array for the grid
                const flattenedSubComps: any[] = [];
                Object.entries(subCompsRes.planComponents || {}).forEach(([category, comps]: [string, any]) => {
                    comps.forEach((c: any) => {
                        flattenedSubComps.push({
                            id: c.componentId,
                            category: category,
                            componentName: c.componentName,
                            price: c.pricePerDay ? `${c.pricePerDay.currency}${c.pricePerDay.amount}` : '-'
                        });
                    });
                });
                setSubscribedCompsList(flattenedSubComps);
            }

            setActiveSection('accountDetails');
        } catch (err) {
            emptyDependantGrids();
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    const toggleAccordion = (section: string) => {
        setActiveSection(prev => prev === section ? '' : section);
    };

    useEffect(() => {
        Initialize();
    }, [Initialize]);

    const AccordionHeader = ({ id, title }: { id: string, title: string }) => {
        const isOpen = activeSection === id;
        return (
            <div
                className={`
                    flex items-center justify-between px-5 py-3.5 
                    bg-[#2563eb] hover:bg-[#1d4ed8] 
                    dark:bg-[#1e293b] dark:hover:bg-[#334155] 
                    text-white cursor-pointer select-none 
                    border-b border-blue-700 dark:border-slate-800 
                    transition-all duration-200 ease-in-out
                `}
                onClick={() => toggleAccordion(id)}
            >
                <div className="text-sm font-bold tracking-wide uppercase">{title}</div>
                <div className="text-sm transition-transform duration-200">
                    {isOpen ? '▲' : '▼'}
                </div>
            </div>
        );
    };


    // Prepare combined data for the DynamicForm
    const planFormValues = {
        planName: subscribedPlanName || '-',
        billingDate: currentBillingData?.billingDate || currentBillingData?.billDate || '-',
        paymentMode: currentBillingData?.paymentMode || '-',
        openingBalance: currentBillingData?.openingBalance || currentBillingData?.billOpenBalance || '-'
    };

    return (
        <div className="h-full flex flex-col p-4">
            {/* FIX: Made the heading text white in dark mode */}
            <h1 className="text-lg font-bold text-gray-700 dark:text-white mb-4">Manage Registration Requests</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* LEFT PANE: Master Grid */}
                <div className="md:col-span-1 flex flex-col border dark:border-gray-700 h-full overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        {columDef && (
                            <NNPGrid
                                rows={data}
                                columns={columDef}
                                getRowId={(row: any) => `${row.accId}`}
                                onSelectionChange={handleSelectionChange}
                                paginationMode="server"
                                rowCount={rowCount}
                                paginationModel={paginationModel}
                                onPaginationModelChange={setPaginationModel}
                            />
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Details Accordions */}
                <div className="md:col-span-2 flex flex-col border dark:border-gray-700 h-full overflow-y-auto bg-gray-50 dark:bg-[#121212]">
                    {/* ACCORDION 1: Environment Account Details */}
                    <div className="flex flex-col">
                        <AccordionHeader id="accountDetails" title="Environment Account Details" />
                        {activeSection === 'accountDetails' && (
                            /* FIX: Replaced bg-white with dark mode alternatives */
                            <div className="p-4 bg-white dark:bg-[#171717] border-b dark:border-gray-700">
                                {rowAccDtls ? (

                                    <div className="flex flex-col gap-4">

                                        <DynamicForm
                                            inputs={AccountDetailsForm ?? []}
                                            layout="double"
                                            onSubmit={handleUpdateAccountDetails}
                                            editable={true}
                                            defaultValues={rowAccDtls || {}}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative min-h-[150px]">
                                        <NoDataWatermark text='No requests selected.' />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ACCORDION 2: Plan Details */}
                    <div className="flex flex-col">
                        <AccordionHeader id="planDetails" title="Plan Details" />
                        {activeSection === 'planDetails' && (
                            /* FIX: Replaced bg-white with dark mode alternatives */
                            <div className="p-4 bg-white dark:bg-[#171717] border-b dark:border-gray-700">
                                {billingDtl ? (
                                    <div className="flex flex-col gap-4">
                                        <DynamicForm
                                            inputs={PlanDetailsForm ?? []}
                                            layout="double"
                                            onSubmit={handleFormSubmit}
                                            editable={true}
                                            defaultValues={planFormValues}
                                        />
                                        <div className="font-semibold text-sm mt-4 dark:text-gray-200">Plan Details</div>
                                        <div className="h-[250px] w-full border dark:border-gray-700 bg-white dark:bg-[#171717]">
                                            {SubscribedComponentsColumnGrid && (
                                                <NNPGrid
                                                    rows={subscribedCompsList}
                                                    columns={SubscribedComponentsColumnGrid}
                                                    getRowId={(row: any) => row.id}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative min-h-[150px]">
                                        <NoDataWatermark text='No requests selected.' />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ACCORDION 3: Components Deployed */}
                    <div className="flex flex-col">
                        <AccordionHeader id="componentsDeployed" title="Components Deployed" />
                        {activeSection === 'componentsDeployed' && (
                            /* FIX: Replaced bg-white with dark mode alternatives */
                            <div className="p-4 bg-white dark:bg-[#171717] border-b dark:border-gray-700">
                                {rowAccDtls ? (
                                    <div className="flex flex-col gap-4">
                                        {/* FIX: Text colors updated for dark mode readability */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            Namespace: <span className="font-semibold dark:text-sky-400">{componentsData?.podMetric?.[0]?.namespace || 'N/A'}</span>
                                            &nbsp;&nbsp;|&nbsp;&nbsp; Quota Details: <span className="font-semibold dark:text-sky-400">{getNamespaceQuotaLabel(subscribedCompsList)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-sm dark:text-gray-200">Deployed Components</div>
                                            <div className="flex gap-2">
                                                {hasDmsComponent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsDmsModalOpen(true)}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        Create VM Widget
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleCheckAllPodsStatus}
                                                    disabled={!(rowAccDtls?.adminToken || rowAccDtls?.userToken || rowAccDtls?.kubeToken)}
                                                    className={`px-3 py-1.5 text-white text-xs font-semibold rounded shadow transition-colors flex items-center gap-1.5 ${!(rowAccDtls?.adminToken || rowAccDtls?.userToken || rowAccDtls?.kubeToken) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}`}
                                                >
                                                    Check All Pods Status
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleFetchComponentsDeployed}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                                    </svg>
                                                    Fetch Deployed Components
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full border dark:border-gray-700 bg-white dark:bg-[#171717]">
                                            {
                                                componentsData?.podMetric ? (
                                                    <NNPGrid
                                                        rows={formatPodMetricRows(componentsData.podMetric)}
                                                        columns={getComponentsDeployedColumns({
                                                            onRestart: handleRestartPod,
                                                            onDelete: handleDeletePodModal,
                                                            onTerminal: handleTerminalPod,
                                                            onViewDetails: handleViewPodDetails
                                                        })}
                                                        getRowId={(row: any) => `${row.podName}`}
                                                    />
                                                ) : (
                                                    <div className="relative h-full flex flex-col items-center justify-center">
                                                        <NoDataWatermark text='Click "Fetch Deployed Components" to view data.' />
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative min-h-[150px]">
                                        <NoDataWatermark text='No requests selected.' />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ACCORDION 4: Account Communications */}
                    <div className="flex flex-col">
                        <AccordionHeader id="accountComms" title="Account Communications" />
                        {activeSection === 'accountComms' && (
                            /* FIX: Replaced bg-white with dark mode alternatives */
                            <div className="p-4 bg-white dark:bg-[#171717] border-b dark:border-gray-700">
                                {rowAccDtls ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="h-[270px] w-full border dark:border-gray-700 bg-white dark:bg-[#171717]">
                                            {getAccountCommunicationsColumns && (
                                                <NNPGrid
                                                    rows={communicationsData}
                                                    columns={getAccountCommunicationsColumns({
                                                        onViewDetails: handleViewCommunicationDetails
                                                    })}
                                                    getRowId={(row: any) => `${row.id || Math.random()}`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative min-h-[150px]">
                                        <NoDataWatermark text='No requests selected.' />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* View Pod Details Modal */}
            <Modal
                isOpen={!!selectedPodDetails}
                onClose={() => setSelectedPodDetails(null)}
                title="Pod Detailed Specifications"
            >
                {selectedPodDetails && (
                    <div className="flex flex-col gap-4 text-sm max-h-[75vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4 border-b dark:border-gray-800 pb-4">
                            <div>
                                <span className="text-gray-500 block">Pod Name</span>
                                <span className="font-semibold text-gray-950 dark:text-white break-all">{selectedPodDetails.podName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Namespace</span>
                                <span className="font-semibold text-gray-950 dark:text-white">{selectedPodDetails.namespace || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Deployment</span>
                                <span className="font-semibold text-gray-950 dark:text-white">{selectedPodDetails.deploymentName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Status</span>
                                <span className={`font-semibold ${selectedPodDetails.podStatus === 'Running' ? 'text-green-600' : 'text-red-500'}`}>
                                    {selectedPodDetails.podStatus}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">CPU Allocated / Consumed</span>
                                <span className="font-semibold text-gray-950 dark:text-white">
                                    {selectedPodDetails.cpuConsumed
                                        ? `${selectedPodDetails.cpuConsumed.value} ${selectedPodDetails.cpuConsumed.unit}`
                                        : selectedPodDetails.cpu || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Memory Allocated / Consumed</span>
                                <span className="font-semibold text-gray-950 dark:text-white">
                                    {selectedPodDetails.memoryConsumed
                                        ? `${selectedPodDetails.memoryConsumed.value} ${selectedPodDetails.memoryConsumed.unit}`
                                        : selectedPodDetails.memory || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Services & Endpoints</h4>
                            {selectedPodDetails.services && selectedPodDetails.services.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {selectedPodDetails.services.map((svc: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded border dark:border-gray-700">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">{svc.serviceName}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Endpoints: {svc.endPoints?.join(', ') || 'None'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">No services associated.</div>
                            )}
                        </div>

                        <div className="mt-2 border-t dark:border-gray-800 pt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedPodDetails(null)}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Pod Resources Selection Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Select Resources to Delete"
            >
                <div className="flex flex-col gap-4 text-sm">
                    <div>
                        Deployment Name: <span className="font-bold">{selectedDeployment}</span>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-4 pr-2">
                        {Object.entries(associatedResources || {}).map(([category, items]) => {
                            if (category === 'deploymentName' || !Array.isArray(items) || items.length === 0) return null;
                            return (
                                <div key={category} className="flex flex-col gap-1 border-t dark:border-gray-800 pt-2">
                                    <span className="font-semibold capitalize text-gray-500 dark:text-gray-400">{category}</span>
                                    <div className="flex flex-col gap-2 pl-2">
                                        {items.map((item) => (
                                            <label key={item.resourceName} className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    disabled={item.willBeForceDeleted}
                                                    checked={checkedResources[category]?.includes(item.resourceName) || false}
                                                    onChange={(e) => {
                                                        const checkedList = checkedResources[category] || [];
                                                        const updated = e.target.checked
                                                            ? [...checkedList, item.resourceName]
                                                            : checkedList.filter(name => name !== item.resourceName);
                                                        setCheckedResources({
                                                            ...checkedResources,
                                                            [category]: updated
                                                        });
                                                    }}
                                                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                                                />
                                                <span className={item.willBeForceDeleted ? 'text-gray-400 dark:text-gray-600 line-through' : ''}>
                                                    {item.resourceName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 border-t dark:border-gray-800 pt-4 mt-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 border rounded text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeletePodConfirm}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Account Communication Details Modal */}
            <Modal
                isOpen={!!selectedCommsDetails}
                onClose={() => setSelectedCommsDetails(null)}
                title="Account Communication Details"
            >
                {selectedCommsDetails && (
                    <div className="flex flex-col gap-4 text-sm max-h-[70vh] overflow-y-auto pr-2 text-gray-700 dark:text-gray-200">
                        <div className="grid grid-cols-2 gap-4 pb-2 border-b dark:border-gray-800">
                            <div>
                                <span className="text-gray-500 block mb-1">Date & Time</span>
                                <span className="font-semibold text-gray-950 dark:text-white">{selectedCommsDetails.dateTime || selectedCommsDetails.date || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Type</span>
                                <span className="font-semibold text-gray-950 dark:text-white capitalize">{selectedCommsDetails.type || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Category</span>
                                <span className="font-semibold text-gray-950 dark:text-white capitalize">{selectedCommsDetails.category || 'N/A'}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500 block mb-1">Message</span>
                            <p className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded border dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium">
                                {selectedCommsDetails.message || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 block mb-1">Description / Details</span>
                            <p className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded border dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                {selectedCommsDetails.details || 'No description found.'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 block mb-1">Comments / Action taken</span>
                            <p className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded border dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                {selectedCommsDetails.action || 'No comments'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 block mb-1">Reference Link</span>
                            <p className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded border dark:border-gray-700 text-gray-800 dark:text-gray-200 break-all">
                                {selectedCommsDetails.link || 'No link found.'}
                            </p>
                        </div>

                        <div className="mt-2 border-t dark:border-gray-800 pt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedCommsDetails(null)}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* VM Creation Modal */}
            <Modal
                isOpen={isDmsModalOpen}
                onClose={() => setIsDmsModalOpen(false)}
                title="Create VM Widget"
            >
                <div className="p-4">
                    <DmsCustomForm onSubmit={handleDmsFormSubmit} />
                </div>
            </Modal>
        </div>
    );
}

const DmsCustomForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
    const { register, handleSubmit, setValue, getValues, formState: { errors, isValid } } = useForm({ mode: 'onChange' });
    const [inputType, setInputType] = useState<'text' | 'file'>('text');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setValue('sshKey', content, { shouldValidate: true });
        };
        reader.readAsText(file);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-gray-700 dark:text-gray-200">
            <div>
                <label className="block mb-2 text-sm font-semibold">SSH Key *</label>
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name="keyInputType" checked={inputType === 'text'} onChange={() => setInputType('text')} className="accent-blue-600" />
                        Paste Text
                    </label>
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name="keyInputType" checked={inputType === 'file'} onChange={() => setInputType('file')} className="accent-blue-600" />
                        Upload File
                    </label>
                </div>

                {inputType === 'file' && (
                    <input
                        type="file"
                        accept=".pub,.ppk,.key,.text,.pem,.txt"
                        onChange={handleFileUpload}
                        className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300"
                    />
                )}

                <div className={inputType === 'file' ? 'hidden' : 'block'}>
                    <textarea
                        {...register('sshKey', {
                            required: 'SSH Key is required',
                            validate: (val) => {
                                const trimmed = val.trim();
                                const isPem = trimmed.includes('BEGIN ') && trimmed.includes('END ');
                                const isPutty = trimmed.includes('PuTTY-User-Key-File');
                                const isPub = trimmed.startsWith('ssh-') || trimmed.startsWith('ecdsa-');
                                return isPem || isPutty || isPub || 'Must be a valid key (e.g., starts with BEGIN and ends with END, or PuTTY format)';
                            }
                        })}
                        className={`w-full p-2 border rounded bg-transparent dark:bg-[#171717] ${errors.sshKey ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        rows={4}
                        placeholder="Paste SSH Key here..."
                    />
                </div>

                {inputType === 'file' && !errors.sshKey && getValues('sshKey') && (
                    <div className="text-green-600 text-sm font-medium mt-1">✓ File loaded successfully</div>
                )}

                {errors.sshKey && <span className="text-red-500 text-xs block mt-1">{errors.sshKey.message as string}</span>}
            </div>

            <div>
                <label className="block mb-1 text-sm font-semibold">Username *</label>
                <input
                    {...register('username', { required: 'Username is required' })}
                    className={`w-full p-2 border rounded bg-transparent dark:bg-[#171717] ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="Enter Username"
                />
                {errors.username && <span className="text-red-500 text-xs">{errors.username.message as string}</span>}
            </div>

            <div>
                <label className="block mb-1 text-sm font-semibold">PORT / IP *</label>
                <input
                    {...register('portOrIp', {
                        required: 'PORT/IP is required',
                        pattern: {
                            value: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(:\d{1,5})?$|^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{1,5})?$/,
                            message: 'Enter a valid IP or Domain (e.g. 192.168.1.1, example.com, or with port 192.168.1.1:22)'
                        }
                    })}
                    className={`w-full p-2 border rounded bg-transparent dark:bg-[#171717] ${errors.portOrIp ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="e.g. 192.168.1.1 or 192.168.1.1:22"
                />
                {errors.portOrIp && <span className="text-red-500 text-xs">{errors.portOrIp.message as string}</span>}
            </div>

            <div>
                <label className="block mb-1 text-sm font-semibold">Deployment Path *</label>
                <input
                    {...register('deploymentPath', {
                        required: 'Deployment Path is required',
                        pattern: {
                            value: /^\/(?:[^/]+\/)*[^/]*$/,
                            message: 'Must be a valid absolute path (e.g. /var/www/html)'
                        }
                    })}
                    className={`w-full p-2 border rounded bg-transparent dark:bg-[#171717] ${errors.deploymentPath ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="/path/to/deployment"
                />
                {errors.deploymentPath && <span className="text-red-500 text-xs">{errors.deploymentPath.message as string}</span>}
            </div>

            <div className="flex justify-end mt-4">
                <button
                    type="submit"
                    disabled={!isValid}
                    className={`px-5 py-2 text-white rounded font-medium transition-colors ${!isValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Create VM
                </button>
            </div>
        </form>
    );
};

export default RegistrationRequest;