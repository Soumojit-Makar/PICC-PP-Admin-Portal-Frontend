import type { InputConfig } from "../types/inputconfig";
export const LoginForm: InputConfig = [
  {
    type: 'text',
    name: 'username',
    label: 'User Name',
  },
  {
    type: 'password',
    name: 'password',
    label: 'Pasword',
  },
]
export const ResolutionDetailsForm: InputConfig = [
  {
    type: 'textarea',
    name: 'resolution',
    label: 'Resolution Details',
  },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    labelKey: 'status',
    options: [
    ],
    validation: { required: 'Status is required' },
  },
]
export const UserDetailsForm: InputConfig = [
  {
    type: 'text',
    name: 'reqid',
    label: 'Request Id',
  },
  {
    type: 'text',
    name: 'userId',
    label: 'User Name',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'emailId',
    label: 'Email',
  },
  {
    type: 'text',
    name: 'firstName',
    label: 'First Name',
    validation: { required: 'First name is required' },
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last Name',
    validation: { required: 'Last Name is required' },
  },
  {
    type: 'text',
    name: 'contactNumber',
    label: 'Contact Number',
  },
  {
    type: 'text',
    name: 'userType',
    label: 'User Type',
  },
  {
    type: 'select',
    name: 'roleId',
    label: 'User Role',
    options: [
    ],
    validation: { required: 'User Role is required' },
  },
  {
    type: 'select',
    name: 'userStatus',
    label: 'User Status',
    labelKey: 'commonStatus',
    options: [
    ],
    validation: { required: 'Status is required' },
  },
]
export const TicketDetailsForm: InputConfig = [
  {
    type: 'text',
    name: 'id',
    label: 'Ticket ID',
  },
  {
    type: 'text',
    name: 'environmentCode',
    label: 'Environment Code',
  },
  {
    type: 'text',
    name: 'accountName',
    label: 'Account Name',
  },
  {
    type: 'text',
    name: 'dateTime',
    label: 'Date Time',
  },
  {
    type: 'text',
    name: 'categoryType',
    label: 'Category',
  },
  {
    type: 'text',
    name: 'priority',
    label: 'Priority',
  },
  {
    type: 'text',
    name: 'subject',
    label: 'Subject',
  },
  {
    type: 'text',
    name: 'description',
    label: 'Issue Description',
  },
  {
    type: 'text',
    name: 'supportingDetails',
    label: 'Supporting Details',
  },
]
export const CurrentBillingForm: InputConfig = [
  {
    type: 'text',
    name: 'billAmount',
    label: 'Bill Amount',
  },
  {
    type: 'text',
    name: 'billContact',
    label: 'Billing Contact',
  },
  {
    type: 'text',
    name: 'billDate',
    label: 'Billing Date',
  }, {
    type: 'text',
    name: 'billOpenBalance',
    label: 'Billing Open Balance',
  }, {
    type: 'text',
    name: 'billStatus',
    label: 'Status',
  },
  {
    type: 'text',
    name: 'billComment',
    label: 'comment',
  },
]
export const AccountDetailsForm: InputConfig = [
  // --- READ-ONLY FIELDS (Top Half) ---
  {
    type: 'text',
    name: 'accName',
    label: 'Environment Details',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'organization',
    label: 'Organization',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'nnpCountry.countryCode',
    label: 'Country',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'accCategory', // Kept original mapping for Category
    label: 'Category',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'primaryUsername',
    label: 'Primary Username',
    isDisabled: true,
  },
  {
    type: 'email',
    name: 'email',
    label: 'Email',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'address',
    label: 'Address',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'phone',
    label: 'Phone',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'repoName',
    label: 'Repo Name',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'domain',
    label: 'Domain',
    isDisabled: true,
  },


  // --- EDITABLE FIELDS (Bottom Half) ---
  {
    type: 'textarea',
    name: 'userAccess',
    label: 'User Communication',
  },
  {
    type: 'textarea',
    name: 'userToken',
    label: 'User Token',
  },
  {
    type: 'textarea',
    name: 'administrativeAccess',
    label: 'Admin Communication',
  },
  {
    type: 'textarea',
    name: 'adminToken',
    label: 'Admin Token',
  },
  {
    type: 'text',
    name: 'platformUsePurpose',
    label: 'Purpose',
    isDisabled: true,
    gridSpan: 'md:col-span-3',
  },
  {
    type: 'select',
    name: 'accStatus',
    label: 'Status',
    options: [
      { label: 'Initiated', value: 'Initiated' },
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
    gridSpan: 'md:col-span-1',
  },
];
export const PlanDetailsForm: InputConfig = [
  {
    type: 'text',
    name: 'planName',
    label: 'Plan Name',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'billingDate',
    label: 'Billing Date',
    // isDisabled: true,
  },
  {
    type: 'text',
    name: 'paymentMode',
    label: 'Payment Mode',
    // isDisabled: true,
  },
  {
    type: 'text',
    name: 'openingBalance',
    label: 'Opening Balance',
    // isDisabled: true,
  },

];
export const ConfigForm: InputConfig = [
  {
    type: 'text',
    name: 'application',
    label: 'Application',
    placeholder: 'Enter Application Name',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'profile',
    label: 'Profile',
    placeholder: 'Enter Profile',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'tag',
    label: 'Tag',
    placeholder: 'Enter Tag',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'key',
    label: 'Key',
    placeholder: 'Enter Key',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'value',
    label: 'Value',
    placeholder: 'Enter Value',
    validation: {},
  },
  {
    type: 'checkbox',
    name: 'is_encrypted',
    label: 'Quantum-Safe Encrypted (ML-KEM-768 / X25519)',
    gridSpan: 'md:col-span-4',
  },
]
export const configFormUpdate: InputConfig = [
  {
    type: 'text',
    name: 'application',
    label: 'Application',
    placeholder: 'Enter Application Name',
    // validation: { required: 'Field is required' },
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'profile',
    label: 'Profile',
    placeholder: 'Enter Profile',
    // validation: { required: 'Field is required' },
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'tag',
    label: 'Tag',
    placeholder: 'Enter Tag',
    // validation: { required: 'Field is required' },
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'key',
    label: 'Key',
    placeholder: 'Enter Key',
    // validation: { required: 'Field is required' },
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'value',
    label: 'Value',
    placeholder: 'Enter Value',
    validation: {},
  },
  {
    type: 'checkbox',
    name: 'is_encrypted',
    label: 'Quantum-Safe Encrypted (ML-KEM-768 / X25519)',
    gridSpan: 'md:col-span-4',
  },
]
export const ModelDetailsForm: InputConfig = [
  {
    type: 'text',
    name: 'modelName',
    label: 'Model Name',
    placeholder: 'Enter Model Name',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'apiKey',
    label: 'API Key',
    placeholder: 'Enter API Key',
    validation: {},
  },
  {
    type: 'text',
    name: 'status',
    label: 'Status',
    placeholder: 'Enter Status',
    validation: {},
  },
  {
    type: 'text',
    name: 'modelType',
    label: 'Model Type',
    placeholder: 'Enter Model Type',
    validation: {},
  },
  {
    type: 'text',
    name: 'usage',
    label: 'Usage',
    placeholder: 'Enter Usage',
    validation: {},
  },
]
export const modelDetailsFormUpdate: InputConfig = [
  {
    type: 'text',
    name: 'modelName',
    label: 'Model Name',
    placeholder: 'Enter Model Name',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'apiKey',
    label: 'API Key',
    placeholder: 'Enter API Key',
    validation: {},
  },
  {
    type: 'text',
    name: 'status',
    label: 'Status',
    placeholder: 'Enter Status',
    validation: {},
  },
  {
    type: 'text',
    name: 'modelType',
    label: 'Model Type',
    placeholder: 'Enter Model Type',
    validation: {},
  },
  {
    type: 'text',
    name: 'usage',
    label: 'Usage',
    placeholder: 'Enter Usage',
    validation: {},
  },
]

export const DomainForm: InputConfig = [
  {
    type: 'text',
    name: 'domainName',
    label: 'Domain',
    placeholder: 'Enter Domain Name',
    validation: { required: 'Field is required' },
  },
  {
    type: 'text',
    name: 'domainVal',
    label: 'Value',
    placeholder: 'Enter Value',
    validation: { required: 'Field is required' },

  }]
export const EnvFeaturesForm: InputConfig = [
  //   {
  //   name: "lookup",
  //   label: "Lookup User",
  //   type: "groupTextButton",  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ our new group type
  //   placeholder: "Enter ID",
  //   triggerName: "Check",     // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ button text
  //   validation: { required: "ID is required" },
  // },
  {
    type: 'text',
    name: 'feaId',
    label: 'Feature ID',
    isDisabled: true,
    placeholder: 'Auto-generated ID'
  },
  {
    type: 'text',
    name: 'feaName',
    label: 'Name',
    placeholder: 'Enter Name',
    validation: { required: 'Name is required' },
  },
  {
    type: 'text',
    name: 'feaType',
    label: 'Type',
    placeholder: 'Enter Type',
    validation: {},

  },
  {
    type: 'textarea',
    name: 'feaDesc',
    label: 'Description',
    placeholder: 'Enter Description',
    validation: {},

  },
  {
    type: 'text',
    name: 'feaSeq',
    label: 'Sequence',
    placeholder: 'Enter Sequence',
    validation: {},

  },
  {
    type: 'checkbox',
    name: 'isAssigned',
    label: 'Assigned',
  }
]
export const FeatureElementForm: InputConfig = [
  {
    type: 'text',
    name: 'elementId',
    label: 'Element ID',
    isDisabled: true,
    placeholder: 'Auto-generated ID'
  },
  {
    type: 'text',
    name: 'elementName',
    label: 'Name',
    placeholder: 'Enter Name',
    validation: { required: 'Name is required' },
  },
  {
    type: 'text',
    name: 'elementType',
    label: 'Type',
    placeholder: 'Enter Type',
    validation: {},

  },
  {
    type: 'textarea',
    name: 'elementDesc',
    label: 'Description',
    placeholder: 'Enter Description',
    validation: {},

  },
  {
    type: 'text',
    name: 'elementPage',
    label: 'Page Link',
    placeholder: 'Enter Link',
    validation: {},

  },
  {
    type: 'text',
    name: 'feaSeq',
    label: 'Sequence',
    placeholder: 'Enter Sequence',
    validation: {},

  }]
export const ElementForm: InputConfig = [
  {
    type: 'text',
    name: 'elementDtlName',
    label: 'Name',
    placeholder: 'Enter Name',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlType',
    label: 'Type',
    placeholder: 'Enter Type',
    validation: {},

  },
  {
    type: 'textarea',
    name: 'elementDtlDesc',
    label: 'Description',
    placeholder: 'Enter Description',
    validation: {},

  },
  {
    type: 'text',
    name: 'elementDtlURL',
    label: 'Link',
    placeholder: 'Enter Link',
    validation: {},

  },
  {
    type: 'text',
    name: 'compId',
    label: 'Component Id',
    placeholder: 'Enter Component Id',
    validation: {},

  },
  {
    type: 'text',
    name: 'elementDtlHome',
    label: 'Home',
    placeholder: 'Enter Home',
    validation: {},

  },
  {
    type: 'text',
    name: 'elementDtlSeq',
    label: 'Sequence',
    placeholder: 'Enter Sequence',
    validation: {},

  }]
export const UserForm: InputConfig = [
  {
    name: 'emailId',
    label: 'User Email',
    type: 'groupTextButton',
    placeholder: 'Enter User Email',
    triggerName: 'Check',
    validation: {
      required: 'Email is required',
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
      }
    },
  },
  {
    name: 'userId',
    label: 'Username',
    type: 'groupTextButton',
    placeholder: 'Enter User Id',
    triggerName: 'Check',
    validation: {
      required: 'Username is required',
      validate: {
        allowedChars: (v: string) => /^[a-zA-Z0-9_.-]+$/.test(v) || 'Username can only contain alphanumeric characters, underscores, hyphens, and periods',
        startWith: (v: string) => !/^[._-]/.test(v) || 'Username must start with an alphanumeric character (cannot start with a period, hyphen, or underscore)',
        endWith: (v: string) => !/[._-]$/.test(v) || 'Username must end with an alphanumeric character (cannot end with a period, hyphen, or underscore)',
        consecutive: (v: string) => !/[._-]{2,}/.test(v) || 'Username cannot contain consecutive periods, hyphens, or underscores',
        length: (v: string) => (v.length >= 2 && v.length <= 60) || 'Username must be between 2 and 60 characters'
      }
    },
  },
  {
    type: 'text',
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter First Name',
    validation: { required: 'First Name is required' },
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter Last Name',
    validation: {},
  },
  {
    type: 'text',
    name: 'contactNumber',
    label: 'Contact No.',
    placeholder: 'Enter Contact No.',
    validation: { required: 'Contact No. is required' },
  },
  {
    type: 'select',
    name: 'userType',
    label: 'User Role',
    placeholder: 'Select User Role',
    options: [
      { label: 'Super Admin', value: 'superAdmin' },
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' }
    ],
    validation: { required: 'User Type is required' },
  },
  {
    type: 'select',
    name: 'userStatus',
    label: 'Status',
    placeholder: 'Enter Status',
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" }
    ],
    validation: { required: 'Status is required' },
  },
  {
    type: 'select',
    name: 'roleId',
    label: 'User Role',
    options: [
      { label: 'Super Admin', value: 'superAdmin' },
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' }
    ],
    validation: { required: 'User Role is required' },
  },
  {
    type: "password",
    name: "password",
    label: "Password",
    placeholder: "Enter Password",
    validation: {
      required: 'Password is required',
      minLength: { value: 12, message: 'Password must be at least 12 characters' },
      maxLength: { value: 128, message: 'Password cannot exceed 128 characters' },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        message: 'Password must include uppercase, lowercase, and a number'
      },
      validate: {
        notCommon: (v: string) => {
          const commonPasswords = [
            'password', 'password123', 'password@123', 'pass1234',
            '12345678', '123456789', '87654321', 'qwertyuiop',
            'admin123', 'admin@123', 'welcome123', 'welcome@123'
          ];
          return !commonPasswords.includes(v.toLowerCase()) || 'Password is too common and weak';
        },
        notSimilar: (v: string, formValues: any) => {
          const passwordLower = v.toLowerCase();
          const usernameLower = (formValues.userId || '').toLowerCase();
          const firstNameLower = (formValues.firstName || '').toLowerCase();
          const lastNameLower = (formValues.lastName || '').toLowerCase();
          const emailLower = (formValues.emailId || '').toLowerCase();

          if (usernameLower && passwordLower.includes(usernameLower)) {
            return 'Password cannot contain your username';
          }
          if (firstNameLower && passwordLower.includes(firstNameLower)) {
            return 'Password cannot contain your first name';
          }
          if (lastNameLower && passwordLower.includes(lastNameLower)) {
            return 'Password cannot contain your last name';
          }
          if (emailLower) {
            const emailPrefix = emailLower.split('@')[0];
            if (emailPrefix && passwordLower.includes(emailPrefix)) {
              return 'Password cannot contain your email prefix';
            }
          }
          return true;
        }
      }
    }
  }
]

