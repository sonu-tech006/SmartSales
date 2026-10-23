import fs from 'fs';
import path from 'path';
import { db, saveDb, UserRecord, DatasetRecord, SalesDataRow } from './db';
import { hashPassword } from './auth';

export const SAMPLE_PRODUCTS = [
  { name: 'Ergonomic Desk Chair Pro', category: 'Office Furniture', basePrice: 289, vol: 4 },
  { name: 'UltraWide Curved Monitor 34"', category: 'Electronics & Gadgets', basePrice: 549, vol: 3 },
  { name: 'Noise-Cancelling Wireless Headphones', category: 'Electronics & Gadgets', basePrice: 199, vol: 8 },
  { name: 'Mechanical Keyboard RGB', category: 'Electronics & Gadgets', basePrice: 129, vol: 6 },
  { name: 'Solid Wood Standing Desk', category: 'Office Furniture', basePrice: 489, vol: 2 },
  { name: 'Smart Hydro Water Bottle 1L', category: 'Home & Kitchen', basePrice: 39, vol: 12 },
  { name: 'Ceramic Pour-Over Coffee Maker', category: 'Home & Kitchen', basePrice: 45, vol: 9 },
  { name: 'Merino Wool Minimalist Pullover', category: 'Apparel & Footwear', basePrice: 85, vol: 7 },
  { name: 'Weatherproof Laptop Backpack 25L', category: 'Apparel & Footwear', basePrice: 110, vol: 5 },
  { name: 'Anodized Aluminum USB-C Hub 8-in-1', category: 'Electronics & Gadgets', basePrice: 65, vol: 11 },
];

export const TECH_PRODUCTS = [
  { name: 'AI Edge Acceleration TPU Kit', category: 'Compute & AI', basePrice: 890, vol: 5 },
  { name: 'Smart Home Hub Gateway v3', category: 'IoT & Smart Home', basePrice: 149, vol: 14 },
  { name: 'LiDAR Robotics Sensor Suite', category: 'Sensors & Hardware', basePrice: 420, vol: 6 },
  { name: 'Thunderbolt 4 Docking Station Pro', category: 'Connectivity', basePrice: 279, vol: 9 },
  { name: 'Studio Condenser Microphone XLR', category: 'Audio Engineering', basePrice: 229, vol: 8 },
];

export function ensureSampleData() {
  // 1. Ensure Default Demo User exists
  let demoUser = db.users.find((u) => u.email === 'analyst@smartsales.io');
  if (!demoUser) {
    demoUser = {
      id: 'usr_demo_89324',
      name: 'Sarah Chen',
      email: 'analyst@smartsales.io',
      passwordHash: hashPassword('SalesDemo2026!'),
      role: 'Senior Data Analyst',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      preferences: {
        theme: 'light',
        emailNotifications: true,
        defaultHorizon: 30,
      },
    };
    db.users.push(demoUser);
  }

  // 2. Ensure Retail Sample Dataset exists
  let dataset1 = db.datasets.find((d) => d.id === 'ds_retail_sample_2026');
  if (!dataset1) {
    const datasetId = 'ds_retail_sample_2026';
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const today = new Date();

    const sampleRows: SalesDataRow[] = [];
    const csvLines: string[] = ['OrderDate,Product,Category,UnitsSold,UnitPrice,TotalRevenue,OrderID'];

    let orderCounter = 10001;
    let totalRevenue = 0;
    const curr = new Date(startDate);

    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayOfWeek = curr.getUTCDay();
      const dayMultiplier = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 1.35 : 1.0;
      const dailyTransactions = Math.floor(3 * dayMultiplier) + (orderCounter % 3);

      for (let t = 0; t < dailyTransactions; t++) {
        const prodIndex = (orderCounter + t) % SAMPLE_PRODUCTS.length;
        const prod = SAMPLE_PRODUCTS[prodIndex];
        const units = Math.max(1, Math.round(prod.vol * 0.4 + ((orderCounter * 7) % 5)));
        const unitPrice = prod.basePrice;
        const rowRevenue = Math.round(units * unitPrice * 100) / 100;
        const orderId = `ORD-${orderCounter}`;

        totalRevenue += rowRevenue;
        orderCounter++;

        sampleRows.push({
          id: `row_${sampleRows.length + 1}`,
          datasetId,
          userId: demoUser.id,
          date: dateStr,
          revenue: rowRevenue,
          product: prod.name,
          category: prod.category,
          quantity: units,
          orderId,
          raw: {
            OrderDate: dateStr,
            Product: prod.name,
            Category: prod.category,
            UnitsSold: units,
            UnitPrice: unitPrice,
            TotalRevenue: rowRevenue,
            OrderID: orderId,
          },
        });

        csvLines.push(`${dateStr},"${prod.name}","${prod.category}",${units},${unitPrice},${rowRevenue},${orderId}`);
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    dataset1 = {
      id: datasetId,
      userId: demoUser.id,
      name: 'Global Enterprise Retail 2025-2026',
      description: 'Comprehensive 12-month omnichannel sales data featuring 10 top product lines across 4 core departments.',
      filename: 'global_enterprise_retail_sales.csv',
      fileSizeBytes: csvLines.join('\n').length,
      rowCount: sampleRows.length,
      validRowCount: sampleRows.length,
      rejectedRowCount: 0,
      columns: ['OrderDate', 'Product', 'Category', 'UnitsSold', 'UnitPrice', 'TotalRevenue', 'OrderID'],
      columnMappings: {
        date: 'OrderDate',
        sales: 'TotalRevenue',
        product: 'Product',
        category: 'Category',
        quantity: 'UnitsSold',
        orderId: 'OrderID',
      },
      summaryStats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: sampleRows.length,
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        categoriesCount: 4,
        productsCount: SAMPLE_PRODUCTS.length,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.datasets.push(dataset1);
    db.salesRows.push(...sampleRows);

    db.etlLogs.push({
      id: 'etl_sample_init_01',
      datasetId,
      userId: demoUser.id,
      filename: 'global_enterprise_retail_sales.csv',
      fileSizeBytes: dataset1.fileSizeBytes,
      status: 'SUCCESS',
      totalRows: sampleRows.length,
      validRows: sampleRows.length,
      rejectedRows: 0,
      warnings: ['Dataset verified: 0 schema anomalies or missing timestamps detected.'],
      durationMs: 82,
      timestamp: new Date().toISOString(),
    });

    try {
      const sampleDir = path.resolve(process.cwd(), 'sample_data');
      if (!fs.existsSync(sampleDir)) {
        fs.mkdirSync(sampleDir, { recursive: true });
      }
      fs.writeFileSync(path.join(sampleDir, 'global_retail_sales.csv'), csvLines.join('\n'), 'utf-8');
    } catch (e) {
      console.warn('Could not write sample_data CSV file:', e);
    }
  }

  // 3. Ensure 2nd Dataset: TechGear High-Volatility Hardware
  let dataset2 = db.datasets.find((d) => d.id === 'ds_techgear_volatility_2026');
  if (!dataset2) {
    const datasetId = 'ds_techgear_volatility_2026';
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 8);
    const today = new Date();

    const techRows: SalesDataRow[] = [];
    let orderNum = 50001;
    let techTotalRev = 0;
    const curr = new Date(startDate);

    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      const dow = curr.getUTCDay();
      // Tech hardware spikes heavily on Tuesdays and Thursdays (B2B procurement)
      const multiplier = dow === 2 || dow === 4 ? 1.6 : 0.8;
      const count = Math.max(1, Math.round(2 * multiplier + (orderNum % 3)));

      for (let t = 0; t < count; t++) {
        const prod = TECH_PRODUCTS[(orderNum + t) % TECH_PRODUCTS.length];
        const units = Math.max(1, Math.round(prod.vol * 0.5 + ((orderNum * 3) % 4)));
        const rev = Math.round(units * prod.basePrice * 100) / 100;
        const ordId = `TECH-${orderNum}`;
        techTotalRev += rev;
        orderNum++;

        techRows.push({
          id: `tech_row_${techRows.length + 1}`,
          datasetId,
          userId: demoUser.id,
          date: dateStr,
          revenue: rev,
          product: prod.name,
          category: prod.category,
          quantity: units,
          orderId: ordId,
          raw: {
            Date: dateStr,
            HardwareModel: prod.name,
            Sector: prod.category,
            Units: units,
            Price: prod.basePrice,
            Revenue: rev,
            OrderRef: ordId,
          },
        });
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    dataset2 = {
      id: datasetId,
      userId: demoUser.id,
      name: 'TechGear Hardware & IoT Procurement',
      description: 'High-volatility enterprise hardware and IoT telemetry components with cyclic B2B procurement spikes.',
      filename: 'techgear_hardware_procurement.csv',
      fileSizeBytes: 68000,
      rowCount: techRows.length,
      validRowCount: techRows.length,
      rejectedRowCount: 0,
      columns: ['Date', 'HardwareModel', 'Sector', 'Units', 'Price', 'Revenue', 'OrderRef'],
      columnMappings: {
        date: 'Date',
        sales: 'Revenue',
        product: 'HardwareModel',
        category: 'Sector',
        quantity: 'Units',
        orderId: 'OrderRef',
      },
      summaryStats: {
        totalRevenue: Math.round(techTotalRev * 100) / 100,
        totalOrders: techRows.length,
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        categoriesCount: 5,
        productsCount: TECH_PRODUCTS.length,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.datasets.push(dataset2);
    db.salesRows.push(...techRows);
  }

  saveDb();
}
