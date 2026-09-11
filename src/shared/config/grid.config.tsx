import { type GridColDef } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { showConfirmDialog } from "@/widgets/confirmDialog";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import NotInterestedOutlinedIcon from "@mui/icons-material/NotInterestedOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // <-- NEW IMPORT
import { convertDateNative } from "../utils";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import TerminalIcon from "@mui/icons-material/Terminal";

type GridActionHandlers<T = any> = {
  onAdd?: (row: T) => void;
  onEdit?: (row: T, gridType?: string) => void;
  onDisable?: (row: T, gridType?: string) => void;
  onDelete?: (row: T, gridType?: string) => void;
  onDetails?: (row: T, gridType?: string) => void;
  getStatus?: (row: T) => string | undefined;
  gridType?: string;
};

export const AccessManagementColumnGrid: GridColDef[] = [
  { field: 'userId', headerName: 'USER ID', flex: 1, width: 100 },
  {
    field: 'fullName',
    headerName: 'NAME',
    width: 200,
    renderCell: (params) => {
      const row = params?.row ?? {};
      return `${row.firstName || ''} ${row.lastName || ''}`;
    },
  },
  // { field: 'firstName', headerName: 'NAME', width: 200 },
  { field: 'emailId', headerName: 'EMAIL', flex: 1, width: 100 },
  { field: 'updateDate', headerName: 'REQ DATE', flex: 1, width: 100 },
  { field: 'userStatus', headerName: 'STATUS', flex: 1, width: 100 },
]

export const RegistrationRequestColumnGrid: GridColDef[] = [
  { field: 'accName', headerName: 'ACCOUNT', width: 300, flex: 1 },
  {
    field: 'date', headerName: 'DATE', width: 200, flex: 1,
    renderCell: (params: any) => {
      return convertDateNative(params?.row?.nnpCountry?.createdOn || '');
    }
  },
  { field: 'accStatus', headerName: 'STATUS', width: 100, flex: 1 },
  {
    field: 'country', headerName: 'COUNTRY', width: 200, flex: 1,
    renderCell: (params: any) => {
      return params?.row?.nnpCountry?.countryCode || '';
    }
  },
]

export const BillingColumnGrid: GridColDef[] = [
  { field: 'billAmount', headerName: 'BILL AMOUNT', width: 300, flex: 1 },
  { field: 'logDate', headerName: 'LOG DATE', width: 100, flex: 1 },
  { field: 'month', headerName: 'MONTH', width: 100, flex: 1 },
  { field: 'paidAmount', headerName: 'AMOUNT PAID', width: 100, flex: 1 },
  { field: 'usage', headerName: 'USAGE', width: 100, flex: 1 },
  { field: 'invoiceUrl', headerName: 'INVOICE', width: 100, flex: 1 },
]

export const StatusColumnGrid: GridColDef[] = [
  { field: 'acc', headerName: 'COMPONENT', width: 300, flex: 1 },
  { field: 'status', headerName: 'STATUS', width: 100, flex: 1 },
]

export const DomainColumnGrid: GridColDef[] = [
  { field: 'domainName', headerName: 'DOMAIN', width: 400, flex: 1 },
  { field: 'domainVal', headerName: 'VALUE', width: 300, flex: 1 },
]

export const SupportColumnGrid: GridColDef[] = [
  { field: 'accountName', headerName: 'ACCOUNT', width: 200, flex: 1 },
  { field: 'reportDate', headerName: 'REPORT DATE', width: 150, flex: 1 },
  { field: 'resolveDate', headerName: 'RESOLVE DATE', width: 150, flex: 1 },
  { field: 'priority', headerName: 'PRIORITY', width: 150, flex: 1 },
  { field: 'status', headerName: 'STATUS', width: 100, flex: 1 },
]

export const ActivityLogColumnGrid: GridColDef[] = [
  { field: 'actId', headerName: 'ACTIVITY ID', width: 300, flex: 1 },
  { field: 'actNote', headerName: 'ACTIVITY NOTE', width: 400, flex: 1 },
  { field: 'actDesc', headerName: 'DESCRIPTION', width: 350, flex: 1 },
  { field: 'actDate', headerName: 'DATE', width: 400, flex: 1 },
  { field: 'actStatus', headerName: 'STATUS', width: 200, flex: 1 },
  { field: 'userId', headerName: 'USERID', width: 200, flex: 1 },
]

