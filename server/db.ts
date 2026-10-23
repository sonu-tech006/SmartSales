import fs from 'fs';
import path from 'path';

// Central Database Store (Persistent File-backed JSON store with MongoDB compatibility hooks)
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'smartsales_db.json');

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'midnight';
    emailNotifications: boolean;
    defaultHorizon: number;
  };
}

export interface DatasetRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  filename: string;
  fileSizeBytes: number;
  rowCount: number;
  validRowCount: number;
  rejectedRowCount: number;
  columns: string[];
  columnMappings: {
    date: string;
    sales: string;
    product?: string;
    category?: string;
    quantity?: string;
    orderId?: string;
  };
  summaryStats: {
    totalRevenue: number;
    totalOrders?: number;
    startDate: string;
    endDate: string;
    categoriesCount: number;
    productsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SalesDataRow {
  id: string;
  datasetId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  revenue: number;
  product?: string;
  category?: string;
  quantity?: number;
  orderId?: string;
  raw?: Record<string, any>;
}

export interface ETLLogRecord {
  id: string;
  datasetId: string;
  userId: string;
  filename: string;
  fileSizeBytes: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  warnings: string[];
  durationMs: number;
  timestamp: string;
}

export interface ForecastRecord {
  id: string;
  datasetId: string;
  userId: string;
  name: string;
  targetColumn: string;
  dateColumn: string;
  modelType: 'holt_winters' | 'linear_seasonal' | 'moving_average';
  horizonDays: number;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    trainCount: number;
    testCount: number;
    testDates: string[];
  };
  predictions: Array<{
    date: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
    isFuture: boolean;
    actual?: number;
  }>;
  historicalSummary: Array<{
    date: string;
    actual: number;
  }>;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  datasetId: string;
  userId: string;
  title: string;
  dateRange: { start: string; end: string };
  metrics: {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    topCategory: string;
    topProduct: string;
  };
  summaryText: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  datasets: DatasetRecord[];
  salesRows: SalesDataRow[];
  etlLogs: ETLLogRecord[];
  forecasts: ForecastRecord[];
  reports: ReportRecord[];
  notifications: NotificationRecord[];
}

const initialDb: DatabaseSchema = {
  users: [],
  datasets: [],
  salesRows: [],
  etlLogs: [],
  forecasts: [],
  reports: [],
  notifications: [],
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = initialDb;
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Failed to load database from file, using in-memory store:', err);
      this.data = initialDb;
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }
}

export const dbInstance = new Database();
export const db = dbInstance.getData();
export const saveDb = () => dbInstance.save();
