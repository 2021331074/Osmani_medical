
(() => {
  'use strict';

  // Storage Keys
  const KEYS = {
    DOCTORS: 'osmani_doctors',
    PATIENTS: 'osmani_patients',
    VISITS: 'osmani_visits',
    LAB_TESTS: 'osmani_lab_tests',
    PAYMENTS: 'osmani_payments',
    INITIALIZED: 'osmani_initialized_v2'
  };

  // 5 Specialist Doctors (Fictional Profiles)
  const DEFAULT_DOCTORS = [
    { id: 'DOC-101', name: 'Dr. Anisur Rahman', dept: 'General Medicine', fee: 800, room: 'Room 201' },
    { id: 'DOC-102', name: 'Dr. Nusrat Sultana', dept: 'Cardiology', fee: 1200, room: 'Room 305' },
    { id: 'DOC-103', name: 'Dr. Tariqul Hasan', dept: 'Pediatrics', fee: 900, room: 'Room 108' },
    { id: 'DOC-104', name: 'Dr. Farhana Yasmin', dept: 'Gynecology & Obstetrics', fee: 1000, room: 'Room 204' },
    { id: 'DOC-105', name: 'Dr. Mahmudul Karim', dept: 'Orthopedics', fee: 1100, room: 'Room 402' }
  ];

  // Standard Lab Catalog with Fixed Prices in Bangladeshi Taka (Tk)
  const LAB_CATALOG = [
    { name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 400 },
    { name: 'Lipid Profile', category: 'Biochemistry', price: 1000 },
    { name: 'Chest X-Ray P/A View', category: 'Radiology', price: 800 },
    { name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', price: 200 },
    { name: 'Urine Routine Examination (R/E)', category: 'Pathology', price: 300 },
    { name: 'Ultrasonography (USG) of Whole Abdomen', category: 'Radiology', price: 1500 },
    { name: '12-Lead Electrocardiogram (ECG)', category: 'Cardiology', price: 500 },
    { name: 'Serum Creatinine', category: 'Biochemistry', price: 450 },
    { name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 1200 },
    { name: 'Serum Electrolytes', category: 'Biochemistry', price: 900 }
  ];

  // Safe localStorage reading helper
  function readStorage(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Failed to read ${key} from localStorage:`, e);
      return fallback;
    }
  }

  // Safe localStorage writing helper
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Failed to write ${key} to localStorage:`, e);
      return false;
    }
  }

  // Currency Formatter
  function formatTk(amount) {
    const num = Number(amount) || 0;
    return 'Tk ' + num.toLocaleString('en-US');
  }

  // Date utilities
  function getTodayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDateDaysAgo(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  // Ensure default doctors exist
  function initDoctors() {
    const existing = readStorage(KEYS.DOCTORS, null);
    if (!existing || existing.length === 0) {
      writeStorage(KEYS.DOCTORS, DEFAULT_DOCTORS);
    }
  }

  // Generate Sample Data (~50 patients, 30 days of activity)
  function generateSampleData() {
    const firstNames = ['Abdul', 'Fatema', 'Mohammad', 'Rokeya', 'Kamal', 'Tahmina', 'Nazmul', 'Shirin', 'Rafiq', 'Salma', 'Kabir', 'Nasreen', 'Imran', 'Laila', 'Shakil', 'Rehana', 'Zahid', 'Monira', 'Tanvir', 'Farzana'];
    const lastNames = ['Hossain', 'Khatun', 'Islam', 'Begum', 'Ahmed', 'Akter', 'Rahman', 'Chowdhury', 'Miah', 'Jahan', 'Sarker', 'Bhuiyan', 'Ali', 'Uddin'];
    const addresses = ['Dhanmondi, Dhaka', 'Mirpur-10, Dhaka', 'Uttara Sector 4, Dhaka', 'Gulshan-2, Dhaka', 'Mohammadpur, Dhaka', 'Panchlaish, Chittagong', 'Agrabad, Chittagong', 'Zindabazar, Sylhet', 'Shibbari, Khulna', 'Boalia, Rajshahi'];

    const patients = [];
    const visits = [];
    const labTests = [];
    const payments = [];

    // 1. Generate 50 Patients
    for (let i = 1; i <= 50; i++) {
      const pId = 'P-' + String(i).padStart(4, '0');
      const isMale = (i % 2 === 0);
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const name = `${fn} ${ln}`;
      const age = 18 + ((i * 7) % 55);
      const gender = isMale ? 'Male' : 'Female';
      const phone = `0171${String(100000 + i * 37).slice(0, 7)}`;
      const address = addresses[i % addresses.length];
      // Stagger registrations over the last 30 days
      const daysAgo = (50 - i) % 30;
      const registeredDate = getDateDaysAgo(daysAgo);

      patients.push({
        id: pId,
        name,
        age,
        gender,
        phone,
        address,
        registeredDate
      });
    }

    // 2. Generate ~75 Doctor Visits across the past 30 days
    const problems = [
      { prob: 'Seasonal fever and severe headache for 3 days', med: 'Tab. Paracetamol 500mg 1+1+1 x 5 days, Tab. Fexo 120mg' },
      { prob: 'Chest tightness, elevated BP and palpitations', med: 'Tab. Amlodipine 5mg 0+0+1, Tab. Atenolol 50mg' },
      { prob: 'Persistent dry cough and mild respiratory wheeze', med: 'Syp. Butamirate 2 tsp x 7 days, Montelukast 10mg' },
      { prob: 'Severe lower back pain radiating to right leg', med: 'Tab. Naproxen 500mg 1+0+1, Cap. Omeprazole 20mg' },
      { prob: 'Post-prandial abdominal acidity and burning epigastric pain', med: 'Cap. Esomeprazole 40mg 1+0+1 (ac), Syp. Antacid' },
      { prob: 'Routine pediatric checkup and mild ear discomfort', med: 'Ciprofloxacin Otic Drops 2 drops tid, Paracetamol Syp.' },
      { prob: 'Knee joint pain with morning stiffness and swelling', med: 'Tab. Aceclofenac 100mg 1+0+1, Calcium + Vit D3' }
    ];

    let visitCounter = 1;
    let paymentCounter = 1;
    let labCounter = 1;

    patients.forEach((patient, idx) => {
      // 1 to 2 visits for most patients
      const visitCount = (idx % 3 === 0) ? 2 : 1;
      for (let v = 0; v < visitCount; v++) {
        const doc = DEFAULT_DOCTORS[(idx + v) % DEFAULT_DOCTORS.length];
        const daysAgo = Math.max(0, 28 - (idx % 29));
        const visitDate = getDateDaysAgo(daysAgo);
        const probObj = problems[(idx + v) % problems.length];
        const vId = 'VIS-' + String(visitCounter++).padStart(4, '0');

        visits.push({
          id: vId,
          patientId: patient.id,
          patientName: patient.name,
          doctorId: doc.id,
          doctorName: doc.name,
          department: doc.dept,
          date: visitDate,
          problem: probObj.prob,
          medicines: probObj.med,
          fee: doc.fee
        });

        // 80% paid on spot for visits
        if ((idx + v) % 5 !== 0) {
          payments.push({
            id: 'PAY-' + String(paymentCounter++).padStart(4, '0'),
            invoiceId: vId,
            patientId: patient.id,
            patientName: patient.name,
            date: visitDate,
            itemType: 'Doctor Visit',
            amount: doc.fee,
            method: (paymentCounter % 3 === 0) ? 'bKash' : ((paymentCounter % 4 === 0) ? 'Card' : 'Cash')
          });
        }
      }

      // 3. Generate Lab Tests for ~60% of patients
      if (idx % 5 !== 1) {
        const testItem = LAB_CATALOG[idx % LAB_CATALOG.length];
        const daysAgo = Math.max(0, 27 - (idx % 28));
        const labDate = getDateDaysAgo(daysAgo);
        const isDone = (daysAgo > 2) || (idx % 4 === 0);
        const labId = 'LAB-' + String(labCounter++).padStart(4, '0');

        labTests.push({
          id: labId,
          patientId: patient.id,
          patientName: patient.name,
          testName: testItem.name,
          category: testItem.category,
          price: testItem.price,
          date: labDate,
          status: isDone ? 'Done' : 'Pending',
          result: isDone ? 'Parameters within clinically acceptable reference limits. No acute abnormality detected.' : 'Sample collected and processing in laboratory.'
        });

        // If done, most paid; if pending, half paid
        if (isDone || (idx % 2 === 0)) {
          payments.push({
            id: 'PAY-' + String(paymentCounter++).padStart(4, '0'),
            invoiceId: labId,
            patientId: patient.id,
            patientName: patient.name,
            date: labDate,
            itemType: 'Lab Test',
            amount: testItem.price,
            method: (paymentCounter % 2 === 0) ? 'bKash' : 'Cash'
          });
        }
      }
    });

    writeStorage(KEYS.DOCTORS, DEFAULT_DOCTORS);
    writeStorage(KEYS.PATIENTS, patients);
    writeStorage(KEYS.VISITS, visits);
    writeStorage(KEYS.LAB_TESTS, labTests);
    writeStorage(KEYS.PAYMENTS, payments);
    writeStorage(KEYS.INITIALIZED, 'true');

    return {
      patientsCount: patients.length,
      visitsCount: visits.length,
      labTestsCount: labTests.length,
      paymentsCount: payments.length
    };
  }

  // Core Data API exposed on window.OsmaniHospital
  window.OsmaniHospital = {
    // Doctors
    getDoctors() {
      initDoctors();
      return readStorage(KEYS.DOCTORS, DEFAULT_DOCTORS);
    },
    findDoctor(id) {
      return this.getDoctors().find(d => d.id === id) || null;
    },

    // Patients
    getPatients() {
      return readStorage(KEYS.PATIENTS, []);
    },
    findPatient(id) {
      return this.getPatients().find(p => p.id === id) || null;
    },
    savePatient(patient) {
      const list = this.getPatients();
      if (!patient.id) {
        const highest = list.reduce((max, p) => {
          const match = String(p.id || '').match(/^P-(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        patient.id = 'P-' + String(highest + 1).padStart(4, '0');
      }
      if (!patient.registeredDate) {
        patient.registeredDate = getTodayString();
      }
      list.push(patient);
      writeStorage(KEYS.PATIENTS, list);
      return patient;
    },

    // Visits
    getVisits() {
      return readStorage(KEYS.VISITS, []);
    },
    saveVisit(visit) {
      const list = this.getVisits();
      if (!visit.id) {
        const highest = list.reduce((max, v) => {
          const match = String(v.id || '').match(/^VIS-(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        visit.id = 'VIS-' + String(highest + 1).padStart(4, '0');
      }
      if (!visit.date) {
        visit.date = getTodayString();
      }
      list.push(visit);
      writeStorage(KEYS.VISITS, list);
      return visit;
    },

    // Lab Catalog & Tests
    getLabCatalog() {
      return LAB_CATALOG;
    },
    getLabTests() {
      return readStorage(KEYS.LAB_TESTS, []);
    },
    saveLabTest(test) {
      const list = this.getLabTests();
      if (!test.id) {
        const highest = list.reduce((max, t) => {
          const match = String(t.id || '').match(/^LAB-(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        test.id = 'LAB-' + String(highest + 1).padStart(4, '0');
      }
      if (!test.date) {
        test.date = getTodayString();
      }
      if (!test.status) {
        test.status = 'Pending';
      }
      list.push(test);
      writeStorage(KEYS.LAB_TESTS, list);
      return test;
    },
    updateLabTest(id, status, result) {
      const list = this.getLabTests();
      const item = list.find(t => t.id === id);
      if (item) {
        if (status) item.status = status;
        if (result !== undefined) item.result = result;
        writeStorage(KEYS.LAB_TESTS, list);
        return item;
      }
      return null;
    },

    // Payments
    getPayments() {
      return readStorage(KEYS.PAYMENTS, []);
    },
    savePayment(payment) {
      const list = this.getPayments();
      if (!payment.id) {
        const highest = list.reduce((max, p) => {
          const match = String(p.id || '').match(/^PAY-(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        payment.id = 'PAY-' + String(highest + 1).padStart(4, '0');
      }
      if (!payment.date) {
        payment.date = getTodayString();
      }
      list.push(payment);
      writeStorage(KEYS.PAYMENTS, list);
      return payment;
    },

    // Ledger calculation for an individual patient
    getPatientLedger(patientId) {
      const visits = this.getVisits().filter(v => v.patientId === patientId);
      const tests = this.getLabTests().filter(t => t.patientId === patientId);
      const payments = this.getPayments().filter(p => p.patientId === patientId);

      const totalVisits = visits.reduce((sum, v) => sum + (Number(v.fee) || 0), 0);
      const totalTests = tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
      const grandTotal = totalVisits + totalTests;
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalDue = Math.max(0, grandTotal - totalPaid);

      return {
        patientId,
        visits,
        tests,
        payments,
        totalVisits,
        totalTests,
        grandTotal,
        totalPaid,
        totalDue
      };
    },

    // High-level dashboard summary metrics
    getDashboardMetrics() {
      const today = getTodayString();
      const patients = this.getPatients();
      const visits = this.getVisits();
      const tests = this.getLabTests();
      const payments = this.getPayments();

      const todayVisits = visits.filter(v => v.date === today);
      const todayPayments = payments.filter(p => p.date === today);
      const todayTotal = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const pendingTests = tests.filter(t => t.status === 'Pending');

      return {
        totalPatients: patients.length,
        todayVisitsCount: todayVisits.length,
        todayCollection: todayTotal,
        pendingLabCount: pendingTests.length
      };
    },

    // Sample Data Management
    loadSampleData(force = false) {
      if (force || !localStorage.getItem(KEYS.INITIALIZED)) {
        return generateSampleData();
      }
      return null;
    },
    clearAllData() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
      initDoctors();
    },

    // Helpers
    formatTk,
    getTodayString,
    getDateDaysAgo
  };

  // Auto-initialize doctors list on load
  initDoctors();
})();