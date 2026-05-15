import { useRef, useState, useCallback } from "react";
import { LuMic, LuMicOff, LuLoader } from "react-icons/lu";
import * as chatApi from "../../lib/chatApi";

interface MicButtonProps {
  /** Called with the transcribed text when Groq is done. */
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

type MicState = "idle" | "recording" | "transcribing" | "denied";

export default function MicButton({ onTranscribed, disabled }: MicButtonProps) {
  const [micState, setMicState] = useState<MicState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (disabled || micState !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        setMicState("transcribing");
        try {
          const text = await chatApi.transcribeAudio(blob);
          onTranscribed(text);
        } catch {
          // Silently fail -- user can just type or try again.
        } finally {
          setMicState("idle");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setMicState("recording");
    } catch {
      setMicState("denied");
      setTimeout(() => setMicState("idle"), 3000);
    }
  }, [disabled, micState, onTranscribed]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    // State moves to "transcribing" inside recorder.onstop
  }, []);

  if (micState === "denied") {
    return (
      <button
        type="button"
        disabled
        title="Permiso de micrófono denegado"
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"
      >
        <LuMicOff className="h-5 w-5" />
      </button>
    );
  }

  if (micState === "transcribing") {
    return (
      <button
        type="button"
        disabled
        title="Transcribiendo..."
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"
      >
        <LuLoader className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  const isRecording = micState === "recording";

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      onPointerLeave={stopRecording}
      title={isRecording ? "Suelta para transcribir" : "Mantén presionado para hablar"}
      className={[
        "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl transition-all select-none touch-none",
        isRecording
          ? "bg-[#75141C] text-white shadow-lg shadow-[#75141C]/30 scale-110 animate-pulse"
          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 disabled:opacity-40",
      ].join(" ")}
    >
      <LuMic className="h-5 w-5" />
    </button>
  );
}
