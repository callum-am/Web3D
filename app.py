import sqlite3
from flask import Flask, jsonify, send_from_directory, Response
import xml.etree.ElementTree as ET

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('gallery.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/index.html')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/products.html')
def products():
    return send_from_directory('.', 'products.html')

@app.route('/can-toss.html')
def cantoss():
    return send_from_directory('.', 'can-toss.html')

@app.route('/about.html')
def about():
    return send_from_directory('.', 'about.html')

@app.route('/scripts.js')
def scripts():
    return send_from_directory('.', 'scripts.js')

@app.route('/game.js')
def game():
    return send_from_directory('.', 'game.js')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/three-viewer.js')
def three_viewer():
    return send_from_directory('.', 'three-viewer.js')

@app.route('/images/<path:filename>')
def images(filename):
    return send_from_directory('images', filename)

@app.route('/models/<path:filename>')
def models(filename):
    return send_from_directory('models', filename)

@app.route('/audio/<path:filename>')
def audio(filename):
    return send_from_directory('audio', filename)

@app.route('/gallery-panels')
def gallery_panels():
    conn = get_db_connection()
    panels = conn.execute('SELECT * FROM gallery_panels ORDER BY id LIMIT 3').fetchall()
    conn.close()
    return jsonify([dict(panel) for panel in panels])

@app.route('/download/gallery.json')
def download_gallery_json():
    conn = get_db_connection()
    panels = conn.execute('SELECT * FROM gallery_panels ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(panel) for panel in panels])

@app.route('/download/gallery.xml')
def download_gallery_xml():
    conn = get_db_connection()
    panels = conn.execute('SELECT * FROM gallery_panels ORDER BY id').fetchall()
    conn.close()
    root = ET.Element('gallery')
    for panel in panels:
        panel_elem = ET.SubElement(root, 'panel')
        for key in panel.keys():
            child = ET.SubElement(panel_elem, key)
            child.text = str(panel[key])
    xml_str = ET.tostring(root, encoding='utf-8', method='xml')
    return Response(xml_str, mimetype='application/xml', headers={
        "Content-Disposition": "attachment; filename=gallery.xml"
    })

if __name__ == '__main__':
    app.run(debug=True)
