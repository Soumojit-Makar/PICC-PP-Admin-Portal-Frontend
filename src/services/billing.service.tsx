import ApiService from './api.service';
import { getXUser } from '@/shared/utils';

// dashboard-config-backend admin billing endpoints
const ADMIN_POTAL = import.meta.env.VITE_ADMIN_POTAL as string || '';
const BILLING_URL = `${ADMIN_POTAL}/admin/billing`;

export const BillingAdminService = {
  // Fetch all header bills for an account
  getAccountBills: (accId: string) =>
    ApiService.get(`${BILLING_URL}/bills/${accId}`, { 'X-User-Name': getXUser() } as HeadersInit),

  // Fetch daily bill line items for a specific bill header
  getBillLines: (billId: string) =>
    ApiService.get(`${BILLING_URL}/bill-lines/${billId}`, { 'X-User-Name': getXUser() } as HeadersInit),

  // Fetch billing communication logs for an account
  getAccountComms: (accId: string) =>
    ApiService.get(`${BILLING_URL}/comms/${accId}`, { 'X-User-Name': getXUser() } as HeadersInit),

  // Manually send bill statement for custom date range (legacy)
  sendBillManually: (accId: string, fromDate: string, toDate: string) =>
    ApiService.post(`${BILLING_URL}/${accId}/send-bill?fromDate=${fromDate}&toDate=${toDate}`, {}, { 'X-User-Name': getXUser() } as HeadersInit),

  /**
   * Send invoice email for a specific bill header.
   * Uses the bill's own period start/end dates and its linked bill lines.
   */
  sendInvoiceForBill: (billId: string) =>
    ApiService.post(`${BILLING_URL}/bills/${billId}/send-invoice`, {}, { 'X-User-Name': getXUser() } as HeadersInit),

  // Manually run daily billing calculation for account
  runDailyBillManually: (accId: string, billingDate?: string) => {
    const query = billingDate ? `?billingDate=${billingDate}` : '';
    return ApiService.post(`${BILLING_URL}/${accId}/run-daily${query}`, {}, { 'X-User-Name': getXUser() } as HeadersInit);
  },

  /**
   * Update the status of a specific bill header.
   * Allowed transitions: OPEN→PENDING, PENDING→PAID|DISPUTED, DISPUTED→PAID, Any→CANCELLED
   */
  updateBillStatus: (billId: string, status: string, comment?: string) =>
    ApiService.patch(`${BILLING_URL}/bills/${billId}/status`, { status, comment }, { 'X-User-Name': getXUser() } as HeadersInit),

  /**
   * Close the current OPEN billing cycle at a specific closing date.
   * Next cycle will automatically start from closingDate + 1.
   */
  closeBillingCycle: (accId: string, closingDate: string) =>
    ApiService.post(`${BILLING_URL}/${accId}/close-cycle?closingDate=${closingDate}`, {}, { 'X-User-Name': getXUser() } as HeadersInit),
};
