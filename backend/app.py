from flask import Flask, jsonify
import os
from dotenv import load_dotenv
from config import get_db       

load_dotenv()   # loads .env if present

app = Flask(__name__)

@app.route('/api/ping')
def ping():
    return jsonify({"msg": "pong"})

@app.route('/api/db-test')
def db_test():
    db = get_db()
    # list collections as a simple test
    colls = db.list_collection_names()
    return jsonify({"collections": colls})

if __name__ == '__main__':
    app.run(debug=True)
