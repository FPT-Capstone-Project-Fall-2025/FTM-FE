import authService from '@/services/authService';
import type { AuthState, LoginProps, RegisterProps, ResetPassword } from '@/types/auth';
import type { User } from '@/types/user';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isGGLogin:false,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (data: LoginProps, { rejectWithValue }) => {
    try {
      return await authService.login(data);
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Login failed');
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      return await authService.loginWithGoogle(token);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Google login failed'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (data: RegisterProps, { rejectWithValue }) => {
    try {
      return await authService.register(data);
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Registration failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgot-password',
  async (data: string, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(data);
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Sending email failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/reset-password',
  async (data: ResetPassword, { rejectWithValue }) => {
    try {
      return await authService.resetPassword(data);
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Reset password failed');
    }
  }
);

export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      if(!auth.token) {
        return rejectWithValue('No refresh token available');
      }
      if (!auth.refreshToken) {
        return rejectWithValue('No refresh token available');
      }
      const response = await authService.refreshToken({accessToken: auth.token, refreshToken: auth.refreshToken})
      console.log(response);
      
      // if (response.error) {
      //     return rejectWithValue(response.error)
      // }
      // return response
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.data?.accessToken;
        state.refreshToken = action.payload.data?.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log(action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Google Login
    builder
      .addCase(googleLogin.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        // state.user = action.payload.user;
        state.isGGLogin = true;
        state.token = action.payload.data?.accessToken;
        state.refreshToken = action.payload.data?.refreshToken;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // state.user = action.payload.user
        state.token = action.payload.data?.accessToken;
        state.refreshToken = action.payload.data?.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

      // Forgot password
    builder
      .addCase(forgotPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Refresh Token
    // builder
    //     .addCase(refreshUserToken.fulfilled, (state, action) => {
    //         state.token = action.payload.token
    //         state.refreshToken = action.payload.refreshToken
    //     })
    //     .addCase(refreshUserToken.rejected, (state) => {
    //         // Token refresh failed, logout user
    //         state.user = null
    //         state.token = null
    //         state.refreshToken = null
    //         state.isAuthenticated = false
    //     })
  },
});

export const { logout, clearError, updateUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
