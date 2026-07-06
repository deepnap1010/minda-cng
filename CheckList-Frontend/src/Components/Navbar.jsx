import { Menu, X, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ProfileDropDown from "../Components/DropDown/ProfileDropDown";
import NotificationDropdown from "../Components/DropDown/NotificationDropDown";
import { useLogin } from "../hooks/useLogin";
import { useNotifications } from "../hooks/useNotifications";

export default function Navbar({ onMenuClick, isMobileOpen }) {
  const { logedinUser } = useLogin();

  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { getNotifications } = useNotifications()
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const notifRef = useRef(null);
  const notifButtonRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const notifications =
    getNotifications.data?.pages.flatMap(page => page.data) || [];
  const hasUnread = notifications.some(
    (item) => item?.status === "send"
  );

  return (
    <div className="w-full bg-white sticky top-0 z-50 shadow-sm">
      <div
        className="
        max-w-screen-xl 
        2xl:max-w-[1800px] 
        mx-auto 
        flex items-center justify-between 
        py-3 sm:py-4 
        px-4 sm:px-6 lg:px-10
      "
      >
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={onMenuClick}
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h2
            className="
            hidden md:block 
            text-lg lg:text-xl xl:text-2xl 
            font-semibold
          "
          >
            {getGreeting()},{" "}
            <span className="text-blue-600 font-bold">
              {logedinUser?.data?.full_name
                ?.trim()
                ?.replace(/^./, (char) => char.toUpperCase())}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <div ref={notifButtonRef} className="relative cursor-pointer">
            <Bell   onClick={() => setNotificationsOpen(!notificationsOpen)} size={22} />

            {hasUnread && (
              <span
                className="absolute -top-1 -right-0 h-2.5 w-2.5 rounded-full bg-red-500
                 animate-ping"
              />
            )}

            {hasUnread && (
              <span
                className="absolute -top-1 -right-0 h-2.5 w-2.5 rounded-full bg-red-500"
              />
            )}
            {notificationsOpen && (
              <NotificationDropdown
                innerRef={notifRef}
                onClose={() => setNotificationsOpen(false)}
              />
            )}
          </div>


          {/* Profile Avatar */}
          <div
            ref={buttonRef}
            onClick={() => setOpen(!open)}
            className="
              w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11
              flex items-center justify-center
              rounded-full
              bg-blue-300
              text-gray-800
              font-semibold
              text-sm sm:text-base
              cursor-pointer
            "
          >
            {logedinUser?.data?.full_name
              ? logedinUser.data.full_name.charAt(0).toUpperCase()
              : ""}
          </div>

          {open && (
            <ProfileDropDown ref={dropdownRef} onClose={() => setOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
