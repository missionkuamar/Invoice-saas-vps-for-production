import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
import mongoose from 'mongoose';
// @desc    Create invoice
// @route   POST /api/invoices
// controllers/invoiceController.js




/// ye wala  kaam ka hai 
// update wala hai ye 
export const createInvoice = async (req, res) => {
  try {
    const {
      client,
      items,
      dueDate,
      notes,
      terms,
      status,
      issueDate,
    } = req.body;

    // console.log(
    //   'Request body creating invoice:',
    //   client,
    //   items,
    //   dueDate,
    //   notes,
    //   terms,
    //   status
    // );

    // ============================================================
    // VALIDATION
    // ============================================================

    if (
      !client ||
      !client.name ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Client and at least one item are required',
      });
    }

    // ============================================================
    // USER FETCH
    // ============================================================

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // ============================================================
    // INVOICE CREDIT CHECK
    // ============================================================
    //
    // IMPORTANT:
    // canCreateInvoice() async hai.
    //

    const canCreate = await user.canCreateInvoice();

    if (!canCreate) {
      const invoiceLimit =
        user.subscription.limits.invoices.total;

      const invoiceUsed =
        user.subscription.usage.invoices;

      const remaining =
        Math.max(
          0,
          invoiceLimit - invoiceUsed
        );

      return res.status(403).json({
        success: false,

        message:
          `You’ve reached your invoice limit or your subscription has expired. You've used ${invoiceUsed} of ${invoiceLimit} invoices. Please upgrade your plan to continue.`,
        data: {
          plan:
            user.subscription.plan,

          limit:
            invoiceLimit,

          used:
            invoiceUsed,

          remaining,

          startDate:
            user.subscription.currentPeriodStart,

          endDate:
            user.subscription.currentPeriodEnd,
        },
      });
    }

    // ============================================================
    // CALCULATE AMOUNTS
    // ============================================================

    let subtotal = 0;
    let totalTax = 0;

    const itemsWithAmount = items.map((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      const taxRate = Number(item.taxRate) || 0;
      const discount = Number(item.discount) || 0;

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Invalid item quantity');
      }

      if (!Number.isFinite(rate) || rate < 0) {
        throw new Error('Invalid item rate');
      }

      if (!Number.isFinite(taxRate) || taxRate < 0) {
        throw new Error('Invalid tax rate');
      }

      const amount = quantity * rate;

      // Item discount
      const discountAmount = (amount * discount) / 100;

      const taxableAmount = amount - discountAmount;

      // Item tax
      const itemTax = (taxableAmount * taxRate) / 100;

      subtotal += amount;
      totalTax += itemTax;

      return {
        ...item,
        quantity,
        rate,
        amount,
        taxRate,
        discount,
        taxAmount: itemTax,
      };
    });

    const tax = totalTax;
    const total = subtotal - 0 + tax;

    // ============================================================
    // INVOICE NUMBER
    // ============================================================

    const invoiceNumber =
      await generateInvoiceNumber();

    // ============================================================
    // INVOICE DATA
    // ============================================================

    const invoiceData = {

      user:
        req.user._id,

      invoiceNumber,

      client,

      items:
        itemsWithAmount,

      subtotal,

      tax,

      total,

      dueDate:
        dueDate ||
        new Date(
          Date.now() +
          30 * 24 * 60 * 60 * 1000
        ),

      notes,

      terms,

      status:
        status || 'draft',
    };

    // ============================================================
    // ISSUE DATE
    // ============================================================

    if (issueDate) {
      invoiceData.issueDate =
        issueDate;
    }

    // ============================================================
    // CREATE INVOICE
    // ============================================================

    const invoice =
      await Invoice.create(
        invoiceData
      );

    // ============================================================
    // INCREMENT INVOICE USAGE
    // ============================================================
    //
    // IMPORTANT:
    //
    // Invoice delete hone par quota automatically
    // wapas nahi aayega.
    //
    // Example:
    //
    // 100 invoice limit
    // 50 create
    // 10 delete
    //
    // Usage = 50
    // Remaining = 50
    //
    // Delete se remaining 60 nahi hoga.
    //

    await user.incrementInvoiceCount();

    // ============================================================
    // RESPONSE
    // ============================================================

    // console.log("========== SUBSCRIPTION CHECK ==========");
    // console.log("Plan:", user.subscription.plan);
    // console.log("Status:", user.subscription.status);
    // console.log("Now:", new Date());
    // console.log("End Date:", user.subscription.endDate);
    // console.log("Period End:", user.subscription.currentPeriodEnd);
    // console.log("Can Create:", canCreate);
    // console.log("========================================");



    const remainingCredits =
      user.getRemainingCredits();

    return res.status(201).json({

      success: true,

      message:
        'Invoice created successfully',

      data:
        invoice,

      remainingCredits,

    });

  } catch (error) {

    // console.error(
    //   'Create Invoice Error:',
    //   error
    // );

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        'Failed to create invoice',

    });
  }
};

