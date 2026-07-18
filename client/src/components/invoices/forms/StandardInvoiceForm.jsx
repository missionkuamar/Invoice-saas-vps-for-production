// frontend/src/components/invoices/forms/StandardInvoiceForm.jsx
import React from 'react';
import FormHeader from './shared/FormHeader';
import ClientSection from './shared/ClientSection';
import ItemsSection from './shared/ItemsSection';
import SummarySection from './shared/SummarySection';
import FormActions from './shared/FormActions';

const StandardInvoiceForm = (props) => {
  const { 
    formConfig, 
    formData,
    setFormData,
    handleSubmit, 
    navigate, 
    isSubmitting, 
    totals,
    handleClientChange,
    handleItemChange,
    addItem,
    removeItem,
    duplicateItem,
    calculateItemTotal,
    taxOptions,
  } = props;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <FormHeader 
          title={formConfig?.title}
          description={formConfig?.description}
          accentColor={formConfig?.accentColor}
          onPreview={() => {}}
        />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <ClientSection 
            formData={formData}
            setFormData={setFormData}
            handleClientChange={handleClientChange}
            columns={2}
            iconStyle={false}
            accentColor={formConfig?.accentColor}
          />
          <ItemsSection 
            formData={formData}
            handleItemChange={handleItemChange}
            addItem={addItem}
            removeItem={removeItem}
            duplicateItem={duplicateItem}
            calculateItemTotal={calculateItemTotal}
            taxOptions={taxOptions}
            accentColor={formConfig?.accentColor}
          />
          <SummarySection 
            totals={totals} 
            accentColor={formConfig?.accentColor}
            gradient={false}
          />
          <FormActions 
            onCancel={() => navigate('/invoices')}
            isSubmitting={isSubmitting}
            accentColor={formConfig?.accentColor}
            gradient={false}
          />
        </form>
      </div>
    </div>
  );
};

export default StandardInvoiceForm;