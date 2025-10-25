import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon, User, Shield, Bell, Activity } from "lucide-react";
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

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const { data: activityLogs } = trpc.activityLogs.list.useQuery();

  const handleSaveProfile = () => {
    // Profile update will be implemented when backend API is ready
    toast.success("Profil bilgileri güncellendi");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-500 mt-1">
            Hesap ayarlarınızı ve tercihlerinizi yönetin
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Güvenlik
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Bildirimler
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Aktivite Logları
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription>
                  Hesap bilgilerinizi görüntüleyin ve düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md border">
                    <span className="font-medium capitalize">
                      {user?.role === "master" ? "Master Kullanıcı" : 
                       user?.role === "dealer" ? "Bayi" :
                       user?.role === "admin" ? "Yönetici" : "Kullanıcı"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SMS Kredisi</Label>
                  <div className="px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
                    <span className="font-bold text-blue-600 text-lg">
                      {user?.smsBalance || 0}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Kredisi</Label>
                  <div className="px-3 py-2 bg-purple-50 rounded-md border border-purple-200">
                    <span className="font-bold text-purple-600 text-lg">
                      {user?.emailBalance || 0}
                    </span>
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveProfile} className="w-full">
                  Değişiklikleri Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>
                  Hesap güvenliğinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mevcut Şifre</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yeni Şifre</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Separator />
                <Button onClick={() => toast.info("Şifre değiştirme özelliği yakında eklenecek")} className="w-full">
                  Şifreyi Güncelle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Tercihleri</CardTitle>
                <CardDescription>
                  Hangi bildirimleri almak istediğinizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Bildirimleri</p>
                    <p className="text-sm text-gray-500">
                      Kampanya ve sistem bildirimleri
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Bildirim ayarları yakında eklenecek")}>
                    Aktif
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Bildirimleri</p>
                    <p className="text-sm text-gray-500">
                      Önemli sistem uyarıları
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Bildirim ayarları yakında eklenecek")}>
                    Pasif
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kampanya Raporları</p>
                    <p className="text-sm text-gray-500">
                      Günlük kampanya özet raporları
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Bildirim ayarları yakında eklenecek")}>
                    Aktif
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>
                  Hesabınızdaki son işlemleri görüntüleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs && activityLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlem</TableHead>
                        <TableHead>Detaylar</TableHead>
                        <TableHead>IP Adresi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.action}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {log.details || "-"}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {log.ipAddress || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Henüz aktivite kaydı bulunmuyor
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

