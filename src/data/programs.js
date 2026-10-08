/* Paket bawaan halaman Program (rumah subsidi, kost, cafe, ruko).
   Dipisah dari core agar tidak ikut terunduh di bundle awal — hanya dimuat oleh halaman
   (dan Control Panel) yang benar-benar memakainya. Isi datanya tidak diubah. */

/* ═══════════════════════════════════════════════════════════════════
   PROGRAM RENOVASI RUMAH SUBSIDI — Magazine Mixing Grid
   (1 kolom | 3 kolom | 2 kolom, ulangi per 6 paket)
═══════════════════════════════════════════════════════════════════ */

/* ── Data Paket Renovasi Rumah Subsidi ── */
const RS_PAKET_DATA = [
  {
    id: "rs-cat-dinding",
    icon: "",
    title: "Renovasi Cat & Dinding",
    desc: "Segarkan tampilan rumah subsidi Anda dengan pengecatan ulang interior & eksterior, perbaikan retak rambut, dan plamir dinding hingga rapi sempurna.",
    startFrom: 3500000,
    satuan: "paket",
    slideDir: "right",
    includes: [
      { icon: "", item: "Survei & pengukuran luas dinding gratis" },
      { icon: "", item: "Perbaikan retak rambut & dinding mengelupas" },
      { icon: "", item: "Plamir dinding hingga permukaan halus" },
      { icon: "", item: "Cat dasar (primer) anti alkali" },
      { icon: "", item: "Cat finishing 2 lapis (interior & eksterior)" },
      { icon: "", item: "Konsultasi pilihan warna & sample dinding" },
      { icon: "", item: "Tenaga tukang cat berpengalaman" },
      { icon: "", item: "Garansi pengerjaan 30 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", tema: "Cat Eksterior Segar", desc: "Tampilan fasad rumah subsidi yang baru dicat -- bersih, cerah, dan tahan cuaca tropis." },
      { img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80", tema: "Cat Interior Rapi", desc: "Dinding dalam ruangan dengan finishing rata, tanpa bekas kuas, siap dihuni kembali." },
      { img: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=800&q=80", tema: "Perbaikan Dinding Retak", desc: "Proses pendempulan dan perataan dinding sebelum pengecatan ulang." },
      { img: "https://images.unsplash.com/photo-1493606371202-6346f1ca5733?w=800&q=80", tema: "Pemilihan Warna", desc: "Konsultasi kombinasi warna cat yang pas dengan gaya rumah subsidi Anda." },
    ]
  },
  {
    id: "rs-atap-plafon",
    icon: "",
    title: "Renovasi Atap & Plafon",
    desc: "Atasi kebocoran, genteng pecah, dan plafon lembap dengan perbaikan struktur atap menyeluruh agar rumah subsidi Anda kembali kering dan aman.",
    startFrom: 8500000,
    satuan: "paket",
    slideDir: "up",
    includes: [
      { icon: "", item: "Inspeksi kebocoran & struktur atap gratis" },
      { icon: "", item: "Perbaikan / ganti rangka kayu & baja ringan" },
      { icon: "", item: "Ganti genteng pecah & nat bocor" },
      { icon: "", item: "Waterproofing area dak & sambungan atap" },
      { icon: "", item: "Pemasangan plafon gypsum / GRC baru" },
      { icon: "", item: "Finishing cat plafon anti lembap" },
      { icon: "", item: "Pembersihan sisa material pasca renovasi" },
      { icon: "", item: "Garansi anti bocor 6 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800&q=80", tema: "Perbaikan Rangka Atap", desc: "Penggantian rangka atap yang lapuk dengan baja ringan anti karat." },
      { img: "https://images.unsplash.com/photo-1601760561442-746f0f0b1e6b?w=800&q=80", tema: "Ganti Genteng", desc: "Pemasangan genteng baru menggantikan genteng pecah dan bocor." },
      { img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80", tema: "Plafon Gypsum Baru", desc: "Plafon gypsum rapi menggantikan plafon lama yang lembap dan menggelembung." },
      { img: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80", tema: "Waterproofing Dak", desc: "Lapisan waterproofing pada area dak beton untuk mencegah rembesan air." },
    ]
  },
  {
    id: "rs-lantai-keramik",
    icon: "",
    title: "Renovasi Lantai & Keramik",
    desc: "Ganti lantai semen polos atau keramik pecah dengan keramik baru yang rapi, presisi, dan tahan lama untuk seluruh ruangan di rumah subsidi.",
    startFrom: 6500000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei & pengukuran luas lantai gratis" },
      { icon: "", item: "Bongkar lantai/keramik lama" },
      { icon: "", item: "Pengurukan & perataan cor dasar" },
      { icon: "", item: "Pemasangan keramik baru (pilihan motif)" },
      { icon: "", item: "Nat keramik rapi & presisi" },
      { icon: "", item: "Pemasangan plint lantai" },
      { icon: "", item: "Tukang keramik berpengalaman" },
      { icon: "", item: "Garansi pemasangan 30 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80", tema: "Pemasangan Keramik Baru", desc: "Keramik baru terpasang rapi dengan nat presisi di ruang utama." },
      { img: "https://images.unsplash.com/photo-1556909190-9b5b97ee1cdd?w=800&q=80", tema: "Bongkar Lantai Lama", desc: "Proses pembongkaran lantai semen lama sebelum pengerjaan ulang." },
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Keramik Motif Granit", desc: "Pilihan motif keramik granit untuk tampilan lantai yang lebih elegan." },
      { img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", tema: "Lantai Siap Pakai", desc: "Hasil akhir lantai keramik baru yang bersih, rata, dan siap dihuni." },
    ]
  },
  {
    id: "rs-dapur-kamar-mandi",
    icon: "",
    title: "Renovasi Dapur & Kamar Mandi",
    desc: "Wujudkan dapur dan kamar mandi rumah subsidi yang lebih fungsional — perbaikan saluran air, keramik dinding baru, hingga pemasangan kitchen set sederhana.",
    startFrom: 12000000,
    satuan: "paket",
    slideDir: "down",
    includes: [
      { icon: "", item: "Survei instalasi air & sanitasi gratis" },
      { icon: "", item: "Perbaikan / ganti pipa air bersih & limbah" },
      { icon: "", item: "Keramik dinding dapur & kamar mandi" },
      { icon: "", item: "Pemasangan kloset & wastafel baru" },
      { icon: "", item: "Kitchen set sederhana (kabinet bawah)" },
      { icon: "", item: "Instalasi titik lampu tambahan" },
      { icon: "", item: "Pengecekan kebocoran pasca pemasangan" },
      { icon: "", item: "Garansi instalasi air 60 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80", tema: "Dapur Minimalis Baru", desc: "Dapur rumah subsidi dengan kitchen set sederhana dan keramik dinding baru." },
      { img: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80", tema: "Kamar Mandi Bersih", desc: "Kamar mandi dengan keramik baru, kloset, dan wastafel yang segar." },
      { img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80", tema: "Instalasi Pipa Air", desc: "Penggantian jalur pipa air bersih dan limbah agar bebas rembesan." },
      { img: "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80", tema: "Wastafel & Sanitasi", desc: "Pemasangan wastafel dan perlengkapan sanitasi baru yang rapi." },
      { img: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800&q=80", tema: "Kitchen Set Sederhana", desc: "Kabinet dapur sederhana namun fungsional untuk rumah subsidi." },
    ]
  },
  {
    id: "rs-tambah-ruang",
    icon: "",
    title: "Renovasi Tambah Ruang / Sekat",
    desc: "Tambah luas hunian dengan penambahan ruang baru atau sekat ruangan — solusi tepat untuk keluarga yang membutuhkan kamar tambahan di rumah subsidi.",
    startFrom: 15000000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei lahan & desain layout gratis" },
      { icon: "", item: "Pembangunan dinding sekat / partisi" },
      { icon: "", item: "Pasangan bata ringan / hebel" },
      { icon: "", item: "Pemasangan pintu & kusen baru" },
      { icon: "", item: "Instalasi listrik titik tambahan" },
      { icon: "", item: "Finishing plester & cat ruangan baru" },
      { icon: "", item: "Penyesuaian atap jika ada perluasan" },
      { icon: "", item: "Garansi struktur 90 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80", tema: "Sekat Ruangan Baru", desc: "Pembangunan dinding sekat untuk membagi ruangan menjadi kamar tambahan." },
      { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80", tema: "Penambahan Ruang", desc: "Perluasan bangunan rumah subsidi dengan ruang tambahan di sisi belakang." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Pasangan Bata Ringan", desc: "Konstruksi dinding baru menggunakan bata ringan yang kuat dan ringan." },
      { img: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=80", tema: "Ruang Baru Siap Pakai", desc: "Hasil akhir kamar tambahan dengan finishing rapi dan siap dihuni." },
    ]
  },
  {
    id: "rs-total-rumah",
    icon: "",
    title: "Renovasi Total Rumah Subsidi",
    desc: "Paket renovasi menyeluruh — atap, dinding, lantai, dapur, kamar mandi, hingga instalasi listrik & air — untuk transformasi total rumah subsidi Anda.",
    startFrom: 25000000,
    satuan: "unit",
    slideDir: "down",
    includes: [
      { icon: "", item: "Survei & RAB renovasi total gratis" },
      { icon: "", item: "Perbaikan atap, plafon & struktur rumah" },
      { icon: "", item: "Renovasi dinding, plester & pengecatan" },
      { icon: "", item: "Penggantian lantai & keramik seluruh ruangan" },
      { icon: "", item: "Renovasi dapur & kamar mandi lengkap" },
      { icon: "", item: "Pembaruan instalasi listrik & air" },
      { icon: "", item: "Penggantian pintu & jendela jika diperlukan" },
      { icon: "", item: "Garansi pengerjaan 6 bulan + pendampingan tukang" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800&q=80", tema: "Sebelum Renovasi", desc: "Kondisi rumah subsidi sebelum renovasi total -- siap diubah menjadi hunian layak." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Proses Renovasi", desc: "Tim tukang bekerja menyeluruh dari struktur hingga finishing akhir." },
      { img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", tema: "Rumah Subsidi Baru", desc: "Hasil akhir rumah subsidi setelah renovasi total -- rapi dan nyaman dihuni." },
      { img: "https://images.unsplash.com/photo-1597047084897-51e81819a499?w=800&q=80", tema: "Eksterior Diperbarui", desc: "Tampak luar rumah subsidi dengan cat baru dan atap yang sudah diperbaiki." },
      { img: "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=800&q=80", tema: "Interior Siap Huni", desc: "Ruangan dalam yang sudah dirombak total, bersih, dan fungsional." },
    ]
  },
];

/* ═══════════════════════════════════════════════════════════════════
   PROGRAM PEMBANGUNAN KOST — Magazine Mixing Grid
   (1 kolom | 3 kolom | 2 kolom, ulangi per 6 paket)
   Struktur & komponen (RsMiniSlide, RsInfoCard, PaketGridManager) di-reuse
   persis dari section "Program Renovasi Rumah Subsidi" di atas.
═══════════════════════════════════════════════════════════════════ */

/* ── Data Paket Pembangunan Kost ── */
const KOST_PAKET_DATA = [
  {
    id: "kost-1-lantai",
    icon: "",
    title: "Pembangunan Kost 1 Lantai",
    desc: "Bangun kost baru 1 lantai dari nol — struktur kokoh, kamar fungsional, dan tata ruang efisien untuk memaksimalkan jumlah kamar sewa di lahan Anda.",
    startFrom: 45000000,
    satuan: "kamar",
    slideDir: "right",
    includes: [
      { icon: "", item: "Survei lahan & konsultasi denah gratis" },
      { icon: "", item: "Desain layout kamar & sirkulasi optimal" },
      { icon: "", item: "Struktur pondasi & dinding bata ringan" },
      { icon: "", item: "Rangka atap baja ringan + genteng" },
      { icon: "", item: "Instalasi listrik & air per kamar" },
      { icon: "", item: "Pintu, jendela & kunci pengaman standar" },
      { icon: "", item: "Finishing plester, aci & cat dasar" },
      { icon: "", item: "Garansi struktur 6 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", tema: "Bangunan Kost 1 Lantai", desc: "Tampak depan kost 1 lantai dengan deretan kamar rapi dan akses langsung ke jalan." },
      { img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", tema: "Kamar Standar Baru", desc: "Kamar kost baru dengan ukuran efisien dan sirkulasi udara yang baik." },
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Struktur Bangunan", desc: "Proses pembangunan struktur dinding dan rangka atap kost baru." },
      { img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80", tema: "Fasad Minimalis", desc: "Desain fasad depan kost yang sederhana namun tetap menarik bagi calon penyewa." },
    ]
  },
  {
    id: "kost-2-lantai",
    icon: "",
    title: "Pembangunan Kost 2 Lantai",
    desc: "Maksimalkan kapasitas kamar dengan pembangunan kost 2 lantai — struktur beton bertulang, tangga permanen, dan perencanaan kamar yang lebih banyak dalam luas lahan yang sama.",
    startFrom: 65000000,
    satuan: "kamar",
    slideDir: "up",
    includes: [
      { icon: "", item: "Survei lahan & perhitungan struktur 2 lantai" },
      { icon: "", item: "Pondasi & kolom beton bertulang" },
      { icon: "", item: "Tangga permanen & railing pengaman" },
      { icon: "", item: "Dak beton / plat lantai 2" },
      { icon: "", item: "Instalasi listrik & air 2 lantai" },
      { icon: "", item: "Kamar mandi per lantai / per kamar" },
      { icon: "", item: "Finishing plester, aci & cat eksterior" },
      { icon: "", item: "Garansi struktur 12 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Bangunan Kost 2 Lantai", desc: "Kost 2 lantai dengan fasad modern dan kapasitas kamar lebih banyak." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Struktur Beton Bertulang", desc: "Pengerjaan kolom dan dak beton sebagai struktur utama lantai dua." },
      { img: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80", tema: "Koridor & Tangga", desc: "Tangga permanen dengan railing aman menghubungkan lantai 1 dan 2." },
      { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", tema: "Kamar Lantai Atas", desc: "Kamar kost di lantai 2 dengan sirkulasi udara dan pencahayaan alami." },
    ]
  },
  {
    id: "kost-kamar-mandi-dalam",
    icon: "",
    title: "Kost Kamar Mandi Dalam",
    desc: "Tingkatkan nilai sewa dengan kamar ber-kamar mandi dalam — instalasi plumbing rapi, keramik lantai & dinding, serta sekat kedap air untuk kenyamanan penghuni.",
    startFrom: 9500000,
    satuan: "kamar",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei instalasi air & desain sekat kamar mandi" },
      { icon: "", item: "Sekat dinding bata ringan kedap air" },
      { icon: "", item: "Instalasi pipa air bersih & limbah" },
      { icon: "", item: "Keramik lantai & dinding kamar mandi" },
      { icon: "", item: "Pemasangan kloset jongkok / duduk" },
      { icon: "", item: "Waterproofing area basah" },
      { icon: "", item: "Ventilasi udara kamar mandi" },
      { icon: "", item: "Garansi instalasi air 60 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80", tema: "Kamar Mandi Dalam Baru", desc: "Kamar mandi dalam yang bersih dan fungsional untuk tiap unit kamar kost." },
      { img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80", tema: "Instalasi Pipa Air", desc: "Pemasangan jalur pipa air bersih dan limbah sebelum pengeramikan." },
      { img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80", tema: "Sekat Kamar Mandi", desc: "Pembangunan sekat dinding kedap air untuk area kamar mandi dalam." },
      { img: "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80", tema: "Sanitasi Rapi", desc: "Pemasangan kloset dan perlengkapan sanitasi yang rapi dan higienis." },
    ]
  },
  {
    id: "kost-full-furnished",
    icon: "",
    title: "Kost Eksklusif Full Furnished",
    desc: "Wujudkan kost eksklusif siap huni — lengkap dengan kasur, lemari, meja, AC, dan interior modern yang membuat kamar Anda lebih menarik dan bernilai sewa lebih tinggi.",
    startFrom: 18500000,
    satuan: "kamar",
    slideDir: "down",
    includes: [
      { icon: "", item: "Konsultasi konsep interior & tata ruang" },
      { icon: "", item: "Kasur, springbed & perlengkapan tidur" },
      { icon: "", item: "Lemari pakaian & meja belajar/kerja" },
      { icon: "", item: "Instalasi AC & titik listrik tambahan" },
      { icon: "", item: "Tirai jendela & lampu dekoratif" },
      { icon: "", item: "Cat interior tema modern minimalis" },
      { icon: "", item: "Pemasangan seluruh furnitur di lokasi" },
      { icon: "", item: "Garansi pemasangan furnitur 30 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800&q=80", tema: "Kamar Full Furnished", desc: "Kamar kost lengkap dengan furnitur siap huni bergaya modern minimalis." },
      { img: "https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=800&q=80", tema: "Interior Modern", desc: "Penataan interior kamar dengan sentuhan warna netral dan pencahayaan hangat." },
      { img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80", tema: "Area Kerja & Istirahat", desc: "Meja kerja dan area istirahat yang tertata rapi dalam satu kamar kost." },
      { img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80", tema: "Sentuhan Akhir Dekorasi", desc: "Detail dekorasi dan pencahayaan yang membuat kamar kost terasa lebih hidup." },
    ]
  },
  {
    id: "kost-renovasi-upgrade",
    icon: "",
    title: "Renovasi & Upgrade Kost Lama",
    desc: "Segarkan kost lama Anda agar lebih kompetitif — perbaikan struktur, pengecatan ulang, upgrade kamar mandi, hingga penambahan fasilitas agar tarif sewa bisa dinaikkan.",
    startFrom: 7500000,
    satuan: "kamar",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei kondisi bangunan & rekomendasi upgrade" },
      { icon: "", item: "Perbaikan dinding, plafon & atap bocor" },
      { icon: "", item: "Pengecatan ulang interior & eksterior" },
      { icon: "", item: "Upgrade keramik lantai & kamar mandi" },
      { icon: "", item: "Perbaikan instalasi listrik lama" },
      { icon: "", item: "Penggantian pintu & kunci kamar" },
      { icon: "", item: "Penataan ulang koridor & area bersama" },
      { icon: "", item: "Garansi pengerjaan 3 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800&q=80", tema: "Sebelum Renovasi", desc: "Kondisi kost lama sebelum proses renovasi dan upgrade dimulai." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Proses Renovasi", desc: "Tim tukang mengerjakan perbaikan struktur dan finishing kost lama." },
      { img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", tema: "Cat & Fasad Baru", desc: "Tampilan fasad kost yang lebih segar setelah pengecatan ulang." },
      { img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80", tema: "Kamar Siap Sewa", desc: "Kamar kost hasil upgrade yang lebih layak dan siap disewakan kembali." },
    ]
  },
  {
    id: "kost-total-turnkey",
    icon: "",
    title: "Pembangunan Kost Total (Turnkey)",
    desc: "Solusi lengkap dari nol hingga siap sewa — desain, RAB, pembangunan struktur, interior, hingga furnishing seluruh kamar dikerjakan satu tim tanpa Anda perlu repot.",
    startFrom: 350000000,
    satuan: "unit",
    slideDir: "down",
    includes: [
      { icon: "", item: "Survei lahan, desain & RAB lengkap gratis" },
      { icon: "", item: "Pembangunan struktur dari pondasi hingga atap" },
      { icon: "", item: "Instalasi listrik, air & sanitasi seluruh unit" },
      { icon: "", item: "Kamar mandi dalam di setiap kamar" },
      { icon: "", item: "Interior & furnitur siap huni per kamar" },
      { icon: "", item: "Area bersama: koridor, parkir & pagar" },
      { icon: "", item: "Pendampingan hingga serah terima kunci" },
      { icon: "", item: "Garansi bangunan 12 bulan penuh" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", tema: "Kost Baru Siap Sewa", desc: "Hasil akhir bangunan kost yang rapi, modern, dan siap dioperasikan." },
      { img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80", tema: "Fasad Bangunan Utuh", desc: "Tampak depan bangunan kost turnkey dengan desain fasad yang menarik." },
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Area Depan & Pagar", desc: "Penataan area depan, pagar, dan akses masuk bangunan kost." },
      { img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", tema: "Koridor Antar Kamar", desc: "Koridor penghubung antar kamar yang bersih dan tertata rapi." },
      { img: "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=800&q=80", tema: "Interior Siap Huni", desc: "Salah satu kamar dalam kondisi siap huni, lengkap dengan furnitur dasar." },
    ]
  },
];

/* ═══════════════════════════════════════════════════════════════════
   PROGRAM PEMBANGUNAN CAFE — Magazine Mixing Grid
   Struktur & komponen identik dengan section Pembangunan Kost di atas.
═══════════════════════════════════════════════════════════════════ */

/* ── Data Paket Pembangunan Cafe ── */
const CAFE_PAKET_DATA = [
  {
    id: "cafe-sederhana",
    icon: "",
    title: "Pembangunan Cafe Sederhana",
    desc: "Bangun cafe baru dengan konsep simpel dan efisien — cocok untuk pemula bisnis kuliner, struktur ringan, cepat selesai, dan hemat biaya tanpa mengorbankan kenyamanan pengunjung.",
    startFrom: 55000000,
    satuan: "unit",
    slideDir: "right",
    includes: [
      { icon: "", item: "Survei lahan & konsultasi konsep gratis" },
      { icon: "", item: "Desain layout kasir, dapur & area duduk" },
      { icon: "", item: "Struktur rangka baja ringan / kayu" },
      { icon: "", item: "Dinding partisi & jendela kaca depan" },
      { icon: "", item: "Instalasi listrik & titik stop kontak" },
      { icon: "", item: "Lantai keramik / vinyl anti licin" },
      { icon: "", item: "Finishing cat interior & eksterior" },
      { icon: "", item: "Garansi struktur 6 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", tema: "Cafe Sederhana Baru", desc: "Bangunan cafe kecil dengan konsep simpel, nyaman untuk nongkrong santai." },
      { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80", tema: "Area Kasir & Dapur", desc: "Tata letak kasir dan dapur yang efisien untuk operasional harian." },
      { img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80", tema: "Ruang Duduk Utama", desc: "Area duduk utama dengan pencahayaan alami dari jendela kaca depan." },
      { img: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80", tema: "Fasad Depan Cafe", desc: "Tampilan fasad depan yang ramah dan mengundang pengunjung." },
    ]
  },
  {
    id: "cafe-2-lantai",
    icon: "",
    title: "Pembangunan Cafe 2 Lantai",
    desc: "Maksimalkan kapasitas pengunjung dengan cafe 2 lantai — struktur beton bertulang, tangga permanen, dan ruang tambahan di lantai atas untuk area VIP atau meeting.",
    startFrom: 120000000,
    satuan: "unit",
    slideDir: "up",
    includes: [
      { icon: "", item: "Survei lahan & perhitungan struktur 2 lantai" },
      { icon: "", item: "Pondasi & kolom beton bertulang" },
      { icon: "", item: "Tangga permanen & railing pengaman" },
      { icon: "", item: "Dak beton / plat lantai 2" },
      { icon: "", item: "Instalasi listrik & air 2 lantai" },
      { icon: "", item: "Toilet pengunjung per lantai" },
      { icon: "", item: "Finishing plester, aci & cat eksterior" },
      { icon: "", item: "Garansi struktur 12 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800&q=80", tema: "Cafe 2 Lantai", desc: "Bangunan cafe 2 lantai dengan kapasitas pengunjung lebih banyak." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Struktur Beton Bertulang", desc: "Pengerjaan kolom dan dak beton sebagai struktur utama lantai dua." },
      { img: "https://images.unsplash.com/photo-1523217162808-bba68bde2d61?w=800&q=80", tema: "Area Lantai Atas", desc: "Ruang tambahan di lantai atas untuk area VIP atau meeting santai." },
      { img: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800&q=80", tema: "Tangga & Koridor", desc: "Tangga permanen dengan railing aman menghubungkan lantai 1 dan 2." },
    ]
  },
  {
    id: "cafe-interior-estetik",
    icon: "",
    title: "Interior Cafe Estetik & Instagramable",
    desc: "Ciptakan cafe dengan interior estetik yang bikin pengunjung betah berlama-lama dan mau foto-foto — furnitur custom, pencahayaan hangat, dan sudut foto yang menarik.",
    startFrom: 45000000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Konsultasi konsep & moodboard interior" },
      { icon: "", item: "Furnitur meja & kursi custom" },
      { icon: "", item: "Instalasi lampu gantung & pencahayaan hangat" },
      { icon: "", item: "Dinding aksen (bata ekspos / wallpaper tema)" },
      { icon: "", item: "Sudut foto instagramable (photo corner)" },
      { icon: "", item: "Tanaman hias & elemen dekorasi" },
      { icon: "", item: "Signage & branding interior" },
      { icon: "", item: "Garansi pemasangan 30 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", tema: "Interior Estetik", desc: "Suasana interior cafe yang hangat dan nyaman untuk bersantai." },
      { img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80", tema: "Sudut Foto Instagramable", desc: "Photo corner yang dirancang khusus untuk konten media sosial pengunjung." },
      { img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80", tema: "Pencahayaan Hangat", desc: "Lampu gantung dan pencahayaan yang menciptakan suasana cozy." },
      { img: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80", tema: "Furnitur Custom", desc: "Meja dan kursi custom yang selaras dengan konsep cafe." },
    ]
  },
  {
    id: "cafe-outdoor-seating",
    icon: "",
    title: "Outdoor Seating & Taman Cafe",
    desc: "Tambahkan area duduk outdoor yang asri — gazebo, pergola, dan taman kecil yang membuat pengunjung nyaman menikmati suasana sambil ngopi di udara terbuka.",
    startFrom: 28000000,
    satuan: "paket",
    slideDir: "down",
    includes: [
      { icon: "", item: "Desain layout area outdoor & taman" },
      { icon: "", item: "Gazebo / pergola kayu atau baja ringan" },
      { icon: "", item: "Meja & kursi outdoor tahan cuaca" },
      { icon: "", item: "Penataan tanaman & taman kecil" },
      { icon: "", item: "Paving block / decking area duduk" },
      { icon: "", item: "Lampu taman & pencahayaan malam" },
      { icon: "", item: "Payung / kanopi peneduh tambahan" },
      { icon: "", item: "Garansi pengerjaan 3 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80", tema: "Area Outdoor Cafe", desc: "Area duduk outdoor yang asri dengan sentuhan taman hijau." },
      { img: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80", tema: "Gazebo & Pergola", desc: "Gazebo kayu yang menjadi tempat favorit pengunjung menikmati suasana." },
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Penataan Taman", desc: "Taman kecil yang menyegarkan di sekitar area duduk outdoor." },
      { img: "https://images.unsplash.com/photo-1600210492486-715a3316d0dc?w=800&q=80", tema: "Suasana Malam Hari", desc: "Pencahayaan lampu taman yang menciptakan suasana hangat di malam hari." },
    ]
  },
  {
    id: "cafe-renovasi-upgrade",
    icon: "",
    title: "Renovasi & Upgrade Cafe Lama",
    desc: "Segarkan tampilan cafe lama Anda agar lebih kompetitif — perbaikan struktur, pengecatan ulang, upgrade interior, hingga penataan ulang layout agar lebih efisien.",
    startFrom: 25000000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei kondisi bangunan & rekomendasi upgrade" },
      { icon: "", item: "Perbaikan dinding, plafon & atap bocor" },
      { icon: "", item: "Pengecatan ulang interior & eksterior" },
      { icon: "", item: "Upgrade furnitur & tata letak baru" },
      { icon: "", item: "Perbaikan instalasi listrik lama" },
      { icon: "", item: "Penataan ulang pencahayaan" },
      { icon: "", item: "Upgrade signage & branding depan" },
      { icon: "", item: "Garansi pengerjaan 3 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1493606371202-6346f1ca5733?w=800&q=80", tema: "Sebelum Renovasi", desc: "Kondisi cafe lama sebelum proses renovasi dan upgrade dimulai." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Proses Renovasi", desc: "Tim tukang mengerjakan perbaikan struktur dan finishing cafe lama." },
      { img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", tema: "Cat & Fasad Baru", desc: "Tampilan fasad cafe yang lebih segar setelah pengecatan ulang." },
      { img: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80", tema: "Cafe Siap Beroperasi", desc: "Cafe hasil upgrade yang lebih menarik dan siap menerima pengunjung." },
    ]
  },
  {
    id: "cafe-total-turnkey",
    icon: "",
    title: "Pembangunan Cafe Total (Turnkey)",
    desc: "Solusi lengkap dari nol hingga siap buka — desain, RAB, pembangunan struktur, interior, furnitur, hingga signage dikerjakan satu tim tanpa Anda perlu repot.",
    startFrom: 250000000,
    satuan: "unit",
    slideDir: "down",
    includes: [
      { icon: "", item: "Survei lahan, desain & RAB lengkap gratis" },
      { icon: "", item: "Pembangunan struktur dari pondasi hingga atap" },
      { icon: "", item: "Instalasi listrik, air & dapur lengkap" },
      { icon: "", item: "Interior & furnitur siap operasional" },
      { icon: "", item: "Area outdoor & signage depan" },
      { icon: "", item: "Toilet pengunjung & area staff" },
      { icon: "", item: "Pendampingan hingga hari pembukaan" },
      { icon: "", item: "Garansi bangunan 12 bulan penuh" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80", tema: "Cafe Baru Siap Buka", desc: "Hasil akhir bangunan cafe yang rapi, modern, dan siap dioperasikan." },
      { img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", tema: "Fasad Bangunan Utuh", desc: "Tampak depan bangunan cafe turnkey dengan desain fasad yang menarik." },
      { img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80", tema: "Interior Lengkap", desc: "Interior cafe yang sudah lengkap dengan furnitur dan pencahayaan." },
      { img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80", tema: "Area Outdoor & Signage", desc: "Area outdoor dan signage depan yang siap menyambut pengunjung." },
      { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80", tema: "Dapur & Kasir Siap Operasi", desc: "Area dapur dan kasir yang tertata rapi dan siap beroperasi." },
    ]
  },
];

/* ═══════════════════════════════════════════════════════════════════
   PROGRAM PEMBANGUNAN RUKO — Magazine Mixing Grid
   Struktur & komponen identik dengan section Pembangunan Kost di atas.
═══════════════════════════════════════════════════════════════════ */

/* ── Data Paket Pembangunan Ruko ── */
const RUKO_PAKET_DATA = [
  {
    id: "ruko-2-lantai",
    icon: "",
    title: "Pembangunan Ruko 2 Lantai",
    desc: "Bangun ruko baru 2 lantai dari nol — lantai bawah untuk area usaha/toko, lantai atas untuk kantor atau hunian, struktur kokoh dan tahan lama.",
    startFrom: 180000000,
    satuan: "unit",
    slideDir: "right",
    includes: [
      { icon: "", item: "Survei lahan & konsultasi denah gratis" },
      { icon: "", item: "Desain layout area usaha & lantai atas" },
      { icon: "", item: "Pondasi & struktur beton bertulang" },
      { icon: "", item: "Tangga permanen & railing pengaman" },
      { icon: "", item: "Rolling door / pintu depan usaha" },
      { icon: "", item: "Instalasi listrik & air 2 lantai" },
      { icon: "", item: "Finishing plester, aci & cat eksterior" },
      { icon: "", item: "Garansi struktur 12 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80", tema: "Ruko 2 Lantai Baru", desc: "Bangunan ruko 2 lantai dengan fasad modern, siap untuk usaha & hunian." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Struktur Beton Bertulang", desc: "Pengerjaan kolom dan dak beton sebagai struktur utama lantai dua." },
      { img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", tema: "Area Usaha Lantai 1", desc: "Lantai dasar yang luas dan terbuka, siap dijadikan area toko atau usaha." },
      { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80", tema: "Fasad Ruko Modern", desc: "Tampilan fasad depan ruko yang profesional dan menarik perhatian." },
    ]
  },
  {
    id: "ruko-3-lantai",
    icon: "",
    title: "Pembangunan Ruko 3 Lantai",
    desc: "Maksimalkan fungsi lahan dengan ruko 3 lantai — kombinasi area usaha, kantor, dan hunian dalam satu bangunan, struktur beton bertulang yang kokoh.",
    startFrom: 320000000,
    satuan: "unit",
    slideDir: "up",
    includes: [
      { icon: "", item: "Survei lahan & perhitungan struktur 3 lantai" },
      { icon: "", item: "Pondasi tiang pancang / cakar ayam" },
      { icon: "", item: "Kolom & balok beton bertulang seluruh lantai" },
      { icon: "", item: "Tangga permanen 3 lantai & railing" },
      { icon: "", item: "Instalasi listrik, air & sanitasi 3 lantai" },
      { icon: "", item: "Toilet di setiap lantai" },
      { icon: "", item: "Finishing plester, aci & cat eksterior" },
      { icon: "", item: "Garansi struktur 12 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", tema: "Ruko 3 Lantai", desc: "Bangunan ruko 3 lantai untuk kebutuhan usaha, kantor, dan hunian sekaligus." },
      { img: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800&q=80", tema: "Struktur Bertingkat", desc: "Struktur kolom dan balok beton yang kokoh menopang 3 lantai." },
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Proses Pembangunan", desc: "Tahapan pembangunan struktur ruko bertingkat dari dasar hingga atap." },
      { img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80", tema: "Fasad Bangunan", desc: "Desain fasad ruko 3 lantai yang rapi dan profesional." },
    ]
  },
  {
    id: "ruko-gudang-belakang",
    icon: "",
    title: "Ruko dengan Gudang Belakang",
    desc: "Tambahkan area gudang di bagian belakang ruko — solusi praktis untuk menyimpan stok barang dagangan tanpa mengganggu area usaha di depan.",
    startFrom: 45000000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei lahan & desain layout gudang" },
      { icon: "", item: "Struktur rangka baja ringan / beton" },
      { icon: "", item: "Rak penyimpanan barang built-in" },
      { icon: "", item: "Akses pintu penghubung ke area usaha" },
      { icon: "", item: "Ventilasi udara & pencahayaan gudang" },
      { icon: "", item: "Lantai cor / keramik anti licin" },
      { icon: "", item: "Pintu belakang untuk akses bongkar muat" },
      { icon: "", item: "Garansi pengerjaan 3 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80", tema: "Gudang Belakang", desc: "Area gudang yang tertata rapi untuk penyimpanan stok barang dagangan." },
      { img: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80", tema: "Rak Penyimpanan", desc: "Rak built-in yang memaksimalkan kapasitas penyimpanan barang." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Akses Bongkar Muat", desc: "Pintu belakang yang memudahkan proses bongkar muat barang." },
      { img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", tema: "Konektivitas ke Area Usaha", desc: "Akses pintu penghubung yang praktis antara gudang dan area usaha depan." },
    ]
  },
  {
    id: "ruko-fasad-signage",
    icon: "",
    title: "Fasad & Signage Ruko",
    desc: "Perkuat identitas usaha dengan fasad depan yang menarik dan signage yang mencolok — meningkatkan visibilitas ruko Anda dari jalan raya.",
    startFrom: 18000000,
    satuan: "paket",
    slideDir: "down",
    includes: [
      { icon: "", item: "Konsultasi desain fasad & branding" },
      { icon: "", item: "Cladding / ACM panel fasad depan" },
      { icon: "", item: "Signage huruf timbul / neon box" },
      { icon: "", item: "Kanopi depan pelindung pejalan kaki" },
      { icon: "", item: "Lampu sorot fasad malam hari" },
      { icon: "", item: "Pengecatan ulang fasad sesuai brand" },
      { icon: "", item: "Pemasangan kaca etalase depan" },
      { icon: "", item: "Garansi pemasangan 30 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", tema: "Fasad Ruko Menarik", desc: "Tampilan fasad depan yang mencolok dan meningkatkan visibilitas usaha." },
      { img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80", tema: "Signage & Branding", desc: "Signage huruf timbul yang memperkuat identitas brand usaha." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Kanopi Depan", desc: "Kanopi pelindung yang menambah kenyamanan pengunjung di depan ruko." },
      { img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80", tema: "Suasana Malam Hari", desc: "Lampu sorot fasad yang membuat ruko tetap menonjol di malam hari." },
    ]
  },
  {
    id: "ruko-renovasi-upgrade",
    icon: "",
    title: "Renovasi & Upgrade Ruko Lama",
    desc: "Segarkan ruko lama Anda agar lebih kompetitif — perbaikan struktur, pengecatan ulang, upgrade fasad, hingga penataan ulang area usaha.",
    startFrom: 35000000,
    satuan: "paket",
    slideDir: "left",
    includes: [
      { icon: "", item: "Survei kondisi bangunan & rekomendasi upgrade" },
      { icon: "", item: "Perbaikan dinding, plafon & atap bocor" },
      { icon: "", item: "Pengecatan ulang interior & eksterior" },
      { icon: "", item: "Upgrade fasad & signage depan" },
      { icon: "", item: "Perbaikan instalasi listrik lama" },
      { icon: "", item: "Penataan ulang area usaha" },
      { icon: "", item: "Perbaikan lantai & keramik" },
      { icon: "", item: "Garansi pengerjaan 3 bulan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1493606371202-6346f1ca5733?w=800&q=80", tema: "Sebelum Renovasi", desc: "Kondisi ruko lama sebelum proses renovasi dan upgrade dimulai." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Proses Renovasi", desc: "Tim tukang mengerjakan perbaikan struktur dan finishing ruko lama." },
      { img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", tema: "Fasad Baru", desc: "Tampilan fasad ruko yang lebih segar setelah pengecatan dan upgrade." },
      { img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80", tema: "Ruko Siap Beroperasi", desc: "Ruko hasil upgrade yang lebih layak dan siap dipakai kembali untuk usaha." },
    ]
  },
  {
    id: "ruko-total-turnkey",
    icon: "",
    title: "Pembangunan Ruko Total (Turnkey)",
    desc: "Solusi lengkap dari nol hingga siap pakai — desain, RAB, pembangunan struktur, fasad, interior, hingga signage dikerjakan satu tim tanpa Anda perlu repot.",
    startFrom: 450000000,
    satuan: "unit",
    slideDir: "down",
    includes: [
      { icon: "", item: "Survei lahan, desain & RAB lengkap gratis" },
      { icon: "", item: "Pembangunan struktur dari pondasi hingga atap" },
      { icon: "", item: "Instalasi listrik, air & sanitasi seluruh lantai" },
      { icon: "", item: "Fasad & signage depan siap pakai" },
      { icon: "", item: "Interior dasar area usaha & hunian" },
      { icon: "", item: "Gudang & area parkir" },
      { icon: "", item: "Pendampingan hingga serah terima kunci" },
      { icon: "", item: "Garansi bangunan 12 bulan penuh" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", tema: "Ruko Baru Siap Pakai", desc: "Hasil akhir bangunan ruko yang rapi, modern, dan siap dioperasikan." },
      { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80", tema: "Fasad Bangunan Utuh", desc: "Tampak depan bangunan ruko turnkey dengan desain fasad yang menarik." },
      { img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", tema: "Signage & Branding", desc: "Signage depan yang siap memperkuat identitas usaha Anda." },
      { img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", tema: "Area Usaha Siap Operasi", desc: "Area usaha yang sudah tertata rapi dan siap menerima pelanggan." },
      { img: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80", tema: "Gudang & Parkir", desc: "Area gudang dan parkir yang melengkapi fungsi bangunan ruko." },
    ]
  },
];

export { RS_PAKET_DATA, KOST_PAKET_DATA, CAFE_PAKET_DATA, RUKO_PAKET_DATA };
