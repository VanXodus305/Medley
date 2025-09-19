export interface MedicineWithShops {
  name: string;
  id: string;
  dosage?: string;
  shops: {
    id: string;
    name: string;
    distance: number;
    price: number;
  }[];
}

export interface ShopInfo {
  name: string;
  id: string;
  distance: string;
  location: string;
  phone: string;
}

export interface GeminiResponse {
  medicines?: MedicineWithShops[];
  response: string;
  shops?: ShopInfo[];
}

class GeminiService {
  async processUserPrompt(userPrompt: string): Promise<GeminiResponse> {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userPrompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as GeminiResponse;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      };
    }
  }

  formatMedicineResponse(data: GeminiResponse): string {
    let formattedResponse = data.response;

    if (data.medicines && data.medicines.length > 0) {
      formattedResponse += "\n\n**💊 Recommended Medicines:**\n";

      data.medicines.forEach((medicine) => {
        formattedResponse += `\n**${medicine.name}**`;
        if (medicine.dosage) {
          formattedResponse += ` - ${medicine.dosage}`;
        }

        if (medicine.shops && medicine.shops.length > 0) {
          formattedResponse += "\n*Available at:*\n";

          medicine.shops.slice(0, 3).forEach((shop) => {
            const distanceStr = shop.distance;
            formattedResponse += `• ${shop.name} - ₹${shop.price} (${distanceStr} away)\n`;
          });
        }
      });
    }

    if (data.shops && data.shops.length > 0) {
      formattedResponse += "\n\n**🏪 Nearby Shops:**\n";

      data.shops.forEach((shop) => {
        const distanceStr = shop.distance;
        formattedResponse += `• ${shop.name} - ${distanceStr} away\n  📍 ${shop.location}\n`;
      });
    }

    return formattedResponse;
  }
}

export default GeminiService;
