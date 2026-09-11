export type BaseField = {
  type: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'datetime' | 'groupTextButton' | 'checkbox';
  name: string;
  label: string;
  placeholder?: string;
  validation?: Record<string, any>;
  options?: string[] | { label: string; value: any }[];
  url?: string;
  labelKey?: string;
  valueKey?: string;
  displayFormat?: string;
  storeFormat?: 'unix' | 'iso' | string;
  isDisabled?: boolean
  hidden?: boolean;
  triggerName?: string; // ✅ for button label in text+button group
  status?: 'available' | 'taken' | ''; // ✅ for username availability status
  width?: string; // e.g., '100%', '50%'

  gridSpan?: string //e.g  'md:col-span-3' or 'md:col-span-1'
  buttonType?: 'update' | 'submit' | 'reset';
};

export type DynamicGroupField = {
  type: 'dynamicGroup';
  name: string;
  label: string;
  multiple?: boolean;
  options: {
    label: string;
    value: string;
    order?: number;
    dependsOn?: Array<string>;
    autoAdd?: Array<string>;
    itemsInOrder?: Array<string>;
    childForm: BaseField[];
    hidden?: boolean;
    default?: boolean;
    removable?: boolean;
  }[];
};

export type InputConfig = (BaseField | DynamicGroupField)[];