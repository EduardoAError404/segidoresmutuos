import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  id: string;
  username: string;
  full_name: string;
  is_verified: boolean;
}

async function getInstagramData(username: string, type: 'followers' | 'following', sessionId: string) {
  console.log(`Fetching ${type} for user: ${username}`);
  
  // Instagram's GraphQL endpoint
  const userId = await getUserId(username, sessionId);
  if (!userId) {
    throw new Error('Could not find user ID');
  }

  const users: UserData[] = [];
  let hasNextPage = true;
  let endCursor = null;
  
  while (hasNextPage) {
    const queryHash = type === 'followers' ? 'c76146de99bb02f6415203be841dd25a' : 'd04b0a864b4b54837c0d870b0e77e076';
    const variables = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: 50,
      after: endCursor,
    };
    
    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
    
    const response = await fetch(url, {
      headers: {
        'cookie': `sessionid=${sessionId}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-ig-app-id': '936619743392459',
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const edgeKey = type === 'followers' ? 'edge_followed_by' : 'edge_follow';
    const edges = data.data.user[edgeKey].edges;
    
    for (const edge of edges) {
      users.push({
        id: edge.node.id,
        username: edge.node.username,
        full_name: edge.node.full_name,
        is_verified: edge.node.is_verified,
      });
    }
    
    hasNextPage = data.data.user[edgeKey].page_info.has_next_page;
    endCursor = data.data.user[edgeKey].page_info.end_cursor;
    
    // Limit to prevent timeout
    if (users.length >= 500) break;
  }
  
  return users;
}

async function getUserId(username: string, sessionId: string): Promise<string | null> {
  const response = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
    headers: {
      'cookie': `sessionid=${sessionId}`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.graphql?.user?.id || null;
}

function formatAsCSV(users: UserData[]): string {
  const header = 'ID,User Name,Full Name,Profile URL,Verified\n';
  const rows = users.map((user, index) => {
    return `${index + 1},${user.username},"${user.full_name}",https://www.instagram.com/${user.username},${user.is_verified ? 'Yes' : 'No'}`;
  }).join('\n');
  
  return header + rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, type, sessionId } = await req.json();
    
    if (!username || !type || !sessionId) {
      throw new Error('Missing required fields: username, type, or sessionId');
    }

    if (type !== 'followers' && type !== 'following') {
      throw new Error('Type must be either "followers" or "following"');
    }

    console.log(`Processing request for ${username} - ${type}`);
    
    const users = await getInstagramData(username, type, sessionId);
    const csv = formatAsCSV(users);
    
    return new Response(
      JSON.stringify({ success: true, csv, count: users.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in instagram-scraper:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        hint: 'Make sure your sessionId is valid. To get it: 1) Open Instagram in browser, 2) Open DevTools (F12), 3) Go to Application/Storage tab, 4) Find "sessionid" cookie'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
