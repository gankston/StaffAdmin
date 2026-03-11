import fs from 'fs';
import pngToIco from 'png-to-ico';

console.log('Starting conversion...');
pngToIco('C:/StaffAdmin/icon.png')
    .then(buf => {
        fs.writeFileSync('C:/StaffAdmin/icon.ico', buf);
        console.log('Successfully created icon.ico');
    })
    .catch(err => {
        console.error('Failed to convert icon:', err);
    });
