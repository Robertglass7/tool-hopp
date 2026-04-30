import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, CheckSquare, Square, Star, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const RETURN_QUESTIONS = [
  { id: "used_correctly", label: "I used the tool only for its intended purpose" },
  { id: "cleaned", label: "I have cleaned the tool before returning it" },
  { id: "all_parts", label: "All accessories, attachments, and parts are included" },
  { id: "no_damage", label: "To the best of my knowledge, I have not caused any damage" },
  { id: "safe_condition", label: "The tool is in a safe, operable condition" },
];

export default function RenterReturnForm({ booking, onClose }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [damageDisclosure, setDamageDisclosure] = useState(false);
  const [damageDetails, setDamageDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = RETURN_QUESTIONS.every(q => answers[q.id] !== undefined);

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingsAsRenter"] });
      queryClient.invalidateQueries({ queryKey: ["bookingsAsOwner"] });
      setSubmitted(true);
    },
  });

  const handleSubmit = () => {
    const returnSurvey = {
      answers,
      rating,
      notes,
      damage_disclosed: damageDisclosure,
      damage_details: damageDetails,
      submitted_at: new Date().toISOString(),
    };

    updateBookingMutation.mutate({
      id: booking.id,
      data: {
        return_notes: JSON.stringify(returnSurvey),
        status: "pending_return",
      },
    });
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <Card className="bg-green-950 border-green-700 max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
            <h2 className="text-white text-xl font-bold">Return Request Submitted!</h2>
            <p className="text-green-300 text-sm">
              Your Hopper has been notified and will arrive to collect the tool soon.
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-green-950 border-b border-green-700 flex-shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg">Return Checklist</h2>
          <p className="text-green-400 text-xs">{booking.tool_title}</p>
        </div>
        <button onClick={onClose} className="text-green-300 hover:text-white p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Return Condition Questions */}
        <div>
          <h3 className="text-green-200 font-semibold mb-1">Tool Return Conditions</h3>
          <p className="text-green-500 text-xs mb-3">Please confirm each item honestly before requesting pickup.</p>
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4 space-y-3">
              {RETURN_QUESTIONS.map(q => (
                <div key={q.id} className="flex items-start gap-3">
                  <div className="flex gap-2 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: true }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        answers[q.id] === true
                          ? "bg-green-600 text-white"
                          : "bg-green-900 text-green-400 hover:bg-green-800"
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" /> Yes
                    </button>
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: false }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        answers[q.id] === false
                          ? "bg-red-700 text-white"
                          : "bg-green-900 text-green-400 hover:bg-green-800"
                      }`}
                    >
                      <Square className="w-3 h-3" /> No
                    </button>
                  </div>
                  <p className={`text-sm leading-snug ${answers[q.id] === false ? "text-red-300" : "text-green-100"}`}>
                    {q.label}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Damage Disclosure */}
        <div>
          <h3 className="text-green-200 font-semibold mb-3">Damage Disclosure</h3>
          <Card className={`border ${damageDisclosure ? "bg-red-950/30 border-red-700" : "bg-green-950/50 border-green-700"}`}>
            <CardContent className="p-4 space-y-3">
              <button
                onClick={() => setDamageDisclosure(d => !d)}
                className="flex items-center gap-3 w-full text-left"
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${damageDisclosure ? "text-red-400" : "text-green-500"}`} />
                <span className="text-sm text-green-100">
                  I need to disclose damage that occurred during my rental
                </span>
                {damageDisclosure
                  ? <CheckSquare className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                  : <Square className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                }
              </button>
              {damageDisclosure && (
                <Textarea
                  placeholder="Please describe the damage in detail..."
                  value={damageDetails}
                  onChange={e => setDamageDetails(e.target.value)}
                  rows={3}
                  className="bg-red-950/30 text-white border-red-700 placeholder:text-red-400"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rating */}
        <div>
          <h3 className="text-green-200 font-semibold mb-3">Rate Your Experience</h3>
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4">
              <div className="flex gap-2 justify-center mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star
                      className={`w-8 h-8 transition-colors ${star <= rating ? "text-orange-400 fill-orange-400" : "text-green-700"}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-green-400 text-xs">
                {rating === 0 ? "Tap to rate" : ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional notes */}
        <div>
          <h3 className="text-green-200 font-semibold mb-2">Additional Notes <span className="text-green-500 font-normal text-xs">(optional)</span></h3>
          <Textarea
            placeholder="Any comments for the owner or Hopper..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="bg-green-900/50 text-white border-green-700 placeholder:text-green-500"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 py-4 bg-green-950 border-t border-green-700 flex-shrink-0">
        {!allAnswered && (
          <p className="text-center text-green-500 text-xs mb-2">Please answer all condition questions above</p>
        )}
        <Button
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold disabled:opacity-50"
          disabled={!allAnswered || updateBookingMutation.isPending}
          onClick={handleSubmit}
        >
          {updateBookingMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            "Submit & Request Pickup"
          )}
        </Button>
      </div>
    </div>
  );
}