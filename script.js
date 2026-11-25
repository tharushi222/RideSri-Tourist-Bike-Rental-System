const bikes=[
{id:1,model:"Yamaha FZ-S",type:"Standard",price:2500,location:"Colombo",rating:"4.8",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85",desc:"A reliable and comfortable motorcycle for city rides and short trips."},
{id:2,model:"Honda Dio",type:"Scooter",price:1800,location:"Galle",rating:"4.6",image:"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85",desc:"Easy to ride and fuel-friendly, ideal for coastal towns."},
{id:3,model:"Royal Enfield Himalayan",type:"Adventure",price:4500,location:"Kandy",rating:"4.9",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85",desc:"Built for longer journeys and scenic hill-country routes."},
{id:4,model:"Kawasaki KLX 250",type:"Off-road",price:5200,location:"Ella",rating:"4.7",image:"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85",desc:"A capable option for adventurous routes."},
{id:5,model:"Hero Xtreme 160R",type:"Standard",price:2200,location:"Matara",rating:"4.6",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85",desc:"A practical everyday bike for exploring the south coast."},
{id:6,model:"Royal Enfield Classic 350",type:"Standard",price:3800,location:"Galle",rating:"4.9",image:"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85",desc:"Classic style with a comfortable ride for scenic journeys."}];
let extra=JSON.parse(localStorage.getItem("rsExtra")||"[]"),user=JSON.parse(localStorage.getItem("rsUser")||"null"),bookings=JSON.parse(localStorage.getItem("rsBookings")||"[]"),bike=bikes[0],draft=null,last=null;
const $=id=>document.getElementById(id),all=()=>[...bikes,...extra],money=n=>"LKR "+Number(n).toLocaleString("en-US");
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function go(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");$("nav").classList.remove("open");scrollTo(0,0);if(id==="bikes")renderBikes();if(id==="tourist")renderTourist();if(id==="owner")renderOwner();if(id==="admin")renderAdmin();if(id==="booking")renderBooking();if(id==="payment")renderPayment()}
document.addEventListener("click",e=>{let a=e.target.closest("[data-page]");if(a){e.preventDefault();go(a.dataset.page)}let b=e.target.closest("[data-bike]");if(b){bike=all().find(x=>x.id===Number(b.dataset.bike))||bikes[0];renderDetails();go("details")}});
$("menu").onclick=()=>$("nav").classList.toggle("open");
function card(b){return `<article class="card"><div class="card-img" style="background-image:url('${b.image}')"><span class="pill">${b.type}</span></div><div class="card-body"><h3>${b.model}</h3><div class="meta">📍 ${b.location}　★ ${b.rating}</div><div class="price">${money(b.price)} <small>/ day</small></div><button class="primary" data-bike="${b.id}">View Details →</button></div></article>`}
function renderFeatured(){$("featured").innerHTML=bikes.slice(0,4).map(card).join("")}
async function renderBikes() {
    try {
        const response = await fetch("/api/bikes");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Could not load bikes");
        }

        let dbBikes = data.bikes.map(b => ({
            id: b.bike_id,
            model: b.model,
            type: b.bike_type,
            price: Number(b.price_per_day),
            location: b.location,
            rating: "New",
            image: b.image_url || bikes[0].image,
            desc: b.description || ""
        }));

        let q = $("search").value.toLowerCase();
        let loc = $("location").value;
        let type = $("type").value;
        let max = Number($("maxPrice").value) || Infinity;

        let list = dbBikes.filter(b =>
            (b.model + " " + b.location).toLowerCase().includes(q) &&
            (!loc || b.location === loc) &&
            (!type || b.type === type) &&
            b.price <= max
        );

        $("allBikes").innerHTML = list.length
            ? list.map(card).join("")
            : '<div class="empty">No bikes match. Try another filter.</div>';

        $("count").textContent = list.length + " bikes found";

    } catch (error) {
        console.error("Bike Loading Error:", error);
        $("allBikes").innerHTML =
            '<div class="empty">Could not load bikes. Please try again.</div>';
        $("count").textContent = "0 bikes found";
    }
}
["search","location","type","maxPrice"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",renderBikes));
$("homeSearch").onsubmit=e=>{e.preventDefault();$("location").value=$("homeLocation").value;$("type").value=$("homeType").value;go("bikes");renderBikes()};
function renderDetails(){$("detailsContent").innerHTML=`<div class="details"><div class="details-photo" style="background-image:url('${bike.image}')"></div><div class="details-info"><small class="eyebrow">BIKE DETAILS</small><h1>${bike.model}</h1><div class="meta">★ ${bike.rating}　📍 ${bike.location}　✓ ${bike.type}</div><div class="price">${money(bike.price)} <small>/ day</small></div><p>${bike.desc}</p><p>Owners should verify the tourist's identity, driving licence and applicable local requirements before handing over a bike.</p><button class="primary" id="bookNow">Book Now →</button> <button class="outline" data-page="bikes">Back</button></div></div>`;$("bookNow").onclick=()=>{if(!user){toast("Register or login before booking.");go("login")}else go("booking")}}
function datePlus(n){let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function renderBooking(){draft=draft||{pickup:datePlus(1),ret:datePlus(2),location:bike.location};$("pickup").min=datePlus(0);$("pickup").value=draft.pickup;$("return").value=draft.ret;$("bookLocation").value=draft.location;$("bookSummary").innerHTML=`<img width="100%" style="border-radius:9px" src="${bike.image}"><h2>${bike.model}</h2><p>${bike.location} · ${bike.type}</p><b class="price">${money(bike.price)} / day</b>`;totalUpdate()}
function totalUpdate(){if(!$("pickup").value||!$("return").value)return;let days=Math.max(1,Math.ceil((new Date($("return").value)-new Date($("pickup").value))/86400000));$("duration").textContent=days+" day(s)";$("total").textContent=money(days*bike.price);$("return").min=$("pickup").value}
$("pickup").onchange=totalUpdate;$("return").onchange=totalUpdate;
$("bookingForm").onsubmit = async e => {
    e.preventDefault();

    if (new Date($("return").value) <= new Date($("pickup").value)) {
        toast("Return date must be after pickup date.");
        return;
    }

    let days = Math.ceil(
        (new Date($("return").value) - new Date($("pickup").value)) / 86400000
    );

    draft = {
        pickup: $("pickup").value,
        ret: $("return").value,
        location: $("bookLocation").value,
        days: days,
        total: days * bike.price
    };

    try {
        const response = await fetch("/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bike_id: bike.id,
                pickup_date: draft.pickup,
                return_date: draft.ret,
                total_amount: draft.total
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            toast(data.message || "Booking failed.");
            return;
        }

        draft.bookingId = data.booking_id;
        toast("Booking saved successfully!");
        go("payment");

    } catch (error) {
        console.error("Booking Error:", error);
        toast("Could not save booking. Please try again.");
    }
};
function renderPayment(){if(!draft){go("bikes");return}$("payAmount").textContent=money(draft.total||bike.price);$("paySummary").innerHTML=`<img width="100%" style="border-radius:9px" src="${bike.image}"><h2>${bike.model}</h2><p>${draft.pickup||""} → ${draft.ret||""}</p><b class="price">${money(draft.total||bike.price)}</b>`}

$("paymentForm").onsubmit = async (e) => {
    e.preventDefault();

    if (!draft || !draft.bookingId) {
        toast("Booking details not found.");
        return;
    }

    const selectedMethod = document.querySelector(
        'input[name="method"]:checked'
    );

    if (!selectedMethod) {
        toast("Please select a payment method.");
        return;
    }

    try {
        const response = await fetch("/api/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                booking_id: draft.bookingId,
                payment_method: selectedMethod.value
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            toast(data.message || "Payment failed.");
            return;
        }

        last = {
            id: "RS" + data.booking_id,
            email: user.email,
            name: user.name,
            bike: bike,
            pickup: draft.pickup,
            ret: draft.ret,
            days: draft.days,
            total: draft.total,
            method: selectedMethod.value,
            status: "Confirmed (Demo)"
        };

        bookings.unshift(last);

        localStorage.setItem(
            "rsBookings",
            JSON.stringify(bookings)
        );

        renderReceipt();
        go("confirmation");

        toast("Payment saved successfully!");

    } catch (error) {
        console.error("Payment Error:", error);
        toast("Could not connect to payment server.");
    }
};

function renderReceipt(){if(!last)return;$("receipt").innerHTML=[["Booking ID",last.id],["Tourist",last.name],["Bike",last.bike.model],["Rental dates",last.pickup+" – "+last.ret],["Duration",last.days+" day(s)"],["Payment method",last.method],["Total",money(last.total)]].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}
$("print").onclick=()=>print();

$("registerForm").onsubmit = async (e) => {
    e.preventDefault();

    const name = $("regName").value.trim();
    const email = $("regEmail").value.trim().toLowerCase();
    const password = $("regPass").value;
    const confirmPassword = $("regConfirm").value;

    if (password !== confirmPassword) {
        toast("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: $("regRole").value
          })
        });

        const data = await response.json();

        if (!response.ok) {
            toast(data.message);
            return;
        }

        // Keep the current demo dashboard flow
        user = {
            name: data.user.name,
            email: data.user.email,
            role: data.user.role
        };

        localStorage.setItem("rsUser", JSON.stringify(user));
$("registerForm").reset();

toast(data.message);

if (data.user.role === "owner") {
    go("owner");
} else {
    go("tourist");
}

    } catch (error) {
        console.error("Registration Error:", error);
        toast("Could not connect to the server.");
    }
};

$("loginForm").onsubmit = async (e) => {
    e.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPass").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            toast(data.message);
            return;
        }

        user = data.user;

        localStorage.setItem("rsUser", JSON.stringify(user));

        $("loginForm").reset();

toast(data.message);

if (data.user.role === "owner") {
    go("owner");
} else if (data.user.role === "admin") {
    go("admin");
} else {
    go("tourist");
}

    } catch (error) {
        console.error("Login Error:", error);
        toast("Could not connect to the server.");
    }
};

