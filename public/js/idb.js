//variable creation
let db;

//connection to IndexedDB, version 1
const request = indexedDB.open('budget_tracker', 1);

//if DB changes, function will voke
request.onupgradeneeded = function(event) {
    
    //reference to DB
    const db = event.target.result;

    //create object store
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

//successful connection
request.onsuccess = function(event) {
    db = event.target.result;

    //check for online status
    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

//this should run when there is no internet connection 
function saveRecord(record) {
    //open a new transaction with DB with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object store for 'new_transaction'
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //add record to store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    //open transaction in DB
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //get all transactions from store and set to variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_transaction'], 'readwrite');

                const budgetObjectStore = transaction.objectStore('new_transaction');

                budgetObjectStore.clear();

                alert('All saved transactions have been submitted successfully!');
            })
            .catch(err => {
                console.log(err);
            })
        }   
    }
}

//listen for app returning to online status
window.addEventListener('online', uploadTransaction);