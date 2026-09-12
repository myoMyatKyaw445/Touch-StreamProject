exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const response = await fetch("https://json.ncctrials.com/match_recommend.json", {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://yyzblive.com/'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    const cleanJson = text.substring(startIndex, endIndex + 1);
    const data = JSON.parse(cleanJson);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: "Failed to fetch China data", message: error.message }) 
    };
  }
};