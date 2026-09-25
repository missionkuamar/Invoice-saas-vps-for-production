import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs/promises";
import path from "path";
import os from "os";


/**
 * Escape HTML values before inserting them into the PDF HTML.
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
 * Safely format a number.
 */
const formatNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(2)
    : "0.00";
};

/**
 * Safely format date.
 */
const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Generate invoice PDF.
 *
 * Returns:
 *   Absolute path of generated PDF
 */
export const generateInvoicePDF = async (invoice) => {
  let browser = null;

  try {
    // console.log("\n========================================");
    // console.log("📄 INVOICE PDF GENERATION START");
    // console.log("========================================");

    // console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
    // console.log("💻 Platform:", process.platform);
    // console.log("🏠 Working Directory:", process.cwd());

    // =========================================================
    // 1. VALIDATE INVOICE
    // =========================================================

    // console.log("🔍 Validating invoice...");

    if (!invoice) {
      throw new Error("Invoice data is missing");
    }

    if (!invoice._id) {
      throw new Error("Invoice ID is missing");
    }

    if (!invoice.invoiceNumber) {
      throw new Error("Invoice number is missing");
    }

    // console.log("✅ Invoice validation passed");
    // console.log("🧾 Invoice ID:", invoice._id);
    // console.log("🧾 Invoice Number:", invoice.invoiceNumber);

    // =========================================================
    // 2. NORMALIZE DATA
    // =========================================================

    // console.log("🔄 Normalizing invoice data...");

    const invoiceNumber = String(
      invoice.invoiceNumber
    );

    const clientName = String(
      invoice.client?.name ||
      invoice.clientName ||
      "Customer"
    );

    const clientEmail = String(
      invoice.client?.email ||
      invoice.clientEmail ||
      ""
    );

    const currency = String(
      invoice.currency || "₹"
    );

    const items = Array.isArray(invoice.items)
      ? invoice.items
      : [];

    const total = Number(invoice.total || 0);

    // console.log("👤 Client:", clientName);
    // console.log("📧 Client Email:", clientEmail);
    // console.log("💰 Currency:", currency);
    // console.log("📦 Items:", items.length);
    // console.log("💵 Total:", total);

    // =========================================================
    // 3. CREATE SAFE FILE NAME
    // =========================================================

    const safeInvoiceNumber =
      invoiceNumber
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 100);

    // console.log(
    //   "📁 Safe Invoice Filename:",
    //   safeInvoiceNumber
    // );

    // =========================================================
    // 4. BUILD ITEMS HTML
    // =========================================================

    // console.log("🧱 Building invoice HTML...");

    const itemsHTML = items
      .map((item) => {
        const name = escapeHTML(
          item?.name || "Item"
        );

        const description = escapeHTML(
          item?.description || "-"
        );

        const quantity = Number(
          item?.quantity || 0
        );

        const price = Number(
          item?.price || 0
        );

        const itemTotal =
          item?.total !== undefined
            ? Number(item.total)
            : quantity * price;

        return `
          <tr>
            <td>
              <strong>${name}</strong>
            </td>

            <td>
              ${description}
            </td>

            <td>
              ${quantity}
            </td>

            <td>
              ${escapeHTML(currency)}
              ${formatNumber(price)}
            </td>

            <td>
              ${escapeHTML(currency)}
              ${formatNumber(itemTotal)}
            </td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>

      <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <style>

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            padding: 40px;

            color: #222;

            font-size: 13px;

            background: #ffffff;
          }

          .header {
            background: #1a237e;

            color: #ffffff;

            padding: 22px;

            text-align: center;

            border-radius: 6px;
          }

          .header h1 {
            margin: 0 0 8px;

            font-size: 28px;
          }

          .header p {
            margin: 0;

            font-size: 14px;
          }

          .client-section {
            margin-top: 25px;

            padding: 18px;

            border: 1px solid #eeeeee;

            border-radius: 6px;
          }

          .client-section h3 {
            margin: 0 0 10px;

            font-size: 16px;
          }

          .client-section p {
            margin: 5px 0;
          }

          table {
            width: 100%;

            border-collapse: collapse;

            margin-top: 25px;
          }

          th {
            background: #f5f5f5;

            padding: 12px;

            text-align: left;

            border-bottom: 2px solid #dddddd;

            font-size: 12px;
          }

          td {
            padding: 12px;

            border-bottom: 1px solid #eeeeee;

            vertical-align: top;
          }

          .total-row td {
            font-weight: bold;

            font-size: 15px;

            background: #fafafa;
          }

          .total-label {
            text-align: right;
          }

          .footer {
            margin-top: 35px;

            padding-top: 18px;

            border-top: 1px solid #eeeeee;

            text-align: center;

            color: #666666;

            font-size: 11px;
          }

        </style>

      </head>

      <body>

        <div class="header">

          <h1>INVOICE</h1>

          <p>
            #${escapeHTML(invoiceNumber)}
          </p>

        </div>

        <div class="client-section">

          <h3>Bill To</h3>

          <p>
            <strong>
              ${escapeHTML(clientName)}
            </strong>
          </p>

          ${clientEmail
        ? `
                <p>
                  ${escapeHTML(clientEmail)}
                </p>
              `
        : ""
      }

          <p>
            <strong>Issue Date:</strong>
            ${formatDate(invoice.issueDate)}
          </p>

          ${invoice.dueDate
        ? `
                <p>
                  <strong>Due Date:</strong>
                  ${formatDate(invoice.dueDate)}
                </p>
              `
        : ""
      }

        </div>

        <table>

          <thead>

            <tr>

              <th>
                Item
              </th>

              <th>
                Description
              </th>

              <th>
                Qty
              </th>

              <th>
                Price
              </th>

              <th>
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            ${itemsHTML ||
      `
                <tr>
                  <td colspan="5">
                    No items available
                  </td>
                </tr>
              `
      }

            <tr class="total-row">

              <td
                colspan="4"
                class="total-label"
              >
                Total
              </td>

              <td>
                ${escapeHTML(currency)}
                ${formatNumber(total)}
              </td>

            </tr>

          </tbody>

        </table>

        ${invoice.notes
        ? `
              <div
                style="
                  margin-top:25px;
                  padding:15px;
                  background:#fafafa;
                  border:1px solid #eeeeee;
                  border-radius:6px;
                "
              >

                <strong>Notes</strong>

                <p>
                  ${escapeHTML(invoice.notes)}
                </p>

              </div>
            `
        : ""
      }

        ${invoice.terms
        ? `
              <div
                style="
                  margin-top:20px;
                "
              >

                <strong>
                  Terms & Conditions
                </strong>

                <p>
                  ${escapeHTML(invoice.terms)}
                </p>

              </div>
            `
        : ""
      }

        <div class="footer">

          <p>
            © ${new Date().getFullYear()} InvoicePro
          </p>

          <p>
            This invoice was generated electronically.
          </p>

        </div>

      </body>

      </html>
    `;

    // console.log("✅ Invoice HTML created");

    // =========================================================
    // 5. RESOLVE CHROME PATH
    // =========================================================

    // =========================================================
    // 5. RESOLVE CHROME PATH (via @sparticuz/chromium)
    // =========================================================

    // console.log("\n========================================");
    // console.log("🌐 CHROMIUM EXECUTABLE CHECK");
    // console.log("========================================");

    // =========================================================
    // 5. RESOLVE CHROME PATH (Local + Production)
    // =========================================================

    let executablePath = null;

    const resolveChromiumPath = async () => {
      // ---------------------------------------------------------
      // 1. Check env variable first (highest priority)
      // ---------------------------------------------------------
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
        try {
          await fs.access(envPath);
          // console.log("✅ Using env Chromium:", envPath);
          return envPath;
        } catch (e) {
          // console.warn("⚠️ Env path not accessible:", envPath);
        }
      }

      // ---------------------------------------------------------
      // 2. Windows — Check common Chrome/Edge locations
      // ---------------------------------------------------------
      if (process.platform === "win32") {
        const winPaths = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          path.join(
            os.homedir(),
            "AppData",
            "Local",
            "Google",
            "Chrome",
            "Application",
            "chrome.exe"
          ),
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ];

        for (const p of winPaths) {
          try {
            await fs.access(p);
            // console.log("✅ Windows Chrome/Edge found:", p);
            return p;
          } catch (e) {
            // Continue
          }
        }

        // Puppeteer cache on Windows
        const puppeteerCacheDir = path.join(
          os.homedir(),
          ".cache",
          "puppeteer",
          "chrome"
        );

        try {
          const versions = await fs.readdir(puppeteerCacheDir);
          for (const version of versions) {
            const chromePath = path.join(
              puppeteerCacheDir,
              version,
              "chrome-win64",
              "chrome.exe"
            );
            try {
              await fs.access(chromePath);
              // console.log("✅ Puppeteer cached Chrome (Win):", chromePath);
              return chromePath;
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          // Cache dir doesn't exist
        }
      }



      // 3. Linux — Try common locations

      if (process.platform === "linux") {
        const linuxPaths = [
          // Render paths
          "/opt/render/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome",
          "/opt/render/project/src/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome",

          // System paths
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/snap/bin/chromium",
        ];

        for (const p of linuxPaths) {
          try {
            await fs.access(p);
            // console.log("✅ Linux Chrome found:", p);
            return p;
          } catch (e) { }
        }

        // Dynamic Puppeteer cache scan
        const cacheDirs = [
          path.join(os.homedir(), ".cache", "puppeteer", "chrome"),
          "/opt/render/.cache/puppeteer/chrome",
          "/opt/render/project/src/.cache/puppeteer/chrome",
          "/root/.cache/puppeteer/chrome",
        ];

        for (const cacheDir of cacheDirs) {
          try {
            const versions = await fs.readdir(cacheDir);
            for (const version of versions) {
              const chromePath = path.join(
                cacheDir,
                version,
                "chrome-linux64",
                "chrome"
              );
              try {
                await fs.access(chromePath);
                // console.log("✅ Puppeteer cached Chrome:", chromePath);
                return chromePath;
              } catch (e) { }
            }
          } catch (e) { }
        }
      }

      // 4. Mac

      if (process.platform === "darwin") {
        const macPaths = [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ];

        for (const p of macPaths) {
          try {
            await fs.access(p);
            // console.log("✅ Mac Chrome found:", p);
            return p;
          } catch (e) {
            // Continue
          }
        }
      }

      // ---------------------------------------------------------
      // 5. Production (AWS Lambda / Render) — @sparticuz/chromium
      // ---------------------------------------------------------
      try {
        const sparticuzPath = await chromium.executablePath();
        if (sparticuzPath) {
          // console.log("✅ @sparticuz/chromium path:", sparticuzPath);
          return sparticuzPath;
        }
      } catch (e) {
        // console.warn("⚠️ @sparticuz/chromium not available:", e.message);
      }

      // ---------------------------------------------------------
      // 6. Fallback — undefined (Puppeteer default)
      // ---------------------------------------------------------
      // console.log("ℹ️ Using Puppeteer default browser");
      return undefined;
    };

    try {
      executablePath = await resolveChromiumPath();

      if (!executablePath) {
        throw new Error("No Chromium executable path found");
      }

      // Verify path exists
      await fs.access(executablePath);
      // console.log("✅ Final executable path:", executablePath);
    } catch (pathError) {
      // console.error("❌ Could not resolve Chromium executable path");
      // console.error("❌ Path error:", pathError?.message);
      throw new Error(
        `Could not resolve Chrome executable: ${pathError?.message || "Unknown error"}`
      );
    }

    // =========================================================
    // 6. VERIFY CHROME EXISTS
    // =========================================================

    // console.log("🔍 Checking Chromium executable...");

    try {
      await fs.access(executablePath);
      // console.log("✅ Chromium executable exists");
    } catch (chromeError) {
      // console.error("❌ Chromium executable NOT FOUND");
      // console.error("❌ Expected path:", executablePath);
      // console.error("❌ Chrome error:", chromeError?.message);
      throw new Error(
        `Chrome executable not found at: ${executablePath}. ` +
        `Make sure @sparticuz/chromium is installed during deployment.`
      );
    }

    // =========================================================
    // 7. LAUNCH PUPPETEER
    // =========================================================

    // console.log("🚀 Launching Puppeteer...");

    // ✅ Detect environment
    const isProduction = process.env.NODE_ENV === "production";
    const isWindows = process.platform === "win32";

    // ✅ Base args
    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-accelerated-2d-canvas",
      "--disable-features=TranslateUI",
    ];

    // ✅ Windows: single-process helpful
    if (isWindows) {
      launchArgs.push("--single-process");
    }

    // ✅ Production: use @sparticuz args
    if (isProduction && !isWindows) {
      launchArgs.push(...chromium.args);
    }

    // console.log("🚀 Launching Puppeteer...");
    // console.log("  Platform:", process.platform);
    // console.log("  Production:", isProduction);
    // console.log("  Executable:", executablePath);
    // console.log("  Args:", launchArgs.length);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    // console.log("✅ Puppeteer browser launched");

    // console.log("✅ Puppeteer browser launched successfully");
    // =========================================================
    // 8. CREATE PAGE
    // =========================================================

    // console.log("📄 Creating browser page...");

    const page = await browser.newPage();

// console.log("✅ Page created");

await page.setContent(html, {
  waitUntil: "networkidle0",
});

// console.log("✅ HTML loaded");

await page.evaluate(() => {
  document.fonts?.ready;
});

// console.log("✅ Fonts ready");

const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});

