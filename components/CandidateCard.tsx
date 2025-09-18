import React from 'react';
import type { Candidate } from '../types';
import { Status } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, MailIcon, PhoneIcon } from './icons';

interface CandidateCardProps {
  candidate: Candidate;
  ocs1Date?: string;
  ocs2Date?: string;
}

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
  const statusConfig = {
    [Status.Completed]: {
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      icon: <CheckCircleIcon className="w-5 h-5" />,
    },
    [Status.InProgress]: {
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      icon: <ClockIcon className="w-5 h-5" />,
    },
    [Status.NoProgress]: {
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      icon: <XCircleIcon className="w-5 h-5" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      {config.icon}
      <span>{status}</span>
    </div>
  );
};

const AttendanceIndicator: React.FC<{ status: string }> = ({ status }) => {
    const lowerCaseStatus = status.toLowerCase().trim();

    if (lowerCaseStatus === 'attended') {
        return (
            <div className="inline-flex items-center gap-1.5 text-green-400">
                <CheckCircleIcon className="w-4 h-4" />
                <span>{status}</span>
            </div>
        );
    }

    if (lowerCaseStatus === 'not attended') {
        return (
            <div className="inline-flex items-center gap-1.5 text-red-400">
                <XCircleIcon className="w-4 h-4" />
                <span>{status}</span>
            </div>
        );
    }
    
    return <span>{status}</span>; // For 'N/A' or other values
};

const InfoRow: React.FC<{ label: React.ReactNode; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-700 last:border-b-0">
        <div className="text-sm text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-white text-right">{value}</div>
    </div>
);

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, ocs1Date, ocs2Date }) => {
  const ocs1Label = (
    <>
      OCS 1 Attendance {ocs1Date && <span className="text-slate-500 ml-1">({ocs1Date})</span>}
    </>
  );

  const ocs2Label = (
    <>
      OCS 2 Attendance {ocs2Date && <span className="text-slate-500 ml-1">({ocs2Date})</span>}
    </>
  );











  const handleSendMail = async () => {
  try {
    const payload = {
      candidates: [
        {
          ...candidate,
          ocs1Date,
          ocs2Date,
        },
      ],
    };

    // 1. Send Email
    const mailRes = await fetch("http://localhost:5000/send-mails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const mailData = await mailRes.json();
    alert(mailData.message || `Mail sent to ${candidate.email}`);

    // 2. Send WhatsApp
    const whatsappRes = await fetch("http://localhost:5000/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const whatsappData = await whatsappRes.json();
    alert(
      whatsappData.message ||
        `WhatsApp message sent to ${candidate.phone || "No phone number"}`
    );
  } catch (err) {
    console.error(" Error in handleSendMail:", err);
    alert("Failed to send mail or WhatsApp");
  }
};








  return (
    <div className="relative bg-slate-800/60 rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-cyan-500/20 hover:border-slate-600">
      <div className="absolute top-3 right-3 bg-slate-700 text-slate-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-slate-600">
          {candidate.cardNumber}
      </div>
      <div className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white pr-10">{candidate.name}</h2>
          <div className="mt-2 space-y-1 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 flex-shrink-0" />
                <p className="break-all">{candidate.email}</p>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <p>{candidate.phone}</p>
                </div>
              )}
            </div>
        </div>
        
        <div className="mb-4">
            <StatusIndicator status={candidate.status} />
        </div>

        <div className="space-y-1">
          <InfoRow label="Chapter Completion" value={candidate.chapterCompletion} />
          <InfoRow 
            label="Monthly Assessment Test" 
            value={`${candidate.marksObtained} out of ${candidate.maxMarks}`} 
          />
          <InfoRow label="Skipped Questions" value={candidate.skippedQuestions} />
          <InfoRow label={ocs1Label} value={<AttendanceIndicator status={candidate.ocs1Status} />} />
          <InfoRow label={ocs2Label} value={<AttendanceIndicator status={candidate.ocs2Status} />} />
        </div>

        {/* Send Mail Button */}
        <button
          onClick={handleSendMail}
          className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition-colors duration-200"
        >
          Send Mail
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
