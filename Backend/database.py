import sqlite3

# nama file Db
DB_NAME = 'kopi.db'

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
              waktu_dibuat DATETIME DEAFULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL          
          )
      ''')
      # simpan perubahan and tutup koneksinya
      conn.commit()
      conn.close()
      print("Database SQLite 'kopi.db' dan table berhasil disiapkan")

# fungsi simpan transaksi
def simpan_transaksi(nama, tipe, detail, total, status='Selesai/Lunas'):
      """fungsi menyimpan datapesanan baru ke table"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute('''
        INSERT INTO riwayat_transaksi (nama_pelanggan, tipe_pesanan, detail_menu, total_harga, status)
        VALUES (?, ?, ?, ?, ?)
      '''), (nama, tipe, detail, total, status)
      conn.commit()
      conn.close()

# fungsi totalan hari ini
def hitung_hari_ini():
      """fungsi untuk menghitung jumlah transaksi dan pendapatan hari ini"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute('''
        SELECT COUNT(*), SUM(total_harga)
        FROM riwayat_transaksi
        WHERE date(waktu_dibuat) = date('now')
      ''')
      hasil = cursor.fetchone()
      conn.close()

      # memastikan nilai angka masihn 0 jika kosong
      jumlah_transaksi = hasil[0] if hasil[0] else 0
      total_pendapatan = hasil[1] if hasil[1] else 0

      return jumlah_transaksi, total_pendapatan
