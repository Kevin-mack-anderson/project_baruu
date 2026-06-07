document.addEventListener('DOMContentLoaded', () => {
    muatAntreanSJF();
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
    .catch(error => console.error("Gagal menarik data antrean:", error));
}

function cetakKartuAntrean(antrean) {
    const container = document.getElementById('queue-container');
    if (!container) return;
    
    container.innerHTML = ''; 

    if (antrean.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: gray;">Belum ada pesanan masuk.</p>';
        return;
    }
    
    antrean.forEach((pesanan, index) => {
        let detailMenu;
        try { detailMenu = JSON.parse(pesanan.detail_menu); } 
        catch(e) { detailMenu = {}; }
        
        let listMenuHTML = '<ul class="menu-list">';
        for (const [nama, item] of Object.entries(detailMenu)) {
            listMenuHTML += `<li><strong>${item.qty}x</strong> ${nama}</li>`;
        }
        listMenuHTML += '</ul>';
        
        const card = document.createElement('div');
        card.className = 'card';
        
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

function tandaiSelesai(id_transaksi) {
    const yakin = confirm(`Yakin pesanan #${id_transaksi} sudah selesai dibuat?`);
    if (!yakin) return;
    
    fetch(`http://127.0.0.1:5000/api/pesanan/${id_transaksi}/selesai`, {
        method: 'PUT'
    }) 
    .then(response => response.json())
    .then(data => {
        if (data.status === "sukses") {
            muatAntreanSJF(); 
        } else {
            alert("GAGAL MENYELESAIKAN PESANAN: " + data.pesan);
        }
    })
    .catch(error => {
        console.error("Gagal menghubungi server:", error);
    });
}