/* Kategori bawaan halaman Landscape & Taman.
   Dipisah dari core agar tidak ikut terunduh di bundle awal — hanya dimuat oleh halaman
   (dan Control Panel) yang benar-benar memakainya. Isi datanya tidak diubah. */

/* ── Page: Landscape & Taman ── */
const LANDSCAPE_CATEGORIES = [
  {
    id: "taman-depan",
    icon: "",
    title: "Contoh Desain Taman Depan",
    desc: "Kesan pertama hunian Anda dimulai dari taman depan. Kami menghadirkan desain teras dan taman depan yang memukau — dari gaya minimalis modern hingga tropis nan asri.",
    startFrom: 4500000,
    satuan: "paket",
    includes: [
      { icon: "", item: "Konsultasi & survei lokasi gratis" },
      { icon: "", item: "Desain 3D taman depan (2 konsep pilihan)" },
      { icon: "", item: "Penanaman tanaman hias pilihan (min. 10 jenis)" },
      { icon: "", item: "Jalur stepping stone / batu andesit" },
      { icon: "", item: "Instalasi lampu sorot taman (2 titik)" },
      { icon: "", item: "Mulsa & pupuk organik dasar" },
      { icon: "", item: "Sistem irigasi drip sederhana" },
      { icon: "", item: "Garansi perawatan 30 hari setelah pemasangan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", tema: "Minimalis Modern", desc: "Taman depan bersih dengan jalur batu andesit, tanaman hias rendah, dan lampu sorot tersembunyi. Cocok untuk rumah bergaya kontemporer." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Tropis Resort", desc: "Nuansa villa tropis di depan rumah -- palm mini, heliconia, dan kerikil putih menciptakan ambiance resort yang mewah." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Japanese Zen", desc: "Taman gaya Jepang dengan batu stepping, lumut hijau, bambu, dan air mengalir. Tenang dan meditatif setiap hari." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Teras Santai Bohemian", desc: "Area teras dengan pergola rotan, tanaman merambat, dan kursi outdoor. Tempat bersantai paling favorit di sore hari." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "Klasik Eropa", desc: "Simetri elegan khas taman Eropa -- pagar hidup teratur, pot bunga warna-warni, dan jalur batu bata merah yang menawan." },
      { img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80", tema: "Modern Industrial", desc: "Konsep industrial dengan raised planter box besi cor, tanaman sukulen, dan pencahayaan warm-white di malam hari." },
    ]
  },
  {
    id: "taman-belakang",
    icon: "",
    title: "Contoh Desain Taman Belakang",
    desc: "Halaman belakang adalah surga pribadi Anda. Kami mengubahnya menjadi oasis relaksasi — area bermain anak, ruang makan outdoor, hingga taman sayur organik.",
    startFrom: 7500000,
    satuan: "paket",
    includes: [
      { icon: "", item: "Konsultasi & survei lahan belakang gratis" },
      { icon: "", item: "Desain 3D komprehensif (3 konsep pilihan)" },
      { icon: "", item: "Penanaman pohon peneduh & tanaman hias (min. 15 jenis)" },
      { icon: "", item: "Pergola atau gazebo kayu ulin (opsional, extra)" },
      { icon: "", item: "Deck kayu composite atau batu paving area duduk" },
      { icon: "", item: "Sistem irigasi otomatis dengan timer" },
      { icon: "", item: "Rumput premium (Gajah Mini / Zoysia)" },
      { icon: "", item: "Paket lampu taman dasar (4 titik)" },
      { icon: "", item: "Garansi perawatan 60 hari setelah pemasangan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", tema: "Outdoor Living Room", desc: "Ruang keluarga terbuka di taman belakang -- sofa outdoor, pergola kayu, dan area BBQ. Sempurna untuk berkumpul keluarga." },
      { img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=800&q=80", tema: "Tropical Oasis", desc: "Lebatnya tanaman tropis menciptakan privasi alami. Kolam mini, deck kayu, dan hammock -- liburan tanpa pergi jauh." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Minimalis Elegan", desc: "Rumput hijau terawat, border batu, dan stepping stone. Desain simpel yang tidak memerlukan perawatan intensif." },
      { img: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&q=80", tema: "Taman Bermain Keluarga", desc: "Zona bermain anak yang aman dengan rumput sintetis lembut, ayunan, dan area sandbox. Dikombinasikan taman orang tua." },
      { img: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800&q=80", tema: "Mediterania", desc: "Inspiraasi taman Mediterania -- lavender, rosemary, batu koral, dan pergola besi tempa. Romantis dan wangi sepanjang hari." },
      { img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", tema: "Taman Sayur Organik", desc: "Raised bed box kayu untuk sayur dan herba organik. Estetis sekaligus produktif -- petik langsung dari taman rumah." },
    ]
  },
  {
    id: "rooftop",
    icon: "",
    title: "Contoh Desain Roof Top Garden",
    desc: "Manfaatkan atap dak Anda menjadi taman rooftop yang spektakuler. Kami merancang taman atap yang ringan, tahan angin, dan memiliki sistem drainase sempurna.",
    startFrom: 12000000,
    satuan: "paket",
    includes: [
      { icon: "", item: "Analisis struktural beban atap gratis" },
      { icon: "", item: "Desain 3D rooftop garden (2 konsep)" },
      { icon: "", item: "Sistem drainase & waterproofing profesional" },
      { icon: "", item: "Media tanam ringan (campuran perlite & cocopeat)" },
      { icon: "", item: "Tanaman tahan angin & UV pilihan (min. 12 jenis)" },
      { icon: "", item: "Deck composite atau keramit anti-slip area jalan" },
      { icon: "", item: "Railing pengaman stainless / kaca" },
      { icon: "", item: "Instalasi pencahayaan ambiance outdoor (6 titik)" },
      { icon: "", item: "Garansi drainase & perawatan 90 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80", tema: "Sky Lounge Garden", desc: "Lounge eksklusif di atap dengan sofa outdoor premium, tanaman dalam pot besar, dan pencahayaan ambiance malam hari." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Minimalis Urban", desc: "Desain bersih untuk rooftop kota -- deck composite, tanaman pot rendah, dan railing kaca untuk view kota yang maksimal." },
      { img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80", tema: "Tropical Rooftop", desc: "Suasana resort di atas gedung. Tanaman tropis tinggi sebagai windbreak alami, hammock, dan area santai yang teduh." },
      { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", tema: "Rooftop Dining", desc: "Area makan outdoor di atap dengan meja kayu solid, lampu gantung vintage, dan taman herba aromatik di sekelilingnya." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Green Roof Modern", desc: "Atap hijau dengan sistem tanam modular ringan. Menurunkan suhu bangunan sekaligus menciptakan estetika hijau dari bawah." },
      { img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80", tema: "Zen Rooftop", desc: "Keheningan di atas ketinggian. Kerikil zen, tanaman bonsai, dan bangku meditasi -- meditasi pagi yang mewah setiap hari." },
    ]
  },
  {
    id: "vertical-garden",
    icon: "",
    title: "Contoh Desain Vertical Garden",
    desc: "Solusi taman untuk ruang terbatas. Dinding hijau vertikal kami hadir sebagai statement piece yang hidup — menyejukkan, memperindah, dan meningkatkan kualitas udara.",
    startFrom: 2800000,
    satuan: "m²",
    includes: [
      { icon: "", item: "Konsultasi & pengukuran dinding gratis" },
      { icon: "", item: "Rangka sistem panel modular (GI / aluminium)" },
      { icon: "", item: "Media tanam hidroponik / cocopeat premium" },
      { icon: "", item: "Pilihan 20+ jenis tanaman hias / herba / sukulen" },
      { icon: "", item: "Sistem irigasi drip otomatis + timer digital" },
      { icon: "", item: "Instalasi & finishing rapi (bisa indoor/outdoor)" },
      { icon: "", item: "Suplemen grow-light untuk area indoor (opsional)" },
      { icon: "", item: "Garansi tumbuh tanaman 30 hari + panduan perawatan" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Living Wall Interior", desc: "Dinding hidup di dalam ruangan -- sistem irigasi otomatis tersembunyi, media tanam hidroponik, dan pilihan 30+ jenis tanaman hias." },
      { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", tema: "Facade Vertical Garden", desc: "Tampak depan rumah yang memukau dengan vertical garden fasad. Tanaman tahan UV dan cuaca, perawatan minimal." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Herb Wall Kitchen", desc: "Dinding herba aromatik di area dapur -- basil, mint, rosemary, thyme. Segar, wangi, dan bisa dipetik kapan saja." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "Office Green Wall", desc: "Vertical garden di area kerja atau lobby kantor. Terbukti meningkatkan produktivitas dan mengurangi stres karyawan." },
      { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", tema: "Tropical Statement Wall", desc: "Komposisi tanaman tropis dramatis -- monstera, philodendron, dan pakis raksasa. Bold dan instagrammable." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Minimalis Moss Wall", desc: "Dinding lumut hijau yang tidak membutuhkan air -- ideal untuk indoor tanpa sinar langsung. Estetis dan zero maintenance." },
    ]
  },
  {
    id: "kolam-hias",
    icon: "",
    title: "Contoh Desain Kolam Hias & Air Mancur",
    desc: "Suara gemericik air adalah musik alami paling menenangkan. Kolam hias dan air mancur kami dirancang untuk keindahan visual sekaligus menciptakan mikroklimat yang sejuk.",
    startFrom: 8000000,
    satuan: "paket",
    includes: [
      { icon: "", item: "Desain & layout kolam custom sesuai lahan" },
      { icon: "", item: "Konstruksi dinding & lantai kolam (beton waterproof)" },
      { icon: "", item: "Sistem sirkulasi pompa & filter biologis" },
      { icon: "", item: "Finishing batu alam / keramik antik pilihan" },
      { icon: "", item: "Lampu LED underwater berwarna (RGB)" },
      { icon: "", item: "Starter pack ikan koi / ikan hias (opsional)" },
      { icon: "", item: "Tanaman air & border kolam (teratai, eceng mini)" },
      { icon: "", item: "Garansi kebocoran & sistem 90 hari" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800&q=80", tema: "Kolam Koi Jepang", desc: "Kolam koi bergaya Jepang lengkap dengan filter biologis, batu suiseki, jembatan mini kayu, dan ikan koi pilihan warna-warni." },
      { img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", tema: "Waterfall Minimalis", desc: "Air terjun dinding batu alam yang elegan. Suara gemericik konstan menciptakan ambiance premium di halaman rumah Anda." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Fountain Klasik", desc: "Air mancur tengah taman bergaya klasik Eropa -- patung lion head, mangkuk bertingkat, dan pencahayaan bawah air berwarna." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Kolam Renang Natural", desc: "Natural pool dengan border batu andesit, filter tanaman, dan waterfall tepi -- kolam yang menyatu sempurna dengan taman." },
      { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", tema: "Air Mancur Modern", desc: "Instalasi air mancur geometris modern dari stainless steel. Jet air presisi dengan sistem kontrol otomatis dan LED underwater." },
      { img: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&q=80", tema: "Kolam Teratai", desc: "Kolam dangkal dengan teratai dan eceng gondok -- habitat alami yang juga berfungsi sebagai biofilter alami yang indah." },
    ]
  },
  {
    id: "lampu-taman",
    icon: "",
    title: "Contoh Desain Lampu Taman & Outdoor Lighting",
    desc: "Taman yang indah di siang hari harus tetap memukau di malam hari. Sistem pencahayaan outdoor kami mengubah taman menjadi panggung cahaya yang dramatis dan romantis.",
    startFrom: 1500000,
    satuan: "paket",
    includes: [
      { icon: "", item: "Perencanaan titik lampu & layout pencahayaan" },
      { icon: "", item: "Lampu taman LED (min. 4 titik, IP65 weatherproof)" },
      { icon: "", item: "Instalasi kabel tanam bawah tanah rapi & aman" },
      { icon: "", item: "Timer otomatis atau sensor cahaya senja-fajar" },
      { icon: "", item: "Pilihan warna: warm white, cool white, atau RGB" },
      { icon: "", item: "Opsi solar-powered untuk area tanpa listrik" },
      { icon: "", item: "Panel kontrol & MCB proteksi outdoor" },
      { icon: "", item: "Garansi instalasi & produk 1 tahun" },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=800&q=80", tema: "Fairy Light Garden", desc: "Ribuan lampu kabel tembaga menyelimuti pepohonan dan pergola -- menciptakan suasana magis seperti bintang di taman Anda." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Uplighting Dramatic", desc: "Lampu sorot LED dari bawah yang menyinari pohon dan dinding -- efek dramatis yang menonjolkan tekstur dan bentuk tanaman." },
      { img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80", tema: "Solar Path Lighting", desc: "Lampu jalur solar-powered di sepanjang stepping stone. Otomatis menyala saat gelap -- hemat energi dan instalasi mudah." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Lantern Taman Klasik", desc: "Lentera besi tempa bergaya klasik sebagai focal point taman. Tersedia dalam versi gas, listrik, dan solar." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "LED Underwater Kolam", desc: "Pencahayaan dalam air berwarna RGB untuk kolam hias dan air mancur. Efek spektakuler dengan kendali remote atau smartphone." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "String Light Pergola", desc: "Lampu bohlam vintage di atas pergola outdoor -- ambiance bistro Eropa untuk area makan terbuka Anda." },
    ]
  },
];

export { LANDSCAPE_CATEGORIES };