export const EnvColumnGrid: GridColDef[] = [
  { field: 'feaName', headerName: 'NAME', width: 300, flex: 1 },
  { field: 'feaType', headerName: 'TYPE', width: 200, flex: 1 },
  { field: 'feaDesc', headerName: 'DESCRIPTION', width: 400, flex: 1 },
  { field: 'feaSeq', headerName: 'SEQUENCE', width: 100, flex: 1 },
]

export const FeatureElementColumnGrid: GridColDef[] = [
  { field: 'elementId', headerName: 'ID', width: 180, flex: 1 },
  { field: 'elementName', headerName: 'NAME', width: 200, flex: 1 },
  { field: 'elementType', headerName: 'TYPE', width: 100, flex: 1 },
  { field: 'elementDesc', headerName: 'DESCRIPTION', width: 200, flex: 1 },
  { field: 'feaSeq', headerName: 'SEQUENCE', width: 100, flex: 1 },
  { field: 'elementPage', headerName: 'PAGE LINK', width: 200, flex: 1 },
]

export const ChildElementColumnGrid: GridColDef[] = [
  { field: 'chElementDtlId', headerName: 'ID', width: 180, flex: 1 },
  { field: 'elementDtlName', headerName: 'NAME', width: 300, flex: 1 },
  { field: 'elementDtlType', headerName: 'TYPE', width: 200, flex: 1 },
  { field: 'elementDtlDesc', headerName: 'DESCRIPTION', width: 400, flex: 1 },
  { field: 'elementDtlURL', headerName: 'LINK', width: 300, flex: 1 },
  { field: 'elementPage', headerName: 'COMPONENT ID', width: 200, flex: 1 },
  { field: 'elementPages', headerName: 'HOME', width: 200, flex: 1 },
  { field: 'homeIcon', headerName: 'HOME ICON', width: 400, flex: 1 },
  { field: 'demoUrl', headerName: 'DEMO URL', width: 100, flex: 1 },
  { field: 'elementDtlSeq', headerName: 'SEQUENCE', width: 100, flex: 1 },
]

export const ElementColumnGrid: GridColDef[] = [
  { field: 'elementDtlId', headerName: 'ID', width: 180, flex: 1 },
  { field: 'elementDtlName', headerName: 'NAME', width: 300, flex: 1 },
  { field: 'elementDtlType', headerName: 'TYPE', width: 200, flex: 1 },
  { field: 'elementDtlDesc', headerName: 'DESCRIPTION', width: 400, flex: 1 },
  { field: 'elementDtlURL', headerName: 'LINK', width: 300, flex: 1 },
  { field: 'elementPage', headerName: 'COMPONENT ID', width: 200, flex: 1 },
  { field: 'elementPages', headerName: 'HOME', width: 200, flex: 1 },
  { field: 'elementDtlSeq', headerName: 'SEQUENCE', width: 100, flex: 1 },
]