export const ElementDetailForm: InputConfig = [
  {
    type: 'text',
    name: 'elementDtlId',
    label: 'Detail ID',
    isDisabled: true,
  },
  {
    type: 'text',
    name: 'elementDtlName',
    label: 'Detail Name',
    placeholder: 'Enter Detail Name',
    validation: { required: 'Detail Name is required' },
  },
  {
    type: 'text',
    name: 'elementDtlType',
    label: 'Type',
    placeholder: 'Enter Type',
    validation: {},
  },
  {
    type: 'textarea',
    name: 'elementDtlDesc',
    label: 'Description',
    placeholder: 'Enter Description',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlHome',
    label: 'Home Component',
    placeholder: 'Enter Home Component',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlURL',
    label: 'URL Link',
    placeholder: 'Enter URL Link',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlFatNo',
    label: 'FAT Number',
    placeholder: 'Enter FAT Number',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlSeq',
    label: 'Sequence',
    placeholder: 'Enter Sequence',
    validation: {},
  },
  {
    type: 'checkbox',
    name: 'isAssigned',
    label: 'Assigned',
  }
];

export const ChildElementForm: InputConfig = [
  {
    type: 'text',
    name: 'chElementDtlId',
    label: 'Child Detail ID',
    placeholder: 'Auto-generated if left blank',
    isDisabled: false,
  },
  {
    type: 'text',
    name: 'elementDtlName',
    label: 'Name',
    placeholder: 'Enter Name',
    validation: { required: 'Name is required' },
  },
  {
    type: 'text',
    name: 'elementDtlType',
    label: 'Type',
    placeholder: 'Enter Type',
    validation: {},
  },
  {
    type: 'textarea',
    name: 'elementDtlDesc',
    label: 'Description',
    placeholder: 'Enter Description',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlHome',
    label: 'Home Component',
    placeholder: 'Enter Home Component',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlURL',
    label: 'URL Link',
    placeholder: 'Enter URL Link',
    validation: {},
  },
  {
    type: 'text',
    name: 'elementDtlFatNo',
    label: 'FAT Number',
    placeholder: 'Enter FAT Number',
    validation: {},
  },
  {
    type: 'text',
    name: 'demoUrl',
    label: 'Demo URL',
    placeholder: 'Enter Demo URL',
    validation: {},
  },
  // {
  //   type: 'text',
  //   name: 'componentType',
  //   label: 'Component Type',
  //   placeholder: 'Enter Component Type',
  //   validation: {},
  // },
  {
    type: 'text',
    name: 'elementDtlSeq',
    label: 'Sequence',
    placeholder: 'Enter Sequence',
    validation: {},
  },

  {
    type: 'checkbox',
    name: 'isAssigned',
    label: 'Is Assigned',
  }
];

