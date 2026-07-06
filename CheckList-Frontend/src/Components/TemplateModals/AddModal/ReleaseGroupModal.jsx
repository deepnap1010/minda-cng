import React from "react";
import { UserCheck, Wand, X } from "lucide-react";
import { useFormik } from "formik";
import { RegisterEmployee } from "../../../hooks/useRegisterEmployee";
import { UsePlantName } from "../../../hooks/UsePlantName";
import { useReleaseGroup } from "../../../hooks/Template Hooks/useReleaseGroup";
import { useDepartment } from "../../../hooks/useDepartment";

const AddReleaseGroupModal = ({
  openModal,
  setOpenModal,
  editData = null,
  mode = "add",
}) => {
  const { getAllEmployee, getAllHODWithUser } = RegisterEmployee();
  const { getAllPlantName } = UsePlantName();
  const { postReleaseGroup, updateReleaseGroup } = useReleaseGroup();
  const [plantOpen, setPlantOpen] = React.useState(false);
  const plantRef = React.useRef(null);

  const USER_OPTIONS = getAllHODWithUser?.data || [];
  const PLANT_OPTIONS = getAllPlantName?.data || [];
  const isView = mode === "view";

  const titleMap = {
    add: "Add Release Group",
    edit: "Update Release Group", 
    view: "View Release Group",
  };

  const userMap = React.useMemo(() => {
    const map = {};
    USER_OPTIONS.forEach((u) => {
      map[u._id] = u.full_name;
    });
    return map;
  }, [USER_OPTIONS]);

  const plantMap = React.useMemo(() => {
    const map = {};
    PLANT_OPTIONS.forEach((p) => {
      map[p._id] = {
        name: p.plant_name,
        code: p.plant_code,
      };
    });
    return map;
  }, [PLANT_OPTIONS]);

  const normalizeUsers = (users = []) => {
    return users.map((u) => ({
      user_id: u.user_id,
      plants_id: Array.isArray(u.plants_id)
        ? u.plants_id
        : u.plants?.map((p) => p._id) || [],
    }));
  };

  const formik = useFormik({
    initialValues: {
      group_name: editData?.group_name ?? "",
      group_department: editData?.group_department ?? "",
      users: normalizeUsers(editData?.users),
      selectedUser: "",
      selectedPlants: [],
    },

    enableReinitialize: true,
    onSubmit: (values) => {
      const payload = {
        group_name: values.group_name,
        group_department: values.group_department,
        users: values.users,
      };
      if (editData) {
        if (editData) {
          updateReleaseGroup.mutate(
            { id: editData._id, data: payload },
            {
              onSuccess: () => {
                setOpenModal(false);
                formik.resetForm();
              },
            },
          );
        }
      } else {
        postReleaseGroup.mutate(payload, {
          onSuccess: () => {
            setOpenModal(false);
            formik.resetForm();
          },
        });
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue } = formik;

  const handleAddUserPlant = () => {
    const { selectedUser, selectedPlants, users } = values;

    if (!selectedUser || selectedPlants.length === 0) return;

    const userIndex = users.findIndex((u) => u.user_id === selectedUser);

    if (userIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[userIndex].plants_id = Array.from(
        new Set([...updatedUsers[userIndex].plants_id, ...selectedPlants]),
      );
      setFieldValue("users", updatedUsers);
    } else {
      setFieldValue("users", [
        ...users,
        {
          user_id: selectedUser,
          plants_id: selectedPlants,
        },
      ]);
    }

    setFieldValue("selectedUser", "");
    setFieldValue("selectedPlants", []);
    setPlantOpen(false);

  };

  const handleRemove = (index) => {
   
    setFieldValue(
      "users",
      values.users.filter((_, i) => i !== index),
    ); 
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        plantRef.current &&
        !plantRef.current.contains(event.target)
      ) {
        setPlantOpen(false);
      }
    };

    if (plantOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [plantOpen]);



  const filteredPlantOptions = React.useMemo(() => {
    if (mode === "edit" && editData?.users?.length === 1) {
      const currentUser = values.users.find(
        (u) => u.user_id === values.selectedUser,
      );

      const otherUsedPlants = values.users
        .filter((u) => u.user_id !== values.selectedUser)
        .flatMap((u) => u.plants_id || []);

      return PLANT_OPTIONS.filter(
        (p) =>
          !otherUsedPlants.includes(p._id) ||
          currentUser?.plants_id.includes(p._id),
      );
    }

    const usedPlants = values.users.flatMap((u) => u.plants_id || []);
    return PLANT_OPTIONS.filter((p) => !usedPlants.includes(p._id));
  }, [PLANT_OPTIONS, values.users, values.selectedUser, mode]);


  React.useEffect(() => {
    if (mode === "edit" && editData?.users?.length === 1) {
      setFieldValue("selectedUser", editData.users[0].user_id);
    }
  }, [mode, editData]);


  if (!openModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="absolute inset-0" onClick={() => setOpenModal(false)} />

      <div className="relative h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto">
        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-black"
          onClick={() => setOpenModal(false)}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6">{titleMap[mode]}</h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Group Name"
            name="group_name"
            value={values.group_name}
            onChange={handleChange}
            readOnly={isView}
          />

          <Input
            label="Group Department"
            name="group_department"
            value={values.group_department}
            onChange={handleChange}
            readOnly={isView}
          />

          <Select
            label="User"
            name="selectedUser"
            value={values.selectedUser}
            onChange={handleChange}
            options={USER_OPTIONS}
            disabled={isView}
            getLabel={(opt) => `${opt.full_name} (${opt.user_id})`}
          />

          <div className="relative mb-4 w-full" ref={plantRef}>
            <label className="font-medium text-gray-700">Plant</label>

            <div
              onClick={() => !isView && setPlantOpen(!plantOpen)}
              className={`mt-2 min-h-[52px] border rounded-lg px-3 py-2 cursor-pointer flex items-center justify-between
      ${plantOpen ? "ring-2 ring-blue-200 border-blue-500" : "border-gray-300"}
      ${isView && "bg-gray-100 cursor-not-allowed"}
    `}
            >
              <div className="flex flex-wrap gap-2 max-w-[85%]">
                {values.selectedPlants.length === 0 && (
                  <span className="text-gray-400 text-sm">Select plants</span>
                )}

                {values.selectedPlants.map((pid) => (
                  <span
                    key={pid}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100"
                  >
                    {plantMap[pid]?.name} ({plantMap[pid]?.code})
                    {!isView && (
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFieldValue(
                            "selectedPlants",
                            values.selectedPlants.filter((p) => p !== pid),
                          );
                        }}
                      />
                    )}
                  </span>
                ))}
              </div>

              {!isView && (
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    plantOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>

            {plantOpen && !isView && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPlantOptions.length === 0 ? (
                  <div className="p-3 text-gray-400 text-sm">
                    No plants available
                  </div>
                ) : (
                  filteredPlantOptions.map((plant) => (
                    <label
                      key={plant._id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={values.selectedPlants.includes(plant._id)}
                        onChange={() => {
                          const exists = values.selectedPlants.includes(
                            plant._id,
                          );
                          setFieldValue(
                            "selectedPlants",
                            exists
                              ? values.selectedPlants.filter(
                                  (p) => p !== plant._id,
                                )
                              : [...values.selectedPlants, plant._id],
                          );
                        }}
                        className="accent-blue-600"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {plant.plant_name} ({plant.plant_code})
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {!isView && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleAddUserPlant}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Add User & Plant
              </button>
            </div>
          )}

          {values?.users?.map((user, userIndex) => (
            <div
              key={user.user_id}
              className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={16} className="text-blue-600" />
                <span className="font-semibold">{userMap[user.user_id]}</span>
              </div>
              {!isView && (
                <button
                  type="button"
                  onClick={() => handleRemove(userIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              )}
              <div className="flex flex-wrap gap-2 ml-6">
                {user?.plants_id?.map((plantId, plantIndex) => (
                  <div
                    key={`${user?.user_id}-${plantId}`}
                    className="flex items-center gap-2 bg-white border px-3 py-1 rounded-full text-sm"
                  >
                    <Wand size={14} className="text-green-600" />
                    <span>
                      {plantMap[plantId]?.name} ({plantMap[plantId]?.code})
                    </span>

                    {!isView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (
                            mode === "edit" &&
                            values.users.length === 1 &&
                            user.plants_id.length === 1
                          ) {
                            alert("At least one user is mandatory");
                            return;
                          }

                          const updatedUsers = values.users
                            .map((u, idx) => {
                              if (idx !== userIndex) return u;

                              const newPlants = u.plants_id.filter(
                                (p) => p !== plantId,
                              );

                              return {
                                ...u,
                                plants_id: newPlants,
                              };
                            })
                            .filter((u) => u.plants_id.length > 0);

                          setFieldValue("users", updatedUsers);
                          setFieldValue("selectedPlants", []);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!isView && (
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              {titleMap[mode]}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <label className="block mb-4">
    <span className="font-medium">{label}</span>
    <input
      {...props}
      className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg"
    />
  </label>
);

const Select = ({ label, options, getLabel, ...props }) => (
  <label className="block mb-4">
    <span className="font-medium">{label}</span>
    <select
      {...props}
      multiple={props.multiple}
      className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg"
    >
      <option value="">
        {options.length === 0 ? "No plants available" : `Select ${label}`}
      </option>

      {options.map((opt) => (
        <option key={opt._id} value={opt._id}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  </label>
);

export default AddReleaseGroupModal;
