document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil memori array ID pesanan dari HP pelanggan
    const riwayatIds = JSON.parse(localStorage.getItem('riwayatPesananKu')) || [];
    const wadah = document.getElementById('wadah-riwayat');

    // Jika wadah tidak ditemukan di HTML, hentikan proses
    if (!wadah) return; 

    // 2. Jika pelanggan belum pernah memesan via QR/Web
    if (riwayatIds.length === 0) {
        wadah.innerHTML = `
            <div style="text-align: center; color: gray; margin-top: 50px;">
                <h2>📭</h2>
                <p>Belum ada riwayat pesanan digital (QR/Jadwal).</p>
                <p style="font-size: 12px;">Pesanan Cash tidak dicatat di perangkat ini.</p>
            </div>
        `;
        return;
    }

    // 3. Tampilkan tulisan memuat sebelum data datang
    wadah.innerHTML = "<p style='text-align:center;'>⏳ Menarik data riwayat dari server...</p>";

    // 4. Minta data ke Back-End Python
    fetch('http://127.0.0.1:5000/api/riwayat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: riwayatIds })
    })
    .then(res => res.json())
    .then(data => {
        wadah.innerHTML = ''; // Bersihkan tulisan loading

        if (!data.data || data.data.length === 0) {
            wadah.innerHTML = "<p style='text-align:center; color:gray;'>Pesanan tidak ditemukan di database restoran.</p>";
            return;
        }

        // 5. Looping cetak kartu riwayat
        data.data.forEach(p => {
            // Logika Warna Status
            let warnaBadge = 'bg-proses'; // Default (Selesai/Lunas dari kasir)
            if (p.status === 'Siap Diambil') warnaBadge = 'bg-siap';
            if (p.status === 'Sudah Diambil') warnaBadge = 'bg-selesai';

            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <h3 style="margin-top:0; margin-bottom: 5px;">Pesanan #${p.id_transaksi} - ${p.nama_pelanggan}</h3>
                <p style="color: gray; font-size: 14px; margin-top: 0; margin-bottom: 15px;">Asal: ${p.tipe_pesanan}</p>
                <span class="badge ${warnaBadge}">Status: ${p.status}</span>
            `;
            wadah.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Error:", error);
        wadah.innerHTML = "<p style='color:red; text-align:center;'>Gagal terhubung ke Server Python. Pastikan server menyala.</p>";
    });
});