async function renderTourist() {

    if (user) {
        $("touristName").textContent = user.name;
    }

    $("touristBookings").innerHTML =
        '<div class="empty">Loading your bookings...</div>';

    try {
        const response = await fetch("/api/my-bookings");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load bookings");
        }

        let mine = data.bookings;

        $("tTotal").textContent = mine.length;

        $("tUpcoming").textContent = mine.filter(b =>
            new Date(b.return_date) >= new Date()
        ).length;

        $("tConfirmed").textContent = mine.filter(b =>
            b.status === "confirmed"
        ).length;

        $("touristBookings").innerHTML = mine.length
            ? mine.map(b => `
                <div class="booking">
                    <img src="${b.image_url || bikes[0].image}">

                    <div>
                        <b>${b.model}</b>

                        <p>
                            Booking ID: ${b.booking_id}
                        </p>

                        <p>
                            ${b.pickup_date} – ${b.return_date}
                        </p>

                        <p>
                            Payment: ${b.payment_status || "Not paid"}
                        </p>

                        <b class="price">
                            ${money(b.total_amount)}
                        </b>
                    </div>

                    
<span class="status">
    ${b.status}
</span>

${b.status === "pending" ? `
    <button onclick="cancelTouristBooking(${b.booking_id})">
        Cancel Booking
    </button>
` : ""}

                </div>
            `).join("")
            : '<div class="empty">No bookings yet. Browse bikes to plan your trip.</div>';

    } catch (error) {
        console.error("Tourist Dashboard Error:", error);

        $("touristBookings").innerHTML =
            '<div class="empty">Could not load bookings. Please login again.</div>';
    }
}

