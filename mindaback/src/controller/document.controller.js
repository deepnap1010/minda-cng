import { StatusCodes } from "http-status-codes";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// --------------- local imports -----------------------------
import { createDocumentService, deleteDocumentService, findDocumentById, getDocumentService, updateDocumentService } from "../services/document.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { config } from "../config.js";
import { NotFoundError } from "../utils/errorHandler.js";





const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export const createDocument = AsyncHandler(async (req, res) => {
    const data = req.body;
    const file = req.file;

    if (!file) {
        throw new NotFoundError("file is required", "CreateChecklistData() method error");
    }

    const attached_doc = file ? `${config.NODE_ENV !== "development" ? config.SERVER_URL : config.LOCAL_SERVER_URL}/files/${file.filename}` : null;

    const result = await createDocumentService({ ...data, attached_doc });
    res.status(StatusCodes.CREATED).json({
        message: "document created successfully",
        success: true,
        data: result
    })
});


export const getDocument = AsyncHandler(async (req, res) => {
    let { page, limit, search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await getDocumentService(search, skip, limit);
    res.status(StatusCodes.OK).json(result)
});


export const deleteDocument = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const exist = await findDocumentById(id);

    if (!exist) {
        throw new NotFoundError("Document not found", "deleteDocument() method error")
    };
    await deleteDocumentService(id);
    res.status(StatusCodes.OK).json({
        message: "document Deleted Successfully",
        data: exist
    });

    fs.unlinkSync(
        path.join(
            __dirname,
            `../../public/temp/${exist.attached_doc.split("/files/")[1]}`
        )
    );
});


export const updateDocument = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;

    const exist = await findDocumentById(id);
    if (!exist) {
        throw new NotFoundError("Document Not Found", "updateDocument() method error:")
    }
    let attached_doc;
    if (file && exist?.attached_doc) {
        fs.unlinkSync(
            path.join(
                __dirname,
                `../../public/temp/${exist.attached_doc.split("/files/")[1]}`
            )
        );

        attached_doc = file ? `${config.NODE_ENV !== "development" ? config.SERVER_URL : config.LOCAL_SERVER_URL}/files/${file.filename}` : null;
    }

    const result = await updateDocumentService(id, { ...data, attached_doc });

    res.status(StatusCodes.OK).json({
        message: "Document updated successfully",
        data: result,
        success: true
    })
})



















