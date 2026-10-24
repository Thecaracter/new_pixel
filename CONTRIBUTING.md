# Contributing to Kantor Virtual — Pixel Works 🏢✨

Terima kasih atas minat Anda untuk berkontribusi! Project ini bersifat open-source dan kami sangat menyambut kontribusi dari komunitas—baik berupa perbaikan bug, penambahan fitur AI agent baru, peningkatan visual 3D, maupun perbaikan dokumentasi.

---

## 🛠️ Langkah Memulai (Getting Started)

1. **Fork** repositori ini ke akun GitHub Anda.
2. **Clone** hasil fork ke mesin lokal:
   ```bash
   git clone https://github.com/<username>/new_pixel.git
   cd new_pixel
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Buat Branch Baru**:
   Gunakan nama branch yang deskriptif:
   ```bash
   # Fitur baru
   git checkout -b feat/nama-fitur

   # Perbaikan bug
   git checkout -b fix/deskripsi-bug
   ```

---

## 🧪 Panduan Menjalankan & Menguji (Testing)

Sebelum membuat Pull Request, pastikan seluruh pengujian lokal lulus tanpa error:

```bash
# Jalankan unit tests
npm run test:unit

# Jalankan production build untuk memastikan tidak ada error bundle
npm run build
```

Jika Anda memodifikasi atau menambah fitur baru di backend / AI agent:
- Tambahkan pengujian baru di direktori `tests/`.
- Pastikan tidak ada race condition pada penyimpanan file durabel (`server/storage.js`).

---

## 💡 Ide & Area Kontribusi

Berikut beberapa area yang sangat terbuka untuk kolaborasi:
- 🎨 **3D & Visual**: Menambah variasi furniture kantor, animasi karakter baru di Three.js, atau efek cuaca/siang-malam.
- 🤖 **AI Agents & MCP**: Menambahkan tool domain baru di `server/mcp/tools.js` (misal: integrasi GitHub, analitik SEO, code linter).
- 📋 **Kanban Board**: Drag-and-drop antar kolom, label tag prioritas, dan filter tanggal deadline.
- 📱 **Mobile & PWA**: Penyempurnaan responsivitas pada layar mobile kecil dan mode offline.

---

## 📝 Format Pesan Commit

Gunakan konvensi commit standar (Conventional Commits):
- `feat: tambah tool MCP untuk analisis SEO`
- `fix: tangani error koneksi backend pada chat panel`
- `docs: perbarui panduan konfigurasi environment`
- `style: perbaiki styling bubble chat dan kontras warna`
- `test: tambah unit test untuk isolasi thread chat`

---

## 🚀 Mengirim Pull Request (PR)

1. Push perubahan ke fork GitHub Anda:
   ```bash
   git push origin feat/nama-fitur
   ```
2. Buka GitHub dan buat **Pull Request** ke branch `master`.
3. Tuliskan deskripsi ringkas mengenai:
   - Apa yang diubah / ditambahkan.
   - Mengapa perubahan tersebut dibutuhkan.
   - Hasil pengujian lokal (`npm run test:unit` & `npm run build`).
4. Tunggu review dari maintainer! Kami akan dengan senang hati meninjau dan menggabungkan kontribusi Anda.

---

## 📄 Lisensi

Dengan berkontribusi pada repositori ini, Anda setuju bahwa kontribusi Anda dilisensikan di bawah [MIT License](LICENSE).
