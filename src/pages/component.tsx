import { useEffect, useState } from "react";
import { ComponentService } from "@/services/component.service";
import {
  ComponentColumnGrid,
  CompSpecColumnGrid,
  CompTemplateColumnGrid,
  getActionColumn,
} from "@/shared/config/grid.config";
import { ComponentForm, CompSpecForm } from "@/shared/config/input.cofig";
import { alertAction } from "@/shared/utils";
import NNPGrid from "@/widgets/dataGrid";
import DynamicForm from "@/widgets/dynamicForm";
import Modal from "@/widgets/modal";
import YamlEditor from "@/widgets/yamlEditor";
import { useLoader } from "../contexts/loader.context";

const ComponentManagement = () => {
  const [components, setComponents] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [rowToEdit, setRowToEdit] = useState<any>(null);
  const [formMode, setFormMode] = useState<"COMP" | "SPEC">("COMP");

  // Template modal state
  const [isTmplModalOpen, setIsTmplModalOpen] = useState(false);
  const [tmplRow, setTmplRow] = useState<any>(null);
  const [tmplForm, setTmplForm] = useState({
    tmplId: "",
    fileName: "",
    filePath: "",
    tmplType: "manifest",
    status: "Active",
    template: "",
  });

  const { showLoader, hideLoader } = useLoader();

  const loadAll = async () => {
    showLoader();
    try {
      const res = await ComponentService.getAllComponents();
      setComponents(res || []);
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to load components")();
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedComp) {
      const updated = (components || []).find((c: any) => c.compId === selectedComp.compId);
      if (updated) setSelectedComp(updated);
    }
  }, [components]);

  const openCompModal = (row?: any) => {
    setFormMode("COMP");
    setRowToEdit(row || null);
    setFormConfig(ComponentForm);
    setModalTitle(row ? `Update Component: ${row.compName}` : "Create New Component");
    setIsModalOpen(true);
  };

  const openSpecModal = (row?: any) => {
    setFormMode("SPEC");
    setRowToEdit(row || null);
    setFormConfig(CompSpecForm);
    setModalTitle(row ? `Update Spec: ${row.specName}` : "Create New Spec");
    setIsModalOpen(true);
  };

  const openTmplModal = (row?: any) => {
    setTmplRow(row || null);
    setTmplForm(
      row
        ? {
            tmplId: row.tmplId,
            fileName: row.fileName || "",
            filePath: row.filePath || "",
            tmplType: row.tmplType || "manifest",
            status: row.status || "Active",
            template: row.template || "",
          }
        : {
            tmplId: "",
            fileName: "",
            filePath: "",
            tmplType: "manifest",
            status: "Active",
            template: "# Enter YAML template content...",
          }
    );
    setIsTmplModalOpen(true);
  };

  const handleCompSubmit = async (formData: any) => {
    showLoader();
    try {
      if (rowToEdit) {
        await ComponentService.updateComponent(rowToEdit.compId, formData);
        alertAction("success", "Component updated successfully")();
      } else {
        await ComponentService.createComponent(formData);
        alertAction("success", "Component created successfully")();
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to save component")();
    } finally {
      hideLoader();
    }
  };

  const handleSpecSubmit = async (formData: any) => {
    if (!selectedComp) return;
    showLoader();
    try {
      if (rowToEdit) {
        await ComponentService.updateCompSpec(selectedComp.compId, rowToEdit.specid, formData);
        alertAction("success", "Spec updated successfully")();
      } else {
        await ComponentService.createCompSpec(selectedComp.compId, formData);
        alertAction("success", "Spec created successfully")();
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to save spec")();
    } finally {
      hideLoader();
    }
  };

  const handleTmplSubmit = async () => {
    if (!selectedComp) return;
    showLoader();
    try {
      if (tmplRow) {
        await ComponentService.updateCompTemplate(selectedComp.compId, tmplRow.tmplId, tmplForm);
        alertAction("success", "Template updated successfully")();
      } else {
        await ComponentService.createCompTemplate(selectedComp.compId, tmplForm);
        alertAction("success", "Template created successfully")();
      }
      setIsTmplModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to save template")();
    } finally {
      hideLoader();
    }
  };

  const handleDeleteComp = async (row: any) => {
    showLoader();
    try {
      await ComponentService.deleteComponent(row.compId);
      alertAction("success", "Component deactivated successfully")();
      if (selectedComp?.compId === row.compId) setSelectedComp(null);
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to delete component")();
    } finally {
      hideLoader();
    }
  };

  const handleDeleteSpec = async (row: any) => {
    if (!selectedComp) return;
    showLoader();
    try {
      await ComponentService.deleteCompSpec(selectedComp.compId, row.specid);
      alertAction("success", "Spec deactivated successfully")();
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to delete spec")();
    } finally {
      hideLoader();
    }
  };

  const handleDeleteTmpl = async (row: any) => {
    if (!selectedComp) return;
    showLoader();
    try {
      await ComponentService.deleteCompTemplate(selectedComp.compId, row.tmplId);
      alertAction("success", "Template deactivated successfully")();
      await loadAll();
    } catch (err: any) {
      alertAction("error", err?.message || "Failed to delete template")();
    } finally {
      hideLoader();
    }
  };

  const [compSpecs, setCompSpecs] = useState<any[]>([]);
  const [compTemplates, setCompTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (selectedComp?.compId) {
      Promise.all([
        ComponentService.getCompSpecs(selectedComp.compId).catch(() => selectedComp.specs || []),
        ComponentService.getCompTemplates(selectedComp.compId).catch(() => selectedComp.templates || []),
      ]).then(([specs, templates]) => {
        setCompSpecs(specs || []);
        setCompTemplates(templates || []);
      });
    } else {
      setCompSpecs([]);
      setCompTemplates([]);
    }
  }, [selectedComp?.compId, components]);

  const compRows = (components || []).map((c) => ({ ...c, id: c.compId }));
  const specRows = (compSpecs.length > 0 ? compSpecs : selectedComp?.specs || [])
    .filter((s: any) => !s.compstatus || s.compstatus.toLowerCase() === "active")
    .map((s: any) => ({ ...s, id: s.specid }));
  const tmplRows = (compTemplates.length > 0 ? compTemplates : selectedComp?.templates || [])
    .filter((t: any) => !t.status || t.status.toLowerCase() === "active")
    .map((t: any) => ({ ...t, id: t.tmplId }));

  return (
    <div className="h-full flex flex-col gap-6 p-4 overflow-y-auto">
      {/* Components Grid */}
      <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
        <div className="flex justify-between items-center p-4 pl-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Components</h1>
          <button
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
            onClick={() => openCompModal()}
          >
            Create New Component
          </button>
        </div>
        <div style={{ height: "40vh" }}>
          <NNPGrid
            rows={compRows}
            columns={[
              ...ComponentColumnGrid,
              getActionColumn({
                onEdit: openCompModal,
                onDelete: handleDeleteComp,
                gridType: "COMP",
              }),
            ]}
            isColumselectionDisabled={false}
            getRowId={(row: any) => row.compId}
            onSelectionChange={(rows) => {
              if (rows?.length === 1) setSelectedComp(rows[0]);
            }}
          />
        </div>
      </div>

      {/* Specs Grid */}
      <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
        <div className="flex justify-between items-center p-4 pl-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Component Specs {selectedComp ? `- ${selectedComp.compName}` : ""}
          </h1>
          {selectedComp && (
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
              onClick={() => openSpecModal()}
            >
              Create New Spec
            </button>
          )}
        </div>
        <div style={{ height: "30vh" }}>
          <NNPGrid
            rows={specRows}
            columns={[
              ...CompSpecColumnGrid,
              getActionColumn({
                onEdit: openSpecModal,
                onDelete: handleDeleteSpec,
                gridType: "SPEC",
              }),
            ]}
            isColumselectionDisabled={true}
            getRowId={(row: any) => row.specid}
          />
        </div>
        {!selectedComp && (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
            Select a component row above to view / manage its specs.
          </p>
        )}
      </div>

      {/* Templates Grid (one component can have multiple YAML templates) */}
      <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
        <div className="flex justify-between items-center p-4 pl-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Component YAML Templates {selectedComp ? `- ${selectedComp.compName}` : ""}
          </h1>
          {selectedComp && (
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
              onClick={() => openTmplModal()}
            >
              Add YAML Template
            </button>
          )}
        </div>
        <div style={{ height: "30vh" }}>
          <NNPGrid
            rows={tmplRows}
            columns={[
              ...CompTemplateColumnGrid,
              getActionColumn({
                onEdit: openTmplModal,
                onDelete: handleDeleteTmpl,
                gridType: "TEMPLATE",
              }),
            ]}
            isColumselectionDisabled={true}
            getRowId={(row: any) => row.tmplId}
          />
        </div>
        {!selectedComp && (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
            Select a component row above to view / manage its YAML templates.
          </p>
        )}
      </div>

      {/* Component / Spec Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <DynamicForm
          inputs={formConfig}
          layout="double"
          onSubmit={formMode === "COMP" ? handleCompSubmit : handleSpecSubmit}
          defaultValues={rowToEdit || {}}
        />
      </Modal>

      {/* Template Modal with YAML code editor */}
      <Modal isOpen={isTmplModalOpen} onClose={() => setIsTmplModalOpen(false)} title={tmplRow ? "Update YAML Template" : "Add YAML Template"}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#1D1D1D] dark:text-white">
                File Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={tmplForm.fileName}
                onChange={(e) => setTmplForm({ ...tmplForm, fileName: e.target.value })}
                placeholder="e.g. deployment"
                className="border p-2 rounded border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#1D1D1D] dark:text-white">File Path</label>
              <input
                type="text"
                value={tmplForm.filePath}
                onChange={(e) => setTmplForm({ ...tmplForm, filePath: e.target.value })}
                placeholder="Manifest folder path inside the gitops repo"
                className="border p-2 rounded border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#1D1D1D] dark:text-white">Template Type</label>
              <select
                value={tmplForm.tmplType}
                onChange={(e) => setTmplForm({ ...tmplForm, tmplType: e.target.value })}
                className="border p-2 rounded border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white"
              >
                <option value="manifest">Manifest</option>
                <option value="app">App (ArgoCD)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#1D1D1D] dark:text-white">Status</label>
              <select
                value={tmplForm.status}
                onChange={(e) => setTmplForm({ ...tmplForm, status: e.target.value })}
                className="border p-2 rounded border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-[#1D1D1D] dark:text-white">YAML Content</label>
            <YamlEditor
              value={tmplForm.template}
              onChange={(val) => setTmplForm({ ...tmplForm, template: val })}
              height="350px"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use <code>[=variable_name]</code> placeholders (e.g. <code>[=env]</code>, <code>[=comp_name]</code>).
              Available template variables are populated from the component specs (Template Variable Name).
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!tmplForm.fileName?.trim()}
              onClick={handleTmplSubmit}
              className={`px-4 py-2 rounded text-white text-sm font-medium ${tmplForm.fileName?.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {tmplRow ? "Update Template" : "Save Template"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComponentManagement;
