const wadahList = document.getElementById('menu-list');
let stokMemori = {};

document.addEventListener('DOMContentLoaded', () => {
    // Tarik data dari Database Python saat halaman dibuka
    wadahList.innerHTML = "<p> Menarik data stok dari server...</p>";
    fetch('http://127.0.0.1:5000/api/stok')
    .then(res => res.json())
    .then(data => {
        if(data.status === 'sukses') {
            stokMemori = data.data;
            renderDaftarMenu();
        }
    })
    .catch(err => {
        wadahList.innerHTML = "<p style='color:red;'> Gagal terhubung ke Database Python.</p>";
    });
});

function renderDaftarMenu() {
    wadahList.innerHTML = '';
    // Buat dropdown berdasarkan data dari database
    for (const [menu, tersedia] of Object.entries(stokMemori)) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <span style="font-weight: 500;">${menu}</span>
            <select id="status-${menu.replace(/\s+/g, '-')}">
                <option value="true" ${tersedia ? 'selected' : ''}>✅ Tersedia</option>
                <option value="false" ${!tersedia ? 'selected' : ''}>❌ Habis</option>
            </select>
        `;
        wadahList.appendChild(div);
    }
}

function simpanStok() {
    let stokBaru = {};
    for (const menu of Object.keys(stokMemori)) {
        const idSelect = `status-${menu.replace(/\s+/g, '-')}`;
        const status = document.getElementById(idSelect).value;
        stokBaru[menu] = (status === 'true'); 
    }

    // Kirim data baru ke Database Python
    fetch('http://127.0.0.1:5000/api/stok', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stokBaru)
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'sukses') alert(" Status stok berhasil dikunci di Database permanen!");
    })
    .catch(err => alert("Gagal terhubung ke server!"));
}

function kembali() {
    window.location.href = "admin.html"; 
}