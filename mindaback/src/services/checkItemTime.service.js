import { ItemCheckTimeModel } from "../models/itemCheckTime.model.js"




export const createChecklistItemTimeService = async (data) => {
    const result = await ItemCheckTimeModel.bulkCreate(data);
    return result;
}


export const DeleteManyCheckListsItemService  = async (id) => {
   const result = await ItemCheckTimeModel.destroy({
    where: {
      item_id:id
    },
  });

  return result; 
}























