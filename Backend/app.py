from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import database
from datetime import datetime, timedelta
from datetime import datetime
import threading
import time
#////BARUU
import pyttsx3
import queue
import subprocess
#////

app = Flask(__name__)

#BARU///
# antrean suara
antrean_suara = queue.Queue()
CORS(app)
#///////

# run cek table
database.init_db()

# data wkatu pesanan
KAMUS_WAKTU = {
     "Air Putih": 10,
     "Kopi Aren": 13,
     "Kopi Susu": 23,
     "Matcha Latte": 14,
     "Blue Lagon": 13,
     "Kentang Goreng": 26,
     "Roti Bakar": 15,
     "Mie Goreng": 18
}


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
            id_baru = database.simpan_transaksi(nama, tipe, detail, total, estimasi, waktu_ambil)
            return jsonify({
                  "status": "sukses",
                  "pesan": f"Pesanan berhasil masuk database! dengan estimasi : ${estimasi} menit",
                  "id_transaksi": id_baru            
                  })
      except Exception as e:
            return jsonify({"status": "error", "pesan": str(e)}), 400

# hitung estimasi
def hitung_estimasi_waktu(items):
     """untunk mengalikan qty dengan waktu"""
     total_waktu = 0
     for nama_menu, detail in items.items(): ##DARI QR 
          qty = detail['qty']
       #     serch time di kamus
          waktu_per_item = KAMUS_WAKTU.get(nama_menu, 3)
          total_waktu += (waktu_per_item * qty)
     return total_waktu ##Return diluar loop for
     
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
                    waktu_ambil_obj = datetime.combine(waktu_sekarang.date(), jam_ambil)
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

            pesanan_tertua = None
            waktu_tunggu_terlama = -1

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

                  # simpan waktu tunggu\
                  pesanan['detik_menunggu'] = detik_menunggu
                  pesanan['tingkat_prioritas'] = 1

                  # cari yang paling tua
                  if detik_menunggu > waktu_tunggu_terlama:
                       waktu_tunggu_terlama = detik_menunggu
                       pesanan_tertua = pesanan

            if pesanan_tertua and waktu_tunggu_terlama >= 30:
                  # ubah batasnya jika >30 detik naikan prioritasnya
                  pesanan_tertua['tingkat_prioritas'] = 0

                  print(f"Pesanan #{pesanan['id_transaksi']} - {pesanan['nama_pelanggan']} sudah menunggu: {detik_menunggu} detik")
                 

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

# ///Fungsi Baru: Riwayat pelanggan
@app.route('/api/riwayat', methods=['POST'])
def riwayat_pelanggan():
    try:
        # Menangkap Array ID dari localStorage HP Pelanggan
        ids = request.json.get('ids', [])
        data_riwayat = database.get_riwayat_by_ids(ids)
        
        return jsonify({
            "status": "sukses", 
            "data": data_riwayat
        }), 200
    except Exception as e:
        print(f"Error Riwayat: {e}")
        return jsonify({"status": "error", "pesan": str(e)}), 400
    
# API BARU: BACA DAN UBAH STOK
@app.route('/api/stok', methods=['GET'])
def get_stok():
    return jsonify({"status": "sukses", "data": database.get_semua_stok()})

@app.route('/api/stok', methods=['PUT'])
def update_stok():
    try:
        data = request.json
        database.update_stok_menu(data)
        return jsonify({"status": "sukses", "pesan": "Stok berhasil diupdate di Database!"})
    except Exception as e:
        return jsonify({"status": "error", "pesan": str(e)}), 400
# ////

