document.addEventListener('DOMContentLoaded', () => {
        //Ambil data keranjang dari localstorage
        const cartData = localStorage.getItem('dataPesananKopi');
        const tipePesanan = localStorage.getItem('tipePesanan');

        if (!cartData) {
            alert("Keranjang Kosong!");
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

        // Logika tipe pesanan
        if (tipePesanan === 'Jadwal') {
            opsiCash.disabled = true;
            opsiCash.textContent = "Cash Khusus (Walk-In / Ojol)";
            selectBayar.value = "QR";
        } else {
            opsiCash.disabled = false;
            opsiCash.textContent = "Cash";
        }

        // Simpan datanya
        const btnKonfirmasi = document.querySelector('.okk');
        btnKonfirmasi.addEventListener('click', () => {
            localStorage.setItem('metodePembayaran', selectBayar.value)
        });
});