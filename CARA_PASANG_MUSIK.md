# Cara Pasang Musik 🎵

## Struktur Folder

```
bucin/
├── music/
│   ├── song1.mp3   ← taruh file lagu di sini
│   ├── song2.mp3
│   └── song3.mp3
└── assets/
    └── music-cover/
        ├── song1.jpeg  ← cover art lagu (opsional)
        ├── song2.jpg
        └── song3.jpg
```

## Edit Playlist

Buka file `js/systems/audio-system.js`, cari bagian ini di paling atas:

```javascript
const playlist = [
  {
    id:        'song1',
    title:     'Nama Lagu',      // ← ganti judul
    artist:    'Nama Artis',     // ← ganti artis
    file:      'music/song1.mp3', // ← path ke file mp3
    cover:     'assets/music-cover/song1.jpeg', // ← path ke cover
    volume:    0.75,
    loop:      true,
    fadeIn:    2.5,
    fadeOut:   2.0
  },
  // tambah lagu baru dengan copy paste blok di atas
];
```

## Cara Pakai

- Klik ikon **♪ (not musik)** di pojok kanan bawah untuk buka player
- Player akan auto-play saat pertama kali klik
- Ada tombol prev/next, volume slider, dan visualizer
