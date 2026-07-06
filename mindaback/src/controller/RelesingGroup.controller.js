import { StatusCodes } from "http-status-codes";
import { createReleseGroup, DeleteRelesGroup, getAllReleaseGroups, getReleaseGroupByNames, getRelesGroup, updateRelesGroup } from "../services/releaseGroup.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { CreateGroupUsersService, DeleteManyGroupUsersService, GetGroupUsersService } from "../services/groupUser.service.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { getPlantById } from "../services/plant.service.js";
import {  GetUsersByIdService } from "../services/users.service.js";


export const createRelasingGroup = AsyncHandler(async (req, res) => {
    const data = req.body;

    const exist = await getReleaseGroupByNames(data.group_department, data.group_name);
    if (exist) {
        throw new BadRequestError("Group already exist", "createRelasingGroup() method error")
    }
    const group = await createReleseGroup(data);

    res.status(StatusCodes.CREATED).json({
        message: "Group created successfully",
    });

    if (data?.users && data?.users.length > 0) {
        const newData = data?.users.map((item) => ({ ...item, plants_id: JSON.stringify(item.plants_id), relese_group_id: group._id }));
        await CreateGroupUsersService(newData)
    };
});

export const getReleasingGroup = AsyncHandler(async (req, res) => {
    const {search} = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await getRelesGroup(search,skip, limit);

    // Collect all unique plant IDs first to avoid duplicate queries
    const allPlantIds = new Set();
    const userData = new Set();
    const usersByGroup = await Promise.all(
        result.map(async (item) => {
            const users = await GetGroupUsersService(item._id);

            // Collect plant IDs
            users.forEach(user => {
                const plantIds = JSON.parse(user.plants_id);
                plantIds.forEach(id => allPlantIds.add(id));
                userData.add(user.user_id);
            });

            return { group: item, users };
        })
    );


    // Fetch all plants in one batch (if getPlantById supports batch fetching)
    // Otherwise, fetch them all in parallel
    const plantDataMap = new Map();
    await Promise.all(
        Array.from(allPlantIds).map(async (plantId) => {
            const plant = await getPlantById(plantId);
            plantDataMap.set(plantId, plant);
        })
    );

    const userDetail = new Map();
    await Promise.all(
        Array.from(userData).map(async (userid) => {
            const user = await GetUsersByIdService(userid);
            userDetail.set(userid, user);
        })
    );


    // Build final response using cached plant data
    const data = usersByGroup.map(({ group, users }) => {
        if (users?.length > 0) {
            const usersWithPlants = users.map(user => {
                const plantIds = JSON.parse(user.plants_id);
                const plants = plantIds.map(id => plantDataMap.get(id));
                const users_detail = userDetail.get(user.user_id);
                return { ...user.dataValues, plants,users_detail };
            });

            return { ...group.dataValues, users: usersWithPlants };
        }
        return group.dataValues;
    });

    res.status(StatusCodes.OK).json({ data });
});

export const DeleteReleasingGroup = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DeleteRelesGroup(id);
    if (!result) {
        throw new NotFoundError("Release group not found", "DeleteReleasingGroup() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "Releasing group deleted"
    });

    await DeleteManyGroupUsersService(result._id)
});

export const UpdateReleasingGroup = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

     await updateRelesGroup(id, data);

    if (data?.users && data?.users.length > 0) {
        await DeleteManyGroupUsersService(id);
        const newData = data?.users.map((item) => ({ ...item, plants_id: JSON.stringify(item.plants_id), relese_group_id: id }));
        await CreateGroupUsersService(newData)
    };

    res.status(StatusCodes.OK).json({
        message:"Release Updated Successfully"
    });
});


export const GetAllReleaseGroups = AsyncHandler(async (req, res) => {
    const result = await getAllReleaseGroups();
    res.status(StatusCodes.OK).json({
        data: result
    });
});




