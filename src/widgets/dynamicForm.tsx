// DynamicForm.tsx
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  useForm,
  Controller,
  type UseFormReturn,
  type Control,
  type UseFormSetError,
  type UseFormClearErrors,
} from 'react-hook-form';
import clsx from 'clsx';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import type { BaseField, DynamicGroupField, InputConfig } from '../shared/types/inputconfig';
import { alertAction } from '../shared/utils';

type RefType = {
  setError: UseFormSetError<any>;
  clearErrors: UseFormClearErrors<any>;
};

type SelectedEntry = {
  groupName: string;
  value: string;
  label: string;
  fields: BaseField[];
  collapsed: boolean;
  removable?: boolean;
  source?: 'manual' | 'auto';
};

type Props = {
  inputs: InputConfig;
  layout?: 'single' | 'double';
  onSubmit?: (formattedData: any) => void;
  defaultValues?: Record<string, any>;
  formMethods?: UseFormReturn<any>;
  control?: Control<any>;
  editable?: boolean;
  onTrigger?: (name: string, value: any) => Promise<any> | any;
};

const DynamicForm = forwardRef<RefType, Props>((props, ref) => {
  const { inputs, layout = 'single', onSubmit, defaultValues, formMethods, control: externalControl, editable = true, onTrigger } = props;

  const internalForm = useForm({ mode: 'onChange', defaultValues });
  const methods = formMethods ?? internalForm;
  const { register, handleSubmit, formState: { errors }, reset, control: internalControl, watch, setError, clearErrors, getValues, setValue } = methods;
  useImperativeHandle(ref, () => ({ setError, clearErrors }));
  const control = externalControl || internalControl;
  const watched = watch();

  const [staticFields, setStaticFields] = useState<BaseField[]>([]);
  const [dynamicGroups, setDynamicGroups] = useState<DynamicGroupField[]>([]);
  const [submitBtn, setSubmitBtn] = useState<BaseField | null>(null);
  const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
  const [selectedEntries, setSelectedEntries] = useState<SelectedEntry[]>([]);

  const getErrorByPath = (path: string) => {
    if (!path) return undefined;
    const dot = path.replace(/\[(\d+)\]/g, '.$1');
    const parts = dot.split('.');
    let node: any = errors;
    for (const p of parts) {
      if (!node) return undefined;
      node = node[p];
    }
    return node;
  };

  const getLayoutClass = () => (layout === 'double' ? 'grid grid-cols-1 md:grid-cols-4 gap-4' : 'grid grid-cols-1 gap-4');

  const getValidationRules = (validation: any) => {
    if (!validation) return undefined;
    const rules: any = {};
    if (validation.required) rules.required = validation.required;
    if (validation.minLength) rules.minLength = validation.minLength;
    if (validation.maxLength) rules.maxLength = validation.maxLength;
    if (validation.type === 'url') {
      rules.validate = (value: string) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          const ok = ['http:', 'https:'].includes(url.protocol) && /\.[a-z]{2,}$/i.test(url.hostname);
          return ok || validation.message || 'Enter a valid URL';
        } catch {
          return validation.message || 'Enter a valid URL';
        }
      };
    }
    if (validation.type === 'email') rules.pattern = { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: validation.message || 'Enter a valid email' };
    if (validation.pattern) rules.pattern = validation.pattern;
    if (validation.validate) rules.validate = validation.validate;
    return rules;
  };

  const formatDateValue = (val: any, storeFormat?: string) => {
    if (!val) return '';
    if (storeFormat === 'unix') return dayjs(val).valueOf();
    if (storeFormat === 'iso') return dayjs(val).toISOString();
    return dayjs(val).format(storeFormat || 'YYYY-MM-DDTHH:mm:ss');
  };

  useEffect(() => {
    const dynamics = (inputs || []).filter((i: any) => i.type === 'dynamicGroup') as DynamicGroupField[];
    const statics = (inputs || []).filter((i: any) => i.type !== 'dynamicGroup' && i.type !== 'button') as BaseField[];
    const btn = (inputs || []).find((i: any) => i.type === 'button' && (i as any).buttonType === 'submit') as BaseField | undefined;
    setStaticFields(statics);
    setDynamicGroups(dynamics);
    setSubmitBtn(btn ?? null);
    // console.log(inputs, 'input');
  }, [inputs]);

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
    if (!dynamicGroups.length) return;
    const initial: SelectedEntry[] = [];
    dynamicGroups.forEach((g) => {
      (g.options || []).filter((o) => o.default).forEach((opt) => {
        initial.push({ groupName: g.name, value: opt.value, label: opt.label, fields: opt.childForm || [], collapsed: false, removable: opt.removable !== false, source: 'manual' });
      });
      const saved = defaultValues?.[g.name];
      if (Array.isArray(saved)) {
        saved.forEach((entry: any) => {
          const opt = (g.options || []).find((o) => o.value === entry.name);
          if (opt && !initial.some((e) => e.groupName === g.name && e.value === opt.value)) {
            initial.push({ groupName: g.name, value: opt.value, label: opt.label, fields: opt.childForm || [], collapsed: false, removable: opt.removable !== false, source: 'manual' });
          }
        });
      }
    });
    setSelectedEntries(initial);
    // console.log(initial, 'initial');
    // console.log(defaultValues, 'defaultValues');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues, dynamicGroups]);

  // const computeOrderedList = (group: DynamicGroupField, baseValues: string[], option?: any) => {
  //   const itemsInOrder = option?.itemsInOrder || group.options?.find(o => o.itemsInOrder)?.itemsInOrder;
  //   if (itemsInOrder && Array.isArray(itemsInOrder) && itemsInOrder.length) {
  //     const unique = Array.from(new Set(itemsInOrder.concat(baseValues || [])));
  //     return unique.filter(v => (group.options || []).some(o => o.value === v));
  //   }
  //   // fallback to numeric order
  //   const all = (group.options || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map(o => o.value);
  //   const merged = Array.from(new Set([...all, ...(baseValues || [])]));
  //   return merged.filter(v => (group.options || []).some(o => o.value === v));
  // };

  const addGroupInstance = (groupName: string) => {
    const group = dynamicGroups.find(g => g.name === groupName);
    const selected = groupSelections[groupName];
    if (!group || !selected) return;
    const option = group.options.find((o: any) => o.value === selected);
    if (!option) return;

    setSelectedEntries(prev => {
      const prevForGroup = prev.filter(p => p.groupName === groupName);
      const already = prevForGroup.map(p => p.value);
      const toAddVals: string[] = [];

      if (Array.isArray(option.autoAdd)) {
        option.autoAdd.forEach(v => {
          if (!already.includes(v)) toAddVals.push(v);
        });
      }
      if (!already.includes(option.value)) toAddVals.push(option.value);

      const valuesToAdd = [option.value, ...(option.autoAdd || [])];
      const newEntries = valuesToAdd
        .map(val => {
          const opt = group.options.find(o => o.value === val);
          if (!opt) return null;
          const isAuto = option.autoAdd?.includes(val);
          return {
            groupName,
            value: opt.value,
            label: opt.label,
            fields: opt.childForm || [],
            collapsed: isAuto,
            removable: opt.removable !== false,
            source: isAuto ? 'auto' : 'manual',
          } as SelectedEntry;
        })
        .filter(Boolean) as SelectedEntry[];

      // merge preserving existing entries and appending new ones in orderList order
      const existingOthers = prev.filter(p => p.groupName !== groupName);
      const combinedForGroup = [
        ...prevForGroup,
        ...newEntries.filter(n => !prevForGroup.some(p => p.value === n.value))
      ];

      // final ordering: if any option has itemsInOrder for this group, respect it; else respect order field
      const itemsOrder = option.itemsInOrder || group.options.find(o => o.itemsInOrder)?.itemsInOrder;
      let finalGroupOrder = combinedForGroup;
      if (itemsOrder && Array.isArray(itemsOrder)) {
        finalGroupOrder = itemsOrder
          .map(v => combinedForGroup.find(c => c.value === v))
          .filter(Boolean) as SelectedEntry[];
        // append any others not in itemsInOrder
        finalGroupOrder = finalGroupOrder.concat(combinedForGroup.filter(c => !itemsOrder.includes(c.value)));
      } else {
        finalGroupOrder = combinedForGroup.sort((a, b) => {
          const oa = group.options.find(o => o.value === a.value)?.order ?? 999;
          const ob = group.options.find(o => o.value === b.value)?.order ?? 999;
          return oa - ob;
        });
      }

      const merged = [...existingOthers, ...finalGroupOrder];
      // after adding, ensure form array for this group exists and contains objects for each entry
      setTimeout(() => {
        const arr = (getValues()?.[groupName] as any[]) || [];
        const newArr = finalGroupOrder.map((entry, idx) => {
          const existing = arr.find(a => a?.name === entry.value) || arr[idx];
          if (existing) return { ...existing, name: entry.value, args: existing.args ?? [{}] };
          return { name: entry.value, args: [{}] };
        });
        setValue(groupName, newArr);
      }, 0);

      setGroupSelections(prevSel => ({ ...prevSel, [groupName]: '' }));
      return merged;
    });
  };

  const removeGroupInstance = (groupName: string, value: string) => {
    const group = dynamicGroups.find(g => g.name === groupName);
    const option = group?.options.find(o => o.value === value);
    if (!option) return;

    const dependents = selectedEntries.filter(sel => {
      if (sel.groupName !== groupName) return false;
      const opt = group?.options.find(o => o.value === sel.value);
      return (opt?.dependsOn || []).includes(value);
    });

    if (dependents.length) {
      alertAction('error', `Cannot remove "${option.label}" because it is required by: ${dependents.map(d => d.label).join(', ')}`)()
      // alert(`Cannot remove "${option.label}" because it is required by: ${dependents.map(d => d.label).join(', ')}`);
      return;
    }

    setSelectedEntries(prev => {
      const remaining = prev.filter(p => !(p.groupName === groupName && p.value === value));
      // rebuild form array for groupName from remaining entries
      const remainingForGroup = remaining.filter(r => r.groupName === groupName);
      const newArr = remainingForGroup.map(r => {
        // try keep existing matched objects in old array by name
        const existingArray = (getValues()?.[groupName] as any[]) || [];
        const found = existingArray.find(a => a?.name === r.value);
        if (found) return found;
        return { name: r.value, args: [{}] };
      });
      setValue(groupName, newArr);
      return remaining;
    });
  };

  const toggleCollapse = (groupName: string, value: string) =>
    setSelectedEntries(prev => prev.map(p => (p.groupName === groupName && p.value === value ? { ...p, collapsed: !p.collapsed } : p)));

  const togglePasswordVisibility = (name: string) => setPasswordVisibility(p => ({ ...p, [name]: !p[name] }));

  const renderField = (field: BaseField, overrideName?: string) => {
    const name = overrideName ?? field.name;
    const err = getErrorByPath(name);
    const bracketToDot = (p: string) => p.replace(/\[(\d+)\]/g, '.$1');
    const valFromWatched = (() => {
      const dot = bracketToDot(name);
      const parts = dot.split('.');
      let node: any = watched;
      for (const part of parts) {
        if (node == null) return undefined;
        node = node[part];
      }
      return node;
    })();

    if (!editable) {
      let disp = valFromWatched ?? '';
      if (field.type === 'datetime' && disp) disp = dayjs(disp).format(field.displayFormat || 'YYYY-MM-DD HH:mm');
      if (field.type === 'select') {
        const opt = (field.options || []).find((o: any) => (typeof o === 'string' ? o === disp : o.value === disp));
        disp = typeof opt === 'string' ? opt : opt?.label || disp;
      }
      return <span className="text-gray-800 dark:text-[#cccccc]">{disp || '-'}</span>;
    }

    if (field.type === 'groupTextButton') {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input type="text" autoComplete="off" {...register(name, getValidationRules(field.validation))} placeholder={field.placeholder} className={clsx('border p-2 rounded flex-1 border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-current', err && err.type !== 'success' && 'border-red-500')} onChange={(e) => { clearErrors(name); const r = register(name); r.onChange(e); }} />
            <button type="button" onClick={async () => {
              const val = getValues()[name];
              if (val && typeof onTrigger === 'function') {
                try {
                  const exists = await onTrigger(field.name, val);
                  if (!exists) { clearErrors(name); setError(name, { type: 'success', message: `${field.label} is available` }); }
                  else setError(name, { type: 'manual', message: `${field.label} already exists` });
                } catch { setError(name, { type: 'manual', message: 'Validation failed' }); }
              }
            }} disabled={!getValues()?.[name]} className={clsx('px-4 py-2 rounded text-[var(--text-color-secondary)]', getValues()?.[name] ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed')}>{field.triggerName || 'Go'}</button>
          </div>
          {err?.type === 'success' && <span className="text-green-600 text-sm">{err.message}</span>}
          {err?.type !== 'success' && err && <span className="text-red-500">{err.message}</span>}
        </div>
      );
    }

    if (field.type === 'textarea') return <textarea {...register(name, getValidationRules(field.validation))} placeholder={field.placeholder} disabled={field.isDisabled || !editable} className={clsx('border p-2 rounded w-full border-[var(--text-color-tertiary)]   dark:bg-[#171717]  bg-transparent text-[#1D1D1D] dark:text-white', err && 'border-red-500')} />;

    if (field.type === 'select') return (
      <select {...register(name, getValidationRules(field.validation))} className={clsx('border p-2 rounded w-full border-[var(--text-color-tertiary)]  dark:bg-[#171717]  bg-transparent text-[#1D1D1D] dark:text-white', err && 'border-red-500')} disabled={field.isDisabled || !editable}>
        <option value="">Select</option>
        {(field.options || []).map((opt: any, idx: number) => typeof opt === 'string' ? <option key={idx} value={opt}>{opt}</option> : <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    );

    if (field.type === 'datetime') return (
      <Controller name={name} control={control} rules={field.validation} render={({ field: rhfField }) => (
        <DesktopDateTimePicker disabled={!editable} value={rhfField.value ? dayjs(rhfField.value) : null} onChange={(v: any) => rhfField.onChange(formatDateValue(v, field.storeFormat))} format={field.displayFormat || 'YYYY-MM-DD HH:mm'} slotProps={{ textField: { fullWidth: true, error: !!err } }} />
      )} />
    );
    if (field.type === 'checkbox') {
      return (
        <Controller
          name={overrideName ?? field.name}
          control={control}
          render={({ field: rhfField }) => (
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!rhfField.value}
                onChange={(e) => rhfField.onChange(e.target.checked)}
                disabled={field.isDisabled || !editable}
                className="w-4 h-4 accent-blue-600 border-gray-300 rounded cursor-pointer border-[var(--text-color-tertiary)]"
              />
              <span className="text-gray-800 select-none">{field.label}</span>
            </label>
          )}
        />
      );
    }


    if (field.type === 'password') {
      const visible = !!passwordVisibility[name];
      return (
        <div className="relative">
          <input type={visible ? 'text' : 'password'} autoComplete="new-password" {...register(name, getValidationRules(field.validation))} placeholder={field.placeholder} disabled={!editable} className={clsx('border p-2 rounded w-full pr-10 border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white', err && 'border-red-500')} />
          <button type="button" onClick={() => togglePasswordVisibility(name)} disabled={!editable} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">{visible ? <VisibilityOutlinedIcon style={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon style={{ fontSize: 18 }} />}</button>
        </div>
      );
    }

    return <input type={field.type} autoComplete="off" {...register(name, getValidationRules(field.validation))} placeholder={field.placeholder} disabled={field.isDisabled || !editable} className={clsx('p-2 w-full border rounded border-[var(--text-color-tertiary)] bg-transparent dark:bg-[#171717] text-[#1D1D1D] dark:text-white', err && 'border-red-500')} />;
  };

  const handleSubmitForm = (data: Record<string, any>) => {
    if (!onSubmit) return;
    onSubmit(data);
  };

  const allFieldsValid = () => {
    const vals = getValues();
    const staticValid = staticFields.filter(f => f.validation?.required && f.type !== 'groupTextButton').every(f => !!(vals && vals[f.name]));
    const groupTextValid = staticFields.filter(f => f.type === 'groupTextButton' && f.validation?.required).every(f => (getErrorByPath(f.name) as any)?.type === 'success');
    const dynamicValid = dynamicGroups.every(g => {
      const arr = vals?.[g.name] || [];
      const entries = selectedEntries.filter(s => s.groupName === g.name);
      return entries.every((entry, idx) => {
        return (entry.fields || []).every((f) => {
          if (f.validation?.required) {
            const val = arr?.[idx]?.args?.[0]?.[f.name];
            return !!val;
          }
          return true;
        });
      });
    });
    return staticValid && groupTextValid && dynamicValid;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit(handleSubmitForm)} autoComplete="off" className="w-full space-y-4 body-font" style={{ color: 'var(--text-color-tertiary)' }}>
        <div className={getLayoutClass()}>
          {staticFields.map(input => {
            const err = getErrorByPath(input.name);
            const isCheckbox = input.type === 'checkbox';
            return (
              // <div key={input.name} className={clsx('flex flex-col gap-1', isCheckbox && 'mt-2')}>
              <div key={input.name} className={
                clsx(
                  'flex flex-col gap-1',
                  isCheckbox && 'mt-2',
                  layout === 'double' ? (input.gridSpan || 'md:col-span-2') : ''
                )
              }>
                {!isCheckbox && (
                  <label className="font-medium text-[#1D1D1D] dark:text-white">
                    {input.label}
                    {input.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(input)}
                {editable && input.type !== 'groupTextButton' && err && err.type !== 'success' && <span className="text-red-500">{err.message}</span>}
              </div>
            );
          })}

        </div>

        {dynamicGroups.map(group => {
          const available = (group.options || []).filter(opt => !opt.hidden && !opt.default && !selectedEntries.find(s => s.groupName === group.name && s.value === opt.value));
          const entries = selectedEntries.filter(s => s.groupName === group.name);
          return (
            <div key={group.name} className="mt-6">
              <label className="block font-medium mb-1">{group.label}</label>

              {editable && (
                <div className="flex items-center gap-4">
                  <select value={groupSelections[group.name] || ''} onChange={e => setGroupSelections(p => ({ ...p, [group.name]: e.target.value }))} className="border p-2 rounded w-64">
                    <option value="">Select Option</option>
                    {available.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button type="button" onClick={() => addGroupInstance(group.name)} disabled={!groupSelections[group.name]} className={clsx('nnp-btn nnp-btn-primary', groupSelections[group.name] ? 'nnp-btn nnp-btn-primary' : 'bg-gray-400 cursor-not-allowed')}>+</button>
                </div>
              )}

              {entries.map((entry, idx) => (
                <div key={`${group.name}-${entry.value}-${idx}`} className={clsx('mt-4 relative', editable ? 'border p-4 rounded shadow' : 'p-2')}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{entry.label}</h4>
                    {editable && (
                      <div className="flex gap-3">
                        <button type="button" onClick={() => toggleCollapse(group.name, entry.value)} className="text-blue-500 text-sm hover:underline">{entry.collapsed ? 'Expand' : 'Collapse'}</button>
                        {entry.removable && <button type="button" onClick={() => removeGroupInstance(group.name, entry.value)} className="text-red-500 hover:underline">✕ Remove</button>}
                      </div>
                    )}
                  </div>

                  {!entry.collapsed && (entry.fields || []).map(field => {
                    if (field.hidden) return null;
                    const nameHidden = `${group.name}[${idx}].name`;
                    const argPath = `${group.name}[${idx}].args[0].${field.name}`;
                    return (
                      <div key={argPath} className="mb-4">
                        <label className="block mb-1">{field.label}{field.validation?.required && <span className="text-red-500 ml-1">*</span>}</label>
                        <input type="hidden" {...register(nameHidden)} />
                        {renderField(field, argPath)}
                        {getErrorByPath(argPath) && <span className="text-red-500">{getErrorByPath(argPath).message}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}

        {editable && (
          <div className="flex justify-end">
            <button type="submit" disabled={!allFieldsValid()} className={clsx('nnp-btn nnp-btn-primary ', !allFieldsValid() ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-blue-700')}>{submitBtn?.label || 'Submit'}</button>
          </div>
        )}
      </form>
    </LocalizationProvider>
  );
});
export default DynamicForm;
