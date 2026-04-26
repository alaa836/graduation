import { createElement, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { translateAppointmentStatus } from '../../utils/i18nStatus';
import { Users, Calendar, FileText, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { DOCTOR, DOCTOR_API } from '../../api/endpoints';
import { getApiErrorMessage } from '../../utils/apiError';

const todayAppointments = [
  { id: 1, name: 'سارة محمود', time: '09:30 - 10:00', type: 'استشارة طبية', status: 'مؤكد', done: false },
  { id: 2, name: 'عمر خالد', time: '10:15 - 10:45', type: 'متابعة دورية', status: 'قيد الانتظار', done: false },
  { id: 3, name: 'ليلى حسن', time: '11:00 - 11:30', type: 'استشارة طبية', status: 'مكتمل', done: true },
];

export default function DoctorHome() {
  const { user } = useSelector((s) => s.auth);
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [appointments, setAppointments] = useState(todayAppointments);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [patientsCount, setPatientsCount] = useState(Number(t('doctor.home.statsValPatients')) || 0);
  const [reportsCount, setReportsCount] = useState(Number(t('doctor.home.statsValFiles')) || 0);
  const isEn = i18n.language?.startsWith('en');
  const Chevron = isEn ? ChevronRight : ChevronLeft;

  const nextAppointment = useMemo(
    () => ({
      name: t('doctor.home.mockNext.name'),
      age: t('doctor.home.mockNext.age'),
      date: t('doctor.home.mockNext.date'),
      time: t('doctor.home.mockNext.time'),
      type: t('doctor.home.mockNext.type'),
      location: t('doctor.home.mockNext.location'),
      img: 'https://randomuser.me/api/portraits/men/32.jpg',
    }),
    [t]
  );

  const activityItems = useMemo(() => t('doctor.home.activity', { returnObjects: true }) || [], [t]);

  const stats = useMemo(
    () => [
      {
        label: t('doctor.home.stats.patientsToday'),
        value: patientsCount,
        sub: t('doctor.home.stats.patientWord'),
        icon: Users,
        color: 'bg-blue-50 text-blue-600',
      },
      {
        label: t('doctor.home.stats.apptsToday'),
        value: t('doctor.home.statsValAppts'),
        sub: t('doctor.home.stats.apptWord'),
        icon: Calendar,
        color: 'bg-green-50 text-green-600',
      },
      {
        label: t('doctor.home.stats.openFiles'),
        value: reportsCount,
        sub: t('doctor.home.stats.filesWord'),
        icon: FileText,
        color: 'bg-orange-50 text-orange-500',
      },
      {
        label: t('doctor.home.stats.next'),
        value: t('doctor.home.statsValNextTime'),
        sub: t('doctor.home.stats.morning'),
        icon: Clock,
        color: 'bg-purple-50 text-purple-600',
      },
    ],
    [t, patientsCount, reportsCount]
  );

  const completedCount = appointments.filter((a) => a.done).length;
  const totalCount = appointments.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const loadDoctorDashboard = async () => {
    setLoading(true);
    try {
      const [scheduleRes, patientsRes, reportsRes] = await Promise.all([
        axiosInstance.get(DOCTOR.SCHEDULE),
        axiosInstance.get(DOCTOR_API.PATIENTS),
        axiosInstance.get(DOCTOR_API.REPORTS),
      ]);

      const normalized = (scheduleRes.data?.schedules || []).map((item) => ({
        id: item.id,
        name: item.patient?.name || t('doctor.home.defaultDoctorName'),
        time: item.appointment_time || '--:--',
        type: item.notes || t('doctor.home.todayListTitle'),
        status: item.status || 'pending',
        done: item.status === 'completed',
      }));

      setAppointments(normalized);
      setPatientsCount((patientsRes.data?.patients || []).length);
      setReportsCount((reportsRes.data?.reports || []).length);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('authErrors.default')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only dashboard fetch
  }, []);

  const updateVisitStatus = async (id, status) => {
    setSavingId(id);
    try {
      await axiosInstance.put(DOCTOR.SCHEDULE, { appointment_id: id, status });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, done: status === 'completed', status } : a))
      );
      if (status === 'completed') {
        toast.success(t('doctor.home.completed'));
      } else {
        toast.info(t('doctor.home.reverted'));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('authErrors.default')));
    } finally {
      setSavingId(null);
    }
  };

  const handleDone = (id) => updateVisitStatus(id, 'completed');
  const handleNotDone = (id) => updateVisitStatus(id, 'confirmed');

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/doctor/appointments"
          className="flex items-center gap-2 border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all"
        >
          <Calendar size={15} />
          {t('doctor.home.viewAppts')}
        </Link>
        <div className="text-start">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800">
            {t('doctor.home.welcome', { name: user?.name || t('doctor.home.defaultDoctorName') })}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{t('doctor.home.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon, color }) => (
          <div key={label} className="card-hover bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 text-start">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ms-auto ${color}`}>
              {createElement(icon, { size: 18 })}
            </div>
            <p className="text-2xl font-extrabold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card-hover lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-start">{t('doctor.home.nextTitle')}</h3>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex flex-col gap-2 flex-1 text-start min-w-48">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-600 w-fit">{nextAppointment.type}</span>
              <h4 className="font-extrabold text-gray-800 text-lg">{nextAppointment.name}</h4>
              <p className="text-gray-400 text-xs">{t('doctor.home.dob', { age: nextAppointment.age })}</p>
              <div className="flex items-center gap-2 justify-start text-xs text-gray-500">
                <Calendar size={13} className="text-blue-400 shrink-0" />
                <span>{nextAppointment.date}</span>
              </div>
              <div className="flex items-center gap-2 justify-start text-xs text-gray-500">
                <Clock size={13} className="text-blue-400 shrink-0" />
                <span>{nextAppointment.time}</span>
              </div>
              <div className="flex items-center gap-2 justify-start text-xs text-gray-500">
                <MapPin size={13} className="text-blue-400 shrink-0" />
                <span>{nextAppointment.location}</span>
              </div>
              <button
                type="button"
                className="mt-2 border border-blue-200 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors w-fit"
              >
                {t('doctor.home.openPatientFile')}
              </button>
            </div>
            <img src={nextAppointment.img} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
            {[
              { label: t('doctor.home.quickRx'), icon: '📋', to: '/doctor/prescriptions' },
              { label: t('doctor.home.quickPatients'), icon: '👤', to: '/doctor/patients' },
              { label: t('doctor.home.quickReport'), icon: '📤', to: '/doctor/reports' },
            ].map(({ label, icon, to }) => (
              <Link
                key={label}
                to={to}
                className="flex flex-col items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-xl p-3 text-center transition-colors group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-hover lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-start">{t('doctor.home.activityTitle')}</h3>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeDasharray={`${percent} ${100 - percent}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-blue-600">{percent}%</span>
                <span className="text-xs text-gray-400">{t('doctor.home.donutComplete')}</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mb-4">
            {t('doctor.home.taskProgress', { done: completedCount, total: totalCount })}
          </p>

          <div className="space-y-3">
            {loading && <p className="text-xs text-gray-400 text-start">{t('common.loading')}</p>}
            {activityItems.map(({ label, value, done }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-yellow-100'}`}
                >
                  {done ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-yellow-500" />}
                </div>
                <div className="flex-1 text-start min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-hover-panel bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
          <Link to="/doctor/appointments" className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline">
            <Chevron size={16} />
            {t('doctor.home.viewAll')}
          </Link>
          <h3 className="font-bold text-gray-800 text-start">{t('doctor.home.todayScheduleTitle')}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {appointments.map((apt) => (
            <div key={apt.id} className="px-5 py-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 ms-auto flex-wrap">
                <button
                  type="button"
                  disabled={savingId === apt.id}
                  onClick={() => handleNotDone(apt.id)}
                  className="flex items-center gap-1 text-xs font-semibold border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <XCircle size={13} />
                  {t('doctor.home.notExamined')}
                </button>
                <button
                  type="button"
                  disabled={savingId === apt.id}
                  onClick={() => handleDone(apt.id)}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                    apt.done ? 'bg-green-500 text-white' : 'border border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle size={13} />
                  {t('doctor.home.examined')}
                </button>
              </div>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      apt.status === 'completed'
                      ? 'bg-gray-100 text-gray-500'
                        : apt.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {translateAppointmentStatus(apt.status, t)}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 shrink-0">{apt.type}</span>
                <div className="text-start min-w-0 flex-1">
                  <p className="font-bold text-gray-800 text-sm truncate">{apt.name}</p>
                  <p className="text-xs text-gray-400 flex items-center justify-start gap-1">
                    <Clock size={11} />
                    {apt.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
