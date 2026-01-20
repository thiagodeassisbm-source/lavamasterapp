
const fs = require('fs');
const buffer = fs.readFileSync('final_serveo.log');
console.log(buffer.toString('latin1'));
