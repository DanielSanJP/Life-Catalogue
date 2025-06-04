import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/DatabaseBackup.css";

function DatabaseBackup() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDatabaseBackup = async () => {
    try {
      setIsBackingUp(true);
      setProgress(0);

      // Step 1: Fetch fish data
      setProgress(20);
      const { data: fishData } = await supabase.from("fish").select("*");

      // Step 2: Fetch customers data
      setProgress(40);
      const { data: customersData } = await supabase
        .from("customers")
        .select("*");

      // Step 3: Fetch sales data
      setProgress(60);
      const { data: salesData } = await supabase.from("sales").select("*");

      // Step 4: Fetch orders data
      setProgress(80);
      const { data: ordersData } = await supabase.from("orders").select("*");

      // Step 5: Fetch user roles data
      setProgress(90);
      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("*");

      const backup = {
        timestamp: new Date().toISOString(),
        database: "life_catalogue_db",
        tables: {
          fish: fishData,
          customers: customersData,
          sales: salesData,
          orders: ordersData,
          user_roles: userRolesData,
        },
        record_counts: {
          fish: fishData?.length || 0,
          customers: customersData?.length || 0,
          sales: salesData?.length || 0,
          orders: ordersData?.length || 0,
          user_roles: userRolesData?.length || 0,
        },
      };

      // Step 6: Create and download file
      setProgress(100);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life_catalogue_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const totalRecords = Object.values(backup.record_counts).reduce(
        (a, b) => a + b,
        0
      );
      console.log("Backup completed:", backup.record_counts);
      alert(`Backup successful! Downloaded ${totalRecords} total records`);

      // Reset progress after a brief delay
      setTimeout(() => {
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Backup failed: " + error.message);
      setProgress(0);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="database-backup-container">
      <button
        className="database-backup-btn"
        onClick={handleDatabaseBackup}
        disabled={isBackingUp}
      >
        {isBackingUp ? (
          <>
            <div className="backup-spinner"></div>
            Creating Backup...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Database Backup
          </>
        )}
      </button>

      {isBackingUp && (
        <div className="backup-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default DatabaseBackup;
