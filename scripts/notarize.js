const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const { notarize } = await import('@electron/notarize');
  
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`开始公证: ${appPath}`);

  await notarize({
    appBundleId: 'com.vibecoding.devdock',
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('公证完成');
};