// TOURIST CANCEL BOOKING
async function cancelTouristBooking(bookingId) {

    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    try {
        const response = await fetch(
            `/api/my-bookings/${bookingId}/cancel`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        alert(data.message);

        if (data.success) {
            renderTourist();
        }

    } catch (error) {
        console.error("Cancel Booking Error:", error);
        alert("Could not cancel booking.");
    }
}

async function renderOwner() {                        
    try {
        const response = await fetch("/api/owner/bikes");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Could not load bikes");
        }

        let list = data.bikes;

        $("ownerCount").textContent = list.length;
        $("ownerActive").textContent =
            list.filter(b => b.availability === "available").length;

     

        $("ownerList").innerHTML = list.length
            ? list.map(b => `
                <div class="booking">
                    <img src="${b.image_url || bikes[0].image}">
                    <div>
                        <b>${b.model}</b>
                        <p>${b.location} · ${b.bike_type}</p>
                        <b class="price">${money(b.price_per_day)} / day</b>
                        <p>
                            <button class="editBike" data-id="${b.bike_id}">Edit</button>
                            <button class="deleteBike" data-id="${b.bike_id}">Delete</button>
                        </p>
                    </div>
                    <span class="status">${b.availability}</span>
                </div>
            `).join("")
            : '<div class="empty">No bikes added yet.</div>';

        // EDIT BIKE
        document.querySelectorAll(".editBike").forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.id;
                const selectedBike = list.find(b => b.bike_id == id);

                let model = prompt("Enter bike model:", selectedBike.model);
                if (model === null || !model.trim()) return;

                let price = Number(prompt(
                    "Enter daily price:",
                    selectedBike.price_per_day
                ));

                if (!price || price < 1) {
                    toast("Enter a valid price.");
                    return;
                }

                let location = prompt(
                    "Enter location:",
                    selectedBike.location
                );

                if (location === null || !location.trim()) return;

                const updateData = {
                    model: model,
                    bike_type: selectedBike.bike_type,
                    location: location,
                    price_per_day: price,
                    description: selectedBike.description || "",
                    image_url: selectedBike.image_url || ""
                };

                try {
                    const res = await fetch(`/api/owner/bikes/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(updateData)
                    });

                    const result = await res.json();

                    if (!res.ok || !result.success) {
                        toast(result.message || "Bike update failed.");
                        return;
                    }

                    toast("Bike updated successfully!");
                    await renderOwner();

                } catch (error) {
                    console.error(error);
                    toast("Update error.");
                }
            };
        });

        // DELETE BIKE
        document.querySelectorAll(".deleteBike").forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.id;

                if (!confirm("Are you sure you want to delete this bike?")) {
                    return;
                }

                try {
                    const res = await fetch(`/api/owner/bikes/${id}`, {
                        method: "DELETE"
                    });

                    const result = await res.json();

                    if (!res.ok || !result.success) {
                        toast(result.message || "Bike delete failed.");
                        return;
                    }

                    toast("Bike deleted successfully!");
                    await renderOwner();

                } catch (error) {
                    console.error(error);
                    toast("Delete error.");
                }
            };
        });

       
// LOAD RENTAL REQUESTS FROM DATABASE
try {
    const response = await fetch("/api/owner/requests");
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load requests");
    }

    const requests = data.requests;

    $("requestCount").textContent = requests.length;

    $("ownerRequests").innerHTML = requests.length
        ? requests.map(b => `
            <div class="booking">
                <img src="${b.image_url || bikes[0].image}">

                <div>
                    <b>${b.model}</b>

                    <p>Booking ID: ${b.booking_id}</p>

                    <p>Tourist: ${b.tourist_name}</p>

                    <p>Email: ${b.tourist_email}</p>

                    <p>${b.pickup_date} – ${b.return_date}</p>

                    <b class="price">${money(b.total_amount)}</b>

                    <p>Payment: ${b.payment_status || "Not paid"}</p>
                </div>

               <span class="status">${b.status}</span>

${b.status === "pending" ? `
    <div>
        <button onclick="updateOwnerRequest(${b.booking_id}, 'confirmed')">
            Confirm
        </button>

        <button onclick="updateOwnerRequest(${b.booking_id}, 'cancelled')">
            Reject
        </button>
    </div>
` : ""}
            </div>
        `).join("")
        : '<div class="empty">No rental requests yet.</div>';

} catch (error) {
    console.error("Rental Requests Error:", error);

    $("ownerRequests").innerHTML =
        '<div class="empty">Could not load rental requests.</div>';
}


    } catch (error) {
        console.error("Owner Dashboard Error:", error);
        $("ownerList").innerHTML =
            '<div class="empty">Could not load bikes. Please login again.</div>';
    }
}

$("addBike").onclick = async () => {
    let model = prompt("Bike model?");
    if (!model) return;

    let price = Number(prompt("Daily price in LKR?", "2500"));

    if (!price || price < 1) {
        toast("Enter a valid price.");
        return;
    }

    let location = prompt("Location?", "Galle") || "Galle";

    let bikeData = {
        model: model,
        bike_type: "Standard",
        location: location,
        price_per_day: price,
        description: "Available for tourist rentals",
        image_url: bikes[0].image
    };

    try {
        const response = await fetch("/api/owner/bikes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bikeData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            toast(data.message || "Bike could not be added.");
            return;
        }

        await renderOwner();
        toast("Bike successfully added!");

    } catch (error) {
        console.error(error);
        toast("Database connection error.");
    }
};

async function updateOwnerRequest(bookingId, status) {

    const action = status === "confirmed" ? "confirm" : "reject";

    if (!confirm(`Are you sure you want to ${action} this booking?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/owner/requests/${bookingId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: status })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            toast(data.message || "Could not update booking.");
            return;
        }

        toast(data.message);
        await renderOwner();

    } catch (error) {
        console.error(error);
        toast("Booking update error.");
    }
}


