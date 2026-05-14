# Seferio Air Frontend

React + Vite ile hazırlanmış uçak bileti arama, rezervasyon, Stripe ödeme, chatbot ve sesli asistan arayüzü.

## VS Code'da Çalıştırma

1. Projeyi VS Code ile açın.
2. Terminali açın.
3. Bağımlılıkları kurun:

```bash
npm install
```

4. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

5. Tarayıcıda Vite'ın verdiği adresi açın. Genelde:

```text
http://127.0.0.1:5173
```

Bu projede port doluysa Vite otomatik olarak `5174` gibi bir sonraki portu kullanabilir.

## Backend Ayarı

Bu frontend uygulaması Spring Boot tabanlı `UcakBiletOtamasyonu` backend ile çalışır.

- Varsayılan backend adresi:

```text
http://localhost:8080
```

- Frontend tarafından kullanılan env değişkenleri:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT_MS=15000
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel
```

`.env.example` dosyasını `.env` olarak kopyalayarak yerel ayarlarınızı tanımlayabilirsiniz:

```bash
cp .env.example .env
```

Windows PowerShell kullanıyorsanız:

```powershell
Copy-Item .env.example .env
```

> Not: `.env` dosyası sadece bu frontend uygulaması içindir. Spring Boot backend için `application.properties` veya ilgili environment değişkenleri ayrı olarak konfigüre edilmelidir.

### Backend kurulumu

1. PostgreSQL çalıştırın:

```bash
docker run --name my-postgres -e POSTGRES_PASSWORD=gizlisifrem -p 5432:5432 -d postgres
```

2. pgAdmin çalıştırın:

```bash
docker run --name my-pgadmin -p 5050:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin -d dpage/pgadmin4
```

3. pgAdmin veya başka bir PostgreSQL istemcisi ile bağlandıktan sonra gerekli şemayı oluşturun:

```sql
DROP SCHEMA ucakbiletotamasyonu CASCADE;
CREATE SCHEMA ucakbiletotamasyonu;
```

4. Backend config için gerekli environment değerleri:

```env
DB_URL=jdbc:postgresql://localhost:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=postgres
COOKIE_SECURE=false
```

### Backend çalıştırma

```bash
./mvnw spring-boot:run
```

Windows için:

```powershell
mvnw.cmd spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html#/
```

### Auth endpointleri

Base path: `/api/v1/auth`

- `POST /api/v1/auth/register`
  - Body:
    ```json
    {
      "email": "test@example.com",
      "password": "123456"
    }
    ```

- `POST /api/v1/auth/login`
  - Body:
    ```json
    {
      "email": "test@example.com",
      "password": "123456"
    }
    ```
  - Başarılıysa `accessToken` response body içinde döner, `refreshToken` HttpOnly cookie olarak set edilir.

- `POST /api/v1/auth/verify-email`
  - Body:
    ```json
    {
      "email": "test@example.com",
      "verificationCode": "123456"
    }
    ```

- `POST /api/v1/auth/resend-verification-email`
  - Body:
    ```json
    {
      "email": "test@example.com"
    }
    ```

- `POST /api/v1/auth/refresh-token`
  - Body gerekmez. Cookie ile çalışır.

- `POST /api/v1/auth/logout`
  - Refresh token cookie'sini temizler ve DB kaydını siler.

### Backend auth davranışı

- Local hesaplar sadece local login ile çalışır.
- Google hesaplar sadece Google login ile çalışır.
- Facebook hesaplar sadece Facebook login ile çalışır.
- Local hesaplar login olmadan önce email verification tamamlamalıdır.
- Aynı email farklı sosyal provider ile eşleşirse yeni hesap açılmaz.
- Email + password ile kayıtlı kullanıcı sosyal login ile giriş yapamaz.
- Google veya Facebook ile kayıtlı kullanıcı, aynı provider ile tekrar giriş yapabilir.

### Voice assistant endpointleri

- `POST /api/v1/voice/process`
  - `multipart/form-data` bekler
  - `audio` alanı zorunludur
  - `conversationId` opsiyoneldir
  - Authenticated istek bekler

- `DELETE /api/v1/voice/conversation?conversationId=demo-1`
  - İlgili konuşma hafızasını temizler.

## Hazır Backend Servisleri

Frontend servisleri `src/app/services` altında gruplanmıştır:

- `apiClient.ts`: Ortak API istemcisi, JWT header, `data/payload` cevap normalizasyonu.
- `authService.ts`: Login, register, logout, email doğrulama, şifre sıfırlama.
- `flightService.ts`: Uçuş listeleme, arama, detay, kayıt, güncelleme, silme.
- `chatService.ts`: AI chatbot mesaj gönderme.
- `voiceService.ts`: Sesli asistan için multipart audio gönderme, audio blob alma, konuşma silme.
- `paymentService.ts`: Stripe checkout, success, cancel, reservation payment sorgusu.
- `ticketService.ts`: Bilet detayları, kullanıcı biletleri, rezervasyon bileti, tüm biletler, silme.

## Spring Boot CORS Notu

Frontend dev sunucusu `http://localhost:5173` veya `http://127.0.0.1:5174` gibi çalışır. Backend tarafında CORS için bu origin'lere izin verilmelidir.

Örnek:

```java
registry.addMapping("/**")
    .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174")
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*")
    .allowCredentials(false);
```

## Demo ve Backend Davranışı

Uçuş arama, chatbot ve ödeme ekranları backend bağlı değilken demo verilerle çalışmaya devam eder. Backend çalıştığında servisler otomatik olarak `VITE_API_BASE_URL` üzerinden Spring Boot endpointlerine istek atar.

JWT token başarılı login sonrasında `localStorage.accessToken` içine kaydedilir ve auth gerektiren endpointlerde `Authorization: Bearer <token>` olarak gönderilir.

## Derleme

```bash
npm run build
```

Derlenmiş çıktıyı kontrol etmek için:

```bash
npm run preview
```
