document.addEventListener('DOMContentLoaded', () => {
      // Ambil smeua data dalam memori
      const cartData = localStorage.getItem('dataPesananKopi');

      // kondisi jika user asal buka halaman ini
      if (!cartData) {
        alert("Data pesanan tidak ditemukan atau sesi telah berakhir!");
        window.location.href = "../Menu/menu.html";
        return;
      }

      const cart = JSON.parse(cartData);
      const tipePesanan = localStorage.getItem('tipePesanan');
      const metodePembayaran = localStorage.getItem('metodePembayaran');
      const waktuJadwal = localStorage.getItem('waktuJadwal');

      // render kotak info pesanan
      const infoBox = document.getElementById('info-pesanan');
      let infoHTML = `
        <P><b>Asal Pesanan: </b>${tipePesanan}</P>
        <P><b>Metode Pembayaran: </b>${metodePembayaran}</P>
      `;

      console.log("cek data tipe:", tipePesanan, "| waktu:", waktuJadwal)
      // tambahkan ket jam (khusus scheduling)
      if (tipePesanan === 'Jadwal' && waktuJadwal) {
        const jamAmbil = waktuJadwal.split(' ')[1];
        infoHTML += `<p><b>Waktu Ambil: </b>${jamAmbil} WIB</p>`
      }
      infoBox.innerHTML = infoHTML;

      // render table menu yang dipesan
      const table = document.getElementById('table-detail');
      table.innerHTML =`
        <tr>
          <th style="text-align: left;">Pesanan</th>
          <th style="text-align: center;">QTY</th>
        </tr>
      `;

      // looping untuk mencetak nama dan jumlah tanpa harga
      for (const [nama, item] of Object.entries(cart)) {
        const row = table.insertRow();
        row.insertCell(0).textContent = nama;

        const cellQty = row.insertCell(1);
        cellQty.textContent = item.qty;
        cellQty.style.textAlign = "center";
      }

      // generator nomor antrian
      let noAntrean = localStorage.getItem('nomorAntrean');
      console.log(noAntrean)
      if (!noAntrean) {
        // Buat nomor acal 1-99
        const randomNum = Math.floor(Math.random() * 99) +1;
        // berikan kode huruf depan
        const prefix = tipePesanan ===  'Jadwal' ? 'J' : (tipePesanan === 'Walk-in' ? 'W' : 'O');
        // gabung
        noAntrean = `${prefix}--${randomNum.toString().padStart(2, '0')}`;
        localStorage.setItem('nomorAntrean', noAntrean);
      }
      document.getElementById('nomor-antrean').textContent = noAntrean;

      // update status pesanan
      const statusBadge = document.getElementById('status-pesanan');

      // user yang masuk halaman sini dalam kondisi berhasil
      // kita set
      if (localStorage.getItem('statusPembayaran') === 'Lunas') {
        statusBadge.textContent = "Terverifikasi - Menunggu Diproses";
        statusBadge.style.backgroundColor = "#e8f5e9";
        statusBadge.style.color = "#2e7d32";
      }
});

// Fungsi selesai
function selesaiPesanan() {
  // hapu semua memori untuk pelanggan baru
  localStorage.clear();
  // arahkan kembali ke halaman awal
  window.location.href = "../Menu/menu.html"
}