async function renderAdmin() {

    try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load admin dashboard");
        }

        // DASHBOARD COUNTS
        $("userCount").textContent = data.counts.users;
        $("adminBikeCount").textContent = data.counts.bikes;
        $("adminBookingCount").textContent = data.counts.bookings;


// ALL BIKES
$("adminBikeList").innerHTML = `
    <div class="table-wrap">
        <table>
            <tr>
                <th>Bike</th>
                <th>Location</th>
                <th>Type</th>
                <th>Daily Price</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>

            ${data.bikes.map(b => `
                <tr>
                    <td>${b.model}</td>
                    <td>${b.location}</td>
                    <td>${b.bike_type}</td>
                    <td>${money(b.price_per_day)}</td>
                    <td>${b.availability}</td>
                    <td>
                        <button onclick="adminEditBike(${b.bike_id})">
                            Edit
                        </button>

                        <button onclick="adminDeleteBike(${b.bike_id})">
                            Delete
                        </button>

                        <button onclick="adminToggleBike(${b.bike_id}, '${b.availability}')">
                            ${b.availability === "available" ? "Make Unavailable" : "Make Available"}
                        </button>
                    </td>
                </tr>
            `).join("")}
        </table>
    </div>
`;


       
// ALL BOOKINGS
$("adminBookingList").innerHTML = data.bookings.length
    ? `
        <div class="table-wrap">
            <table>
                <tr>
                    <th>Booking ID</th>
                    <th>Tourist</th>
                    <th>Bike</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>

                ${data.bookings.map(b => `
                    <tr>
                        <td>${b.booking_id}</td>
                        <td>${b.tourist_name}</td>
                        <td>${b.model}</td>
                        <td>${b.pickup_date} – ${b.return_date}</td>
                        <td>${money(b.total_amount)}</td>
                        <td>${b.status}</td>
                        <td>
                            ${b.status === "pending" ? `
                                <button onclick="updateBookingStatus(${b.booking_id}, 'confirmed')">
                                    Confirm
                                </button>

                                <button onclick="updateBookingStatus(${b.booking_id}, 'cancelled')">
                                    Cancel
                                </button>
                            ` : b.status === "confirmed" ? `
                                <button onclick="updateBookingStatus(${b.booking_id}, 'completed')">
                                    Complete
                                </button>

                                <button onclick="updateBookingStatus(${b.booking_id}, 'cancelled')">
                                    Cancel
                                </button>
                            ` : "No actions"}
                        </td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `
    : '<div class="empty">No bookings yet.</div>';


        // ALL PAYMENTS
        if ($("adminPaymentList")) {
            $("adminPaymentList").innerHTML = data.payments.length
                ? `
                    <div class="table-wrap">
                        <table>
                            <tr>
                                <th>Payment ID</th>
                                <th>Booking ID</th>
                                <th>Tourist</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>

                            ${data.payments.map(p => `
                                <tr>
                                    <td>${p.payment_id}</td>
                                    <td>${p.booking_id}</td>
                                    <td>${p.tourist_name}</td>
                                    <td>${money(p.amount)}</td>
                                    <td>${p.payment_method}</td>
                                    <td>${p.payment_status}</td>
                                </tr>
                            `).join("")}
                        </table>
                    </div>
                `
                : '<div class="empty">No payments yet.</div>';
        }

        // ALL USERS
        if ($("adminUserList")) {
            $("adminUserList").innerHTML = data.users.length
                ? `
                    <div class="table-wrap">
                        <table>
                            <tr>
                                <th>User ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                            </tr>

                            ${data.users.map(u => `
                                <tr>
                                    <td>${u.user_id}</td>
                                    <td>${u.name}</td>
                                    <td>${u.email}</td>
                                    <td>${u.role}</td>
                                </tr>
                            `).join("")}
                        </table>
                    </div>
                `
                : '<div class="empty">No users found.</div>';

        }

    } catch (error) {
        console.error("Admin Dashboard Error:", error);

        $("adminBookingList").innerHTML =
            '<div class="empty">Could not load admin dashboard.</div>';
    }
}

// UPDATE BOOKING STATUS
async function updateBookingStatus(bookingId, newStatus) {

    const confirmAction = confirm(
        `Are you sure you want to change this booking to ${newStatus}?`
    );

    if (!confirmAction) return;

    try {
        const response = await fetch(
            `/api/admin/bookings/${bookingId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.message || "Status update failed.");
            return;
        }

        alert("Booking status updated successfully!");

        renderAdmin();

    } catch (error) {
        console.error("Booking Update Error:", error);
        alert("Something went wrong!");
    }
}

