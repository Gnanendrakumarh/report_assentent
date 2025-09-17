import type { Sheet1Data, Sheet2Data, Sheet3Data, Candidate, StatusThresholds } from '../types';
import { Status } from '../types';

declare const XLSX: any; // Using SheetJS from a CDN

export const parseExcelFile = <T,>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Set `raw: false` to ensure formatted text (e.g., "6/17") is read instead of raw numbers (e.g., 0.3529...).
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

        // Normalize header keys: trim whitespace to handle potential formatting issues in the Excel file
        const normalizedJson = json.map(row => {
          const newRow: {[key: string]: any} = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              newRow[key.trim()] = row[key];
            }
          }
          return newRow;
        });

        resolve(normalizedJson as T[]);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsBinaryString(file);
  });
};

const getStatus = (completedChapters: number, thresholds: StatusThresholds): Status => {
    if (completedChapters > thresholds.inProgress) { // e.g., > 14 chapters
        return Status.Completed;
    }
    if (completedChapters > thresholds.noProgress) { // e.g., > 4 chapters
        return Status.InProgress;
    }
    return Status.NoProgress; // e.g., <= 4 chapters
};

/**
 * Retrieves a value from an object using a case-insensitive and format-insensitive key.
 * e.g., getValue(row, "Chapter Completion") will match "chapter completion", "Chapter_Completion", etc.
 */
const getValue = (obj: any, targetKey: string): any => {
    const normalizedTargetKey = targetKey.toLowerCase().replace(/[\s_]/g, '');
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
            if (normalizedKey === normalizedTargetKey) {
                return obj[key];
            }
        }
    }
    return undefined;
};

const createCandidateMap = <T extends { [key: string]: any }>(data: T[]): Map<string, T> => {
    const map = new Map<string, T>();
    data.forEach(row => {
        const name = getValue(row, "Name");
        const email = getValue(row, "Email");
        const nameKey = name?.toString().trim().toLowerCase();
        const emailKey = email?.toString().trim().toLowerCase();
        
        if (nameKey) map.set(nameKey, row);
        if (emailKey && !map.has(emailKey)) map.set(emailKey, row);
    });
    return map;
};

export const mergeAndProcessData = (
    sheet1Data: Sheet1Data[], // Chapter Completion
    sheet2Data: Sheet2Data[],  // Monthly Assessment
    sheet3Data: Sheet3Data[],  // OCS Attendance
    thresholds: StatusThresholds
): Candidate[] => {

    const sheet2Map = createCandidateMap(sheet2Data);
    const sheet3Map = createCandidateMap(sheet3Data);

    const mergedData: Candidate[] = [];

    sheet1Data.forEach((row1, index) => {
        const name = getValue(row1, "Name");
        const email = getValue(row1, "Email");
        const phone = getValue(row1, "phone");
        const nameKey = name?.toString().trim().toLowerCase();
        const emailKey = email?.toString().trim().toLowerCase();
        if (!nameKey && !emailKey) return;

        const row2 = sheet2Map.get(nameKey) || (emailKey ? sheet2Map.get(emailKey) : undefined);
        const row3 = sheet3Map.get(nameKey) || (emailKey ? sheet3Map.get(emailKey) : undefined);

        // Only process candidates that exist in all three sheets
        if (row2 && row3) {
            const chapterCompletionValue = getValue(row1, "Chapter Completion");
            const chapterCompletionStr = String(chapterCompletionValue ?? '');
            
            // Use regex to robustly extract the first number for status calculation.
            // This handles various formats like "6/17", "6 OUT OF 17", etc.
            const match = chapterCompletionStr.match(/\d+/);
            const completedChapters = match ? parseInt(match[0], 10) : 0;

            const status = getStatus(completedChapters, thresholds);

            mergedData.push({
                id: `${nameKey || emailKey}-${index}`,
                cardNumber: index + 1,
                name: name,
                email: email || getValue(row2, "Email") || 'N/A',
                phone: phone ? String(phone) : undefined,
                // Display the original string from the Excel file, or 'N/A' if it was missing.
                chapterCompletion: chapterCompletionValue !== undefined ? chapterCompletionStr : 'N/A',
                marksObtained: Number(getValue(row2, "Marks Obtained") || 0),
                maxMarks: Number(getValue(row2, "Maximum Marks") || 0),
                skippedQuestions: Number(getValue(row2, "Skipped Questions") || 0),
                status,
                ocs1Status: String(getValue(row3, "OCS 1") || getValue(row3, "OCS 1 Status") || 'N/A'),
                ocs2Status: String(getValue(row3, "OCS 2") || getValue(row3, "OCS 2 Status") || 'N/A'),
            });
        }
    });

    return mergedData;
};