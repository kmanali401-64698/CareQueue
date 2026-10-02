import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Clock,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

/** Public screen: show "Emma W." instead of full patient names. */
function maskName(name = '') {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

export function WaitingRoomDisplayPage() {
  const { doctors, getDoctorQueueData, refresh } = useClinic();

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshPulse, setRefreshPulse] = useState(false);

  // Live Clock (1 second interval)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 5-Second Auto-Refresh Engine
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Trigger visual refresh pulse
          setRefreshPulse(true);
          setTimeout(() => setRefreshPulse(false), 600);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    // Pull the latest queue from the server on the same 5-second cadence
    const dataTimer = setInterval(() => {
      refresh();
    }, 5000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(dataTimer);
    };
  }, [refresh]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Play a soft pleasant tone when called
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top TV Kiosk Header */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                CareQueue Medical Center
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                LIVE OPD BOARD
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Outpatient Department Patient Queue & Token Announcements
            </p>
          </div>
        </div>

        {/* Live Clock & Auto-Refresh Monitor */}
        <div className="flex items-center gap-5 sm:gap-8">
          {/* Digital Clock */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            {/* Auto-Refresh Badge */}
            <div 
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                refreshPulse 
                  ? 'bg-teal-500/30 border-teal-400 text-teal-200 ring-2 ring-teal-400/40' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshPulse ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
              <span className="text-xs font-mono font-medium">
                Sync {secondsLeft}s
              </span>
            </div>

            {/* Sound alert test */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playChime();
              }}
              title={soundEnabled ? 'Mute announcement chime' : 'Enable announcement chime'}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-teal-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen Kiosk Mode"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Back to clinic dashboard */}
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-soft"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Display</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Display Grid: 3 Doctor OPD Stations */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1920px] w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {doctors.map((doctor) => {
          const queueData = getDoctorQueueData(doctor.id);
          const { nowServing, nextQueue, waitingCount, isOnLeave, isWorkingDay } = queueData;

          return (
            <div
              key={doctor.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${
                isOnLeave
                  ? 'bg-slate-900/60 border-rose-900/40 opacity-75'
                  : !isWorkingDay
                  ? 'bg-slate-900/60 border-slate-800 opacity-75'
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800/90 hover:border-teal-500/50'
              }`}
            >
              {/* Doctor Station Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/40 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                    {doctor.avatar}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {doctor.name}
                    </h2>
                    <p className="text-xs text-teal-400 font-semibold tracking-wide">
                      {doctor.specialty}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-black tracking-wider font-mono border border-teal-500/30">
                    {doctor.room}
                  </span>
                  <div className="mt-1">
                    {isOnLeave ? (
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                        On Leave
                      </span>
                    ) : !isWorkingDay ? (
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Off Duty Today
                      </span>
                    ) : nowServing ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Station Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
                {/* 1. NOW SERVING SECTION (Enormous Text) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                      Now Serving
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Please enter {doctor.room}
                    </span>
                  </div>

                  {isOnLeave ? (
                    <div className="py-10 text-center rounded-2xl bg-rose-950/20 border border-rose-900/30 text-rose-400 space-y-1">
                      <AlertCircle className="w-8 h-8 mx-auto text-rose-500/80 mb-2" />
                      <p className="font-bold text-sm">Doctor on Scheduled Leave</p>
                      <p className="text-xs text-rose-400/80">No active consultation slots today.</p>
                    </div>
                  ) : nowServing ? (
                    <div className="rounded-2xl bg-gradient-to-br from-teal-950/60 to-slate-900 border-2 border-teal-500/70 p-6 text-center space-y-2.5 shadow-xl shadow-teal-950/50">
                      <span className="text-xs uppercase font-bold text-teal-400 tracking-widest">
                        Queue Ticket
                      </span>
                      {/* Giant Token */}
                      <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                        {nowServing.token}
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-slate-200">
                        {maskName(nowServing.patientName)}
                      </div>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-teal-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                          Proceed to {doctor.room}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-1">
                      <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-sm text-slate-300">Station Standby</p>
                      <p className="text-xs text-slate-500">Awaiting next patient check-in.</p>
                    </div>
                  )}
                </div>

                {/* 2. NEXT 3 TOKENS (Large & Clear) */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Next in Line (Next 3)
                    </span>
                    <span className="text-xs font-bold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2.5 py-0.5 rounded-full">
                      {waitingCount} Waiting
                    </span>
                  </div>

                  {nextQueue && nextQueue.length > 0 ? (
                    <div className="space-y-2.5">
                      {nextQueue.map((apt, index) => {
                        const rankLabel = index === 0 ? '1st Next' : index === 1 ? '2nd Next' : '3rd Next';
                        return (
                          <div
                            key={apt.id}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                              index === 0
                                ? 'bg-slate-900 border-teal-500/40 shadow-soft'
                                : 'bg-slate-900/50 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center font-mono">
                                {index + 1}
                              </span>
                              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
                                {apt.token}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-slate-200 block truncate max-w-[140px]">
                                {maskName(apt.patientName)}
                              </span>
                              <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                                {rankLabel} • {apt.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                      No patients currently queued
                    </div>
                  )}
                </div>
              </div>

              {/* Station Footer */}
              <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Hours: {doctor.startTime} – {doctor.endTime}</span>
                <span className="font-mono text-teal-400/90">{doctor.slotDuration || 15}m Slots</span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Ticker Notification Bar */}
      <footer className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-slate-200">Patient Notice:</span>
          <span>
            Please approach your respective consulting room as soon as your token is displayed. Have your ID and medical records ready.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>Auto-refreshes every 5s</span>
          <span>•</span>
          <span>CareQueue Kiosk Engine v1.0</span>
        </div>
      </footer>
    </div>
  );
}

export default WaitingRoomDisplayPage;
