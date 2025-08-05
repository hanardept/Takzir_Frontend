import React, { useState, useEffect } from 'react';
import { MaintenanceRecord } from '../../types/maintenance';
import { maintenanceService } from '../../services/maintenanceService';

export const MaintenanceList: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadMaintenanceRecords();
  }, [filters]);

  const loadMaintenanceRecords = async () => {
    try {
      const data = await maintenanceService.getAll(filters);
      setRecords(data);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
    }
  };

  return (
    <div className="maintenance-list">
      <div className="filters">
        {/* Filter components */}
      </div>
      <div className="table-container">
        <table className="maintenance-table">
          <thead>
            <tr>
              <th>מספר תקלה</th>
              <th>חברה</th>
              <th>יחידה</th>
              <th>סטטוס</th>
              <th>תאריך פתיחה</th>
              <th>תאריך סגירה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.company}</td>
                <td>{record.unit}</td>
                <td>{record.status}</td>
                <td>{record.openDate}</td>
                <td>{record.closeDate}</td>
                <td>
                  <button>עריכה</button>
                  <button>צפייה</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
