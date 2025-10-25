# Project TODO

## Veritabanı Şeması
- [x] Kullanıcı bakiye alanları ekle (SMS ve Email kredisi)
- [x] Kişi grupları tablosu oluştur
- [x] Kişiler tablosu oluştur
- [x] SMS kampanyaları tablosu oluştur
- [x] Email kampanyaları tablosu oluştur
- [x] SMS gönderim logları tablosu oluştur
- [x] Email gönderim logları tablosu oluştur
- [x] Kara liste tablosu oluştur

## Backend API
- [x] Grup yönetimi CRUD API'leri
- [x] Kişi yönetimi API'leri
- [x] SMS kampanya oluşturma API'si
- [x] Email kampanya oluşturma API'si
- [x] Dashboard istatistikleri API'si
- [ ] Bakiye yönetimi API'leri

## Frontend - Temel Yapı
- [x] Dashboard layout oluştur
- [x] Ana sayfa (Dashboard) tasarımı
- [x] Navigasyon menüsü
- [x] Kullanıcı profil menüsü

## Frontend - SMS Özellikleri
- [x] Yeni SMS kampanyası formu
- [x] SMS kampanya listesi
- [ ] SMS raporları sayfası
- [ ] Planlanmış SMS gönderimler

## Frontend - Email Özellikleri
- [x] Yeni Email kampanyası formu
- [x] Email kampanya listesi
- [ ] Email raporları sayfası
- [ ] HTML email editörü entegrasyonu

## Frontend - Grup Yönetimi
- [x] Listelerim sayfası
- [x] Yeni liste oluşturma
- [ ] Kişi ekleme/düzenleme
- [ ] Kara liste yönetimi

## Entegrasyonlar
- [ ] SMS API entegrasyonu (Twilio veya benzeri)
- [ ] Email API entegrasyonu (SendGrid veya benzeri)

## Test ve Yayın
- [ ] Tüm özellikleri test et
- [ ] Checkpoint oluştur




## Yeni Özellikler - Çok Seviyeli Sistem

### Master Panel (Bayi Yönetimi)
- [x] Kullanıcı rollerini güncelle (master, bayi, kullanıcı)
- [x] Bayi oluşturma sayfası
- [x] Bayi listesi ve yönetim sayfası
- [x] Bayilere kredi yükleme özelliği
- [x] Kredi transfer geçmişi
- [x] Tüm bayilerin numaralarını görüntüleme (API hazır)
- [x] Tüm bayilerin SMS gönderimlerini görüntüleme (API hazır)

### Bayi Paneli Özellikleri
- [x] Excel/CSV dosya yükleme özelliği
- [x] Otomatik duplicate numara temizleme
- [x] Toplu numara import işlemi
- [x] Kendi kredi limitini görüntüleme
- [ ] Kredi limiti kontrolü ile SMS gönderimi

### Veritabanı Güncellemeleri
- [x] User tablosuna parentId ekle (bayi-master ilişkisi)
- [x] Kredi transfer tablosu oluştur
- [x] Numara import geçmişi tablosu

### Gelecek Geliştirmeler
- [ ] Master paneli için tüm numaralar sayfası (frontend)
- [ ] Master paneli için tüm kampanyalar sayfası (frontend)
- [ ] SMS gönderimi sırasında kredi kontrolü
- [ ] Gerçek SMS API entegrasyonu

