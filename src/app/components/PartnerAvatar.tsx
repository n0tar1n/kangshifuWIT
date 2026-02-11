import { User, Smile, Frown, Meh, AlertCircle } from "lucide-react";

interface PartnerAvatarProps {
  tone: "neutral" | "urgent" | "polite" | "confused";
  message: string;
}

export function PartnerAvatar({ tone, message }: PartnerAvatarProps) {
  const getExpression = () => {
    switch (tone) {
      case "urgent":
        return { Icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" };
      case "polite":
        return { Icon: Smile, color: "text-green-500", bg: "bg-green-50" };
      case "confused":
        return { Icon: Frown, color: "text-orange-500", bg: "bg-orange-50" };
      default:
        return { Icon: Meh, color: "text-blue-500", bg: "bg-blue-50" };
    }
  };

  const expression = getExpression();
  const Icon = expression.Icon;

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className={`w-16 h-16 rounded-full ${expression.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-8 h-8 ${expression.color}`} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
          Emotional Tone: {tone}
        </div>
        <div className="text-2xl">{message}</div>
      </div>
    </div>
  );
}
