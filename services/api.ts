import { Employee, GuestDetails, InOutEntry, User } from '@/lib/types';
import axios from 'axios';

// const BASE_URL = "https://eventsgalaxy4u.com";
const BASE_URL = 'https://events.scriptindia.in';
const GUEST_LOOKUP_BASE_URL = 'https://epass.scriptindia.in';

const api = axios.create({
  baseURL: GUEST_LOOKUP_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
  },
});

const guestLookupApi = axios.create({
  baseURL: GUEST_LOOKUP_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// types/employee.ts

export interface AttendanceEntry {
  id: string;
  employee_id: string;
  scan_type: 'IN' | 'OUT';
  scanned_by: string;
  scan_time: string;
  created_at: string;
  employee?: Employee;
}

export const apiService = {
  async login(AppUserName: string, AppPassword: string): Promise<User> {
    try {
      const response = await guestLookupApi.post('/AppUserAuthentication', {
        AppUserName,
        AppPassword,
      });
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw error;
    }
  },

  async eventTime(payload: any) {
    try {
      const response = await api.post('/EventInTime', payload);
      if (response.data) {
        return response.data;
      } else {
        throw new Error('event failed');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw error;
    }
  },

  async getEmployeeByBarcode(qrValue: string): Promise<GuestDetails[]> {
    try {
      const response = await guestLookupApi.get('/QrCodeGuestDetails', {
        params: { QRValue: qrValue },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          error.response?.data?.error || 'Failed to fetch employee',
        );
      }
      throw error;
    }
  },

  async postIn(payload: any) {
    const data = await guestLookupApi.post('/EventInTime', payload);
    return data.data;
  },

  async postOut(payload: any) {
    const { data } = await api.post('/EventOutTime', payload);
    return data;
  },

  /** High-level helper that chooses endpoint and builds the right payload */
  async createAttendanceEntry(employee: EmployeeLite, type: ScanType) {
    const payload = buildPayload(employee);

    console.log('Attendance Payload:', payload);

    try {
      return type === 'IN'
        ? await this.postIn(payload)
        : await this.postOut(payload);
    } catch (err: any) {
      if (err?.response?.data) {
        const serverMsg =
          err.response.data.error ||
          err.response.data.message ||
          err.response.data.ErrorMessage;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  async getTodayEntries(): Promise<InOutEntry[]> {
    try {
      const response = await api.get(`/GetEventAttendanceLog`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch entries');
      }
      throw error;
    }
  },
};

type ScanType = 'IN' | 'OUT';

interface EmployeeLite {
  EventLogId: string | number | null;
  QrId: string | null;
  QrName: string | null;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Format a JS Date to IST "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DD" */
function formatIST(date = new Date()) {
  // Convert to IST (UTC+5:30)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 60 * 60 * 1000);

  const Y = istDate.getUTCFullYear();
  const M = pad(istDate.getUTCMonth() + 1);
  const D = pad(istDate.getUTCDate());
  const h = pad(istDate.getUTCHours());
  const m = pad(istDate.getUTCMinutes());
  const s = pad(istDate.getUTCSeconds());

  return {
    dateTime: `${Y}-${M}-${D} ${h}:${m}:${s}`,
    dateOnly: `${Y}-${M}-${D}`,
  };
}

function buildPayload(employee: EmployeeLite) {
  const { dateTime, dateOnly } = formatIST();

  return {
    DeviceIp: 'Insert using Mobile App',
    LogDate: dateTime, // "YYYY-MM-DD HH:mm:ss"
    QrName: employee.QrName,
    QrId: employee.QrId,
    EntryDate: dateTime, // "YYYY-MM-DD HH:mm:ss"
    InFlag: '1', // "1" = IN, "2" = OUT
  };
}
