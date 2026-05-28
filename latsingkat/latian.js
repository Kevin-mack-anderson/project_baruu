// 1 Mengaitkan elemen HTML ke dalam variabel javascript menggunakan DOM
const dropdownKarakter = document.getElementById('pilihkarakter');
const tombol = document.getElementById('tombolpilih');
const teksHasil = document.getElementById('hasilpilihan');

// 2 Menambahkan Event Listener (pendengar aksi) pada tombol
// Aksi yang didengarkan di sini adalah 'click'
tombol.addEventListener('click', function() {

  // Mengambil Nilai dari opsi yang sedang dipilih
  const karakterYangDipilih = dropdownKarakter.value;

  // Logika Interaksi Mengubah teks dan warna berdasarkan Pilihan
  if (karakterYangDipilih == 'Ksatria') {
    teksHasil.textContent = "Kamu Memilih Karakter Ksatria";
    teksHasil.style.color = "blue";
  }
  else if (karakterYangDipilih == 'Penyihir') {
    teksHasil.textContent = "Kamu Memilih Penyihir";
    teksHasil.style.color = "purple";
  }
  else if (karakterYangDipilih == 'Pemanah') {
    teksHasil.textContent = "Kamu Memilih Pemanah";
    teksHasil.style.color = "green";
  }
});