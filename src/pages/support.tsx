import { SupportService } from "@/services/support.service";
import { SupportColumnGrid } from "@/shared/config/grid.config";
import { ResolutionDetailsForm, TicketDetailsForm } from "@/shared/config/input.cofig";
import { alertAction, formatSelectOptions } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import { useEffect, useState, useMemo } from "react";
import { useLoader } from "../contexts/loader.context";
import NoDataWatermark from "@/widgets/noData";
import { Autocomplete, TextField } from "@mui/material";

const Support = () => {
    const columDef = SupportColumnGrid;
    const [data, setData] = useState<any>(null);
    const [allTickets, setAllTickets] = useState<any[]>([]);
    const [ticketDtls, setticketDtls] = useState<any>();
    const [resolutionDtls, setResolutionDtls] = useState<any>();
    const [domainData, setDomainData] = useState<any>(null);
    const [resolutionformConfig, setFormConfigForm] = useState<any>(ResolutionDetailsForm);
    const { showLoader, hideLoader } = useLoader();

    // Search Filter States
    const [searchAccount, setSearchAccount] = useState<any>(null);
    const [searchStatus, setSearchStatus] = useState<any>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const accountOptions = useMemo(() => {
        const accounts = allTickets.map((item: any) => item.accountName).filter(Boolean);
        return Array.from(new Set(accounts));
    }, [allTickets]);

    const handleFormSubmit = async (formData: any) => {
        const payload = {
            subject: ticketDtls.subject,
            category: ticketDtls.category,
            priority: ticketDtls.priority,
            description: ticketDtls.description,
            categoryType: ticketDtls.categoryType,
            accountName: ticketDtls.accountName,
            status: formData.status,
            resolution: formData.resolution,
            ticketResolutionDate: (formData.status === 'Closed' || formData.status === 'Resolved') ? new Date().toISOString() : null
        };
        showLoader();
        try {
            const res = await SupportService.updateSupportDetails(payload, ticketDtls.id);
            if (res) {
                alertAction('success', 'Updated data successfully')();
            }
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            Initialize();
        }
    };

    const Initialize = async () => {
        showLoader();
        try {
            const supportData = await SupportService.getSupportDetails();
            if (supportData && supportData.issues) {
                setAllTickets(supportData.issues);
                setData(supportData.issues);
            }
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        }
        finally {
            hideLoader();
        }
    };

    const handleSearch = () => {
        let filtered = [...allTickets];

        if (searchAccount) {
            const accName = typeof searchAccount === 'string' ? searchAccount : searchAccount?.label || searchAccount?.value || "";
            if (accName) {
                filtered = filtered.filter(item => item.accountName?.toLowerCase() === accName.toLowerCase());
            }
        }

        if (searchStatus) {
            const statusVal = typeof searchStatus === 'string' ? searchStatus : searchStatus?.value || searchStatus?.label || "";
            if (statusVal) {
                filtered = filtered.filter(item => item.status?.toLowerCase() === statusVal.toLowerCase());
            }
        }

        if (startDate) {
            filtered = filtered.filter(item => item.reportDate >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(item => item.reportDate <= endDate);
        }

        setData(filtered);
    };

    const handleGridSelectionChange = (selectedRows: any[]) => {
        if (selectedRows && selectedRows.length > 0) {
            setticketDtls(selectedRows[0]);
            setResolutionDtls(selectedRows[0]);
            const form = ResolutionDetailsForm;
            form.forEach((elem: any) => {
                if (elem.name == 'status')
                    elem.options = formatSelectOptions(domainData, elem);
            });
            setFormConfigForm(form);
        } else {
            setticketDtls(null);
            setResolutionDtls(null);
        }
    };

    const getDomainData = async () => {
        const domainResponse = await SupportService.getApiDomain();
        if (domainResponse) {
            setDomainData(domainResponse);
        }
    };

    useEffect(() => {
        Initialize();
        getDomainData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        //{/* FIX: Set outer background to transparent for dark mode */}
        <div className="flex-1 bg-gray-100 dark:bg-transparent p-6 pt-2 h-full overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-[85vh]">

                {/* LEFT PANE: Search & Grid (Single Bordered Box) */}
                {/* FIX: Set dark mode background and border */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-gray-400 dark:border-gray-700 shadow-sm flex flex-col h-full p-4">

                    {/* Search Tickets Section */}
                    <div className="flex flex-col gap-3 mb-6">
                        {/* FIX: Set header text to white */}
                        <div className="text-gray-700 dark:text-white font-bold text-sm">Search Tickets</div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                {/* FIX: Ensure labels are readable in dark mode */}
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Account</label>
                                <Autocomplete
                                    options={accountOptions}
                                    getOptionLabel={(option: any) => option?.label || option?.value || (typeof option === 'string' ? option : "")}
                                    size="small"
                                    renderInput={(params) => <TextField {...params} variant="outlined" />}
                                    value={searchAccount}
                                    onChange={(_, val) => setSearchAccount(val)}
                                />
                            </div>
                            <div className="flex flex-col">
                                {/* FIX: Ensure labels are readable in dark mode */}
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Status</label>
                                <Autocomplete
                                    //{/* FIX: Added strict fallback to `[]` to prevent crash if formatSelectOptions fails */}
                                    options={domainData ? (formatSelectOptions(domainData, { type: 'select', labelKey: 'status' }) || []) : []}
                                    //{/* FIX: This getOptionLabel stops MUI from crashing when reading your options objects! */}
                                    getOptionLabel={(option: any) => option?.label || option?.value || (typeof option === 'string' ? option : "")}
                                    isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value || option === value}
                                    size="small"
                                    renderInput={(params) => <TextField {...params} variant="outlined" />}
                                    value={searchStatus}
                                    onChange={(_, val) => setSearchStatus(val)}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Date Range</label>
                                <div className="flex gap-2">
                                    <TextField
                                        type="date"
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <TextField
                                        type="date"
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end justify-end">
                                <button
                                    className="px-8 py-2 border-none bg-[#48a9b8] hover:bg-teal-600 text-white text-sm rounded shadow-sm transition-colors cursor-pointer"
                                    onClick={handleSearch}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Support Requests Grid Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* FIX: Set header text to white */}
                        <div className="text-gray-700 dark:text-white font-bold text-sm mb-2">
                            Support Requests
                        </div>
                        {/* FIX: Adjust grid border for dark mode */}
                        <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-700">
                            {columDef && (
                                <NNPGrid
                                    rows={data}
                                    columns={columDef}
                                    onSelectionChange={handleGridSelectionChange}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Two Separate Bordered Boxes */}
                <div className="flex flex-col h-full gap-4 min-h-0">

                    {/* Top Box: Ticket Details */}
                    {/* FIX: Set dark mode background and border */}
                    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-400 dark:border-gray-700 shadow-sm flex flex-col flex-1 p-4 min-h-0">
                        {/* FIX: Set header text to white */}
                        <div className="text-gray-500 dark:text-white font-bold text-sm mb-4">
                            Support Ticket Details
                        </div>
                        <div className="flex-1 overflow-y-auto flex flex-col relative">
                            {ticketDtls ? (
                                <>
                                    <DynamicForm
                                        inputs={TicketDetailsForm ?? []}
                                        layout="double"
                                        editable={false}
                                        defaultValues={ticketDtls || {}}
                                    />
                                    <div className="mt-auto pt-4 flex justify-end">
                                        <a
                                            href={ticketDtls.ticketLink || ticketDtls.redmineUrl || (ticketDtls.redmineIssueId ? `${(import.meta.env.VITE_REDMINE_URL as string || '/comm/redmine').replace(/\/$/, '')}/issues/${ticketDtls.redmineIssueId}` : '#')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#5c8edb] underline text-sm hover:text-blue-700"
                                        >
                                            Project Management System – Ticket Link
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <NoDataWatermark text='No ticket details selected.' />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Box: Resolution Details */}
                    {/* FIX: Set dark mode background and border */}
                    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-400 dark:border-gray-700 shadow-sm flex flex-col h-[40%] p-4 min-h-0">
                        {/* FIX: Set header text to white */}
                        <div className="text-gray-500 dark:text-white font-bold text-sm mb-4">
                            Resolution Details
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {ticketDtls ? (
                                <DynamicForm
                                    inputs={resolutionformConfig ?? []}
                                    onSubmit={handleFormSubmit}
                                    defaultValues={resolutionDtls || {}}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <NoDataWatermark text='No ticket details selected.' />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Support;