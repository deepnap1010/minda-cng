import { X, XCircle } from "lucide-react";
import { useFormik } from "formik";
import { useWorkflow } from "../../../hooks/useWorkflow";
import { workflowValidationSchema } from "../../../Validation/WorkflowValidation";
import { useReleaseGroup } from "../../../hooks/Template Hooks/useReleaseGroup";

const ManageWorkflowModal = ({
  openModal,
  setOpenModal,
  editTable,
  viewModal,
  mode,
  setMode,
}) => {
  const { create, update } = useWorkflow();
  
  // Fetch all release groups for dropdown
  const {  getAllReleaseGroup } = useReleaseGroup("", 1, 1000);
  const releaseGroupsData = getAllReleaseGroup?.data || [];
  
  // Map release groups to dropdown options
  const releaseGroupOptions = releaseGroupsData.map((group) => {
    // Handle Sequelize dataValues if present
    const groupData = group?.dataValues || group;
    return {
      label: groupData?.group_name || "",
      value: groupData?._id || "",
    };
  }).filter(option => option.label && option.value);
  
  // Add HOD as first option (permanent)
  const workflowManagementOptions = [
    { label: "HOD", value: "HOD" },
    ...releaseGroupOptions,
  ];

  // Helper function to get initial workflow array
  const getInitialWorkflow = () => {
    if (editTable?.workflow && Array.isArray(editTable.workflow) && editTable.workflow.length > 0) {
      return editTable.workflow;
    }
    if (viewModal?.workflow && Array.isArray(viewModal.workflow) && viewModal.workflow.length > 0) {
      return viewModal.workflow;
    }
    // By default add HOD at the beginning
    return [{ group: "HOD", user: "" }];
  };

  const formik = useFormik({
    initialValues: {
      name: editTable?.name || viewModal?.name || "",
      workflow: getInitialWorkflow(),
    },
    validationSchema: workflowValidationSchema,
    enableReinitialize: true,
    onSubmit: (value) => {
      // Transform data to backend format
      const payload = {
        name: value.name,
        workflow: value.workflow.map((item) => ({
          group: item.group,
          user: item.user || "", // Empty string if no user
        })),
      };

      if (editTable) {
        update.mutate(
          { id: editTable._id, data: payload },
          {
            onSuccess: () => {
              formik.resetForm();
              setOpenModal(false);
            },
            onError: (error) => {
              console.log("Update error:", error);
            },
          }
        );
      } else {
        create.mutate(payload, {
          onSuccess: () => {
            formik.resetForm();
            setOpenModal(false);
          },
          onError: (error) => {
            console.log("Create error:", error);
          },
        });
      }
    },
  });

  // Handle group selection - add to array in order
  const handleGroupSelect = (groupId) => {
    if (!groupId) return;
    
    // Check if group already exists
    const exists = formik.values.workflow.some(item => item.group === groupId);
    if (exists) return;

    // Add new group to array (maintains order)
    const newWorkflow = [
      ...formik.values.workflow,
      {
        group: groupId,
        user: "",
      },
    ];
    formik.setFieldValue("workflow", newWorkflow);
    
    // Reset select dropdown
    const selectElement = document.getElementById("workflow-group-select");
    if (selectElement) {
      selectElement.value = "";
    }
  };
  
  // Get group label helper
  const getGroupLabel = (groupId) => {
    if (groupId === "HOD") {
      return "HOD";
    }
    const groupOption = workflowManagementOptions.find(opt => opt.value === groupId);
    return groupOption?.label || groupId;
  };

  // Remove group from array (HOD cannot be removed)
  const handleRemoveGroup = (index) => {
    const groupToRemove = formik.values.workflow[index];
    // Prevent removing HOD
    if (groupToRemove?.group === "HOD") {
      return;
    }
    const newWorkflow = formik.values.workflow.filter((_, i) => i !== index);
    formik.setFieldValue("workflow", newWorkflow);
  };

  // Get selected group IDs
  const selectedGroupIds = formik.values.workflow.map(item => item.group);

  // Filter out already selected groups from dropdown (including HOD if already added)
  const availableOptions = workflowManagementOptions.filter(
    option => !selectedGroupIds.includes(option.value)
  );

  const isView = mode === "view";
  const title = {
    add: "Add New  Workflow",
    edit: "Update  Workflow",
    view: "View Workflow Details",
  };

  if (!openModal) return null;

  return (
    <div
      className={`${openModal ? "translate-x-0" : "translate-x-full"}
 fixed inset-0 bg-black/40  z-50 flex justify-end`}
    >
      <div className="bg-white h-full w-[420px] shadow-lg p-6 animate-slideLeft overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title[mode]}</h2>
          <button
            className="cursor-pointer"
            onClick={() => {
              setOpenModal(false);
              formik.resetForm();
            }}
          >
            <X size={22} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={formik.handleSubmit}>
          <div>
            <label className="text-sm text-gray-700 font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
              value={formik.values.name}
              name="name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isView}
              required
              placeholder="Enter workflow name"
            />

            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">
              Workflow Management <span className="text-red-500">*</span>
            </label>

            {/* Dropdown to add groups */}
            {!isView && (
              <select
                id="workflow-group-select"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 mb-2"
                onChange={(e) => handleGroupSelect(e.target.value)}
                disabled={
                  getAllReleaseGroup.isLoading || availableOptions.length === 0
                }
              >
                <option value="">
                  {getAllReleaseGroup.isLoading
                    ? "Loading release groups..."
                    : availableOptions.length === 0
                      ? "All groups selected"
                      : "Select a group to add"}
                </option>
                {availableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Display selected groups */}
            <div className="mt-2 space-y-2">
              {formik.values.workflow.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No groups selected. Select groups from dropdown above.
                </p>
              ) : (
                formik.values.workflow.map((item, index) => {
                  return (
                    <div
                      key={`${item.group}-${index}`}
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {getGroupLabel(item.group)}
                        </span>
                      </div>
                      {!isView && item.group !== "HOD" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {getAllReleaseGroup.isError && (
              <p className="text-red-500 text-sm mt-1">
                Error loading release groups. Please refresh the page.
              </p>
            )}

            {formik.touched.workflow && formik.errors.workflow && (
              <p className="text-red-500 text-sm mt-1">
                {typeof formik.errors.workflow === "string"
                  ? formik.errors.workflow
                  : "At least one workflow group is required"}
              </p>
            )}
          </div>

          {!isView && (
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-4"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending
                ? "Saving..."
                : editTable
                  ? "Update Workflow"
                  : "Add Workflow"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ManageWorkflowModal;
