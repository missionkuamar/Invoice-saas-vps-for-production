// frontend/src/components/invoices/forms/MinimalInvoiceForm.jsx
import { FaEye } from "react-icons/fa";
import React from 'react';
import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { FaSave } from "react-icons/fa";


const MinimalInvoiceForm = (props) => {
  const { 
    formData, setFormData, handleClientChange, 
    handleItemChange, addItem, removeItem, duplicateItem,
    calculateItemTotal, totals, taxOptions, 
    isSubmitting, handleSubmit, navigate 
  } = props;
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-light text-gray-800 tracking-wide">MINIMAL INVOICE</h2>
          <button className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <FaEye /> Preview
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Minimal client section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Client Name *</label>
              <input type="text" name="name" value={formData.client.name} onChange={handleClientChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400" 
                required />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
              <input type="email" name="email" value={formData.client.email} onChange={handleClientChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Phone</label>
              <input type="text" name="phone" value={formData.client.phone} onChange={handleClientChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Address</label>
              <input type="text" name="address" value={formData.client.address} onChange={handleClientChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>

          {/* Minimal items section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm uppercase tracking-wider text-gray-500">Items</h3>
              <button type="button" onClick={addItem} 
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 flex items-center gap-1">
                <FaPlus size={10} /> Add
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-16">Qty</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Total</th>
                    <th className="px-3 py-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const itemTotals = calculateItemTotal(item);
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-3 py-2">
                          <input type="text" value={item.description} 
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm" 
                            placeholder="Item" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 text-center text-sm" 
                            min="0.01" step="0.01" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={item.rate} 
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} 
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 text-center text-sm" 
                            min="0" step="0.01" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-sm">₹{itemTotals.total.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => removeItem(index)} 
                            className="text-gray-400 hover:text-red-500">
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Minimal summary */}
          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium border-t pt-1">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Minimal actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => navigate('/invoices')} 
              className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} 
              className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 flex items-center gap-2">
              {isSubmitting ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MinimalInvoiceForm;  