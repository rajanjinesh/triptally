"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ButtonWithInfo, ErrorText, Label, Page } from "../components/ui";
import type { WrongLine } from "@/lib/split";
import { readSession, writeSession } from "@/lib/trip";
import { countLines, track, trackAiCalls } from "@/lib/analytics";

type Status = "idle" | "analyzing" | "ready" | "wrong" | "error";

const isTxt = (file: File) => file.name.toLowerCase().endsWith(".txt");

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [wrong, setWrong] = useState<WrongLine[]>([]);

  const analyse = async (picked: File) => {
    setFile(picked);
    setStatus("analyzing");
    setError("");
    setWrong([]);

    const session = readSession();
    if (!session?.tripId) {
      setStatus("error");
      setError("Trip not found. Start again from trip setup.");
      return;
    }

    let text: string;
    try {
      text = await picked.text();
    } catch {
      setStatus("error");
      setError("The file could not be read.");
      return;
    }

    const started = performance.now();
    let aiCalls: unknown;
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: session.tripId, text }),
      });
      const data = await res.json();
      aiCalls = data.aiCalls;
      if (!res.ok) throw new Error(data.error ?? "The file could not be read.");

      if (data.wrong) {
        setWrong(data.wrong);
        setStatus("wrong");
        writeSession({ tripId: session.tripId, trip: data.trip });
        return;
      }
      writeSession({ tripId: session.tripId, trip: data.trip, split: data.split });
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The file could not be read.");
    } finally {
      trackAiCalls(aiCalls, session.tripId, countLines(text), Math.round(performance.now() - started));
    }
  };

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    if (!isTxt(picked)) {
      setFile(null);
      setStatus("error");
      setError("Please choose a .txt file.");
      return;
    }
    analyse(picked);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    pick(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setWrong([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Page>
      <h1 className="w-full text-[24px] leading-[1.2] font-semibold text-ink">Upload spend details</h1>

      <div className="flex w-full flex-col gap-4">
        <Label info="Upload a .txt file listing who paid what during the trip." className="text-[14px] font-semibold">
          Upload file
        </Label>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex h-[220px] w-full flex-col items-center justify-center gap-[10px] rounded-[8px] border border-dashed border-line bg-header leading-[1.5] whitespace-nowrap"
        >
          <p className="text-[16px] font-medium text-ink">Drop your spend details file here</p>
          <p className="flex gap-1 text-[13px]">
            <span className="text-muted">or</span>
            <button type="button" className="cursor-pointer font-semibold text-accent" onClick={() => inputRef.current?.click()}>
              browse files
            </button>
          </p>
          <p className="text-[11px] text-muted">.txt files only</p>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        {file && (
          <div className="flex w-full items-center gap-3 rounded-[8px] border border-line bg-white p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-[2px] leading-[1.5]">
              <p className="truncate text-[13px] font-semibold text-ink">{file.name}</p>
              <p className="text-[11px] text-muted">{status === "analyzing" ? "Analyzing…" : "Selected file"}</p>
            </div>
            <button type="button" aria-label="Remove file" className="shrink-0 cursor-pointer" onClick={removeFile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/x.svg" alt="" width={16} height={16} />
            </button>
          </div>
        )}

        {error && <ErrorText>{error}</ErrorText>}

        {wrong.length > 0 && (
          <div role="alert" className="flex w-full flex-col gap-1 text-[13px] leading-[1.5] text-[#b91c1c]">
            <p className="font-semibold">Fix these lines and upload the file again:</p>
            <ul className="flex flex-col gap-1">
              {wrong.map((w, i) => (
                <li key={i}>
                  “{w.line}” – {w.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex w-full items-center gap-2 rounded-[8px] bg-note px-3 py-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/info.svg" alt="" width={16} height={16} className="shrink-0" />
        <p className="flex-1 text-[13px] leading-[1.5] text-note-ink">This evaluation is run with test data.</p>
      </div>

      <div className="flex items-center gap-4">
        <ButtonWithInfo
          variant="secondary"
          info="Runs the AI on test data in Braintrust to check its accuracy."
          onClick={() => {
            fetch("/api/evaluate", { method: "POST" }).catch(() => {});
            const tripId = readSession()?.tripId ?? null;
            const send = (lines_count: number) =>
              track("evaluate_clicked", { trip_id: tripId, file_uploaded: !!file, lines_count });
            if (file) file.text().then((text) => send(countLines(text)), () => send(0));
            else send(0);
          }}
        >
          Evaluate
        </ButtonWithInfo>
        <ButtonWithInfo
          info="Go to your trip summary and see who pays whom."
          disabled={status !== "ready"}
          onClick={() => router.push("/dashboard")}
        >
          Next
        </ButtonWithInfo>
      </div>
    </Page>
  );
}
