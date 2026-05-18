import React from "react";

const ReportLoader = () => {
  return (
    <div className="loading-overlay">
      <div className="loader-content">
        <div className="premium-spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p className="pulsing-text">PREPARING YOUR REPORT</p>
          <p className="loading-subtext">Uploading photos & assembling document... Please do not close this window.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportLoader;
