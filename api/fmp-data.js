// api/fmp-data.js

export default async function handler(req, res) {
  try {
    // GitHub Raw URL ကနေ Data ကို ဆွဲယူမယ်
    const response = await fetch(
      "https://raw.githubusercontent.com/myoMyatKyaw445/m_live_data/main/fmp_data.json",
      {
        // ၆၀ စက္ကန့်အတွင်း င်လာတဲ့ Request အကုန်လုံးကို Cache လုပ်ထားမယ် (GitHub မပိတ်အောင်)
        next: { revalidate: 5 } 
      }
    );

    if (!response.ok) {
      throw new Error("GitHub ကနေ Data မရယူနိုင်ပါ");
    }

    const data = await response.json();

    // ရလာတဲ့ Data ကို React Frontend ကို ပြန်ပို့မယ်
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}