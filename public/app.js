async function sendSTK() {
    const amount = document.getElementById('amount').value;
    const reference = document.getElementById('reference').value;
    const numbers = document.getElementById('numbers').value;

    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = 'Sending requests...';

    try {
        const response = await fetch('/bulk-stk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                reference,
                numbers
            })
        });

        const data = await response.json();

        let html = '';

        data.results.forEach(result => {
            html += `
                <div class="result-item">
                    <strong>${result.phone}</strong><br>
                    Status: ${result.success ? 'SUCCESS' : 'FAILED'}
                </div>
            `;
        });

        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = error.message;
    }
}
