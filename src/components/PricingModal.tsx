import React from "react";
import { X, Coin, Info } from "lucide-react";

export const PricingModal = ({ onClose }: { onClose: () => void }) => {
  const prices = [
    { action: "Chat message", cost: 1 },
    { action: "View profile", cost: 2 },
    { action: "View ID documents", cost: 10 },
    { action: "Apply to gig", cost: 3 },
    { action: "Sending images", cost: 3 },
    { action: "Sending gig videos", cost: 8 },
  ];

  return (
    <div className="fixed inset-0 z-[10001] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            Pricing & Instructions
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {prices.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700 font-medium text-sm">{item.action}</span>
              <span className="font-black text-[#007749]">{item.cost} coins</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 font-medium">
          <p className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            Ensure you have enough coins in your wallet before performing these actions. You can top up your balance in the wallet section.
          </p>
        </div>
      </div>
    </div>
  );
};
