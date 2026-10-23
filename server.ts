import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, saveDb, DatasetRecord, SalesDataRow, ForecastRecord } from './server/db';
import { hashPassword, verifyPassword, generateToken, requireAuth, AuthenticatedRequest } from './server/auth';
import { profileCSV, executeETLPipeline } from './server/etl';
import { generateForecast } from './server/forecaster';
import { ensureSampleData } from './server/seedData';

// Initialize sample data on startup
ensureSampleData();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'Business Analyst',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        theme: 'light' as const,
        emailNotifications: true,
        defaultHorizon: 30,
      },
    };

    db.users.push(newUser);

    // Add welcome notification
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to SmartSales',
      message: 'Your account is active. Explore the pre-loaded retail dataset or upload your own sales CSV to start forecasting.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDb();

    const token = generateToken(newUser);
    const { passwordHash, ...userSafe } = newUser;
    return res.status(201).json({ user: userSafe, token });
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { passwordHash, ...userSafe } = user;
    return res.json({ user: userSafe, token });
  });

  // Current User Profile
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { passwordHash, ...userSafe } = req.user!;
    return res.json({ user: userSafe });
  });

  // Forgot Password (generates a valid reset token for portfolio demonstration)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      // Don't leak user existence in production, but confirm request received
      return res.json({
        message: 'If an account with that email exists, password reset instructions have been generated.',
        mockResetToken: 'demo-reset-token-' + Math.random().toString(36).substring(2, 9),
      });
    }

    const mockResetToken = `reset_${user.id}_${Date.now()}`;
    return res.json({
      message: 'Password reset instructions generated successfully. In production, an email is dispatched via SendGrid/SES.',
      mockResetToken,
    });
  });

  // Reset Password
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Accept token format reset_<userId>_<time>
    const match = token.match(/^reset_([^_]+)_/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const userId = match[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User associated with this reset token was not found' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    saveDb();

    return res.json({ message: 'Password updated successfully. You can now log in.' });
  });

  // Update Profile
  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { name, role, preferences } = req.body;

    if (name) user.name = String(name).trim();
    if (role) user.role = String(role).trim();
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    user.updatedAt = new Date().toISOString();
    saveDb();

    const { passwordHash, ...userSafe } = user;
    return res.json({ user: userSafe });
  });

  // Change Password
  app.put('/api/auth/password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    saveDb();

    return res.json({ message: 'Password changed successfully' });
  });

  // ==========================================
  // DATASET & CSV INGESTION ROUTES
  // ==========================================

  // List Datasets (User's own datasets + seeded sample dataset for quick start)
  app.get('/api/datasets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const datasets = db.datasets.filter((d) => d.userId === userId || d.id === 'ds_retail_sample_2026');
    return res.json({ datasets });
  });

  // Profile CSV (Analyze headers, types, and column candidates before commit)
  app.post('/api/datasets/upload/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'CSV file content string is required' });
    }

    try {
      const profileResult = profileCSV(csvContent);
      return res.json(profileResult);
    } catch (err: any) {
      return res.status(400).json({ error: `CSV profiling failed: ${err.message}` });
    }
  });

  // Execute Import & Persist Dataset
  app.post('/api/datasets/upload/import', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { name, description, filename, csvContent, columnMappings } = req.body;

    if (!name || !csvContent || !columnMappings || !columnMappings.date || !columnMappings.sales) {
      return res.status(400).json({ error: 'Name, CSV content, and date/sales column mappings are required' });
    }

    const startTime = Date.now();
    const etlResult = executeETLPipeline(csvContent, columnMappings);
    const durationMs = Date.now() - startTime;

    if (etlResult.validRows.length === 0) {
      return res.status(422).json({
        error: 'Data validation failed: 0 valid sales records were extracted',
        rejectedRows: etlResult.rejectedRows.slice(0, 10),
        warnings: etlResult.warnings,
      });
    }

    const datasetId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDataset: DatasetRecord = {
      id: datasetId,
      userId,
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      filename: filename || 'uploaded_data.csv',
      fileSizeBytes: csvContent.length,
      rowCount: etlResult.validRows.length + etlResult.rejectedRows.length,
      validRowCount: etlResult.validRows.length,
      rejectedRowCount: etlResult.rejectedRows.length,
      columns: Object.keys(etlResult.validRows[0].raw || {}),
      columnMappings,
      summaryStats: etlResult.summaryStats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Build internal records
    const salesRows: SalesDataRow[] = etlResult.validRows.map((r, i) => ({
      id: `row_${datasetId}_${i}`,
      datasetId,
      userId,
      date: r.date,
      revenue: r.revenue,
      product: r.product,
      category: r.category,
      quantity: r.quantity,
      orderId: r.orderId,
      raw: r.raw,
    }));

    db.datasets.push(newDataset);
    db.salesRows.push(...salesRows);

    // Save ETL Ingestion Log
    const etlLog = {
      id: `etl_${Date.now()}`,
      datasetId,
      userId,
      filename: newDataset.filename,
      fileSizeBytes: newDataset.fileSizeBytes,
      status: (etlResult.rejectedRows.length > 0 ? 'WARNING' : 'SUCCESS') as 'WARNING' | 'SUCCESS',
      totalRows: newDataset.rowCount,
      validRows: etlResult.validRows.length,
      rejectedRows: etlResult.rejectedRows.length,
      warnings: etlResult.warnings,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    db.etlLogs.push(etlLog);

    // Add Notification
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId,
      title: 'Dataset Ingested Successfully',
      message: `"${newDataset.name}" processed: ${etlResult.validRows.length.toLocaleString()} valid rows ingested in ${durationMs}ms.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDb();

    return res.status(201).json({
      dataset: newDataset,
      etlLog,
      validationSummary: {
        validCount: etlResult.validRows.length,
        rejectedCount: etlResult.rejectedRows.length,
        rejectedSample: etlResult.rejectedRows.slice(0, 5),
        warnings: etlResult.warnings,
      },
    });
  });

  // Get Dataset Details
  app.get('/api/datasets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    const etlLog = db.etlLogs.find((l) => l.datasetId === datasetId);
    return res.json({ dataset, etlLog });
  });

  // Dataset Paginated Preview
  app.get('/api/datasets/:id/preview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string, 10) || 20));

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const rows = db.salesRows.filter((r) => r.datasetId === datasetId);
    const total = rows.length;
    const start = (page - 1) * limit;
    const paginatedRows = rows.slice(start, start + limit);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      rows: paginatedRows,
    });
  });

  // Delete Dataset
  app.delete('/api/datasets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;

    if (datasetId === 'ds_retail_sample_2026') {
      return res.status(400).json({ error: 'The pre-loaded demonstration dataset cannot be deleted.' });
    }

    const index = db.datasets.findIndex((d) => d.id === datasetId && d.userId === userId);
    if (index === -1) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    db.datasets.splice(index, 1);
    // Remove related rows
    db.salesRows = db.salesRows.filter((r) => r.datasetId !== datasetId);
    db.forecasts = db.forecasts.filter((f) => f.datasetId !== datasetId);
    saveDb();

    return res.json({ message: 'Dataset deleted successfully' });
  });

  // ==========================================
  // REAL SALES ANALYTICS ROUTES
  // ==========================================

  app.get('/api/datasets/:id/analytics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const rows = db.salesRows.filter((r) => r.datasetId === datasetId);
    if (rows.length === 0) {
      return res.json({
        summary: { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 },
        dailyTrends: [],
        categoryBreakdown: [],
        dayOfWeekDistribution: [],
      });
    }

    // Daily aggregation
    const dailyMap = new Map<string, { revenue: number; orders: number; units: number }>();
    const categoryMap = new Map<string, { revenue: number; units: number }>();
    const dayOfWeekRevenue = [0, 0, 0, 0, 0, 0, 0];
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];

    let totalRevenue = 0;
    let totalUnits = 0;

    for (const r of rows) {
      totalRevenue += r.revenue;
      totalUnits += r.quantity || 1;

      // Daily
      const curDaily = dailyMap.get(r.date) || { revenue: 0, orders: 0, units: 0 };
      curDaily.revenue += r.revenue;
      curDaily.orders += 1;
      curDaily.units += r.quantity || 1;
      dailyMap.set(r.date, curDaily);

      // Category
      const cat = r.category || 'General';
      const curCat = categoryMap.get(cat) || { revenue: 0, units: 0 };
      curCat.revenue += r.revenue;
      curCat.units += r.quantity || 1;
      categoryMap.set(cat, curCat);

      // Day of Week
      const dow = new Date(r.date + 'T00:00:00Z').getUTCDay();
      dayOfWeekRevenue[dow] += r.revenue;
      dayOfWeekCounts[dow] += 1;
    }

    const sortedDates = Array.from(dailyMap.keys()).sort();
    const dailyTrends = sortedDates.map((date) => {
      const d = dailyMap.get(date)!;
      return {
        date,
        revenue: Math.round(d.revenue * 100) / 100,
        orders: d.orders,
        units: d.units,
      };
    });

    // Compute 7-day rolling average for trend smoothing
    for (let i = 0; i < dailyTrends.length; i++) {
      const sliceStart = Math.max(0, i - 6);
      const slice = dailyTrends.slice(sliceStart, i + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.revenue, 0) / slice.length;
      (dailyTrends[i] as any).rolling7 = Math.round(avg * 100) / 100;
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        revenue: Math.round(stats.revenue * 100) / 100,
        units: stats.units,
        sharePercentage: Math.round((stats.revenue / totalRevenue) * 1000) / 10,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekDistribution = dayNames.map((name, i) => ({
      day: name,
      revenue: Math.round(dayOfWeekRevenue[i] * 100) / 100,
      avgDailyRevenue: dayOfWeekCounts[i] ? Math.round((dayOfWeekRevenue[i] / dayOfWeekCounts[i]) * 100) / 100 : 0,
    }));

    return res.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        orderCount: rows.length,
        avgOrderValue: Math.round((totalRevenue / rows.length) * 100) / 100,
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
        totalUnits,
      },
      dailyTrends,
      categoryBreakdown,
      dayOfWeekDistribution,
    });
  });

  // Product Performance Table
  app.get('/api/datasets/:id/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;
    const search = ((req.query.search as string) || '').toLowerCase();

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const rows = db.salesRows.filter((r) => r.datasetId === datasetId);
    const prodMap = new Map<string, { category: string; revenue: number; units: number; orders: number; firstDate: string; lastDate: string }>();

    for (const r of rows) {
      const prod = r.product || 'General Product';
      const cur = prodMap.get(prod) || {
        category: r.category || 'General',
        revenue: 0,
        units: 0,
        orders: 0,
        firstDate: r.date,
        lastDate: r.date,
      };
      cur.revenue += r.revenue;
      cur.units += r.quantity || 1;
      cur.orders += 1;
      if (r.date < cur.firstDate) cur.firstDate = r.date;
      if (r.date > cur.lastDate) cur.lastDate = r.date;
      prodMap.set(prod, cur);
    }

    let products = Array.from(prodMap.entries()).map(([name, stats]) => ({
      name,
      category: stats.category,
      revenue: Math.round(stats.revenue * 100) / 100,
      units: stats.units,
      orders: stats.orders,
      avgPricePerUnit: stats.units ? Math.round((stats.revenue / stats.units) * 100) / 100 : 0,
      activeSpan: `${stats.firstDate} to ${stats.lastDate}`,
    }));

    if (search) {
      products = products.filter((p) => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
    }

    products.sort((a, b) => b.revenue - a.revenue);

    return res.json({ products });
  });

  // ==========================================
  // REAL ML TIME-SERIES FORECASTING
  // ==========================================

  app.post('/api/datasets/:id/forecast', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const datasetId = req.params.id;
    const userId = req.user!.id;
    const { modelType = 'holt_winters', horizonDays = 30, forecastName } = req.body;

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const rows = db.salesRows.filter((r) => r.datasetId === datasetId);
    if (rows.length < 5) {
      return res.status(400).json({ error: 'Dataset must have at least 5 records to execute statistical time-series forecasting' });
    }

    try {
      const forecastData = generateForecast(
        rows.map((r) => ({ date: r.date, revenue: r.revenue })),
        modelType,
        Number(horizonDays) || 30
      );

      const forecastRecord: ForecastRecord = {
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        datasetId,
        userId,
        name: forecastName || `${dataset.name} — ${horizonDays}D ${modelType.toUpperCase()}`,
        targetColumn: dataset.columnMappings.sales,
        dateColumn: dataset.columnMappings.date,
        modelType,
        horizonDays: Number(horizonDays) || 30,
        metrics: forecastData.metrics,
        predictions: forecastData.predictions,
        historicalSummary: forecastData.historicalSummary,
        createdAt: new Date().toISOString(),
      };

      db.forecasts.push(forecastRecord);

      // Add Notification
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId,
        title: 'Sales Forecast Generated',
        message: `Generated ${horizonDays}-day forecast using ${modelType}. Test MAE: $${forecastData.metrics.mae}, MAPE: ${forecastData.metrics.mape}%.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      });

      saveDb();

      return res.status(201).json({ forecast: forecastRecord });
    } catch (err: any) {
      return res.status(422).json({ error: `Forecasting failed: ${err.message}` });
    }
  });

  // List Forecast History
  app.get('/api/forecasts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const forecasts = db.forecasts.filter((f) => f.userId === userId);
    return res.json({ forecasts });
  });

  // Get Single Forecast Details
  app.get('/api/forecasts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const forecastId = req.params.id;
    const userId = req.user!.id;

    const forecast = db.forecasts.find((f) => f.id === forecastId && f.userId === userId);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    return res.json({ forecast });
  });

  // Export Forecast CSV
  app.get('/api/forecasts/:id/export', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const forecastId = req.params.id;
    const userId = req.user!.id;

    const forecast = db.forecasts.find((f) => f.id === forecastId && f.userId === userId);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    const headers = ['Date', 'Type', 'PredictedRevenue', 'LowerBound95', 'UpperBound95', 'ActualRevenue'];
    const lines = [headers.join(',')];

    for (const p of forecast.predictions) {
      const type = p.isFuture ? 'Forecast' : 'Historical_Fitted';
      const actualVal = p.actual !== undefined ? p.actual : '';
      lines.push(`${p.date},${type},${p.predicted},${p.lowerBound},${p.upperBound},${actualVal}`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${forecast.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv"`);
    return res.send(lines.join('\n'));
  });

  // Delete Forecast
  app.delete('/api/forecasts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const forecastId = req.params.id;
    const userId = req.user!.id;

    const idx = db.forecasts.findIndex((f) => f.id === forecastId && f.userId === userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    db.forecasts.splice(idx, 1);
    saveDb();
    return res.json({ message: 'Forecast deleted successfully' });
  });

  // ==========================================
  // REPORTS, NOTIFICATIONS & SAMPLES
  // ==========================================

  // Generate / Save Report
  app.post('/api/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { datasetId, title, dateRange } = req.body;

    const dataset = db.datasets.find((d) => d.id === datasetId && (d.userId === userId || d.id === 'ds_retail_sample_2026'));
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    let rows = db.salesRows.filter((r) => r.datasetId === datasetId);
    if (dateRange && dateRange.start && dateRange.end) {
      rows = rows.filter((r) => r.date >= dateRange.start && r.date <= dateRange.end);
    }

    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const orderCount = rows.length;
    const avgOrderValue = orderCount ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;

    // Determine top category and product
    const catMap = new Map<string, number>();
    const prodMap = new Map<string, number>();
    for (const r of rows) {
      catMap.set(r.category || 'General', (catMap.get(r.category || 'General') || 0) + r.revenue);
      prodMap.set(r.product || 'General', (prodMap.get(r.product || 'General') || 0) + r.revenue);
    }

    const topCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topProduct = Array.from(prodMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const report = {
      id: `rep_${Date.now()}`,
      datasetId,
      userId,
      title: title || `${dataset.name} Performance Audit`,
      dateRange: dateRange || { start: dataset.summaryStats.startDate, end: dataset.summaryStats.endDate },
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        orderCount,
        avgOrderValue,
        topCategory,
        topProduct,
      },
      summaryText: `Analyzed ${orderCount.toLocaleString()} transactions totaling $${Math.round(totalRevenue).toLocaleString()}. Category '${topCategory}' drove primary revenue. Top SKU: '${topProduct}'.`,
      createdAt: new Date().toISOString(),
    };

    db.reports.push(report);
    saveDb();

    return res.status(201).json({ report });
  });

  app.get('/api/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const reports = db.reports.filter((r) => r.userId === userId);
    return res.json({ reports });
  });

  // Notifications
  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const notifications = db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ notifications });
  });

  app.put('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === req.user!.id);
    if (notif) {
      notif.read = true;
      saveDb();
    }
    return res.json({ success: true });
  });

  // Download Sample CSV
  app.get('/api/samples/download', (req: Request, res: Response) => {
    const samplePath = path.resolve(process.cwd(), 'sample_data/global_retail_sales.csv');
    if (fs.existsSync(samplePath)) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="global_retail_sales.csv"');
      return fs.createReadStream(samplePath).pipe(res);
    }
    return res.status(404).send('Sample dataset not generated yet');
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    return res.json({
      status: 'healthy',
      database: 'connected (file-backed JSON store)',
      datasetsCount: db.datasets.length,
      usersCount: db.users.length,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // VITE DEV SERVER INTEGRATION
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartSales] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SmartSales] Failed to start server:', err);
});
