// Edge function types are automatically available in Deno Deploy

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_KEY = Deno.env.get('LOVABLE_API_KEY');

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
    const variables: Record<string, any> = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: 50,
      after: endCursor,
    };
    
    const url: string = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
    
    const response: Response = await fetch(url, {
      headers: {
        'cookie': `sessionid=${sessionId}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-ig-app-id': '936619743392459',
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data: any = await response.json();
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

async function classifyGender(name: string): Promise<'male' | 'female' | 'unknown'> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { 
            role: 'system', 
            content: 'You are a name gender classifier. Respond ONLY with "male", "female", or "unknown". Consider names from all cultures and languages.' 
          },
          { 
            role: 'user', 
            content: `Classify the gender of this name: "${name}". Respond with only one word: male, female, or unknown.` 
          }
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.error('AI classification error:', await response.text());
      return 'unknown';
    }

    const data = await response.json();
    const result = data.choices[0].message.content.trim().toLowerCase();
    
    if (result === 'male' || result === 'female') {
      return result;
    }
    return 'unknown';
  } catch (error) {
    console.error('Error classifying gender:', error);
    return 'unknown';
  }
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
    
    const allUsers = await getInstagramData(username, type, sessionId);
    
    // Filter users without names
    const usersWithNames = allUsers.filter(user => user.full_name && user.full_name.trim().length > 0);
    console.log(`Filtered to ${usersWithNames.length} users with names (from ${allUsers.length} total)`);
    
    // Classify gender for each user
    const maleUsers: UserData[] = [];
    for (const user of usersWithNames) {
      const gender = await classifyGender(user.full_name);
      console.log(`User ${user.username} (${user.full_name}): ${gender}`);
      if (gender === 'male') {
        maleUsers.push(user);
      }
    }
    
    console.log(`Final result: ${maleUsers.length} male users`);
    const csv = formatAsCSV(maleUsers);
    
    return new Response(
      JSON.stringify({ success: true, csv, count: maleUsers.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in instagram-scraper:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        hint: 'Make sure your sessionId is valid. To get it: 1) Open Instagram in browser, 2) Open DevTools (F12), 3) Go to Application/Storage tab, 4) Find "sessionid" cookie'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
