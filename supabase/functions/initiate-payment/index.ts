import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
    if (!FLUTTERWAVE_SECRET_KEY) {
      console.error('FLUTTERWAVE_SECRET_KEY is not set')
      throw new Error('Configuration error: FLUTTERWAVE_SECRET_KEY is not set')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables are not set')
      throw new Error('Configuration error: Supabase environment variables are not set')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get and validate request body
    const { amount, phone, country, userId, currency = 'XAF' } = await req.json()
    console.log('Request payload:', { amount, phone, country, userId, currency })

    if (!amount || !phone || !country || !userId) {
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
          payment_method: 'mobile_money',
          payment_phone: phone,
          country,
          transaction_reference: txRef,
          payment_provider: 'flutterwave',
          status: 'pending'
        })
        .select()
        .single()

      if (rechargeError) {
        console.error('Error creating recharge record:', rechargeError)
        throw rechargeError
      }

      console.log('Recharge record created:', recharge)

      // Initialize Flutterwave payment
      const flutterwavePayload = {
        tx_ref: txRef,
        amount,
        currency,
        payment_type: 'mobile_money',
        country,
        phone_number: phone,
        email: `${phone}@sendflow.com`,
        redirect_url: `${Deno.env.get('PUBLIC_SITE_URL')}/dashboard`,
      }
      console.log('Flutterwave payload:', flutterwavePayload)

      const response = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flutterwavePayload)
      })

      const flutterwaveResponse = await response.json()
      console.log('Flutterwave response:', flutterwaveResponse)

      if (!response.ok) {
        console.error('Flutterwave error:', flutterwaveResponse)
        throw new Error(flutterwaveResponse.message || 'Failed to initialize payment')
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            paymentLink: flutterwaveResponse.data.link,
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