import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Users, CreditCard, History } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Dealers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [smsBalance, setSmsBalance] = useState(0);
  const [emailBalance, setEmailBalance] = useState(0);
  
  const [smsAmount, setSmsAmount] = useState(0);
  const [emailAmount, setEmailAmount] = useState(0);
  const [note, setNote] = useState("");

  const utils = trpc.useUtils();
  const { data: dealers, isLoading } = trpc.dealers.list.useQuery();
  const { data: creditHistory } = trpc.dealers.creditHistory.useQuery();

  const createMutation = trpc.dealers.create.useMutation({
    onSuccess: () => {
      utils.dealers.list.invalidate();
      setCreateOpen(false);
      resetCreateForm();
      toast.success("Bayi başarıyla oluşturuldu");
    },
    onError: (error) => {
      toast.error("Bayi oluşturulamadı: " + error.message);
    },
  });

  const transferMutation = trpc.dealers.transferCredit.useMutation({
    onSuccess: () => {
      utils.dealers.list.invalidate();
      utils.dealers.creditHistory.invalidate();
      utils.dashboard.stats.invalidate();
      setCreditOpen(false);
      resetCreditForm();
      toast.success("Kredi başarıyla transfer edildi");
    },
    onError: (error) => {
      toast.error("Kredi transferi başarısız: " + error.message);
    },
  });

  const resetCreateForm = () => {
    setName("");
    setEmail("");
    setSmsBalance(0);
    setEmailBalance(0);
  };

  const resetCreditForm = () => {
    setSmsAmount(0);
    setEmailAmount(0);
    setNote("");
    setSelectedDealer(null);
  };

  const handleCreate = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Ad ve email gereklidir");
      return;
    }
    createMutation.mutate({ name, email, smsBalance, emailBalance });
  };

  const handleTransfer = () => {
    if (!selectedDealer) {
      toast.error("Bayi seçilmedi");
      return;
    }
    if (smsAmount <= 0 && emailAmount <= 0) {
      toast.error("Transfer miktarı 0'dan büyük olmalıdır");
      return;
    }
    transferMutation.mutate({
      dealerId: selectedDealer.id,
      smsAmount,
      emailAmount,
      note,
    });
  };

  const openCreditDialog = (dealer: any) => {
    setSelectedDealer(dealer);
    setCreditOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bayi Yönetimi</h1>
            <p className="text-gray-500 mt-1">
              Bayilerinizi oluşturun ve kredi yönetimi yapın
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Bayi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Bayi Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bayi Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Örn: ABC Şubesi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsBalance">Başlangıç SMS Kredisi</Label>
                    <Input
                      id="smsBalance"
                      type="number"
                      min="0"
                      value={smsBalance}
                      onChange={(e) => setSmsBalance(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailBalance">Başlangıç Email Kredisi</Label>
                    <Input
                      id="emailBalance"
                      type="number"
                      min="0"
                      value={emailBalance}
                      onChange={(e) => setEmailBalance(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Oluşturuluyor..." : "Bayi Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dealers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dealers">
              <Users className="h-4 w-4 mr-2" />
              Bayiler
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Kredi Geçmişi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dealers" className="space-y-4">
            {isLoading ? (
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ) : dealers && dealers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Bayi Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bayi Adı</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">SMS Kredisi</TableHead>
                        <TableHead className="text-right">Email Kredisi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealers.map((dealer) => (
                        <TableRow key={dealer.id}>
                          <TableCell className="font-medium">{dealer.name}</TableCell>
                          <TableCell>{dealer.email}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-blue-600">
                              {dealer.smsBalance}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-purple-600">
                              {dealer.emailBalance}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreditDialog(dealer)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Kredi Yükle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz bayi oluşturmadınız
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    İlk bayinizi oluşturarak başlayın
                  </p>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Bayi Oluştur
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kredi Transfer Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                {creditHistory && creditHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>SMS Miktarı</TableHead>
                        <TableHead>Email Miktarı</TableHead>
                        <TableHead>Not</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditHistory.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell>
                            {new Date(transfer.createdAt).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-blue-600">
                              {transfer.smsAmount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-purple-600">
                              {transfer.emailAmount}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {transfer.note || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Henüz kredi transferi yapılmamış
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credit Transfer Dialog */}
        <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Kredi Yükle - {selectedDealer?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="smsAmount">SMS Kredisi</Label>
                <Input
                  id="smsAmount"
                  type="number"
                  min="0"
                  value={smsAmount}
                  onChange={(e) => setSmsAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailAmount">Email Kredisi</Label>
                <Input
                  id="emailAmount"
                  type="number"
                  min="0"
                  value={emailAmount}
                  onChange={(e) => setEmailAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Not (Opsiyonel)</Label>
                <Input
                  id="note"
                  placeholder="Transfer notu"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
                className="w-full"
              >
                {transferMutation.isPending ? "Transfer Ediliyor..." : "Kredi Transfer Et"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

