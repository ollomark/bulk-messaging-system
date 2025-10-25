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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SmsCampaigns() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sendType, setSendType] = useState<"standard" | "fromList">("standard");
  const [groupId, setGroupId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.smsCampaigns.list.useQuery();
  const { data: groups } = trpc.contactGroups.list.useQuery();

  const createMutation = trpc.smsCampaigns.create.useMutation({
    onSuccess: () => {
      utils.smsCampaigns.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("SMS kampanyası başarıyla oluşturuldu");
    },
    onError: (error) => {
      toast.error("Kampanya oluşturulamadı: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setMessage("");
    setSendType("standard");
    setGroupId("");
  };

  const handleCreate = () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Kampanya adı ve mesaj gereklidir");
      return;
    }

    if (message.length > 155) {
      toast.error("Mesaj 155 karakterden uzun olamaz");
      return;
    }

    createMutation.mutate({
      name,
      message,
      sendType,
      groupId: groupId ? parseInt(groupId) : undefined,
      status: "draft",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Taslak" },
      scheduled: { color: "bg-blue-100 text-blue-800", label: "Planlandı" },
      sending: { color: "bg-yellow-100 text-yellow-800", label: "Gönderiliyor" },
      completed: { color: "bg-green-100 text-green-800", label: "Tamamlandı" },
      failed: { color: "bg-red-100 text-red-800", label: "Başarısız" },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Kampanyaları</h1>
            <p className="text-gray-500 mt-1">
              Toplu SMS kampanyalarınızı oluşturun ve yönetin
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kampanya
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni SMS Kampanyası</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kampanya Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Örn: Yaz İndirimi Kampanyası"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendType">Gönderim Türü</Label>
                  <Select
                    value={sendType}
                    onValueChange={(value) =>
                      setSendType(value as "standard" | "fromList")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standart</SelectItem>
                      <SelectItem value="fromList">Listeden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendType === "fromList" && (
                  <div className="space-y-2">
                    <Label htmlFor="group">Grup Seçin</Label>
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
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message">Mesaj *</Label>
                    <span className="text-xs text-gray-500">
                      {message.length} / 155 karakter
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="SMS mesajınızı buraya yazın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={155}
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Oluşturuluyor..." : "Kampanya Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {campaign.message}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Toplam Alıcı</p>
                      <p className="text-lg font-semibold">
                        {campaign.totalRecipients}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gönderilen</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {campaign.sentCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">İletilen</p>
                      <p className="text-lg font-semibold text-green-600">
                        {campaign.deliveredCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Başarısız</p>
                      <p className="text-lg font-semibold text-red-600">
                        {campaign.failedCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(campaign.createdAt).toLocaleString("tr-TR")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz SMS kampanyası oluşturmadınız
              </h3>
              <p className="text-gray-500 text-center mb-4">
                İlk kampanyanızı oluşturarak başlayın
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kampanya Oluştur
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

