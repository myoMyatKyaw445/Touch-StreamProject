export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { roomNum } = req.query;

  if (!roomNum) {
    return res.status(400).json({ error: "roomNum is required" });
  }

  try {
    const detailUrl = `https://json.ncctrials.com/room/${roomNum}/detail.json`;
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://yyzblive.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    let cleanJson = text;
    
    // JSONP wrapper "detail(" နဲ့ ")" ကို ဖြုတ်ပါ
    if (text.startsWith('detail(') && text.endsWith(')')) {
      cleanJson = text.substring(7, text.length - 1);
    }

    const data = JSON.parse(cleanJson);
    
    if (data.code === 200 && data.data && data.data.stream) {
      return res.status(200).json({ 
        success: true, 
        stream: data.data.stream 
      });
    } else {
      return res.status(404).json({ success: false, message: "No stream data found" });
    }
    
  } catch (error) {
    console.error("❌ China Stream API Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}