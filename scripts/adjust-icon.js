const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ICON_SOURCE = path.join(__dirname, '../assets/icon.png');
const ICON_TEMP = path.join(__dirname, '../assets/icon-adjusted.png');
const ICONSET_DIR = path.join(__dirname, '../assets/icon.iconset');
const ICNS_OUTPUT = path.join(__dirname, '../assets/icon.icns');

function checkDependencies() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    execSync('which iconutil', { stdio: 'ignore' });
  } catch (e) {
    console.error('需要 macOS 系统工具：sips 和 iconutil');
    process.exit(1);
  }
}

function adjustIconSize() {
  if (!fs.existsSync(ICON_SOURCE)) {
    console.error(`图标文件不存在: ${ICON_SOURCE}`);
    process.exit(1);
  }

  console.log('调整图标大小，缩小到 80% 并添加边距...');
  
  try {
    const tempSmall = path.join(__dirname, '../assets/icon-temp-small.png');
    
    execSync(`sips -z 819 819 "${ICON_SOURCE}" --out "${tempSmall}"`, { stdio: 'ignore' });
    
    execSync(`sips --padToHeightWidth 1024 1024 "${tempSmall}" --out "${ICON_TEMP}"`, { stdio: 'ignore' });
    
    fs.unlinkSync(tempSmall);
    
    console.log('图标调整完成');
  } catch (error) {
    console.error('调整图标失败:', error.message);
    process.exit(1);
  }
}

function createIconset() {
  if (fs.existsSync(ICONSET_DIR)) {
    fs.rmSync(ICONSET_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ICONSET_DIR, { recursive: true });

  const sizes = [16, 32, 128, 256, 512, 1024];

  console.log('生成 iconset...');

  sizes.forEach(size => {
    const output1x = path.join(ICONSET_DIR, `icon_${size}x${size}.png`);
    execSync(`sips -z ${size} ${size} "${ICON_TEMP}" --out "${output1x}"`, { stdio: 'ignore' });
    
    const output2x = path.join(ICONSET_DIR, `icon_${size}x${size}@2x.png`);
    const size2x = size * 2;
    execSync(`sips -z ${size2x} ${size2x} "${ICON_TEMP}" --out "${output2x}"`, { stdio: 'ignore' });
  });

  console.log('iconset 生成完成');
}

function generateIcns() {
  console.log('生成 .icns 文件...');
  
  try {
    if (fs.existsSync(ICNS_OUTPUT)) {
      fs.unlinkSync(ICNS_OUTPUT);
    }
    
    execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${ICNS_OUTPUT}"`, { stdio: 'inherit' });
    
    fs.rmSync(ICONSET_DIR, { recursive: true, force: true });
    fs.unlinkSync(ICON_TEMP);
    
    console.log('✅ 图标处理完成，已生成带边距的 icon.icns');
  } catch (error) {
    console.error('生成 .icns 失败:', error.message);
    process.exit(1);
  }
}

function main() {
  checkDependencies();
  adjustIconSize();
  createIconset();
  generateIcns();
}

if (require.main === module) {
  main();
}

module.exports = { main };
