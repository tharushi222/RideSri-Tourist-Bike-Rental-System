import mysql.connector
from werkzeug.security import generate_password_hash

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="ridesri_db"
)

cursor = db.cursor()

new_hash = generate_password_hash("Ad@123")

cursor.execute(
    "UPDATE users SET password=%s WHERE email=%s AND role=%s",
    (new_hash, "admin@ridesri.com", "admin")
)

db.commit()

print("Updated rows:", cursor.rowcount)

cursor.close()
db.close()