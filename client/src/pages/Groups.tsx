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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Groups() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.contactGroups.list.useQuery();
  const createMutation = trpc.contactGroups.create.useMutation({
    onSuccess: () => {
      utils.contactGroups.list.invalidate();
      setOpen(false);
      setName("");
      setDescription("");
      toast.success("Grup başarıyla oluşturuldu");
    },
    onError: (error) => {
      toast.error("Grup oluşturulamadı: " + error.message);
    },
  });

  const deleteMutation = trpc.contactGroups.delete.useMutation({
    onSuccess: () => {
      utils.contactGroups.list.invalidate();
      toast.success("Grup başarıyla silindi");
    },
    onError: (error) => {
      toast.error("Grup silinemedi: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Grup adı gereklidir");
      return;
    }
    createMutation.mutate({ name, description });
  };

  const handleDelete = (groupId: number) => {
    if (confirm("Bu grubu silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate({ groupId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grup Yönetimi</h1>
            <p className="text-gray-500 mt-1">
              Kişi gruplarınızı oluşturun ve yönetin
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Grup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Grup Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Grup Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Örn: Müşteriler"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    placeholder="Grup hakkında kısa bir açıklama"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {group.description || "Açıklama yok"}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Oluşturulma:{" "}
                      {new Date(group.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz grup oluşturmadınız
              </h3>
              <p className="text-gray-500 text-center mb-4">
                İlk grubunuzu oluşturarak başlayın
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Grup Oluştur
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

