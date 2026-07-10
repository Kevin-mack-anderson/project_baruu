const wadahList = document.getElementById('menu-list');
let stokMemori = {};

document.addEventListener('DOMContentLoaded', () => {
    wadahList.innerHTML = "<p>⏳ Menarik data stok dari server...</p>";
    fetch('http://127.0.0.1:5000/api/stok')
    .then(res => res.json())
    .then(data => {
        if(data.status === 'sukses') {
            stokMemori = data.data;
            renderDaftarMenu();
        }
    })
    .catch(err => wadahList.innerHTML = "<p style='color:red;'>❌ Gagal terhubung ke Database Python.</p>");
});

function renderDaftarMenu() {
    wadahList.innerHTML = '';
    for (const [menu, data] of Object.entries(stokMemori)) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div style="flex-grow: 1;">
                <span style="font-weight: bold; font-size: 16px;">${menu}</span>
                <div style="font-size: 12px; color: gray; margin-top: 4px;">
                    Sisa: <b style="color:${data.sisa > 0 ? 'green' : 'red'}">${data.sisa}</b> dari ${data.kuota} porsi
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size:12px; color: gray;">Kuota:</label>
                <input type="number" id="kuota-${menu.replace(/\s+/g, '-')}" value="${data.kuota}" min="0" style="width: 50px; padding: 5px; text-align: center; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
        wadahList.appendChild(div);
    }
}

function simpanStok() {
    let stokBaru = {};
    for (const menu of Object.keys(stokMemori)) {
        const idInput = `kuota-${menu.replace(/\s+/g, '-')}`;
        stokBaru[menu] = parseInt(document.getElementById(idInput).value) || 0; 
    }

    fetch('http://127.0.0.1:5000/api/stok', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stokBaru)
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'sukses') {
            alert("✅ Kuota Harian berhasil dikunci di Database!");
            window.location.reload(); 
        }
    })
    .catch(err => alert("Gagal terhubung ke server!"));
}

function kembali() { window.location.href = "admin.html"; }