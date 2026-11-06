
// Get HTML Elements
const reservationForm = document.getElementById("reservationForm");
const formMessage = document.getElementById("formMessage");
const reservationRows = document.getElementById("reservationRows");
const refreshButton = document.getElementById("refreshButton");
const reservationDate = document.getElementById("reservationDate");

// Set minimum reservation date to today
const today = new Date();
const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

reservationDate.min = localDate;


// Submit Reservation Form
reservationForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    formMessage.textContent = "Submitting reservation...";
    formMessage.style.color = "blue";

    const formData = new FormData(reservationForm);

    const reservationData = {
        customer_name: formData.get("customer_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        reservation_date: formData.get("reservation_date"),
        reservation_time: formData.get("reservation_time"),
        guests: Number(formData.get("guests")),
        special_request: formData.get("special_request")
    };

    try {

        const response = await fetch("/api/reservations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reservationData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Reservation failed");
        }

        formMessage.textContent =
            result.message + " Booking ID: " + result.reservation_id;

        formMessage.style.color = "green";

        reservationForm.reset();
        reservationDate.min = localDate;

        loadReservations();

    } catch (error) {

        formMessage.textContent = error.message;
        formMessage.style.color = "red";

    }

});


// Load All Reservations
async function loadReservations() {

    reservationRows.innerHTML =
        '<tr><td colspan="9">Loading reservations...</td></tr>';

    try {

        const response = await fetch("/api/reservations");

        if (!response.ok) {
            throw new Error("Unable to load reservations");
        }

        const reservations = await response.json();

        reservationRows.innerHTML = "";

        if (reservations.length === 0) {

            reservationRows.innerHTML =
                '<tr><td colspan="9">No reservations found</td></tr>';

            return;
        }

        reservations.forEach(function(reservation) {

            const row = document.createElement("tr");

            const values = [
                reservation.reservation_id,
                reservation.customer_name,
                reservation.email,
                reservation.phone,
                reservation.reservation_date,
                reservation.reservation_time,
                reservation.guests
            ];

            values.forEach(function(value) {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            // Status Dropdown
            const statusCell = document.createElement("td");

            const statusSelect = document.createElement("select");
            statusSelect.className = "status-select";

            ["Pending", "Confirmed", "Cancelled"].forEach(function(status) {

                const option = document.createElement("option");

                option.value = status;
                option.textContent = status;

                if (reservation.status === status) {
                    option.selected = true;
                }

                statusSelect.appendChild(option);

            });

            statusSelect.addEventListener("change", function() {
                updateReservationStatus(
                    reservation.reservation_id,
                    statusSelect.value
                );
            });

            statusCell.appendChild(statusSelect);
            row.appendChild(statusCell);

            // Delete Button
            const actionCell = document.createElement("td");

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.style.backgroundColor = "#dc3545";
            deleteButton.style.color = "white";
            deleteButton.style.border = "none";
            deleteButton.style.padding = "8px 12px";
            deleteButton.style.cursor = "pointer";
            deleteButton.style.borderRadius = "4px";

            deleteButton.addEventListener("click", function() {
                deleteReservation(reservation.reservation_id);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            reservationRows.appendChild(row);

        });

    } catch (error) {

        reservationRows.innerHTML =
            '<tr><td colspan="9">Error loading reservations</td></tr>';

        console.log(error.message);

    }

}


// Update Reservation Status
async function updateReservationStatus(id, status) {

    try {

        const response = await fetch(`/api/reservations/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: status })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        alert(result.message);

    } catch (error) {

        alert(error.message);
        loadReservations();

    }

}


// Delete Reservation
async function deleteReservation(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this reservation?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(`/api/reservations/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        alert(result.message);

        loadReservations();

    } catch (error) {

        alert(error.message);

    }

}


// Refresh Reservations
refreshButton.addEventListener("click", loadReservations);


// Load Reservations When Page Opens
document.addEventListener("DOMContentLoaded", loadReservations);
