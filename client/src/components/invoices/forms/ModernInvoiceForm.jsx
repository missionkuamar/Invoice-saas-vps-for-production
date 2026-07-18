// frontend/src/components/invoices/forms/ModernInvoiceForm.jsx
import React from 'react';
import FormHeader from './shared/FormHeader';
import ClientSection from './shared/ClientSection';
import ItemsSection from './shared/ItemsSection';
import SummarySection from './shared/SummarySection';
import FormActions from './shared/FormActions';

const ModernInvoiceForm = (props) => {
  const { formConfig, handleSubmit, navigate, isSubmitting, totals } = props;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className={`bg-gradient-to-r ${formConfig.gradient} rounded-xl p-6 shadow-xl`}>
        <FormHeader 
          title={formConfig.title}
          description={formConfig.description}
          accentColor={formConfig.accentColor}
          onPreview={() => {}}
          lightText
        />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <ClientSection {...props} columns={2} iconStyle />
        <ItemsSection {...props} accentColor="purple" />
        <SummarySection totals={totals} accentColor="purple" gradient />
        <FormActions 
          onCancel={() => navigate('/invoices')}
          isSubmitting={isSubmitting}
          accentColor="purple"
          gradient
        />
      </form>
    </div>
  );
};

export default ModernInvoiceForm;