// console.log("✅ PDF generated");

await page.close();

// console.log("✅ Page closed");

await browser.close();

// console.log("✅ Browser closed");

return pdfBuffer;

  } catch (error) {

    // console.error("\n========================================");
    // console.error("❌ INVOICE PDF GENERATION FAILED");
    // console.error("========================================");

    // console.error(
    //   "❌ Error name:",
    //   error?.name
    // );

    // console.error(
    //   "❌ Error message:",
    //   error?.message
    // );

    // console.error(
    //   "❌ Error stack:",
    //   error?.stack
    // );

    // console.error(
    //   "❌ Invoice ID:",
    //   invoice?._id
    // );

    // console.error(
    //   "❌ Invoice Number:",
    //   invoice?.invoiceNumber
    // );

    // console.error("========================================\n");

    throw error;

  } finally {

    // =========================================================
    // 14. ALWAYS CLOSE BROWSER
    // =========================================================

    if (browser) {

      try {

        // console.log(
        //   "🧹 Closing Puppeteer browser..."
        // );

        await browser.close();

        // console.log(
        //   "✅ Puppeteer browser closed"
        // );

      } catch (closeError) {

        // console.warn(
        //   "⚠️ Puppeteer close warning:",
        //   closeError?.message
        // );

      }

    }

  }
};