let cart = {};

// filter menu
function fiterMenu() {
//   const filterValue = document.getElementById('category-filter').value;
//   const menuContainer = document.getElementById('menu-container');
  const menuCards = document.querySelectorAll('.menu-card');

// // Tampilkan "container menu" when user has done choice option
// if (filterValue !== "") {
//   menuContainer.style.display = "grid"; ///Asumsi saja css nya grid
// } else {
//   menuContainer.style.display = "none";
// }

// filter setiap kartu berdasarkan data category
menuCards.forEach(card => {
  const category = card.getAttribute('data-category');
  if (filterValue === 'semua' || category === filterValue) {
    card.style.display = 'block';
  } else {
    card.style.display = 'none';
  }
 });
}

// Fungsi tambah ke keranjang (saat kartu di klik)
function add(nama, harga) {
  if (cart[nama]) {
    cart[nama].qty +=1;
  } else {
    cart[nama] = {harga: harga, qty: 1};
  }
  updateCartUI();
  checkForm();
}

// Render ulang tampilan tabel keranjang
function updateCartUI() {
  const table = document.querySelector('table');
    
    // Reset isi tabel dan kembalikan struktur header
    table.innerHTML = `
      <tr>
        <th>Pesanan</th>
        <th>Jumlah</th>
        <th>Subtotal</th>
      </tr>
    `;

    let totalHarga = 0;

    // Looping data di dalam objek cart untuk dibuatkan baris baru
    for (const [nama, item] of Object.entries(cart)) {
        const row = table.insertRow();
        
        // Kolom Nama Pesanan
        row.insertCell(0).textContent = nama;
        
        // Kolom Kuantitas dengan tombol interaktif +/-
        const cellQty = row.insertCell(1);
        cellQty.innerHTML = `
            <button onclick="changeQty('${nama}', -1)" style="padding: 2px 8px; cursor: pointer;">-</button>
            <span style="margin: 0 10px;">${item.qty}</span>
            <button onclick="changeQty('${nama}', 1)" style="padding: 2px 8px; cursor: pointer;">+</button>
        `;

        // Kolom Subtotal
        const subtotal = item.harga * item.qty;
        totalHarga += subtotal;
        row.insertCell(2).textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    }

    // Hitung Pajak (Menggunakan standar PPN 11%)
    const pajak = totalHarga * 0.11;
    const totalBayar = totalHarga + pajak;

    // Jika ada item di keranjang, tampilkan rincian total pembayaran di bawah tabel
    if (totalHarga > 0) {
        // 1. Baris Total Item
        const rowTotal = table.insertRow();
        rowTotal.className = "summary-row";
        rowTotal.innerHTML = `
            <td colspan="2" style="text-align: right; font-weight: bold;">Total Menu:</td>
            <td style="font-weight: bold;">Rp ${totalHarga.toLocaleString('id-ID')}</td>
        `;

        // 2. Baris Pajak PPN 11%
        const rowPajak = table.insertRow();
        rowPajak.className = "summary-row";
        rowPajak.innerHTML = `
            <td colspan="2" style="text-align: right; color: #8a7e74;">Pajak (PPN 11%):</td>
            <td style="color: #8a7e74;">Rp ${pajak.toLocaleString('id-ID')}</td>
        `;

        // 3. Baris Total Bayar keseluruhan
        const rowGrandTotal = table.insertRow();
        rowGrandTotal.className = "summary-row grand-total-row";
        rowGrandTotal.innerHTML = `
            <td colspan="2" style="text-align: right; font-weight: bold; color: #4a3c31;">Total Bayar:</td>
            <td style="font-weight: bold; color: #4a3c31; font-size: 14px;">Rp ${totalBayar.toLocaleString('id-ID')}</td>
        `;
    }
}

// Mengubah kuantitas item di keranjang
function changeQty(nama, delta) {
  if (cart[nama]) {
    cart[nama].qty += delta;

    // Hapus properti if qty =0 or <
    if (cart[nama].qty <= 0) {
      delete cart[nama];
    }
    updateCartUI();
    checkForm();
  }
}

// Fungsi penjadwalan
function toggleSched() {
  const asal = document.getElementById('asal').value;
  if (asal == 'Jadwal') {
    HTMLFormControlsCollection.log("Opsi web jadwal dipilih")
  }
}

// Validasi tombol konfirmasi
function checkForm() {
  const asal = document.getElementById('asal').value;
  const LinkKonfirmasi = document.getElementById('konfirmasi');
  const btnKonfirmasi = LinkKonfirmasi.querySelector('button');
  
  // Cek keranjang kosong
  const isCartEmpty = Object.keys(cart).length === 0;

  // Tombol aktif jika keranjang ada isi
  if (!isCartEmpty && asal != "") {
    btnKonfirmasi.disabled = false;
    LinkKonfirmasi.style.pointerEvents = "auto";
    btnKonfirmasi.style.opacity = "1";
  } else {
    btnKonfirmasi.disabled = true;
    LinkKonfirmasi.style.pointerevents ="none";
    btnKonfirmasi.style.opacity = "0.5";
  }
}

// Event Listerner insialisasi
document.addEventListener('DOMContentLoaded', () => {
  // Kunci tombol konfirmasi
  checkForm();

  const konfirmasi = document.getElementById('konfirmasi');

  konfirmasi.addEventListener('click', function(event){
    // Menggunakan window.confirm bawaan
    const yakin = confirm("Apakah sudah sesuai dan ingin melanjutkan?")

    if (!yakin) {
      event.preventDefault(); //biar ga pindah halaman
    } else {
      localStorage.setItem('dataPesananKopi', JSON.stringify(cart))
      ///Simpan tipe pesanan 
      localStorage.setItem('tipePesanan', document.getElementById('asal').value);
      // Agar status pesanan baru tidak dianggap lunas
      localStorage.removeItem('statusPembayaran');
    }
  })
});


