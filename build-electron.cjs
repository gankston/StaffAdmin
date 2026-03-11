const builder = require('electron-builder');

process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

builder.build({
    targets: builder.Platform.WINDOWS.createTarget('dir'),
    config: {
        appId: "com.staffadmin.app",
        directories: {
            output: 'dist-electron-bin'
        },
        win: {
            target: "dir",
            verifyUpdateCodeSignature: false,
            forceCodeSigning: false
        },
        asar: false,
        npmRebuild: false
    }
}).then(() => {
    console.log('Build OK!');
}).catch((error) => {
    console.error('Build Error:', error);
    process.exit(1);
});
