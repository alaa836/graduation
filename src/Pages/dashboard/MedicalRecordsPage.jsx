import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { translateAppointmentStatus } from '../../utils/i18nStatus';
import { Download, Upload, X, Save, Plus, FileText, Activity } from 'lucide-react';

function EditModal({ t, onClose, onSave }) {
  const [form, setForm] = useState({
    bloodPressure: '120/80',
    sugar: '95',
    weight: '78',
    temperature: '36.8',
    chronicDiseases: '',
    surgicalOps: '',
    allergy: '',
  });
  const [loading, setLoading] = useState(false);
  const uploadLabels = t('patient.medical.uploadBoxes', { returnObjects: true });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSave(form);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 gap-3">
          <button type="button" onClick={onClose} className="text-gray-400 shrink-0">
            <X size={20} />
          </button>
          <h3 className="font-bold text-gray-800 text-lg text-start flex-1">{t('patient.medical.modalTitle')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('patient.medical.fieldBP'), name: 'bloodPressure', placeholder: t('patient.medical.phBP') },
            { label: t('patient.medical.fieldSugar'), name: 'sugar', placeholder: t('patient.medical.phSugar') },
            { label: t('patient.medical.fieldTemp'), name: 'temperature', placeholder: t('patient.medical.phTemp') },
            { label: t('patient.medical.fieldWeight'), name: 'weight', placeholder: t('patient.medical.phWeight') },
          ].map(({ label, name, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1 text-start">{label}</label>
              <input
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-start focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          ))}
          {[
            { label: t('patient.medical.fieldChronic'), name: 'chronicDiseases', placeholder: t('patient.medical.phChronic') },
            { label: t('patient.medical.fieldSurgery'), name: 'surgicalOps', placeholder: t('patient.medical.phSurgery') },
            { label: t('patient.medical.fieldAllergy'), name: 'allergy', placeholder: t('patient.medical.phAllergy') },
          ].map(({ label, name, placeholder }) => (
            <div key={name} className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 text-start">{label}</label>
              <textarea
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                placeholder={placeholder}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-start focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {uploadLabels.map((label) => (
            <div
              key={label}
              className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <Upload size={18} className="mx-auto text-blue-400 mb-1" />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xs text-blue-500 mt-0.5">{t('patient.medical.pickFile')}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              <>
                <Save size={14} />
                {t('patient.medical.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicalRecordsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);

  const vitals = useMemo(
    () => [
      { label: t('patient.medical.vitalsBP'), value: '120/80', icon: '❤️', color: 'text-red-500 bg-red-50' },
      { label: t('patient.medical.vitalsSugar'), value: '95 mg/dL', icon: '💧', color: 'text-blue-500 bg-blue-50' },
      {
        label: t('patient.medical.vitalsWeight'),
        value: `78 ${t('patient.medical.vitalsUnitWeight')}`,
        icon: '⚖️',
        color: 'text-green-500 bg-green-50',
      },
      { label: t('patient.medical.vitalsTemp'), value: '36.8°', icon: '🌡️', color: 'text-orange-500 bg-orange-50' },
    ],
    [t]
  );

  const mockVisits = useMemo(
    () => [
      {
        id: 1,
        status: 'مكتمل',
        title: t('patient.medical.demo.visit1Title'),
        date: t('patient.medical.demo.visit1Date'),
        doctor: t('patient.medical.demo.visit1Doctor'),
        diagnosis: t('patient.medical.demo.visit1Diagnosis'),
        prescription: t('patient.medical.demo.visit1Prescription'),
        finalDiag: t('patient.medical.finalDiag'),
      },
      {
        id: 2,
        status: 'تحت المراجعة',
        title: t('patient.medical.demo.visit2Title'),
        date: t('patient.medical.demo.visit2Date'),
        lab: t('patient.medical.demo.visit2Lab'),
        summary: { hb: '14.2 g/dL', platelets: '250,000' },
        report: t('patient.medical.demo.visit2Report'),
      },
    ],
    [t]
  );

  const chronicItems = useMemo(
    () => [t('patient.medical.demo.chronic1'), t('patient.medical.demo.chronic2')],
    [t]
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <button
          type="button"
          className="flex items-center gap-2 border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all"
        >
          <Download size={15} />
          {t('patient.medical.downloadFull')}
        </button>
        <div className="text-start">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800">{t('patient.medical.pageTitle')}</h1>
          <div className="flex items-center justify-start gap-1 mt-1 flex-wrap">
            <span className="text-xs text-green-500 font-semibold">{t('patient.medical.privacy')}</span>
            <span className="text-green-500">🔒</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="card-hover bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:underline"
              >
                <Plus size={13} />
                {t('patient.medical.editShort')}
              </button>
              <h3 className="font-bold text-gray-800 text-start">{t('patient.medical.vitalsLatest')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vitals.map(({ label, value, icon, color }) => (
                <div key={label} className={`rounded-xl p-3 text-start ${color.split(' ')[1]}`}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className={`font-extrabold text-lg ${color.split(' ')[0]}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-hover bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 text-start mb-2 flex items-center justify-start gap-2">
                {t('patient.medical.chronicTitle')}
                <Activity size={15} className="text-blue-500 shrink-0" />
              </h4>
              <div className="space-y-1.5">
                {chronicItems.map((d) => (
                  <div key={d} className="flex items-center gap-2 w-full">
                    <span className="text-xs text-gray-600 text-start flex-1">{d}</span>
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-start mb-2 flex items-center justify-start gap-2">
                {t('patient.medical.surgeryTitle')}
                <FileText size={15} className="text-blue-500 shrink-0" />
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 text-start flex-1">{t('patient.medical.demo.surgery1')}</span>
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              </div>
              <p className="text-xs text-gray-300 text-start mt-1">{t('patient.medical.noMoreSurgeries')}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-gray-400">{t('patient.medical.totalRecords', { count: 14 })}</span>
            <h3 className="font-bold text-gray-800 text-start">{t('patient.medical.visitsLogTitle')}</h3>
          </div>

          {mockVisits.map((visit) => (
            <div key={visit.id} className="card-hover bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    visit.status === 'مكتمل' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {translateAppointmentStatus(visit.status, t)}
                </span>
                <div className="text-start min-w-0">
                  <div className="flex items-center justify-start gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-sm">{visit.title}</h4>
                    <span className="text-lg shrink-0">{visit.lab ? '🧪' : '📅'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {visit.date} | {visit.doctor || visit.lab}
                  </p>
                </div>
              </div>

              {visit.diagnosis && (
                <div className="mb-3">
                  <div className="flex items-center justify-start gap-1 mb-1">
                    <span className="text-xs font-semibold text-blue-600">{visit.finalDiag}</span>
                    <span className="text-blue-500">📋</span>
                  </div>
                  <p className="text-xs text-gray-500 text-start leading-relaxed">{visit.diagnosis}</p>
                </div>
              )}

              {visit.summary && (
                <div className="mb-3 text-start">
                  <div className="flex items-center justify-start gap-1 mb-1">
                    <span className="text-xs font-semibold text-blue-600">{t('patient.medical.labSummaryTitle')}</span>
                    <span className="text-blue-500">📊</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('patient.medical.hbLabel')}: {visit.summary.hb}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('patient.medical.plateletsLabel')}: {visit.summary.platelets}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 gap-2 flex-wrap">
                <button type="button" className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:underline">
                  {t('patient.medical.detailsLink')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success(t('patient.medical.downloadingFile'))}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  <span className="text-xs text-gray-400">{visit.prescription || visit.report}</span>
                  <span className="text-sm">{visit.prescription ? '📄' : '📋'}</span>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="w-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-500 font-semibold py-3 rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            {t('patient.medical.loadOlder')}
          </button>
        </div>
      </div>

      {showEdit && (
        <EditModal
          t={t}
          onClose={() => setShowEdit(false)}
          onSave={() => {
            toast.success(t('patient.medical.savedToast'));
          }}
        />
      )}
    </div>
  );
}
