from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import database

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
          return total_waktu

#         API ROUTE
@app.route('/', methods=['GET'])
def home():
      return "Server telah menyala"

@app.route('/api/pesanan', methods=['POST'])
def simpan_pesanan():
      try:
            data = request.json

            nama = data.get('nama', 'Tanpa Nama')
            tipe = data.get('tipe')
            items = data.get('items')
            detail = json.dumps(data.get('items'))
            total = data.get('total')

            estimasi = hitung_estimasi_waktu(items)

            # call fungsi simpan_transaksi from db
            database.simpan_transaksi(nama, tipe, detail, total, estimasi)
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
      
# API untuk melihat antrian
@app.route('/api/antrean/sjf', methods=['GET'])
def antrean_sjf():
     try:
            #     call fungsi logika sorting greedy/sjf
            data_antrean = database.get_antrean_sjf()

            # Eksekusi SJF
            # dengan lambda sebagai kriteria greedy nya
            # urutkan list berdasarkan 'estimasi_waktu'
            # jika waktunya sama maka urutkan dari siapa yang order trlebih dahulu
            data_antrean.sort(key=lambda pesanan: (pesanan['estimasi_waktu'], pesanan['id_transaksi']))

            return jsonify({
                  "status": "sukses",
                  "total_antrean": len(data_antrean),
                  "data": data_antrean
            }), 200
     except Exception as e:
      print(f"TERJADI ERROR SJF:  {e}")
      return jsonify({"status": "error", "pesan": str(e)}), 400
     
     
if __name__ == '__main__':
     app.run(debug=True, port=5000)
