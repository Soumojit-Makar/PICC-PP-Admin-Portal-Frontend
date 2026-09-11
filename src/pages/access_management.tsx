import { SupportService } from "@/services/support.service";
import { UserAccessService } from "@/services/user_access.service";
import { AccessManagementColumnGrid } from "@/shared/config/grid.config";
import { UserDetailsForm } from "@/shared/config/input.cofig";
import { alertAction, formatSelectOptions } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid"
import DynamicForm from "@/widgets/dynamicForm"
import { useEffect, useState } from "react";
import { useLoader } from "../contexts/loader.context";

const AccessManagement = () => {
    const [columDef, setColumnDef] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [userDtls, setUserDtls] = useState<any>()
    const [userFormConfig, setUserFormConfig] = useState<any>(null);
    const [domainData, setDomainData] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<any>(null);
    const { showLoader, hideLoader } = useLoader();

    const handleFormSubmit = async (data: any) => {
        showLoader();
        try {
            const res = await UserAccessService.updateUserRequests(data.userId, data);
            if (res) {
                alertAction('success', 'Updated data sccessfully')()
            }
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
            Initialize()
        }
    };
    const Initialize = async () => {
        showLoader();
        try {
            const userData = await UserAccessService.getAllUserRequests();
            if (userData) {
                setData(userData);
            }
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        }
        finally {
            hideLoader();
        }


    }

    const handleGridSelectionChange = (selectedRows: any[]) => {
        if (selectedRows && selectedRows.length > 0) {
            setUserDtls(selectedRows[0])
            const form = UserDetailsForm
            form.forEach((elem: any) => {
                if (elem.name == 'roleId')
                    elem.options = userRoles.map(({ roleId, roleName }) => ({ label: roleName, value: roleId }));
                if (elem.name == 'userStatus')
                    elem.options = formatSelectOptions(domainData, elem)
            })
            setUserFormConfig(form);

        } else {
            setUserDtls(null)
        }
    }
    const getDomainData = async () => {
        const domainResponse = await SupportService.getApiDomain();
        if (domainResponse) {
            setDomainData(domainResponse);
        }
        const userRoles = await UserAccessService.getUserRoles();
        if (userRoles) {
            setUserRoles(userRoles);
        }
    }
    useEffect(() => {
        Initialize();
        setColumnDef(AccessManagementColumnGrid);
        getDomainData();

    }, [])
    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-screen">
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold p-4 pl-0">User Access Request Management</h1>
                    </div>
                    <div className="flex-1">
                        {columDef && <NNPGrid rows={data} columns={columDef} onSelectionChange={handleGridSelectionChange} getRowId={(row: any) => `${row.userId}`}
                        />}
                    </div>
                </div>

                <div className="flex flex-col border">
                    <div className="flex-1 border-b">
                        <div className="flex items-center justify-between px-4 py-4 bg-secondary border-b border-gray-200">
                            <div className="text-md font-semibold text-secondary_text">User Access Request Details</div>
                        </div>
                        <div className="p-4">
                            {userDtls ? (
                                <DynamicForm
                                    inputs={userFormConfig ?? []}
                                    layout="double"
                                    onSubmit={handleFormSubmit}
                                    defaultValues={userDtls || {}}
                                />
                            ) : (
                                <div className="relative min-h-[300px] flex items-center justify-center">
                                    <span className="absolute text-gray-400 text-xl font-semibold opacity-30 select-none">
                                        No User selected.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </div>
    )
}

export default AccessManagement
