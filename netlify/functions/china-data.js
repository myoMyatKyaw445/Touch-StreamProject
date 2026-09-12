export const handler = async (event, context) => {
  try {
    const url = "https://json.ncctrials.com/match_recommend.json?v=" + Date.now();
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const text = await response.text();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No valid JSON found in response");
    }
    
    const cleanJson = text.substring(startIndex, endIndex + 1);
    const data = JSON.parse(cleanJson);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("China Data Function Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};