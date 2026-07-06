import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { PartModal } from "../models/Part.modal.js";
import { CheckListModal } from "../models/checkList.modal.js";
import { CheckListHistoryModal } from "../models/checkListHistory.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";
import { ItemCheckTimeModel } from "../models/itemCheckTime.model.js";

const baseAssemblyIncludes = [
    { model: CompanyModel, as: "company", attributes: ["_id", "company_name", "company_address", "description"] },
    { model: PlantModel, as: "plant", attributes: ["_id", "plant_name", "plant_address", "plant_code","description"] },
    { model: UserModel, as: "responsibleUser", attributes: ["_id", "full_name", "email", "user_id", "desigination"] },
    { model: ProcessModel, as: "processes", attributes: ["_id", "process_name", "process_no"], through: { attributes: [] } },
    // { model: PartModal, as: "part", attributes: ["_id", "part_number", "part_name"] },
];

export const createAssemblyService = async (data) => {
    const { process_id: processIds, ...assemblyData } = data || {};
    const result = await AssemblyModal.create(assemblyData);
    if (Array.isArray(processIds)) {
        const ids = processIds.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
        await result.setProcesses(ids);;
    }
    return await AssemblyModal.findByPk(result._id, { include: baseAssemblyIncludes });


};

export const updateAssemblyService = async (id, data) => {
    const assembly = await AssemblyModal.findByPk(id);
    if (!assembly) return null;
    const { process_id: processIds, ...assemblyData } = data || {};
    await assembly.update(assemblyData);
    if (Array.isArray(processIds)) {
        const ids = processIds.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
        await assembly.setProcesses(ids);
    }
    return await AssemblyModal.findByPk(assembly._id, { include: baseAssemblyIncludes });
};

export const deleteAssemblyService = async (id) => {
    const assembly = await AssemblyModal.findByPk(id);
    if (!assembly) return null;
    await assembly.setProcesses([]);
    await assembly.destroy();
    return assembly;
};

export const getAllAssemblyService = async (IsAdmin, userId, skip, limit) => {
    const result = await AssemblyModal.findAll({
        where: IsAdmin ? {} : { responsibility: userId },
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
        include: baseAssemblyIncludes,
    });
    
    const resultWithParts = Promise.all(result.map(async (item) => {
        const ides = JSON.parse(item.part_id) || [];
        const parts = await PartModal.findAll({
            where: {
                _id: { [Op.in]: ides }
            }
        })
        return { ...item.toJSON(), part_details: parts };
    }));

    return resultWithParts;

};

export const searchAllAssemblyService = async (
    IsAdmin,
    userId,
    search = "",
    part_id,
    process_id,
    responsibility,
    plant_id,
    company_id,
    skip = 0,
    limit = 10
) => {
    const where = {
        [Op.or]: [
            { assembly_name: { [Op.like]: `%${search || ""}%` } },
            { assembly_number: { [Op.like]: `%${search || ""}%` } },
        ],
        ...(company_id ? { company_id } : {}),
        ...(plant_id ? { plant_id } : {}),
        ...(responsibility ? { responsibility } : {}),
        ...(part_id ? { part_id } : {}),
        ...(IsAdmin ? {} : { responsibility: userId }),
    };

    if (process_id) {
        const rows = await sequelize.query(
            "SELECT assembly_id FROM assembly_processes WHERE process_id = :process_id",
            { replacements: { process_id }, type: QueryTypes.SELECT }
        );
        const ids = rows.map((r) => r.assembly_id);
        if (ids.length === 0) return [];
        where._id = { [Op.in]: ids };
    }

    const result = await AssemblyModal.findAll({
        where,
        order: [["createdAt", "ASC"]],
        offset: Number(skip),
        limit: Number(limit),
        include: baseAssemblyIncludes,
    });

    return result;
};

export const findAssemblyByName = async (name) => {
    const result = await AssemblyModal.findOne({
        where: { assembly_name: name },
    });
    return result;
};

