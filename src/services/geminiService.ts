export interface MedicineWithShops {
  name: string;
  id: string;
  dosage?: string;
  shops: {
    id: string;
    name: string;
    distance: number;
    price?: number;
  }[];
}

export interface ShopInfo {
  name: string;
  id: string;
  distance: string;
  location: string;
  phone: string;
}

export interface ShopWithCoverage {
  name: string;
  id: string;
  distance: string | number;
  location: string;
  phone: string;
  coverage?: number;
  coveredCount?: number;
  requiredCount?: number;
  totalPrice?: number;
  available?: boolean;
}

export interface GeminiResponse {
  medicines?: MedicineWithShops[];
  response: string;
  shops?: ShopInfo[];
  queryType?: "symptoms" | "medicines";
}

export interface FindShopsResponse {
  response: string;
  shops: ShopWithCoverage[];
  requestedMedicines: { id: string; name: string }[];
  queryType?: "medicines";
}

class GeminiService {
  /**
   * Detects if user input is a list of medicines or natural language symptoms
   */
  private isMedicineList(input: string): boolean {
    // Look for patterns that suggest a medicine list:
    // - Multiple words separated by commas or "and"
    // - Short medicine names (usually under 30 chars per item)
    // - Presence of "medicine", "medicines", "find shops for", "where can I find"

    const medicineKeywords = [
      "find shops",
      "where can i find",
      "where to find",
      "which shops have",
      "shops for",
      "available at",
    ];

    const lowerInput = input.toLowerCase();
    if (medicineKeywords.some((keyword) => lowerInput.includes(keyword))) {
      return true;
    }

    // If input has multiple comma-separated items and each is relatively short
    const items = input.split(/[,;]|\s+and\s+/i);
    if (
      items.length >= 2 &&
      items.every((item) => item.trim().length < 50 && item.trim().length > 2)
    ) {
      // Likely a list of medicines
      return true;
    }

    return false;
  }

  /**
   * Process user prompt - routes to appropriate endpoint
   */
  async processUserPrompt(
    userPrompt: string,
  ): Promise<GeminiResponse | FindShopsResponse> {
    try {
      if (this.isMedicineList(userPrompt)) {
        // Parse medicine list and call find-shops endpoint
        return await this.findShopsForMedicines(userPrompt);
      } else {
        // Call symptoms endpoint
        return await this.processSymptomsQuery(userPrompt);
      }
    } catch (error) {
      console.error("Error processing user prompt:", error);
      return {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      };
    }
  }

  /**
   * Process natural language symptoms
   */
  private async processSymptomsQuery(
    symptoms: string,
  ): Promise<GeminiResponse> {
    try {
      const response = await fetch("/api/symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        queryType: "symptoms",
      } as GeminiResponse;
    } catch (error) {
      console.error("Error calling symptoms API:", error);
      return {
        response:
          "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
      };
    }
  }

  /**
   * Process medicine list query - find best shops
   */
  private async findShopsForMedicines(
    input: string,
  ): Promise<FindShopsResponse> {
    try {
      // Remove common prefixes first
      let cleanInput = input;
      const prefixes = [
        /^find shops for\s+/i,
        /^where can i find\s+/i,
        /^where to find\s+/i,
        /^which shops have\s+/i,
        /^shops for\s+/i,
        /^available at\s+/i,
      ];

      for (const prefix of prefixes) {
        cleanInput = cleanInput.replace(prefix, "").trim();
      }

      // Parse the medicine list from cleaned input
      const medicines = cleanInput
        .split(/[,;]|\s+and\s+/)
        .map((med) => med.trim())
        .filter((med) => med.length > 0);

      if (medicines.length === 0 || cleanInput.length === 0) {
        return {
          response:
            "I couldn't find any medicines in your request. Please specify the medicines you're looking for (e.g., 'Paracetamol and Ibuprofen' or 'Find shops for Aspirin, Cough Syrup').",
          shops: [],
          requestedMedicines: [],
          queryType: "medicines",
        };
      }

      console.log("Searching for medicines:", medicines);

      const response = await fetch("/api/shopping/find-shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medicines }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend error response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // If backend returns no shops but no error, provide helpful message
      if (data.shops && data.shops.length === 0) {
        return {
          response: `I searched for: ${medicines.join(", ")}. Unfortunately, I couldn't find these medicines in any nearby shops. These medicines might not be in stock currently, or they might not be available in your area. Would you like to search for similar medicines instead?`,
          shops: [],
          requestedMedicines:
            data.requestedMedicines ||
            medicines.map((m) => ({ id: m, name: m })),
          queryType: "medicines",
        };
      }

      return {
        ...data,
        queryType: "medicines",
      } as FindShopsResponse;
    } catch (error) {
      console.error("Error calling find-shops API:", error);
      return {
        response:
          "I'm sorry, I'm experiencing some technical difficulties while searching for shops. Please try again later.",
        shops: [],
        requestedMedicines: [],
        queryType: "medicines",
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
            const distanceStr =
              typeof shop.distance === "number"
                ? `${shop.distance} km`
                : shop.distance;
            formattedResponse += `• ${shop.name} - ${shop.price ? `₹${shop.price}` : "Price unavailable"} (${distanceStr} away)\n`;
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

  formatShopsResponse(data: FindShopsResponse): string {
    let formattedResponse = data.response;

    if (data.requestedMedicines && data.requestedMedicines.length > 0) {
      formattedResponse += "\n\n**💊 Requested Medicines:**\n";
      data.requestedMedicines.forEach((med) => {
        formattedResponse += `• ${med.name}\n`;
      });
    }

    if (data.shops && data.shops.length > 0) {
      formattedResponse += "\n\n**🏪 Best Shops to Visit:**\n";

      data.shops.forEach((shop) => {
        const distanceStr =
          typeof shop.distance === "number"
            ? `${shop.distance.toFixed(1)} km`
            : shop.distance;
        const coverageStr =
          shop.coverage !== undefined
            ? `${(shop.coverage * 100).toFixed(0)}% items available`
            : "";
        const priceStr =
          shop.totalPrice && shop.totalPrice > 0
            ? `₹${shop.totalPrice} total`
            : "";

        formattedResponse += `\n• **${shop.name}**\n`;
        formattedResponse += `  📍 ${shop.location}\n`;
        formattedResponse += `  📞 ${shop.phone}\n`;
        formattedResponse += `  📏 ${distanceStr} away\n`;

        if (coverageStr) {
          formattedResponse += `  ✓ ${coverageStr} (${shop.coveredCount}/${shop.requiredCount})\n`;
        }
        if (priceStr) {
          formattedResponse += `  💰 ${priceStr}\n`;
        }
      });
    }

    return formattedResponse;
  }
}

export default GeminiService;
