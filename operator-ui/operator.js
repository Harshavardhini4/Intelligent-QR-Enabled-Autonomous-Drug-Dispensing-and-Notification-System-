const API_URL = "http://localhost:5000/api/operator/prescriptions";
const ASSIGN_URL = "http://localhost:5000/api/operator/assign-slot";

let autoRefresh = true;
let refreshInterval;

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    if (autoRefresh) {
      loadPrescriptions();
    }
  }, 5000);
}

function stopAutoRefresh() {
  autoRefresh = false;
}

function resumeAutoRefresh() {
  autoRefresh = true;
}

function loadPrescriptions() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("prescriptionTable");
      table.innerHTML = "";

      data.forEach(p => {
        const row = document.createElement("tr");

        let slotCol = "-";
        let expiryCol = "-";
        let actionCol = "—";

        if (p.status === "PENDING") {
          slotCol = `
            <input type="number"
                   min="1"
                   id="slot-${p.prescriptionId}"
                   onfocus="stopAutoRefresh()"
                   onblur="resumeAutoRefresh()">
          `;

          expiryCol = `
            <input type="datetime-local"
                   id="expiry-${p.prescriptionId}"
                   onfocus="stopAutoRefresh()"
                   onblur="resumeAutoRefresh()">
          `;

          actionCol = `
            <button onclick="assign('${p.prescriptionId}')">
              Assign
            </button>
          `;
        } else {
          slotCol = p.motorSlot ?? "-";
          expiryCol = p.expiryTime
            ? new Date(p.expiryTime).toLocaleString()
            : "-";
        }

        row.innerHTML = `
          <td>${p.prescriptionId}</td>
          <td>${p.patientName}</td>
          <td>${p.medicines.map(m => `${m.name}(${m.qty})`).join(", ")}</td>
          <td>${slotCol}</td>
          <td>${expiryCol}</td>
          <td>${p.status}</td>
          <td>${actionCol}</td>
        `;

        table.appendChild(row);
      });
    })
    .catch(err => console.error("Error loading prescriptions:", err));
}

async function assign(id) {
  const motorSlot = document.getElementById(`slot-${id}`).value;
  const expiryTime = document.getElementById(`expiry-${id}`).value;

  if (!motorSlot || !expiryTime) {
    alert("Please enter both slot number and expiry time");
    return;
  }

  try {
    await fetch(ASSIGN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prescriptionId: id,
        motorSlot,
        expiryTime
      })
    });

    alert("Slot assigned successfully");
    resumeAutoRefresh();
    loadPrescriptions();
  } catch (err) {
    console.error("Assign error:", err);
  }
}

// Initial load + start auto refresh
loadPrescriptions();
startAutoRefresh();
