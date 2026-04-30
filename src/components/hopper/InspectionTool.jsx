import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, CheckSquare, Square, Loader2, CheckCircle2 } from "lucide-react";

const CHECKLIST_ITEMS = [
  "All parts present and accounted for",
  "No visible cracks, dents, or structural damage",
  "Power/fuel system functional",
  "Safety guards and covers intact",
  "Blades/bits/attachments in good condition",
];

export default function InspectionTool({ task, onClose, onComplete }) {
  const [photos, setPhotos] = useState(task.inspection_photos || []);
  const [checklist, setChecklist] = useState(task.inspection_checklist || {});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleCapture = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (photos.length + files.length > 4) {
      alert("Maximum 4 photos allowed.");
      return;
    }
    setUploading(true);
    const results = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
    setPhotos(prev => [...prev, ...results.map(r => r.file_url)]);
    setUploading(false);
  };

  const toggleCheck = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const allChecked = CHECKLIST_ITEMS.every(i => checklist[i]);
  const canComplete = photos.length === 4 && allChecked;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-green-950 border-b border-green-700">
        <h2 className="text-white font-bold text-lg">Inspection — {task.tool_title}</h2>
        <button onClick={onClose} className="text-green-300 hover:text-white p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Photos */}
        <div>
          <h3 className="text-green-200 font-semibold mb-3">
            Step 1: Take 4 Photos ({photos.length}/4)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`Inspection ${i + 1}`} className="w-full h-36 object-cover rounded-xl border border-green-700" />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  Photo {i + 1}
                </div>
                <button
                  onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 bg-red-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="h-36 rounded-xl border-2 border-dashed border-green-600 flex flex-col items-center justify-center gap-2 text-green-400 hover:bg-green-900/30 transition-colors"
              >
                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                <span className="text-sm">{uploading ? "Uploading..." : "Add Photo"}</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleCapture}
          />
        </div>

        {/* Checklist */}
        <div>
          <h3 className="text-green-200 font-semibold mb-3">Step 2: 5-Point Safety Checklist</h3>
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4 space-y-3">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item}
                  onClick={() => toggleCheck(item)}
                  className="flex items-center gap-3 w-full text-left min-h-[44px] group"
                >
                  {checklist[item]
                    ? <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                    : <Square className="w-5 h-5 text-green-600 flex-shrink-0" />
                  }
                  <span className={`text-sm ${checklist[item] ? "text-green-200 line-through opacity-70" : "text-green-100"}`}>
                    {item}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-4 py-4 bg-green-950 border-t border-green-700">
        {canComplete ? (
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold h-12"
            onClick={() => onComplete(photos, checklist)}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Inspection
          </Button>
        ) : (
          <p className="text-center text-green-500 text-sm">
            {photos.length < 4 ? `Add ${4 - photos.length} more photo${4 - photos.length > 1 ? "s" : ""}` : "Complete all checklist items"} to finish
          </p>
        )}
      </div>
    </div>
  );
}