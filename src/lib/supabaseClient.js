import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const checkSubscriptionStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { isSubscribed: false };
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (error || !data) {
    return { isSubscribed: false };
  }
  
  return { 
    isSubscribed: true,
    subscription: data
  };
};

// Utility function to test Edge Functions connectivity
export const testEdgeFunctionsConnectivity = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    
    if (!jwt) {
      return { success: false, error: 'No active session found' };
    }
    
    // Simple OPTIONS request to check connectivity
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    return { 
      success: response.ok, 
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};
