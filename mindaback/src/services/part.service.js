import { PartModal } from "../models/Part.modal.js"
// import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { Op, Sequelize } from "sequelize";


export const createPartsService = async (data) => {
    const result = await PartModal.create(data);
    return result;
};

export const UpdatePartService = async (id, data) => {
    const part = await PartModal.findByPk(id);
    if (!part) return null;
    const result = await part.update(data);
    return result;
};

export const DeletePartService = async (id) => {
    const part = await PartModal.findByPk(id);
    if (!part) return null;
    await part.destroy();
    const result = part;
    return result;
};

export const GetAllPartsService = async () => {
    const result = await PartModal.findAll({
        attributes: ["_id", "part_number", "part_name"],
        order: [
            ["createdAt", "ASC"]
        ],
    });
    return result;
};

export const FindPartServiceByName = async (data) => {
    const result = await PartModal.findOne({ where: data });
    return result;
}

export const getPartsServiceData = async (search = "", skip = 0, limit = 10) => {
    const q = search.trim();

    const parts = await PartModal.findAll({
        where: {
            [Op.or]: [
                { part_name: { [Op.like]: `%${q}%` } },
                { part_number: { [Op.like]: `%${q}%` } },
            ],
        },
        attributes: [
            "_id",
            "part_name",
            "part_number",
            "description",
            "material_code",
            "modal_name",

            // 🔧 count
            [
                Sequelize.literal(`(
          SELECT COUNT(*)
          FROM assemblies A
          WHERE EXISTS (
            SELECT 1
            FROM OPENJSON(A.part_id)
            WHERE value = Part._id
          )
        )`),
                "integration_count",
            ],

            // 🧰 ARRAY of assemblies (name + number)
            [
                Sequelize.literal(`JSON_QUERY((
          SELECT 
            A.assembly_name,
            A.assembly_number
          FROM assemblies A
          WHERE EXISTS (
            SELECT 1
            FROM OPENJSON(A.part_id)
            WHERE value = Part._id
          )
          FOR JSON PATH
        ))`),
                "assemblies_used",
            ],
        ],
        order: [
            [Sequelize.col("createdAt"), "ASC"],
            [Sequelize.col("_id"), "ASC"],
        ],
        offset: skip,
        limit,
    });

    return parts.map(p => {
        const row = p.get({ plain: true });

        return {
            ...row,
            assemblies_used: row.assemblies_used
                ? JSON.parse(row.assemblies_used)
                : [],
        };
    });

};




