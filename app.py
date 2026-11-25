
from flask import Flask, render_template, request, jsonify, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "ridesri-development-secret-change-this"


def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="ridesri_db"
    )


def owner_required():
    return session.get("role") == "owner"


# HOME
@app.route("/")
def home():
    return render_template("index.html")


# REGISTRATION
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "tourist")

    if not name or not email or not password:
        return jsonify(success=False, message="Please fill in all fields."), 400

    if len(password) < 6:
        return jsonify(success=False, message="Password must contain at least 6 characters."), 400

    if role not in ["tourist", "owner"]:
        return jsonify(success=False, message="Invalid account type."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify(success=False, message="Email already registered."), 409

        hashed_password = generate_password_hash(password)

        cursor.execute(
            """INSERT INTO users (name, email, password, role)
               VALUES (%s, %s, %s, %s)""",
            (name, email, hashed_password, role)
        )

        db.commit()
        user_id = cursor.lastrowid

        session["user_id"] = user_id
        session["name"] = name
        session["email"] = email
        session["role"] = role

        return jsonify({
            "success": True,
            "message": "Registration successful!",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role
            }
        }), 201

    except mysql.connector.Error as e:
        if db:
            db.rollback()
        print("Registration Error:", repr(e), flush=True)
        return jsonify(success=False, message="Database error. Please try again."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# LOGIN
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify(success=False, message="Enter email and password."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )

        user_data = cursor.fetchone()
        

        if not user_data or not check_password_hash(
            user_data["password"], password
        ):
            return jsonify(success=False, message="Invalid email or password."), 401

        session["user_id"] = user_data["user_id"]
        session["name"] = user_data["name"]
        session["email"] = user_data["email"]
        session["role"] = user_data["role"]

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": user_data["user_id"],
                "name": user_data["name"],
                "email": user_data["email"],
                "role": user_data["role"]
            }
        })

    except mysql.connector.Error as e:
        print("Login Error:", repr(e), flush=True)
        return jsonify(success=False, message="Login failed. Please try again."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# LOGOUT
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify(success=True, message="Logged out successfully.")


# GET ALL AVAILABLE BIKES
@app.route("/api/bikes", methods=["GET"])
def get_bikes():
    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT bike_id, owner_id, model, bike_type, location,
                   price_per_day, description, image_url, availability
            FROM bikes
            WHERE availability = 'available'
            ORDER BY bike_id DESC
        """)

        return jsonify({"success": True, "bikes": cursor.fetchall()})

    except mysql.connector.Error as e:
        print("Bike Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not load bikes."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# OWNER: VIEW OWN BIKES
@app.route("/api/owner/bikes", methods=["GET"])
def owner_bikes():
    if not owner_required():
        return jsonify(success=False, message="Owner login required."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM bikes
            WHERE owner_id = %s
            ORDER BY bike_id DESC
        """, (session["user_id"],))

        return jsonify({"success": True, "bikes": cursor.fetchall()})

    except mysql.connector.Error as e:
        print("Owner Bike Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not load your bikes."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# OWNER: ADD BIKE
@app.route("/api/owner/bikes", methods=["POST"])
def add_bike():
    if not owner_required():
        return jsonify(success=False, message="Owner login required."), 403

    data = request.get_json() or {}

    model = data.get("model", "").strip()
    bike_type = data.get("bike_type", "").strip()
    location = data.get("location", "").strip()
    description = data.get("description", "").strip()
    image_url = data.get("image_url", "").strip()

    try:
        price = float(data.get("price_per_day", 0))
    except (ValueError, TypeError):
        return jsonify(success=False, message="Invalid bike price."), 400

    if not model or not bike_type or not location or price <= 0:
        return jsonify(success=False, message="Please enter all required bike details."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO bikes
            (owner_id, model, bike_type, location, price_per_day,
             description, image_url, availability)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'available')
        """, (
            session["user_id"], model, bike_type, location,
            price, description, image_url
        ))

        db.commit()

        return jsonify(
            success=True,
            message="Bike added successfully!",
            bike_id=cursor.lastrowid
        ), 201

    except mysql.connector.Error as e:
        if db:
            db.rollback()
        print("Add Bike Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not add bike."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# OWNER: EDIT BIKE
@app.route("/api/owner/bikes/<int:bike_id>", methods=["PUT"])
def edit_bike(bike_id):
    if not owner_required():
        return jsonify(success=False, message="Owner login required."), 403

    data = request.get_json() or {}

    model = data.get("model", "").strip()
    bike_type = data.get("bike_type", "").strip()
    location = data.get("location", "").strip()
    description = data.get("description", "").strip()
    image_url = data.get("image_url", "").strip()

    try:
        price = float(data.get("price_per_day", 0))
    except (ValueError, TypeError):
        return jsonify(success=False, message="Invalid price."), 400

    if not model or not bike_type or not location or price <= 0:
        return jsonify(success=False, message="Invalid bike details."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE bikes
            SET model=%s, bike_type=%s, location=%s,
                price_per_day=%s, description=%s, image_url=%s
            WHERE bike_id=%s AND owner_id=%s
        """, (
            model, bike_type, location, price,
            description, image_url, bike_id, session["user_id"]
        ))

        db.commit()

        if cursor.rowcount == 0:
            return jsonify(success=False, message="Bike not found or not yours."), 404

        return jsonify(success=True, message="Bike updated successfully!")

    except mysql.connector.Error as e:
        if db:
            db.rollback()
        print("Edit Bike Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not update bike."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# OWNER: DELETE BIKE
@app.route("/api/owner/bikes/<int:bike_id>", methods=["DELETE"])
def delete_bike(bike_id):
    if not owner_required():
        return jsonify(success=False, message="Owner login required."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM bikes
            WHERE bike_id=%s AND owner_id=%s
        """, (bike_id, session["user_id"]))

        db.commit()

        if cursor.rowcount == 0:
            return jsonify(success=False, message="Bike not found or not yours."), 404

        return jsonify(success=True, message="Bike deleted successfully!")

    except mysql.connector.Error as e:
        if db:
            db.rollback()
        print("Delete Bike Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not delete bike."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

# ADMIN: EDIT ANY BIKE
@app.route("/api/admin/bikes/<int:bike_id>", methods=["PUT"])
def admin_edit_bike(bike_id):

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "admin":
        return jsonify(success=False, message="Admin access only."), 403

    data = request.get_json() or {}

    model = data.get("model", "").strip()
    bike_type = data.get("bike_type", "").strip()
    location = data.get("location", "").strip()
    description = data.get("description", "").strip()
    image_url = data.get("image_url", "").strip()

    try:
        price = float(data.get("price_per_day", 0))
    except (ValueError, TypeError):
        return jsonify(success=False, message="Invalid price."), 400

    if not model or not bike_type or not location or price <= 0:
        return jsonify(success=False, message="Invalid bike details."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE bikes
            SET model=%s,
                bike_type=%s,
                location=%s,
                price_per_day=%s,
                description=%s,
                image_url=%s
            WHERE bike_id=%s
        """, (
            model, bike_type, location,
            price, description, image_url, bike_id
        ))

        db.commit()

        if cursor.rowcount == 0:
            return jsonify(success=False, message="Bike not found or no changes made."), 404

        return jsonify(success=True, message="Bike updated successfully!")

    except mysql.connector.Error as e:
        if db:
            db.rollback()

        print("Admin Edit Bike Error:", repr(e), flush=True)

        return jsonify(success=False, message="Could not update bike."), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


# ADMIN: DELETE ANY BIKE
@app.route("/api/admin/bikes/<int:bike_id>", methods=["DELETE"])
def admin_delete_bike(bike_id):

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "admin":
        return jsonify(success=False, message="Admin access only."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM bikes
            WHERE bike_id=%s
        """, (bike_id,))

        db.commit()

        if cursor.rowcount == 0:
            return jsonify(success=False, message="Bike not found."), 404

        return jsonify(
            success=True,
            message="Bike deleted successfully!"
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback()

        print("Admin Delete Bike Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not delete bike."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

# ADMIN: UPDATE BIKE AVAILABILITY
@app.route("/api/admin/bikes/<int:bike_id>/availability", methods=["PUT"])
def admin_update_bike_availability(bike_id):

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "admin":
        return jsonify(success=False, message="Admin access only."), 403

    data = request.get_json() or {}
    availability = data.get("availability")

    if availability not in ["available", "unavailable"]:
        return jsonify(success=False, message="Invalid availability status."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE bikes
            SET availability = %s
            WHERE bike_id = %s
        """, (availability, bike_id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT bike_id FROM bikes WHERE bike_id = %s",
                (bike_id,)
            )

            if not cursor.fetchone():
                return jsonify(success=False, message="Bike not found."), 404

        db.commit()

        return jsonify(
            success=True,
            message="Bike availability updated successfully!"
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback()

        print("Admin Availability Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not update bike availability."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Please login first."}), 401

    if session.get("role") != "tourist":
        return jsonify({"success": False, "message": "Only tourists can book bikes."}), 403

    data = request.get_json()

    bike_id = data.get("bike_id")
    pickup_date = data.get("pickup_date")
    return_date = data.get("return_date")
    total_amount = data.get("total_amount")

    if not all([bike_id, pickup_date, return_date, total_amount]):
        return jsonify({"success": False, "message": "Missing booking details."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT availability FROM bikes WHERE bike_id = %s",
            (bike_id,)
        )
        bike = cursor.fetchone()

        if not bike or bike[0] != "available":
            return jsonify({
                "success": False,
                "message": "This bike is not available."
            }), 400

        cursor.execute("""
            INSERT INTO bookings
            (tourist_id, bike_id, pickup_date, return_date, total_amount, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """, (
            session["user_id"],
            bike_id,
            pickup_date,
            return_date,
            total_amount
        ))

        booking_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "booking_id": booking_id,
            "message": "Booking saved successfully!"
        })

    except Exception as e:
        conn.rollback()
        print("Booking Error:", repr(e))
        return jsonify({
            "success": False,
            "message": "Database error while saving booking."
        }), 500

    finally:
        cursor.close()
        conn.close()
    
  

# PAYMENT: SAVE PAYMENT DETAILS
@app.route("/api/payments", methods=["POST"])
def create_payment():

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "tourist":
        return jsonify(success=False, message="Only tourists can make payments."), 403

    data = request.get_json() or {}

    booking_id = data.get("booking_id")
    payment_method = data.get("payment_method")

    if not booking_id or not payment_method:
        return jsonify(success=False, message="Missing payment details."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT booking_id, total_amount
            FROM bookings
            WHERE booking_id = %s AND tourist_id = %s
        """, (booking_id, session["user_id"]))

        booking = cursor.fetchone()

        if not booking:
            return jsonify(success=False, message="Booking not found."), 404

        cursor.execute("""
            SELECT payment_id FROM payments
            WHERE booking_id = %s
        """, (booking_id,))

        if cursor.fetchone():
            return jsonify(success=False, message="Payment already exists."), 409

        cursor.execute("""
            INSERT INTO payments
            (booking_id, amount, payment_method, payment_status)
            VALUES (%s, %s, %s, %s)
        """, (
            booking_id,
            booking["total_amount"],
            payment_method,
            "paid"
        ))

        payment_id = cursor.lastrowid

        cursor.execute("""
            UPDATE bookings
            SET status = 'confirmed'
            WHERE booking_id = %s
        """, (booking_id,))

        db.commit()

        return jsonify(
            success=True,
            payment_id=payment_id,
            booking_id=booking_id,
            message="Payment saved successfully!"
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback() 

        print("Payment Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not save payment."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()
   

# GET TOURIST BOOKINGS FROM DATABASE
@app.route("/api/my-bookings", methods=["GET"])
def get_my_bookings():

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "tourist":
        return jsonify(success=False, message="Tourist access only."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.booking_id,
                b.pickup_date,
                b.return_date,
                b.total_amount,
                b.status,
                bk.model,
                bk.image_url,
                bk.location,
                bk.bike_type,
                p.payment_method,
                p.payment_status
            FROM bookings b
            JOIN bikes bk ON b.bike_id = bk.bike_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            WHERE b.tourist_id = %s
            ORDER BY b.created_at DESC
        """, (session["user_id"],))

        my_bookings = cursor.fetchall()

        return jsonify(
            success=True,
            bookings=my_bookings
        )

    except mysql.connector.Error as e:
        print("Tourist Booking Error:", repr(e), flush=True)
        return jsonify(
            success=False,
            message="Could not load bookings."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


# TOURIST: CANCEL BOOKING
@app.route("/api/my-bookings/<int:booking_id>/cancel", methods=["PUT"])
def cancel_my_booking(booking_id):

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "tourist":
        return jsonify(success=False, message="Tourist access only."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            SELECT status
            FROM bookings
            WHERE booking_id = %s AND tourist_id = %s
        """, (booking_id, session["user_id"]))

        booking = cursor.fetchone()

        if not booking:
            return jsonify(success=False, message="Booking not found."), 404

        if booking[0] != "pending":
            return jsonify(
                success=False,
                message="Only pending bookings can be cancelled."
            ), 400

        cursor.execute("""
            UPDATE bookings
            SET status = 'cancelled'
            WHERE booking_id = %s AND tourist_id = %s
        """, (booking_id, session["user_id"]))

        db.commit()

        return jsonify(
            success=True,
            message="Booking cancelled successfully!"
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback()

        print("Cancel Booking Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not cancel booking."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

# GET RENTAL REQUESTS FOR BIKE OWNER
@app.route("/api/owner/requests", methods=["GET"])
def get_owner_requests():

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "owner":
        return jsonify(success=False, message="Owner access only."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.booking_id,
                b.pickup_date,
                b.return_date,
                b.total_amount,
                b.status,
                bk.model,
                bk.image_url,
                bk.location,
                u.name AS tourist_name,
                u.email AS tourist_email,
                p.payment_status
            FROM bookings b
            JOIN bikes bk ON b.bike_id = bk.bike_id
            JOIN users u ON b.tourist_id = u.user_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            WHERE bk.owner_id = %s
            ORDER BY b.created_at DESC
        """, (session["user_id"],))

        requests = cursor.fetchall()


        return jsonify(
            success=True,
            requests=requests
        )

    except mysql.connector.Error as e:
        print("Owner Request Error:", repr(e), flush=True)
        return jsonify(
            success=False,
            message="Could not load rental requests."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


# OWNER CONFIRM OR REJECT BOOKING
@app.route("/api/owner/requests/<int:booking_id>", methods=["PUT"])
def update_owner_request(booking_id):

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "owner":
        return jsonify(success=False, message="Owner access only."), 403

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["confirmed", "cancelled"]:
        return jsonify(success=False, message="Invalid status."), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT b.booking_id, b.status
            FROM bookings b
            JOIN bikes bk ON b.bike_id = bk.bike_id
            WHERE b.booking_id = %s
            AND bk.owner_id = %s
        """, (booking_id, session["user_id"]))

        booking = cursor.fetchone()

        if not booking:
            return jsonify(success=False, message="Booking not found."), 404

        if booking["status"] != "pending":
            return jsonify(success=False, message="This booking is already processed."), 400

        cursor.execute("""
            UPDATE bookings
            SET status = %s
            WHERE booking_id = %s
        """, (new_status, booking_id))

        db.commit()

        return jsonify(
            success=True,
            message="Booking " + new_status + " successfully."
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback()
        print("Owner Booking Update Error:", repr(e), flush=True)
        return jsonify(success=False, message="Could not update booking."), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

# ADMIN DASHBOARD API
@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():

    if "user_id" not in session:
        return jsonify(success=False, message="Please login first."), 401

    if session.get("role") != "admin":
        return jsonify(success=False, message="Admin access only."), 403

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # GET COUNTS
        cursor.execute("SELECT COUNT(*) AS total FROM users")
        user_count = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM bikes")
        bike_count = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM bookings")
        booking_count = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM payments")
        payment_count = cursor.fetchone()["total"]

        # GET ALL USERS
        cursor.execute("""
            SELECT user_id, name, email, role, created_at
            FROM users
            ORDER BY user_id DESC
        """)
        users = cursor.fetchall()

        # GET ALL BIKES
        cursor.execute("""
            SELECT bike_id, model, bike_type, location,
                   price_per_day, availability
            FROM bikes
            ORDER BY bike_id DESC
        """)
        bikes_list = cursor.fetchall()

        # GET ALL BOOKINGS
        cursor.execute("""
            SELECT
                b.booking_id,
                u.name AS tourist_name,
                bk.model,
                b.pickup_date,
                b.return_date,
                b.total_amount,
                b.status
            FROM bookings b
            JOIN users u ON b.tourist_id = u.user_id
            JOIN bikes bk ON b.bike_id = bk.bike_id
            ORDER BY b.booking_id DESC
        """)
        bookings_list = cursor.fetchall()

        # GET ALL PAYMENTS
        cursor.execute("""
            SELECT
                p.payment_id,
                p.booking_id,
                u.name AS tourist_name,
                p.amount,
                p.payment_method,
                p.payment_status,
                p.payment_date
            FROM payments p
            JOIN bookings b ON p.booking_id = b.booking_id
            JOIN users u ON b.tourist_id = u.user_id
            ORDER BY p.payment_id DESC
        """)
        payments_list = cursor.fetchall()

        return jsonify(
            success=True,
            counts={
                "users": user_count,
                "bikes": bike_count,
                "bookings": booking_count,
                "payments": payment_count
            },
            users=users,
            bikes=bikes_list,
            bookings=bookings_list,
            payments=payments_list
        )

    except mysql.connector.Error as e:
        print("Admin Dashboard Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not load admin dashboard."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

# ADMIN: UPDATE BOOKING STATUS
@app.route("/api/admin/bookings/<int:booking_id>", methods=["PUT"])
def update_booking_status(booking_id):

    if "user_id" not in session:
        return jsonify(
            success=False,
            message="Please login first."
        ), 401

    if session.get("role") != "admin":
        return jsonify(
            success=False,
            message="Admin access only."
        ), 403

    data = request.get_json() or {}
    status = data.get("status")

    allowed_statuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ]

    if status not in allowed_statuses:
        return jsonify(
            success=False,
            message="Invalid booking status."
        ), 400

    db = None
    cursor = None

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT booking_id FROM bookings WHERE booking_id = %s",
            (booking_id,)
        )

        booking = cursor.fetchone()

        if not booking:
            return jsonify(
                success=False,
                message="Booking not found."
            ), 404

        cursor.execute("""
            UPDATE bookings
            SET status = %s
            WHERE booking_id = %s
        """, (status, booking_id))

        db.commit()

        return jsonify(
            success=True,
            message="Booking status updated successfully!"
        )

    except mysql.connector.Error as e:
        if db:
            db.rollback()

        print("Update Booking Error:", repr(e), flush=True)

        return jsonify(
            success=False,
            message="Could not update booking status."
        ), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

if __name__ == "__main__":
        app.run(debug=True)
        
    


