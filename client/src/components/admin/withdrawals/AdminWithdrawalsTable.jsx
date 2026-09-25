// frontend/src/components/admin/withdrawals/AdminWithdrawalsTable.jsx

import React from "react";
import {
  FaWallet,
  FaEye,
  FaCopy,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

import { useTheme } from "../../../themes/ThemeProvider";
import toast from "react-hot-toast";

const AdminWithdrawalsTable = ({
  withdrawals = [],
  pagination = {},
  onPageChange,
  onLimitChange,
  onApprove,
  onComplete,
  onReject,
  onViewDetails,
  processing = false,
}) => {
  const { theme } = useTheme();

  // ==========================================================
  // SAFE VALUES
  // ==========================================================

  const safeWithdrawals = Array.isArray(withdrawals)
    ? withdrawals.filter(Boolean)
    : [];

  const safePagination =
    pagination && typeof pagination === "object"
      ? pagination
      : {};

  const currentPage =
    Number(safePagination?.page) > 0
      ? Number(safePagination.page)
      : 1;

  const currentLimit =
    Number(safePagination?.limit) > 0
      ? Number(safePagination.limit)
      : 20;

  const total =
    Number(safePagination?.total) >= 0
      ? Number(safePagination.total)
      : 0;

  const totalPages =
    Number(safePagination?.pages) > 0
      ? Number(safePagination.pages)
      : 1;

  const firstPage =
    Number(safePagination?.firstPage) > 0
      ? Number(safePagination.firstPage)
      : 1;

  const lastPage =
    Number(safePagination?.lastPage) > 0
      ? Number(safePagination.lastPage)
      : totalPages;

  const hasPreviousPage =
    safePagination?.hasPreviousPage === true ||
    currentPage > 1;

  const hasNextPage =
    safePagination?.hasNextPage === true ||
    currentPage < totalPages;

  // ==========================================================
  // SAFE RANGE
  // ==========================================================

  const startItem =
    total === 0
      ? 0
      : Number(safePagination?.startItem) > 0
        ? Number(safePagination.startItem)
        : (currentPage - 1) * currentLimit + 1;

  const endItem =
    total === 0
      ? 0
      : Number(safePagination?.endItem) > 0
        ? Number(safePagination.endItem)
        : Math.min(
            currentPage * currentLimit,
            total
          );

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: "⏳",
        label: "Pending",
      },

      approved: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: "✅",
        label: "Approved",
      },

      processing: {
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        icon: "🔄",
        label: "Processing",
      },

      completed: {
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: "🎉",
        label: "Completed",
      },

      failed: {
        color:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: "❌",
        label: "Failed",
      },

      cancelled: {
        color:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        icon: "🚫",
        label: "Cancelled",
      },
    };

    const safeStatus =
      typeof status === "string"
        ? status.toLowerCase()
        : "pending";

    const style =
      config[safeStatus] || config.pending;

    return (
      <span
        className={`
          px-2 md:px-3
          py-1
          rounded-full
          text-xs
          font-medium
          ${style.color}
          flex
          items-center
          gap-1
          w-fit
        `}
      >
        <span>{style.icon}</span>
        <span>{style.label}</span>
      </span>
    );
  };

  // ==========================================================
  // PAYMENT METHOD ICON
  // ==========================================================

  const getPaymentMethodIcon = (method) => {
    const safeMethod =
      typeof method === "string"
        ? method.toLowerCase()
        : "";

    const icons = {
      bank: "🏦",
      upi: "📱",
      paypal: "💳",
    };

    return icons[safeMethod] || "💳";
  };

  // ==========================================================
  // PAYMENT METHOD NAME
  // ==========================================================

  const getPaymentMethodName = (method) => {
    const safeMethod =
      typeof method === "string"
        ? method.toLowerCase()
        : "";

    const names = {
      bank: "Bank Transfer",
      upi: "UPI",
      paypal: "PayPal",
    };

    return (
      names[safeMethod] ||
      (safeMethod
        ? safeMethod.toUpperCase()
        : "Unknown")
    );
  };

  // ==========================================================
  // SAFE DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    try {
      return parsedDate.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  // ==========================================================
  // SAFE AMOUNT
  // ==========================================================

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return "₹0.00";
    }

    return `₹${numericAmount.toFixed(2)}`;
  };

  // ==========================================================
  // COPY
  // ==========================================================

  const copyToClipboard = async (text) => {
    if (!text) {
      return;
    }

    try {
      if (
        navigator?.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          String(text)
        );

        toast.success("Copied!");
      } else {
        toast.error(
          "Copy is not supported in this browser"
        );
      }
    } catch (error) {
      // console.error(
      //   "Copy failed:",
      //   error
      // );

      toast.error("Failed to copy");
    }
  };

  // ==========================================================
  // SAFE CALLBACKS
  // ==========================================================

  const safePageChange = (page) => {
    if (
      typeof onPageChange !== "function"
    ) {
      return;
    }

    const numericPage = Number(page);

    if (
      !Number.isFinite(numericPage) ||
      numericPage < 1
    ) {
      return;
    }

    const safePage = Math.min(
      Math.max(
        Math.floor(numericPage),
        1
      ),
      totalPages
    );

    onPageChange(safePage);
  };

  const safeLimitChange = (limit) => {
    if (
      typeof onLimitChange !== "function"
    ) {
      return;
    }

    const allowedLimits = [
      5,
      10,
      20,
      50,
      100,
      200,
    ];

    const numericLimit = Number(limit);

    if (
      !allowedLimits.includes(
        numericLimit
      )
    ) {
      return;
    }

    onLimitChange(numericLimit);
  };

  const safeApprove = (id) => {
    if (
      id &&
      typeof onApprove === "function"
    ) {
      onApprove(id);
    }
  };

  const safeComplete = (id) => {
    if (
      id &&
      typeof onComplete === "function"
    ) {
      onComplete(id);
    }
  };

  const safeReject = (id) => {
    if (
      id &&
      typeof onReject === "function"
    ) {
      onReject(id);
    }
  };

  const safeViewDetails = (withdrawal) => {
    if (
      withdrawal &&
      typeof onViewDetails === "function"
    ) {
      onViewDetails(withdrawal);
    }
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (safeWithdrawals.length === 0) {
    return (
      <div
        className={`
          ${theme?.colors?.card || "bg-white"}
          rounded-2xl
          border
          ${theme?.colors?.border || "border-gray-200"}
          overflow-hidden
        `}
      >
        <div
          className={`
            text-center
            py-12
            ${theme?.colors?.text || "text-gray-700"}
          `}
        >
          <FaWallet
            className={`
              text-6xl
              mx-auto
              mb-4
              opacity-30
            `}
          />

          <p
            className="
              text-lg
              font-medium
            "
          >
            No withdrawal requests
          </p>

          <p
            className="
              text-sm
              opacity-60
              mt-1
            "
          >
            When affiliates request
            withdrawals, they will appear here
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN TABLE
  // ==========================================================

  return (
    <div
      className={`
        ${theme?.colors?.card || "bg-white"}
        rounded-2xl
        border
        ${theme?.colors?.border || "border-gray-200"}
        overflow-hidden
      `}
    >
      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-x-auto">
        <table
          className="
            min-w-full
            divide-y
            divide-gray-200
            dark:divide-gray-700
          "
        >
          {/* HEADER */}

          <thead
            className={
              theme?.colors?.background ||
              "bg-gray-50"
            }
          >
            <tr>
              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                "
              >
                User
              </th>

              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                "
              >
                Amount
              </th>

              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                  hidden
                  sm:table-cell
                "
              >
                Method
              </th>

              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                "
              >
                Status
              </th>

              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                  hidden
                  md:table-cell
                "
              >
                Date
              </th>

              <th
                className="
                  px-3 md:px-4
                  py-3
                  text-right
                  text-xs
                  font-medium
                  text-gray-500
                  dark:text-gray-400
                  uppercase
                  tracking-wider
                "
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}

          <tbody
            className="
              divide-y
              divide-gray-200
              dark:divide-gray-700
            "
          >
            {safeWithdrawals.map(
              (withdrawal, index) => {
                // ==================================================
                // SAFE WITHDRAWAL OBJECT
                // ==================================================

                const w =
                  withdrawal &&
                  typeof withdrawal ===
                    "object"
                    ? withdrawal
                    : {};

                const id =
                  w?._id ||
                  w?.id ||
                  `withdrawal-${index}`;

                // ==================================================
                // SAFE USER
                // ==================================================

                const user =
                  w?.user &&
                  typeof w.user ===
                    "object"
                    ? w.user
                    : {};

                // ==================================================
                // SAFE VALUES
                // ==================================================

                const userName =
                  user?.name ||
                  w?.userName ||
                  "Unknown";

                const userEmail =
                  user?.email ||
                  w?.userEmail ||
                  "No email";

                const amount =
                  formatAmount(
                    w?.amount
                  );

                const paymentMethod =
                  w?.paymentMethod ||
                  "unknown";

                const status =
                  w?.status ||
                  "pending";

                const transactionId =
                  w?.transactionId ||
                  "";

                // ==================================================
                // RENDER
                // ==================================================

                return (
                  <tr
                    key={id}
                    className={`
                      ${
                        theme?.colors
                          ?.hover ||
                        "hover:bg-gray-50"
                      }
                      transition-colors
                    `}
                  >
                    {/* USER */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                      "
                    >
                      <div>
                        <p
                          className={`
                            text-sm
                            font-medium
                            ${
                              theme?.colors
                                ?.text ||
                              "text-gray-700"
                            }
                          `}
                        >
                          {userName}
                        </p>

                        <p
                          className={`
                            text-xs
                            md:text-sm
                            ${
                              theme?.colors
                                ?.text ||
                              "text-gray-700"
                            }
                            opacity-60
                            truncate
                            max-w-[120px]
                            md:max-w-none
                          `}
                        >
                          {userEmail}
                        </p>
                      </div>
                    </td>

                    {/* AMOUNT */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                      "
                    >
                      <span
                        className={`
                          text-sm
                          md:text-base
                          font-bold
                          ${
                            theme?.colors
                              ?.text ||
                            "text-gray-700"
                          }
                        `}
                      >
                        {amount}
                      </span>
                    </td>

                    {/* PAYMENT METHOD */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                        hidden
                        sm:table-cell
                      "
                    >
                      <span
                        className={`
                          text-sm
                          ${
                            theme?.colors
                              ?.text ||
                            "text-gray-700"
                          }
                          flex
                          items-center
                          gap-1
                        `}
                      >
                        {getPaymentMethodIcon(
                          paymentMethod
                        )}

                        {getPaymentMethodName(
                          paymentMethod
                        )}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                      "
                    >
                      {getStatusBadge(
                        status
                      )}
                    </td>

                    {/* DATE */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                        hidden
                        md:table-cell
                      "
                    >
                      <span
                        className={`
                          text-sm
                          ${
                            theme?.colors
                              ?.text ||
                            "text-gray-700"
                          }
                          opacity-60
                        `}
                      >
                        {formatDate(
                          w?.createdAt
                        )}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td
                      className="
                        px-3 md:px-4
                        py-3
                        text-right
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-1
                          md:gap-2
                          flex-wrap
                        "
                      >
                        {/* PENDING */}

                        {status ===
                          "pending" && (
                          <>
                            {/* APPROVE */}

                            <button
                              type="button"
                              onClick={() =>
                                safeApprove(
                                  w?._id
                                )
                              }
                              disabled={
                                processing ||
                                !w?._id
                              }
                              className={`
                                px-2
                                md:px-3
                                py-1
                                rounded-lg
                                text-xs
                                font-medium
                                bg-blue-500
                                hover:bg-blue-600
                                text-white
                                transition-colors
                                ${
                                  processing ||
                                  !w?._id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              `}
                              title="Approve"
                            >
                              <FaCheck
                                size={12}
                              />
                            </button>

                            {/* COMPLETE */}

                            <button
                              type="button"
                              onClick={() =>
                                safeComplete(
                                  w?._id
                                )
                              }
                              disabled={
                                processing ||
                                !w?._id
                              }
                              className={`
                                px-2
                                md:px-3
                                py-1
                                rounded-lg
                                text-xs
                                font-medium
                                bg-green-500
                                hover:bg-green-600
                                text-white
                                transition-colors
                                ${
                                  processing ||
                                  !w?._id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              `}
                              title="Complete"
                            >
                              <FaCheck
                                size={12}
                              />
                            </button>

                            {/* REJECT */}

                            <button
                              type="button"
                              onClick={() =>
                                safeReject(
                                  w?._id
                                )
                              }
                              disabled={
                                processing ||
                                !w?._id
                              }
                              className={`
                                px-2
                                md:px-3
                                py-1
                                rounded-lg
                                text-xs
                                font-medium
                                bg-red-500
                                hover:bg-red-600
                                text-white
                                transition-colors
                                ${
                                  processing ||
                                  !w?._id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              `}
                              title="Reject"
                            >
                              <FaTimes
                                size={12}
                              />
                            </button>
                          </>
                        )}

                        {/* APPROVED */}

                        {status ===
                          "approved" && (
                          <button
                            type="button"
                            onClick={() =>
                              safeComplete(
                                w?._id
                              )
                            }
                            disabled={
                              processing ||
                              !w?._id
                            }
                            className={`
                              px-2
                              md:px-3
                              py-1
                              rounded-lg
                              text-xs
                              font-medium
                              bg-green-500
                              hover:bg-green-600
                              text-white
                              transition-colors
                              ${
                                processing ||
                                !w?._id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            `}
                          >
                            Complete
                          </button>
                        )}

                        {/* TRANSACTION ID */}

                        {transactionId && (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                transactionId
                              )
                            }
                            className={`
                              p-1
                              rounded-lg
                              ${
                                theme?.colors
                                  ?.hover ||
                                "hover:bg-gray-100"
                              }
                              transition-colors
                            `}
                            title="Copy Transaction ID"
                          >
                            <FaCopy
                              className={`
                                text-sm
                                ${
                                  theme?.colors
                                    ?.text ||
                                  "text-gray-700"
                                }
                                opacity-50
                              `}
                            />
                          </button>
                        )}

                        {/* VIEW */}

                        <button
                          type="button"
                          onClick={() =>
                            safeViewDetails(
                              w
                            )
                          }
                          disabled={!w?._id}
                          className={`
                            p-1
                            rounded-lg
                            ${
                              theme?.colors
                                ?.hover ||
                              "hover:bg-gray-100"
                            }
                            transition-colors
                            ${
                              !w?._id
                                ? "opacity-40 cursor-not-allowed"
                                : ""
                            }
                          `}
                          title="View Details"
                        >
                          <FaEye
                            className={`
                              text-sm
                              ${
                                theme?.colors
                                  ?.text ||
                                "text-gray-700"
                              }
                              opacity-70
                            `}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <div
        className={`
          px-4
          md:px-6
          py-4
          border-t
          ${
            theme?.colors?.border ||
            "border-gray-200"
          }
          flex
          flex-col
          lg:flex-row
          items-center
          justify-between
          gap-4
        `}
      >
        {/* LEFT */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            items-center
            gap-3
          "
        >
          {/* SHOWING */}

          <span
            className={`
              text-xs
              sm:text-sm
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              opacity-70
            `}
          >
            Showing{" "}
            {startItem}{" "}
            to{" "}
            {endItem}{" "}
            of{" "}
            {total}
          </span>

          {/* ITEMS PER PAGE */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className={`
                text-xs
                sm:text-sm
                ${
                  theme?.colors?.text ||
                  "text-gray-700"
                }
                opacity-70
                whitespace-nowrap
              `}
            >
              Items per page:
            </span>

            <select
              value={currentLimit}
              onChange={(e) =>
                safeLimitChange(
                  e.target.value
                )
              }
              className={`
                px-3
                py-2
                rounded-lg
                border
                ${
                  theme?.colors?.border ||
                  "border-gray-300"
                }
                ${
                  theme?.colors?.background ||
                  "bg-white"
                }
                ${
                  theme?.colors?.text ||
                  "text-gray-700"
                }
                text-sm
                font-medium
                outline-none
                cursor-pointer
              `}
            >
              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={50}>
                50
              </option>

              <option value={100}>
                100
              </option>

              <option value={200}>
                200
              </option>
            </select>
          </div>
        </div>

        {/* RIGHT */}

        <div
          className="
            flex
            items-center
            gap-1
            sm:gap-2
            flex-wrap
            justify-center
          "
        >
          {/* FIRST */}

          <button
            type="button"
            onClick={() =>
              safePageChange(
                firstPage
              )
            }
            disabled={
              !hasPreviousPage ||
              currentPage === firstPage
            }
            className={`
              px-3
              py-2
              rounded-lg
              border
              ${
                theme?.colors?.border ||
                "border-gray-300"
              }
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              text-xs
              sm:text-sm
              font-medium
              transition-colors
              disabled:opacity-40
              disabled:cursor-not-allowed
            `}
          >
            First
          </button>

          {/* PREVIOUS */}

          <button
            type="button"
            onClick={() =>
              safePageChange(
                currentPage - 1
              )
            }
            disabled={
              !hasPreviousPage
            }
            className={`
              px-3
              py-2
              rounded-lg
              border
              ${
                theme?.colors?.border ||
                "border-gray-300"
              }
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              text-xs
              sm:text-sm
              font-medium
              transition-colors
              disabled:opacity-40
              disabled:cursor-not-allowed
            `}
          >
            Previous
          </button>

          {/* PAGE */}

          <div
            className={`
              px-3
              sm:px-4
              py-2
              rounded-lg
              ${
                theme?.colors?.background ||
                "bg-gray-50"
              }
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              text-xs
              sm:text-sm
              font-semibold
              whitespace-nowrap
            `}
          >
            Page{" "}
            {currentPage}{" "}
            /{" "}
            {totalPages}
          </div>

          {/* NEXT */}

          <button
            type="button"
            onClick={() =>
              safePageChange(
                currentPage + 1
              )
            }
            disabled={
              !hasNextPage
            }
            className={`
              px-3
              py-2
              rounded-lg
              border
              ${
                theme?.colors?.border ||
                "border-gray-300"
              }
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              text-xs
              sm:text-sm
              font-medium
              transition-colors
              disabled:opacity-40
              disabled:cursor-not-allowed
            `}
          >
            Next
          </button>

          {/* LAST */}

          <button
            type="button"
            onClick={() =>
              safePageChange(
                lastPage
              )
            }
            disabled={
              !hasNextPage ||
              currentPage === lastPage
            }
            className={`
              px-3
              py-2
              rounded-lg
              border
              ${
                theme?.colors?.border ||
                "border-gray-300"
              }
              ${
                theme?.colors?.text ||
                "text-gray-700"
              }
              text-xs
              sm:text-sm
              font-medium
              transition-colors
              disabled:opacity-40
              disabled:cursor-not-allowed
            `}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalsTable;