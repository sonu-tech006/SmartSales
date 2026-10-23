export interface User {
  id: string;
  name: string;
  email: string;
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

export interface Dataset {
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

export interface SalesRecord {
  id: string;
  datasetId: string;
  date: string;
  revenue: number;
  product?: string;
  category?: string;
  quantity?: number;
  orderId?: string;
  raw?: Record<string, any>;
}

export interface ETLLog {
  id: string;
  datasetId: string;
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

export interface ForecastMetric {
  mae: number;
  rmse: number;
  mape: number;
  trainCount: number;
  testCount: number;
  testDates: string[];
}

export interface PredictionPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  isFuture: boolean;
  actual?: number;
}

export interface Forecast {
  id: string;
  datasetId: string;
  userId: string;
  name: string;
  targetColumn: string;
  dateColumn: string;
  modelType: 'holt_winters' | 'linear_seasonal' | 'moving_average';
  horizonDays: number;
  metrics: ForecastMetric;
  predictions: PredictionPoint[];
  historicalSummary: Array<{
    date: string;
    actual: number;
  }>;
  createdAt: string;
}

export interface AnalyticsSummary {
  summary: {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    startDate: string;
    endDate: string;
    totalUnits: number;
  };
  dailyTrends: Array<{
    date: string;
    revenue: number;
    orders: number;
    units: number;
    rolling7?: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    units: number;
    sharePercentage: number;
  }>;
  dayOfWeekDistribution: Array<{
    day: string;
    revenue: number;
    avgDailyRevenue: number;
  }>;
}

export interface ProductItem {
  name: string;
  category: string;
  revenue: number;
  units: number;
  orders: number;
  avgPricePerUnit: number;
  activeSpan: string;
}

export interface Report {
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

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
