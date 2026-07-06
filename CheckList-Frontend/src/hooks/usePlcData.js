import { usePlcDashboard } from "./plc/usePlcDashboard";
import { usePlcDashboardOptions } from "./plc/usePlcDashboardOptions";
import { usePlcReport } from "./plc/usePlcReport";
import { usePlcReportOptions } from "./plc/usePlcReportOptions";
import { usePlcErrorDistribution } from "./plc/usePlcErrorDistribution";
import { usePlcDowntimeByMachine } from "./plc/usePlcDowntimeByMachine";
import { usePlcDowntimeByError } from "./plc/usePlcDowntimeByError";
import { usePlcDowntimeByErrorStatus } from "./plc/usePlcDowntimeByErrorStatus";
import { usePlcTimeDistribution } from "./plc/usePlcTimeDistribution";
import { useMachineStoppage } from "./plc/useMachineStoppage";
import { useMachineHistory } from "./plc/useMachineHistory";
import { useMachineSummary } from "./plc/useMachineSummary";
import { useMachineLatestStatus } from "./plc/useMachineLatestStatus";
import { useMachineModelOptions } from "./plc/useMachineModelOptions";
import { usePlcDataListing } from "./plc/usePlcDataListing";
import { usePlcData as useRawPlcData } from "./plc/usePlcData";

// Re-export all individual hooks
export {
  usePlcDashboard,
  usePlcDashboardOptions,
  usePlcReport,
  usePlcReportOptions,
  usePlcErrorDistribution,
  usePlcDowntimeByMachine,
  usePlcDowntimeByError,
  usePlcDowntimeByErrorStatus,
  usePlcTimeDistribution,
  useMachineStoppage,
  useMachineHistory,
  useMachineSummary,
  useMachineLatestStatus,
  useMachineModelOptions,
  usePlcDataListing,
  useRawPlcData as usePlcDataIndividual,
};

// Legacy combined hook for backward compatibility
export const usePlcData = (filters = {}, options = {}) => {
  const { enabledQueries = null } = options;

  const isEnabled = (queryName) => {
    if (enabledQueries === null) return true;
    return !!enabledQueries[queryName];
  };

  const getAllPlcData = useRawPlcData(filters, {
    ...options,
    enabled: isEnabled("getAllPlcData"),
  });

  const getPlcDashboard = usePlcDashboard(filters, {
    ...options,
    enabled: isEnabled("getPlcDashboard"),
  });

  const getPlcDashboardOptions = usePlcDashboardOptions({
    ...options,
    enabled: isEnabled("getPlcDashboardOptions"),
  });

  const getPlcErrorDistribution = usePlcErrorDistribution(filters, {
    ...options,
    enabled: isEnabled("getPlcErrorDistribution"),
  });

  const getPlcDowntimeByMachine = usePlcDowntimeByMachine(filters, {
    ...options,
    enabled: isEnabled("getPlcDowntimeByMachine"),
  });

  const getPlcTimeDistribution = usePlcTimeDistribution(filters, {
    ...options,
    enabled: isEnabled("getPlcTimeDistribution"),
  });

  const getMachineStoppage = useMachineStoppage(filters, {
    ...options,
    enabled: isEnabled("getMachineStoppage"),
  });

  const getPlcReport = usePlcReport(filters, {
    ...options,
    enabled: isEnabled("getPlcReport"),
  });

  const getPlcReportOptions = usePlcReportOptions({
    ...options,
    enabled: isEnabled("getPlcReportOptions"),
  });

  const getPlcDowntimeByError = usePlcDowntimeByError(filters, {
    ...options,
    enabled: isEnabled("getPlcDowntimeByError"),
  });

  const getPlcDowntimeByErrorStatus = usePlcDowntimeByErrorStatus(filters, {
    ...options,
    enabled: isEnabled("getPlcDowntimeByErrorStatus"),
  });

  const getMachineHistory = useMachineHistory(filters, {
    ...options,
    enabled: isEnabled("getMachineHistory"),
  });

  const getMachineSummary = useMachineSummary(filters, {
    ...options,
    enabled: isEnabled("getMachineSummary"),
  });

  const getMachineLatestStatus = useMachineLatestStatus(filters, {
    ...options,
    enabled: isEnabled("getMachineLatestStatus"),
  });

  const getAllPlcDatalisting = usePlcDataListing(filters, {
    ...options,
    enabled: isEnabled("getAllPlcDatalisting"),
  });

  return {
    getAllPlcData,
    getPlcDashboard,
    getPlcDashboardOptions,
    getPlcErrorDistribution,
    getPlcDowntimeByMachine,
    getPlcTimeDistribution,
    getMachineStoppage,
    getPlcReport,
    getPlcReportOptions,
    getPlcDowntimeByError,
    getPlcDowntimeByErrorStatus,
    getMachineHistory,
    getMachineSummary,
    getMachineLatestStatus,
    getAllPlcDatalisting,
  };
};
