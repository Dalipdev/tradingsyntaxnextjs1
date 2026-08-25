#!/usr/bin/env node

/**
 * SEO Endpoints Validator
 * Test all SEO features on your running Next.js server
 * Run: node validate-seo.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { path: '/robots.txt', name: 'Robots.txt', type: 'text' },
  { path: '/sitemap.xml', name: 'Main Sitemap', type: 'xml' },
  { path: '/api/sitemap/blogs', name: 'Blog Sitemap API', type: 'xml' },
  { path: '/api/sitemap/users', name: 'User Sitemap API', type: 'xml' },
  { path: '/rss.xml', name: 'RSS Feed', type: 'xml' },
  { path: '/api/analytics', name: 'Analytics Endpoint', type: 'json' },
  { path: '/api/metadata', name: 'Metadata Endpoint', type: 'json' },
  { path: '/api/search/suggestions?q=trading', name: 'Search Suggestions', type: 'json' },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint.path);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const status = res.statusCode;
        const contentType = res.headers['content-type'];
        const size = data.length;
        
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          status,
          contentType,
          size,
          success: status === 200,
          preview: data.substring(0, 100)
        });
      });
    }).on('error', (err) => {
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        status: 'ERROR',
        error: err.message,
        success: false
      });
    });
  });
}

async function validateAllEndpoints() {
  console.log('\n🔍 SEO Endpoints Validation\n');
  console.log(`Testing: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('Results:\n');
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.success) {
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Size: ${result.size} bytes`);
      if (result.preview) {
        console.log(`   Preview: ${result.preview.substring(0, 80)}...`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
    
    if (index < results.length - 1) console.log();
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Results: ${passed}/${total} endpoints working ✓`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  if (passed === total) {
    console.log('🎉 All SEO endpoints are working perfectly!\n');
  }
}

validateAllEndpoints().catch(console.error);
