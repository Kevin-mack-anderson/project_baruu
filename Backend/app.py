from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import database

app = Flask(__name__)
CORS(app)

# run cek table
database.init_db()

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
            detail = json.dumps(data.get('items'))
            total = data.get('total')

            # call fungsi simpan_transaksi from db
            database.simpan_transaksi(nama, tipe, detail, total)
            return jsonify({
                  "status": "sukses",
                  "pesan": "Pesanan berhasil masuk database!"
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
           return jsonify({
              "status": "error",
              "pesan": str(e)
        }), 400
      
if __name__ == '__main__':
     app.run(debug=True, port=5000)