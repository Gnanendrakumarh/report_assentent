import React, { useState, useCallback, useEffect } from 'react';
import type { Sheet1Data, Sheet2Data, Sheet3Data, Candidate, StatusThresholds } from './types';
import { mergeAndProcessData, parseExcelFile } from './services/dataProcessor';
import FileUpload from './components/FileUpload';
import CandidateCard from './components/CandidateCard';
import { ProcessorIcon } from './components/icons';

const App: React.FC = () => {
  const [sheet1Data, setSheet1Data] = useState<Sheet1Data[]>([]);
  const [sheet2Data, setSheet2Data] = useState<Sheet2Data[]>([]);
  const [sheet3Data, setSheet3Data] = useState<Sheet3Data[]>([]);
  const [mergedCandidates, setMergedCandidates] = useState<Candidate[]>([]);
  const [file1Name, setFile1Name] = useState<string | null>(null);
  const [file2Name, setFile2Name] = useState<string | null>(null);
  const [file3Name, setFile3Name] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thresholds, setThresholds] = useState<StatusThresholds>({ noProgress: 4, inProgress: 14 });
  const [ocsDates, setOcsDates] = useState({ ocs1: '', ocs2: '' });

  const handleFile1Upload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile<Sheet1Data>(file);
      setSheet1Data(data);
      setFile1Name(file.name);
    } catch (err) {
      setError('Failed to parse Sheet 1. Please check the file format and column names.');
      setSheet1Data([]);
      setFile1Name(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFile2Upload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile<Sheet2Data>(file);
      setSheet2Data(data);
      setFile2Name(file.name);
    } catch (err) {
      setError('Failed to parse Sheet 2. Please check the file format and column names.');
      setSheet2Data([]);
      setFile2Name(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFile3Upload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile<Sheet3Data>(file);
      setSheet3Data(data);
      setFile3Name(file.name);
    } catch (err) {
      setError('Failed to parse Sheet 3 (OCS Attendance). Please check the file format and column names.');
      setSheet3Data([]);
      setFile3Name(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (sheet1Data.length > 0 && sheet2Data.length > 0 && sheet3Data.length > 0) {
      setIsLoading(true);
      try {
        setError(null);
        const result = mergeAndProcessData(sheet1Data, sheet2Data, sheet3Data, thresholds);
        setMergedCandidates(result);
        if (result.length === 0) {
            setError("No matching candidates found across all three sheets. Please ensure candidate names or emails align.");
        }
      } catch (err) {
          setError(`An error occurred during data processing: ${err instanceof Error ? err.message : String(err)}`);
          setMergedCandidates([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setMergedCandidates([]);
    }
  }, [sheet1Data, sheet2Data, sheet3Data, thresholds]);

  const handleReset = () => {
    setSheet1Data([]);
    setSheet2Data([]);
    setSheet3Data([]);
    setMergedCandidates([]);
    setFile1Name(null);
    setFile2Name(null);
    setFile3Name(null);
    setError(null);
    setIsLoading(false);
    setThresholds({ noProgress: 4, inProgress: 14 });
    setOcsDates({ ocs1: '', ocs2: '' });

    const fileInput1 = document.getElementById('file-upload-1') as HTMLInputElement;
    if (fileInput1) fileInput1.value = '';
    const fileInput2 = document.getElementById('file-upload-2') as HTMLInputElement;
    if (fileInput2) fileInput2.value = '';
    const fileInput3 = document.getElementById('file-upload-3') as HTMLInputElement;
    if (fileInput3) fileInput3.value = '';
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOcsDates(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4">
            <ProcessorIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Assessment Reporting Assistant
            </h1>
          </div>
          <p className="mt-4 text-lg text-slate-400">
            Upload chapter completion, assessment, and OCS attendance sheets to generate reports.
          </p>
        </header>

        <main>
          <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <FileUpload
                id="file-upload-1"
                label="Sheet 1: Chapter Completion"
                onFileUpload={handleFile1Upload}
                fileName={file1Name}
                description="Contains Name, Email, Phone, and Chapter Completion."
              />
              <FileUpload
                id="file-upload-2"
                label="Sheet 2: Monthly Assessment"
                onFileUpload={handleFile2Upload}
                fileName={file2Name}
                description="Contains Name, Email, Marks, and Skipped Questions."
              />
              <FileUpload
                id="file-upload-3"
                label="Sheet 3: OCS Attendance"
                onFileUpload={handleFile3Upload}
                fileName={file3Name}
                description="Contains Name & OCS attendance status (e.g., OCS 1, OCS 2)."
              />
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-center text-white mb-4">Customize Status Thresholds</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8">
                  <div className="flex items-center gap-2">
                      <label htmlFor="no-progress-max" className="text-sm text-slate-400 whitespace-nowrap">"No Progress" ends at:</label>
                      <input 
                          type="number" 
                          id="no-progress-max"
                          value={thresholds.noProgress}
                          onChange={(e) => setThresholds(t => ({...t, noProgress: parseInt(e.target.value, 10) || 0}))}
                          className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <span className="text-sm text-slate-400">chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <label htmlFor="in-progress-max" className="text-sm text-slate-400 whitespace-nowrap">"In Progress" ends at:</label>
                      <input 
                          type="number" 
                          id="in-progress-max"
                          value={thresholds.inProgress}
                          onChange={(e) => setThresholds(t => ({...t, inProgress: parseInt(e.target.value, 10) || 0}))}
                          className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <span className="text-sm text-slate-400">chapters</span>
                  </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-center text-white mb-4">Set OCS Dates</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8">
                <div className="flex items-center gap-2">
                  <label htmlFor="ocs1-date" className="text-sm text-slate-400 whitespace-nowrap">OCS 1 Date:</label>
                  <input 
                    type="date" 
                    id="ocs1-date"
                    name="ocs1"
                    value={ocsDates.ocs1}
                    onChange={handleDateChange}
                    className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    aria-label="OCS 1 Date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="ocs2-date" className="text-sm text-slate-400 whitespace-nowrap">OCS 2 Date:</label>
                  <input 
                    type="date" 
                    id="ocs2-date"
                    name="ocs2"
                    value={ocsDates.ocs2}
                    onChange={handleDateChange}
                    className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    aria-label="OCS 2 Date"
                  />
                </div>
              </div>
            </div>

             {(file1Name || file2Name || file3Name) && (
                 <div className="mt-6 pt-6 border-t border-slate-700 flex justify-center">
                    <button
                        onClick={handleReset}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        Reset
                    </button>
                 </div>
             )}
          </div>
          
          {isLoading && (
            <div className="text-center text-cyan-400">
                <p className="text-lg">Processing data...</p>
            </div>
          )}

          {error && (
            <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
            </div>
          )}

          {mergedCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mergedCandidates.map((candidate) => (
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate} 
                  ocs1Date={ocsDates.ocs1}
                  ocs2Date={ocsDates.ocs2}
                />
              ))}
            </div>
          ) : !isLoading && !error && (file1Name || file2Name || file3Name) && (
            <div className="text-center text-slate-500 py-16">
              <p>Please upload all three sheets to generate reports.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;