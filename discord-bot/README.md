# Guardian Discord Bot

Profesyonel Discord sunucu botu: koruma, log, moderasyon, duyuru/DM, hoş geldin, ticket, çekiliş ve seviye sistemi.

## Özellikler

- **Koruma:** Anti-spam, anti-invite, anti-link, anti-raid, anti-caps, mod modu
- **Loglar:** Mesaj silme/düzenleme, giriş-çıkış, moderasyon aksiyonları
- **Moderasyon:** ban, unban, kick, timeout, warn, temizle, kilit, yavaş mod, rol
- **Duyuru & DM:** kanal duyurusu, tekil DM, toplu DM (hız sınırlı)
- **Hoş geldin:** kanal mesajı + isteğe bağlı otomatik silme + oto rol
- **Ticket:** panel, aç/üstlen/kapat, destek rolü, ticket log
- **Çekiliş:** butonlu katılım, otomatik bitiş, kazanan seçimi
- **Seviye:** XP, seviye atlama, liderlik tablosu
- **7/24:** PM2 / Docker / Railway / Render ile sürekli çalışma

## Kurulum

### 1) Discord uygulaması

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. **Bot** sekmesinden token al
3. Privileged Intents aç:
   - Server Members Intent
   - Message Content Intent
4. OAuth2 → URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Permissions: Administrator (veya Manage Channels/Roles/Messages, Ban, Kick, Moderate Members, Send Messages, Embed Links)
5. Oluşan link ile botu sunucuya ekle

### 2) Projeyi çalıştır

```bash
cd discord-bot
cp .env.example .env
# .env dosyasını doldur
npm install
npm run deploy-commands
npm start
```

### 3) Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | (Opsiyonel) Komutları anında kaydetmek için sunucu ID |
| `OWNER_ID` | (Opsiyonel) Bot sahibi kullanıcı ID |
| `WELCOME_DELETE_AFTER` | Hoş geldin mesajı silme süresi (sn) |

## İlk kurulum komutları

```text
/ayarlar log kanal:#logs
/ayarlar hosgeldin kanal:#hos-geldin sil_saniye:30
/ayarlar ticket kategori:#Tickets destek_rolu:@Destek log:#ticket-log
/ayarlar duyuru-kanal kanal:#duyurular
/ayarlar seviye-kanal kanal:#seviye
/koruma ayarla modul:Anti-Spam aktif:True
/ticket panel
```

## 7/24 aktif tutma

### PM2 (VPS)

```bash
npm i -g pm2
npm run pm2:start
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t guardian-bot .
docker run -d --name guardian-bot --env-file .env -v $(pwd)/data:/app/data guardian-bot
```

### Railway / Render / Heroku

- Start command: `node src/index.js`
- Worker/background dyno kullan (web değil)
- `DISCORD_TOKEN`, `CLIENT_ID` secret olarak ekle

## Komut listesi

| Komut | İşlev |
|---|---|
| `/yardim` | Tüm komutlar |
| `/koruma` | Koruma modülleri |
| `/ayarlar` | Sunucu ayarları |
| `/duyuru` | Duyuru at |
| `/dm gonder` | Tekil DM |
| `/dm herkes` | Toplu DM |
| `/ticket` | Ticket paneli / kapat |
| `/cekilis` | Çekiliş başlat / bitir |
| `/seviye` `/liderlik` | Seviye sistemi |
| `/ban` `/kick` `/timeout` `/warn` `/temizle` ... | Moderasyon |

## Notlar

- Toplu DM Discord limitlerine takılabilir; bot kasıtlı olarak yavaş gönderir.
- Bazı kullanıcıların DM’leri kapalı olabilir — bu normaldir.
- Veriler `discord-bot/data/guardian.db` (SQLite) içinde tutulur; kalıcılık için bu klasörü yedekle.

## Lisans

MIT