// ... rest of the controller functions remain the same
// @desc    Get all invoices with advanced filters and pagination
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      clientName,
      clientEmail,
      invoiceNumber,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ============================================================
    // BASE QUERY
    // ============================================================

    const query = {
      user: req.user._id,
    };

    // ============================================================
    // SEARCH
    // Invoice Number
    // Client Name
    // Client Email
    // ============================================================

    if (search?.trim()) {
      const searchValue = search.trim();

      query.$or = [
        {
          invoiceNumber: {
            $regex: searchValue,
            $options: 'i',
          },
        },
        {
          'client.name': {
            $regex: searchValue,
            $options: 'i',
          },
        },
        {
          'client.email': {
            $regex: searchValue,
            $options: 'i',
          },
        },
      ];
    }

    // ============================================================
    // INDIVIDUAL FILTERS
    // ============================================================

    if (invoiceNumber?.trim()) {
      query.invoiceNumber = {
        $regex: invoiceNumber.trim(),
        $options: 'i',
      };
    }

    if (clientName?.trim()) {
      query['client.name'] = {
        $regex: clientName.trim(),
        $options: 'i',
      };
    }

    if (clientEmail?.trim()) {
      query['client.email'] = {
        $regex: clientEmail.trim(),
        $options: 'i',
      };
    }

    // ============================================================
    // STATUS FILTER
    // ============================================================

    if (status) {
      query.status = status;
    }

    // ============================================================
    // DATE RANGE FILTER
    // ============================================================

    if (startDate || endDate) {
      query.issueDate = {};

      if (startDate) {
        const start = new Date(startDate);

        if (!isNaN(start.getTime())) {
          query.issueDate.$gte = start;
        }
      }

      if (endDate) {
        const end = new Date(endDate);

        if (!isNaN(end.getTime())) {
          // Include the complete end date
          end.setHours(23, 59, 59, 999);

          query.issueDate.$lte = end;
        }
      }

      // Remove empty object if dates were invalid
      if (Object.keys(query.issueDate).length === 0) {
        delete query.issueDate;
      }
    }

    // ============================================================
    // AMOUNT RANGE FILTER
    // ============================================================

    if (minAmount || maxAmount) {
      query.total = {};

      if (minAmount !== undefined && minAmount !== '') {
        const min = Number(minAmount);

        if (!isNaN(min)) {
          query.total.$gte = min;
        }
      }

      if (maxAmount !== undefined && maxAmount !== '') {
        const max = Number(maxAmount);

        if (!isNaN(max)) {
          query.total.$lte = max;
        }
      }

      // Remove empty object
      if (Object.keys(query.total).length === 0) {
        delete query.total;
      }
    }

    // ============================================================
    // PAGINATION
    // ============================================================

    const pageNum = Math.max(
      parseInt(page) || 1,
      1
    );

    const limitNum = Math.min(
      Math.max(parseInt(limit) || 10, 1),
      100
    );

    const skip = (pageNum - 1) * limitNum;

    // ============================================================
    // SORTING
    // ============================================================

    const allowedSortFields = [
      'createdAt',
      'issueDate',
      'dueDate',
      'total',
      'invoiceNumber',
      'status',
    ];

    const safeSortBy = allowedSortFields.includes(
      sortBy
    )
      ? sortBy
      : 'createdAt';

    const sort = {
      [safeSortBy]:
        sortOrder === 'asc' ? 1 : -1,
    };

    // ============================================================
    // DATABASE QUERIES
    // ============================================================

    const [
      invoices,
      total,
      revenueResult,
      clientsResult,
    ] = await Promise.all([
      // ============================================================
      // GET PAGINATED INVOICES
      // ============================================================

      Invoice.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),

      // ============================================================
      // TOTAL MATCHING INVOICES
      // ============================================================

      Invoice.countDocuments(query),

      // ============================================================
      // TOTAL REVENUE
      // ============================================================

      Invoice.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: '$total',
            },
          },
        },
      ]),

      // ============================================================
      // TOTAL UNIQUE CLIENTS
      // ============================================================

      Invoice.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: '$client.name',
          },
        },
        {
          $count: 'totalClients',
        },
      ]),
    ]);
    // ============================================================
    // TOTAL REVENUE
    // ============================================================

    const totalRevenue =
      revenueResult[0]?.totalRevenue || 0;

    const totalClients =
      clientsResult[0]?.totalClients || 0;
    // ============================================================
    // PAGINATION
    // ============================================================

    const totalPages =
      Math.ceil(total / limitNum);

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,

      data: {
        invoices,

        // Total invoices matching current filters
        invoiceCount: total,

        // Total revenue matching current filters
        totalRevenue,
        totalClients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,

          hasNextPage:
            pageNum < totalPages,

          hasPreviousPage:
            pageNum > 1,
        },

        filters: {
          search: search || '',
          status: status || '',
          clientName: clientName || '',
          clientEmail: clientEmail || '',
          invoiceNumber:
            invoiceNumber || '',
          startDate:
            startDate || '',
          endDate:
            endDate || '',
          minAmount:
            minAmount || '',
          maxAmount:
            maxAmount || '',
          sortBy: safeSortBy,
          sortOrder:
            sortOrder === 'asc'
              ? 'asc'
              : 'desc',
        },
      },
    });

  } catch (error) {

    // console.error(
    //   'Get invoices error:',
    //   error
    // );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to fetch invoices',
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // ============================================
    // VALIDATE INVOICE ID
    // ============================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // ============================================
    // FIND INVOICE
    // ============================================

    const invoice = await Invoice.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ============================================
    // PAID INVOICE CHECK
    // ============================================

    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a paid invoice",
      });
    }

    // ============================================
    // GET BODY
    // ============================================

    const {
      client,
      items,
      dueDate,
      notes,
      terms,
      status,
    } = req.body;

    // ============================================
    // UPDATE DATA OBJECT
    // ============================================

    const updateData = {};

    // ============================================
    // STATUS
    // ============================================

    if (status !== undefined) {
      updateData.status = status;
    }

    // ============================================
    // NOTES
    // ============================================

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // ============================================
    // TERMS
    // ============================================

    if (terms !== undefined) {
      updateData.terms = terms;
    }

    // ============================================
    // DUE DATE
    // ============================================

    if (dueDate !== undefined) {
      if (dueDate === "") {
        updateData.dueDate = null;
      } else {
        const parsedDate = new Date(dueDate);

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid due date",
          });
        }

        updateData.dueDate = parsedDate;
      }
    }

    // ============================================
    // CLIENT
    // ============================================

    if (client !== undefined) {
      if (
        !client ||
        typeof client !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid client data",
        });
      }

      updateData.client = {
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        gst: client.gst || "",
      };
    }

    // ============================================
    // ITEMS
    // ============================================

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Items must be an array",
        });
      }

      let subtotal = 0;

      const itemsWithAmount = items.map(
        (item, index) => {
          const quantity = Number(
            item?.quantity
          );

          const rate = Number(
            item?.rate
          );

          if (
            !Number.isFinite(quantity) ||
            !Number.isFinite(rate)
          ) {
            throw new Error(
              `Invalid quantity or rate at item ${index + 1}`
            );
          }

          if (quantity < 0 || rate < 0) {
            throw new Error(
              `Quantity and rate cannot be negative at item ${index + 1}`
            );
          }

          const amount =
            quantity * rate;

          subtotal += amount;

          return {
            ...item,
            quantity,
            rate,
            amount,
          };
        }
      );

      const tax =
        subtotal * 0.18;

      const total =
        subtotal + tax;

      updateData.items =
        itemsWithAmount;

      updateData.subtotal =
        Number(subtotal.toFixed(2));

      updateData.tax =
        Number(tax.toFixed(2));

      updateData.total =
        Number(total.toFixed(2));
    }

    // ============================================
    // UPDATE
    // ============================================

    const updatedInvoice =
      await Invoice.findOneAndUpdate(
        {
          _id: id,
          user: req.user._id,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ============================================
    // SUCCESS
    // ============================================

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });

  } catch (error) {
    // console.error(
    //   "❌ UPDATE INVOICE ERROR:",
    //   error
    // );

    return res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to update invoice",
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a paid invoice',
      });
    }

    await invoice.remove();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};