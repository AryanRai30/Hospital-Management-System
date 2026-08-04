import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken') || null;
};

const storedUser = getStoredUser();
const storedToken = getStoredToken();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedUser && storedToken),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      localStorage.setItem('accessToken', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }
});

export const { setCredentials, updateUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