# API Penyelesaian pesanan
@app.route('/api/pesanan/<int:id_transaksi>/selesai', methods=['PUT'])
def selesaikan_pesanan_barista(id_transaksi):
     try:
            #cari nama pelanggan sebleum dihapuss
            antrean = dapatkan_antrean_terurut()
            nama_pelanggan = "pelanggan"
            for p in antrean:
                 if p['id_transaksi'] == id_transaksi:
                      nama_pelanggan = p['nama_pelanggan']
                      break
            # Hapus pesanan dari Db
            database.update_status_selesai(id_transaksi)
            # Masukan teks panggilan
            #///BARU
            teks = f"Pesanan nomor: {id_transaksi}atas nama {nama_pelanggan} silahkan diambil" 
            antrean_suara.put(teks)

            return jsonify({
                 "status": "sukses",
                 "pesan": f"Pesanan #{id_transaksi} Berhasil Diselesaikan"
            }), 200
     except Exception as e:
          print(f"Terjadi Error Update: {e}")
          return jsonify({"status": "error", "pesan": str(e)}), 400

# ///Fungsi Baru: Antrean siap
@app.route('/api/pesanan/siap', methods=['GET'])
def antrean_siap():
    return jsonify({"status": "sukses", "data": database.get_pesanan_siap_diambil()})

# Fungsi Baru: Konirmasi Staff
@app.route('/api/pesanan/<int:id_transaksi>/diambil', methods=['PUT'])
def pesanan_diambil_staff(id_transaksi):
    database.update_status_diambil(id_transaksi)
    return jsonify({"status": "sukses", "pesan": "Pesanan Selesai Sepenuhnya!"})
#////////////

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

                  # Kirim suara
                  teks = f"Pesanan nomer {id_transaksi}, atas nama  {nama} silahkan diambil di meja kasir"
                  antrean_suara.put(teks)
                  # setiap 2 detik cek pesanan
               else:
                    time.sleep(2)
            
          except Exception as e:
               print((f"Threading ERROR: {e}"))
               time.sleep(2)

#/////BARU?//////
def pekerja_speaker_virtual():
    print("[SISTEM] Speaker Panggilan telah aktif di latar belakang!")
#     pythoncom.CoInitialize()
    mesin_suara = pyttsx3.init()
    # (Opsional) Mengatur kecepatan bicara agar terdengar natural
    mesin_suara.setProperty('rate', 150) 
    
    while True:
        # get() akan membuat thread ini "tertidur" sampai ada teks masuk di pipa
        teks = antrean_suara.get() 
        if teks:
            print(f"[SPEAKER] Memanggil: {teks}")
            try:
                 script_suara = f"import pyttsx3; import sys; mesin = pyttsx3.init(); mesin.setProperty('rate', 150); mesin.say('{teks}'); mesin.runAndWait()"

                 subprocess.run(["python", "-c", script_suara, teks])
            except Exception as e:
                 print(f"Error Suara {e}")
waktu_terakhir_dipanggil = {}

# Fungsi Baru: Untuk cek lama waktu pesanan belum diambil
def pekerja_pengigat_cerewet():
     print("[SISTEM] Satpam Pengingat Makanan AKTIF!")
     while True:
        try:
            pesanan_siap = database.get_pesanan_siap_diambil()
            sekarang = time.time()
            for p in pesanan_siap:
                pid, nama = p['id_transaksi'], p['nama_pelanggan']
                # Panggil jika belum pernah dipanggil, ATAU sudah lewat 30 detik dari panggilan terakhir
                if pid not in waktu_terakhir_dipanggil or (sekarang - waktu_terakhir_dipanggil[pid]) >= 100:
                    teks = f"Panggilan. Pesanan nomor {pid}, atas nama {nama}, silakan segera diambil di meja penyerahan."
                    antrean_suara.put(teks)
                    waktu_terakhir_dipanggil[pid] = sekarang
        except Exception as e:
            pass
        time.sleep(5) # Cek lemari makanan tiap 5 detik
#///////////

if __name__ == '__main__':
     thread_barista = threading.Thread(target=pekerja_barista_virtual, daemon=True)
     thread_barista.start()

     thread_speaker = threading.Thread(target=pekerja_speaker_virtual, daemon=True)
     thread_speaker.start()

#/////baru
     thread_pengingat = threading.Thread(target=pekerja_pengigat_cerewet, daemon=True)
     thread_pengingat.start()
#//////
     app.run(debug=True, port=5000, use_reloader=False)
