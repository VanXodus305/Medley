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
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import GeminiService, {
  GeminiResponse,
  MedicineWithShops,
  ShopInfo,
  ShopWithCoverage,
  FindShopsResponse,
} from "../services/geminiService";

// Custom Arrow Components for Carousel
const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-200"
    aria-label="Previous"
  >
    <ChevronLeft className="w-4 h-4 text-gray-600" />
  </button>
);

const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-200"
    aria-label="Next"
  >
    <ChevronRight className="w-4 h-4 text-gray-600" />
  </button>
);

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
  timestamp: string;
  structured?: GeminiResponse | FindShopsResponse;
  queryType?: "symptoms" | "medicines";
}

// Shop with Coverage Card Component
const ShopWithCoverageCard = ({ shop }: { shop: ShopWithCoverage }) => {
  const coveragePercent = shop.coverage ? Math.round(shop.coverage * 100) : 0;
  const hasCoverage = shop.available && shop.coverage && shop.coverage > 0;

  return (
    <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4 w-full max-w-[360px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-100 p-2 rounded-xl flex-shrink-0">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{shop.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {shop.location}
          </p>

          {/* Coverage Badge */}
          <div
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              hasCoverage
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {hasCoverage ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {shop.coveredCount}/{shop.requiredCount} ({coveragePercent}%)
          </div>

          {/* Distance and Price */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                {typeof shop.distance === "number"
                  ? `${shop.distance.toFixed(1)} km`
                  : shop.distance}{" "}
                away
              </span>
            </div>

            {shop.totalPrice && shop.totalPrice > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  ₹{shop.totalPrice.toFixed(0)} total
                </span>
              </div>
            )}

            {shop.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{shop.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Medicine Card Component
const MedicineCard = ({ medicine }: { medicine: MedicineWithShops }) => {
  return (
    <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4 w-full max-w-[360px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-100 p-2 rounded-xl flex-shrink-0">
          <Pill className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {medicine.name}
          </h3>
          {medicine.dosage && (
            <p className="text-xs text-emerald-700 mb-3 font-medium leading-relaxed">
              {medicine.dosage}
            </p>
          )}

          {medicine.shops && medicine.shops.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Available at:
              </p>
              <div className="space-y-3">
                {medicine.shops.slice(0, 2).map((shop, index) => (
                  <div key={index} className="text-xs">
                    <div className="flex justify-start mb-2">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {shop.price}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 font-medium">
                          {shop.name}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs ml-4">
                        {typeof shop.distance === "number"
                          ? `${shop.distance.toFixed(1)} km`
                          : shop.distance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {medicine.shops.length > 2 && (
                <p className="text-xs text-gray-500 mt-2">
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
  return (
    <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4 w-full max-w-[360px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-100 p-2 rounded-xl flex-shrink-0">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{shop.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {shop.location}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {`${shop.distance} away`}
            </span>
          </div>
          {shop.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{shop.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Carousel settings
const getCarouselSettings = (itemCount: number) => ({
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: Math.min(itemCount, 3),
  slidesToScroll: 1,
  autoplay: false,
  variableWidth: false,
  centerMode: false,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: Math.min(itemCount, 2),
        slidesToScroll: 1,
        variableWidth: false,
      },
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: false,
      },
    },
  ],
});

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
    userMessage: string,
  ): Promise<GeminiResponse | FindShopsResponse> => {
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
        queryType:
          "queryType" in structuredResponse
            ? (structuredResponse as FindShopsResponse).queryType
            : undefined,
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
    "Paracetamol, Ibuprofen, Aspirin",
    "Find shops for Cough Syrup",
  ];

  return (
    <div className="max-w-[1100px] sm:mx-auto mx-4 mb-20 overflow-hidden rounded-3xl border border-emerald-100/70 bg-white/80 shadow-[0_30px_80px_-50px_rgba(16,185,129,0.45)] backdrop-blur">
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-2xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                Medley Health Assistant
              </h1>
              <p className="text-emerald-100">
                Find medicines and remedies for your health concerns
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-200" />
            Online now
          </div>
        </div>
      </div>
      <div className="p-4 bg-emerald-50/70 border-b border-emerald-100">
        <p className="text-sm font-semibold text-emerald-900 mb-2">
          Quick questions
        </p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputValue(question)}
              className="px-3 py-1 text-sm bg-white/80 border border-emerald-100 rounded-full text-emerald-700 hover:bg-white hover:border-emerald-200 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      <div
        className="h-[420px] md:h-[460px] overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-emerald-50/40 scrollbar-thin"
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
              className={`flex gap-3 max-w-[80%] min-w-0 ${
                message.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                    : "bg-white text-emerald-600 border border-emerald-100"
                }`}
              >
                {message.type === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`rounded-2xl p-4 min-w-0 max-w-full shadow-sm ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                    : "bg-white text-slate-700 border border-emerald-100 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {message.text}
                </div>

                {/* Render structured data for bot messages */}
                {message.type === "bot" && message.structured && (
                  <div className="mt-4 space-y-4 min-w-0">
                    {/* For Symptoms Query - Show Medicines Carousel */}
                    {message.queryType === "symptoms" &&
                      (message.structured as GeminiResponse).medicines &&
                      (message.structured as GeminiResponse).medicines!.length >
                        0 && (
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            Recommended Medicines
                          </h4>
                          <div className="relative">
                            <Slider
                              {...getCarouselSettings(
                                (message.structured as GeminiResponse)
                                  .medicines!.length,
                              )}
                            >
                              {(
                                message.structured as GeminiResponse
                              ).medicines!.map((medicine, index) => (
                                <div key={index} className="px-1">
                                  <div className="mx-1">
                                    <MedicineCard medicine={medicine} />
                                  </div>
                                </div>
                              ))}
                            </Slider>
                          </div>
                        </div>
                      )}

                    {/* For Medicines Query - Show Shops with Coverage */}
                    {message.queryType === "medicines" &&
                      (message.structured as FindShopsResponse).shops &&
                      (message.structured as FindShopsResponse).shops.length >
                        0 && (
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Best Shops to Visit
                          </h4>
                          <div className="relative">
                            <Slider
                              {...getCarouselSettings(
                                (message.structured as FindShopsResponse).shops
                                  .length,
                              )}
                            >
                              {(
                                message.structured as FindShopsResponse
                              ).shops.map((shop, index) => (
                                <div key={index} className="px-1">
                                  <div className="mx-1">
                                    <ShopWithCoverageCard
                                      shop={shop as ShopWithCoverage}
                                    />
                                  </div>
                                </div>
                              ))}
                            </Slider>
                          </div>
                        </div>
                      )}

                    {/* For Symptoms Query - Show Nearby Shops */}
                    {message.queryType === "symptoms" &&
                      (message.structured as GeminiResponse).shops &&
                      (message.structured as GeminiResponse).shops!.length >
                        0 && (
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Nearby Shops
                          </h4>
                          <div className="relative">
                            <Slider
                              {...getCarouselSettings(
                                (message.structured as GeminiResponse).shops!
                                  .length,
                              )}
                            >
                              {(
                                message.structured as GeminiResponse
                              ).shops!.map((shop, index) => (
                                <div key={index} className="px-1">
                                  <div className="mx-1">
                                    <ShopCard shop={shop} />
                                  </div>
                                </div>
                              ))}
                            </Slider>
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
            <div className="w-9 h-9 rounded-2xl bg-white text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm p-4 border border-emerald-100 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Disclaimer */}
      <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs">
            This is for informational purposes only. Always consult healthcare
            professionals for medical advice.
          </p>
        </div>
      </div>
      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe symptoms or list medicines (e.g., 'Paracetamol, Ibuprofen')..."
              className="w-full p-4 pr-12 border border-emerald-100 rounded-2xl resize-none bg-emerald-50/30 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              rows={2}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 md:max-h-12 justify-center shadow-md shadow-emerald-100"
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
