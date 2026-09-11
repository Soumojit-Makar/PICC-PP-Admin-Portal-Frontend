import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserAccessService } from '@/services/user_access.service';
import DynamicForm from '@/widgets/dynamicForm';
import { UserForm } from '@/shared/config/input.cofig';
import { UserFormModel } from '@/shared/models/user';
import EnvironmentalFeatures from '@/widgets/environmentalFeatures';
import { EnvFeature } from '@/shared/types/envfeatures';
import { useLoader } from "../contexts/loader.context";
import { alertAction } from '@/shared/utils';
import { RegistrationService } from '@/services/registration.service';
import { showConfirmDialog } from '@/widgets/confirmDialog';

const UserAccessManagement = () => {
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const methods = useForm({ mode: 'onChange' });


    const [users, setAllUsers] = useState<any>([]);
    const [rolesList, setRolesList] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userFormConfig, setUserFormConfig] = useState<any>(UserForm)
    const [allAccounts, setAllAccounts] = useState<any>([]);
    const [accList, setAccList] = useState<any>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    const [envFeatures, setEnvFeatures] = useState<any>([]);
    const { showLoader, hideLoader } = useLoader();
    const [accSearchText, setAccSearchText] = useState("");

    const getUsers = async (accName: string) => {
        const res = await UserAccessService.getUsersByAccountName(accName)
        if (res) setAllUsers(res)
    }

    const getAccounts = async () => {
        const res = await RegistrationService.getAllAccounts();
        setAllAccounts(res.content || []);
    }

    const getUserRoles = async (configToUpdate?: any) => {
        const res = await UserAccessService.getUserRoles()
        setRolesList(res || []);
        const userOptions = res.map((user): any => ({
            label: user.roleName,
            value: user.roleId
        }))
        const baseConfig = configToUpdate ?? userFormConfig;
        const updatedConfig = baseConfig.map((element: any) => {
            if (element.name === "roleId") {
                return { ...element, options: userOptions };
            }
            return element;
        });
        setUserFormConfig(updatedConfig)
    }

    const onUserSelection = (_event: React.SyntheticEvent, value: any, _reason: string) => {
        if (value) {
            setSelectedUser(value);
            setIsNewUser(false);
            const cleanConfig = UserForm.filter((element: any) => element.name !== "password" && element.name !== "retypePassword");
            const updatedConfig = cleanConfig.map((element: any) => {
                if (element.name === "userId" || element.name === "emailId") {
                    return { ...element, isDisabled: true };
                }
                return element;
            });
            getUserRoles(updatedConfig);
        } else {
            setSelectedUser(new UserFormModel());
            setIsNewUser(true);
            const cleanConfig = UserForm.filter((element: any) => element.name !== "password" && element.name !== "retypePassword");
            const updatedConfig = [
                ...cleanConfig.map((element: any) => {
                    if (element.name === "userId" || element.name === "emailId") {
                        return { ...element, isDisabled: false };
                    }
                    return element;
                }),
                {
                    type: 'password',
                    name: 'password',
                    label: 'Password',
                    placeholder: 'Enter Password',
                    validation: {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                            message: 'Password must include uppercase, lowercase, and a number'
                        }
                    }
                },
                {
                    type: 'password',
                    name: 'retypePassword',
                    label: 'Retype Password',
                    placeholder: 'Enter Retype Password',
                    validation: {
                        required: 'Please retype your password',
                        validate: (value: string, formValues: any) => {
                            if (value !== formValues.password) {
                                return 'Passwords do not match';
                            }
                            return true;
                        },
                    }
                }
            ];
            getUserRoles(updatedConfig);
        }
    }

    const handleCreateNewUser = () => {
        setSelectedUser(new UserFormModel());
        setIsNewUser(true);
        const cleanConfig = UserForm.filter((element: any) => element.name !== "password" && element.name !== "retypePassword");
        const updatedConfig = [
            ...cleanConfig.map((element: any) => {
                if (element.name === "userId" || element.name === "emailId") {
                    return { ...element, isDisabled: false };
                }
                return element;
            }),
            {
                type: 'password',
                name: 'password',
                label: 'Password',
                placeholder: 'Enter Password',
                validation: {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                        message: 'Password must include uppercase, lowercase, and a number'
                    }
                }
            },
            {
                type: 'password',
                name: 'retypePassword',
                label: 'Retype Password',
                placeholder: 'Enter Retype Password',
                validation: {
                    required: 'Please retype your password',
                    validate: (value: string, formValues: any) => {
                        if (value !== formValues.password) {
                            return 'Passwords do not match';
                        }
                        return true;
                    },
                }
            }
        ];
        getUserRoles(updatedConfig);
    }


    useEffect(() => {
        if (!accSearchText) {
            setAccList(allAccounts);
            return;
        }
        const filtered = allAccounts.filter((acc: any) =>
            acc.accName.toLowerCase().includes(accSearchText.toLowerCase()) || acc.accId.toString().includes(accSearchText)
        );
        setAccList(filtered);
    }, [accSearchText, allAccounts]);


    const getGrid = (id: string, seq: number, updatedData?: any) => {
        if (seq == 5) {
            const newData = structuredClone(envFeatures);
            const updateChild = (items: EnvFeature[]) => {
                for (const feature of items) {
                    for (const el of feature.featureElements || []) {
                        for (const detail of el.elementDetails || []) {
                            for (const child of detail.childElementDtls || []) {
                                if (child.chElementDtlId === id) {
                                    child.isAssigned = updatedData; // ✅ update value
                                    return;
                                }
                            }
                        }
                    }
                }
            };

            updateChild(newData);
            setEnvFeatures(newData);
            return;
        }
    }

    const getEnvFeatures = async () => {
        if (!selectedUser?.userId) return;
        showLoader();
        try {
            const envId = selectedAccount?.accName || selectedUser?.envId;
            const res = await UserAccessService.getEnvFeaturesByUserId(selectedUser.userId, envId);
            const envfeature: any = res;
            setEnvFeatures(Array.isArray(envfeature) ? envfeature : [envfeature]);
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        }
        finally {
            hideLoader();
        }
    };

    useEffect(() => {
        if (selectedUser && selectedUser.userId) getEnvFeatures()
    }, [selectedUser])

    const getUserList = async (acc: any) => {
        setSelectedAccount(acc)
        if (!acc) {
            setAllUsers([]);
            setSelectedUser(null)
            setEnvFeatures([]);
            return;
        }
        showLoader();
        try {
            await getUsers(acc.accName)
            await getUserRoles()
        }
        catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        }
        finally {
            hideLoader();
        }
    }

    useEffect(() => {
        getAccounts()
    }, [])

    const handleFormSubmit = async (data: any) => {
        showLoader();
        try {
            const envId = selectedAccount?.accName || "";
            const selectedRole = rolesList.find((r: any) => r.roleId === data.roleId);
            let userType = "user";
            if (selectedRole) {
                if (selectedRole.roleName === "adminRole") {
                    userType = "admin";
                } else if (selectedRole.roleName === "superAdminRole") {
                    userType = "superAdmin";
                }
            }

            if (isNewUser) {
                const userData = {
                    ...data,
                    envId,
                    userType,
                    requestDate: new Date().toISOString(),
                    updateDate: new Date().toISOString(),
                    updateComment: "Initial user creation",
                    userStatus: data.userStatus || "active"
                };
                await UserAccessService.createUserV3(userData);
                alertAction("success", "User created successfully")();
            } else {
                const userData = {
                    ...data,
                    envId,
                    userType,
                    updateDate: new Date().toISOString(),
                    updateComment: "User updated"
                };
                await UserAccessService.updateUserRoles(data.userId, userData);
                alertAction("success", "User updated successfully")();
            }

            // Refresh user list for the active account
            if (selectedAccount) {
                await getUsers(selectedAccount.accName);
            }
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    }

    const handleFormTrigger = async (name: string, value: any) => {
        if ((name === 'userId' || name === 'emailId') && value && value.trim().length > 0) {
            try {
                const envId = selectedAccount?.accName || "";
                if (!envId) {
                    // No account selected yet — fall back to DB-only check
                    const exists = await UserAccessService.checkExists(value);
                    return exists === true || exists === 'true';
                }

                // V3: cross-system check
                const result: any = await UserAccessService.checkExistsAllSystems(value.trim(), envId);

                if (result?.existsInAny) {
                    // Build a human-readable message showing WHICH systems have the user
                    const found: string[] = [];
                    if (result.existsInDb)        found.push('Database');
                    if (result.existsInKeycloak)  found.push('Keycloak');
                    if (result.existsInRedmine)   found.push('Redmine');
                    if (result.existsInGitLab)    found.push('GitLab');
                    alertAction('warning',
                        `User "${value}" already exists in: ${found.join(', ')}`)();
                    return true; // signals DynamicForm to show "already taken" validation
                }
                return false;
            } catch (err) {
                console.error("Availability check failed", err);
                return false;
            }
        }
        return false;
    };

    const handleDeleteUser = () => {
        if (!selectedUser?.userId) return;
        showConfirmDialog({
            title: 'Confirm Deletion',
            message: `Are you sure you want to permanently delete user ${selectedUser.userId}? This will remove the user from Keycloak, GitLab, Redmine, and the Database.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'error',
            onConfirm: async () => {
                showLoader();
                try {
                    await UserAccessService.deleteUser(selectedUser.userId);
                    alertAction('success', 'User deleted successfully')();
                    setSelectedUser(null);
                    setEnvFeatures([]);
                    if (selectedAccount) {
                        await getUsers(selectedAccount.accName);
                    }
                } catch (err) {
                    alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
                } finally {
                    hideLoader();
                }
            }
        });
    };


    // ==========================================
    // NEW: Handle updating the user's tree access
    // ==========================================
    const handleUpdateAccess = async () => {
        if (!selectedUser?.userId) return;

        showLoader();
        try {
            const payload: any[] = [];
            const env = envFeatures[0];
            if (env && env.envFeatures) {
                for (const feature of env.envFeatures) {
                    for (const el of feature.featureElements || []) {
                        for (const detail of el.elementDetails || []) {
                            for (const child of detail.childElementDtls || []) {
                                if (child.isAssigned) {
                                    payload.push({
                                        userId: selectedUser.userId,
                                        envId: env.envId,
                                        chElmDetailId: child.chElementDtlId
                                    });
                                }
                            }
                        }
                    }
                }
            }
            // Pass the flat list of user access config to the backend
            await UserAccessService.updateUserAccess(selectedUser.userId, payload);
            alertAction('success', 'User access updated successfully!')();
        } catch (err) {
            alertAction('error', typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err))();
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="flex-1 bg-gray-100 dark:bg-transparent p-6 pt-0 overflow-y-auto">
            <div className="h-full flex flex-col">
                {/* Header (Top Nav Handled by Parent, spacing managed here) */}
                <div className="flex justify-between items-center mt-2 mb-4">
                    {/* Placeholder for alignment if needed */}
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col">
                        {/* FIX: Ensure labels turn white */}
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Account</label>
                        <Autocomplete
                            disablePortal
                            options={accList}
                            getOptionLabel={(option: any) => `${option.accId} - ${option.accName}`}
                            onInputChange={(_event, value) => setAccSearchText(value)}
                            onChange={(_event, value) => getUserList(value)}
                            sx={{ width: 300 }}
                            size="small"
                            renderInput={(params) => (
                                <TextField {...params} placeholder="Select Account" />
                            )}
                        />
                    </div>
                    <div className="flex flex-col">
                        {/* FIX: Ensure labels turn white */}
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">User</label>
                        <Autocomplete
                            disablePortal
                            options={users}
                            sx={{ width: 300 }}
                            size="small"
                            value={selectedUser}
                            getOptionLabel={(option: any) => option.userId || ''}
                            onChange={(event, value, reason) => onUserSelection(event, value, reason)}
                            renderInput={(params) => <TextField {...params} placeholder="Select User" />}
                        />
                    </div>
                </div>

                {/* Two Column Section */}
                <div className="grid grid-cols-2 gap-4 flex-1">

                    {/* LEFT PANE: User Details */}
                    {/* FIX: Replaced bg-white and border-gray-300 with dark mode equivalents */}
                    <div className="flex flex-col border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#1e1e1e] shadow-sm h-full">
                        {/* Blue Header */}
                        {/* FIX: Slightly darker blue header for dark mode */}
                        <div className="px-4 py-2 bg-[#5c8edb] dark:bg-[#3b6bb5] text-white font-semibold text-sm rounded-t">
                            User Details
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto flex flex-col">
                            {selectedUser ? (
                                <>
                                    <DynamicForm
                                        inputs={userFormConfig ?? []}
                                        layout="double"
                                        onSubmit={handleFormSubmit}
                                        defaultValues={selectedUser || {}}
                                        onTrigger={handleFormTrigger}
                                        formMethods={methods}
                                    />
                                    {/* Action Buttons */}
                                    <div className="mt-auto flex justify-end gap-3 pt-4">
                                        {!isNewUser && (
                                            <button
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded shadow-sm"
                                                onClick={handleDeleteUser}
                                                type="button"
                                            >
                                                Delete User
                                            </button>
                                        )}
                                        <button
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm"
                                            onClick={handleCreateNewUser}
                                            type="button"
                                        >
                                            Create New User
                                        </button>
                                    </div>
                                </>

                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                    <div className="font-semibold text-lg mb-4">Select a User or Create One</div>
                                    <button
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm"
                                        onClick={handleCreateNewUser}
                                    >
                                        Create New User
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: User Access Details */}
                    {/* FIX: Replaced bg-white and border-gray-300 with dark mode equivalents */}
                    <div className="flex flex-col border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#1e1e1e] shadow-sm h-full">
                        {/* Blue Header */}
                        <div className="px-4 py-2 bg-[#5c8edb] dark:bg-[#3b6bb5] text-white font-semibold text-sm rounded-t">
                            User Access Details
                        </div>

                        <div className="flex flex-col flex-1 p-4">
                            {/* FIX: Dark mode text and border colors */}
                            <div className="font-bold text-gray-700 dark:text-white text-sm mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                Environment Features
                            </div>

                            {selectedUser?.roleId ? (
                                <>
                                    {/* FIX: Dark mode border color */}
                                    <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 bg-transparent p-2 mb-4">
                                        <EnvironmentalFeatures
                                            data={envFeatures}
                                            onSelect={(id: any, seq: any, updatedData: any) => getGrid(id, seq, updatedData)}
                                            showCheckboxes={true}
                                            hideheader={true}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-auto">
                                        <button
                                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm"
                                            onClick={handleUpdateAccess}
                                        >
                                            Update Access
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 font-semibold text-lg border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    Select a User to view Access
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default UserAccessManagement;