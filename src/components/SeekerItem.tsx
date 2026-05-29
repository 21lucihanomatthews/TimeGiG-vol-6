import React from "react";
import { motion } from "motion/react";

export const SeekerItem = ({ seeker, isLocalMe, seekerHashId, onClick, setActiveChat }: any) => {
  return (
    <motion.div
      key={seeker.email}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98, backgroundColor: "#f0fdf4" }}
      onClick={() => onClick(seeker, seekerHashId)}
      className={`bg-white p-4 rounded-3xl shadow-sm border flex items-center justify-between cursor-pointer transition-colors ${
        isLocalMe ? "border-2 border-[#007749]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
          {seeker.pictures?.front ? (
            <img
              src={seeker.pictures.front}
              className="w-full h-full object-cover"
              alt={seeker.fullName}
            />
          ) : (
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seeker.fullName || seekerHashId}`}
              className="w-full h-full object-cover"
              alt={seeker.fullName}
            />
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
            {seeker.fullName}
            {isLocalMe && (
              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold uppercase">Me</span>
            )}
          </h3>
          <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
            <span className="text-[#007749]">📍</span> {seeker.location || "South Africa"}
          </p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            {seeker.workPreference} Preference
          </p>
          <div className="flex items-center mt-1">
            <span className="px-2 py-0.5 bg-[#007749] text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">
              {seeker.level}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveChat(seekerHashId);
          }}
          className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-[#007749] hover:bg-[#007749]/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </button>
      </div>
    </motion.div>
  );
};
