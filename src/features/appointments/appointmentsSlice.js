import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { APPOINTMENTS } from '../../api/endpoints';
import { getApiErrorMessage } from '../../utils/apiError';

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(APPOINTMENTS.LIST);
      const data = res.data;
      if (Array.isArray(data)) {
        return {
          upcoming: data.filter((a) => a.status !== 'completed' && a.status !== 'cancelled'),
          previous: data.filter((a) => a.status === 'completed' || a.status === 'cancelled'),
        };
      }
      return {
        upcoming: data.upcoming || [],
        previous: data.previous || [],
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'تعذر جلب المواعيد حاليًا'));
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancel',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(APPOINTMENTS.BY_ID(id));
      return id;
    } catch (err) {
      // In mock/offline mode, still resolve locally.
      if (!err.response) return id;
      return rejectWithValue(getApiErrorMessage(err, 'خطأ في إلغاء الموعد'));
    }
  }
);

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: {
    upcoming: [],
    previous: [],
    loading: false,
    error: null,
    usingMock: false,
    infoMessage: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearInfo: (state) => {
      state.infoMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.upcoming = action.payload.upcoming || [];
        state.previous = action.payload.previous || [];
        state.usingMock = false;
        state.infoMessage = null;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'تعذر جلب المواعيد حاليًا';
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.upcoming = state.upcoming.filter((a) => a.id !== action.payload);
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearInfo } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;