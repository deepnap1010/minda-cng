import { Router } from 'express'

// ------------------  local imports -------------------
import { Authorization } from './middleware/Authorization.js'
import companyRoutes from './routes/company.routes.js'
import plantRoutes from './routes/plant.routes.js'
import roleRoutes from './routes/role.routes.js'
import usersRoutes from './routes/users.routes.js'
import processRoutes from './routes/process.routes.js'
import AssemblyRoutes from './routes/assembly.routes.js'
import PartRoutes from './routes/parts.routes.js'
import CheckItemRoutes from './routes/checklist.routes.js'
import CheckListHistoryRoutes from './routes/checkListHostory.routes.js'
import DashboardRoutes from './routes/dashboards.routes.js'
import TypesRoutes from './routes/types.routes.js'
import NotificationRoutes from './routes/notification.routes.js'
import departmentRoutes from './routes/department.routes.js'
import ReleaseGroupRoutes from './routes/releasingGroup.route.js'
import documentsRoutes from './routes/documents.routes.js'
import TemplateMasterRoutes from './routes/templateMaster.routes.js'
import WorkflowRoutes from './routes/workflow.routes.js'
import TemplateSubmissionRoutes from './routes/templateSubmission.routes.js'
import PlcDataRoutes from './routes/plcData.routes.js'
import { createPlcData } from './controller/plcData.controller.js'
import PlcProductRoutes from './routes/plcProduct.routes.js'
import QualityCheckRoutes from './routes/qualityCheck.routes.js'
import PlcDashboardRoutes from './routes/plcDashboard.routes.js'
import MachineHistoryRoutes from './routes/machineHistory.routes.js'
import StatusHistourRoutes from './routes/statusHistory.routes.js'
import EmailRoutes from './routes/email.routes.js'
import ProductionLogsRoutes from './routes/productionLogs.routes.js'
import TemplateSyncRoutes from './routes/templateSync.routes.js'
import { sapSyncApiKey } from './middleware/sapSyncApiKey.js'
import SapMaterialRoutes from './routes/sapMaterial.routes.js'
import CngRoutes from './routes/cng.routes.js'
import CylinderSyncRoutes from './routes/cylinderSync.routes.js'
import { createCngData } from './controller/cng.controller.js'
import SapRoutes from './routes/sap.routes.js'
import { createSapData } from './controller/sap.controller.js'
import { syncAccessLogger } from './utils/logger.js'

const routes = Router()

routes.use('/users', usersRoutes)
routes.use('/company', Authorization, companyRoutes)
routes.use('/plant', Authorization, plantRoutes)
routes.use('/roles', Authorization, roleRoutes)
routes.use('/process', Authorization, processRoutes)
routes.use('/assembly', Authorization, AssemblyRoutes)
routes.use('/parts', Authorization, PartRoutes)
routes.use('/checkitem', Authorization, CheckItemRoutes)
routes.use('/checkitem-history', Authorization, CheckListHistoryRoutes)
routes.use('/dashboard', Authorization, DashboardRoutes)
routes.use('/types', Authorization, TypesRoutes)
routes.use('/notification', Authorization, NotificationRoutes)
routes.use('/department', Authorization, departmentRoutes)
routes.use('/document', Authorization, documentsRoutes)
routes.use('/release-group', Authorization, ReleaseGroupRoutes)
routes.use('/template-master', Authorization, TemplateMasterRoutes)
routes.use('/workflow', Authorization, WorkflowRoutes)
routes.use('/template-submission', Authorization, TemplateSubmissionRoutes)
routes.get('/plc-data/ping', (_req, res) =>
  res.status(200).json({ message: 'plc-data route reachable' }),
)
routes.post('/plc-data', createPlcData) // PLC machines push data - no auth required
routes.use('/plc-data', PlcDataRoutes)
routes.use('/plc-dashboard', Authorization, PlcDashboardRoutes)
routes.use('/machine-history', Authorization, MachineHistoryRoutes)
routes.use('/plc-products', Authorization, PlcProductRoutes)
routes.use('/quality-check', Authorization, QualityCheckRoutes)
routes.use('/status-history', Authorization, StatusHistourRoutes)
routes.use('/email', Authorization, EmailRoutes)
routes.use('/production-logs', Authorization, ProductionLogsRoutes)

// CNG Cylinder Process Tracking — telemetry ingest is public (x-api-key); reads behind auth
routes.post('/cng/ingest', createCngData)
routes.use('/cng', Authorization, CngRoutes)

// SAP data ingest (user's INBOUND) — machines/SAP push payloads (x-api-key); inbox reads behind auth
routes.post('/sap/ingest', createSapData)
routes.use('/sap', Authorization, SapRoutes)

// Teammate's SAP material-master lookup — coexists on /sap (subpaths /materials,/material-types
// don't collide with the ingest's /ingest,/inbox,/keys above).
routes.use('/sap', Authorization, SapMaterialRoutes)

// Access log for the SAP-facing feeds. Logs ONE line per request AFTER it
// completes, so it records the OUTCOME too (200 OK / 401 AUTH-FAIL / 4xx-5xx
// ERROR), source IP, path, and whether a key was sent (never the key VALUE).
// Placed BEFORE the key check so failed attempts are logged as well. Written to
// logs/sync-access.log (own file) + console.
// NOTE: this only fires if the request REACHES the app — a network-level refusal
// (NIECONN_REFUSED) never arrives here and so leaves no line (that absence is
// itself the proof the block is upstream of us).
routes.use('/sync', (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const keyState = (req.headers['x-api-key'] || req.headers.authorization) ? 'present' : 'MISSING'
  const t0 = Date.now()
  res.on('finish', () => {
    const s = res.statusCode
    const outcome = s < 400 ? 'OK' : s === 401 ? 'AUTH-FAIL' : 'ERROR'
    syncAccessLogger.info(
      `[sync-access] ip=${ip} ${req.method} ${req.originalUrl} key=${keyState} -> ${s} ${outcome} ${Date.now() - t0}ms ua="${req.headers['user-agent'] || '-'}"`
    )
  })
  next()
})

// Teammate's OUTBOUND template->SAP sync feed for Minda's engineers (x-api-key auth, NOT user login).
// Replaces the user's earlier /integration delta-pull API.
routes.use('/sync', sapSyncApiKey, TemplateSyncRoutes)

// OUTBOUND cylinder->SAP pull feed — same key/consumer as the template feed.
// Cursor-based delta pulls off cng_* directly (no outbox, no new tables).
routes.use('/sync', sapSyncApiKey, CylinderSyncRoutes)

export default routes