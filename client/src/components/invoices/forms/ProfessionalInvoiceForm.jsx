// frontend/src/components/invoices/forms/ProfessionalInvoiceForm.jsx
import React from 'react';
import { FaEye } from "react-icons/fa";

import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { FaSave } from "react-icons/fa";


const ProfessionalInvoiceForm = (props) => {
  const { 
    formData, setFormData, handleClientChange, 
    handleItemChange, addItem, removeItem, duplicateItem,
    calculateItemTotal, totals, taxOptions, 
    isSubmitting, handleSubmit, navigate 
  } = props;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">PROFESSIONAL</h2>
            <p className="text-blue-200 text-sm mt-1">Corporate invoice template</p>
          </div>
          <button className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm">
            <FaEye /> Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
        {/* Professional layout with 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h4>
            <div className="space-y-3">
              <input type="text" name="name" value={formData.client.name} onChange={handleClientChange} 
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium" 
                placeholder="Client Name *" required />
              <input type="email" name="email" value={formData.client.email} onChange={handleClientChange} 
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Email" />
              <input type="text" name="phone" value={formData.client.phone} onChange={handleClientChange} 
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Phone" />
              <textarea name="address" value={formData.client.address} onChange={handleClientChange} 
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows="2" placeholder="Address" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invoice Details</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Issue Date</label>
                <input type="date" value={formData.issueDate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))} 
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Due Date</label>
                <input type="date" value={formData.dueDate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} 
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">GST</label>
                <input type="text" name="gst" value={formData.client.gst} onChange={handleClientChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="GSTIN" />
              </div>
            </div>
          </div>
        </div>

        {/* Professional items section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Line Items</h3>
            <button type="button" onClick={addItem} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <FaPlus /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-blue-900">Description</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-blue-900 w-20">Qty</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-blue-900 w-28">Rate</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-blue-900 w-24">Disc%</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-blue-900 w-24">Tax%</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-blue-900 w-28">Total</th>
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
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Item" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" 
                          min="0.01" step="0.01" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.rate} 
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} 
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" 
                          min="0" step="0.01" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.discount} 
                          onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)} 
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" 
                          min="0" max="100" step="0.5" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={item.taxRate} 
                          onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))} 
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center">
                          {taxOptions.map((tax, index) => (
                            <option key={index} value={tax.rate}>{tax.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700">₹{itemTotals.total.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeItem(index)} 
                          className="text-gray-400 hover:text-red-500">
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Professional summary */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Tax</span>
                <span className="text-blue-600">+₹{totals.totalTax.toFixed(2)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between py-1 text-green-600">
                  <span>Discount</span>
                  <span>-₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-blue-200">
                <span className="text-lg font-bold text-gray-800">Grand Total</span>
                <span className="text-lg font-bold text-blue-700">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional actions */}
        <div className="flex justify-end gap-4 border-t pt-6">
          <button type="button" onClick={() => navigate('/invoices')} 
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg">
            {isSubmitting ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Invoice</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalInvoiceForm;