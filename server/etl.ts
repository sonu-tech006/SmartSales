import Papa from 'papaparse';
import { SalesDataRow, ETLLogRecord, DatasetRecord } from './db';

export interface ColumnProfile {
  name: string;
  inferredType: 'date' | 'number' | 'string' | 'unknown';
  nullCount: number;
  sampleValues: any[];
}

export interface CSVParseResult {
  headers: string[];
  totalRows: number;
  previewRows: Record<string, any>[];
  columnProfiles: ColumnProfile[];
  detectedMappings: {
    date?: string;
    sales?: string;
    product?: string;
    category?: string;
    quantity?: string;
    orderId?: string;
  };
}

export interface ETLValidationResult {
  validRows: Array<{
    date: string;
    revenue: number;
    product?: string;
    category?: string;
    quantity?: number;
    orderId?: string;
    raw: Record<string, any>;
  }>;
  rejectedRows: Array<{
    rowIndex: number;
    reason: string;
    data: Record<string, any>;
  }>;
  warnings: string[];
  summaryStats: {
    totalRevenue: number;
    totalOrders: number;
    startDate: string;
    endDate: string;
    categoriesCount: number;
    productsCount: number;
  };
}

// Inspect and Profile CSV Data
export function profileCSV(csvContent: string): CSVParseResult {
  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const headers = parsed.meta.fields || [];
  const rows = parsed.data || [];
  const previewRows = rows.slice(0, 15);

  const columnProfiles: ColumnProfile[] = headers.map((col) => {
    let nullCount = 0;
    let dateHits = 0;
    let numberHits = 0;
    const sampleValues: any[] = [];

    const nonNullRows = rows.filter((r) => {
      const val = r[col];
      if (val === undefined || val === null || String(val).trim() === '') {
        nullCount++;
        return false;
      }
      return true;
    });

    for (let i = 0; i < Math.min(nonNullRows.length, 50); i++) {
      const val = String(nonNullRows[i][col]).trim();
      sampleValues.push(val);

      // Check number
      const cleanNum = val.replace(/[$,€£%]/g, '');
      if (!isNaN(Number(cleanNum)) && cleanNum !== '') {
        numberHits++;
      }

      // Check date
      const timestamp = Date.parse(val);
      if (!isNaN(timestamp) && (val.includes('-') || val.includes('/') || val.includes('.'))) {
        dateHits++;
      }
    }

    let inferredType: 'date' | 'number' | 'string' | 'unknown' = 'string';
    const sampleSize = Math.min(nonNullRows.length, 50);
    if (sampleSize > 0) {
      if (dateHits / sampleSize > 0.6) inferredType = 'date';
      else if (numberHits / sampleSize > 0.7) inferredType = 'number';
    }

    return {
      name: col,
      inferredType,
      nullCount,
      sampleValues: sampleValues.slice(0, 4),
    };
  });

  // Semantic Mappings Detection
  const detectedMappings: CSVParseResult['detectedMappings'] = {};
  for (const profile of columnProfiles) {
    const lower = profile.name.toLowerCase();
    if (!detectedMappings.date && (lower.includes('date') || lower.includes('time') || profile.inferredType === 'date')) {
      detectedMappings.date = profile.name;
    } else if (
      !detectedMappings.sales &&
      (lower.includes('sales') || lower.includes('revenue') || lower.includes('amount') || lower.includes('total') || lower.includes('price'))
    ) {
      detectedMappings.sales = profile.name;
    } else if (!detectedMappings.product && (lower.includes('product') || lower.includes('item') || lower.includes('sku') || lower.includes('title'))) {
      detectedMappings.product = profile.name;
    } else if (!detectedMappings.category && (lower.includes('category') || lower.includes('department') || lower.includes('dept') || lower.includes('segment') || lower.includes('group'))) {
      detectedMappings.category = profile.name;
    } else if (!detectedMappings.quantity && (lower.includes('qty') || lower.includes('quantity') || lower.includes('units') || lower.includes('volume'))) {
      detectedMappings.quantity = profile.name;
    } else if (!detectedMappings.orderId && (lower.includes('order_id') || lower.includes('orderid') || lower.includes('order_no') || lower.includes('transaction'))) {
      detectedMappings.orderId = profile.name;
    }
  }

  return {
    headers,
    totalRows: rows.length,
    previewRows,
    columnProfiles,
    detectedMappings,
  };
}

// Parse date string into normalized YYYY-MM-DD
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // Try direct ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Try MM/DD/YYYY or DD/MM/YYYY
  const usMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (usMatch) {
    const part1 = parseInt(usMatch[1], 10);
    const part2 = parseInt(usMatch[2], 10);
    const year = usMatch[3];
    // If part1 > 12, assume DD/MM/YYYY
    if (part1 > 12) {
      return `${year}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
    }
    return `${year}-${String(part1).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

// Ingestion & ETL Processor
export function executeETLPipeline(
  csvContent: string,
  mappings: {
    date: string;
    sales: string;
    product?: string;
    category?: string;
    quantity?: string;
    orderId?: string;
  }
): ETLValidationResult {
  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const rawRows = parsed.data || [];
  const validRows: ETLValidationResult['validRows'] = [];
  const rejectedRows: ETLValidationResult['rejectedRows'] = [];
  const warnings: string[] = [];

  const seenKeys = new Set<string>();
  const categories = new Set<string>();
  const products = new Set<string>();
  const orders = new Set<string>();

  let totalRevenue = 0;
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // account for header line

    const rawDate = row[mappings.date];
    const rawSales = row[mappings.sales];

    // Check mandatory fields
    if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') {
      rejectedRows.push({
        rowIndex: rowNum,
        reason: `Missing date in column '${mappings.date}'`,
        data: row,
      });
      return;
    }

    if (rawSales === undefined || rawSales === null || String(rawSales).trim() === '') {
      rejectedRows.push({
        rowIndex: rowNum,
        reason: `Missing sales value in column '${mappings.sales}'`,
        data: row,
      });
      return;
    }

    // Normalize date
    const cleanDate = normalizeDate(String(rawDate));
    if (!cleanDate) {
      rejectedRows.push({
        rowIndex: rowNum,
        reason: `Unparseable date value '${rawDate}'`,
        data: row,
      });
      return;
    }

    // Clean numeric sales
    const cleanSalesStr = String(rawSales).replace(/[$,€£%]/g, '').trim();
    const salesNum = parseFloat(cleanSalesStr);
    if (isNaN(salesNum)) {
      rejectedRows.push({
        rowIndex: rowNum,
        reason: `Invalid numeric sales value '${rawSales}'`,
        data: row,
      });
      return;
    }

    if (salesNum < 0) {
      warnings.push(`Row ${rowNum}: Negative sales value ${salesNum} was observed`);
    }

    // Optional fields
    const product = mappings.product && row[mappings.product] ? String(row[mappings.product]).trim() : 'General Product';
    const category = mappings.category && row[mappings.category] ? String(row[mappings.category]).trim() : 'Uncategorized';
    
    let quantity: number | undefined;
    if (mappings.quantity && row[mappings.quantity]) {
      const qNum = parseInt(String(row[mappings.quantity]).replace(/,/g, ''), 10);
      if (!isNaN(qNum) && qNum >= 0) {
        quantity = qNum;
      }
    }

    const orderId = mappings.orderId && row[mappings.orderId] ? String(row[mappings.orderId]).trim() : undefined;

    // Duplicate detection key
    const dedupeKey = `${cleanDate}|${product}|${salesNum}|${orderId || ''}`;
    if (seenKeys.has(dedupeKey)) {
      warnings.push(`Row ${rowNum}: Duplicate record detected on date ${cleanDate} for product "${product}"`);
    }
    seenKeys.add(dedupeKey);

    // Track statistics
    totalRevenue += salesNum;
    if (cleanDate < minDate) minDate = cleanDate;
    if (cleanDate > maxDate) maxDate = cleanDate;
    if (category) categories.add(category);
    if (product) products.add(product);
    if (orderId) orders.add(orderId);

    validRows.push({
      date: cleanDate,
      revenue: Math.round(salesNum * 100) / 100,
      product,
      category,
      quantity,
      orderId,
      raw: row,
    });
  });

  return {
    validRows,
    rejectedRows,
    warnings: warnings.slice(0, 20),
    summaryStats: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.size || validRows.length,
      startDate: minDate === '9999-99-99' ? '' : minDate,
      endDate: maxDate === '0000-00-00' ? '' : maxDate,
      categoriesCount: categories.size,
      productsCount: products.size,
    },
  };
}
