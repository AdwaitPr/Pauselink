'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../lib/supabase/client';
import { ScanRecord, AnalysisReportDto } from '@pauselink/types';

export function useRealtimeScans() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Initialize session and fetch scans
  const refreshScans = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let currentUserId = session?.user?.id;

      if (!currentUserId) {
        // Sign in anonymously if no session exists
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (!authError && authData?.user) {
          currentUserId = authData.user.id;
        }
      }

      setUserId(currentUserId || null);

      if (currentUserId) {
        const { data, error } = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setScans(data as ScanRecord[]);
        }
      }
    } catch (err) {
      console.warn('Supabase fetch error or offline mode:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshScans();

    // Subscribe to Realtime CDC changes on the 'scans' table
    const channel = supabase
      .channel('scans-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scans' },
        (payload) => {
          const newScan = payload.new as ScanRecord;
          setScans((prev) => {
            // Avoid duplicates
            if (prev.some((s) => s.id === newScan.id)) return prev;
            return [newScan, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'scans' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setScans((prev) => prev.filter((s) => s.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshScans]);

  const saveScan = async (inputText: string, report: AnalysisReportDto, origin: 'ANDROID' | 'WEB' = 'WEB') => {
    const newRecord: Partial<ScanRecord> = {
      user_id: userId || 'anonymous',
      source: report.source,
      input_text: inputText,
      overall_score: report.overall.score,
      risk_band: report.overall.band,
      links_count: report.links.length,
      report_json: report,
      device_origin: origin,
    };

    try {
      if (userId && userId !== 'anonymous') {
        const { data, error } = await supabase.from('scans').insert(newRecord).select().single();
        if (!error && data) {
          setScans((prev) => [data as ScanRecord, ...prev.filter((s) => s.id !== data.id)]);
          return data as ScanRecord;
        }
      }
    } catch (err) {
      console.warn('Failed to sync to Supabase, saving locally:', err);
    }

    // Local in-memory fallback
    const localRecord: ScanRecord = {
      ...(newRecord as ScanRecord),
      id: 'local-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setScans((prev) => [localRecord, ...prev]);
    return localRecord;
  };

  const deleteScan = async (id: string) => {
    setScans((prev) => prev.filter((s) => s.id !== id));
    try {
      if (userId && userId !== 'anonymous' && !id.startsWith('local-')) {
        await supabase.from('scans').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Failed to delete from Supabase:', err);
    }
  };

  return {
    scans,
    loading,
    userId,
    saveScan,
    deleteScan,
    refreshScans,
  };
}
