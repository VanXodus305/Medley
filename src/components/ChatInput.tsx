import React, { useState } from 'react';
import { Send, Pill, Heart, AlertCircle, User, Bot } from 'lucide-react';

const ChatInput = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your medical assistant. I can help you find information about diseases, medicines, and remedies. Please describe your symptoms or ask about any medical condition.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const medicalKnowledge = {
    'headache': {
      disease: 'Headache',
      medicines: ['Ibuprofen', 'Paracetamol', 'Aspirin'],
      remedies: ['Stay hydrated', 'Rest in a dark room', 'Apply cold compress', 'Gentle neck massage'],
      description: 'Common condition causing pain in the head or neck area'
    },
    'fever': {
      disease: 'Fever',
      medicines: ['Paracetamol', 'Ibuprofen', 'Aspirin'],
      remedies: ['Drink plenty of fluids', 'Rest', 'Use cool compress', 'Wear light clothing'],
      description: 'Elevated body temperature, usually indicating infection or illness'
    },
    'cold': {
      disease: 'Common Cold',
      medicines: ['Decongestants', 'Antihistamines', 'Pain relievers'],
      remedies: ['Drink warm fluids', 'Gargle with salt water', 'Use humidifier', 'Get plenty of rest'],
      description: 'Viral infection of the upper respiratory tract'
    },
    'stomach ache': {
      disease: 'Stomach Pain',
      medicines: ['Antacids', 'Simethicone', 'Loperamide (for diarrhea)'],
      remedies: ['Drink ginger tea', 'Apply heat pad', 'Eat bland foods (BRAT diet)', 'Stay hydrated'],
      description: 'Discomfort or pain in the abdominal area'
    },
    'cough': {
      disease: 'Cough',
      medicines: ['Dextromethorphan', 'Guaifenesin', 'Honey-based syrups'],
      remedies: ['Drink warm honey and lemon', 'Use humidifier', 'Stay hydrated', 'Throat lozenges'],
      description: 'Reflex action to clear airways of irritants'
    }
  };

  const findMedicalInfo = (query) => {
    const normalizedQuery = query.toLowerCase();
    for (const [key, info] of Object.entries(medicalKnowledge)) {
      if (normalizedQuery.includes(key)) {
        return info;
      }
    }
    return null;
  };

  const generateBotResponse = (userMessage) => {
    const medicalInfo = findMedicalInfo(userMessage);
    
    if (medicalInfo) {
      return `**${medicalInfo.disease}**
      
${medicalInfo.description}

**💊 Recommended Medicines:**
${medicalInfo.medicines.map(med => `• ${med}`).join('\n')}

**🌿 Home Remedies:**
${medicalInfo.remedies.map(remedy => `• ${remedy}`).join('\n')}

*⚠️ Important: This is general information only. Please consult a healthcare professional for proper diagnosis and treatment.*`;
    } else {
      return "I understand you're asking about a medical concern. While I can provide general information about common conditions, I'd recommend consulting with a healthcare professional for accurate diagnosis and treatment. Could you describe your specific symptoms?";
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: generateBotResponse(inputValue),
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "I have a headache",
    "I'm feeling feverish",
    "I have a cold",
    "My stomach hurts",
    "I have a persistent cough"
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medley Health Assistant</h1>
            <p className="text-green-100">Find medicines and remedies for your health concerns</p>
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

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {message.text}
                </div>
                <div className={`text-xs mt-2 opacity-70`}>
                  {message.timestamp}
                </div>
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
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs">
            This is for informational purposes only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms or ask about medicines..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="2"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Pill className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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