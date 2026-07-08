// Reports carry a human-readable AV-format number (e.g. AV202607040007) in
// different fields depending on report type — this normalizes lookup across
// them for anywhere a report ID is shown to a human (emails, subjects, etc).
function getReportDisplayId(report) {
  return (
    report?.reportNumber ||
    report?.generalInfo?.inspectionNo ||
    `#${String(report?._id || '').slice(-6).toUpperCase()}`
  );
}

module.exports = { getReportDisplayId };
