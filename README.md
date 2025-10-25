# Toplu SMS ve Mail Gönderim Sistemi

Modern, çok seviyeli toplu SMS ve email gönderim platformu.

## 🚀 Hızlı Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ollomark/bulk-messaging-system)

**Not:** Heroku'da MySQL database için JawsDB eklentisi otomatik olarak eklenecektir.

## 🚀 Özellikler

### Master Panel
- ✅ Bayi oluşturma ve yönetimi
- ✅ Bayilere kredi yükleme sistemi
- ✅ Tüm bayilerin numaralarını görüntüleme
- ✅ Tüm SMS/Email kampanyalarını izleme
- ✅ Kredi transfer geçmişi
- ✅ Detaylı raporlama ve istatistikler

### Bayi Paneli
- ✅ Excel/CSV ile toplu numara yükleme
- ✅ Otomatik duplicate numara temizleme
- ✅ Grup yönetimi
- ✅ SMS kampanya oluşturma
- ✅ Email kampanya oluşturma
- ✅ Kredi bakiyesi takibi

### Genel Özellikler
- ✅ Kullanıcı aktivite logları
- ✅ Rol bazlı erişim kontrolü (Master, Bayi, Admin)
- ✅ Responsive tasarım
- ✅ Modern ve kullanıcı dostu arayüz
- ✅ Gerçek zamanlı istatistikler

## 🛠️ Teknolojiler

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC 11
- **Database**: MySQL/TiDB (Drizzle ORM)
- **Authentication**: Manus OAuth
- **Deployment**: Vercel, Railway, DigitalOcean

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- pnpm
- MySQL/TiDB veritabanı

### Adımlar

1. Repoyu klonlayın:
```bash
git clone https://github.com/ollomark/bulk-messaging-system.git
cd bulk-messaging-system
```

2. Bağımlılıkları yükleyin:
```bash
pnpm install
```

3. Ortam değişkenlerini ayarlayın (gerekli değişkenler için dokümantasyona bakın)

4. Veritabanını oluşturun:
```bash
pnpm db:push
```

5. Geliştirme sunucusunu başlatın:
```bash
pnpm dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## 🗄️ Veritabanı Yapısı

- **users**: Kullanıcılar (Master, Bayi, Admin)
- **contactGroups**: Kişi grupları
- **contacts**: Kişiler ve telefon numaraları
- **smsCampaigns**: SMS kampanyaları
- **emailCampaigns**: Email kampanyaları
- **smsLogs**: SMS gönderim logları
- **emailLogs**: Email gönderim logları
- **creditTransfers**: Kredi transfer kayıtları
- **numberImports**: Numara import geçmişi
- **activityLogs**: Kullanıcı aktivite logları

## 🚀 Deployment

### Vercel
```bash
vercel deploy
```

### Railway
```bash
railway up
```

### Docker
```bash
docker-compose up -d
```

## 📝 API Entegrasyonu

SMS ve Email gönderimi için aşağıdaki servisleri entegre edebilirsiniz:

- **SMS**: Twilio, Nexmo, AWS SNS
- **Email**: SendGrid, Mailgun, AWS SES

## 🔐 Güvenlik

- JWT tabanlı authentication
- Rol bazlı yetkilendirme
- SQL injection koruması (Drizzle ORM)
- XSS koruması
- CSRF koruması

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Manus AI tarafından geliştirilmiştir.

