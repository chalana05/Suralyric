# Suralyric

A React application for synchronizing lyrics across band members in real-time. This application allows a master device to upload and broadcast lyrics files to all connected band members.

## Features

- **Role Selection**: Choose between Master Device or Band Member roles
- **File Upload**: Upload PDF or image files containing lyrics
- **Real-time Sync**: Broadcast lyrics to all connected devices
- **Activity Log**: Track all synchronization activities
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with glassmorphism effects

## Installation

1. **Clone or download the project**
   ```bash
   cd "D:\Learn\Company\PEOSONAL\server-based solution"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
server-based solution/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── BandLyricsSync.jsx
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Usage

### Master Device
1. Select "Master Device" role
2. Upload a lyrics file (PDF or image)
3. The file will be broadcast to all connected band members

### Band Member
1. Select "Band Member" role
2. Wait for the master device to upload lyrics
3. View the synchronized lyrics in real-time

## Technologies Used

- **React 18**: Frontend framework
- **Tailwind CSS**: Styling and responsive design
- **Lucide React**: Icon library
- **Create React App**: Development environment

## Development

To build the project for production:

```bash
npm run build
```

To run tests:

```bash
npm test
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is for educational and personal use.


