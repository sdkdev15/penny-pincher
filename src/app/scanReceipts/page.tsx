"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Upload, Save, ArrowLeft } from "lucide-react";

interface ScannedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ScanResult {
  merchant: string | null;
  date: string | null;
  total: number | null;
  items: ScannedItem[];
  raw_text: string;
}

export default function ScanReceiptPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [merchant, setMerchant] = useState<string>("");
  const [showRawText, setShowRawText] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("1");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setScanResult(null);
      setItems([]);
      setTotalAmount("");
      setMerchant("");
    }
  };

  const handleScanReceipt = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a receipt image first.", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/process/receipts/scan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to scan receipt");
      }

      setScanResult(result.data);
      setMerchant(result.data.merchant || "");
      setTotalAmount(result.data.total?.toString() || "");
      setItems(result.data.items || []);

      toast({ title: "Success", description: "Receipt scanned successfully!" });

    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to scan receipt", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/process/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "expense",
          amount: parseFloat(totalAmount),
          categoryId: parseInt(selectedCategoryId) || 1,
          date: scanResult?.date || new Date().toISOString(),
          notes: merchant || "Receipt scan",
          receiptData: scanResult,
          scannedFromReceipt: true,
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Transaction saved!" });
        router.push("/transactions");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save transaction");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditItem = (index: number, field: keyof ScannedItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex flex-col flex-1 gap-4 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Scan Receipt</h1>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Upload Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </div>

            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-48 sm:max-h-64 max-w-full rounded-lg border object-contain mx-auto"
                />
              </div>
            )}

            <Button
              onClick={handleScanReceipt}
              disabled={isScanning || !file}
              className="w-full"
              size="lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan Receipt"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {scanResult && (
          <>
            {/* Merchant & Total */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Merchant/Store</label>
                  <Input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="Enter merchant name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Amount (Rp)</label>
                  <Input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="Enter total amount"
                    className="text-lg font-bold"
                  />
                  {totalAmount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(parseFloat(totalAmount))}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Items ({items.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRawText(!showRawText)}
                    >
                      {showRawText ? "Hide" : "Show"} Raw Text
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%] px-2 text-xs sm:text-sm">Item Name</TableHead>
                          <TableHead className="w-16 px-2 text-xs sm:text-sm">Qty</TableHead>
                          <TableHead className="w-24 px-2 text-xs sm:text-sm">Price</TableHead>
                          <TableHead className="w-24 px-2 text-xs sm:text-sm">Total</TableHead>
                          <TableHead className="w-10 px-2"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  handleEditItem(index, "name", e.target.value)
                                }
                                placeholder="Item name"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleEditItem(index, "quantity", parseFloat(e.target.value) || 0)
                                }
                                className="w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) =>
                                  handleEditItem(index, "unit_price", parseFloat(e.target.value) || 0)
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.total}
                                onChange={(e) =>
                                  handleEditItem(index, "total", parseFloat(e.target.value) || 0)
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(index)}
                                className="h-6 w-6"
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-right font-bold text-lg">
                    Calculated Total: {formatCurrency(parseFloat(calculateTotal()))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw OCR Text (optional) */}
            {showRawText && scanResult.raw_text && (
              <Card>
                <CardHeader>
                  <CardTitle>Raw OCR Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={scanResult.raw_text}
                    readOnly
                    className="h-48 font-mono text-sm bg-muted"
                  />
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <Button onClick={handleSaveTransaction} className="w-full min-h-[48px] text-base" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save Transaction
            </Button>
          </>
        )}
      </div>
    </div>
  );
}