// ADMIN EDIT BIKE
async function adminEditBike(bikeId) {

    const model = prompt("Enter Bike Model:");
    if (model === null || !model.trim()) return;

    const bike_type = prompt("Enter Bike Type:");
    if (bike_type === null || !bike_type.trim()) return;

    const location = prompt("Enter Location:");
    if (location === null || !location.trim()) return;

    const price = prompt("Enter Daily Price:");
    if (price === null || !price.trim()) return;

    const description = prompt("Enter Description:") || "";
    const image_url = prompt("Enter Image URL:") || "";

    try {
        const response = await fetch(`/api/admin/bikes/${bikeId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model,
                bike_type,
                location,
                price_per_day: price,
                description,
                image_url
            })
        });

        const data = await response.json();

        alert(data.message);
        if (data.success) {
            renderAdmin();
            renderBikes();
        }

    } catch (error) {
        alert("Could not edit bike.");
        console.error(error);
    }
}


// ADMIN DELETE BIKE
async function adminDeleteBike(bikeId) {

    if (!confirm("Are you sure you want to delete this bike?")) return;

    try {
        const response = await fetch(`/api/admin/bikes/${bikeId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        alert(data.message);
        if (data.success) {
            renderAdmin();
            renderBikes();
        }

    } catch (error) {
        alert("Could not delete bike.");
        console.error(error);
    }
}


// ADMIN CHANGE BIKE AVAILABILITY
async function adminToggleBike(bikeId, currentStatus) {

    const newStatus = currentStatus === "available"
        ? "unavailable"
        : "available";

    try {
        const response = await fetch(
            `/api/admin/bikes/${bikeId}/availability`,
            {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    availability: newStatus
                })
            }
        );

        const data = await response.json();

        alert(data.message);

        if (data.success) {
            renderAdmin();
            renderBikes();
        }

    } catch (error) {
        alert("Could not update availability.");
        console.error(error);
    }
}

renderFeatured();renderBikes();