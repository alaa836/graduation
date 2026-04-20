import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { INVOICES } from '../../api/endpoints';
import { getApiErrorMessage } from '../../utils/apiError';

const MOCK_INVOICES = [
  { id: 1, invoiceNum: '#INV-9920', date: '12 أكتوبر 2023', doctor: 'د. محمود علي', service: 'كشف دوري', amount: 450, paymentMethod: 'Visa (1234****)', status: 'تم الدفع' },
  { id: 2, invoiceNum: '#INV-9851', date: '25 سبتمبر 2023', doctor: 'د. محمد جمال', service: 'كشف باطنة', amount: 1200, paymentMethod: 'فودافون كاش', status: 'تم الدفع' },
  { id: 3, invoiceNum: '#INV-9742', date: '10 سبتمبر 2023', doctor: 'عيادة الأسنان', service: 'تنظيف وتلميع', amount: 750, paymentMethod: '---', status: 'لم يتم الدفع' },
  { id: 4, invoiceNum: '#INV-9610', date: '05 أغسطس 2023', doctor: 'د. سارة أحمد', service: 'استشارة جلدية', amount: 300, paymentMethod: 'نقداً', status: 'تم الدفع' },
];

function buildSummary(invoices) {
  return {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === 'لم يتم الدفع' || i.status === 'pending').reduce((s, i) => s + Number(i.amount || 0), 0),
    paid: invoices.filter((i) => i.status === 'تم الدفع' || i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0),
  };
}

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async () => {
    try {
      const res = await axiosInstance.get(INVOICES.LIST);
      const data = res.data;
      const invoices = Array.isArray(data) ? data : (data.invoices || []);
      return {
        invoices,
        summary: data.summary || buildSummary(invoices),
        usingMock: false,
      };
    } catch (err) {
      // Fallback for demo/offline backend.
      return {
        invoices: MOCK_INVOICES,
        summary: buildSummary(MOCK_INVOICES),
        usingMock: true,
        fallbackReason: getApiErrorMessage(err, 'تعذر الاتصال بالخادم - تم عرض بيانات تجريبية'),
      };
    }
  }
);

export const payInvoice = createAsyncThunk(
  'invoices/pay',
  async ({ invoiceId, paymentMethod, cardData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(INVOICES.PAY(invoiceId), {
        paymentMethod,
        cardData,
      });
      return { invoiceId, ...res.data };
    } catch (err) {
      // In mock/offline mode, allow local success.
      if (!err.response) return { invoiceId };
      return rejectWithValue(getApiErrorMessage(err, 'خطأ في عملية الدفع'));
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    summary: {
      total: 0,
      pending: 0,
      paid: 0,
    },
    loading: false,
    payLoading: false,
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
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices || [];
        state.summary = action.payload.summary || state.summary;
        state.usingMock = Boolean(action.payload.usingMock);
        state.infoMessage = action.payload.usingMock ? 'demoDataNotice' : null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(payInvoice.pending, (state) => {
        state.payLoading = true;
      })
      .addCase(payInvoice.fulfilled, (state, action) => {
        state.payLoading = false;
        const idx = state.invoices.findIndex((i) => i.id === action.payload.invoiceId);
        if (idx !== -1) {
          state.invoices[idx].status = 'تم الدفع';
          state.invoices[idx].paymentMethod = state.invoices[idx].paymentMethod === '---'
            ? 'تم الدفع'
            : state.invoices[idx].paymentMethod;
        }
        state.summary = buildSummary(state.invoices);
      })
      .addCase(payInvoice.rejected, (state, action) => {
        state.payLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearInfo } = invoicesSlice.actions;
export default invoicesSlice.reducer;