import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseDatabaseSchema } from './types/supabase';

// Safe credential resolver with fallback for build environments

export const getSafeSupabaseCredentials = () => {
  let envUrl = '';
  let envKey = '';

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
      envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
    }
  } catch {
    // Gracefully handle contexts where import.meta is not defined
  }

  let localUrl = '';
  let localKey = '';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localUrl = (window.localStorage.getItem('sim_gaji_supabase_url') || '').trim();
      localKey = (window.localStorage.getItem('sim_gaji_supabase_anon_key') || '').trim();
    }
  } catch {
    // Gracefully handle sandboxed localStorage
  }

  const activeUrl = localUrl || envUrl;
  const activeKey = localKey || envKey;

  const isConfigured = Boolean(
    activeUrl &&
    activeKey &&
    activeUrl.startsWith('http') &&
    !activeUrl.includes('your-project-id') &&
    activeKey.length > 20 &&
    !activeKey.includes('your-anon-public-key')
  );

  return {
    url: activeUrl,
    anonKey: activeKey,
    // Safe placeholder values to prevent createClient from throwing during SSR / production build
    clientUrl: isConfigured ? activeUrl : (activeUrl && activeUrl.startsWith('http') ? activeUrl : 'https://placeholder.supabase.co'),
    clientKey: isConfigured ? activeKey : (activeKey && activeKey.length > 10 ? activeKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key'),
    isConfigured,
  };
};

let cachedClient: SupabaseClient<SupabaseDatabaseSchema> | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Returns the active SupabaseClient instance. Dynamically instantiates
 * or updates the client if runtime credentials change (e.g. via Settings UI).
 */
export const getSupabaseClientInstance = (): SupabaseClient<SupabaseDatabaseSchema> => {
  const creds = getSafeSupabaseCredentials();

  if (!cachedClient || lastUsedUrl !== creds.clientUrl || lastUsedKey !== creds.clientKey) {
    cachedClient = createClient<SupabaseDatabaseSchema>(creds.clientUrl, creds.clientKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
    });
    lastUsedUrl = creds.clientUrl;
    lastUsedKey = creds.clientKey;
  }

  return cachedClient;
};

// Singleton export for direct access
export const supabase: SupabaseClient<SupabaseDatabaseSchema> = new Proxy({} as SupabaseClient<SupabaseDatabaseSchema>, {
  get(_target, prop) {
    const client = getSupabaseClientInstance();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});


/**
 * 1. Fungsi test koneksi ke Supabase saat aplikasi dimuat
 */
export async function testKoneksiSupabase(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const creds = getSafeSupabaseCredentials();
  if (!creds.isConfigured) {
    return {
      success: false,
      error: 'Kredensial Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) belum diatur.',
    };
  }

  try {
    const client = getSupabaseClientInstance();
    const { data, error } = await client
      .from('pegawai')
      .select('*')
      .order('nama_lengkap', { ascending: true })
      .limit(5);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          data: [],
          error: 'Tabel database belum dibuat di Supabase. Silakan jalankan Skema SQL di menu Pengaturan Database.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    } else {
      return {
        success: true,
        data: data || [],
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal menghubungi server Supabase',
    };
  }
}

/**
 * 2. Fungsi pengambilan data slip gaji dengan relasi foreign key pegawai:
 * Query bersih tanpa filter tahun/bulan yang menyebabkan error 400.
 */
export async function fetchSlipGajiWithPegawai(namaPeriode?: string): Promise<{
  data: any[] | null;
  listPegawai: any[] | null;
  error?: string;
}> {
  const creds = getSafeSupabaseCredentials();
  if (!creds.isConfigured) {
    return { data: null, listPegawai: null, error: 'Kredensial Supabase belum diatur' };
  }

  try {
    const client = getSupabaseClientInstance();

    // A. Query dengan foreign key relasi (nama_lengkap)
    let query = client
      .from('slip_gaji')
      .select(`
        id,
        realisasi_jp,
        gaji_bersih,
        status_approval,
        pegawai (
          id,
          nip,
          niy,
          nama_lengkap,
          jabatan,
          jenis_pegawai,
          gaji_pokok_nominal
        )
      `);

    if (namaPeriode) {
      query = query.eq('nama_periode', namaPeriode);
    }

    const { data: relationalData, error: relError } = await query;

    if (!relError && relationalData) {
      return {
        data: relationalData,
        listPegawai: null,
      };
    }

    // B. Fallback: Query tabel pegawai secara terpisah jika relasi belum didefinisikan
    const { data: listPegawai, error: pegError } = await client
      .from('pegawai')
      .select('*')
      .order('nama_lengkap', { ascending: true });

    let flatQuery = client.from('slip_gaji').select('*');
    if (namaPeriode) {
      flatQuery = flatQuery.eq('nama_periode', namaPeriode);
    }
    const { data: flatSlip, error: slipError } = await flatQuery;

    return {
      data: flatSlip || [],
      listPegawai: listPegawai || [],
      error: pegError?.message || slipError?.message,
    };
  } catch (err: any) {
    return {
      data: null,
      listPegawai: null,
      error: err?.message,
    };
  }
}

export default supabase;
