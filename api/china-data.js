// api/china-data.js
export default async function handler(req, res) {
  // CORS ခွင့်ပြုချက်များ
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("🇨🇳 Fetching China match data...");
    
    const apiUrl = "https://json.ncctrials.com/match_recommend.json";
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://yyzblive.com/', // ✅ API က Block မလုပ်အောင် ထည့်ထားခြင်း
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const text = await response.text();
    
    // Bulletproof JSON Extraction (JSONP Wrapper ကို ဖြုတ်ခြင်း)
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error("Raw response:", text.substring(0, 200));
      throw new Error("No valid JSON object found in response");
    }
    
    const cleanJson = text.substring(startIndex, endIndex + 1);
    const data = JSON.parse(cleanJson);
    
    console.log("✅ China data parsed successfully. Matches:", data.data?.matches?.length || 0);
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("❌ China API Error:", error.message);
    return res.status(500).json({ 
      error: "Failed to fetch China data",
      message: error.message 
    });
  }
}