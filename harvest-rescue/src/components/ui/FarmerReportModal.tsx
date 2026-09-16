import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "./Button";
import { api } from "@/lib/api";

export interface FarmerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
  onReportSubmitted: () => void;
}

export const FarmerReportModal: React.FC<FarmerReportModalProps> = ({
  isOpen,
  onClose,
  farmId,
  farmName,
  onReportSubmitted,
}) => {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("general_observation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please describe your observation.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.submitFarmerReport(farmId, {
        note: note.trim(),
        category,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNote("");
        onReportSubmitted();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity">
      <div
        className="w-full sm:max-w-lg bg-[#FBFDFA] rounded-t-3xl sm:rounded-3xl border border-[#E0E4DF] shadow-2xl p-6 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E0E4DF]">
          <div>
            <h3 className="m3-title-large text-[#191C1A]">Report Ground Observation</h3>
            <p className="m3-label-medium text-[#717973]">Farm: {farmName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#414943] hover:bg-[#F0F4EF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="m3-title-medium text-[#052119]">Observation Recorded!</h4>
            <p className="m3-body-medium text-[#414943]">
              Your field report has been logged and integrated into the risk model.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="m3-label-medium text-[#191C1A] block mb-1.5 font-semibold">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#F0F4EF] border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              >
                <option value="general_observation">General Observation</option>
                <option value="flood">Standing Water / Waterlogging</option>
                <option value="drought_heat">Wilting / Heat Stress</option>
                <option value="pest_damage">Pest / Armyworm Activity</option>
                <option value="crop_disease">Yellowing / Leaf Spot Disease</option>
              </select>
            </div>

            <div>
              <label className="m3-label-medium text-[#191C1A] block mb-1.5 font-semibold">
                Field Notes & Details
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="e.g. Discovered standing water in north sector after last night's rainfall. Stalks leaning slightly."
                className="w-full p-4 rounded-2xl bg-[#F0F4EF] border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="text" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Field Note
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
