import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Invoice PDF
 * Returns absolute PDF file path
 */
export const firstgenerateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      if (!invoice?._id) {
        return reject(new Error("Invalid invoice data"));
      }

      const invoiceNumber = String(
        invoice.invoiceNumber || invoice._id
      ).replace(/[^a-zA-Z0-9_-]/g, "_");

      // uploads/invoices directory
      const uploadDir = path.join(__dirname, "..", "uploads", "invoices");

      // Create directory if it doesn't exist
      fs.mkdirSync(uploadDir, {
        recursive: true,
      });

      const fileName = `Invoice-${invoiceNumber}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filePath);

      stream.on("error", (error) => {
        // console.error("PDF Write Error:", error);
        reject(error);
      });

      doc.on("error", (error) => {
        // console.error("PDF Generation Error:", error);
        reject(error);
      });

      stream.on("finish", () => {
        resolve(filePath);
      });

      doc.pipe(stream);

      // =========================
      // HEADER
      // =========================

      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("INVOICE", {
          align: "right",
        });

      doc.moveDown();

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Invoice #: ${invoice.invoiceNumber || "N/A"}`,
          { align: "right" }
        );

      doc.text(
        `Issue Date: ${formatDate(invoice.issueDate)}`,
        { align: "right" }
      );

      if (invoice.dueDate) {
        doc.text(
          `Due Date: ${formatDate(invoice.dueDate)}`,
          { align: "right" }
        );
      }

      doc.moveDown(2);

      // =========================
      // CLIENT
      // =========================

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:");

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(invoice.client?.name || "Client");

      if (invoice.client?.email) {
        doc.text(invoice.client.email);
      }

      if (invoice.client?.phone) {
        doc.text(invoice.client.phone);
      }

      if (invoice.client?.address) {
        doc.text(invoice.client.address);
      }

      doc.moveDown(2);

      // =========================
      // ITEMS
      // =========================

      const tableTop = doc.y;

      doc
        .fontSize(10)
        .font("Helvetica-Bold");

      doc.text("Item", 50, tableTop, { width: 230 });
      doc.text("Qty", 290, tableTop, { width: 60 });
      doc.text("Price", 350, tableTop, {
        width: 90,
        align: "right",
      });
      doc.text("Total", 450, tableTop, {
        width: 90,
        align: "right",
      });

      doc
        .moveTo(50, tableTop + 18)
        .lineTo(540, tableTop + 18)
        .stroke();

      let currentY = tableTop + 30;

      const items = Array.isArray(invoice.items)
        ? invoice.items
        : [];

      items.forEach((item) => {
        const name = item.name || item.description || "Item";
        const quantity = Number(item.quantity || item.qty || 0);
        const price = Number(item.price || item.rate || 0);

        const total =
          item.total !== undefined
            ? Number(item.total)
            : quantity * price;

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(name, 50, currentY, {
            width: 230,
          });

        doc.text(String(quantity), 290, currentY, {
          width: 60,
        });

        doc.text(formatMoney(price, invoice.currency), 350, currentY, {
          width: 90,
          align: "right",
        });

        doc.text(formatMoney(total, invoice.currency), 450, currentY, {
          width: 90,
          align: "right",
        });

        currentY += 25;

        // New page if required
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }
      });

      // =========================
      // TOTALS
      // =========================

      currentY += 15;

      doc
        .moveTo(350, currentY)
        .lineTo(540, currentY)
        .stroke();

      currentY += 15;

      const subtotal = Number(invoice.subtotal || 0);
      const tax = Number(invoice.tax || 0);
      const total = Number(invoice.total || 0);

      doc
        .fontSize(10)
        .font("Helvetica");

      doc.text("Subtotal", 350, currentY, {
        width: 90,
      });

      doc.text(
        formatMoney(subtotal, invoice.currency),
        450,
        currentY,
        {
          width: 90,
          align: "right",
        }
      );

      currentY += 20;

      doc.text("Tax", 350, currentY, {
        width: 90,
      });

      doc.text(
        formatMoney(tax, invoice.currency),
        450,
        currentY,
        {
          width: 90,
          align: "right",
        }
      );

      currentY += 25;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total", 350, currentY, {
          width: 90,
        });

      doc.text(
        formatMoney(total, invoice.currency),
        450,
        currentY,
        {
          width: 90,
          align: "right",
        }
      );

      // =========================
      // NOTES
      // =========================

      if (invoice.notes) {
        currentY += 50;

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Notes:", 50, currentY);

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(String(invoice.notes), 50, currentY + 18, {
            width: 490,
          });
      }

      // =========================
      // TERMS
      // =========================

      if (invoice.terms) {
        doc.moveDown(3);

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Terms & Conditions:");

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(String(invoice.terms), {
            width: 490,
          });
      }

      // =========================
      // FOOTER
      // =========================

      const range = doc.bufferedPageRange();

      for (
        let i = range.start;
        i < range.start + range.count;
        i++
      ) {
        doc.switchToPage(i);

        doc
          .fontSize(8)
          .font("Helvetica")
          .text(
            `Generated by InvoicePro • Page ${i + 1}`,
            50,
            780,
            {
              align: "center",
              width: 490,
            }
          );
      }

      doc.end();
    } catch (error) {
      // console.error("generateInvoicePDF Error:", error);
      reject(error);
    }
  });
};

// =========================
// HELPERS
// =========================

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount, currency = "INR") => {
  const value = Number(amount || 0);

  if (currency === "₹" || currency === "INR") {
    return `₹${value.toFixed(2)}`;
  }

  return `${currency} ${value.toFixed(2)}`;
};