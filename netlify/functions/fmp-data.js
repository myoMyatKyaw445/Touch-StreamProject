// netlify/functions/fmp-data.js

export const handler = async (event, context) => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/myoMyatKyaw445/m_live_data/main/fmp_data.json"
    );

    if (!response.ok) {
      throw new Error("GitHub ကနေ Data မရယူနိုင်ပါ");
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};