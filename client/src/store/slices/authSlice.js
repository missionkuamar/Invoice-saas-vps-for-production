// frontend/src/store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ============================================================
// GOOGLE LOGIN
// ============================================================

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',

  async (credentialResponse, { rejectWithValue }) => {
    try {
      // console.log('==============================================');
      // console.log('🚀 loginWithGoogle START');
      // console.log('==============================================');

      // ========================================================
      // STEP 1: GOOGLE CREDENTIAL
      // ========================================================

      // console.log(
      //   '📍 Current URL:',
      //   window.location.href
      // );

      // console.log(
      //   '📍 Credential received?',
      //   !!credentialResponse?.credential
      // );

      // console.log(
      //   '📍 Credential length:',
      //   credentialResponse?.credential?.length || 0
      // );

      // console.log(
      //   '📍 Credential preview:',
      //   credentialResponse?.credential
      //     ? `${credentialResponse.credential.substring(0, 30)}...`
      //     : '(none)'
      // );

      if (!credentialResponse?.credential) {
        console.error('❌ Google credential missing');

        return rejectWithValue(
          'Google credential is missing'
        );
      }

      const { credential } = credentialResponse;

      // ========================================================
      // STEP 2: READ AFFILIATE REF
      // ========================================================

      // console.log('==============================================');
      // console.log('💾 AFFILIATE REF CHECK');
      // console.log('==============================================');

      const affiliateRef =
        localStorage.getItem('affiliateRef') || '';

      // console.log(
      //   '💾 affiliateRef:',
      //   affiliateRef || '(EMPTY)'
      // );

      // console.log(
      //   '💾 affiliateRef exists:',
      //   !!affiliateRef
      // );

      // console.log(
      //   '💾 affiliateRef length:',
      //   affiliateRef.length
      // );

      // console.log(
      //   '💾 All localStorage keys:',
      //   Object.keys(localStorage)
      // );

      // ========================================================
      // STEP 3: DEBUG REF
      // ========================================================

      if (affiliateRef) {
        console.error(
          '✅ AFFILIATE REF FOUND:',
          affiliateRef
        );
      } else {
        console.warn(
          '⚠️ AFFILIATE REF IS EMPTY'
        );

        console.warn(
          '⚠️ Google login will continue without affiliate ref'
        );
      }

      // ========================================================
      // STEP 4: PREPARE API PAYLOAD
      // ========================================================

      const requestPayload = {
        credential,
        ref: affiliateRef,
      };

      // console.log('==============================================');
      // console.log('📤 GOOGLE LOGIN API REQUEST');
      // console.log('==============================================');

      // console.log(
      //   '📤 URL:',
      //   '/auth/google'
      // );

      // console.log(
      //   '📤 Method:',
      //   'POST'
      // );

      // console.log(
      //   '📤 Ref being sent:',
      //   affiliateRef || '(EMPTY)'
      // );

      // console.log(
      //   '📤 Payload:',
      //   {
      //     credential:
      //       credential.substring(0, 30) + '...',
      //     ref: affiliateRef || '(EMPTY)',
      //   }
      // );

      // ========================================================
      // STEP 5: SEND REQUEST
      // ========================================================

      const response = await api.post(
        '/auth/google',
        requestPayload,
        {
          withCredentials: true,
        }
      );

      // ========================================================
      // STEP 6: API RESPONSE
      // ========================================================

      // console.log('==============================================');
      // console.log('📥 GOOGLE LOGIN API RESPONSE');
      // console.log('==============================================');

      // console.log(
      //   '📥 Status:',
      //   response.status
      // );

      // console.log(
      //   '📥 Success:',
      //   response.data?.success
      // );

      // console.log(
      //   '📥 Message:',
      //   response.data?.message
      // );

      // console.log(
      //   '📥 User data:',
      //   response.data?.data
      // );

      // console.log(
      //   '📥 User:',
      //   {
      //     id: response.data?.data?._id,
      //     name: response.data?.data?.name,
      //     email: response.data?.data?.email,
      //     username: response.data?.data?.username,
      //   }
      // );

      // ========================================================
      // STEP 7: EXTRACT DATA
      // ========================================================

      const { data } = response.data || {};

      if (!data) {
        console.error(
          '❌ No data received from Google login'
        );

        return rejectWithValue(
          'Invalid response from server'
        );
      }

      if (!data.token) {
        console.error(
          '❌ Token missing from Google login response'
        );

        return rejectWithValue(
          'Authentication token missing'
        );
      }

      // ========================================================
      // STEP 8: SAVE AUTH DATA
      // ========================================================

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      );

      // Set Authorization header immediately
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${data.token}`;

      // console.log('==============================================');
      // console.log('💾 AUTH DATA SAVED');
      // console.log('==============================================');

      // console.log(
      //   '💾 Token saved:',
      //   !!localStorage.getItem('token')
      // );

      // console.log(
      //   '💾 User saved:',
      //   !!localStorage.getItem('user')
      // );

      // console.log(
      //   '💾 Affiliate ref BEFORE cleanup:',
      //   localStorage.getItem('affiliateRef')
      // );

      // ========================================================
      // STEP 9: AFFILIATE REF CLEANUP
      // ========================================================
      //
      // IMPORTANT:
      // Ref ko API successfully complete hone ke BAAD hi remove
      // karna hai.
      //
      // Agar API fail hoti hai to catch me jayega aur ref
      // localStorage me safe rahega.
      // ========================================================

      if (affiliateRef) {
        // console.log('==============================================');
        // console.log('🧹 AFFILIATE REF CLEANUP');
        // console.log('==============================================');

        // console.log(
        //   '🧹 Removing affiliateRef:',
        //   affiliateRef
        // );

        localStorage.removeItem(
          'affiliateRef'
        );

        // console.log(
        //   '🧹 affiliateRef after removal:',
        //   localStorage.getItem('affiliateRef')
        // );
      }

      // ========================================================
      // STEP 10: SUCCESS TOAST
      // ========================================================

      if (
        response.data?.message ===
        'Registration successful'
      ) {
        toast.success(
          `Welcome ${data.name}! Account created successfully.`
        );
      } else {
        toast.success(
          `Welcome back ${data.name}!`
        );
      }

      // console.log('==============================================');
      // console.log('✅ loginWithGoogle SUCCESS');
      // console.log('==============================================');

      return data;

    } catch (error) {
      // ========================================================
      // ERROR HANDLING
      // ========================================================

      // console.log('==============================================');
      // console.log('❌ loginWithGoogle FAILED');
      // console.log('==============================================');

      console.error(
        '❌ Error:',
        error
      );

      console.error(
        '❌ Error message:',
        error?.message
      );

      console.error(
        '❌ Error response:',
        error?.response
      );

      console.error(
        '❌ Error status:',
        error?.response?.status
      );

      console.error(
        '❌ Error data:',
        error?.response?.data
      );

      console.error(
        '❌ Error URL:',
        error?.config?.url
      );

      console.error(
        '❌ Error method:',
        error?.config?.method
      );

      console.error(
        '❌ Request payload:',
        error?.config?.data
      );

      // IMPORTANT:
      // affiliateRef ko yahan remove nahi karna.
      // Agar login fail hua to next attempt me ref available rahega.

      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';

      toast.error(errorMsg);

      return rejectWithValue(
        errorMsg
      );
    }
  }
);

// ============================================================
// NORMAL LOGIN
// ============================================================

export const login = createAsyncThunk(
  'auth/login',

  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(
        '/auth/login',
        credentials,
        {
          withCredentials: true,
        }
      );

      const { data } = response.data;

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      );

      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${data.token}`;

      return data;

    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        'Login failed'
      );
    }
  }
);

