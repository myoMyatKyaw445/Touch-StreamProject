export const handler = async (event, context) => {
  try {
    const roomNum = event.queryStringParameters?.roomNum;

    if (!roomNum) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "roomNum is required" })
      };
    }

    const detailUrl = `https://json.ncctrials.com/room/${roomNum}/detail.json`;
    const response = await fetch(detailUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const text = await response.text();
    let cleanJson = text;
    
    if (text.startsWith('detail(') && text.endsWith(')')) {
      cleanJson = text.substring(7, text.length - 1);
    } else {
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = text.substring(startIndex, endIndex + 1);
      }
    }

    const data = JSON.parse(cleanJson);

    if (data.code === 200 && data.data && data.data.stream) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: true, stream: data.data.stream })
      };
    } else {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No stream data" })
      };
    }
  } catch (error) {
    console.error("China Stream Function Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};