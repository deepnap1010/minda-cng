import { NotificationModal } from "../models/notification.modal.js"
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { CheckListModal } from "../models/checkList.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";


export const CreateNotification = async (data) => {
    const result = await NotificationModal.create(data);
    return result;
};

export const GetNotification = async (user,skip,limit) => {
    const result = await NotificationModal.findAll({
        where: { reciverId: user },
        include: [
            { model: UserModel, as: "sender", attributes: ["_id", "desigination", "user_id", "email", "full_name"], required: false },
            { model: AssemblyModal, as: "assemblyLine", attributes: ["_id", "assembly_name", "assembly_number"], required: false },
            { model: ProcessModel, as: "processInfo", attributes: ["_id", "process_name", "process_no"], required: false },
            { model: CheckListModal, as: "checklistItem", attributes: ["_id", "item", "description", "check_list_method", "check_list_time"], required: false },
        ],
        order: [["createdAt", "DESC"]],
        offset: skip,
        limit,
    });
    return result;
};

export const UpdateNotification = async(id,data) => {
    const notification = await NotificationModal.findByPk(id);
    if (!notification) return null;
    const result = await notification.update(data);
    return result;
};

export const GetUpdateAll = async (id,data) => {
    const [count] = await NotificationModal.update(data, { where: { reciverId: id } });
    const result = { updated: count };
    return result;
};


export const singleNotification = async (id) => {
    const result = await NotificationModal.findOne({
        where: { _id: id },
        include: [
            { model: UserModel, as: "sender", attributes: ["_id", "desigination", "user_id", "email", "full_name"], required: false },
            { model: AssemblyModal, as: "assemblyLine", attributes: ["_id", "assembly_name", "assembly_number"], required: false },
            { model: ProcessModel, as: "processInfo", attributes: ["_id", "process_name", "process_no"], required: false },
            { model: CheckListModal, as: "checklistItem", attributes: ["_id", "item", "description", "check_list_method", "check_list_time"], required: false },
        ]
    });
    return result;
};

/** Create template approval notification (for header bell). assembly/process_id/checkList = null. */
export const CreateTemplateApprovalNotification = async ({ reciverId, senderId, templateName, templateId = null, submittedByName = "" }) => {
    const title = "Template Approval Required";
    const description = submittedByName
        ? `Template "${templateName}" has been submitted for approval by ${submittedByName}.`
        : `Template "${templateName}" has been submitted for approval.`;
    return await NotificationModal.create({
        title,
        description,
        reciverId,
        senderId: senderId || null,
        status: "send",
        type: "template_approval",
        template_id: templateId,
        template_name: templateName,
        assembly: null,
        process_id: null,
        checkList: null,
    });
}; 