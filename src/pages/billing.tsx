import React, { useEffect, useState, useCallback } from 'react';
import { RegistrationService } from '@/services/registration.service';
import { BillingAdminService } from '@/services/billing.service';
import NNPGrid from '@/widgets/dataGrid';
import NoDataWatermark from '@/widgets/noData';
import Modal from '@/widgets/modal';
import { alertAction } from '@/shared/utils';
import { GridColDef } from '@mui/x-data-grid';

// Valid billing status transitions (mirrors backend validation)
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN:     ['PENDING', 'CANCELLED'],
  PENDING:  ['PAID', 'DISPUTED', 'CANCELLED'],
  DISPUTED: ['PAID', 'CANCELLED'],
  PAID:     ['CANCELLED'],
  CANCELLED: [],
};

const STATUS_COLORS: Record<string, string> = {
  OPEN:      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PENDING:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PAID:      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DISPUTED:  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const getEnvDisplay = (env: any): string => {
  if (!env) return 'Default';
  if (typeof env === 'string') return env;
  if (typeof env === 'object') {
    return env.envCode || env.envId || env.envName || 'Default';
  }
  return String(env);
};

const BillingManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAcc, setSelectedAcc] = useState<any>(null);
  const [selectedAccName, setSelectedAccName] = useState<string>('');
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bills' | 'lines' | 'comms'>('bills');

  // Billing Data States
  const [headerBills, setHeaderBills] = useState<any[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [billLines, setBillLines] = useState<any[]>([]);
  const [commsList, setCommsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal: Send Invoice for a specific bill
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [invoiceTargetBill, setInvoiceTargetBill] = useState<any>(null);
  const [isSendingInvoice, setIsSendingInvoice] = useState<boolean>(false);

  // Modal: Run Daily Billing
  const [isRunDailyModalOpen, setIsRunDailyModalOpen] = useState<boolean>(false);
  const [dailyRunDate, setDailyRunDate] = useState<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isRunningDaily, setIsRunningDaily] = useState<boolean>(false);

  // Modal: Update Bill Status
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusTargetBill, setStatusTargetBill] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal: Close Billing Cycle
  const [isCloseCycleModalOpen, setIsCloseCycleModalOpen] = useState<boolean>(false);
  const [closingDate, setClosingDate] = useState<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isClosingCycle, setIsClosingCycle] = useState<boolean>(false);

  // 1. Fetch Accounts List
  useEffect(() => {
    RegistrationService.getAllAccounts(0, 100)
      .then((res: any) => {
        const list = res?.content || res?.accounts || res || [];
        setAccounts(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedAcc(first);
          setSelectedAccName(first.accName || first.accountName || '');
          setSelectedAccId(first.accId || first.id || first.accName || '');
        }
      })
      .catch((err) => console.error('Failed to fetch accounts:', err));
  }, []);

  // 2. Fetch Header Bills
  const fetchHeaderBills = useCallback((accId: string) => {
    if (!accId) return;
    setLoading(true);
    BillingAdminService.getAccountBills(accId)
      .then((res: any) => {
        const bills = Array.isArray(res) ? res : res?.content || [];
        setHeaderBills(bills);
        if (bills.length > 0) setSelectedBillId(bills[0].accBillId);
        else { setSelectedBillId(''); setBillLines([]); }
      })
      .catch(() => setHeaderBills([]))
      .finally(() => setLoading(false));
  }, []);

  // 3. Fetch Daily Bill Lines
  const fetchBillLines = useCallback((billId: string) => {
    if (!billId) return;
    BillingAdminService.getBillLines(billId)
      .then((res: any) => setBillLines(Array.isArray(res) ? res : res?.content || []))
      .catch(() => setBillLines([]));
  }, []);

  // 4. Fetch Comms
  const fetchComms = useCallback((accId: string) => {
    if (!accId) return;
    BillingAdminService.getAccountComms(accId)
      .then((res: any) => setCommsList(Array.isArray(res) ? res : res?.content || []))
      .catch(() => setCommsList([]));
  }, []);

  useEffect(() => {
    if (selectedAccId) { fetchHeaderBills(selectedAccId); fetchComms(selectedAccId); }
  }, [selectedAccId, fetchHeaderBills, fetchComms]);

  useEffect(() => {
    if (selectedBillId) fetchBillLines(selectedBillId);
  }, [selectedBillId, fetchBillLines]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedAccName(name);
    const found = accounts.find((a) => (a.accName || a.accountName) === name);
    if (found) {
      setSelectedAcc(found);
      setSelectedAccId(found.accId || found.id || found.accName || '');
    }
  };

  // ── Action: Send Invoice for specific bill ────────────────────────────────
  const handleSendInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceTargetBill) { alertAction('error', 'Please select a bill.')(); return; }
    setIsSendingInvoice(true);
    try {
      await BillingAdminService.sendInvoiceForBill(invoiceTargetBill.accBillId);
      alertAction('success', `Invoice sent for ${invoiceTargetBill.accBillId} (${invoiceTargetBill.billPeriodStart || 'N/A'} → ${invoiceTargetBill.billPeriodEnd || 'N/A'})`)();
      setIsInvoiceModalOpen(false);
      fetchComms(selectedAccId);
    } catch (err: any) {
      alertAction('error', `Failed to send invoice: ${err.message || err}`)();
    } finally { setIsSendingInvoice(false); }
  };

  // ── Action: Run Daily Billing ──────────────────────────────────────────────
  const handleRunDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccId) { alertAction('error', 'Please select an account.')(); return; }
    setIsRunningDaily(true);
    try {
      await BillingAdminService.runDailyBillManually(selectedAccId, dailyRunDate);
      alertAction('success', 'Daily bill calculation executed successfully!')();
      setIsRunDailyModalOpen(false);
      fetchHeaderBills(selectedAccId);
    } catch (err: any) {
      alertAction('error', `Failed to execute daily billing: ${err.message || err}`)();
    } finally { setIsRunningDaily(false); }
  };

  // ── Action: Update Bill Status ─────────────────────────────────────────────
  const openStatusModal = (bill: any) => {
    setStatusTargetBill(bill);
    const allowed = STATUS_TRANSITIONS[bill.accBillStatus] || [];
    setNewStatus(allowed[0] || '');
    setStatusComment('');
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetBill || !newStatus) return;
    setIsUpdatingStatus(true);
    try {
      await BillingAdminService.updateBillStatus(statusTargetBill.accBillId, newStatus, statusComment);
      alertAction('success', `Bill ${statusTargetBill.accBillId} status updated to ${newStatus}`)();
      setIsStatusModalOpen(false);
      fetchHeaderBills(selectedAccId);
      fetchComms(selectedAccId);
    } catch (err: any) {
      alertAction('error', `Status update failed: ${err.message || err}`)();
    } finally { setIsUpdatingStatus(false); }
  };

  // ── Action: Close Billing Cycle ────────────────────────────────────────────
  const handleCloseCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccId || !closingDate) { alertAction('error', 'Please select account and closing date.')(); return; }
    setIsClosingCycle(true);
    try {
      const res: any = await BillingAdminService.closeBillingCycle(selectedAccId, closingDate);
      alertAction('success', res?.message || `Cycle closed at ${closingDate}. Next cycle starts ${new Date(new Date(closingDate).getTime() + 86400000).toISOString().split('T')[0]}`)();
      setIsCloseCycleModalOpen(false);
      fetchHeaderBills(selectedAccId);
      fetchComms(selectedAccId);
    } catch (err: any) {
      alertAction('error', `Failed to close billing cycle: ${err.message || err}`)();
    } finally { setIsClosingCycle(false); }
  };

  // ── Column Definitions ─────────────────────────────────────────────────────
  const headerBillColumns: GridColDef[] = [
    { field: 'accBillId', headerName: 'INVOICE ID', flex: 1, minWidth: 150 },
    {
      field: 'accBillStatus', headerName: 'STATUS', width: 120,
      renderCell: (params: any) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[params.value] || 'bg-gray-100 text-gray-800'}`}>
          {params.value || 'OPEN'}
        </span>
      )
    },
    { field: 'billPeriodStart', headerName: 'PERIOD START', flex: 1, minWidth: 130 },
    { field: 'billPeriodEnd', headerName: 'PERIOD END', flex: 1, minWidth: 130 },
    {
      field: 'accBillAmount', headerName: 'TOTAL AMOUNT ($)', flex: 1, minWidth: 140,
      renderCell: (params: any) => `$${Number(params.value || 0).toFixed(4)}`
    },
    {
      field: 'accBillDt', headerName: 'CREATED DATE', flex: 1, minWidth: 180,
      renderCell: (params: any) => params.value ? new Date(params.value).toLocaleString() : '-'
    },
    {
      field: 'actions', headerName: 'ACTIONS', width: 200,
      renderCell: (params: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setSelectedBillId(params.row.accBillId); setActiveTab('lines'); }}
            className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded shadow transition-colors"
          >
            Lines
          </button>
          {(STATUS_TRANSITIONS[params.row.accBillStatus] || []).length > 0 && (
            <button
              onClick={() => openStatusModal(params.row)}
              className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded shadow transition-colors"
            >
              Status ✏️
            </button>
          )}
        </div>
      )
    }
  ];

  const billLineColumns: GridColDef[] = [
    { field: 'accBillLnId', headerName: 'LINE ID', flex: 1, minWidth: 140 },
    {
      field: 'accBillLnDt', headerName: 'DATE', flex: 1, minWidth: 160,
      renderCell: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-'
    },
    {
      field: 'tokenCost', headerName: 'TOKEN COST ($)', flex: 1, minWidth: 140,
      renderCell: (params: any) => `$${Number(params.value || 0).toFixed(4)}`
    },
    {
      field: 'compCost', headerName: 'COMP COST ($)', flex: 1, minWidth: 140,
      renderCell: (params: any) => `$${Number(params.value || 0).toFixed(4)}`
    },
    { field: 'activeCompCount', headerName: 'ACTIVE COMPS', width: 130 },
    {
      field: 'accBillLnAmount', headerName: 'DAILY TOTAL ($)', flex: 1, minWidth: 140,
      renderCell: (params: any) => `$${Number(params.value || 0).toFixed(4)}`
    }
  ];

  const commColumns: GridColDef[] = [
    { field: 'accCommId', headerName: 'COMM ID', width: 140 },
    {
      field: 'commDate', headerName: 'DATE & TIME', width: 180,
      renderCell: (params: any) => params.value ? new Date(params.value).toLocaleString() : '-'
    },
    { field: 'commType', headerName: 'TYPE', width: 160 },
    { field: 'commCategory', headerName: 'CATEGORY', width: 140 },
    { field: 'commTitle', headerName: 'TITLE', flex: 1, minWidth: 200 },
    { field: 'commDescription', headerName: 'SUMMARY', flex: 1, minWidth: 250 }
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1f1f1f] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Billing Management System</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage daily token bills, active component charges, monthly invoice closure, and manual email dispatches.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAccName}
            onChange={handleAccountChange}
            className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs font-medium rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {accounts.map((acc: any) => {
              const name = acc.accName || acc.accountName;
              const envDisplay = getEnvDisplay(acc.env);
              return (
                <option key={acc.accId || acc.id || name} value={name}>
                  {name} (ENV: {envDisplay})
                </option>
              );
            })}
          </select>

          <button
            onClick={() => {
              setInvoiceTargetBill(headerBills[0] || null);
              setIsInvoiceModalOpen(true);
            }}
            disabled={!selectedAccId || headerBills.length === 0}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            📧 Range Invoice
          </button>

          <button
            onClick={() => setIsRunDailyModalOpen(true)}
            disabled={!selectedAccId}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            ⚡ Run Daily
          </button>

          <button
            onClick={() => setIsCloseCycleModalOpen(true)}
            disabled={!selectedAccId}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            🔒 Close Cycle
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['bills', 'lines', 'comms'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab === 'bills'  && `📄 Header Bills (${headerBills.length})`}
            {tab === 'lines'  && `📊 Daily Lines (${billLines.length})${selectedBillId ? ` [${selectedBillId}]` : ''}`}
            {tab === 'comms'  && `📬 Comm Logs (${commsList.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-48 text-xs text-gray-500">Loading billing records...</div>
        ) : activeTab === 'bills' ? (
          headerBills.length > 0 ? (
            <div className="h-[420px] w-full">
              <NNPGrid rows={headerBills} columns={headerBillColumns} getRowId={(row: any) => row.accBillId} />
            </div>
          ) : <NoDataWatermark text="No billing headers found for this account." />
        ) : activeTab === 'lines' ? (
          billLines.length > 0 ? (
            <div className="h-[420px] w-full">
              <NNPGrid rows={billLines} columns={billLineColumns} getRowId={(row: any) => row.accBillLnId} />
            </div>
          ) : <NoDataWatermark text="No daily bill lines found for selected bill header." />
        ) : (
          commsList.length > 0 ? (
            <div className="h-[420px] w-full">
              <NNPGrid rows={commsList} columns={commColumns} getRowId={(row: any) => row.accCommId} />
            </div>
          ) : <NoDataWatermark text="No billing communication records found for this account." />
        )}
      </div>

      {/* ── Modal 1: Send Invoice for Specific Bill ── */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)}
        title={`Send Invoice Email — ${selectedAccName}`}>
        <form onSubmit={handleSendInvoiceSubmit} className="flex flex-col gap-4 p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select a bill header — the invoice email will use that bill's recorded <strong>period start</strong> and <strong>period end</strong> dates, and sum all of its linked daily bill lines.
          </p>

          {/* Bill Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Bill:</label>
            <select
              value={invoiceTargetBill?.accBillId || ''}
              onChange={(e) => {
                const found = headerBills.find((b: any) => b.accBillId === e.target.value);
                setInvoiceTargetBill(found || null);
              }}
              required
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-gray-100"
            >
              {headerBills.map((b: any) => (
                <option key={b.accBillId} value={b.accBillId}>
                  {b.accBillId} — {b.accBillStatus} — ${Number(b.accBillAmount || 0).toFixed(4)}
                </option>
              ))}
            </select>
          </div>

          {/* Period Info (read-only from the selected bill) */}
          {invoiceTargetBill && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <div>
                <div className="text-gray-400 mb-0.5">Period Start</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {invoiceTargetBill.billPeriodStart || <span className="text-gray-400">Not set</span>}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5">Period End</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {invoiceTargetBill.billPeriodEnd || <span className="text-gray-400">Not set</span>}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5">Total Amount</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${Number(invoiceTargetBill.accBillAmount || 0).toFixed(4)}
                </div>
              </div>
              <div className="col-span-3 flex justify-between items-center">
                <div>
                  <div className="text-gray-400 mb-0.5">Status</div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[invoiceTargetBill.accBillStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {invoiceTargetBill.accBillStatus}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 mb-0.5">Mapped Environment</div>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {getEnvDisplay(selectedAcc?.env)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-xs font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSendingInvoice || !invoiceTargetBill}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50">
              {isSendingInvoice ? 'Sending...' : '📧 Send Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal 2: Run Daily Billing ── */}
      <Modal isOpen={isRunDailyModalOpen} onClose={() => setIsRunDailyModalOpen(false)}
        title={`Execute Daily Billing — ${selectedAccName}`}>
        <form onSubmit={handleRunDailySubmit} className="flex flex-col gap-4 p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Executes the daily billing algorithm (token usage + K8s live pod check) for the selected date. Use if a nightly cron job failed.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Target Billing Date:</label>
            <input type="date" value={dailyRunDate} onChange={(e) => setDailyRunDate(e.target.value)} required
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsRunDailyModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-xs font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isRunningDaily}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50">
              {isRunningDaily ? 'Running...' : 'Execute Daily Calculation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal 3: Update Bill Status ── */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}
        title={`Update Bill Status — ${statusTargetBill?.accBillId}`}>
        <form onSubmit={handleStatusUpdateSubmit} className="flex flex-col gap-4 p-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500">Current Status:</div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[statusTargetBill?.accBillStatus] || ''}`}>
              {statusTargetBill?.accBillStatus}
            </span>
            <div className="text-xs text-gray-400 mx-1">→</div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[newStatus] || 'bg-gray-100 text-gray-600'}`}>
              {newStatus || '…'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">New Status:</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-gray-100">
              {(STATUS_TRANSITIONS[statusTargetBill?.accBillStatus] || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Admin Comment <span className="font-normal text-gray-400">(optional)</span>:</label>
            <textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              rows={2}
              placeholder="e.g. Payment received via wire transfer"
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
            ⚠️ Allowed transitions: OPEN→PENDING, PENDING→PAID/DISPUTED, DISPUTED→PAID, Any→CANCELLED
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-xs font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isUpdatingStatus || !newStatus}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50">
              {isUpdatingStatus ? 'Updating...' : `Set to ${newStatus}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal 4: Close Billing Cycle ── */}
      <Modal isOpen={isCloseCycleModalOpen} onClose={() => setIsCloseCycleModalOpen(false)}
        title={`Close Billing Cycle — ${selectedAccName}`}>
        <form onSubmit={handleCloseCycleSubmit} className="flex flex-col gap-4 p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Closes the current <strong>OPEN</strong> billing cycle at the specified closing date.
            The next billing cycle will automatically start from <strong>closing date + 1 day</strong>.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Closing Date (last day of cycle):</label>
            <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} required
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-gray-100" />
          </div>

          {closingDate && (
            <div className="flex gap-4 p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <div>
                <div className="text-gray-400 mb-0.5">Cycle ends:</div>
                <div className="font-semibold text-red-600 dark:text-red-400">{closingDate}</div>
              </div>
              <div className="text-gray-300 dark:text-gray-600 self-center">→</div>
              <div>
                <div className="text-gray-400 mb-0.5">Next cycle starts:</div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {new Date(new Date(closingDate).getTime() + 86400000).toISOString().split('T')[0]}
                </div>
              </div>
            </div>
          )}

          <div className="p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded text-xs text-rose-700 dark:text-rose-300">
            🔒 This will finalize the current OPEN bill (set to PENDING), send a closure invoice email, and open a new billing cycle.
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsCloseCycleModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-xs font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isClosingCycle}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50">
              {isClosingCycle ? 'Closing Cycle...' : '🔒 Confirm Close Cycle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingManagement;
