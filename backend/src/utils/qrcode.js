const QRCode = require('qrcode');

const generateQRCode = async (text, options = {}) => {
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    color: { dark: '#1e1b4b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
    ...options,
  });
};

module.exports = { generateQRCode };
