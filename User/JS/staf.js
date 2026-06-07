  function muatData() {
            fetch('http://127.0.0.1:5000/api/pesanan/siap')
            .then(res => res.json())
            .then(data => {
                const wadah = document.getElementById('wadah-siap');
                wadah.innerHTML = '';
                if(data.data.length === 0) wadah.innerHTML = '<p>Belum ada makanan di meja.</p>';
                
                data.data.forEach(p => {
                    wadah.innerHTML += `
                        <div class="card">
                            <h2 style="margin:0">#${p.id_transaksi} - ${p.nama_pelanggan}</h2>
                            <p style="color:gray">${p.tipe_pesanan}</p>
                            <button onclick="tandaiDiambil(${p.id_transaksi})">✅ Makanan Sudah Diambil</button>
                        </div>
                    `;
                });
            });
        }

        function tandaiDiambil(id) {
            fetch(`http://127.0.0.1:5000/api/pesanan/${id}/diambil`, { method: 'PUT' })
            .then(() => muatData());
        }

        muatData();
        setInterval(muatData, 3000); 