# Panduan Kontribusi — Pixel Works Virtual Office

<p align="center">
  <strong>Pilihan Bahasa:</strong>
  <a href="CONTRIBUTING.md"><strong>English 🇬🇧</strong></a> | 
  <a href="CONTRIBUTING.id.md"><strong>Bahasa Indonesia 🇮🇩</strong></a>
</p>

Terima kasih atas minat Anda untuk berkontribusi pada **Pixel Works Virtual Office**! Kami sedang membangun ruang kerja kantor virtual 3D mandiri tempat AI agent berkolaborasi secara langsung dengan manusia. Kami sangat menyambut kontribusi dari developer, artis 3D, desainer UI/UX, dan penggiat AI dari seluruh Indonesia maupun dunia.

---

## 🎯 Apa yang Kami Harapkan dari Kontributor (Wishlist Fitur)

Kami membuka kesempatan kontribusi seluas-luasnya di beberapa area utama berikut. Jika Anda memiliki keahlian atau minat di salah satu bidang ini, kami sangat senang menerima Pull Request dari Anda:

### 1. 🎨 Visual 3D Kantor Virtual & Three.js (`src/components/three/`)
- **Perabotan Kantor Baru & Objek Interaktif**: Tambahkan model 3D prosedural seperti mesin kopi espresso (lengkap dengan partikel asap/uap!), meja biliar atau tenis meja di area santai (*break room*), rak server dengan lampu LED berkedip, papan tulis kerja (*whiteboard*), atau tanaman hias kantor.
- **Pencahayaan & Suasana Ruangan**: Fitur siklus siang dan malam (*Day / Night cycle*), bayangan ambient yang hangat, custom shader GLSL, atau efek suasana cuaca (dekorasi musim, rintik hujan di kaca jendela kantor).
- **Karakter Avatar & Animasi**: Aksesori karakter (kacamata, headphone, hoodie), variasi warna kulit & pakaian, serta animasi santai baru (minum kopi, peregangan badan, mondar-mandir saat sedang berpikir).
- **Navigasi Kamera & Tata Ruang**: Fitur zoom kamera isometrik halus (scroll mouse), geser kamera (*pan*), atau pengaturan tata letak ruang (*room layout customizer*).

### 2. 🛠️ Integrasi Model Context Protocol (MCP) (`server/mcp/`)
- **Integrasi Tool Populer**: Bangun dan uji coba tool MCP untuk GitHub, GitLab, PostgreSQL, Redis, Slack, Discord, Notion, Jira, Linear, dan Google Workspace.
- **Katalog Skill Agent**: Kembangkan fitur pencarian registri live (`server/mcp/catalog.js`) untuk menemukan, menginstal, dan memanggil tool secara dinamis dari NPM dan ekosistem komunitas MCP.
- **Keamanan & Sandboxing Tool**: Peningkatan isolasi eksekusi dan validasi parameter sebelum tool MCP dijalankan.

### 3. 🤖 Orkestrasi AI Multi-Agent & Provider LLM (`server/agents/`, `data/team.json`)
- **Dukungan LLM Lokal & Alternatif**: Tambahkan dukungan LLM lokal via Ollama, LM Studio, atau vLLM di samping penyedia cloud (Anthropic Claude, OpenAI GPT-4, Google Gemini, Groq, DeepSeek).
- **Kolaborasi Otomatis Antar-Agent**: Sempurnakan komunikasi antar-agen, seperti mekanisme *Peer Review* otomatis (misal: QA memeriksa kode Developer sebelum tugas di Kanban ditandai *Done*).
- **Peran & Spesialisasi Baru**: Usulkan dan sempurnakan prompt peran di `data/team.json` dengan prompt sistem yang tahan terhadap halusinasi.

### 4. 📊 Papan Kanban, UI Chat & Efek Suara (`src/components/`)
- **Fitur Papan Kanban**: Drag-and-drop antar kolom, batas tenggat waktu (*due dates*), label prioritas, serta fitur ekspor/impor data sprint (JSON/CSV/Markdown).
- **Efek Suara Retro (Opsional Audio)**: Efek suara 8-bit halus (suara ketikan keyboard mekanik, lonceng tanda tugas selesai, balon chat muncul) lengkap dengan tombol *Mute* yang mudah diakses.
- **Peningkatan Chat Multi-Thread**: Fitur pencarian/filter riwayat obrolan, ringkasan diskusi otomatis, dan pemberian tag topik.

