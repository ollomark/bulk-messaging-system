import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload, FileSpreadsheet, History, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ImportNumbers() {
  const [groupId, setGroupId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const utils = trpc.useUtils();
  const { data: groups } = trpc.contactGroups.list.useQuery();
  const { data: history } = trpc.importNumbers.history.useQuery();
  const importMutation = trpc.importNumbers.upload.useMutation({
    onSuccess: (result) => {
      utils.importNumbers.history.invalidate();
      utils.contacts.list.invalidate({ groupId: parseInt(groupId) });
      setFile(null);
      setGroupId("");
      toast.success(
        `${result.imported} numara başarıyla eklendi. ${result.duplicatesRemoved} tekrar, ${result.alreadyExists} mevcut numara atlandı.`
      );
    },
    onError: (error) => {
      toast.error("Import başarısız: " + error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
        toast.error("Sadece CSV veya Excel dosyaları yüklenebilir");
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string): string[] => {
    const lines = text.split("\n");
    const numbers: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        // Try to extract phone number from the line
        const match = trimmed.match(/[\d\s\-\+\(\)]+/);
        if (match) {
          const cleaned = match[0].replace(/[\s\-\(\)]/g, "");
          if (cleaned.length >= 10) {
            numbers.push(cleaned);
          }
        }
      }
    }
    
    return numbers;
  };

  const handleImport = async () => {
    if (!file || !groupId) {
      toast.error("Dosya ve grup seçimi gereklidir");
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const numbers = parseCSV(text);

      if (numbers.length === 0) {
        toast.error("Dosyada geçerli numara bulunamadı");
        setImporting(false);
        return;
      }

      await importMutation.mutateAsync({
        groupId: parseInt(groupId),
        numbers,
        fileName: file.name,
      });
    } catch (error) {
      toast.error("Dosya okuma hatası: " + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Numara İçe Aktar</h1>
          <p className="text-gray-500 mt-1">
            Excel veya CSV dosyasından toplu numara yükleyin
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dosya Yükle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group">Hedef Grup *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Dosya Seç (CSV, Excel) *</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Dosya Formatı Bilgisi
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Her satırda bir telefon numarası olmalıdır</li>
                <li>• Numaralar 10 haneden az olmamalıdır</li>
                <li>• Tekrarlanan numaralar otomatik olarak temizlenecektir</li>
                <li>• Zaten mevcut olan numaralar atlanacaktır</li>
              </ul>
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || !groupId || importing}
              className="w-full"
            >
              {importing ? (
                "İçe Aktarılıyor..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Numaraları İçe Aktar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              İçe Aktarma Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Dosya Adı</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Tekrar</TableHead>
                    <TableHead className="text-right">Başarılı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-gray-500" />
                          {item.fileName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalNumbers}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {item.duplicatesRemoved}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {item.successfulImports}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Henüz içe aktarma yapılmamış
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

