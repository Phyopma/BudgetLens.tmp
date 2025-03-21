"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
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

      // Reset the file input
      const fileInput = document.getElementById(
        "csv-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 border rounded-lg space-y-4"
      data-testid="csv-upload-component">
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

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20"
        }`}>
        <input {...getInputProps({ id: "csv-upload" })} />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the CSV file here"
              : "Drag & drop a CSV file here, or click to select a file"}
          </p>
          {file && (
            <p className="text-sm font-medium text-primary">
              Selected: {file.name}
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full"
        data-testid="upload-button">
        {loading ? "Uploading..." : "Upload and Import"}
      </Button>

      {error && (
        <Alert variant="destructive" data-testid="error-alert">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && result && (
        <Alert
          variant="default"
          className="bg-green-50 border-green-200"
          data-testid="success-alert">
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
