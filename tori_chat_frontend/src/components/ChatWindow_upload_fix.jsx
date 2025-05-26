  // Process the upload with actual API call to the PDF upload server
  const processUpload = async (files) => {
    try {
      // Create FormData and append files
      const formData = new FormData();
      files.forEach(file => {
        formData.append('pdf_file', file);
      });
      
      // Track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true); // FIXED: Added /api prefix
      
      // Setup progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadStatus(prev => ({
            ...prev,
            progress: percentComplete,
            statusText: 'Uploading to TORI advanced memory...'
          }));
        }
      };
      
      // Handle completion
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            setUploadStatus(prev => ({
              ...prev,
              progress: 100,
              statusText: 'Processing with Soliton Memory Architecture...'
            }));
            
            // Processing with advanced memory architecture
            setTimeout(() => {
              completeUpload(files, response.concepts || []);
            }, 1500);
          } catch (err) {
            console.error('Error parsing response:', err);
            handleUploadError('Could not process server response');
          }
        } else {
          handleUploadError(`Server error: ${xhr.status}`);
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        handleUploadError('Network error occurred');
      };
      
      // Send the request
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      handleUploadError('Could not upload files');
    }
  };