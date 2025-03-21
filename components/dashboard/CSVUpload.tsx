"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CSVUploadProps {
  onUpload: (content: string) => Promise<{
    created: number;
    skipped: number;
    total: number;
  }>;
}

interface UploadResult {
  created: number;
  skipped: number;
  total: number;
}

export function CSVUpload({ onUpload }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setResult(null);

    try {
      const content = await file.text();
      const result = await onUpload(content);
      setSuccess(true);
      setResult(result);
      setFile(null);
      if (document.getElementById("csv-upload") as HTMLInputElement) {
        (document.getElementById("csv-upload") as HTMLInputElement).value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Import Transactions</h2>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>CSV Format Requirements</AlertTitle>
        <AlertDescription>
          Your CSV file must include the following columns:{" "}
          <strong>date, vendor, category, transactionType</strong>, and amount
          (optional).
          <br />
          Example: <code>date,vendor,amount,category,transactionType</code>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="csv-upload" className="text-sm font-medium">
          Upload CSV File
        </Label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full">
        {loading ? "Uploading..." : "Upload and Import"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && result && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            <p>Imported {result.total} transactions:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>{result.created} transactions added</li>
              {result.skipped > 0 && (
                <li>{result.skipped} transactions skipped (duplicates)</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
