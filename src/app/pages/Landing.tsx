import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Ear, Eye, MessageSquare, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAppContext, DisabilityType, MRTStation } from "../context/AppContext";

export function Landing() {
  const navigate = useNavigate();
  const { selectedDisabilities, toggleDisability, selectedStation, setSelectedStation, clearMessages } = useAppContext();

  const disabilities: { value: DisabilityType; label: string; icon: any }[] = [
    { value: "hearing", label: "Hearing Impaired", icon: Ear },
    { value: "speech", label: "Speech Impaired", icon: MessageSquare },
    { value: "sight", label: "Sight Impaired", icon: Eye },
  ];

  const mrtStations: MRTStation[] = [
    "Dhoby Ghaut",
    "Bugis",
    "Jurong East",
    "Paya Lebar",
    "Serangoon"
  ];

  const handleStartConversation = () => {
    if (selectedDisabilities.length === 0) {
      alert("Please select at least one disability type");
      return;
    }
    clearMessages();
    navigate("/conversation");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">ConnectAble</h1>
          <p className="text-gray-600">Breaking communication barriers together</p>
          <p className="text-sm text-gray-500 mt-2">For Singapore MRT Staff</p>
        </div>

        {/* Disability Selection */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Passenger's Needs</h2>
            <p className="text-sm text-gray-600">Select all that apply (can select multiple)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {disabilities.map((disability) => {
              const Icon = disability.icon;
              const isSelected = selectedDisabilities.includes(disability.value);
              
              return (
                <button
                  key={disability.value}
                  onClick={() => toggleDisability(disability.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? "text-indigo-600" : "text-gray-400"
                    }`}
                  />
                  <div className={`text-sm font-medium ${
                    isSelected ? "text-indigo-900" : "text-gray-700"
                  }`}>
                    {disability.label}
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-xs text-indigo-600 font-semibold">✓ Selected</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* MRT Station Selection */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">MRT Station</h2>
            <p className="text-sm text-gray-600">Select the current MRT station</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mrtStations.map((station) => {
              const isSelected = selectedStation === station;
              
              return (
                <button
                  key={station}
                  onClick={() => setSelectedStation(station)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <MapPin
                    className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? "text-indigo-600" : "text-gray-400"
                    }`}
                  />
                  <div className={`text-sm font-medium ${
                    isSelected ? "text-indigo-900" : "text-gray-700"
                  }`}>
                    {station}
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-xs text-indigo-600 font-semibold">✓ Selected</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStartConversation}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg"
        >
          Start Conversation
        </Button>
      </div>
    </div>
  );
}