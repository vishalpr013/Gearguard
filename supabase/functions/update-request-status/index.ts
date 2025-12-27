import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type Status = 'New' | 'In Progress' | 'Repaired' | 'Scrap';

interface UpdateStatusPayload {
  request_id: string;
  new_status: Status;
  duration_hours?: number;
}

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  'New': ['In Progress'],
  'In Progress': ['Repaired', 'Scrap'],
  'Repaired': [],
  'Scrap': [],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload: UpdateStatusPayload = await req.json();

    if (!payload.request_id || !payload.new_status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: request_id, new_status' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*, equipment:equipment_id(id, assigned_team_id)')
      .eq('id', payload.request_id)
      .maybeSingle();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const currentStatus = request.status as Status;
    const validTransitions = VALID_TRANSITIONS[currentStatus];

    if (!validTransitions.includes(payload.new_status)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid transition from ${currentStatus} to ${payload.new_status}. Valid transitions: ${validTransitions.join(', ')}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payload.new_status === 'Repaired' && !payload.duration_hours) {
      return new Response(
        JSON.stringify({ error: 'duration_hours is required when transitioning to Repaired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const updateData: Record<string, unknown> = {
      status: payload.new_status,
    };

    if (payload.duration_hours) {
      (updateData as Record<string, unknown>).duration_hours = payload.duration_hours;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', payload.request_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payload.new_status === 'Scrap' && request.equipment) {
      const equipment = Array.isArray(request.equipment) ? request.equipment[0] : request.equipment;
      await supabase
        .from('equipment')
        .update({ is_scrapped: true })
        .eq('id', equipment.id);
    }

    return new Response(
      JSON.stringify({ data: updatedRequest }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});