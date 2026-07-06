import { X, LogOut } from "lucide-react";
import { useLogin } from "../../hooks/useLogin"
import { useNavigate } from "react-router-dom";


const ProfileDropDown = ({ ref , onClose}) => {

  const { logedinUser, logOutUser } = useLogin();
  const navigate = useNavigate();

    const handleLogout = () => {
      logOutUser.mutate();
      navigate("/login");
    };


  return (
    <div
      ref={ref}
      className="absolute top-16 right-8 z-50 min-w-[300px] max-w-[300px] bg-white border border-gray-200 rounded-xl shadow-lg p-4 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-300 text-black font-semibold text-lg cursor-pointer">
            {logedinUser?.data?.full_name
              ? logedinUser.data.full_name.charAt(0).toUpperCase()
              : ""}
          </div>

          <div className="flex flex-col">
            <p className="font-semibold text-gray-900">
              {logedinUser?.data?.full_name}{" "}
            </p>
            <p className="text-gray-500 text-sm">{logedinUser?.data?.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 cursor-pointer rounded-full hover:bg-gray-100 transition ml-2"
        >
          <X size={20} className="text-gray-500 hover:text-gray-900" />
        </button>
      </div>

      <button
        onClick={() => handleLogout()}
        className="w-full cursor-pointer flex items-center justify-center gap-2 
                           bg-blue-500 hover:bg-blue-600 text-white 
                           rounded-lg py-2.5 shadow-sm transition-all mt-4"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default ProfileDropDown;