// ============================================================
// REGISTER
// ============================================================

export const register = createAsyncThunk(
  'auth/register',

  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        '/auth/register',
        {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          ref: userData.ref || '',
        },
        {
          withCredentials: true,
        }
      );

      const { data } = response.data;

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      );

      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${data.token}`;

      return data;

    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        'Registration failed'
      );
    }
  }
);

// ============================================================
// GET PROFILE
// ============================================================

export const getProfile = createAsyncThunk(
  'auth/profile',

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        '/auth/profile',
        {
          withCredentials: true,
        }
      );

      return response.data.data;

    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        'Failed to get profile'
      );
    }
  }
);

// ============================================================
// UPDATE PROFILE
// ============================================================

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',

  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(
        '/auth/profile',
        data,
        {
          withCredentials: true,
        }
      );

      return response.data.data;

    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        'Failed to update profile'
      );
    }
  }
);

// ============================================================
// CHECK AUTH
// ============================================================

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',

  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem('token');

      if (!token) {
        return rejectWithValue(
          'No token found'
        );
      }

      // Set token in axios headers
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;

      const response = await api.get(
        '/auth/profile',
        {
          withCredentials: true,
        }
      );

      const userData =
        response.data.data;

      // Update localStorage
      localStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      return userData;

    } catch (error) {
      // Clear invalid token
      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );

      delete api.defaults.headers.common[
        'Authorization'
      ];

      return rejectWithValue(
        error?.response?.data?.message ||
        'Auth check failed'
      );
    }
  }
);

// ============================================================
// INITIAL STATE
// ============================================================

let storedUser = null;

try {
  const savedUser =
    localStorage.getItem('user');

  storedUser = savedUser
    ? JSON.parse(savedUser)
    : null;
} catch (error) {
  console.error(
    '❌ Failed to parse stored user:',
    error
  );

  localStorage.removeItem('user');
}

const storedToken =
  localStorage.getItem('token') || null;

const initialState = {
  user: storedUser,
  token: storedToken,
  loading: false,
  error: null,
  isAuthenticated: !!storedToken,
};

// ============================================================
// AUTH SLICE
// ============================================================

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {

    // ========================================================
    // LOGOUT
    // ========================================================

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );

      delete api.defaults.headers.common[
        'Authorization'
      ];
    },

    // ========================================================
    // CLEAR ERROR
    // ========================================================

    clearError: (state) => {
      state.error = null;
    },

    // ========================================================
    // SET CREDENTIALS
    // ========================================================

    setCredentials: (
      state,
      action
    ) => {
      const {
        user,
        token,
      } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;

      localStorage.setItem(
        'token',
        token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );

      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;
    },
  },

  // ==========================================================
  // EXTRA REDUCERS
  // ==========================================================

  extraReducers: (builder) => {

    // ========================================================
    // GOOGLE LOGIN
    // ========================================================

    builder

      .addCase(
        loginWithGoogle.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        loginWithGoogle.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user =
            action.payload;

          state.token =
            action.payload.token;

          state.isAuthenticated =
            true;

          state.error = null;

          api.defaults.headers.common[
            'Authorization'
          ] =
            `Bearer ${action.payload.token}`;
        }
      )

      .addCase(
        loginWithGoogle.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload;

          state.isAuthenticated =
            false;
        }
      )

      // ======================================================
      // NORMAL LOGIN
      // ======================================================

      .addCase(
        login.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        login.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user =
            action.payload;

          state.token =
            action.payload.token;

          state.isAuthenticated =
            true;

          state.error = null;

          api.defaults.headers.common[
            'Authorization'
          ] =
            `Bearer ${action.payload.token}`;
        }
      )

      .addCase(
        login.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload;

          state.isAuthenticated =
            false;
        }
      )

      // ======================================================
      // REGISTER
      // ======================================================

      .addCase(
        register.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        register.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user =
            action.payload;

          state.token =
            action.payload.token;

          state.isAuthenticated =
            true;

          state.error = null;

          api.defaults.headers.common[
            'Authorization'
          ] =
            `Bearer ${action.payload.token}`;
        }
      )

      .addCase(
        register.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload;

          state.isAuthenticated =
            false;
        }
      )

      // ======================================================
      // CHECK AUTH
      // ======================================================

      .addCase(
        checkAuth.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        checkAuth.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user =
            action.payload;

          state.isAuthenticated =
            true;

          state.error = null;
        }
      )

      .addCase(
        checkAuth.rejected,
        (state, action) => {
          state.loading = false;

          state.user = null;
          state.token = null;

          state.isAuthenticated =
            false;

          state.error =
            action.payload;

          localStorage.removeItem(
            'token'
          );

          localStorage.removeItem(
            'user'
          );

          delete api.defaults.headers.common[
            'Authorization'
          ];
        }
      )

      // ======================================================
      // GET PROFILE
      // ======================================================

      .addCase(
        getProfile.pending,
        (state) => {
          state.loading = true;
        }
      )

      .addCase(
        getProfile.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user = {
            ...state.user,
            ...action.payload,
          };

          localStorage.setItem(
            'user',
            JSON.stringify(state.user)
          );

          state.isAuthenticated =
            true;
        }
      )

      .addCase(
        getProfile.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload;
        }
      )

      // ======================================================
      // UPDATE PROFILE
      // ======================================================

      .addCase(
        updateProfile.pending,
        (state) => {
          state.loading = true;
        }
      )

      .addCase(
        updateProfile.fulfilled,
        (state, action) => {
          state.loading = false;

          state.user = {
            ...state.user,
            ...action.payload,
          };

          localStorage.setItem(
            'user',
            JSON.stringify(state.user)
          );
        }
      )

      .addCase(
        updateProfile.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload;
        }
      );
  },
});

// ============================================================
// EXPORT ACTIONS
// ============================================================

export const {
  logout,
  clearError,
  setCredentials,
} = authSlice.actions;

// ============================================================
// EXPORT REDUCER
// ============================================================

export default authSlice.reducer;