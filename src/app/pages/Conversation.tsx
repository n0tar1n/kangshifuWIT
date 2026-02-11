import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, 
  Camera, 
  Mic, 
  Send, 
  Hand,
  Type,
  MessageSquare,
  Loader2,
  CheckCircle,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { useAppContext } from "../context/AppContext";
import { PartnerAvatar } from "../components/PartnerAvatar";
import {
  simulateSignLanguageDetection,
  simulateSummarization,
  simulateTypingDetection,
  getHardcodedResponse,
} from "../utils/mlSimulator";
import { Badge } from "../components/ui/badge";

type InputMode = "sign" | "type" | "preset";

export function Conversation() {
  const navigate = useNavigate();
  const { 
    selectedDisabilities, 
    selectedContext, 
    messages, 
    addMessage 
  } = useAppContext();

  const [inputMode, setInputMode] = useState<InputMode>("sign");
  const [partnerTypedInput, setPartnerTypedInput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentDetectedIntent, setCurrentDetectedIntent] = useState("");
  const [currentSummary, setCurrentSummary] = useState("");
  const [currentTone, setCurrentTone] = useState<"neutral" | "urgent" | "polite" | "confused">("neutral");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetMessages = [
    "Transfer line",
    "How to go",
    "Yes",
    "No",
    "Nearest lift",
  ];

  useEffect(() => {
    if (selectedDisabilities.length === 0) {
      navigate("/");
      return;
    }

    // Auto-start camera if hearing impaired is selected (optional)
    if (selectedDisabilities.includes("hearing")) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDisabilities, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Error accessing camera. Please allow camera access.");
    }
  };

  const handleSimulateSign = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      const detectionResult = simulateSignLanguageDetection(selectedContext);
      const summarizationResult = simulateSummarization(detectionResult.intent, selectedContext);
      const hardcodedResponse = getHardcodedResponse(detectionResult.intent);
      
      setCurrentDetectedIntent(detectionResult.intent);
      setCurrentSummary(summarizationResult.summary);
      setCurrentTone(summarizationResult.tone);
      setDetectedWords(detectionResult.detectedWords);
      
      // Don't auto-fill the response - user will click voice input
      
      addMessage({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: "partner",
        originalInput: "Sign language gesture",
        detectedIntent: detectionResult.intent,
        summary: summarizationResult.summary,
      });
      
      setIsProcessing(false);
    }, 5000);
  };

  const handlePartnerType = () => {
    if (!partnerTypedInput.trim()) return;
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const detectionResult = simulateTypingDetection(partnerTypedInput, selectedContext);
      const summarizationResult = simulateSummarization(detectionResult.intent, selectedContext);
      
      setCurrentDetectedIntent(detectionResult.intent);
      setCurrentSummary(summarizationResult.summary);
      setCurrentTone(summarizationResult.tone);
      
      addMessage({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: "partner",
        originalInput: partnerTypedInput,
        detectedIntent: detectionResult.intent,
        summary: summarizationResult.summary,
      });
      
      setPartnerTypedInput("");
      setIsProcessing(false);
    }, 800);
  };

  const handlePresetMessage = (message: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setCurrentDetectedIntent(message);
      setCurrentSummary(message);
      setCurrentTone("neutral");
      
      addMessage({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: "partner",
        originalInput: `Preset: ${message}`,
        detectedIntent: message,
        summary: message,
      });
      
      setIsProcessing(false);
    }, 500);
  };

  const handleUserReply = () => {
    if (!userInput.trim()) return;
    
    // Determine output format based on partner's disabilities
    let outputFormat = "";
    if (selectedDisabilities.includes("sight")) {
      outputFormat = "Audio (Text-to-Speech)";
    } else if (selectedDisabilities.includes("hearing")) {
      outputFormat = "Large Text Display";
    } else {
      outputFormat = "Text & Audio";
    }
    
    addMessage({
      id: Date.now().toString(),
      timestamp: new Date(),
      type: "user",
      originalInput: userInput,
      outputFormat,
    });
    
    setUserInput("");
  };

  const simulateSpeechToText = () => {
    setIsListening(true);
    
    // Simulate speech recognition - 10 seconds
    const sampleReplies = [
      "Take the escalator up and turn left",
    ];
    
    setTimeout(() => {
      const reply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
      setUserInput(reply);
      
      // Add to conversation history immediately
      const outputFormat = selectedDisabilities.includes("sight") 
        ? "Audio (Text-to-Speech)" 
        : selectedDisabilities.includes("hearing") 
        ? "Large Text Display" 
        : "Text & Audio";
      
      addMessage({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: "user",
        originalInput: reply,
        outputFormat,
      });
      
      setIsListening(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ConnectAble Conversation</h1>
              <div className="flex gap-2 mt-1">
                {selectedDisabilities.map((disability) => (
                  <Badge key={disability} variant="secondary" className="text-xs">
                    {disability}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {selectedContext}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Conversation History - Full Width at Top (40% height - increased from 33%) */}
        <Card className="p-4 bg-white" style={{ height: '40vh' }}>
          <h2 className="text-lg font-semibold mb-4">Conversation History</h2>
          
          <div className="space-y-3 overflow-y-auto" style={{ height: 'calc(40vh - 5rem)' }}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.type === "partner"
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "bg-green-50 border-l-4 border-green-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">
                      {msg.type === "partner" ? "Partner" : "You"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {msg.type === "partner" ? (
                    <div className="text-lg font-semibold text-gray-900">
                      {msg.summary}
                    </div>
                  ) : (
                    <div className="text-lg text-gray-900">
                      {msg.originalInput}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Bottom Section: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left Column: Partner Input (55-60% / 3 columns) */}
          <div className="lg:col-span-3">
            <Card className="p-4 bg-white h-full">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Hand className="w-5 h-5 text-indigo-600" />
                Partner Input
              </h2>

              {/* Input Mode Selector */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={inputMode === "sign" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("sign")}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Sign
                </Button>
                <Button
                  variant={inputMode === "type" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("type")}
                >
                  <Type className="w-4 h-4 mr-1" />
                  Type
                </Button>
                <Button
                  variant={inputMode === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("preset")}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Quick
                </Button>
              </div>

              {/* Sign Language Input */}
              {inputMode === "sign" && (
                <div>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ height: "320px" }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSimulateSign}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Detecting Sign...
                      </>
                    ) : (
                      <>
                        <Hand className="w-5 h-5 mr-2" />
                        Simulate Sign Detection
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Typing Input */}
              {inputMode === "type" && (
                <div>
                  <Textarea
                    value={partnerTypedInput}
                    onChange={(e) => setPartnerTypedInput(e.target.value)}
                    placeholder="Partner types here..."
                    className="mb-4 text-lg"
                    rows={6}
                  />
                  <Button
                    onClick={handlePartnerType}
                    disabled={isProcessing || !partnerTypedInput.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Preset Buttons */}
              {inputMode === "preset" && (
                <div className="grid grid-cols-2 gap-3">
                  {presetMessages.map((msg) => (
                    <Button
                      key={msg}
                      onClick={() => handlePresetMessage(msg)}
                      disabled={isProcessing}
                      variant="outline"
                      className="h-auto py-6 text-base"
                    >
                      {msg}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Detection + Response (40-45% / 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Detected Text Display */}
            {currentDetectedIntent && (
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Detected
                </h3>
                
                {/* Show detected words */}
                {detectedWords.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Words:</div>
                    <div className="flex gap-2 flex-wrap">
                      {detectedWords.map((word, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-500 text-white text-sm py-1">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Intent:</div>
                  <div className="text-base font-semibold bg-white p-3 rounded">{currentDetectedIntent}</div>
                </div>
                
                {/* Collapsible Analysis Drawer */}
                <button
                  onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                  className="w-full mt-2 p-2 text-xs text-indigo-600 hover:bg-indigo-100 rounded flex items-center justify-between"
                >
                  <span>Detailed Analysis</span>
                  {isAnalysisOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {isAnalysisOpen && (
                  <div className="mt-3 p-3 bg-white rounded border border-indigo-200">
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Summary:</div>
                      <div className="text-sm font-semibold">{currentSummary}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">Tone:</div>
                      <Badge variant="outline">{currentTone}</Badge>
                    </div>
                    <PartnerAvatar tone={currentTone} message={currentSummary} />
                  </div>
                )}
              </Card>
            )}

            {/* Your Response */}
            <Card className="p-4 bg-white">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Your Response
              </h2>

              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Your response"
                className="mb-4 text-lg"
                rows={4}
              />
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={simulateSpeechToText}
                  disabled={isListening}
                  variant="outline"
                  className="w-full"
                >
                  {isListening ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleUserReply}
                  disabled={!userInput.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Partner
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}