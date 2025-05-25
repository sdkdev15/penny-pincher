"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function ScanReceiptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<{ itemName: string; pieces: string; price: string; totalPrice: string }[]>([]);
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .replace(/\r\n|\r|\n/g, "\n")
      .replace(/[^\x20-\x7E\n]+/g, "")
      .replace(/ +/g, " ")
      .trim();
  };
  const preprocessImage = async (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const scale = 2; // Resize to improve resolution
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Grayscale
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const avg = 0.3 * imgData.data[i] + 0.59 * imgData.data[i + 1] + 0.11 * imgData.data[i + 2];
          imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = avg > 160 ? 255 : 0; // Binarize
        }
        ctx.putImageData(imgData, 0, 0);

        resolve(canvas);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScanReceipt = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please upload a receipt image.", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    try {
      const canvas = await preprocessImage(file);

      const { data } = await Tesseract.recognize(canvas, "eng+ind", {
        logger: (info) => console.log(info),
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // or try PSM.SPARSE_TEXT
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/()- ",
      });

      let extractedText = normalizeText(data.text);
      setRawText(extractedText);
      // console.log("Normalized Text:\n", extractedText);

      const lines = extractedText.split("\n").map(line => line.trim()).filter(Boolean);

      const itemRegex = /^(.+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/;
      const totalBelanjaRegex = /total belanja/i;

      let items: typeof scannedItems = [];
      let totalBelanja = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const match = line.match(itemRegex);
        if (match) {
          const [, itemName, pieces, price, totalPrice] = match;
          items.push({
            itemName: itemName.trim(),
            pieces: pieces.trim(),
            price: price.replace(/,/g, "").trim(),
            totalPrice: totalPrice.replace(/,/g, "").trim(),
          });
          continue;
        }

        // Handle split item lines (name on one, qty/price on next)
        if (
          i + 1 < lines.length &&
          /^\d+\s+[\d.,]+\s+[\d.,]+$/.test(lines[i + 1])
        ) {
          const name = line.trim();
          const parts = lines[i + 1].trim().split(/\s+/);
          if (parts.length === 3) {
            const [pieces, price, totalPrice] = parts;
            items.push({
              itemName: name,
              pieces,
              price: price.replace(/,/g, ""),
              totalPrice: totalPrice.replace(/,/g, ""),
            });
            i++;
            continue;
          }
        }

        // Detect total
        if (totalBelanjaRegex.test(line)) {
          const match = line.match(/([\d.,]+)$/);
          if (match) {
            totalBelanja = match[1].replace(/\./g, "").replace(/,/g, "").trim();
          }
        }
      }

      setScannedItems(items);
      setTransactionAmount(totalBelanja);
      toast({ title: "Success", description: "Receipt scanned successfully!" });

    } catch (error) {
      console.error("Error scanning receipt:", error);
      toast({ title: "Error", description: "Failed to scan the receipt. Please try again.", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
    };


  const handleSaveTransaction = () => {
    console.log("Saving transaction:", { items: scannedItems, amount: transactionAmount });
    toast({ title: "Success", description: "Transaction saved successfully!" });
    setScannedItems([]);
    setTransactionAmount("");
    setRawText("");
    setFile(null);
  };

  const handleEditItem = (index: number, field: keyof typeof scannedItems[0], value: string) => {
    setScannedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="flex min-h-screen bg-background p-4 gap-4">
      {/* Left Column: Upload + Transactions */}
      <div className="flex flex-col flex-1 gap-4">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Upload or Take Photo of Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Choose a receipt image or take a new photo:
              </label>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
            </div>
            <Button onClick={handleScanReceipt} disabled={isScanning || !file}>
              {isScanning ? "Scanning..." : "Scan Receipt"}
            </Button>
          </CardContent>
        </Card>

        {/* Mapped Transactions Section */}
        {scannedItems.length > 0 && (
          <Card className="flex-1 overflow-auto">
            <CardHeader>
              <CardTitle>Mapped Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table className="w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-sm font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">Item Name</th>
                    <th className="px-6 py-3 text-left">Pieces</th>
                    <th className="px-6 py-3 text-left">Price</th>
                    <th className="px-6 py-3 text-left">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
                  {scannedItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <Input value={item.itemName} onChange={(e) => handleEditItem(index, "itemName", e.target.value)} />
                      </td>
                      <td className="px-6 py-4">
                        <Input value={item.pieces} onChange={(e) => handleEditItem(index, "pieces", e.target.value)} />
                      </td>
                      <td className="px-6 py-4">
                        <Input value={item.price} onChange={(e) => handleEditItem(index, "price", e.target.value)} />
                      </td>
                      <td className="px-6 py-4">
                        <Input value={item.totalPrice} onChange={(e) => handleEditItem(index, "totalPrice", e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Amount</label>
                <Input
                  type="text"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveTransaction}>Save Transaction</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: OCR Output */}
      {rawText && (
        <div className="w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>OCR Output</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={rawText} readOnly className="h-[calc(100vh-200px)] resize-none bg-gray-100 dark:bg-gray-800" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>

  );
}
