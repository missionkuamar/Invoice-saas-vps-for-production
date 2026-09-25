/**
 * Escape HTML to prevent broken email HTML / HTML injection
 */
const escapeHTML = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Invoice Email Template
 */
export const getInvoiceEmailHTML = (invoice) => {
  const clientName = escapeHTML(
    invoice?.client?.name || "Customer"
  );

  const invoiceNumber = escapeHTML(
    invoice?.invoiceNumber || "N/A"
  );

  const total = Number(invoice?.total || 0);

  const currency =
    invoice?.currency === "₹" ||
    invoice?.currency === "INR"
      ? "₹"
      : escapeHTML(invoice?.currency || "INR");

  const dueDate = invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const safeDueDate = dueDate
    ? escapeHTML(dueDate)
    : null;

  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Invoice ${invoiceNumber}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#222;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f5f7fb;padding:30px 10px;"
  >

    <tr>
      <td align="center">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            width:100%;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            border:1px solid #e5e7eb;
          "
        >

          <!-- HEADER -->

          <tr>
            <td
              style="
                padding:25px;
                background:#0f172a;
                color:#ffffff;
              "
            >

              <h1
                style="
                  margin:0;
                  font-size:24px;
                "
              >
                InvoicePro
              </h1>

              <p
                style="
                  margin:8px 0 0;
                  color:#cbd5e1;
                  font-size:14px;
                "
              >
                Invoice notification
              </p>

            </td>
          </tr>

          <!-- BODY -->

          <tr>
            <td style="padding:30px;">

              <p
                style="
                  margin:0 0 15px;
                  font-size:16px;
                "
              >
                Hello ${clientName},
              </p>

              <p
                style="
                  margin:0 0 25px;
                  color:#475569;
                  line-height:1.6;
                "
              >
                Please find your invoice attached to this email.
              </p>

              <!-- INVOICE INFO -->

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f8fafc;
                  border:1px solid #e2e8f0;
                  border-radius:8px;
                "
              >

                <tr>
                  <td
                    style="
                      padding:15px;
                      color:#64748b;
                      font-size:14px;
                    "
                  >
                    Invoice Number
                  </td>

                  <td
                    align="right"
                    style="
                      padding:15px;
                      font-weight:bold;
                      font-size:14px;
                    "
                  >
                    #${invoiceNumber}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:15px;
                      color:#64748b;
                      font-size:14px;
                    "
                  >
                    Total Amount
                  </td>

                  <td
                    align="right"
                    style="
                      padding:15px;
                      font-weight:bold;
                      font-size:18px;
                    "
                  >
                    ${currency}${total.toFixed(2)}
                  </td>
                </tr>

                ${
                  safeDueDate
                    ? `
                <tr>
                  <td
                    style="
                      padding:15px;
                      color:#64748b;
                      font-size:14px;
                    "
                  >
                    Due Date
                  </td>

                  <td
                    align="right"
                    style="
                      padding:15px;
                      font-weight:bold;
                      font-size:14px;
                    "
                  >
                    ${safeDueDate}
                  </td>
                </tr>
                `
                    : ""
                }

              </table>

              <p
                style="
                  margin:25px 0 0;
                  color:#64748b;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                The invoice PDF is attached to this email.
                Please review the details and contact the sender
                if you have any questions.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #e5e7eb;
                text-align:center;
              "
            >

              <p
                style="
                  margin:0;
                  color:#64748b;
                  font-size:12px;
                "
              >
                This is an automated email from InvoicePro.
              </p>

              <p
                style="
                  margin:8px 0 0;
                  color:#94a3b8;
                  font-size:11px;
                "
              >
                Please do not reply directly to this email.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;
};