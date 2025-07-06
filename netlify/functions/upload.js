const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { file, sessionId } = JSON.parse(event.body);

    if (!file || !sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing file or sessionId' })
      };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing Supabase configuration' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload file to OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing OpenAI API key' })
      };
    }

    // Create FormData for OpenAI upload
    const formData = new FormData();
    formData.append('purpose', 'assistants');
    formData.append('file', file.data, file.name);

    const openaiResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: formData
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('PDF uploaded to OpenAI:', openaiResult);

    // Extract content from the file (simplified - you might want to use OpenAI's assistants API for better extraction)
    const extractedContent = `Content extracted from ${file.name}. File ID: ${openaiResult.id}`;

    // Save file info to Supabase
    const { data: savedFile, error: dbError } = await supabase
      .from('files')
      .insert([{
        name: file.name,
        type: file.type,
        content: extractedContent,
        session_id: sessionId,
        uploadedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save file to database' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        file: savedFile,
        openaiFileId: openaiResult.id,
        extractedContent: extractedContent
      })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Upload failed', 
        details: error.message 
      })
    };
  }
}; 