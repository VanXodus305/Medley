import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Pill,
  Heart,
  AlertCircle,
  User,
  Bot,
  MapPin,
  IndianRupee,
  Clock,
} from "lucide-react";
import GeminiService, {
  GeminiResponse,
  MedicineWithShops,
  ShopInfo,
} from "../services/geminiService";

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
  timestamp: string;
  structured?: GeminiResponse; // Add structured data for bot responses
}

// Medicine Card Component
const MedicineCard = ({ medicine }: { medicine: MedicineWithShops }) => {
  const formatDistance = (distance: number) => {
    return distance >= 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${distance} metres`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[280px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Pill className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            {medicine.name}
          </h3>
          {medicine.dosage && (
            <p className="text-xs text-gray-600 mt-1">{medicine.dosage}</p>
          )}

          {medicine.shops && medicine.shops.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Available at:
              </p>
              <div className="space-y-1">
                {medicine.shops.slice(0, 2).map((shop, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 truncate">
                        {shop.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {shop.price}
                      </span>
                      <span className="text-gray-500">
                        {formatDistance(shop.distance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {medicine.shops.length > 2 && (
                <p className="text-xs text-gray-500 mt-1">
                  +{medicine.shops.length - 2} more shops
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Shop Card Component
const ShopCard = ({ shop }: { shop: ShopInfo }) => {
  const formatDistance = (distance: number) => {
    return distance >= 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${distance} metres`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[280px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="bg-green-100 p-2 rounded-lg">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{shop.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {shop.location}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {formatDistance(shop.distance)} away
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInput = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm your medical assistant. I can help you find information about diseases, medicines, and remedies. Please describe your symptoms or ask about any medical condition.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [geminiService] = useState(() => new GeminiService());
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll when messages change or when typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateBotResponse = async (
    userMessage: string
  ): Promise<GeminiResponse> => {
    try {
      const response = await geminiService.processUserPrompt(userMessage);
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return {
        response:
          "I understand you're asking about a medical concern. While I can provide general information about common conditions, I'd recommend consulting with a healthcare professional for accurate diagnosis and treatment. Could you describe your specific symptoms?",
      };
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    // Scroll after user message is added
    setTimeout(scrollToBottom, 100);

    try {
      // Generate bot response using Gemini API
      const structuredResponse = await generateBotResponse(currentInput);

      const botResponse: Message = {
        id: messages.length + 2,
        type: "bot",
        text: structuredResponse.response,
        timestamp: new Date().toLocaleTimeString(),
        structured: structuredResponse,
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorResponse: Message = {
        id: messages.length + 2,
        type: "bot",
        text: "I'm sorry, I'm experiencing some technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "I have a headache",
    "I'm feeling feverish",
    "I have a cold",
    "My stomach hurts",
    "I have a persistent cough",
  ];

  return (
    <div className="max-w-5xl sm:mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden mb-20 mx-5">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medley Health Assistant</h1>
            <p className="text-green-100">
              Find medicines and remedies for your health concerns
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-b">
        <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputValue(question)}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      <div
        className="h-96 overflow-y-auto p-4 space-y-4"
        ref={messagesContainerRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {message.type === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  message.type === "user"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {message.text}
                </div>

                {/* Render structured data for bot messages */}
                {message.type === "bot" && message.structured && (
                  <div className="mt-4 space-y-4">
                    {/* Medicines Carousel */}
                    {message.structured.medicines &&
                      message.structured.medicines.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            Recommended Medicines
                          </h4>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {message.structured.medicines.map(
                              (medicine, index) => (
                                <MedicineCard key={index} medicine={medicine} />
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Shops Carousel */}
                    {message.structured.shops &&
                      message.structured.shops.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Nearby Shops
                          </h4>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {message.structured.shops.map((shop, index) => (
                              <ShopCard key={index} shop={shop} />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                <div className={`text-xs mt-2 opacity-70`}>
                  {message.timestamp}
                </div>

                {/* Medical disclaimer for bot messages with medicines */}
                {/* {message.type === "bot" && message.structured?.medicines && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ This is general information only. Please consult a
                    healthcare professional for proper diagnosis and treatment.
                  </div>
                )} */}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>{" "}
      {/* Disclaimer */}
      <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs">
            This is for informational purposes only. Always consult healthcare
            professionals for medical advice.
          </p>
        </div>
      </div>
      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex sm:flex-row flex-col gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms or ask about medicines..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Pill className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 md:max-h-12 justify-center"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