export const getAllAssemblyDataService = async () => {
    const result = await AssemblyModal.findAll({
        attributes: ["_id", "assembly_number", "assembly_name"],
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const getAssemblyLineByResponsibility = async (responsibility) => {

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: { responsibility },
        attributes: ["_id", "assembly_name", "assembly_number"],
        include: [
            {
                model: ProcessModel,
                as: "processes",
                attributes: ["_id", "process_name", "process_no"],
                through: { attributes: [] },
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    const result = [];

    for (const assembly of assemblies) {
        let isAssemblyChecked = true;

        for (const process of assembly.processes) {
            // total checklist items for process
            const totalChecklist = await CheckListModal.count({
                where: { process: process._id },
            });

            // today's checklist history count
            const checkedToday = await CheckListHistoryModal.count({
                where: {
                    assembly: assembly._id,
                    process_id: process._id,
                    createdAt: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                    status: "Checked",
                },
            });

            if (totalChecklist !== checkedToday) {
                isAssemblyChecked = false;
                break;
            }
        }

        result.push({
            ...assembly.toJSON(),
            checked: isAssemblyChecked,
        });
    }

    return result;

};

export const getAssemblyLineFormByResponsibility = async (user, id) => {
    const assembly = await AssemblyModal.findOne({
        where: { _id: id, responsibility: user },
        include: baseAssemblyIncludes
    });
   

    if (!assembly) return [];

    const assemblyJson = assembly.toJSON();

    const partIds = JSON.parse(assemblyJson.part_id) 

  
    assemblyJson.part_details = await PartModal.findAll({
        where: {
            _id: { [Op.in]: partIds }
        }
    });

    const processIds = Array.isArray(assemblyJson.processes) ? assemblyJson.processes.map((p) => p._id) : [];
    const checklists = processIds.length
        ? await CheckListModal.findAll({
            where: { process: { [Op.in]: processIds } },
            order: [["createdAt", "ASC"]],
        })
        : [];

    const checklistByProcess = new Map();
    for (const cl of checklists) {
        const json = cl.toJSON();
        const pid = json.process;
        const list = checklistByProcess.get(pid) || [];
        list.push(json);
        checklistByProcess.set(pid, list);
    };

    assemblyJson.processes = (assemblyJson.processes || []).map((p) => {
        const proc = { ...p };
        proc.checklist_item = checklistByProcess.get(proc._id) || [];
        return proc;
    });

    return [assemblyJson];
};

export const GetAssemblyLineDataReport = async (
    admin,
    user_id,
    startDate,
    endDate,
    company,
    plant
) => {
    const now = new Date();

    // 🔹 UTC safe range
    const startOfDay = startDate ? new Date(startDate) : new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = endDate ? new Date(endDate) : new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const getDateKey = (date) =>
        new Date(date).toISOString().split("T")[0];

    const normalizeToUTCDate = (date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    };

    // 🔹 Build date range
    const allDates = [];
    for (
        let d = new Date(startOfDay);
        d <= endOfDay;
        d.setUTCDate(d.getUTCDate() + 1)
    ) {
        allDates.push(new Date(d));
    }

    // 1️⃣ Assemblies
    const assemblies = await AssemblyModal.findAll({
        where: {
            ...(admin ? {} : { responsibility: user_id }),
            ...(company ? { company_id: company } : {}),
            ...(plant ? { plant_id: plant } : {}),
            createdAt: { [Op.lte]: endOfDay },
        },
        attributes: ["_id", "createdAt"],
        include: [
            {
                model: ProcessModel,
                as: "processes",
                attributes: ["_id"],
                through: { attributes: [] },
            },
        ],
    });



    const total_assemblies = assemblies.length; // ✅ FIX ADDED

    if (!assemblies.length) {
        return {
            total_assemblies,
            total_count: 0,
            total_checked: 0,
            total_unchecked: 0,
            total_errors: 0,
            total_resolved: 0,
        };
    }

    const assemblyIds = assemblies.map((a) => a._id);


    // 2️⃣ History (ITEM LEVEL)
    const histories = await CheckListHistoryModal.findAll({
        where: {
            assembly: { [Op.in]: assemblyIds },
            createdAt: { [Op.between]: [startOfDay, endOfDay] },
        },
        attributes: [
            "assembly",
            "process_id",
            "checkList",
            "createdAt",
            "is_error",
            "is_resolved",
        ],
    });



    // 3️⃣ History Map
    const historyMap = new Map();
    for (const h of histories) {
        const key = `${h.assembly}:${h.process_id}:${h.checkList}:${getDateKey(h.createdAt)}`;
        historyMap.set(key, h);
    }

    // 🔢 Counters
    let total_count = 0;
    let total_checked = 0;
    let total_unchecked = 0;
    let total_errors = 0;
    let total_resolved = 0;

    // 4️⃣ MAIN LOGIC
    for (const assembly of assemblies) {
        const assemblyCreated = normalizeToUTCDate(assembly.createdAt);
        if (!Array.isArray(assembly.processes)) continue;


        for (const day of allDates) {
            if (day < assemblyCreated) continue;


            total_count++;
            const dateKey = getDateKey(day);

            let checkedItems = 0;
            let hasError = false;
            let hasResolved = false;

            for (const process of assembly.processes) {
                const processItems = histories.filter(
                    (h) =>
                        String(h.assembly) === String(assembly._id) &&
                        String(h.process_id) === String(process._id) &&
                        getDateKey(h.createdAt) === dateKey
                );

                for (const item of processItems) {
                    checkedItems++;
                    if (item.is_error) hasError = true;
                    if (item.is_resolved) hasResolved = true;
                }
            }

            // Checked / Unchecked
            if (checkedItems > 0) {
                total_checked++;
            } else {
                total_unchecked++;
            }

            // 🔥 FINAL RULE
            if (hasError) {
                total_errors++;
            } else if (checkedItems > 0 && hasResolved) {
                total_resolved++;
            }
        }
    }

    // 5️⃣ Final response
    return {
        total_assemblies,
        total_count,
        total_checked,
        total_unchecked,
        total_errors,
        total_resolved,
    };
};

export const getAssemblyLineTodayReport = async (
    admin,
    user_id,
    skip,
    limit,
    startdate,
    endDate
) => {
    const today = new Date();
    const startOfDay = startdate ? new Date(startdate) : new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = endDate ? new Date(endDate) : new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user_id },
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
        include: baseAssemblyIncludes
    });


    const assemblyJsonList = assemblies.map((a) => a.toJSON());
    const assemblyIds = assemblyJsonList.map((a) => a._id);

    const processIds = [
        ...new Set(
            assemblyJsonList.flatMap((a) => (Array.isArray(a.processes) ? a.processes.map((p) => p._id) : []))
        ),
    ];

    const checklists = processIds.length
        ? await CheckListModal.findAll({
            where: { process: { [Op.in]: processIds } },
            order: [["createdAt", "ASC"]],
        })
        : [];

    const histories = assemblyIds.length
        ? await CheckListHistoryModal.findAll({
            where: {
                assembly: { [Op.in]: assemblyIds },
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            attributes: ["_id", "checkList", "assembly", "process_id", "result", "is_error", "status", "createdAt"],
        })
        : [];

    // console.log(histories);

    const checklistByProcess = new Map();
    for (const cl of checklists) {
        const json = cl.toJSON();
        const pid = json.process;
        const list = checklistByProcess.get(pid) || [];
        list.push(json);
        checklistByProcess.set(pid, list);
    };


    const historyByAssemblyProcessCheckList = new Map();
    for (const h of histories) {
        const json = h.toJSON();
        const key = `${json.assembly}:${json.process_id}:${json.checkList}`;
        const list = historyByAssemblyProcessCheckList.get(key) || [];
        list.push(json);
        historyByAssemblyProcessCheckList.set(key, list);
    }

    // console.log(historyByAssemblyProcessCheckList);

    return assemblyJsonList.map((assembly) => {

        const processes = Array.isArray(assembly.processes) ? assembly.processes : [];
        assembly.processes = processes.map((proc) => {
            const procChecklists = checklistByProcess.get(proc._id) || [];
            return {
                ...proc,
                check_list_items: procChecklists.map((cli) => ({
                    ...cli,
                    check_items_history:
                        historyByAssemblyProcessCheckList.get(`${assembly._id}:${proc._id}:${cli._id}`) || [],
                })),
            };
        });
        return assembly;
    });

};

export const getAllITemsToCheckTimeBases = async (id,user) => {
   const assembly = await AssemblyModal.findOne({
        where: { _id: id, responsibility: user },
        include: baseAssemblyIncludes
    });
   

    if (!assembly) return [];

    const assemblyJson = assembly.toJSON();

    const partIds = JSON.parse(assemblyJson.part_id) 

  
    assemblyJson.part_details = await PartModal.findAll({
        where: {
            _id: { [Op.in]: partIds }
        }
    });

    const processIds = Array.isArray(assemblyJson.processes) ? assemblyJson.processes.map((p) => p._id) : [];
    const checklists = processIds.length
        ? await CheckListModal.findAll({
            where: { process: { [Op.in]: processIds },total_checks:{[Op.gte]:1} },
            order: [["createdAt", "ASC"]],
        })
        : [];

    const checklistByProcess = new Map();
    for (const cl of checklists) {
        const json = cl.toJSON();
        const pid = json.process;
        json.check_timing = await ItemCheckTimeModel.findAll({
            where: {item_id:cl._id},
            attributes:["_id","check_time"]
        })
        const list = checklistByProcess.get(pid) || [];
        list.push(json);
        checklistByProcess.set(pid, list);
    };

    assemblyJson.processes = (assemblyJson.processes || []).map((p) => {
        const proc = { ...p };
        proc.checklist_item = checklistByProcess.get(proc._id) || [];
        return proc;
    });

    return [assemblyJson];
};




