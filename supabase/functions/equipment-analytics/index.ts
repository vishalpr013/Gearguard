import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EquipmentStats {
  equipment_id: string;
  equipment_name: string;
  breakdown_count: number;
  avg_repair_time: number;
  is_high_risk: boolean;
  active_request_count: number;
}

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const equipmentId = url.searchParams.get('equipment_id');

    let equipmentQuery = supabase
      .from('equipment')
      .select('id, name, is_scrapped');

    if (equipmentId) {
      equipmentQuery = equipmentQuery.eq('id', equipmentId);
    }

    const { data: equipment, error: equipmentError } = await equipmentQuery;

    if (equipmentError) {
      return new Response(
        JSON.stringify({ error: equipmentError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stats: EquipmentStats[] = [];

    for (const eq of equipment) {
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('type, status, duration_hours')
        .eq('equipment_id', eq.id);

      if (requestsError) {
        continue;
      }

      const correctiveRequests = requests.filter(r => r.type === 'Corrective');
      const breakdownCount = correctiveRequests.length;
      
      const completedRequests = requests.filter(
        r => r.status === 'Repaired' && r.duration_hours !== null
      );
      
      const totalHours = completedRequests.reduce(
        (sum, r) => sum + (r.duration_hours || 0),
        0
      );
      
      const avgRepairTime = completedRequests.length > 0 
        ? totalHours / completedRequests.length 
        : 0;

      const activeRequestCount = requests.filter(
        r => r.status === 'New' || r.status === 'In Progress'
      ).length;

      const isHighRisk = breakdownCount > 3 || avgRepairTime > 24;

      stats.push({
        equipment_id: eq.id,
        equipment_name: eq.name,
        breakdown_count: breakdownCount,
        avg_repair_time: Math.round(avgRepairTime * 100) / 100,
        is_high_risk: isHighRisk,
        active_request_count: activeRequestCount,
      });
    }

    return new Response(
      JSON.stringify({ data: equipmentId ? stats[0] : stats }),
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