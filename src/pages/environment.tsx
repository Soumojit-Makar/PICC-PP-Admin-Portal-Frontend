// src/pages/environment.tsx
import { EnvironmentService } from "@/services/environment.service";
import {
  ActivityLogColumnGrid,
  ChildElementColumnGrid,
  ElementColumnGrid,
  EnvColumnGrid,
  FeatureElementColumnGrid,
  getActionColumn,
} from "@/shared/config/grid.config";
import { EnvFeaturesForm, FeatureElementForm, ElementDetailForm, ChildElementForm } from "@/shared/config/input.cofig";
import { ActivityLogModel } from "@/shared/types/activityLogs";
import { EnvFeature } from "@/shared/types/envfeatures";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import EnvironmentalFeatures from "@/widgets/environmentalFeatures";
import Modal from "@/widgets/modal";
import { useEffect, useState } from "react";
import { useLoader } from "../contexts/loader.context";

type TrailItem = {
  level: number;         // 0=env,1=feature,2=element,3=elementDtl,4=child
  idKey: string;
  id: string;
  value: string;         // the id value (usually same as id)
  parentIdKey?: string;
  parentId?: string;
};
const EnvForm = [
  {
    type: 'text',
    name: 'envId',
    label: 'Environment Name / ID',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'envName',
    label: 'Display Name',
    placeholder: 'Enter Display Name',
  },
  {
    type: 'textarea',
    name: 'envDesc',
    label: 'Description',
    placeholder: 'Enter Description',
  },
  {
    type: 'text',
    name: 'envEmail',
    label: 'Admin Email',
    placeholder: 'Enter Admin Email',
  },
  {
    type: 'text',
    name: 'envRepo',
    label: 'Repository URL',
    placeholder: 'Enter Repository URL',
  },

  {
    type: 'text',
    name: 'envIp',
    label: 'IP Address',
    placeholder: 'Enter IP Address',
  },
  {
    type: "text",
    name: 'envCustName',
    label: "Customer Name",
    placeholder: "Enter Customer Name",
    // isDisabled: true
  },
  {
    type: "text",
    name: 'envCustId',
    label: "Customer ID",
    placeholder: "Enter Customer ID",
    // isDisabled: true
  },
  {
    type: "text",
    name: 'envStatus',
    label: "Status",
    placeholder: "Enter Status",
    isDisabled: true
  },

  {
    type: "text",
    name: 'envFapId',
    label: "FAP ID",
    placeholder: "Enter FAP ID",
    // isDisabled: true
  },
  {
    type: "text",
    name: 'envFatNo',
    label: "FAT Number",
    placeholder: "Enter FAT Number",
    // isDisabled: true
  },
  {
    type: "text",
    name: 'envTypeId',
    label: "Type ID",
    placeholder: "Enter Type ID",
    isDisabled: true
  },
  {
    type: "text",
    name: 'envTenantId',
    label: "Tenant ID",
    placeholder: "Enter Tenant ID",
    // isDisabled: true
  },
  {
    type: "text",
    name: 'envDomain',
    label: "Env Domain",
    placeholder: "Enter Domain",
    // isDisabled: true
  },
  {
    type: "text",
    name: "envCode",
    label: "Env Code",
    placeholder: "Enter Env Code"
  }
];

type EnvData = {
  envId: string;
  envFeatures: EnvFeature[];
  envCode: string;
  envTypeId: string;
  envCustId: string;
  envCustName: string;
  envDesc: string;
  envTenantId: string;
  envFapId: string;
  envFatNo: string;
  envEmail: string;
  envStatus: string;
  envNamespace: string[];
  envDomain: string;
  envRepo: string;
  envIp: string
};

