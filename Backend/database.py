import sqlite3

# nama file Db
DB_NAME = 'kopi_v2.db'

def init_db():
      """fungsi ini akan membuat database dan table jika belum ada"""
      # open koneksi ke db
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()

      # perintah sql untuk buat table riwayat_transaksi
      cursor.execute('''
          CREATE TABLE IF NOT EXISTS riwayat_transaksi (
              id_transaksi INTEGER PRIMARY KEY AUTOINCREMENT,
              nama_pelanggan TEXT NOT NULL,
              tipe_pesanan TEXT NOT NULL,
              detail_menu TEXT NOT NULL,
              total_harga INTEGER NOT NULL,
              estimasi_waktu INTEGER NOT NULL,
              waktu_ambil DATETIME, --TAMBAHAN RUANG BARU
              waktu_dibuat DATETIME DEFAULT CURRENT_TIMESTAMP,     
              status TEXT NOT NULL          
          )
      ''')
      # simpan perubahan and tutup koneksinya
      conn.commit()
      conn.close()
      print("Database SQLite 'kopi.db' dan table berhasil disiapkan")

# fungsi simpan transaksi
def simpan_transaksi(nama, tipe, detail, total, estimasi_waktu, waktu_ambil, status='Selesai/Lunas'):
      """fungsi menyimpan datapesanan baru ke table"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute('''
        INSERT INTO riwayat_transaksi (nama_pelanggan, tipe_pesanan, detail_menu, total_harga, estimasi_waktu, waktu_ambil, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      ''', (nama, tipe, detail, total, estimasi_waktu, waktu_ambil, status)) ##inget, tutup kurungnya ada dua, tadi error disini
      conn.commit()
      conn.close()

# fungsi Antrean
def get_antrean_sjf():
      """Mengambil pesanan yang belum dibuat dengan mengurutkan menggunakan SJF"""
      conn = sqlite3.connect(DB_NAME)
      # agar bentuknya rapih seperti dict
      conn.row_factory = sqlite3.Row
      cursor = conn.cursor()

      # Logic sjf
      cursor.execute('''
            SELECT * FROM riwayat_transaksi
            WHERE status = 'Selesai/Lunas'
      ''')

      hasil = cursor.fetchall()
      conn.close()

      # wrap kedalam bentuk list
      antrean_mentah = [dict(row) for row in hasil]
      return antrean_mentah
# antrean end

# fungsi totalan hari ini
def hitung_hari_ini():
      """fungsi untuk menghitung jumlah transaksi dan pendapatan hari ini"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute('''
        SELECT COUNT(*), SUM(total_harga)
        FROM riwayat_transaksi
        WHERE date(waktu_dibuat, 'localtime') = date('now', 'localtime')
      ''')
      hasil = cursor.fetchone()
      conn.close()

      # memastikan nilai angka masihn 0 jika kosong
      jumlah_transaksi = hasil[0] if hasil[0] else 0
      total_pendapatan = hasil[1] if hasil[1] else 0

      return jumlah_transaksi, total_pendapatan
