  // Daftar menu statis
        const daftarMenu = [
            "Air Putih", "Kopi Aren", "Kopi Susu", "Matcha Latte",
            "Blue Lagoon", "Kentang Goreng", "Roti Bakar", "Mie Goreng"
        ];

        // Ambil data dari localstorage (jika ada)
        let stokMemori = JSON.parse(localStorage.getItem('stokMenu')) || {};
        const wadahList = document.getElementById('menu-list');

        // Cetak daftar menu ke layar
        daftarMenu.forEach(menu => {
            // Jika tidak ada di memori, anggap default-nya = true (Tersedia)
            let tersedia = stokMemori[menu] !== false; 
            
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
        });

        // Fungsi saat tombol simpan ditekan
        function simpanStok() {
            let stokBaru = {};
            daftarMenu.forEach(menu => {
                // Ambil nilai dari masing-masing dropdown
                const idSelect = `status-${menu.replace(/\s+/g, '-')}`;
                const status = document.getElementById(idSelect).value;
                
                // Ubah string "true"/"false" menjadi boolean sungguhan
                stokBaru[menu] = (status === 'true'); 
            });

            // Simpan ke memori browser
            localStorage.setItem('stokMenu', JSON.stringify(stokBaru));
            alert("Status ketersediaan menu berhasil diperbarui!");
        }

        function kembali() {
            // Sesuaikan "admin.html" dengan nama file halaman kasir/admin kamu
            window.location.href = "admin.html"; 
        }