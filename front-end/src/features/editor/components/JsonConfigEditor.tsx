"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface JsonConfigEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function JsonConfigEditor({ value, onChange }: JsonConfigEditorProps) {
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync external value to text
  useEffect(() => {
    setTextValue(JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  const handleChange = useCallback(
    (text: string) => {
      setTextValue(text);

      if (!text.trim()) {
        setError(null);
        onChange({});
        return;
      }

      try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
          setError("Config must be a JSON object");
          return;
        }
        setError(null);
        onChange(parsed);
      } catch (e) {
        if (e instanceof SyntaxError) {
          setError(`Invalid JSON: ${e.message}`);
        } else {
          setError("Invalid JSON format");
        }
      }
    },
    [onChange]
  );

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(textValue);
      setTextValue(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      // Keep current state if invalid
    }
  }, [textValue]);

  const handleMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(textValue);
      setTextValue(JSON.stringify(parsed));
      setError(null);
    } catch {
      // Keep current state if invalid
    }
  }, [textValue]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Configuration (JSON)</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleFormat}
          >
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleMinify}
          >
            Minify
          </Button>
        </div>
      </div>
      <Textarea
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "min-h-[200px] font-mono text-xs",
          error && "border-destructive focus-visible:ring-destructive"
        )}
        placeholder='{\n  "key": "value"\n}'
        spellCheck={false}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Enter task configuration as a JSON object. Keys and values will be
        available during workflow execution.
      </p>
    </div>
  );
}
