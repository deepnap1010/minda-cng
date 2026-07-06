import { SapSyncOutboxModel } from "../models/sapSyncOutbox.model.js";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { TemplateSubmissionModel } from "../models/templateSubmission.model.js";
import { logger } from "../utils/logger.js";

/**
 * Captures every template/field/submission write into the sap_sync_outbox feed
 * so Minda can pull it and load it into SAP HANA.
 *
 * Design notes:
 * - Enqueue is best-effort: wrapped in try/catch and NEVER rethrows, so a sync
 *   hiccup can never break the user's actual save.
 * - Definition snapshots are full (template row + its fields) so Minda gets a
 *   self-contained record. Any field add/edit/delete re-snapshots the parent.
 */

const enqueue = async (entity_type, entity_id, payload) => {
  try {
    await SapSyncOutboxModel.create({ entity_type, entity_id, payload });
  } catch (e) {
    logger.error(`templateSync enqueue failed (${entity_type} ${entity_id}): ${e.message}`);
  }
};

const enqueueTemplateDefinition = async (templateId) => {
  if (!templateId) return;
  try {
    const template = await TemplateMasterModel.findByPk(templateId, {
      include: [{ model: TemplateFieldModel, as: "fields" }],
    });
    if (!template) return;
    const plain = template.toJSON();
    await enqueue("TEMPLATE_DEFINITION", templateId, {
      template: { ...plain, fields: undefined },
      fields: plain.fields ?? [],
    });
  } catch (e) {
    logger.error(`templateSync definition snapshot failed (${templateId}): ${e.message}`);
  }
};

const enqueueSubmission = async (submissionId) => {
  if (!submissionId) return;
  try {
    const sub = await TemplateSubmissionModel.findByPk(submissionId);
    if (!sub) return;
    await enqueue("TEMPLATE_SUBMISSION", submissionId, sub.toJSON());
  } catch (e) {
    logger.error(`templateSync submission snapshot failed (${submissionId}): ${e.message}`);
  }
};

let registered = false;

export const registerTemplateSyncHooks = () => {
  if (registered) return;

  // Template definition: created / updated (name, workflow assign, user assign…)
  TemplateMasterModel.addHook("afterCreate", (inst) =>
    enqueueTemplateDefinition(inst._id)
  );
  TemplateMasterModel.addHook("afterUpdate", (inst) =>
    enqueueTemplateDefinition(inst._id)
  );

  // Any field change re-snapshots its parent template.
  TemplateFieldModel.addHook("afterCreate", (inst) =>
    enqueueTemplateDefinition(inst.template_id)
  );
  TemplateFieldModel.addHook("afterUpdate", (inst) =>
    enqueueTemplateDefinition(inst.template_id)
  );
  TemplateFieldModel.addHook("afterDestroy", (inst) =>
    enqueueTemplateDefinition(inst.template_id)
  );

  // Submissions: created and updated (draft -> submitted, edits, approvals).
  TemplateSubmissionModel.addHook("afterCreate", (inst) =>
    enqueueSubmission(inst._id)
  );
  TemplateSubmissionModel.addHook("afterUpdate", (inst) =>
    enqueueSubmission(inst._id)
  );

  registered = true;
  logger.info("templateSync hooks registered (definitions + submissions -> sync feed).");
};
