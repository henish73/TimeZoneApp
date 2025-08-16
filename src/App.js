import React, { useMemo, useState } from "react";
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
  <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-indigo-200 p-6 flex items-center justify-center">
  <div className="mx-auto max-w-4xl w-full">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center mb-6">
          <div className="bg-white rounded-full shadow-lg px-6 py-4 flex items-center gap-4">
            <Globe2 className="w-10 h-10 text-indigo-500" />
            <span className="text-4xl md:text-5xl font-extrabold text-indigo-700 tracking-tight">Time Zone Converter</span>
          </div>
        </motion.div>
  <p className="text-indigo-700 mt-2 text-center text-lg">Select a date & time, choose a source time zone and a target time zone, and get the precise converted time (DST-aware).</p>

  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Source Card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-lg p-7 border border-indigo-100">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-indigo-700">Source</h2>
            </div>
            <label className="block text-base text-indigo-600 mb-2 font-medium">Date & time</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(sourceDT.isValid ? sourceDT : DateTime.local())}
              onChange={(e) => {
                const v = e.target.value; // yyyy-MM-ddTHH:mm
                // Interpret the typed value as local in the current source zone
                const dt = DateTime.fromFormat(v, "yyyy-LL-dd'T'HH:mm", { zone: sourceZone });
                setSourceISO(dt.toISO({ suppressMilliseconds: true }) || "");
              }}
              className="w-full rounded-2xl border border-indigo-300 px-4 py-3 text-indigo-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
            />

            <label className="block text-base text-indigo-600 mt-6 mb-2 font-medium">Source time zone</label>
            <div className="flex items-center gap-2">
              <input
                placeholder="Search time zones (e.g., Toronto, India, UTC)"
                className="w-full rounded-2xl border border-indigo-300 px-4 py-3 text-indigo-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <select
              value={sourceZone}
              onChange={(e) => setSourceZone(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-indigo-300 px-4 py-3 text-indigo-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg h-[56px]"
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
            <p className="text-xs text-indigo-500 mt-3">Offset now: {formatOffset(sourceZone, DateTime.local())}</p>
          </motion.div>

          {/* Target Card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-lg p-7 border border-indigo-100">
            <div className="flex items-center gap-2 mb-6">
              <Globe2 className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-indigo-700">Target</h2>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-base text-indigo-600 mb-2 font-medium">Target time zone</label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full rounded-2xl border border-indigo-300 px-4 py-3 text-indigo-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg h-[56px]"
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
                <p className="text-xs text-indigo-500 mt-3">Offset now: {formatOffset(targetZone, DateTime.local())}</p>
              </div>
              <button
                className="shrink-0 mt-8 rounded-2xl border border-indigo-300 px-4 py-3 bg-indigo-100 hover:bg-indigo-200 active:scale-[.99] transition flex items-center gap-2 text-indigo-700 font-semibold"
                onClick={swapZones}
                title="Swap source/target"
              >
                <ArrowLeftRight className="w-5 h-5" /> Swap
              </button>
            </div>

            <div className="mt-8">
              <div className="text-base text-indigo-600 flex items-center gap-2 font-medium"><CalendarDays className="w-5 h-5"/>Converted date & time</div>
              <div className="mt-3 rounded-2xl bg-indigo-50 border border-indigo-200 p-6">
                {targetDT ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-indigo-700">{targetDT.toFormat("cccc, d LLLL yyyy • HH:mm (ZZZZ)")}</div>
                    <div className="text-indigo-900 text-lg">{targetDisplay}</div>
                    <div className="text-indigo-500 text-base">Epoch: {targetDT.toMillis()} • ISO: {targetDT.toISO({ suppressMilliseconds: true })}</div>
                    <div className="flex gap-3 mt-3">
                      <button
                        className="rounded-xl border border-indigo-300 px-4 py-2 text-base bg-white hover:bg-indigo-100 flex items-center gap-2 text-indigo-700 font-semibold"
                        onClick={() => onCopy(targetDT.toISO({ suppressMilliseconds: true }) || "")}
                        title="Copy ISO"
                      >
                        <Copy className="w-5 h-5"/> Copy ISO
                      </button>
                      <button
                        className="rounded-xl border border-indigo-300 px-4 py-2 text-base bg-white hover:bg-indigo-100 flex items-center gap-2 text-indigo-700 font-semibold"
                        onClick={() => onCopy(targetDT.toFormat("cccc, d LLLL yyyy HH:mm ZZZZ"))}
                        title="Copy formatted"
                      >
                        <Copy className="w-5 h-5"/> Copy formatted
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-indigo-400">Enter a valid date/time to see the result.</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Source preview */}
        <div className="mt-8 bg-white rounded-3xl shadow-lg p-7 border border-indigo-100 flex flex-col items-center">
          <div className="text-base text-indigo-600 font-medium">You entered</div>
          <div className="mt-2 text-indigo-900 text-xl font-bold">{sourceDisplay || "—"}</div>
          <div className="text-indigo-500 text-base mt-2">Zone: {sourceZone} ({formatOffset(sourceZone, DateTime.local())})</div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-base text-indigo-500 text-center">
          <p><strong>Tip:</strong> Daylight Saving Time is handled automatically by the selected time zones (IANA tzdb) via Luxon/Intl.</p>
        </div>
      </div>
    </div>
  );
}