const EnvironmentManagement = () => {
  const [columDef, setColumDef] = useState<any>();
  const [data, setData] = useState<any>(null);

  // now envData holds full array of environments (envId + envFeatures)
  const [envData, setEnvData] = useState<EnvData[]>([]);

  const [activityLogs, setActivityLogs] = useState<ActivityLogModel[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState<any>();
  const [title, setTitle] = useState<any>();
  const [formConfig, setFormConfig] = useState<any>();
  const [selectedGridType, setSelectedGridType] = useState<any>();
  const [envID, setEnv] = useState<any>(); // selected envId (for add/update)
  const [trail, setTrail] = useState<TrailItem[]>([]);

  // ==========================================
  // NEW: REGISTRATION MODAL STATES
  // ==========================================
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regFormConfig, setRegFormConfig] = useState<any[]>([]);

  // UI States for dynamic headers/buttons
  const [buttonText, setButtonText] = useState<string>("");
  const [gridTitle, setGridTitle] = useState<string>("Environments");

  const { showLoader, hideLoader } = useLoader();

  type GridType = "ENV_FEATURES" | "FEATURE_ELEMENTS" | "ELEMENT" | "CHILD_ELEMENT" | "ENV";

  // ---------------------------------------------------------------------------
  // Load all envs (no filter). Keep full response structure.
  const getEnvFeatures = async () => {
    const res = await EnvironmentService.getEnvironmentFeatures();
    if (res) {
      // res is expected to be array of { envId, envFeatures }
      setEnvData(res || []);
    }
  };

  const getActivityLogs = async (envId: string) => {
    const res = await EnvironmentService.getActivityLogs(envId);
    setActivityLogs(res || []);
  };

  // ==========================================
  // NEW: FETCH REGISTRATION DROPDOWN DATA
  // ==========================================
  const openRegistrationModal = async () => {
    showLoader();
    try {
      // 1. Fetch data from your new Service methods!
      const [countryRes, orgRes] = await Promise.all([
        EnvironmentService.getCountries(),
        EnvironmentService.getOrgCategories()
      ]);

      // 2. Map Country options
      const countryOptions = countryRes.map((c: any) => ({
        label: `${c.taxCountry} (${c.countryCode})`,
        value: c.countryCode
      }));

      // 3. Map Org Category options
      const orgOptions = orgRes["org-category"].map((org: string) => ({
        label: org,
        value: org
      }));

      // 4. Build the dynamic form configuration
      const registrationConfig = [
        { name: 'accName', label: 'Account Name', type: 'text', required: true },
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'text', required: true },
        { name: "platformPurpose", label: "Platform Purpose", type: "text", required: true },
        { name: 'orgCategory', label: 'Organization Category', type: 'select', options: orgOptions, required: true },
        { name: 'country', label: 'Country', type: 'select', options: countryOptions, required: true }
      ];

      setRegFormConfig(registrationConfig);
      setIsRegModalOpen(true);
    } catch (error) {
      console.error("Error fetching registration data:", error);
      alertAction('error', 'Failed to load registration form data.')();
    } finally {
      hideLoader();
    }
  };

  const handleRegistrationSubmit = async (formData: any) => {
    showLoader();
    try {
      console.log("Submitting New Registration:", formData);
      // TODO: Replace this timeout with your actual API call to save the registration

      await new Promise(resolve => setTimeout(resolve, 800)); // Mock network delay
      alertAction('success', 'Account Registered Successfully!')();
      setIsRegModalOpen(false);

      // Refresh environment list
      await getEnvFeatures();
    } catch (err) {
      alertAction('error', 'Failed to register account.')();
    } finally {
      hideLoader();
    }
  };


  const handleAddEdit = (row: any, gridType?: GridType) => {
    let prefix = "Create";
    if (row) {
      setRowToEdit(row);
      prefix = "Update";
    } else setRowToEdit(null);

    switch (gridType) {
      case "ENV_FEATURES":
        setFormConfig(EnvFeaturesForm);
        setTitle(`${prefix} Environment Feature`);
        break;

      case "FEATURE_ELEMENTS":
        setFormConfig(FeatureElementForm);
        setTitle(`${prefix} Feature Element`);
        break;

      case "ELEMENT":
        setFormConfig(ElementDetailForm);
        setTitle(`${prefix} Element Detail`);
        break;

      case "CHILD_ELEMENT":
        setFormConfig(ChildElementForm);
        setTitle(`${prefix} Child Element Detail`);
        break;

      case "ENV":
        if (!row) {
          // FIRED: User clicked "Create New Environment"
          openRegistrationModal();
        } else {
          // Triggered by the "E" (Edit) action button on a specific row
          setFormConfig(EnvForm);
          setTitle(`Update Environment Details: ${row.envId}`);
          setRowToEdit(row);
          setIsModalOpen(true);
        }

        return;
    }
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Submit handler: now uses trail to determine parent IDs.
  const handleFormSubmit = async (formData: any, isDel?: boolean) => {

    const envTrail = trail.find((t) => t.level === 1);
    const featureTrail = trail.find((t) => t.level === 2);
    const elementTrail = trail.find((t) => t.level === 3);
    const elementDtlTrail = trail.find((t) => t.level === 4);

    showLoader();
    try {
      switch (selectedGridType) {
        case "ENV_FEATURES":
          // env-level parent must be envTrail
          if (isDel) {
            await EnvironmentService.deleteEnvFeatures(formData.feaId);
          } else if (formData.feaId) {
            // update - include envId if available
            await EnvironmentService.updateEnvFeatures(formData.feaId, { ...formData, envId: envTrail?.value ?? envID });
          } else {
            // add - preserve envId of selected environment
            await EnvironmentService.addEnvFeatures({
              isAssigned: true,
              assigned: true,
              ...formData,
              envId: envTrail?.value ?? envID
            });
          }
          break;

        case "FEATURE_ELEMENTS":
          if (isDel) await EnvironmentService.deleteFeatureElement(formData.elementId);
          else if (formData.elementId)
            await EnvironmentService.updateFeatureElement(formData.elementId, {
              ...formData,
              ...(featureTrail ? { featureId: featureTrail.value } : {}),
            });
          else
            await EnvironmentService.addFeatureElement({
              isAssigned: true,
              assigned: true,
              ...formData,
              ...(featureTrail ? { featureId: featureTrail.value } : {}),
            });
          break;

        case "ELEMENT":
          if (isDel) await EnvironmentService.deleteElement(formData.elementDtlId);
          else if (formData.elementDtlId)
            await EnvironmentService.updateElement(formData.elementDtlId, {
              ...formData,
              ...(elementTrail ? { elementId: elementTrail.value } : {}),
            });
          else
            await EnvironmentService.addElement({
              isAssigned: true,
              assigned: true,
              ...formData,
              ...(elementTrail ? { elementId: elementTrail.value } : {}),
            });
          break;

        case "CHILD_ELEMENT":
          if (isDel) await EnvironmentService.deleteChildElement(formData.chElementDtlId);
          else if (rowToEdit && formData.chElementDtlId)
            await EnvironmentService.updateChildElement(formData.chElementDtlId, {
              ...formData,
              ...(elementDtlTrail ? { elementId: elementDtlTrail.value } : {}),
            });
          else {
            let assignedId = formData.chElementDtlId?.trim();
            const gridRows = Array.isArray(data) ? data : [];
            const isDuplicate = assignedId && gridRows.some((r: any) => r.chElementDtlId === assignedId || r.id === assignedId);

            if (!assignedId || isDuplicate) {
              const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
              assignedId = assignedId ? `${assignedId}_${suffix}` : `CH_${Date.now()}_${suffix}`;
            }

            await EnvironmentService.addChildElement({
              isAssigned: true,
              assigned: true,
              ...formData,
              chElementDtlId: assignedId,
              ...(elementDtlTrail ? { elementId: elementDtlTrail.value } : {}),
            });
          }
          break;
        case "ENV":
          if (isDel) {
            // await EnvironmentService.deleteEnvironment(data.envId);
          } else {
            // Call our new API method to save changes to the server
            await EnvironmentService.updateEnvironment(data.envId, data);
          }
          break;

        default:
          break;
      }

      // refresh after any change
      await getEnvFeatures();
    } catch (err) {
      alertAction(
        "error",
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      )();
    } finally {
      hideLoader();
      setIsModalOpen(false);
    }
  };

  const handleDelete = (row: any) => {
    handleFormSubmit(row, true);
  };

  // ---------------------------------------------------------------------------
  const getGrid = (envId: string, id: string, seq: number, updatedData?: any) => {
    // keep selected envId for add/update convenience
    if (id !== "__header__") {
      if (envId !== envID) {
        getActivityLogs(envId);
        setEnv(envId);
      }
    }
    // If toggling child assigned (checkbox) — seq 4
    if (seq === 5 && typeof updatedData !== "undefined") {
      // update assigned flag in local copy and persist
      const newData = structuredClone(
        // flatten: collect all envFeatures into single list for edit convenience
        envData.flatMap((e) => e.envFeatures || [])
      ) as EnvFeature[];

      for (const feature of newData || []) {
        for (const el of feature.featureElements || []) {
          for (const detail of el.elementDetails || []) {
            for (const child of detail.childElementDtls || []) {
              if (child.chElementDtlId === id) {
                child.isAssigned = updatedData;
                // call API to update child (you used handleFormSubmit for this before)
                handleFormSubmit(child, false);
                // update local state by replacing that child in envData
                // we'll refresh from server after API call, so just break
                return;
              }
            }
          }
        }
      }
      return;
    }

    // configMap: Updated with accurate Titles and Button Texts from the Mockups
    const configMap: Record<
      number,
      { colDef: any; childKey?: string; idKey: string; gridType: string; buttonText: string; gridTitle: string }
    > = {
      0: {
        colDef: [
          // Updated to match the "Environments" columns from the mockup
          { field: "envId", headerName: "Name", flex: 1 },
          { field: "envDesc", headerName: "Description", flex: 1.5 },
          { field: "envEmail", headerName: "Admin User", flex: 1 },
          { field: "envRepo", headerName: "Repository", flex: 1 },
        ],
        childKey: "envFeatures",
        idKey: "envId",
        gridType: "ENV",
        gridTitle: "Environments",
        buttonText: "Create New Environment",
      },
      1: {
        colDef: EnvColumnGrid,
        childKey: "featureElements",
        idKey: "feaId",
        gridType: "ENV_FEATURES",
        gridTitle: "Environment Features",
        buttonText: "Create New Feature",
      },
      2: {
        colDef: FeatureElementColumnGrid,
        childKey: "elementDetails",
        idKey: "elementId",
        gridType: "FEATURE_ELEMENTS",
        gridTitle: "Environment Feature Elements",
        buttonText: "Create New Element",
      },
      3: {
        colDef: ElementColumnGrid,
        childKey: "childElementDtls",
        idKey: "elementDtlId",
        gridType: "ELEMENT",
        gridTitle: "Environment Element Details",
        buttonText: "Create New Element Detail",
      },
      4: {
        colDef: ChildElementColumnGrid,
        childKey: "",
        idKey: "chElementDtlId",
        gridType: "CHILD_ELEMENT",
        gridTitle: "Child Element Details",
        buttonText: "Create New Child Element",
      },
    };

    const cfg = configMap[seq];
    if (!cfg) return;

    setButtonText(cfg.buttonText);
    setGridTitle(cfg.gridTitle);
    setSelectedGridType(cfg.gridType);

    let rows: any[] = [];
    let parentId: string | null = null;
    let parentIdKey: string | null = null;

    if (seq === 0) {
      // show env list
      rows =
        envData?.map((env) => ({
          ...env,
          id: env[cfg.idKey],
        })) ?? [];
    } else if (seq === 1) {
      // ENV_FEATURES for selected environment id
      const env = envData.find((e) => e.envId === id);
      parentId = id;
      parentIdKey = "envId";
      rows =
        env?.envFeatures?.map((f) => ({
          ...f,
          id: f[cfg.idKey],
        })) ?? [];
    } else {
      // seq >= 2: traverse starting from envData to find the parent chain
      const traverse = (items: any[], currentSeq: number): any[] => {
        const parentCfg = configMap[currentSeq];
        const childCfg = configMap[currentSeq + 1];

        if (currentSeq === seq - 1) {
          // find the parent in this list
          const found = items.find((i) => i[parentCfg.idKey] === id);

          if (found) {
            parentId = found[parentCfg.idKey];
            parentIdKey = parentCfg.idKey;
          }

          return found?.[parentCfg.childKey ?? ""]?.map((child: any) => ({
            ...child,
            id: child[childCfg.idKey],
          }));
        }

        for (const i of items) {
          if (i[parentCfg.childKey ?? ""]) {
            const res = traverse(i[parentCfg.childKey!], currentSeq + 1);
            if (res) return res;
          }
        }
        return [];
      };

      const selectedItem = envData.filter(e => e.envId === envId);
      rows = traverse(selectedItem as any[], 0) || [];
    }

    // Update trail
    setTrail((prev) => {
      const newTrail = [...prev];
      const item: TrailItem = {
        level: seq,
        idKey: cfg.idKey,
        id,
        value: parentId ?? id,
        parentIdKey: parentIdKey,
        parentId: parentId,
      };

      if (seq === 0) {
        return [item];
      }

      if (seq < prev.length) {
        return [...newTrail.slice(0, seq), item];
      }

      return [...newTrail, item];
    });

    setColumDef([
      ...cfg.colDef,
      getActionColumn({
        onEdit: handleAddEdit,
        onDelete: handleDelete,
        gridType: cfg.gridType,
      }),
    ]);
    setData(rows);
  };

  const initialize = async () => {
    showLoader();
    try {
      await getEnvFeatures();
    } catch (err) {
      alertAction(
        "error",
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      )();
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (envData) {
      // show environment list first
      getGrid('', "__header__", 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envData]);

  // ---------------------------------------------------------------------------
  return (
    <>
      <div className="flex h-[60vh]">
        {/* Sidebar */}
        <div className="w-[25rem] h-inherit">
          <EnvironmentalFeatures
            data={envData}
            onSelect={(envId, id, seq, updatedData) => {
              getGrid(envId, id, seq, updatedData);
            }}
            showCheckboxes={false}
          />
        </div>

        {/* Main Content */}
        {/* FIX: Replaced explicit light backgrounds with dark:bg-transparent so your global theme applies */}
        <div className="flex-1 bg-gray-100 dark:bg-transparent p-6 pt-0 overflow-y-auto">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-4 pl-0">
              {/* FIX: Forced text to be white in dark mode */}
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{gridTitle}</h1>
              {buttonText && (
                selectedGridType === "ENV" ? (
                  <a
                    href={`${(import.meta.env.VITE_AUTH_HOST as string || import.meta.env.VITE_AUTH as string || '').replace(/\/$/, '')}-login/register?admin-create-env=true`}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors inline-block text-center"
                  >
                    {buttonText}
                  </a>
                ) : (
                  <button
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
                    onClick={() => handleAddEdit(null, selectedGridType)}
                  >
                    {buttonText}
                  </button>
                )
              )}
            </div>
            {/* FIX: Changed white grid container to dark gray in dark mode */}
            <div className="flex-1 bg-white dark:bg-[#1e1e1e] border dark:border-gray-700">
              {columDef && (
                <NNPGrid rows={data} columns={columDef} isColumselectionDisabled={true} />
              )}
            </div>
          </div>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
            <DynamicForm inputs={formConfig ?? []} layout="double" onSubmit={handleFormSubmit} defaultValues={rowToEdit || {}} />
          </Modal>

          {/* NEW: Registration Modal */}
          <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="Create Account Registration">
            <div className="p-2">
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Register a new environment account without payment processing.
              </div>
              <DynamicForm
                inputs={regFormConfig}
                layout="double"
                onSubmit={handleRegistrationSubmit}
                defaultValues={{}}
              />
            </div>
          </Modal>

        </div>
      </div>

      {/* Environment Audit Logs */}
      {/* FIX: Handled the background and border for the bottom grid */}
      <div className="bg-gray-100 dark:bg-transparent p-6 pt-0 border border-[gainsboro] dark:border-gray-700 rounded-[2px] mt-5">
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center">
            {/* FIX: Forced text to be white in dark mode */}
            <h1 className="text-xl font-bold text-gray-800 dark:text-white p-4 pl-0">Environment Audit Logs</h1>
          </div>
          <div className="mt-2" style={{ height: "70vh" }}>
            <NNPGrid
              rows={activityLogs}
              columns={ActivityLogColumnGrid}
              isColumselectionDisabled={true}
              getRowId={(row: ActivityLogModel) => `${row.actId}_${row.userId}`}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default EnvironmentManagement;