function generateClientCode(clientName, location) {
  const namePart = (clientName || '').trim().replace(/[^a-zA-Z ]/g, '')
    .split(' ')[0].substring(0, 2).toUpperCase();
  const locPart = (location || '').trim().replace(/[^a-zA-Z ]/g, '')
    .split(' ')[0].substring(0, 2).toUpperCase();
  return namePart + locPart;
}

module.exports = { generateClientCode };
