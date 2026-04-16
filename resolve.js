const fs = require('fs');
const processFileSync = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const resolved = [];
  let state = 'NORMAL';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<<<<<<< HEAD')) {
      state = 'OURS';
    } else if (line.startsWith('=======')) {
      state = 'THEIRS';
    } else if (line.startsWith('>>>>>>> ')) {
      state = 'NORMAL';
    } else {
      if (state === 'NORMAL' || state === 'OURS') {
        resolved.push(line);
      }
    }
  }
  fs.writeFileSync(file, resolved.join('\n'));
  console.log('Resolved', file);
};
processFileSync('frontend/src/App.jsx');
processFileSync('frontend/src/components/Photos.jsx');
