import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Search } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllNumbers() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: numbers, isLoading } = trpc.dealers.allNumbers.useQuery();

  const filteredNumbers = numbers?.filter(
    (contact) =>
      contact.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tüm Numaralar</h1>
          <p className="text-gray-500 mt-1">
            Tüm bayilerin eklediği numaraları görüntüleyin
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Numara, isim veya email ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Numbers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Numara Listesi ({filteredNumbers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : filteredNumbers && filteredNumbers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Ad</TableHead>
                      <TableHead>Soyad</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Özel Alan 1</TableHead>
                      <TableHead>Özel Alan 2</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNumbers.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.phoneNumber || "-"}
                        </TableCell>
                        <TableCell>{contact.firstName || "-"}</TableCell>
                        <TableCell>{contact.lastName || "-"}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell className="text-gray-600">
                          {contact.customField1 || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {contact.customField2 || "-"}
                        </TableCell>
                        <TableCell>
                          {contact.isBlacklisted ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Kara Liste
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Aktif
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Numara bulunamadı
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Arama kriterlerinize uygun numara bulunamadı"
                    : "Henüz hiç numara eklenmemiş"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

