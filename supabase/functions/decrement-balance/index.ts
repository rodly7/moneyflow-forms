
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { user_id, amount } = await req.json()
    
    if (!user_id || amount === undefined) {
      throw new Error('Missing required fields: user_id and amount')
    }
    
    // First, get the current balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single()
    
    if (profileError) {
      throw profileError
    }
    
    // Update the balance
    const newBalance = profile.balance - amount
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user_id)
    
    if (updateError) {
      throw updateError
    }
    
    return new Response(
      JSON.stringify({ success: true, balance: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
