// src/widgets/environmentalFeatures.tsx
import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@mui/material";

type EnvData = {
  envId: string;
  envName?: string;
  envFeatures?: any[];
};

interface EnvironmentalFeaturesProps {
  data: EnvData[];
  onSelect?: (envId: string, id: string, seq: number, updatedData?: any) => void;
  showCheckboxes?: boolean;
  hideheader?: boolean;
}

// ---------------------------
// Leaf Helper Functions
// ---------------------------
const getDetailLeaves = (detail: any): any[] => {
  return detail.childElementDtls || [];
};

const getElementLeaves = (el: any): any[] => {
  if (!el.elementDetails) return [];
  return el.elementDetails.flatMap(getDetailLeaves);
};

const getFeatureLeaves = (feature: any): any[] => {
  if (!feature.featureElements) return [];
  return feature.featureElements.flatMap(getElementLeaves);
};

const getEnvLeaves = (env: EnvData): any[] => {
  if (!env.envFeatures) return [];
  return env.envFeatures.flatMap(getFeatureLeaves);
};

const getAllTreeLeaves = (data: EnvData[]): any[] => {
  if (!data) return [];
  return data.flatMap(getEnvLeaves);
};

const getCheckState = (leaves: any[]) => {
  if (!leaves || leaves.length === 0) return { checked: false, indeterminate: false };
  const assignedCount = leaves.filter((leaf) => !!(leaf.isAssigned ?? leaf.assigned)).length;
  const checked = assignedCount === leaves.length;
  const indeterminate = assignedCount > 0 && assignedCount < leaves.length;
  return { checked, indeterminate };
};

