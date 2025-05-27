import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Theme } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface JobProgress {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface UploadProgressProps {
  theme: Theme;
  jobIds: string[];
  onJobComplete?: (jobId: string) => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  theme,
  jobIds,
  onJobComplete,
}) => {
  const [jobs, setJobs] = useState<Map<string, JobProgress>>(new Map());
  const { on, off } = useWebSocket();

  useEffect(() => {
    // Initialize jobs
    const initialJobs = new Map<string, JobProgress>();
    jobIds.forEach(jobId => {
      initialJobs.set(jobId, {
        jobId,
        status: 'processing',
        progress: 0,
      });
    });
    setJobs(initialJobs);

    // Handle job progress updates
    const handleJobProgress = (payload: { job_id: string; progress: number; status: string }) => {
      setJobs(prev => {
        const updated = new Map(prev);
        const job = updated.get(payload.job_id);
        if (job) {
          job.progress = payload.progress;
          job.status = payload.status as any;
        }
        return updated;
      });
    };

    // Handle job completion
    const handleJobCompleted = (payload: { job_id: string }) => {
      setJobs(prev => {
        const updated = new Map(prev);
        const job = updated.get(payload.job_id);
        if (job) {
          job.status = 'completed';
          job.progress = 100;
        }
        return updated;
      });
      onJobComplete?.(payload.job_id);
    };

    // Handle job failure
    const handleJobFailed = (payload: { job_id: string; error: string }) => {
      setJobs(prev => {
        const updated = new Map(prev);
        const job = updated.get(payload.job_id);
        if (job) {
          job.status = 'failed';
          job.error = payload.error;
        }
        return updated;
      });
    };

    // Register event handlers
    on('job-progress', handleJobProgress);
    on('job-completed', handleJobCompleted);
    on('job-failed', handleJobFailed);

    // Cleanup
    return () => {
      off('job-progress');
      off('job-completed');
      off('job-failed');
    };
  }, [jobIds, on, off, onJobComplete]);

  if (jobs.size === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Upload Progress</h4>
      {Array.from(jobs.values()).map(job => (
        <div
          key={job.jobId}
          className={`p-3 rounded-lg border ${theme.border} ${theme.cardBg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Job: {job.jobId.slice(0, 8)}...
            </span>
            <div className="flex items-center space-x-2">
              {job.status === 'processing' && (
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
              )}
              {job.status === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {job.status === 'failed' && (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${theme.textSecondary}`}>
                {job.status}
              </span>
            </div>
          </div>
          
          {job.status === 'processing' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
          
          {job.error && (
            <p className="text-sm text-red-500 mt-2">{job.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}; 