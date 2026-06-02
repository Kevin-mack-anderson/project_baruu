from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import database
from datetime import datetime, timedelta
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# run cek table
database.init_db()

# data wkatu pesanan
KAMUS_WAKTU = {
     "Air Putih": 1,
     "Kopi Aren": 3,
     "Kopi Susu": 3,
     "Matcha Latte": 4,
     "Blue Lagon": 3,
     "Kentang Goreng": 6,
     "Roti Bakar": 5,
     "Mie Goreng": 8
}

# hitung estimasi
def hitung_estimasi_waktu(items):
     """untunk mengalikan qty dengan waktu"""
     total_waktu = 0
     for nama_menu, detail in items.items():
          qty = detail['qty']
       #     serch time di kamus
          waktu_per_item = KAMUS_WAKTU.get(nama_menu, 3)
          total_waktu += (waktu_per_item * qty)
     return total_waktu ##Return diluar loop for

#         API ROUTE
@app.route('/', methods=['GET'])
def home():
      return "Server telah menyala"

@app.route('/api/pesanan', methods=['POST'])
def simpan_pesanan():
      try:
            data = request.json
            ## DATA JSON YANG ADA DI JS
            nama = data.get('nama', 'Tanpa Nama')
            tipe = data.get('tipe')
            items = data.get('items')
            detail = json.dumps(data.get('items'))
            total = data.get('total')
            waktu_ambil = data.get('waktu_ambil') ##Catch data jadwal

            ##SETELAH DIAMBIL, PYTHON MENGECEK KE KAMUS SEBAGAI SJF TAHAP AWAL
            estimasi = hitung_estimasi_waktu(items)

            # call fungsi simpan_transaksi from db
            database.simpan_transaksi(nama, tipe, detail, total, estimasi, waktu_ambil)
            return jsonify({
                  "status": "sukses",
                  "pesan": f"Pesanan berhasil masuk database! dengan estimasi : ${estimasi} menit"
            })
      except Exception as e:
            return jsonify({"status": "error", "pesan": str(e)}), 400

@app.route('/api/transaksi/hari-ini', methods=['GET'])
def total_hari_ini():
      try:
        # call fungsi hitung_hari_ini from db
        jumlah, pendapatan = database.hitung_hari_ini()

        return jsonify({
             "status": "sukses",
             "jumlah": jumlah,
             "pendapatan": pendapatan
        }), 200
      except Exception as e:
           print((f"TERJADI ERROR DI DATABASE: {e}"))
           return jsonify({
              "status": "error",
              "pesan": str(e)
        }), 400
      
# Dapatkan Antrean Terurut
def dapatkan_antrean_terurut():
            data_antrean = database.get_antrean_sjf()
            antrean_aktif = []
            waktu_sekarang = datetime.now()
     
            for pesanan in data_antrean:
                 if pesanan['tipe_pesanan'] == 'Jadwal' and pesanan['waktu_ambil']:
                   try:
                  #Logic filtering start
                   #input jam html diganbungkan dengan tanggal hari ini
                    jam_ambil = datetime.strptime(pesanan['waktu_ambil'], "%H:%M").time()    
                    waktu_ambil_obj = datetime.strptime(pesanan['waktu_ambil'], "%Y-%m-%d %H:%M")
                   #Syarat: tampilkan jika  waktu sudah masuk batas 15 menit
                    batas_mulai = waktu_ambil_obj - timedelta(minutes=15)
                   
                    if waktu_sekarang >= batas_mulai:
                         antrean_aktif.append(pesanan)
                   except Exception:
                          antrean_aktif.append(pesanan)
                        #     Walk-in dan ojol langsung masuk
                 else:
                        antrean_aktif.append(pesanan)
            # LOGIKA AGGING (Penuaan)
            for pesanan in antrean_aktif:
                  # tarik data mentah
                  waktu_mentah = pesanan['waktu_dibuat']
                  print(f"DEBUG BENTUK WAKTU: {waktu_mentah}")
                  try:
                        # menggambil 19 karakter saja dari db
                        waktu_bersih = str(waktu_mentah)[:19]
                        waktu_dibuat_obj = datetime.strptime(waktu_bersih, "%Y-%m-%d %H:%M:%S")
                  except Exception as e:
                        print(f"GAGAL BACA WAKTU: {e}")
                        waktu_dibuat_obj = waktu_sekarang
                         # hitung selisih waktu
                  
                  selisih = waktu_sekarang - waktu_dibuat_obj
                  detik_menunggu = int(selisih.total_seconds())
                  # ubah batasnya jika >30 detik naikan prioritasnya
                  print(f"Pesanan #{pesanan['id_transaksi']} - {pesanan['nama_pelanggan']} sudah menunggu: {detik_menunggu} detik")
                  pesanan['tingkat_prioritas'] = 0 if detik_menunggu >= 30 else 1

            # dengan lambda sebagai kriteria greedy nya
            # urutkan list berdasarkan 'estimasi_waktu'
            # jika waktunya sama maka urutkan dari siapa yang order trlebih dahulu
            # Eksekusi SJF
            antrean_aktif.sort(key=lambda p: (p['tingkat_prioritas'], p['estimasi_waktu'], p['id_transaksi']))
            return antrean_aktif
# API untuk melihat antrian
@app.route('/api/antrean/sjf', methods=['GET'])
def antrean_sjf():
     try:
            antrean_aktif = dapatkan_antrean_terurut()
            return jsonify({
                  "status": "sukses",
                  "total_antrean": len(antrean_aktif),
                  "data": antrean_aktif
            }), 200
     except Exception as e:
      print(f"TERJADI ERROR SJF:  {e}")
      return jsonify({"status": "error", "pesan": str(e)}), 400


# API Penyelesaian pesanan
@app.route('/api/pesanan/<int:id_transaksi>/selesai', methods=['PUT'])
def selesaikan_pesanan_barista(id_transaksi):
      try:
            database.update_status_selesai(id_transaksi)

            return jsonify({
                  "status": "sukses",
                  "pesan": f"Pesanan #{id_transaksi} berhasil diselesaikan!"
            }), 200
      except Exception as e:
            print(f"TERJADI ERROR UPDATE: {e}")
            return jsonify({"status": "error", "pesan": str(e)}), 400     

# Thread barista#
def pekerja_barista_virtual():
     print("[SISTEM] Barista virtual siap mengeksekusi pesanan!")
     while True:
          try:
               antrean = dapatkan_antrean_terurut()

               if antrean:
                  #   ambil pesanan pringkat 1
                  pesanan_diproses = antrean[0]
                  id_transaksi = pesanan_diproses['id_transaksi']
                  waktu_proses = pesanan_diproses['estimasi_waktu']
                  nama = pesanan_diproses['nama_pelanggan']

                  print(f"[Barista] Membuat pesanan #{id_transaksi} ({nama}). Butuh {waktu_proses} detik")
                  #  henitkan aktivitas thread ini sementara
                  time.sleep(waktu_proses)

                  # selesaikan pesanan secara otomatis
                  database.update_status_selesai(id_transaksi)
                  print(f"[Barista] Pesanan #{id_transaksi} Selesai")
                  # setiap 2 detik cek pesanan
               else:
                    time.sleep(2)
            
          except Exception as e:
               print((f"Threading ERROR: {e}"))
               time.sleep(2)
     
if __name__ == '__main__':
     thread_barista = threading.Thread(target=pekerja_barista_virtual, daemon=True)
     thread_barista.start()
     app.run(debug=True, port=5000, use_reloader=False)
