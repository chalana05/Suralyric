import React, { useState, useEffect } from 'react';
import { Music, Users, FileText, Upload, Monitor, ArrowLeft, Maximize2, Minimize2, X, LogOut, User } from 'lucide-react';
import { io } from 'socket.io-client';
import { getServerUrl, getApiUrl } from '../utils/api';

export default function BandLyricsSync({ user, onLogout }) {
  const [role, setRole] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [connectedDevices, setConnectedDevices] = useState(1);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bandMembers, setBandMembers] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Check for stored role on component mount - but don't auto-set role
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Don't automatically set role - let user choose each time
        // Only set role if it's explicitly stored as a session role (not user role)
        const sessionRole = localStorage.getItem('sessionRole');
        if (sessionRole && sessionRole !== '') {
          setRole(sessionRole);
          const sessionId = localStorage.getItem('sessionId');
          if (sessionId) {
            setSessionId(sessionId);
          } else {
            const newSessionId = `BAND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            setSessionId(newSessionId);
            localStorage.setItem('sessionId', newSessionId);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = getServerUrl();
    console.log('Connecting to server:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      addMessage('🔗 Connected to server');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      addMessage(`❌ Disconnected from server: ${reason}`);
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      addMessage(`❌ Connection failed: ${error.message}`);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      addMessage(`❌ Socket error: ${error.message}`);
    });

    newSocket.on('deviceCountUpdate', (count) => {
      setConnectedDevices(count);
    });

    newSocket.on('fileSync', (fileData) => {
      if (fileData && fileData.fileName) {
        setCurrentFile(fileData);
        // Use storedFileName for the actual file access, but display original fileName
        setFilePreview(`${getServerUrl()}/uploads/${fileData.storedFileName}`);
        addMessage(`📄 "${fileData.fileName}" received from master`);
        setIsExtractingText(false);
      }
    });

    newSocket.on('fileUploaded', (data) => {
      addMessage(`📄 "${data.fileName}" uploaded by master`);
    });

    newSocket.on('userJoined', (data) => {
      const displayName = data.user?.displayName || data.user?.username || data.role;
      addMessage(`👤 ${displayName} joined the session`);
      // Update band members list
      setBandMembers(prev => [...prev, { 
        role: data.role, 
        user: data.user,
        joinedAt: new Date().toISOString() 
      }]);
    });

    newSocket.on('userLeft', (data) => {
      const displayName = data.user?.displayName || data.user?.username || data.role;
      addMessage(`👤 ${displayName} left the session`);
      setBandMembers(prev => prev.filter(member => 
        member.user?.id !== data.user?.id && member.role !== data.role
      ));
    });

    newSocket.on('fullscreenToggle', (data) => {
      setIsFullscreen(data.isFullscreen);
    });


    return () => {
      newSocket.close();
    };
  }, []);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { text: msg, time: new Date().toLocaleTimeString() }]);
  };

  const handleFileUpload = async (file) => {
    if (file && role === 'master' && socket) {
      setIsExtractingText(true);
      addMessage(`📄 Uploading "${file.name}" and extracting text...`);
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          addMessage(`📄 "${file.name}" uploaded and processed successfully`);
          
          // Manually trigger file display for master device
          if (result.file) {
            setCurrentFile(result.file);
            setFilePreview(`${getServerUrl()}/uploads/${result.file.storedFileName}`);
          }
        } else {
          const errorData = await response.json();
          addMessage(`❌ Failed to upload file: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        addMessage(`❌ Upload failed: ${error.message}`);
      } finally {
        setIsExtractingText(false);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (role === 'master') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (role === 'master') {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        // Check if file type is supported
        const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (supportedTypes.includes(file.type)) {
          handleFileUpload(file);
        } else {
          addMessage(`❌ Unsupported file type. Please upload PDF, JPG, or PNG files.`);
        }
      }
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    const newSessionId = `BAND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setSessionId(newSessionId);
    
    // Store session role separately from user data
    localStorage.setItem('sessionRole', selectedRole);
    localStorage.setItem('sessionId', newSessionId);
    
    // Don't update user's role in localStorage - keep user data separate from session role
    const userData = { ...user };
    
    if (socket) {
      socket.emit('joinSession', { 
        role: selectedRole, 
        sessionId: newSessionId,
        user: userData
      });
    }
    
    addMessage(`✅ Connected as ${selectedRole}`);
    if (selectedRole === 'viewer') {
      setTimeout(() => {
        addMessage('🎵 Waiting for lyrics from master device...');
      }, 500);
    }
  };

  const handleBackToRoleSelection = () => {
    // Reset role and session
    setRole('');
    setSessionId('');
    setCurrentFile(null);
    setFilePreview('');
    setMessages([]);
    setIsFullscreen(false);
    setBandMembers([]);
    
    // Clear session role from localStorage (not user data)
    localStorage.removeItem('sessionRole');
    localStorage.removeItem('sessionId');
    
    // Leave the current session
    if (socket) {
      socket.emit('leaveSession');
    }
    
    addMessage('🔄 Returned to role selection');
  };

  const handleClearSession = () => {
    // Reset everything
    setRole('');
    setSessionId('');
    setCurrentFile(null);
    setFilePreview('');
    setMessages([]);
    setIsFullscreen(false);
    setBandMembers([]);
    setConnectedDevices(1);
    
    // Clear session role from localStorage (not user data)
    localStorage.removeItem('sessionRole');
    localStorage.removeItem('sessionId');
    
    // Leave the current session
    if (socket) {
      socket.emit('leaveSession');
    }
    
    addMessage('🔄 Session cleared - please select your role');
  };

  const handleLogout = () => {
    // Leave the current session
    if (socket) {
      socket.emit('leaveSession');
    }
    
    // Clear session data from localStorage
    localStorage.removeItem('sessionRole');
    localStorage.removeItem('sessionId');
    
    // Call the logout function from parent
    onLogout();
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    if (socket) {
      socket.emit('fullscreenToggle', { isFullscreen: newFullscreenState });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-2 sm:p-4">
      {/* Fullscreen Overlay */}
      {isFullscreen && currentFile && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            {/* Exit fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-400 text-white p-3 rounded-full z-10"
              title="Exit Fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
            
            
            {/* Fullscreen media content */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              {currentFile.mimeType && currentFile.mimeType.startsWith('image/') ? (
                <img
                  src={filePreview}
                  alt="Lyrics"
                  className="max-w-full max-h-full object-contain"
                />
              ) : currentFile.mimeType === 'application/pdf' ? (
                <iframe
                  src={`${getServerUrl()}/uploads/${currentFile.storedFileName}`}
                  className="w-full h-full"
                  title="PDF Viewer"
                />
              ) : (
                <div className="text-white text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">{currentFile.fileName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Hidden file input for master device - always available */}
      {role === 'master' && (
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
        />
      )}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">
          <div className="flex flex-col gap-4">
            {/* Top row: Back button, title, and status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {role && (
                  <button
                    onClick={handleBackToRoleSelection}
                    className="flex items-center justify-center bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-3 py-3 sm:px-3 sm:py-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 min-h-[44px] sm:min-h-0"
                    title="Back to role selection"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                )}
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Suralyric</h1>
              </div>
              
              {/* User info and logout button */}
              <div className="flex items-center gap-3">
                {/* Connection status */}
                {sessionId && (
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                    isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Session info row - moved to right side */}
            {sessionId && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-end">
                <div className="flex items-center gap-2 bg-white/20 px-3 sm:px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" />
                  <span className="text-white font-semibold text-sm sm:text-base">{connectedDevices} Devices</span>
                </div>
                <div className="bg-white/20 px-3 sm:px-4 py-2 rounded-lg">
                  <span className="text-purple-200 text-xs sm:text-sm">Session: </span>
                  <span className="text-white font-mono font-bold text-xs sm:text-sm">{sessionId}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!role ? (
          /* Role Selection */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Welcome, Sura!</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300 hover:text-red-200 px-3 py-2 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
            <p className="text-purple-200 text-center mb-6 sm:mb-8">Select your role to join the session:</p>
            <div className="text-center mb-4">
              <button
                onClick={handleClearSession}
                className="text-purple-300 hover:text-purple-200 text-sm underline"
                title="Clear current session and start fresh"
              >
                Clear Session & Start Fresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <button
                onClick={() => handleRoleSelect('master')}
                className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:from-green-600 active:to-emerald-700 p-6 sm:p-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl min-h-[200px] sm:min-h-0"
              >
                <Monitor className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Master Device</h3>
                <p className="text-green-100 text-sm sm:text-base">Control and broadcast lyrics to all band members</p>
              </button>
              
              <button
                onClick={() => handleRoleSelect('viewer')}
                className="group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 active:from-blue-600 active:to-indigo-700 p-6 sm:p-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl min-h-[200px] sm:min-h-0"
              >
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Band Member</h3>
                <p className="text-blue-100 text-sm sm:text-base">Receive and view lyrics synced from master</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Display Area */}
            <div className="lg:col-span-2">
              <div 
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 min-h-80 sm:min-h-96 transition-all duration-300 ${
                  isDragOver && role === 'master' 
                    ? 'bg-purple-500/20 border-2 border-dashed border-purple-400' 
                    : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {role === 'master' && !currentFile && (
                  <div 
                    className={`flex flex-col items-center justify-center h-full py-8 sm:py-12 transition-all duration-300 ${
                      isDragOver 
                        ? 'bg-purple-500/20 border-2 border-dashed border-purple-400 rounded-xl' 
                        : 'bg-transparent'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {isDragOver ? (
                      <>
                        <Upload className="w-20 h-20 sm:w-24 sm:h-24 text-purple-300 mb-4 sm:mb-6 animate-bounce" />
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Drop your file here!</h3>
                        <p className="text-purple-200 mb-4 sm:mb-6 text-center text-sm sm:text-base px-4">Release to upload your lyrics</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 sm:w-20 sm:h-20 text-purple-300 mb-4 sm:mb-6" />
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Upload Lyrics</h3>
                        <p className="text-purple-200 mb-4 sm:mb-6 text-center text-sm sm:text-base px-4">
                          Drag & drop your PDF or image here, or click to browse
                        </p>
                        <label 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 active:from-purple-600 active:to-pink-600 text-white font-bold py-4 px-8 sm:py-4 sm:px-8 rounded-xl cursor-pointer transition-all transform hover:scale-105 active:scale-95 shadow-lg text-base sm:text-base min-h-[48px] flex items-center justify-center"
                          onClick={() => document.getElementById('fileInput').click()}
                        >
                          Choose File
                        </label>
                        <p className="text-purple-300 text-xs mt-3 text-center">
                          Supported formats: PDF, JPG, PNG
                        </p>
                      </>
                    )}
                  </div>
                )}

                {role === 'viewer' && !currentFile && (
                  <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12">
                    <div className="animate-pulse">
                      <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-purple-300 mb-4 sm:mb-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Waiting for Lyrics...</h3>
                    <p className="text-purple-200 text-center text-sm sm:text-base px-4">The master device will broadcast the lyrics</p>
                  </div>
                )}

                 {currentFile && (
                   <div className="relative">
                     {isDragOver && role === 'master' && (
                       <div className="absolute inset-0 bg-purple-500/20 border-2 border-dashed border-purple-400 rounded-xl flex items-center justify-center z-10">
                         <div className="text-center">
                           <Upload className="w-16 h-16 text-purple-300 mx-auto mb-4 animate-bounce" />
                           <p className="text-white font-semibold text-lg">Drop to replace file</p>
                         </div>
                       </div>
                     )}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                       <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                         <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                         <span className="truncate">{currentFile.fileName || currentFile.name}</span>
                       </h3>
                       <div className="flex flex-wrap gap-2">
                         {/* Fullscreen toggle button */}
                         <button
                           onClick={toggleFullscreen}
                           className="bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all text-sm flex items-center gap-1"
                           title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                         >
                           {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                           {isFullscreen ? "Exit" : "Fullscreen"}
                         </button>
                         
                         
                         {role === 'master' && (
                           <button
                             onClick={() => document.getElementById('fileInput').click()}
                             className="bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-1"
                           >
                             <Upload className="w-4 h-4" />
                             Change File
                           </button>
                         )}
                       </div>
                     </div>
                     <div className="bg-white rounded-xl p-3 sm:p-4 h-80 sm:h-96 overflow-auto">
                       {isExtractingText ? (
                         <div className="flex items-center justify-center h-full">
                           <div className="text-center">
                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                             <p className="text-gray-600">Extracting text from file...</p>
                           </div>
                         </div>
                       ) : filePreview && currentFile.mimeType && currentFile.mimeType.startsWith('image/') ? (
                         <div className="flex items-center justify-center h-full overflow-hidden">
                           <img
                             src={filePreview}
                             alt="Lyrics"
                             className="max-w-full max-h-full object-contain"
                           />
                         </div>
                       ) : currentFile.mimeType === 'application/pdf' ? (
                         <div>
                           <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <div className="flex items-center gap-2 text-blue-700">
                               <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                               <span className="font-semibold text-sm sm:text-base">PDF Document: {currentFile.fileName}</span>
                             </div>
                           </div>
                           <div className="w-full h-80 sm:h-96 border rounded-lg overflow-hidden">
                             <iframe
                  src={`${getServerUrl()}/uploads/${currentFile.storedFileName}`}
                               className="w-full h-full"
                               title="PDF Viewer"
                             />
                           </div>
                           {currentFile.extractedText && currentFile.extractedText.trim() && (
                             <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-100 rounded-lg">
                               <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Extracted Text:</h4>
                               <div className="text-gray-800 whitespace-pre-wrap text-xs sm:text-sm" style={{ fontFamily: '"Noto Sans Sinhala", Arial, sans-serif' }}>
                                 {currentFile.extractedText}
                               </div>
                             </div>
                           )}
                         </div>
                       ) : currentFile.extractedText && currentFile.extractedText.trim() ? (
                         <div className="text-gray-800 whitespace-pre-wrap" style={{ fontFamily: '"Noto Sans Sinhala", Arial, sans-serif' }}>
                           {currentFile.extractedText}
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center p-4">
                           <FileText className="w-16 h-16 text-gray-400 mb-4" />
                           <h3 className="text-lg font-semibold text-gray-700 mb-2">{currentFile.fileName}</h3>
                           <p className="text-gray-500 text-sm">File uploaded successfully</p>
                           <p className="text-gray-400 text-xs mt-2">Text extraction in progress or failed</p>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Band Members & Activity Log */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Band Members Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Band Members ({connectedDevices})
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white/20 rounded-lg">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">
                        {user?.displayName} (You)
                      </div>
                      <div className="text-purple-300 text-xs">
                        {isConnected ? 'Connected' : 'Disconnected'} • {role}
                      </div>
                    </div>
                    <div className="text-green-400 text-xs font-mono">
                      {sessionId}
                    </div>
                  </div>
                  
                  {bandMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          {member.user?.displayName || member.user?.username || (member.role === 'master' ? 'Master Device' : 'Band Member')}
                        </div>
                        <div className="text-purple-300 text-xs">
                          Joined {new Date(member.joinedAt).toLocaleTimeString()} • {member.role}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {bandMembers.length === 0 && (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                      <p className="text-purple-300 text-sm">No other members yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  Activity Log
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="bg-white/20 rounded-lg p-2 sm:p-3">
                      <p className="text-white text-xs sm:text-sm">{msg.text}</p>
                      <p className="text-purple-300 text-xs mt-1">{msg.time}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-purple-300 text-center py-6 sm:py-8 text-sm">No activity yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">How It Works</h3>
                <ul className="space-y-2 sm:space-y-3 text-purple-200 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">1.</span>
                    <span>Master device uploads lyrics file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    <span>File is broadcast to all connected devices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    <span>All band members see the same content instantly</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

