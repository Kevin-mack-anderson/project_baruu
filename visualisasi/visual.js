let antreanSebelumnya = [];
let suaraAktif = false;
const btnSuara = document.getElementById('btn-suara');

document.addEventListener('DOMContentLoaded', () => {
    
    // Fungsi untuk suara
    
    if (btnSuara) {
        btnSuara.addEventListener('click', () => {
            suaraAktif = true;
            btnSuara.textContent = "Suara Panggilan Aktif";
            btnSuara.style.background = "#2e7d32";
            
            // Suara agar diizinkan browser
            const sapaan = new SpeechSynthesisUtterance("Sistem pemanggil suara telah aktif");
            sapaan.lang = 'id-ID';
            window.speechSynthesis.speak(sapaan);
        });
    }

    // Panggil fungsi tarik data pertama kali saat halaman dibuka
    muatAntreanSJF();
    
    // Fitur tambahan: Halaman otomatis merefresh data setiap 10 detik
    // Jadi barista tidak perlu bolak-balik pencet F5
    setInterval(muatAntreanSJF, 10000); 
    
    
    // sisipkan tombol di container antrian
    const container = document.getElementById('queue-container');
    container.parentNode.insertBefore(btnSuara, container);

    muatAntreanSJF();
    setInterval(muatAntreanSJF, 10000);
    
    function muatAntreanSJF() {
    fetch('http://127.0.0.1:5000/api/antrean/sjf')
    .then(response => response.json())
    .then(data => {
        if (data.status === "sukses") {
            // cek yang hilang dr antrean
            deteksiPesananSelesai(data.data);
            // cetak kartu
            cetakKartuAntrean(data.data);
            // simpan antrean baru ke memori
            antreanSebelumnya = data.data;
        }
    })
    .catch(error => {
        console.error("Gagal menarik data antrean:", error);
        document.getElementById('queue-container').innerHTML = 
        '<p style="color: red; text-align: center;">Gagal terhubung ke Server Python.</p>';
    });
}

function cetakKartuAntrean(antrean) {
    const container = document.getElementById('queue-container');
    container.innerHTML = ''; // Kosongkan layar pesan 

    if (antrean.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: gray;">Belum ada pesanan masuk.</p>';
        return;
    }
    
    // Looping data yang sudah diurutkan (Sorted) oleh Python
    antrean.forEach((pesanan, index) => {
        // detail_menu di database masih berbentuk teks JSON, kita harus kembalikan ke objek JS
        const detailMenu = JSON.parse(pesanan.detail_menu);
        
        // Racik list (ul) menu apa saja yang dipesan
        let listMenuHTML = '<ul class="menu-list">';
        for (const [nama, item] of Object.entries(detailMenu)) {
            listMenuHTML += `<li><strong>${item.qty}x</strong> ${nama}</li>`;
        }
        listMenuHTML += '</ul>';
        
        // Buat elemen kartu (div)
        const card = document.createElement('div');
        card.className = 'card';
        
        // Cetak struktur kartu
        card.innerHTML = `
            <div class="card-header">
            <div>
            <h3 style="margin: 0;">#${index + 1} - ${pesanan.nama_pelanggan}</h3>
                    <span style="color: gray; font-size: 13px;">Asal: ${pesanan.tipe_pesanan} | ID: ${pesanan.id_transaksi}</span>
                </div>
                <div class="time-badge">⏱️ ${pesanan.estimasi_waktu} Detik</div>
                </div>
                
            <div class="card-body">
            ${listMenuHTML}
            </div>
            
            <button class="btn-selesai" onclick="tandaiSelesai(${pesanan.id_transaksi})">
                Selesaikan Pesanan
                </button>
                `;
        
                container.appendChild(card);
    });
    }
    // Deteksi pesanan Selesai
    function deteksiPesananSelesai(antreanBaru) {
        if (antreanSebelumnya.length === 0) return;

        // ceri pesanan yang ada di memori lama, but tidak ada di new memori
        antreanSebelumnya.forEach(pesananLama => {
            const masihAda = antreanBaru.find(p => p.id_transaksi === pesananLama.id_transaksi);

            if (!masihAda && suaraAktif) {
                // pesanan hilang dan panggil nama
                panggilPelanggan(pesananLama.nama_pelanggan, pesananLama.id_transaksi);
            }
        });
    }
    
    // call pelanggan
    function panggilPelanggan(nama, id) {
        const teks =   `Pesanan nomor ${id}, nama ${nama}, selesai.`;
        
        const speech = new SpeechSynthesisUtterance(teks);
        speech.lang = 'id-ID';
        speech.rate = 0.85;
        speech.ptich = 1.1;
        speech.volume = 1;
        
        window.speechSynthesis.speak(speech);
    }
    
    // Fungsi dummy untuk tombol selesai 
    function tandaiSelesai(id_transaksi) {
        // tambahkan konfirmasi
        const yakin = confirm(`Yakin pesanan #${id_transaksi} sudah selesai dibuat?`);
    if (!yakin) return;
    // tembak api pakai PUT
    fetch(`http://127.0.0.1:5000/api/pesanan/${id_transaksi}/selesai`, {
        method: 'PUT'
    }) 
    .then(response => response.json())
    .then(data => {
        if (data.status === "sukses") {
            muatAntreanSJF();
        } else {
            alert("GAGAL MENYELESAIKAN PESANAN: ", data.pesan);
        }
    })
    .catch(error => {
        console.error("Gagal menghubungi server:", error);
        alert("Gagal terhubung ke server Python")
    });
  }
});