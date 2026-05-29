document.addEventListener('DOMContentLoaded', () => {
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

        // Tambahkan baris Total dan Pajak
        table.innerHTML += `
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
            const method = selectBayar.value;
            // Kuncian 2 dropdown
            if (tipePesanan === 'Jadwal' && method === 'Cash') {
                alert("Pesanan Jadwal wajib menggunakan metode non-cash!");
                opsiQR.selected = true;
                return;
            }
            // Simpan lokal
            localStorage.setItem('metodePembayaran', method);
            // Kunci tombol dropdown dan sembunyikan tombol konfirmasi utama
            selectBayar.disabled = true;
            btnKonfirmasi.style.display = "none";

            if (method === "Cash") {
                cashSection.style.display = "block";
                // Generate qr untuk kasir
                qrContainer.innerHTML = "";
                const orderData = {tipe: tipePesanan, total: totalBayar, items: cart};
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
            alert("Terimakasih! Pembayaran Berhasi Diverifikasi!");

            btnSudahBayar.text.textContent = "Lanjut ke Detail Pesanan";
            btnSudahBayar.style.backgroundColor = "#4a3c31";

            // Ubah fungsi tombol menjadi pindah halaman
            btnSudahBayar.addEventListener('click', () => {
                window.location.href = "../Detail_pesanan/detail.html";
            });
        });


    });