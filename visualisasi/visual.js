document.addEventListener('DOMContentLoaded', () => {
    // Panggil fungsi tarik data pertama kali saat halaman dibuka
    muatAntreanSJF();

    // Fitur tambahan: Halaman otomatis merefresh data setiap 10 detik
    // Jadi barista tidak perlu bolak-balik pencet F5
    setInterval(muatAntreanSJF, 10000); 
});

function muatAntreanSJF() {
    fetch('http://127.0.0.1:5000/api/antrean/sjf')
    .then(response => response.json())
    .then(data => {
        if (data.status === "sukses") {
            cetakKartuAntrean(data.data);
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
    container.innerHTML = ''; // Kosongkan layar pesan "Memuat..."

    if (antrean.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: gray;">Belum ada pesanan masuk.</p>';
        return;
    }

    // Looping data yang sudah diurutkan (Sorted) oleh Python
    antrean.forEach((pesanan, index) => {
        // Ingat, detail_menu di database masih berbentuk teks JSON, kita harus kembalikan ke objek JS
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
                <div class="time-badge">⏱️ ${pesanan.estimasi_waktu} Menit</div>
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

// Fungsi dummy untuk tombol selesai (Bisa dikembangkan nanti)
function tandaiSelesai(id_transaksi) {
    alert("Nantinya tombol ini akan menyuruh Python untuk menghapus Pesanan ID: " + id_transaksi + " dari layar Barista!");
}