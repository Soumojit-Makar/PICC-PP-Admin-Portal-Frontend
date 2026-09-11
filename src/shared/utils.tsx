import Cookies from 'js-cookie';
import { showConfirmDialog } from '../widgets/confirmDialog';
import AuthAPI from '@/services/auth.service';
import CookieService from '@/services/cookie.service';
const domainConstList = ['ConsumerCategory', 'commonStatus', 'orgBillCycle', 'orgCategory', 'planAction', 'planCategory', 'planVolumeMaxUnit', 'apiProtocol', 'apiStatus', 'status']
export const formatSelectOptions = (domainconfig: any, input: any) => {
  if (input.type === 'select') {
    const rawOptions = input.labelKey ? domainconfig[input.labelKey] : domainconfig;
    const options = rawOptions.map((element: any) => ({
      label: element, value: element
    }))
    return options;
  }
  return input;
}
export const handleLogout = async () => {
  const res = await AuthAPI.logout();
  if (res && res.code) {
    CookieService.clearCookies();
    localStorage.clear();
    window.location.reload();
  }
};
export const getdomainNameList = () => {
  return domainConstList.join(',');
}
export const clearAllCookies = () => {
  const allCookies = Cookies.get(); // returns object { key: value }
  Object.keys(allCookies).forEach(cookieName => {
    Cookies.remove(cookieName);
  });
};
export const alertAction = (action: string, msg: string) => async () => {
  // setAction('REFRESH');
  switch (action) {
    case 'error':
      showConfirmDialog({
        title: 'Error!',
        message: msg,
        confirmText: 'OK',
        // cancelText: 'Cancel',
        type: 'error',
        onCancel: () => {
        },
      });
      break;

    case 'success':
      showConfirmDialog({
        title: 'Success',
        message: msg,
        confirmText: 'OK',
        // cancelText: 'Cancel',
        type: 'success',
        onCancel: () => {
        },
      });
      break;
  }
}
export const getEnvCode = () => {
  const envCookie = Cookies.get('X-Env');
  const code = envCookie ? JSON.parse(envCookie) : { envCode: 'REL-V2023.01' };
  console.log('env:', code)
  return code;
}
export const getXUser = () => {
  const envCookie = Cookies.get('X-User-Name');
  const code = envCookie ? envCookie.toUpperCase() : 'GUEST';
  return code;
}
export const getXuserType = () => {
  const envCookie = Cookies.get('X-User-Type');
  const code = envCookie ? envCookie : 'pgadmin';
  return code;
}
export const convertDateNative = (isoString: string, showTime: boolean = true) => {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  };

  if (showTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
    options.hour12 = true;
  }

  return date.toLocaleString("en-IN", options);
};
export const createUrl = (
  basePath: string,
  pathTemplate: string,
  ...params: string[]
): string => {
  // Replace each parameter placeholder like ':envId' with the corresponding param value
  let url = pathTemplate;

  // Dynamically replace placeholders
  params.forEach((param, index) => {
    const placeholder = pathTemplate.match(/:\w+/g)?.[index]; // Get the placeholder directly by index
    if (placeholder) {
      url = url.replace(placeholder, param);
    }
  });

  return `${basePath}${url}`;
};
/**
 * Flattens the nested plan components object and excludes the namespace component.
 */
// export const getFlattenedPlanComponents = (planComponents: Record<string, any[]>): any[] => {
//   const flattened: any[] = [];

//   Object.entries(planComponents || {}).forEach(([category, comps]) => {
//     comps.forEach((c: any) => {
//       // Exclude namespace components from the output
//       if (c.componentId === 'bbcomp_namespace' || c.componentName === 'Namespace') {
//         return;
//       }

//       flattened.push({
//         id: c.componentId,
//         category: category,
//         componentName: c.componentName,
//         price: c.pricePerDay ? `${c.pricePerDay.currency}${c.pricePerDay.amount}` : '-'
//       });
//     });
//   });

//   return flattened;
// };
