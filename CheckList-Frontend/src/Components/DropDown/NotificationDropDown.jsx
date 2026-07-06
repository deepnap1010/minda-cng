import { X } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useEffect, useState } from "react";

const NotificationDropdown = ({ innerRef, onClose }) => {
  const { getNotifications, MarkasRead, MarkAllasRead } = useNotifications();
  const notifications =
    getNotifications.data?.pages.flatMap(page => page.data) || [];

  const reciverId = notifications?.[0]?.reciverId
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    const isBottom =
      scrollHeight - scrollTop <= clientHeight + 40;

    if (
      isBottom &&
      getNotifications.hasNextPage &&
      !getNotifications.isFetchingNextPage
    ) {
      getNotifications.fetchNextPage();
    }
  };


  const getDateLabel = (dateString) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();

    today.setHours(0, 0, 0, 0);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const itemDate = new Date(createdDate);
    itemDate.setHours(0, 0, 0, 0);

    if (itemDate.getTime() === today.getTime()) {
      return "Today";
    }

    if (itemDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    return createdDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const groupedNotifications = notifications?.reduce((acc, item) => {
    const label = getDateLabel(item.createdAt);

    if (!acc[label]) {
      acc[label] = [];
    }

    acc[label].push(item);
    return acc;
  }, {});


  const hasUnread = notifications.some(
    (item) => item?.status === "send"
  );

  return (
    <div
      ref={innerRef}
      className="absolute -right-10 sm:right-0 top-12 z-50 w-[340px] sm:w-[460px] bg-white border border-gray-200 rounded-2xl shadow-2xl"
    >

      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3
                  bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
          <X size={18} />
        </button>
      </div>


      <ul
        onScroll={handleScroll}
        className="p-3 space-y-6 max-h-[420px] overflow-y-auto"
      >
        {groupedNotifications &&
          Object.entries(groupedNotifications).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-[14px] font-[700] text-gray-600 px-1 mb-2">
                {dateLabel}
              </p>

              <div className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50 transition"
                  >
                    {item?.type === "template_approval" ? (
                      <>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          <b>Template approval required:</b> <b>{item?.template_name || "Template"}</b>
                          {item?.sender ? (
                            <> submitted by <b>{item.sender.full_name} ({item.sender.user_id})</b>.</>
                          ) : (
                            " has been submitted for approval."
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item?.description?.length > 80
                            ? `${item.description.slice(0, 80)}...`
                            : item?.description || "Please approve or reject in your dashboard."}
                        </p>
                      </>
                    ) : ["cng_stage_moved", "cng_reject", "cng_complete"].includes(item?.type) ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{item?.title}</p>
                        <p className="text-sm text-gray-600">{item?.description}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          An issue was reported on the <b>{item?.assemblyLine?.assembly_name}</b> assembly
                          during the <b>{item?.processInfo?.process_name}</b> process by
                          <b> {item?.sender?.full_name} ({item?.sender?.user_id})</b>.
                        </p>
                        <p className="text-sm text-gray-700">
                          <b>Title:</b> {item?.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Description:</span>{" "}
                          <span className="italic text-gray-500">
                            {item?.description?.length > 50
                              ? `${item.description.slice(0, 50)}...`
                              : item?.description || "N/A"}
                          </span>
                        </p>
                      </>
                    )}

                    {item?.status === "send" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => MarkasRead.mutate(item._id)}
                          className="px-3 py-1 text-xs font-medium text-blue-600
                    border border-blue-200 rounded-md
                    hover:bg-blue-50 hover:border-blue-300"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </div>
            </div>
          ))}
        {getNotifications.isFetchingNextPage &&
          (<div className="flex justify-center items-center py-2">
            <svg className="w-5 h-5 text-gray-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>

          </div>)}
        {notifications?.length === 0 && !getNotifications.isLoading && (
          <p className="text-center text-sm text-gray-500 py-4">
            No Notifications
          </p>
        )}
      </ul>

      <div className="sticky bottom-0 z-20 p-3 bg-gray-50 flex justify-center items-center
                  rounded-b-2xl border-t border-gray-300">
        <button
          disabled={!hasUnread}
          onClick={() => MarkAllasRead.mutate(reciverId)}
          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          Mark All as Read
        </button>
      </div>
    </div>

  );
};

export default NotificationDropdown;
