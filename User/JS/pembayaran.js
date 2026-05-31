document.addEventListener('DOMContentLoaded', () => {
        // (PENGEMBANGAN)
        // Fitur untuk memindahkan otomatis halaman ketika kasir sudah mengkonfirmasi
        window.addEventListener('storage', (event) => {
            if (event.key === 'statusPembayaran' && event.newValue === 'Lunas') {
                alert("PEMBAYARAN BERHASIL");
                window.location.replace("../Detail_pesanan/detail.html");
            }
        });
        
        // Untk cek pesanan apakah sudah dibayar sebelumnya
        if (localStorage.getItem('statusPembayaran') === 'Lunas') {
            // replace digunakan agar user tidak menekan tombol back terus menerus
            window.location.replace("../Detail_pesanan/detail.html");
            return;
        }
        //Ambil data keranjang dari localstorage
        const cartData = localStorage.getItem('dataPesananKopi');
        const tipePesanan = localStorage.getItem('tipePesanan');

        if (!cartData) {
            alert("Keranjang Kosong atau Pesanan Sudah Hangus! Silahkan Pesan Kembali!");
            window.location.href="../Menu/menu.html";
            return;
        }

        const cart = JSON.parse(cartData);
        const table = document.getElementById('jenis-pesanan');

        // Render ulang pesanan seperti di menu
        table.innerHTML = `
            <tr>
                <th style="text-align: left;">Pesanan</th>
                <th style="text-align: left;">Jumlah</th>
                <th style="text-align: left;">Subtotal</th>
            </tr>
        `;

        let totalHarga = 0;

        for (const[nama, item] of Object.entries(cart)) {
            const row = table.insertRow();
            row.insertCell(0).textContent = nama;
            row.insertCell(1).textContent = item.qty;

            const subtotal = item.harga * item.qty;
            totalHarga += subtotal;
            row.insertCell(2).textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
        }

        const pajak = totalHarga * 0.11;
        const totalBayar = totalHarga + pajak;

        // code dubging
        console.log("Tipe pesanan:", tipePesanan)
        console.log("Waktu Jadwal dari storage:", localStorage.getItem('waktuJadwal'));
        let barisWaktuJadwal = "";
        // Agar keterangan waktu terdapat di table khusus scheduling
        if (tipePesanan === 'Jadwal') {
            const waktuJadwal = localStorage.getItem('waktuJadwal');
            if (waktuJadwal) {
                // Memisahkan tanggal dan jam
                const jamAmbil = waktuJadwal.split(' ')[1];
                
                barisWaktuJadwal = `
                     <tr class="summary-row">
                        <td colspan="2" style="text-align: right; color: #4a3c31; font-weight: 500;">Waktu Ambil:</td>
                        <td style="color: #4a3c31; font-weight: bold;">${jamAmbil} WIB</td>
                    </tr>
                 `;
            }
        }


        // Tambahkan baris Total dan Pajak
        table.innerHTML += `
            ${barisWaktuJadwal}
            <tr>
                <td colspan="2" style="text-align: right; font-weight: bold;">Total Menu:</td>
                <td style="font-weight: bold;">Rp ${totalHarga.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right;">Pajak (PPN 11%):</td>
                <td>Rp ${pajak.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right; font-weight: bold;">Total Bayar:</td>
                <td style="font-weight: bold; color: #4a3c31;">Rp ${totalBayar.toLocaleString('id-ID')}</td>
            </tr>
        `;

        // logic opsi pembayaran
        const selectBayar = document.querySelector('.pilihan-byr');
        const opsiCash = document.getElementById('csh');
        const opsiQR = document.getElementById('qr');

        // set nilai value pilihan
        opsiCash.value = "Cash";
        opsiQR.value = "QR";

        // Elemen untuk qr
        const cashSection = document.getElementById('cash-section');
        const qrSection = document.getElementById('qr-section');
        const qrContainer = document.getElementById('qrcode');
        const btnKonfirmasi = document.getElementById('btn-konfirmasi');
        const btnSudahBayar = document.getElementById('btn-sudah-bayar');

        opsiCash.value = "Cash";
        opsiQR.value = "QR";

        // Logika tipe pesanan
        if (tipePesanan === 'Jadwal') {
            opsiCash.disabled = true;
            opsiCash.textContent = "Cash (Khusus Walk-In/Ojol)";
            opsiQR.selected = true;
        } else {
            opsiCash.disabled = false;
            opsiCash.textContent = "Cash";
            opsiCash.selected = true;
        }

        // Var utk timer
        let countdownInterval;
        let timeLeft = 120;

        // Logika saat tombol konfirmasi ditekan
        btnKonfirmasi.addEventListener('click', () => {
            // Validasi nama pelanggan
            const inputNama = document.getElementById('nama-pelanggan');
            const errorNama = document.getElementById('error-nama');
            const nama = inputNama.value.trim();
            // logika nama
            if (nama === "") {
                errorNama.textContent = "Nama panggilan wajib diisi!";
                errorNama.style.display = "block";
                inputNama.focus();
                return;
            }
            // logic simbol dan angka
            const regexHanyaHuruf = /^[a-zA-Z\s]+$/;
            if (!regexHanyaHuruf.test(nama)) {
                errorNama.textcontent = "Nama hanya boleh berisi huruf (tanpa simbol!)";
                errorNama.style.display = "block";
                inputNama.focus();
                return;
            }
            
            // cek kata tak pantas (Profanity Filter)
            const daftarKataKotor = [
                "bodoh","bangsat","tolol","anjing","bajingan","bego","pea","puki","pukimai","telaso","asu","pantek","dongo",
                "kontol", "peler","titit","tete","payudara","memek"
            ]
            const namaKecil = nama.toLowerCase();
            
            // Mengecek nama apakah mengandung kata kotor
            const mengandungKataKotor = daftarKataKotor.some(kata => namaKecil.includes(kata));
            
            if (mengandungKataKotor) {
                errorNama.textContent = "Gunakan kata-kata yang pantas!";
                errorNama.style.display = "block";
                inputNama.focus();
                return;
            }
            
            // Sembunyikan error jika lolos semua dan simpan nama
            errorNama.display = "none";
            localStorage.setItem('namaPelanggan', nama);
            // Validasi pelanggan end


            // Kuncian 2 dropdown
            const method = selectBayar.value;
            if (tipePesanan === 'Jadwal' && method === 'Cash') {
                alert("Pesanan Jadwal wajib menggunakan metode non-cash!");
                opsiQR.selected = true;
                return;
            }
            // Simpan lokal
            localStorage.setItem('metodePembayaran', method);
            // Kunci tombol dropdown dan sembunyikan tombol konfirmasi utama
            selectBayar.disabled = true;
            inputNama.disabled = true;
            btnKonfirmasi.style.display = "none";

            if (method === "Cash") {
                cashSection.style.display = "block";
                // Generate qr untuk kasir
                qrContainer.innerHTML = "";
                const orderData = {tipe: tipePesanan, nama: nama, total: totalBayar, items: cart};

                new QRCode(qrContainer, {
                    text: JSON.stringify(orderData),
                    width: 150, height: 150, 
                    colorDark: "#4a3c31", colorLight: "#ffffff"
                });
            } else if (method === "QR") {
                qrSection.style.display = "block";
                // Generate Qr
                const qrisBox = document.getElementById('qris-box');
                qrisBox.innerHTML = "";
                new QRCode(qrisBox, {
                    text: "DUMMY_QRIS_TOTAL_BAYAR_Rp" + totalBayar, // Teks yang terbaca kalau QR di-scan
                    width: 150, height: 150,
                    colorDark : "#2e7d32", //  biar beda dengan QR Cash
                    colorLight : "#ffffff"
                });
                mulaiTimer();
            }
        });

        // Fungsi hitung mundur
        function mulaiTimer() {
            const timerDisplay = document.getElementById('timer-display');
            const qrisBox = document.getElementById('qris-box');
            const expiredMsg = document.getElementById('expired-msg');

            countdownInterval = setInterval(() => {
                timeLeft--;

                // Logika agar 120 detik terbacanya 2 menit
                let menit = Math.floor(timeLeft /60);
                let detik = timeLeft % 60;

                // Tambah angka 0 jika dibawah 10 detik
                let formatMenit = menit < 10 ? "0" + menit : menit;
                let formatDetik = detik < 10 ? "0" + detik : detik;
                timerDisplay.textContent = `${formatMenit}:${formatDetik}`;

                // Jika waktu habis
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    qrisBox.style.display = "none";
                    btnSudahBayar.style.display = "none";
                    timerDisplay.style.display = "none";
                    expiredMsg.style.display = "block";

                    // Menghapus localstorage apabila habis
                    localStorage.removeItem('dataPesananKopi');
                    localStorage.removeItem('tipePesanan');
                }
            }, 1000);
        };

        // Logika sudah dibayar (qr)
        btnSudahBayar.addEventListener('click', () => {
            clearInterval(countdownInterval);

            // lock button agar tidak double click
            btnSudahBayar.disabled = true;
            btnSudahBayar.textContent = "Memverifikasi Pembayaran..";
            btnSudahBayar.style.backgroundColor = "#8a7e74";

            // siapkan payload data
            const namaPanggilan = localStorage.getItem('namaPelanggan') || "Tanpa Nama";
            const payloadQR = {
                nama: namaPanggilan,
                tipe: tipePesanan,
                items: cart,
                total: totalBayar
            };

            // send ke backend
            fetch('htpp;//127.0.0.1:5000/api/pesanan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(payloadQR)
            })
            .then(async res => {
                const textRespon = await res.text();
                try {
                    return JSON.parse(textRespon);
                } catch (err) {
                    console.error("Response Server Error/Bukan JSON:", textRespon);
                    throw new Error("Server Python Bermasalah!!")
                }
            })
            .then(data => {
                if(data.status === "sukses") {
                    alert("terimakasih! Pembayaran Qr Berhasil Masuk!")
                    // give kunci lunas
                    localStorage.setItem('statusPembayaran', 'Lunas');
                    // pindah ke detail pesanan
                    window.location.href = "../Detail_pesanan/detail.html";
                } else {
                    alert("Gagal menyimpan: " + data.pesan);
                    btnSudahBayar.disabled = false;
                    btnSudahBayar.textContent = "Sudah Bayar";
                    btnSudahBayar.style.backgroundColor = "#2e7d32";
                }
            })
            .catch(err => {
                console.error(err);
                alert("Gagal terhubung ke Server. Pastikan Backend menyala");
                btnSudahBayar.disabled = false;
                btnSudahBayar.textContent = "Sudah Bayar";
                btnSudahBayar.style.backgroundColor = "#2e7d32";
            });
        });

         // Logika tombol selesai/lanjut khusus cash (PENGEMBANGAN)
        // const linkSelesaiCash = document.getElementById('link-selesai-cash');
        // if (linkSelesaiCash) {
        //     linkSelesaiCash.addEventListener('click', () => {
        //         localStorage.setItem('statusPembayaran', 'Lunas');
        //     });
        // }
    });