### 5. ⚡ Performa & Optimasi WebGL
- **Kompatibilitas Perangkat Rendah (Low-End)**: Penerapan *geometry batching*, *mesh instancing*, dan penghematan FPS otomatis saat tab browser tidak aktif.
- **Optimasi Ukuran Bundle**: Penerapan *code-splitting* dan *dynamic import* untuk mempercepat *initial loading*.

---

## ⚖️ Syarat Utama: Persetujuan CLA (Contributor License Agreement)

Sebelum kontribusi atau Pull Request (PR) Anda dapat digabungkan (*merge*), **Anda wajib menyetujui [Contributor License Agreement (CLA)](./CLA.md)**.

### Mengapa Proyek Ini Menggunakan CLA?
Pixel Works Virtual Office mengadopsi model **Dual Licensing (GNU AGPLv3 + Lisensi Komersial)**:
1. **Gratis untuk Komunitas Open-Source**: Kode sumber terbuka untuk dipelajari, dijalankan, dan dikembangkan secara bebas di bawah lisensi GNU AGPLv3.
2. **Perlindungan Terhadap Pembajakan Komersial**: Pihak lain atau korporasi **DILARANG KERAS** mengambil kode ini lalu menjualnya kembali sebagai layanan SaaS berbayar tertutup (*closed-source*) tanpa membeli Lisensi Komersial resmi dari Pemilik Proyek.
3. **Wewenang Relicensing**: Dengan menyetujui CLA, Anda memberikan wewenang kepada Pemilik Proyek untuk menjual lisensi komersial/enterprise kepada klien korporat, sementara nama Anda tetap tercatat abadi sebagai kontributor di riwayat commit Git.

### Cara Menyetujui CLA:
Sangat praktis dan tanpa hambatan: **cukup centang kotak persetujuan CLA pada template Pull Request saat Anda mengajukan PR di GitHub**. Tidak memerlukan pendaftaran akun pihak ketiga atau formulir manual yang rumit.

---

## 🚀 Alur Kerja Kontribusi (Workflow)

### 1. Fork & Setup
1. **Fork** repositori ini ke akun GitHub Anda: `https://github.com/Thecaracter/new_pixel`.
2. Clone hasil fork ke komputer lokal:
   ```bash
   git clone https://github.com/<username-anda>/new_pixel.git
   cd new_pixel
   ```
3. Pasang seluruh dependensi:
   ```bash
   npm install
   ```

### 2. Konvensi Penamaan Branch
Buat branch baru yang deskriptif untuk setiap pekerjaan Anda:
```bash
# Fitur baru, objek 3D, atau tool MCP
git checkout -b feat/threejs-mesin-kopi
git checkout -b feat/mcp-postgres-integration

# Perbaikan bug
git checkout -b fix/avatar-collision-boundary

# Dokumentasi
git checkout -b docs/perbaikan-panduan-api
```

### 3. Pedoman Arsitektur Kode
- **Prompt Agen Terpusat**: Semua prompt dan kapabilitas agen tersimpan di `data/team.json`. **Jangan membuat file prompt duplikat seperti `AGENTS.md`**.
- **Integrasi Tool MCP**: Tool baru wajib didaftarkan di `server/mcp/catalog.js` dan diverifikasi melalui `server/mcp/catalogRunner.js`.
- **Three.js Kantor 3D**: Pastikan batas koordinat tabrakan (*collision boundary*) di `src/components/three/` rapi agar avatar dan perabotan tidak menembus dinding.

### 4. Pengujian & Verifikasi Wajib
Sebelum mengirimkan Pull Request, pastikan seluruh pengujian lokal lulus tanpa error:

```bash
# Jalankan seluruh unit & contract test (29 test wajib lulus)
npm test

# Pastikan proses build Vite berjalan sukses
npm run build
```

### 5. Mengajukan Pull Request (PR)
1. Commit perubahan Anda dengan pesan commit standar:
   ```bash
   git commit -m "feat(3d): add procedural espresso machine with steam"
   ```
2. Push branch ke akun GitHub Anda:
   ```bash
   git push origin feat/nama-fitur-anda
   ```
3. Buka Pull Request ke repositori utama (`Thecaracter/new_pixel`).
4. Isi checklist pada template PR dan centang kotak **Persetujuan CLA**.
5. Kirim PR Anda! Tim kami akan meninjau dan mengapresiasi kontribusi Anda dengan senang hati.

---

## 💼 Pertanyaan Terkait Lisensi Komersial (Enterprise)
Jika Anda mewakili perusahaan atau organisasi yang ingin menggunakan software ini di lingkungan tertutup (*closed-source enterprise*, private SaaS, atau OEM white-label) tanpa batasan lisensi AGPLv3, silakan hubungi Pemilik Proyek secara langsung.
