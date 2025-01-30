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

    const { amount, phone, country, userId, currency = 'XAF', paymentMethod } = await req.json()
    console.log('Request payload:', { amount, phone, country, userId, currency, paymentMethod })

    if (!amount || !phone || !country || !userId || !paymentMethod) {
      throw new Error('Missing required fields')
    }

    // Generate unique transaction reference
    const txRef = `SF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    try {
      // Create recharge record
      const { data: recharge, error: rechargeError } = await supabase
        .from('recharges')
        .insert({
          user_id: userId,
          amount,
          payment_method: paymentMethod,
          payment_phone: phone,
          country,
          transaction_reference: txRef,
          payment_provider: 'flutterwave',
          status: 'completed', // Set to completed immediately for testing
          provider_transaction_id: `TEST-${txRef}`
        })
        .select()
        .single()

      if (rechargeError) {
        console.error('Error creating recharge record:', rechargeError)
        throw rechargeError
      }

      console.log('Recharge record created:', recharge)

      // Update user balance immediately
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: userId,
        amount: amount
      })

      if (balanceError) {
        console.error('Error updating balance:', balanceError)
        throw balanceError
      }

      // Return success response with simulated payment data
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Test payment completed successfully",
            transactionRef: txRef
          }
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('Error in payment process:', error)
      // Clean up recharge record if payment initialization fails
      await supabase
        .from('recharges')
        .delete()
        .match({ transaction_reference: txRef })
      throw error
    }

  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})