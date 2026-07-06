import { StatusCodes } from "http-status-codes";
import { createChecklistHistory, findTodayChecklistHistory,  GetAllErrorsHistory,  UpdateCheckListHistory } from "../services/checklistHistory.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { CreateNotification, singleNotification } from "../services/notification.service.js";
import { GetAdmin } from "../services/users.service.js";
import { sendNotification } from "../socket/notification.socket.js";


export const createCheckListHistory = AsyncHandler(async (req, res) => {
  const { data } = req.body;
  const user_id = req.currentUser._id

  // 1️⃣ Validate request
  if (!Array.isArray(data) || data.length === 0) {
    throw new NotFoundError("Data array is required","createCheckListHistory() method error");
  }

  // 2️⃣ Find today's existing records
  const existingRecords = await findTodayChecklistHistory(data);

  // 3️⃣ Create lookup set
  const existingSet = new Set(
    existingRecords.map(
      item => `${item.checkList}_${item.process_id}_${item.assembly}`
    )
  );

  // 4️⃣ Filter new records only
  const filteredData = data.filter(item => {
    const key = `${item.checkList}_${item.process_id}_${item.assembly}`;
    return !existingSet.has(key);
  });

  // 5️⃣ If all already exist → error
  if (filteredData.length === 0) {
    throw new BadRequestError("All checklist history records already exist for today","createCheckListHistory() method error")
  }

  // 6️⃣ Insert only new records
  const result = await createChecklistHistory(filteredData.map((item)=>({...item,user_id})));



  // 7️⃣ Response
  res.status(StatusCodes.CREATED).json({
    message: "Checklist history saved successfully",
    insertedCount: result.length,
    skippedCount: data.length - result.length,
    data: result,
  });


  const lastData = result.filter((item) => item?.is_error);


  // console.log(lastData);

  const admin = await GetAdmin();


 await Promise.all(lastData.map(async(item)=>{
    const notification = await CreateNotification({title:"assembly have an error ",description:item.description,senderId:req.currentUser?._id,status:"send",reciverId:admin._id,assembly:item.assembly,process_id:item.process_id,checkList:item.checkList});
    const notificationData = await singleNotification(notification._id);
    sendNotification(notificationData);

  }));

});

export const createCheckListHistoryTiming = AsyncHandler(async (req, res) => {
  const { data } = req.body;
  const user_id = req.currentUser._id

  // 1️⃣ Validate request
  if (!Array.isArray(data) || data.length === 0) {
    throw new NotFoundError("Data array is required","createCheckListHistory() method error");
  }


  // 6️⃣ Insert only new records
  const result = await createChecklistHistory(data.map((item)=>({...item,user_id})));



  // 7️⃣ Response
  res.status(StatusCodes.CREATED).json({
    message: "Checklist history saved successfully",
    insertedCount: result.length,
    skippedCount: data.length - result.length,
    data: result,
  });


  const lastData = result.filter((item) => item?.is_error);


  // console.log(lastData);

  const admin = await GetAdmin();


 await Promise.all(lastData.map(async(item)=>{
    const notification = await CreateNotification({title:"assembly have an error ",description:item.description,senderId:req.currentUser?._id,status:"send",reciverId:admin._id,assembly:item.assembly,process_id:item.process_id,checkList:item.checkList});
    const notificationData = await singleNotification(notification._id);
    sendNotification(notificationData);

  }));

});
export const updateCheckListHistory = AsyncHandler(async (req,res) => {
    const {id} = req.params;
    const data = req.body;
    const result = await UpdateCheckListHistory(id,data);
    if(!result){
        throw new NotFoundError("Data not found please try again","updateCheckListHistory() method error");
    };
    res.status(StatusCodes.OK).json({
        message:"Data updated successfully",
        data:result
    });
});

export const getAllErrorData = AsyncHandler(async (req,res) => {
  const user = req.currentUser;
  const {startDate,endDate} = req.query;
  const result = await GetAllErrorsHistory(startDate,endDate,user.is_admin,user._id);
  res.status(StatusCodes.OK).json({
    data:result
  })
});







