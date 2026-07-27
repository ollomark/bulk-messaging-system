# Lexyxzon Professional Suite v2

Sıradan “herkesin yaptığı” bot paketlerinin üstünde: tek merkezden yönetim, büyüme ve engagement odaklı premium Discord suite.

## Neyi farklı kılıyor?

- **`/panel` Control Center** — menüden tüm modülleri yönet
- **Doğrulama kapısı** — butonla verify
- **Davet takibi** — kim kimi getirdi + liderlik
- **Starboard** — yıldızlanan içerik vitrini
- **Öneri sistemi** — 👍/👎 oylamalı
- **Geçici ses odaları** — join-to-create
- **Buton-rol** — emoji yerine modern panel
- **Oto yanıt** — tetikleyici → cevap
- **Mod Case sistemi** — Case #ID ile profesyonel kayıt
- **Analitik** — `/istatistik`
- Klasik suite: koruma, log, ticket, çekiliş, seviye, 7/24 ses, emoji-rol

## Hızlı başlangıç (sunucuda)

```text
/panel
/dogrulama kur kanal:#dogrulama rol:@Üye
/starboard ayarla kanal:#starboard limit:3
/oneri kanal kanal:#oneriler
/gecicises kur kanal:#Oda-Olustur
/butonrol kanal:#roller rol1:@Duyuru yazi1:Duyurular
/otoyanit ekle tetikleyici:fiyat cevap:Fiyat için ticket açın.
```

## Kurulum

```bash
cd discord-bot
cp .env.example .env
npm install
npm run deploy-commands
npm start
```

Gerekli privileged intents: **Server Members**, **Message Content**.

## 7/24

Railway / Docker / PM2. Bu projede Railway üzerinde canlı çalışıyor.
