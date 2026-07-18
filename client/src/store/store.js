import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import invoiceReducer from './slices/invoiceSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import withdrawalReducer from './slices/withdrawalSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    invoices: invoiceReducer,
     withdrawals: withdrawalReducer,
    subscription: subscriptionReducer,
  },
});

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;