export const DmsCreationForm: InputConfig = [
  {
    type: 'textarea',
    name: 'sshKey',
    label: 'SSH Key',
    placeholder: 'Enter SSH Key',
    validation: { required: 'SSH Key is required' },
  },
  {
    type: 'text',
    name: 'username',
    label: 'Username',
    placeholder: 'Enter Username',
    validation: { required: 'Username is required' },
  },
  {
    type: 'text',
    name: 'portOrIp',
    label: 'PORT/IP',
    placeholder: 'Enter PORT/IP',
    validation: { required: 'PORT/IP is required' },
  },
  {
    type: 'text',
    name: 'deploymentPath',
    label: 'Deployment Path',
    placeholder: 'Enter Deployment Path',
    validation: { required: 'Deployment Path is required' },
  },
];

// ==========================================
// PLAN / COMPONENT / TEMPLATE MANAGEMENT FORMS
// ==========================================
export const PlanForm: InputConfig = [
  {
    type: 'text',
    name: 'hostPlanName',
    label: 'Plan Name',
    validation: { required: 'Plan Name is required' },
  },
  {
    type: 'text',
    name: 'hostPlanCatagory',
    label: 'Category',
  },
  {
    type: 'select',
    name: 'hostPlanStatus',
    label: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
  {
    type: 'text',
    name: 'hostNode',
    label: 'Node',
  },
  {
    type: 'text',
    name: 'hostCPU',
    label: 'CPU',
  },
  {
    type: 'text',
    name: 'hostMem',
    label: 'Memory',
  },
  {
    type: 'text',
    name: 'hostStorage',
    label: 'Storage',
  },
  {
    type: 'text',
    name: 'hostPlanBasePr',
    label: 'Base Price',
  },
  {
    type: 'text',
    name: 'hostMaxPod',
    label: 'Max Pods',
  },
  {
    type: 'text',
    name: 'hostMaxBandw',
    label: 'Max Bandwidth',
  },
  {
    type: 'text',
    name: 'hostMinDuration',
    label: 'Min Duration',
  },
  {
    type: 'text',
    name: 'hostPlanSpotlight',
    label: 'Spotlight',
  },
  {
    type: 'textarea',
    name: 'hostPlanDesc',
    label: 'Description',
    gridSpan: 'md:col-span-4',
  },
  {
    type: 'text',
    name: 'hostPlanDtlPageLink',
    label: 'Detail Page Link',
    gridSpan: 'md:col-span-4',
  },
];

export const PlanCompMappingForm: InputConfig = [
  {
    type: 'select',
    name: 'compId',
    label: 'Component',
    options: [],
    validation: { required: 'Component is required' },
  },
  {
    type: 'select',
    name: 'compGroupId',
    label: 'Component Group',
    options: [],
  },
  {
    type: 'select',
    name: 'hostPlanCompType',
    label: 'Selection Type',
    options: [
      { label: 'Dedicated', value: 'dedicated' },
      { label: 'Shared', value: 'shared' },
    ],
  },
  {
    type: 'text',
    name: 'hostBaseMNPr',
    label: 'Price / Day',
  },
];

export const ComponentForm: InputConfig = [
  {
    type: 'text',
    name: 'compId',
    label: 'Component ID',
    placeholder: 'Auto generated if empty',
  },
  {
    type: 'text',
    name: 'compName',
    label: 'Component Name',
    validation: { required: 'Component Name is required' },
  },
  {
    type: 'select',
    name: 'compType',
    label: 'Component Type',
    options: [
      { label: 'Dedicated', value: 'dedicated' },
      { label: 'Shared', value: 'shared' },
    ],
  },
  {
    type: 'select',
    name: 'compStatus',
    label: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
  {
    type: 'text',
    name: 'envPlatform',
    label: 'Platform',
  },
  {
    type: 'text',
    name: 'k8sCompName',
    label: 'K8s Component Name',
  },
  {
    type: 'text',
    name: 'envGitPath',
    label: 'Git Path',
    gridSpan: 'md:col-span-4',
  },
  {
    type: 'password',
    name: 'envGitToken',
    label: 'Git Access Token',
    gridSpan: 'md:col-span-4',
  },
  {
    type: 'text',
    name: 'sgaredCompServUrl',
    label: 'Shared Component Service URL',
    gridSpan: 'md:col-span-4',
  },
  {
    type: 'checkbox',
    name: 'isProxyExpose',
    label: 'Expose via HAProxy',
  },
  {
    type: 'textarea',
    name: 'compDesc',
    label: 'Description',
    gridSpan: 'md:col-span-4',
  },
];

export const CompSpecForm: InputConfig = [
  {
    type: 'text',
    name: 'specid',
    label: 'Spec ID',
    placeholder: 'Auto generated if empty',
  },
  {
    type: 'text',
    name: 'specName',
    label: 'Spec Name',
    validation: { required: 'Spec Name is required' },
  },
  {
    type: 'text',
    name: 'specType',
    label: 'Spec Type',
  },
  {
    type: 'text',
    name: 'specvalues',
    label: 'Default Value',
  },
  {
    type: 'text',
    name: 'tmplSpecVarName',
    label: 'Template Variable Name',
  },
  {
    type: 'select',
    name: 'compstatus',
    label: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
  {
    type: 'checkbox',
    name: 'isEditable',
    label: 'Editable',
  },
  {
    type: 'textarea',
    name: 'specdesc',
    label: 'Description',
    gridSpan: 'md:col-span-4',
  },
];

export const CompTemplateForm: InputConfig = [
  {
    type: 'text',
    name: 'fileName',
    label: 'File Name',
    placeholder: 'e.g. deployment',
    validation: { required: 'File Name is required' },
  },
  {
    type: 'text',
    name: 'filePath',
    label: 'File Path',
    placeholder: 'Manifest folder path inside the gitops repo',
  },
  {
    type: 'select',
    name: 'tmplType',
    label: 'Template Type',
    options: [
      { label: 'Manifest', value: 'manifest' },
      { label: 'App (ArgoCD)', value: 'app' },
    ],
  },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
];


export const HAProxyForm: InputConfig = [
  {
      name: "compServName",
      label: "Component / Service Name",
      type: "text",
      placeholder: "e.g. keycloak, auth-api",
      validation: { required: "Service Name is required" },
  },
  {
      name: "domainName",
      label: "Domain Name",
      type: "text",
      placeholder: "e.g. keycloak-dev.example.com",
      validation: { required: "Domain Name is required" },
  },
  {
      name: "backendType",
      label: "Backend Type",
      type: "select",
      options: [
          { label: "K8S_DNS (Kubernetes Cluster DNS)", value: "K8S_DNS" },
          { label: "EXTERNAL_IP (Direct IP Address)", value: "EXTERNAL_IP" },
          { label: "SSL (HTTPS upstream)", value: "SSL" },
          { label: "PATH_REWRITE (Path Prefix Strip/Rewrite)", value: "PATH_REWRITE" },
          { label: "WEBSOCKET (Extended tunnel timeout)", value: "WEBSOCKET" },
          { label: "TIME_CONFIGURABLE (Custom timeout)", value: "TIME_CONFIGURABLE" },
          { label: "TCP (TCP stream)", value: "TCP" },
      ],
      placeholder: "Select Backend Type",
  },
  {
      name: "internalPort",
      label: "Port",
      type: "number",
      placeholder: "e.g. 8080",
  },
  {
      name: "namespace",
      label: "K8s Namespace",
      type: "text",
      placeholder: "e.g. dev, uat",
  },
  {
      name: "envId",
      label: "Environment ID",
      type: "text",
      placeholder: "Optional (defaults to namespace)",
  },
  {
      name: "parentFrontend",
      label: "Parent Frontend",
      type: "text",
      placeholder: "http_front",
  },
  {
      name: "pathPrefix",
      label: "Path Prefix (for PATH_REWRITE)",
      type: "text",
      placeholder: "e.g. /api/v1",
  },
  {
      name: "serverAddress",
      label: "Server Address (for EXTERNAL_IP)",
      type: "text",
      placeholder: "e.g. 192.0.2.28",
  },
  {
      name: "serverPort",
      label: "Server Port (for EXTERNAL_IP)",
      type: "number",
      placeholder: "e.g. 9001",
  },
  {
      name: "timeoutServer",
      label: "Server Timeout (ms)",
      type: "number",
      placeholder: "e.g. 600000",
  },
  {
      name: "timeoutTunnel",
      label: "Tunnel Timeout (ms)",
      type: "number",
      placeholder: "e.g. 600000",
  },
  {
      name: "subpath",
      label: "Subpath",
      type: "text",
      placeholder: "Optional",
  },
  {
      name: "lineIndex",
      label: "Line Index",
      type: "text",
      placeholder: "0",
  },
];