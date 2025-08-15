import React, { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { motion } from "framer-motion";
import { Copy, ArrowLeftRight, Clock, Globe2, CalendarDays } from "lucide-react";

// Small helper to get a good default list of time zones
const COMMON_TIMEZONES = [
  // Americas
  "America/Anchorage","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Phoenix","America/Toronto","America/Vancouver","America/Winnipeg","America/Bogota","America/Sao_Paulo",
  // Europe/Africa
  "Atlantic/Reykjavik","Europe/Dublin","Europe/Lisbon","Europe/London","Europe/Madrid","Europe/Paris","Europe/Berlin","Europe/Rome","Europe/Stockholm","Europe/Athens","Europe/Helsinki","Europe/Moscow","Africa/Cairo","Africa/Johannesburg",
  // Asia/Oceania
  "Asia/Dubai","Asia/Kolkata","Asia/Karachi","Asia/Bangkok","Asia/Singapore","Asia/Hong_Kong","Asia/Tokyo","Asia/Seoul","Asia/Shanghai","Australia/Perth","Australia/Adelaide","Australia/Sydney","Pacific/Auckland",
];

// Try to augment with supported values if environment allows
function getAllTimezones() {
  // If the runtime supports it, prefer the full canonical list
  const sup = Intl.supportedValuesOf?.("timeZone");
  if (sup && sup.length) return sup;
  return COMMON_TIMEZONES;
}

function formatOffset(zone, at) {
  const offsetMinutes = at.setZone(zone, { keepLocalTime: false }).offset;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

export default function TimezoneConverterApp() {
  const allZones = useMemo(() => getAllTimezones(), []);

  const localZone = useMemo(() => DateTime.local().zoneName, []);
  const [sourceZone, setSourceZone] = useState(localZone || "America/Toronto");
  const [targetZone, setTargetZone] = useState("UTC");

  // Default source time: current local time rounded to next 5 minutes for neatness
  const now = useMemo(() => DateTime.local().startOf("minute"), []);
  const [sourceISO, setSourceISO] = useState(() => now.toISO({ suppressMilliseconds: true }));

  const sourceDT = useMemo(() => {
    // Parse the ISO as if it were entered in the source zone
    return DateTime.fromISO(sourceISO || "", { zone: sourceZone });
  }, [sourceISO, sourceZone]);

  const targetDT = useMemo(() => {
    if (!sourceDT.isValid) return null;
    return sourceDT.setZone(targetZone);
  }, [sourceDT, targetZone]);

  const [filter, setFilter] = useState("");
  const filteredZones = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allZones;
    return allZones.filter(z => z.toLowerCase().includes(q));
  }, [allZones, filter]);

  function toDatetimeLocal(dt) {
    // Convert to a string suitable for <input type="datetime-local">
    return dt.toFormat("yyyy-LL-dd'T'HH:mm");
  }

  function onCopy(text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function swapZones() {
    setSourceZone(targetZone);
    setTargetZone(sourceZone);
  }

  const targetDisplay = targetDT?.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS) || "";
  const sourceDisplay = sourceDT?.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS) || "";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3"
        >
          <Globe2 className="w-8 h-8" /> Time Zone Converter
        </motion.h1>
        <p className="text-slate-600 mt-2">Select a date & time, choose a source time zone and a target time zone, and get the precise converted time (DST-aware).</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Source</h2>
            </div>
            <label className="block text-sm text-slate-600 mb-1">Date & time</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(sourceDT.isValid ? sourceDT : DateTime.local())}
              onChange={(e) => {
                const v = e.target.value; // yyyy-MM-ddTHH:mm
                // Interpret the typed value as local in the current source zone
                const dt = DateTime.fromFormat(v, "yyyy-LL-dd'T'HH:mm", { zone: sourceZone });
                setSourceISO(dt.toISO({ suppressMilliseconds: true }) || "");
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <label className="block text-sm text-slate-600 mt-4 mb-1">Source time zone</label>
            <div className="flex items-center gap-2">
              <input
                placeholder="Search time zones (e.g., Toronto, India, UTC)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <select
              value={sourceZone}
              onChange={(e) => setSourceZone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 h-[48px]"
            >
              {/* Pin common/local options */}
              <optgroup label="Quick picks">
                <option value={localZone}>Local – {localZone}</option>
                <option value="UTC">UTC</option>
                <option value="America/Toronto">America/Toronto (Eastern)</option>
                <option value="America/Winnipeg">America/Winnipeg (Central)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="Europe/London">Europe/London</option>
              </optgroup>
              <optgroup label="All time zones">
                {filteredZones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-slate-500 mt-2">Offset now: {formatOffset(sourceZone, DateTime.local())}</p>
          </motion.div>

          {/* Target Card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Target</h2>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Target time zone</label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 h-[48px]"
                >
                  <optgroup label="Quick picks">
                    <option value="UTC">UTC</option>
                    <option value={localZone}>Local – {localZone}</option>
                    <option value="America/Toronto">America/Toronto (Eastern)</option>
                    <option value="America/Winnipeg">America/Winnipeg (Central)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                    <option value="Europe/London">Europe/London</option>
                  </optgroup>
                  <optgroup label="All time zones">
                    {allZones.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-slate-500 mt-2">Offset now: {formatOffset(targetZone, DateTime.local())}</p>
              </div>
              <button
                className="shrink-0 mt-7 rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50 active:scale-[.99] transition flex items-center gap-2"
                onClick={swapZones}
                title="Swap source/target"
              >
                <ArrowLeftRight className="w-4 h-4" /> Swap
              </button>
            </div>

            <div className="mt-6">
              <div className="text-sm text-slate-600 flex items-center gap-2"><CalendarDays className="w-4 h-4"/>Converted date & time</div>
              <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
                {targetDT ? (
                  <div className="space-y-1">
                    <div className="text-xl font-semibold text-slate-900">{targetDT.toFormat("cccc, d LLLL yyyy • HH:mm (ZZZZ)")}</div>
                    <div className="text-slate-700">{targetDisplay}</div>
                    <div className="text-slate-500 text-sm">Epoch: {targetDT.toMillis()} • ISO: {targetDT.toISO({ suppressMilliseconds: true })}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-white flex items-center gap-2"
                        onClick={() => onCopy(targetDT.toISO({ suppressMilliseconds: true }) || "")}
                        title="Copy ISO"
                      >
                        <Copy className="w-4 h-4"/> Copy ISO
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-white flex items-center gap-2"
                        onClick={() => onCopy(targetDT.toFormat("cccc, d LLLL yyyy HH:mm ZZZZ"))}
                        title="Copy formatted"
                      >
                        <Copy className="w-4 h-4"/> Copy formatted
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">Enter a valid date/time to see the result.</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Source preview */}
        <div className="mt-6 bg-white rounded-2xl shadow p-5">
          <div className="text-sm text-slate-600">You entered</div>
          <div className="mt-1 text-slate-900 font-medium">{sourceDisplay || "—"}</div>
          <div className="text-slate-500 text-sm mt-1">Zone: {sourceZone} ({formatOffset(sourceZone, DateTime.local())})</div>
        </div>

        {/* Tips */}
        <div className="mt-6 text-sm text-slate-500">
          <p><strong>Tip:</strong> Daylight Saving Time is handled automatically by the selected time zones (IANA tzdb) via Luxon/Intl.</p>
        </div>
      </div>
    </div>
  );
}