// ==========================================
// NEW: ACCOUNT COMMUNICATIONS GRID
// ==========================================
// Replace this: export const AccountCommunicationsColumnGrid = ...
// With this:
export const getAccountCommunicationsColumns = (handlers: {
  onViewDetails: (row: any) => void;
}): GridColDef[] => [
    { field: 'date', headerName: 'Date Time', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'message', headerName: 'Message', flex: 2 },
    {
      field: 'details',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" color="info" onClick={() => handlers.onViewDetails(params.row)}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
  ];


// ==========================================
// NEW: COMPONENTS DEPLOYED GRID
// ==========================================
// export const ComponentsDeployedColumnGrid: GridColDef[] = [
//   { field: 'podName', headerName: 'POD', flex: 1.5 },
//   { field: 'deploymentName', headerName: 'Deployment', flex: 1 },
//   { field: 'podStatus', headerName: 'Status', flex: 0.5 },
//   {
//     field: 'services',
//     headerName: 'Service',
//     flex: 1,
//     renderCell: (params) => {
//       // The JSON returns an array of services. We extract the names and join them with commas.
//       const servicesArray = params.row?.services || [];
//       return servicesArray.map((s: any) => s.serviceName).join(', ');
//     }
//   },
// ]
export const getComponentsDeployedColumns = (handlers: {
  onRestart: (row: any) => void;
  onDelete: (row: any) => void;
  onTerminal: (row: any) => void;
  onViewDetails: (row: any) => void;
}): GridColDef[] => [
    { field: 'podName', headerName: 'Pod Name', flex: 1.5 },
    { field: 'deploymentName', headerName: 'Deployment', flex: 1 },
    { field: 'podStatus', headerName: 'Status', flex: 0.5 },
    {
      field: 'memory',
      headerName: 'Memory',
      flex: 0.8,
      valueGetter: (_value: any, row: any) => row?.memory || row?.memoryUsage || '-'
    },
    {
      field: 'cpu',
      headerName: 'CPU',
      flex: 0.8,
      valueGetter: (_value: any, row: any) => row?.cpu || row?.cpuUsage || '-'
    },
    {
      field: 'services',
      headerName: 'Services',
      flex: 1.5,
      renderCell: (params: any) => {
        const servicesArray = params.row?.services || [];
        return servicesArray.map((s: any) => s.serviceName || s).join(', ');
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: any) => (
        <div className="flex items-center space-x-2">
          <Tooltip title="Restart Pod">
            <IconButton size="small" onClick={() => handlers.onRestart(params.row)} style={{ color: '#0099cc' }}>
              <AutorenewIcon style={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Pod">
            <IconButton size="small" onClick={() => handlers.onDelete(params.row)} style={{ color: '#ef4444' }}>
              <DeleteOutlineOutlinedIcon style={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exec Terminal">
            <IconButton size="small" onClick={() => handlers.onTerminal(params.row)} style={{ color: '#22c55e' }}>
              <TerminalIcon style={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {/* View Details Button */}
          <Tooltip title="View Pod Details">
            <IconButton
              size="small"
              onClick={() => handlers.onViewDetails(params.row)}
              style={{ color: '#6366f1' }}
            >
              <InfoOutlinedIcon style={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

        </div>
      )
    }
  ];

export const PlanComponentsColumnGrid: GridColDef[] = [
  { field: 'compName', headerName: 'Component', flex: 1 },
  { field: 'compDesc', headerName: 'Description', flex: 1.5 },
  { field: 'compStatus', headerName: 'Status', flex: 0.5 },
];

// ==========================================
// PLAN / COMPONENT / TEMPLATE MANAGEMENT GRIDS
// ==========================================
export const PlanColumnGrid: GridColDef[] = [
  { field: 'hostPlanid', headerName: 'PLAN ID', width: 90, flex: 0.6 },
  { field: 'hostPlanName', headerName: 'PLAN NAME', flex: 1 },
  { field: 'hostPlanCatagory', headerName: 'CATEGORY', width: 130, flex: 0.8 },
  { field: 'hostPlanStatus', headerName: 'STATUS', width: 100, flex: 0.6 },
  { field: 'hostNode', headerName: 'NODE', width: 110, flex: 0.7 },
  { field: 'hostCPU', headerName: 'CPU', width: 90, flex: 0.6 },
  { field: 'hostMem', headerName: 'MEMORY', width: 110, flex: 0.7 },
  { field: 'hostStorage', headerName: 'STORAGE', width: 110, flex: 0.7 },
  { field: 'hostPlanBasePr', headerName: 'BASE PRICE', width: 110, flex: 0.7 },
]

export const PlanCompMappingColumnGrid: GridColDef[] = [
  { field: 'hostRegPlanId', headerName: 'MAPPING ID', width: 110, flex: 0.7 },
  { field: 'compName', headerName: 'COMPONENT', flex: 1.2 },
  { field: 'compGroupTitle', headerName: 'GROUP', width: 140, flex: 0.9 },
  { field: 'hostPlanCompType', headerName: 'TYPE', width: 110, flex: 0.7 },
  { field: 'hostBaseMNPr', headerName: 'PRICE / DAY', width: 110, flex: 0.7 },
  { field: 'hostPlanCompStatus', headerName: 'STATUS', width: 100, flex: 0.6 },
]

export const ComponentColumnGrid: GridColDef[] = [
  { field: 'compId', headerName: 'COMPONENT ID', width: 140, flex: 0.9 },
  { field: 'compName', headerName: 'NAME', flex: 1 },
  { field: 'compType', headerName: 'TYPE', width: 100, flex: 0.6 },
  { field: 'envPlatform', headerName: 'PLATFORM', width: 130, flex: 0.8 },
  { field: 'k8sCompName', headerName: 'K8S NAME', width: 140, flex: 0.9 },
  { field: 'compStatus', headerName: 'STATUS', width: 100, flex: 0.6 },
  {
    field: 'isProxyExpose',
    headerName: 'HAPROXY',
    width: 100,
    flex: 0.6,
    renderCell: (params: any) => (params?.row?.isProxyExpose ? 'Yes' : 'No'),
  },
]

export const CompSpecColumnGrid: GridColDef[] = [
  { field: 'specid', headerName: 'SPEC ID', width: 130, flex: 0.8 },
  { field: 'specName', headerName: 'NAME', flex: 1 },
  { field: 'specType', headerName: 'TYPE', width: 110, flex: 0.7 },
  { field: 'specvalues', headerName: 'DEFAULT VALUE', width: 160, flex: 1 },
  { field: 'tmplSpecVarName', headerName: 'TEMPLATE VAR', width: 150, flex: 0.9 },
  { field: 'compstatus', headerName: 'STATUS', width: 100, flex: 0.6 },
]

export const CompTemplateColumnGrid: GridColDef[] = [
  { field: 'tmplId', headerName: 'TEMPLATE ID', width: 150, flex: 0.9 },
  { field: 'fileName', headerName: 'FILE NAME', flex: 1 },
  { field: 'filePath', headerName: 'FILE PATH', flex: 1.2 },
  { field: 'tmplType', headerName: 'TYPE', width: 100, flex: 0.6 },
  { field: 'status', headerName: 'STATUS', width: 100, flex: 0.6 },
]

export const SubscribedComponentsColumnGrid: GridColDef[] = [
  { field: 'category', headerName: 'Category', flex: 1.5 },
  { field: 'componentName', headerName: 'Component Name', flex: 1.5 },
  { field: 'price', headerName: 'Price / Day', flex: 0.5 },
]

export const getActionColumn = <T = any>(
  handlers: GridActionHandlers<T>
): GridColDef => ({
  field: 'actions',
  headerName: 'ACTIONS',
  flex: 1,
  minWidth: 150,
  // width: 120,
  sortable: false,
  filterable: false,
  disableColumnMenu: true,
  renderCell: (params) => {
    const status = handlers.getStatus?.(params.row);
    return (
      <div className="flex space-x-10" style={{ color: 'black' }}>
        {handlers.onDetails && (
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="inherit"
              onClick={(event) => {
                event.stopPropagation();
                handlers.onDetails?.(params.row, handlers.gridType);
              }}
            >
              <InfoOutlinedIcon style={{ color: '#6366f1' }} />
            </IconButton>
          </Tooltip>
        )}
        {handlers.onEdit && !params.row.isAdd && (
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="inherit"
              onClick={(event) => {
                event.stopPropagation(); // ✅ Prevent rowClick
                handlers.onEdit?.(params.row, handlers.gridType);
              }}
            >
              <EditNoteOutlinedIcon style={{ color: '#2563eb' }} />
            </IconButton>
          </Tooltip>
        )}
        {handlers.onAdd && params.row.isAdd && (
          <Tooltip title="Add">
            <IconButton
              color="inherit"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                handlers.onAdd?.(params.row)
              }
              }
            >
              <AddCircleOutlineOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
        {handlers.onDisable && (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handlers.onDisable?.(params.row, handlers.gridType)
            }
            }
          >
            {status === 'ACTIVE' &&
              <Tooltip title="Disable">
                <TaskAltOutlinedIcon sx={{ color: 'green' }} />
              </Tooltip>}

            {status != 'ACTIVE' &&
              <Tooltip title="Enable">
                <NotInterestedOutlinedIcon sx={{ color: 'orange' }} />
              </Tooltip>
            }
          </IconButton>
        )}
        {handlers.onDelete && !params.row.hideDelete && (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation(); // ✅ Prevent rowClick
              showConfirmDialog({
                title: "Are you sure?",
                message: "You won't be able to revert this!",
                type: "warning",
                confirmText: "Yes, delete it!",
                cancelText: "Cancel",
                onConfirm: () => handlers.onDelete?.(params.row, handlers.gridType),
              });
            }}
          >
            <Tooltip title="Delete">
              <DeleteOutlineOutlinedIcon color="error" />
            </Tooltip>
          </IconButton>
        )}
      </div>
    )
  },
});