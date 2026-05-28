// 1 Menangkap Elemen Yang dibutuhkan
// Gunakan Querryselector all karna ada banyak
const semuaProduk = document.querySelectorAll('.produk');
const daftarItem = document.getElementById('daftarItem');
const teksTotalHarga = document.getElementById('totalHarga');

// Var untuk menyimpan total harga
let totalBelanja = 0;

// 2 Memberikan Interaksi pada setiap gambar produk
semuaProduk.forEach(function(gambar) {
  // Tamvbahkan pendengar aksi click
  gambar.addEventListener('click', function(){

    // a. Mengambil data dari gambar yang sedang di klik (this)
    const namaProduk = this.getAttribute('data-nama');
    const hargaProduk = parseInt(this.getAttribute('data-hargaa'));

    // b. Membuar elemem daftar baru (<li>) untuk keranjang
    const itemBaru = document.createElement('li');
    itemBaru.textContent = `${namaProduk} - Rp ${hargaProduk}`;

    // c. Memasukan <li> baru tersebut kedalam ul
    daftarItem.appendChild(itemBaru);

    // d. Menambahkan harga ke total dan memperbarui teks di layar
    totalBelanja = totalBelanja + hargaProduk;
    teksTotalHarga.textContent = totalBelanja.toLocaleString('id-ID')
  })
})