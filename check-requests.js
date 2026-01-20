
const http = require('http');

http.get('http://localhost:4040/api/requests/http', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Total Requests: " + json.requests.length);
            json.requests.slice(0, 5).forEach(req => {
                console.log(`[${req.response.status_code}] ${req.request.method} ${req.request.uri}`);
            });
        } catch (e) {
            console.log("Erro ao ler requests: " + e.message);
        }
    });
});
