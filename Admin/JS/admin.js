// Insialisasi scanner kamera
 document.addEventListener('DOMContentLoaded', () => {
// buat suara biip di qr
  function playBeep() {
        // Ciptakan ruang audio di browser
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Buat osilator (sumber gelombang suara)
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Atur jenis dan tinggi nada (800 Hz mirip suara scanner minimarket)
        oscillator.type = 'sine'; 
        oscillator.frequency.value = 800; 

        // Atur volume dan durasi (0.15 detik agar terdengar renyah)
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15); 

        // Mainkan suaranya!
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    }
   

  let totalTagihanScanned = 0;
  let dataPesananScanned = null;
    // fungsi baru: total transaksi hari ini, ngmabilnya python
    function muatTransaksiHariIni() {
      fetch('http://127.0.0.1:5000/api/transaksi/hari-ini')
      .then(response => response.json())
      .then(data => {
        if (data.status === "sukses") {
          const infoMenu = document.getElementById('info-hari-ini');
          infoMenu.innerHTML = `Hari ini: ${data.jumlah} Pesanan | Rp ${data.pendapatan.toLocaleString('id-ID')}`;
        }
      })
      .catch(err => console.error("Gagal memuat total transaksi:", err))
    }
    // fungsi total transaksi hari ini end //


    // call fungsinya ketika halam pertama kali dibuka
    muatTransaksiHariIni();
    //      
    
    //untuk setting scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250}},
      false
    );
    //
    
    // Fungsi ketika qr berhasil terbaca
    function onScanSuccess(decodeText, decodeResult) {
      try{
        // hentikan scanner agar tidak scan berkali-kali
        html5QrcodeScanner.pause();

        playBeep();
        // ubah teks qr kembali menjadi object js
        const dataPesanan = JSON.parse(decodeText);

        dataPesananScanned = dataPesanan;

        // tampilkan info
        document.getElementById('info-pesanan').innerHTML = `
          Status: <span style="color: #2e7d32; font-weight: bold;">Berhasil!!</span>
          Nama : <strong>${dataPesanan.nama}</strong>(Tipe: ${dataPesanan.tipe})
        `;

        // cetak isi table
        const tbody = document.getElementById('isi-tabel'); //"isi-tabel" bukan "isi-table"
        tbody.innerHTML = '';

        let hitungTotal = 0;

        for (const [nama, item] of Object.entries(dataPesanan.items)) {
          // Hitung subtotal
          const subtotal = item.harga * item.qty;
          hitungTotal += subtotal;


          const tr = document.createElement('tr');
          tr.innerHTML =`
              <td>${nama}</td>
              <td>${item.qty}</td>
              <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
          `;
          tbody.appendChild(tr);
        }
        
        // hitung pajak
        const pajak = hitungTotal * 0.11;
        // simpan ke variabel kalkulator utama
        totalTagihanScanned = hitungTotal + pajak;
        // masukan total tagihan kedalam kalkulator
        document.getElementById('total-tagihan').textContent = `Rp ${totalTagihanScanned.toLocaleString('id-ID')}`;
        // aktifkan kolom input uang
       const inputUang = document.getElementById('uang-diterima');
       inputUang.disabled = false;
       inputUang.focus();
       
      } catch(error) {
        alert("QR Code tidak dikenali atau bukan dari aplikasi pelanggan!!");
        html5QrcodeScanner.resume();
      }
    }
    // fungsi scanner end //
    
    
    // nyalakan kamera
    html5QrcodeScanner.render(onScanSuccess);
    // kalkulator uang kembalian
    const inputUang = document.getElementById('uang-diterima');
    const txtKembalian = document.getElementById('kembalian');
    const btnProses = document.getElementById('btn-proses');

    inputUang.addEventListener('input', () => {
      const uangKasir = parseInt(inputUang.value) || 0;
      const kembalian = uangKasir - totalTagihanScanned;

      if (kembalian >= 0 && uangKasir > 0) {
        // uang cukup
        txtKembalian.textContent = `Rp ${kembalian.toLocaleString('id-ID')}`;
        txtKembalian.style.color = "#2e7d32";
        btnProses.disabled = false;
      } else {
        // uang kurang
        txtKembalian.textContent = "Uang Kurang!";
        txtKembalian.style.color = "#d32f2f";
        btnProses.disabled = true;
      }
    });

    // proses penyelesaian
    btnProses.addEventListener('click', () => {
      // matikan tombol sementara
      btnProses.disabled = true;
      btnProses.textContent = "Menyimpan ke Database...";

      // preparation data
      const payload = {
        nama: dataPesananScanned.nama || "Walk-In",
        tipe: dataPesananScanned.tipe,
        items: dataPesananScanned.items,
        total: totalTagihanScanned
      };

      // lempar ke python pastinya pake fetch
      fetch('http://127.0.0.1:5000/api/pesanan', {
        method: 'POST',
        headers: { 'Content-type': 'application/json'},
        body: JSON.stringify(payload) //disini juga cuk harusnya "body" => "bpdi"
      })
      .then(response => response.json())
      .then(data => {
        if(data.status === "sukses") {
          // ubah page pelanggan
          localStorage.setItem('statusPembayaran', 'Lunas'); //harusnya "setItem" => "setitem"
          alert("Pesanan Cash Berhasil Masuk Database!");
          window.location.reload();
        } else {
          alert("Gagal: " + data.pesan);
          btnProses.disabled = false;
          btnProses.textcontent = "Selesaikan pesanan";
        }
      })
      .catch(error => {
        alert("Error: Server belum menyala !!")
        btnProses.disabled = false;
        btnProses.textContent = "Selesaikan Pesanan"
      })
    });
 });