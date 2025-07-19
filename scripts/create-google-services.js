#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the base64 encoded google-services.json from environment variable
const googleServicesBase64 = process.env.GOOGLE_SERVICES_JSON;

const outputPath = path.join(__dirname, '..', 'google-services.json');

if (!googleServicesBase64) {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not found.');
  console.log('   Creating dummy google-services.json for build compatibility...');
  
  // Create a dummy file from the example
  const examplePath = path.join(__dirname, '..', 'google-services.json.example');
  if (fs.existsSync(examplePath)) {
    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    fs.writeFileSync(outputPath, exampleContent);
    console.log('✅ Dummy google-services.json created successfully');
  } else {
    // Create a minimal dummy file
    const dummyContent = {
      "project_info": {
        "project_number": "123456789",
        "project_id": "dummy-project",
        "storage_bucket": "dummy-project.appspot.com"
      },
      "client": [
        {
          "client_info": {
            "mobilesdk_app_id": "1:123456789:android:abcdef123456",
            "android_client_info": {
              "package_name": "com.jagancj.tycoonre"
            }
          },
          "oauth_client": [
            {
              "client_id": "123456789-dummy.apps.googleusercontent.com",
              "client_type": 3
            }
          ],
          "api_key": [
            {
              "current_key": "dummy-api-key"
            }
          ],
          "services": {
            "appinvite_service": {
              "other_platform_oauth_client": []
            }
          }
        }
      ],
      "configuration_version": "1"
    };
    fs.writeFileSync(outputPath, JSON.stringify(dummyContent, null, 2));
    console.log('✅ Minimal dummy google-services.json created successfully');
  }
  process.exit(0);
}

try {
  // Decode the base64 string
  const googleServicesJson = Buffer.from(googleServicesBase64, 'base64').toString('utf8');
  
  // Validate it's valid JSON
  JSON.parse(googleServicesJson);
  
  // Write the file
  fs.writeFileSync(outputPath, googleServicesJson);
  
  console.log('✅ google-services.json created successfully from environment variable');
} catch (error) {
  console.error('❌ Error creating google-services.json:', error.message);
  console.log('   Make sure GOOGLE_SERVICES_JSON contains valid base64 encoded JSON');
  process.exit(1);
}
