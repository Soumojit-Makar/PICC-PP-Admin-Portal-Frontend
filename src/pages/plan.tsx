import { useEffect, useState } from "react";
import { PlanService } from "@/services/plan.service";
import { ComponentService } from "@/services/component.service";
import {
  PlanColumnGrid,
  PlanCompMappingColumnGrid,
  getActionColumn,
} from "@/shared/config/grid.config";
import { PlanForm, PlanCompMappingForm } from "@/shared/config/input.cofig";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import Modal from "@/widgets/modal";
import { useLoader } from "../contexts/loader.context";

const PlanManagement = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [rowToEdit, setRowToEdit] = useState<any>(null);
  const [formMode, setFormMode] = useState<"PLAN" | "PLAN_COMP" | "PLAN_COMP_EDIT">("PLAN");

  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [planAccounts, setPlanAccounts] = useState<string[]>([]);

  const { showLoader, hideLoader } = useLoader();

  const loadAll = async () => {
    showLoader();
    try {
      const planRes = await PlanService.getAllPlans();
      setPlans(planRes || []);
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to load data")();
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      const updated = (plans || []).find((p: any) => p.hostPlanid === selectedPlan.hostPlanid);
      if (updated) setSelectedPlan(updated);
    }
  }, [plans]);

  const buildPlanCompFormConfig = (isEdit: boolean, comps: any[] = components, grps: any[] = groups) => {
    let availableComps = comps || [];
    if (!isEdit && selectedPlan?.planComps) {
      const mappedCompIds = selectedPlan.planComps.map((pc: any) => pc.compId);
      availableComps = availableComps.filter((c) => !mappedCompIds.includes(c.compId));
    }

    const compOptions = availableComps
      .filter((c: any) => !c.compStatus || c.compStatus.toLowerCase() === "active")
      .map((c: any) => ({ label: `${c.compName} (${c.compId})`, value: c.compId }));
    const groupOptions = (grps || []).map((g) => ({
      label: g.compGroupTitle,
      value: g.compGroupId,
    }));
    return PlanCompMappingForm.map((f: any) => {
      if (f.name === "compId")
        return { ...f, options: compOptions, isDisabled: isEdit };
      if (f.name === "compGroupId") return { ...f, options: groupOptions };
      return f;
    });
  };

  const openPlanModal = (row?: any) => {
    setFormMode("PLAN");
    setRowToEdit(row || null);
    setFormConfig(PlanForm);
    setModalTitle(row ? `Update Plan: ${row.hostPlanName}` : "Create New Plan");
    setIsModalOpen(true);
  };

  const openPlanCompModal = async (row?: any) => {
    let comps = components;
    let grps = groups;

    if (comps.length === 0 || grps.length === 0) {
      showLoader();
      try {
        const [compRes, groupRes] = await Promise.all([
          comps.length === 0 ? ComponentService.getAllComponents() : Promise.resolve(comps),
          grps.length === 0 ? PlanService.getAllPlanCompGroups() : Promise.resolve(grps),
        ]);
        comps = compRes || [];
        grps = groupRes || [];
        setComponents(comps);
        setGroups(grps);
      } catch (err: any) {
        alertAction("error", err?.message || "Failed to load components or groups")();
        hideLoader();
        return;
      }
      hideLoader();
    }

    const isEdit = !!row;
    setFormMode(isEdit ? "PLAN_COMP_EDIT" : "PLAN_COMP");
    setRowToEdit(row || null);
    setFormConfig(buildPlanCompFormConfig(isEdit, comps, grps));
    setModalTitle(row ? `Update Plan Component Mapping` : "Map Component to Plan");
    setIsModalOpen(true);
  };

  const handlePlanSubmit = async (formData: any) => {
    showLoader();
    try {
      if (rowToEdit) {
        await PlanService.updatePlan(rowToEdit.hostPlanid, { ...rowToEdit, ...formData });
        alertAction("success", "Plan updated successfully")();
      } else {
        await PlanService.createPlan(formData);
        alertAction("success", "Plan created successfully")();
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to save plan")();
    } finally {
      hideLoader();
    }
  };

  const handlePlanCompSubmit = async (formData: any) => {
    if (!selectedPlan) return;
    showLoader();
    try {
      if (rowToEdit) {
        await PlanService.updatePlanComp(selectedPlan.hostPlanid, rowToEdit.hostRegPlanId, formData);
        alertAction("success", "Plan component mapping updated successfully")();
      } else {
        await PlanService.createPlanComp(selectedPlan.hostPlanid, formData);
        alertAction("success", "Component mapped to plan successfully")();
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to save plan component mapping")();
    } finally {
      hideLoader();
    }
  };

  const handleDeletePlan = async (row: any) => {
    showLoader();
    try {
      await PlanService.deletePlan(row.hostPlanid);
      alertAction("success", "Plan deactivated successfully")();
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to delete plan")();
    } finally {
      hideLoader();
    }
  };

  const handleViewPlanDetails = async (row: any) => {
    showLoader();
    try {
      const accounts = await PlanService.getAccountsByPlan(row.hostPlanid);
      setPlanAccounts(accounts || []);
      setModalTitle(`Accounts using Plan: ${row.hostPlanName}`);
      setIsAccountsModalOpen(true);
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to load accounts for this plan")();
    } finally {
      hideLoader();
    }
  };

  const handleDeletePlanComp = async (row: any) => {
    if (!selectedPlan) return;
    showLoader();
    try {
      await PlanService.deletePlanComp(selectedPlan.hostPlanid, row.hostRegPlanId);
      alertAction("success", "Plan component mapping deactivated successfully")();
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to delete plan component mapping")();
    } finally {
      hideLoader();
    }
  };

  const planRows = (plans || []).map((p) => ({ ...p, id: p.hostPlanid }));
  const planCompRows = (selectedPlan?.planComps || []).map((c: any) => ({ ...c, id: c.hostRegPlanId }));

  return (
    <div className="h-full flex flex-col gap-6 p-4 overflow-y-auto">
      {/* Plans Grid */}
      <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
        <div className="flex justify-between items-center p-4 pl-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Plans</h1>
          <button
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
            onClick={() => openPlanModal()}
          >
            Create New Plan
          </button>
        </div>
        <div style={{ height: "40vh" }}>
          <NNPGrid
            rows={planRows}
            columns={[
              ...PlanColumnGrid,
              getActionColumn({
                onEdit: openPlanModal,
                onDelete: handleDeletePlan,
                onDetails: handleViewPlanDetails,
                gridType: "PLAN",
              }),
            ]}
            isColumselectionDisabled={false}
            getRowId={(row: any) => row.hostPlanid}
            onSelectionChange={(rows) => {
              if (rows?.length === 1) setSelectedPlan(rows[0]);
            }}
          />
        </div>
      </div>

      {/* Plan Components Mapping Grid */}
      <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
        <div className="flex justify-between items-center p-4 pl-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Plan Components {selectedPlan ? `- ${selectedPlan.hostPlanName}` : ""}
          </h1>
          {selectedPlan && (
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
              onClick={() => openPlanCompModal()}
            >
              Map Component to Plan
            </button>
          )}
        </div>
        <div style={{ height: "35vh" }}>
          <NNPGrid
            rows={planCompRows}
            columns={[
              ...PlanCompMappingColumnGrid,
              getActionColumn({
                onEdit: openPlanCompModal,
                onDelete: handleDeletePlanComp,
                gridType: "PLAN_COMP",
              }),
            ]}
            isColumselectionDisabled={true}
            getRowId={(row: any) => row.hostRegPlanId}
          />
        </div>
        {!selectedPlan && (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
            Select a plan row above to view / manage its component mappings.
          </p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <DynamicForm
          inputs={formConfig}
          layout="double"
          onSubmit={formMode === "PLAN" ? handlePlanSubmit : handlePlanCompSubmit}
          defaultValues={rowToEdit || {}}
        />
      </Modal>

      <Modal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} title={modalTitle}>
        <div className="p-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md">
          {planAccounts.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {planAccounts.map((acc, index) => (
                <li key={index} className="text-sm font-medium">{acc}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No accounts found for this plan.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PlanManagement;
