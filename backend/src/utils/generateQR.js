import QRCode from 'qrcode';

/**
 * Generates a QR code for a compact payload such as a patient ID.
 * @param {object|string} data - The data to encode in the QR code.
 * @returns {Promise<string>} - A DataURL (base64) of the QR code.
 */
export const generatePatientQR = async (data) => {
  try {
    const payload = typeof data === 'object' ? JSON.stringify(data) : data;
    const qrDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });
    return qrDataURL;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};
