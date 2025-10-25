import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mail, Calendar, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllEmailCampaigns() {
  const { data: campaigns, isLoading } = trpc.dealers.allCampaigns.useQuery();

  const emailCampaigns = campaigns?.email || [];

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Taslak" },
      scheduled: { bg: "bg-blue-100", text: "text-blue-800", label: "Planlandı" },
      sending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Gönderiliyor" },
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Tamamlandı" },
      failed: { bg: "bg-red-100", text: "text-red-800", label: "Başarısız" },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tüm Email Kampanyaları</h1>
          <p className="text-gray-500 mt-1">
            Tüm bayilerin oluşturduğu Email kampanyalarını görüntüleyin
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Kampanya</p>
                  <p className="text-2xl font-bold">{emailCampaigns.length}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {emailCampaigns.filter((c) => c.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gönderiliyor</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {emailCampaigns.filter((c) => c.status === "sending").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Başarısız</p>
                  <p className="text-2xl font-bold text-red-600">
                    {emailCampaigns.filter((c) => c.status === "failed").length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Kampanya Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : emailCampaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kampanya Adı</TableHead>
                      <TableHead>Konu</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Gönderilen</TableHead>
                      <TableHead className="text-right">İletilen</TableHead>
                      <TableHead className="text-right">Başarısız</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {campaign.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-right">
                          {campaign.sentCount}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {campaign.deliveredCount}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {campaign.failedCount}
                        </TableCell>
                        <TableCell>
                          {campaign.scheduledAt
                            ? new Date(campaign.scheduledAt).toLocaleString("tr-TR")
                            : new Date(campaign.createdAt).toLocaleString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kampanya bulunamadı
                </h3>
                <p className="text-gray-500">
                  Henüz hiç Email kampanyası oluşturulmamış
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

