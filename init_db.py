import sqlite3

conn = sqlite3.connect('gallery.db')
c = conn.cursor()
c.execute('''
CREATE TABLE IF NOT EXISTS gallery_panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    image TEXT NOT NULL,
    button TEXT NOT NULL,
    link TEXT NOT NULL
)
''')
c.execute('DELETE FROM gallery_panels')
c.executemany('''
INSERT INTO gallery_panels (title, text, image, button, link) VALUES (?, ?, ?, ?, ?)
''', [
    ('Coca Cola', 'A fragrant, caramel-coloured liquid, mixed with carbonated water. You know Coca Cola, as good as it has always been.', 'images/Panel1.png', 'Learn More', '#'),
    ('Dr. Pepper', 'Dr Pepper\'s unique, sparkling blend of 23 fruit flavours has been around for well over a century and it\'s still the same, with that distinctive flavour you just can\'t quite put your tongue on.', 'images/Panel2.png', 'Learn More', '#'),
    ('Glass Coca Cola', 'Your same favourite drink, in its classical glass packaging. Now and always, recyclable.', 'images/Panel3.png', 'Learn More', '#')
])
conn.commit()
conn.close()
