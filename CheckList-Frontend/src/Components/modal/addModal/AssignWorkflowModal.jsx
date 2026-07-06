import { X } from "lucide-react";
import { useState, useEffect } from "react";

const AssignWorkflowModal = ({
  openModal,
  setOpenModal,
  template,
  assignWorkflow,
  workflows,
  isLoading,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  // Set current workflow when modal opens or template changes
  useEffect(() => {
    if (openModal && template?.workflow?._id) {
      setSelectedWorkflowId(template.workflow._id);
    } else {
      setSelectedWorkflowId("");
    }
  }, [openModal, template]);

  const handleSubmit = () => {
    if (!template?._id) {
      alert("Template not selected");
      return;
    }

    assignWorkflow.mutate(
      {
        templateId: template._id,
        workflowId: selectedWorkflowId || null,
      },
      {
        onSuccess: () => {
          setSelectedWorkflowId("");
          setOpenModal(false);
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedWorkflowId("");
    setOpenModal(false);
  };

  if (!openModal) return null;

  return (
    <div
      className={`${openModal ? "translate-x-0" : "translate-x-full"}
 fixed inset-0 bg-black/40  z-50 flex justify-center items-center`}
    >
      <div className="bg-white w-full max-w-md shadow-lg rounded-xl p-6 animate-slideLeft">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Assign Workflow to Template</h2>
          <button
            className="cursor-pointer"
            onClick={handleClose}
          >
            <X size={22} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        {template && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Template:</span> {template.template_name}
            </p>
            {template.workflow && (
              <p className="text-sm text-purple-600 mt-1">
                <span className="font-medium">Currently Assigned:</span> {template.workflow.name}
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-gray-700 font-medium mb-2 block">
            Select Workflow {template?.workflow && <span className="text-xs text-gray-500 font-normal">(Selecting a new workflow will replace the current one)</span>}
          </label>
          
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading workflows...</p>
          ) : workflows.length === 0 ? (
            <p className="text-sm text-gray-500">No workflows available</p>
          ) : (
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Select Workflow --</option>
              {workflows.map((workflow) => (
                <option key={workflow._id} value={workflow._id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {template?.workflow && (
            <button
              type="button"
              onClick={() => {
                assignWorkflow.mutate(
                  {
                    templateId: template._id,
                    workflowId: null,
                  },
                  {
                    onSuccess: () => {
                      setSelectedWorkflowId("");
                      setOpenModal(false);
                    },
                  }
                );
              }}
              disabled={assignWorkflow.isPending}
              className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignWorkflow.isPending ? "Removing..." : "Remove Workflow"}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={assignWorkflow.isPending || !selectedWorkflowId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignWorkflow.isPending ? "Assigning..." : template?.workflow ? "Update Workflow" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkflowModal;
