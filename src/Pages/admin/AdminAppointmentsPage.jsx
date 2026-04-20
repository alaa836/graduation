import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { translateAppointmentStatus } from '../../utils/i18nStatus';
import { Search, Calendar } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { ADMIN } from '../../api/endpoints';
import { getApiErrorMessage } from '../../utils/apiError';

const FILTER_VALUES = ['الكل', 'مؤكد', 'جاري', 'مكتمل', 'ملغي'];

const STATUS_STYLES = {
  مؤكد: 'bg-blue-100 text-blue-600',
  confirmed: 'bg-blue-100 text-blue-600',
  جاري: 'bg-green-100 text-green-600',
  inProgress: 'bg-green-100 text-green-600',
  مكتمل: 'bg-gray-100 text-gray-500',
  completed: 'bg-gray-100 text-gray-500',
  ملغي: 'bg-red-100 text-red-500',
  cancelled: 'bg-red-100 text-red-500',
  pending: 'bg-yellow-100 text-yellow-600',
};

function filterLabelKey(v) {
  if (v === 'الكل') return 'admin.appointments.statAll';
  if (v === 'مؤكد') return 'appointments.status.confirmed';
  if (v === 'جاري') return 'appointments.status.inProgress';
  if (v === 'مكتمل') return 'appointments.status.completed';
  return 'appointments.status.cancelled';
}

function StatusBadge({ status, t }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {translateAppointmentStatus(status, t)}
    </span>
  );
}

export default function AdminAppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ADMIN.APPOINTMENTS);
      const mapped = (res.data?.appointments || []).map((a) => ({
        id: a.id,
        patient: a.patient?.name || '-',
        doctor: a.doctor?.name || '-',
        specialty: '-',
        date: a.appointment_date || '-',
        time: a.appointment_time || '-',
        status: a.status || 'pending',
      }));
      setAppointments(mapped);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('authErrors.default')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const filtered = useMemo(() => appointments.filter((a) => {
    const matchSearch = a.patient.includes(search) || a.doctor.includes(search) || a.specialty.includes(search);
    const matchStatus = filterStatus === 'الكل' || a.status === filterStatus || (filterStatus === 'مؤكد' && a.status === 'confirmed') || (filterStatus === 'جاري' && a.status === 'inProgress') || (filterStatus === 'مكتمل' && a.status === 'completed') || (filterStatus === 'ملغي' && a.status === 'cancelled');
    return matchSearch && matchStatus;
  }), [appointments, search, filterStatus]);

  const handleCancel = async (id) => {
    try {
      await axiosInstance.patch(ADMIN.APPOINTMENTS + `/${id}`, { status: 'cancelled' });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)));
      toast.warning(t('admin.appointments.cancelledToast'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('authErrors.default')));
    }
  };

  const stats = [
    { label: t('admin.appointments.statAll'), value: appointments.length, color: 'text-gray-600' },
    { label: t('appointments.status.confirmed'), value: appointments.filter((a) => a.status === 'confirmed' || a.status === 'مؤكد').length, color: 'text-blue-600' },
    { label: t('appointments.status.inProgress'), value: appointments.filter((a) => a.status === 'inProgress' || a.status === 'جاري').length, color: 'text-green-600' },
    { label: t('appointments.status.completed'), value: appointments.filter((a) => a.status === 'completed' || a.status === 'مكتمل').length, color: 'text-gray-500' },
    { label: t('appointments.status.cancelled'), value: appointments.filter((a) => a.status === 'cancelled' || a.status === 'ملغي').length, color: 'text-red-500' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <div className="text-start">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-800">{t('admin.appointments.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{loading ? t('common.loading') : t('admin.appointments.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card-hover bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm flex items-center justify-between gap-2">
            <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
            <span className="text-xs text-gray-400 font-semibold text-start">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
          {FILTER_VALUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-800 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/70'
              }`}
            >
              {t(filterLabelKey(s))}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.appointments.searchPh')}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pe-10 text-sm text-start placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          />
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card-hover-panel bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-6 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 text-center">
          <span>{t('admin.appointments.colAction')}</span>
          <span>{t('admin.appointments.colStatus')}</span>
          <span>{t('admin.appointments.colTimeDate')}</span>
          <span>{t('admin.appointments.colSpec')}</span>
          <span>{t('admin.appointments.colDoctor')}</span>
          <span className="text-start">{t('admin.appointments.colPatient')}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar size={32} className="mx-auto mb-3 text-gray-300" />
              <p>{t('admin.appointments.empty')}</p>
            </div>
          ) : (
            filtered.map((apt) => (
              <div key={apt.id} className="px-4 md:px-5 py-4">
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={apt.status} t={t} />
                    <div className="text-start min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{apt.patient}</p>
                      <p className="text-xs text-gray-400">
                        {apt.doctor} - {apt.date}
                      </p>
                    </div>
                  </div>
                  {(apt.status === 'مؤكد' || apt.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => handleCancel(apt.id)}
                      className="w-full border border-red-200 text-red-500 text-xs font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      {t('admin.appointments.cancelMobile')}
                    </button>
                  )}
                </div>
                <div className="hidden md:grid grid-cols-6 gap-3 items-center text-center">
                  <div className="flex justify-center">
                    {(apt.status === 'مؤكد' || apt.status === 'confirmed') ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(apt.id)}
                        className="text-xs font-semibold border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {t('admin.appointments.cancelShort')}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <StatusBadge status={apt.status} t={t} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{apt.time}</p>
                    <p className="text-xs text-gray-400">{apt.date}</p>
                  </div>
                  <span className="text-xs text-gray-500">{apt.specialty}</span>
                  <span className="text-sm text-gray-700">{apt.doctor}</span>
                  <span className="text-sm font-semibold text-gray-800 text-start">{apt.patient}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
