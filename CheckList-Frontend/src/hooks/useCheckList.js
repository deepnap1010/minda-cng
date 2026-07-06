import { AsyncHandler } from "../../../CheckList-backend/src/utils/asyncHandler";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCheckList=(search)=>{

    const qc = useQueryClient();

    const AllChecklist = useQuery({
            queryKey: ["checklist-all"],
            queryFn: async () => {
                const res = await axiosHandler.get(`/checklist/`);
                return res?.data?.data;
            }
        });

    const create = useMutation({
        mutationFn: async (data) => {
          try {
            const res = await axiosHandler.post("/checklist/create-checklist", data);
            toast.success(res?.data?.message);
          } catch (error) {
            toast.error(error?.response?.data?.message);
            console.log(error);
          }
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["checklist"] });
        },
      });

    const update = useMutation({
        mutationFn: async ({ id, data }) => {
          try {
            const res = await axiosHandler.put(
              `/checklist/update-checklist/${id}`,
              data
            );
            toast.success(res?.data?.message);
          } catch (error) {
            console.log(error);
          }
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["checklist"] });
        },
      });


      const remove = useMutation({
          mutationFn: (id) => axiosHandler.delete(`/checklist/delete-checklist/${id}`),
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["checklist"] });
          },
        });

      const searchQuery = useQuery({
            queryKey: ["search-checklist", search],
            queryFn: async () => {
              const res = await axiosHandler.get(
                `/checklist/search-checklist?search=${search}`
              );
              return res.data.data;
            },
            enabled: !!search,
            placeholderData: keepPreviousData,
        });
    
        return { AllChecklist , create , update , remove , searchQuery };

}