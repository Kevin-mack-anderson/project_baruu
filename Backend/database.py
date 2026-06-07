import sqlite3
from datetime import datetime
import os 

# NEW
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
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
              waktu_ambil DATETIME,
              waktu_dibuat DATETIME DEFAULT (datetime('now', 'localtime')),     
              status TEXT NOT NULL          
          )
      ''')

      # NEEWW
      cursor.execute('''
          CREATE TABLE IF NOT EXISTS stok_menu (
              nama_menu TEXT PRIMARY KEY,
              tersedia BOOLEAN NOT NULL DEFAULT 1
          )
      ''')

      # isi table otomatis jika masih kosonbg
      cursor.execute("SELECT COUNT(*) FROM stok_menu")
      if cursor.fetchone()[0] == 0:
            menu_awal = ["Air Putih", "Kopi Aren", "Kopi Susu", "Matcha Latte", "Blue Lagoon", "Kentang Goreng", "Roti Bakar", "Mie Goreng"]
            for m in menu_awal:
                  cursor.execute("INSERT INTO stok_menu (nama_menu, tersedia) VALUES (?, 1)", (m,))
      # /////
      # simpan perubahan and tutup koneksinya
      conn.commit()
      conn.close()
      print("Database SQLite 'kopi.db' dan table berhasil disiapkan")

# fungsi simpan transaksi
def simpan_transaksi(nama, tipe, detail, total, estimasi_waktu, waktu_ambil, status='Selesai/Lunas'):
      """fungsi menyimpan datapesanan baru ke table"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      
      waktu_dibuat_python = datetime.now().strftime("%Y-%m-%d %H:%S")

      cursor.execute('''
        INSERT INTO riwayat_transaksi (nama_pelanggan, tipe_pesanan, detail_menu, total_harga, estimasi_waktu, waktu_ambil, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      ''', (nama, tipe, detail, total, estimasi_waktu, waktu_ambil, status)) ##inget, tutup kurungnya ada dua, tadi error disini
      conn.commit()
      # catch id transaksi
      last_id = cursor.lastrowid ##NEWW
      conn.close() #NEWW
      return last_id #NEWW

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

# Update status selesai di visual
def update_status_selesai(id_transaksi):
      """"Mengubah status pesanan menjadi selesai agar hilang di visual"""
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()

      # perintah update
      cursor.execute('''
            UPDATE riwayat_transaksi
            SET status = 'Siap Diambil'
            WHERE id_transaksi = ?
      ''', (id_transaksi,))
      conn.commit()
      conn.close
# Visual selesai

# NEW//////
# update status diambil
def update_status_diambil(id_transaksi):
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute("UPDATE riwayat_transaksi SET status = 'Sudah Diambil' WHERE id_transaksi = ?", (id_transaksi,))
      conn.commit()
      conn.close()

def get_pesanan_siap_diambil():
      conn = sqlite3.connect(DB_NAME)
      conn.row_factory = sqlite3.Row
      cursor = conn.cursor()
      cursor.execute("SELECT * FROM riwayat_transaksi WHERE status = 'Siap Diambil'")
      hasil = cursor.fetchall()
      conn.close()
      return [dict(row) for row in hasil]

# Riwayat
def get_riwayat_by_ids(list_ids):
      if not list_ids: return []
      conn = sqlite3.connect(DB_NAME)
      conn.row_factory = sqlite3.Row
      cursor = conn.cursor()
      placeholders = ','.join('?' for _ in list_ids)
      cursor.execute(f"SELECT id_transaksi, nama_pelanggan, tipe_pesanan, status FROM riwayat_transaksi WHERE id_transaksi IN ({placeholders}) ORDER BY id_transaksi DESC", list_ids)
      hasil = cursor.fetchall()
      conn.close()
      return [dict(row) for row in hasil]
# //////////

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

# NEWW
def get_semua_stok():
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      cursor.execute("SELECT nama_menu, tersedia FROM stok_menu")
      hasil = cursor.fetchall()
      conn.close()
      # ubah ke bentuk dict
      return {row[0]: bool(row[1]) for row in hasil}

def update_stok_menu(stok_dict):
      conn = sqlite3.connect(DB_NAME)
      cursor = conn.cursor()
      for menu, tersedia in stok_dict.items():
            status = 1 if tersedia else 0
            cursor.execute("UPDATE stok_menu SET tersedia = ? WHERE nama_menu = ?", (status, menu))
      conn.commit()
      conn.close()