const EnvironmentalFeatures = ({ data, onSelect, hideheader, showCheckboxes = true }: EnvironmentalFeaturesProps) => {
  const [openEnvs, setOpenEnvs] = useState<string[]>([]);
  const [openFeatures, setOpenFeatures] = useState<string[]>([]);
  const [openElements, setOpenElements] = useState<string[]>([]);
  const [openDetails, setOpenDetails] = useState<string[]>([]);

  const [selectedId, setSelectedId] = useState<{ envId: string; id: string; seq: number }>({
    envId: "",
    id: "__header__",
    seq: 0,
  });

  // ---------------------------
  // Helpers
  // ---------------------------
  const toggleAccordion = (
    id: string,
    openList: string[],
    setOpenList: React.Dispatch<React.SetStateAction<string[]>>,
    resetLists: React.Dispatch<React.SetStateAction<string[]>>[] = []
  ) => {
    const isOpen = openList.includes(id);

    // CLOSE item
    if (isOpen) {
      setOpenList((prev) => prev.filter((x) => x !== id));
      return;
    }

    // OPEN item & collapse deeper levels
    setOpenList([id]);
    resetLists.forEach((reset) => reset([]));
  };

  useEffect(() => {
    onSelect?.(selectedId.envId, selectedId.id, selectedId.seq);
  }, [selectedId]);

  const handleToggleLeaves = (envId: string, leaves: any[], targetChecked: boolean) => {
    leaves.forEach((child) => {
      child.isAssigned = targetChecked;
      child.assigned = targetChecked;
      onSelect?.(envId, child.chElementDtlId, 5, targetChecked);
    });
  };

  const handleToggleAll = (targetChecked: boolean) => {
    (data || []).forEach((env) => {
      getEnvLeaves(env).forEach((child) => {
        child.isAssigned = targetChecked;
        child.assigned = targetChecked;
        onSelect?.(env.envId, child.chElementDtlId, 5, targetChecked);
      });
    });
  };

  const allTreeLeaves = getAllTreeLeaves(data);
  const allTreeCheckState = getCheckState(allTreeLeaves);

  return (
    <div className="w-full h-full bg-transparent text-gray-800 dark:text-gray-200 text-sm overflow-y-scroll">
      {!hideheader && (
        <button
          onClick={() => setSelectedId({ envId: "", id: "__header__", seq: -1 })}
          className={`sticky top-0 z-10 w-full text-left px-4 py-3 text-base font-semibold transition-colors ${selectedId.id === "__header__"
            ? "bg-[#588cf3] text-white"
            : "bg-gray-200 text-black hover:bg-[#d1d5db]"
            }`}
        >
          ALL ENVIRONMENTS
        </button>
      )}

      {/* Select All Permissions Bar */}
      {showCheckboxes && allTreeLeaves.length > 0 && (
        <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold sticky top-0 z-10">
          <Checkbox
            size="small"
            className="mr-2"
            checked={allTreeCheckState.checked}
            indeterminate={allTreeCheckState.indeterminate}
            sx={{
              color: "gray",
              "&.Mui-checked": { color: "#3b82f6" },
              "&.MuiCheckbox-indeterminate": { color: "#3b82f6" },
            }}
            onChange={(e) => handleToggleAll(e.target.checked)}
          />
          <span className="cursor-pointer select-none" onClick={() => handleToggleAll(!allTreeCheckState.checked)}>
            Select All Permissions
          </span>
        </div>
      )}

      <ul className="space-y-1">
        {data?.map((env) => {
          const envLeaves = getEnvLeaves(env);
          const envState = getCheckState(envLeaves);

          return (
            <li key={env.envId}>

              {/* ENVIRONMENT ROW */}
              <div
                className={`w-full cursor-pointer transition-colors ${selectedId.id === env.envId ? "bg-[#588cf3]" : "hover:bg-[#929397]"
                  }`}
                onClick={() => {
                  toggleAccordion(env.envId, openEnvs, setOpenEnvs, [
                    setOpenFeatures,
                    setOpenElements,
                    setOpenDetails,
                  ]);
                  setSelectedId({ envId: env.envId, id: env.envId, seq: 0 });
                }}
              >
                <div className="flex justify-between items-center py-4 pr-2 pl-4">
                  <div className="flex items-center">
                    {showCheckboxes && envLeaves.length > 0 && (
                      <Checkbox
                        size="small"
                        className="mr-2 shrink-0"
                        checked={envState.checked}
                        indeterminate={envState.indeterminate}
                        sx={{
                          color: "gray",
                          "&.Mui-checked": { color: "#3b82f6" },
                          "&.MuiCheckbox-indeterminate": { color: "#3b82f6" },
                        }}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleLeaves(env.envId, envLeaves, e.target.checked);
                        }}
                      />
                    )}
                    <span>{env.envName ?? env.envId}</span>
                  </div>
                  {openEnvs.includes(env.envId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>

              {/* ENV FEATURES */}
              {openEnvs.includes(env.envId) && env.envFeatures && (
                <ul>
                  {env.envFeatures.map((feature: any) => {
                    const featureLeaves = getFeatureLeaves(feature);
                    const featureState = getCheckState(featureLeaves);

                    return (
                      <li key={feature.feaId}>

                        <div
                          className={`w-full cursor-pointer transition-colors ${selectedId.id === feature.feaId ? "bg-[#588cf3]" : "hover:bg-[#929397]"
                            }`}
                          onClick={() => {
                            toggleAccordion(feature.feaId, openFeatures, setOpenFeatures, [
                              setOpenElements,
                              setOpenDetails,
                            ]);
                            setSelectedId({ envId: env.envId, id: feature.feaId, seq: 2 });
                          }}
                        >
                          <div className="flex justify-between items-center py-4 pr-2 pl-8">
                            <div className="flex items-center">
                              {showCheckboxes && featureLeaves.length > 0 && (
                                <Checkbox
                                  size="small"
                                  className="mr-2 shrink-0"
                                  checked={featureState.checked}
                                  indeterminate={featureState.indeterminate}
                                  sx={{
                                    color: "gray",
                                    "&.Mui-checked": { color: "#3b82f6" },
                                    "&.MuiCheckbox-indeterminate": { color: "#3b82f6" },
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleLeaves(env.envId, featureLeaves, e.target.checked);
                                  }}
                                />
                              )}
                              <span>{feature.feaName}</span>
                            </div>
                            {feature.featureElements &&
                              (openFeatures.includes(feature.feaId) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              ))}
                          </div>
                        </div>

                        {/* FEATURE ELEMENTS */}
                        {openFeatures.includes(feature.feaId) && feature.featureElements && (
                          <ul>
                            {feature.featureElements.map((el: any) => {
                              const elLeaves = getElementLeaves(el);
                              const elState = getCheckState(elLeaves);

                              return (
                                <li key={el.elementId}>

                                  <div
                                    className={`w-full cursor-pointer transition-colors ${selectedId.id === el.elementId ? "bg-[#588cf3]" : "hover:bg-[#929397]"
                                      }`}
                                    onClick={() => {
                                      toggleAccordion(el.elementId, openElements, setOpenElements, [
                                        setOpenDetails,
                                      ]);
                                      setSelectedId({ envId: env.envId, id: el.elementId, seq: 3 });
                                    }}
                                  >
                                    <div className="flex justify-between items-center py-3 pr-2 pl-12">
                                      <div className="flex items-center">
                                        {showCheckboxes && elLeaves.length > 0 && (
                                          <Checkbox
                                            size="small"
                                            className="mr-2 shrink-0"
                                            checked={elState.checked}
                                            indeterminate={elState.indeterminate}
                                            sx={{
                                              color: "gray",
                                              "&.Mui-checked": { color: "#3b82f6" },
                                              "&.MuiCheckbox-indeterminate": { color: "#3b82f6" },
                                            }}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleToggleLeaves(env.envId, elLeaves, e.target.checked);
                                            }}
                                          />
                                        )}
                                        <span>{el.elementName}</span>
                                      </div>
                                      {el.elementDetails &&
                                        (openElements.includes(el.elementId) ? (
                                          <ChevronDown size={16} />
                                        ) : (
                                          <ChevronRight size={16} />
                                        ))}
                                    </div>
                                  </div>

                                  {/* ELEMENT DETAILS */}
                                  {openElements.includes(el.elementId) && el.elementDetails && (
                                    <ul>
                                      {el.elementDetails.map((detail: any) => {
                                        const detailLeaves = getDetailLeaves(detail);
                                        const detailState = getCheckState(detailLeaves);

                                        return (
                                          <li key={detail.elementDtlId}>

                                            <div
                                              className={`w-full cursor-pointer transition-colors ${selectedId.id === detail.elementDtlId
                                                ? "bg-[#588cf3]"
                                                : "hover:bg-[#929397]"
                                                }`}
                                              onClick={() => {
                                                toggleAccordion(
                                                  detail.elementDtlId,
                                                  openDetails,
                                                  setOpenDetails
                                                );
                                                setSelectedId({
                                                  envId: env.envId,
                                                  id: detail.elementDtlId,
                                                  seq: 4,
                                                });
                                              }}
                                            >
                                              <div className="flex justify-between items-center py-3 pr-2 pl-16">
                                                <div className="flex items-center">
                                                  {showCheckboxes && detailLeaves.length > 0 && (
                                                    <Checkbox
                                                      size="small"
                                                      className="mr-2 shrink-0"
                                                      checked={detailState.checked}
                                                      indeterminate={detailState.indeterminate}
                                                      sx={{
                                                        color: "gray",
                                                        "&.Mui-checked": { color: "#3b82f6" },
                                                        "&.MuiCheckbox-indeterminate": { color: "#3b82f6" },
                                                      }}
                                                      onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleLeaves(env.envId, detailLeaves, e.target.checked);
                                                      }}
                                                    />
                                                  )}
                                                  <span>{detail.elementDtlName}</span>
                                                </div>
                                                {detail.childElementDtls &&
                                                  (openDetails.includes(detail.elementDtlId) ? (
                                                    <ChevronDown size={16} />
                                                  ) : (
                                                    <ChevronRight size={16} />
                                                  ))}
                                              </div>
                                            </div>

                                            {/* CHILD ELEMENTS */}
                                            {openDetails.includes(detail.elementDtlId) &&
                                              detail.childElementDtls && (
                                                <ul>
                                                  {detail.childElementDtls.map((child: any) => (
                                                    <li key={child.chElementDtlId}>
                                                      <div className="w-full pl-20 py-2 flex items-center">
                                                        <Checkbox
                                                          id={child.chElementDtlId}
                                                          className="mr-2 shrink-0"
                                                          checked={!!(child.isAssigned ?? child.assigned)}
                                                          disabled={!showCheckboxes}
                                                          sx={{
                                                            color: "gray",
                                                            "&.Mui-checked": { color: "#3b82f6" },
                                                            "& .MuiSvgIcon-root": { fill: "currentColor" },
                                                            "&.Mui-disabled": { color: "#d1d5db" },
                                                          }}
                                                          onChange={(e) => {
                                                            e.stopPropagation();
                                                            onSelect?.(
                                                              env.envId,
                                                              child.chElementDtlId,
                                                              5,
                                                              e.target.checked
                                                            );
                                                          }}
                                                        />
                                                        <label
                                                          className={`select-none ${showCheckboxes ? 'text-gray-800 dark:text-gray-200 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                          {child.elementDtlName}
                                                        </label>
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EnvironmentalFeatures;
